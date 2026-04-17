import { useEffect, useMemo, useRef, useState } from "react";
// useRef kept for lastPedCount
import { Logo } from "../components/Shell";
import { calcExtraGrupo, fmt, newId, useStore, type CarrinhoItem, type Pedido, type Produto } from "../store";
import { updatePedidoRemoto } from "../firebase";

type Aba = "delivery" | "mesas" | "balcao";

export default function PDV() {
  const { produtos, categorias, pedidos, setPedidos, vendas, setVendas, cancelados, setCancelados, mesas, setMesas, proximoNumero, config } = useStore();
  const [aba, setAba] = useState<Aba>("delivery");
  const [busca, setBusca] = useState("");
  const [catSel, setCatSel] = useState("todas");
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [pedidoSel, setPedidoSel] = useState<string | null>(null);
  const [mesaSel, setMesaSel] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Produto | null>(null);
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [valorRecebido, setValorRecebido] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [obs, setObs] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [showItemLivre, setShowItemLivre] = useState(false);
  const [novaMesa, setNovaMesa] = useState("");
  const [now, setNow] = useState(Date.now());
  const lastPedCount = useRef(pedidos.length);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Som ao chegar novo pedido
  useEffect(() => {
    if (pedidos.length > lastPedCount.current) {
      try {
        const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.1;
        o.start(); setTimeout(() => { o.frequency.value = 1320; }, 150);
        setTimeout(() => { o.stop(); ctx.close(); }, 300);
      } catch {}
    }
    lastPedCount.current = pedidos.length;
  }, [pedidos.length]);

  // Atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); setAba("delivery"); }
      if (e.key === "F3") { e.preventDefault(); setAba("mesas"); }
      if (e.key === "F4") { e.preventDefault(); setAba("balcao"); }
      if (e.key === "F8") { e.preventDefault(); finalizar(); }
      if (e.key === "Escape") { setAberto(null); setConfirmar(false); setShowItemLivre(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [carrinho, pagamento, valorRecebido]);

  const produtosFiltrados = produtos.filter(p => !p.pausado)
    .filter(p => catSel === "todas" || p.categoriaId === catSel)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const pedidoAtivo = pedidos.find(p => p.id === pedidoSel) || null;
  const mesaAtiva = mesas.find(m => m.id === mesaSel) || null;

  // No PDV o "carrinho" muda conforme aba
  const carrinhoAtual: CarrinhoItem[] = useMemo(() => {
    if (aba === "delivery") return pedidoAtivo?.itens || [];
    if (aba === "mesas") return mesaAtiva?.itens || [];
    return carrinho;
  }, [aba, pedidoAtivo, mesaAtiva, carrinho]);

  function addProduto(p: Produto) {
    if (p.tipo !== "simples") { setAberto(p); return; }
    const item: CarrinhoItem = { uid: newId(), produtoId: p.id, nome: p.nome, qtd: 1, precoBase: p.precoPromo ?? p.preco, precoExtras: 0, imagem: p.imagens[0] };
    addItem(item);
  }

  function addItem(item: CarrinhoItem) {
    if (aba === "balcao") setCarrinho(c => [...c, item]);
    else if (aba === "mesas" && mesaAtiva) setMesas(mesas.map(m => m.id === mesaAtiva.id ? { ...m, itens: [...m.itens, item] } : m));
    else if (aba === "delivery" && pedidoAtivo) setPedidos(pedidos.map(p => p.id === pedidoAtivo.id ? { ...p, itens: [...p.itens, item] } : p));
  }

  function removeItem(uid: string) {
    if (aba === "balcao") setCarrinho(c => c.filter(i => i.uid !== uid));
    else if (aba === "mesas" && mesaAtiva) setMesas(mesas.map(m => m.id === mesaAtiva.id ? { ...m, itens: m.itens.filter(i => i.uid !== uid) } : m));
    else if (aba === "delivery" && pedidoAtivo) setPedidos(pedidos.map(p => p.id === pedidoAtivo.id ? { ...p, itens: p.itens.filter(i => i.uid !== uid) } : p));
  }

  const subtotal = carrinhoAtual.reduce((s, i) => s + (i.precoBase + i.precoExtras) * i.qtd, 0);
  const total = Math.max(0, subtotal - desconto);
  const troco = pagamento === "Dinheiro" && +valorRecebido > total ? +valorRecebido - total : 0;

  const STATUS_SEQ: Pedido["status"][] = ["novo", "producao", "pronto", "saiu", "entregue", "pago"];
  const STATUS_INFO: Record<string, { label: string; icon: string }> = {
    novo:     { label: "Novo",      icon: "🔵" },
    producao: { label: "Produção",  icon: "🟡" },
    pronto:   { label: "Pronto",    icon: "🟢" },
    saiu:     { label: "Saiu",      icon: "🛵" },
    entregue: { label: "Entregue",  icon: "✅" },
    pago:     { label: "Pago",      icon: "💰" },
  };

  function pushHistorico(p: Pedido, status: Pedido["status"]) {
    return [...(p.historicoStatus || []), { status, em: Date.now() }];
  }

  function mudarStatus(p: Pedido, novo: Pedido["status"]) {
    if (p.status === novo) return;
    const atualizado = { ...p, status: novo, historicoStatus: pushHistorico(p, novo) };
    setPedidos(pedidos.map(x => x.id === p.id ? atualizado : x));
    updatePedidoRemoto(atualizado.id, { status: novo, historicoStatus: atualizado.historicoStatus });
  }

  function cancelarPedido(p: Pedido) {
    if (!confirm("Cancelar pedido #" + p.numero + "?")) return;
    const cancelado = { ...p, status: "cancelado" as const, historicoStatus: pushHistorico(p, "cancelado") };
    setCancelados([cancelado, ...cancelados]);
    setPedidos(pedidos.filter(x => x.id !== p.id));
    updatePedidoRemoto(cancelado.id, { status: "cancelado", historicoStatus: cancelado.historicoStatus });
    setPedidoSel(null);
  }

  function finalizar() {
    if (carrinhoAtual.length === 0) return alert("Carrinho vazio");
    setConfirmar(true);
  }

  function confirmarFinalizar(imprimir: boolean) {
    const numero = proximoNumero();
    const venda: Pedido = {
      id: newId(), numero,
      cliente: aba === "delivery" ? pedidoAtivo!.cliente : { nome: aba === "mesas" ? "Mesa " + (mesaAtiva?.nome || "") : "Balcão", tel: "" },
      itens: carrinhoAtual,
      subtotal, desconto, taxa: aba === "delivery" ? (pedidoAtivo?.taxa || 0) : 0,
      total: total + (aba === "delivery" ? (pedidoAtivo?.taxa || 0) : 0),
      pagamento, troco, obs, status: "finalizado",
      criadoEm: aba === "delivery" ? (pedidoAtivo?.criadoEm || Date.now()) : Date.now(),
      origem: aba === "delivery" ? "site" : aba === "mesas" ? "mesa" : "balcao",
      mesa: aba === "mesas" ? mesaAtiva?.nome : undefined,
    };
    setVendas([venda, ...vendas]);
    if (aba === "delivery" && pedidoAtivo) { setPedidos(pedidos.filter(p => p.id !== pedidoAtivo.id)); setPedidoSel(null); }
    if (aba === "mesas" && mesaAtiva) { setMesas(mesas.filter(m => m.id !== mesaAtiva.id)); setMesaSel(null); }
    if (aba === "balcao") setCarrinho([]);
    setDesconto(0); setObs(""); setValorRecebido(""); setConfirmar(false);
    if (imprimir) imprimirCupom(venda);
  }

  function imprimirCupom(v: Pedido) {
    const w = window.open("", "_blank", "width=380,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>Cupom #${v.numero}</title>
      <style>body{font-family:monospace;padding:12px;width:280px}h2{text-align:center;margin:4px 0}hr{border:none;border-top:1px dashed #000}.r{display:flex;justify-content:space-between}.b{font-weight:bold}</style>
      </head><body>
      <h2>${config.loja.nome}</h2>
      <div style="text-align:center;font-size:11px">${config.loja.tel}<br>${config.loja.endereco}</div>
      <hr><div class="b">CUPOM NÃO FISCAL</div>
      <div>Pedido: #${v.numero}</div>
      <div>Data: ${new Date(v.criadoEm).toLocaleString("pt-BR")}</div>
      <div>Cliente: ${v.cliente.nome}</div>
      <hr>
      ${v.itens.map(i => `<div class="r"><span>${i.qtd}x ${i.nome}</span><span>${fmt((i.precoBase + i.precoExtras) * i.qtd)}</span></div>${(i.selecoes || []).map(s => `<div style="font-size:10px;padding-left:6px">${s.grupo}: ${s.itens.map(x => `${x.qtd}x ${x.nome}`).join(", ")}</div>`).join("")}`).join("")}
      <hr>
      <div class="r"><span>Subtotal</span><span>${fmt(v.subtotal)}</span></div>
      ${v.desconto ? `<div class="r"><span>Desconto</span><span>- ${fmt(v.desconto)}</span></div>` : ""}
      ${v.taxa ? `<div class="r"><span>Taxa</span><span>${fmt(v.taxa)}</span></div>` : ""}
      <div class="r b" style="font-size:14px"><span>TOTAL</span><span>${fmt(v.total)}</span></div>
      <div>Pagamento: ${v.pagamento}</div>
      ${v.troco ? `<div>Troco: ${fmt(v.troco)}</div>` : ""}
      <hr><div style="text-align:center;font-size:10px">Obrigado pela preferência!</div>
      <script>window.print();setTimeout(()=>window.close(),500)</script>
      </body></html>`);
  }

  function tempoCor(ms: number) {
    const min = ms / 60000;
    if (min < 15) return "text-green-300";
    if (min < 30) return "text-yellow-300";
    return "text-red-400 font-bold";
  }

  const ativosDelivery = pedidos.filter(p => p.origem === "site");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="bg-orbs" />
      {/* TOP BAR */}
      <header className="glass-strong m-2 px-3 py-2 flex items-center justify-between flex-shrink-0">
        <Logo size={36} />
        <div className="flex gap-1">
          {[["delivery","🛵 Delivery (F2)", ativosDelivery.length], ["mesas","🍽️ Mesas (F3)", mesas.length], ["balcao","🏪 Balcão (F4)", 0]].map(([k, l, n]: any) => (
            <button key={k} onClick={() => setAba(k)}
              className={"px-4 py-2 rounded-lg font-bold text-sm relative " + (aba === k ? "btn-neon" : "btn-ghost")}>
              {l} {n > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full dot-live">{n}</span>}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/60 font-mono">{new Date(now).toLocaleString("pt-BR")}</div>
      </header>

      {/* MAIN 3 COLS */}
      <div className="flex-1 flex gap-2 mx-2 mb-2 overflow-hidden relative z-10">
        {/* COL 1: Lista de pedidos/mesas */}
        <aside className="w-72 glass-strong p-3 overflow-auto flex-shrink-0">
          {aba === "delivery" && (
            <>
              <h3 className="font-bold mb-2 neon-text-orange">🛵 Pedidos Ativos</h3>
              <div className="space-y-2">
                {ativosDelivery.map(p => (
                  <button key={p.id} onClick={() => setPedidoSel(p.id)}
                    className={"w-full text-left card p-2 transition " + (pedidoSel === p.id ? "border-[#ff6b35]" : "")}>
                    <div className="flex justify-between items-start">
                      <b>#{p.numero}</b>
                      <span className={"pill " + statusColor(p.status)}>{p.status}</span>
                    </div>
                    <div className="text-xs">{p.cliente.nome}</div>
                    <div className={"text-xs font-mono " + tempoCor(now - p.criadoEm)}>⏱️ {hms(now - p.criadoEm)}</div>
                    <div className="text-sm font-bold text-[#ff6b35]">{fmt(p.total)}</div>
                  </button>
                ))}
                {ativosDelivery.length === 0 && <div className="text-white/40 text-sm text-center py-6">Nenhum pedido</div>}
              </div>
            </>
          )}
          {aba === "mesas" && (
            <>
              <h3 className="font-bold mb-2 neon-text-orange">🍽️ Mesas</h3>
              <div className="flex gap-1 mb-2">
                <input className="input !text-xs" placeholder="Nome/Nº" value={novaMesa} onChange={e => setNovaMesa(e.target.value)} />
                <button className="btn-neon !text-xs" onClick={() => { if (!novaMesa) return; setMesas([...mesas, { id: newId(), nome: novaMesa, itens: [], abertaEm: Date.now() }]); setNovaMesa(""); }}>+</button>
              </div>
              <div className="space-y-2">
                {mesas.map(m => (
                  <button key={m.id} onClick={() => setMesaSel(m.id)}
                    className={"w-full text-left card p-2 " + (mesaSel === m.id ? "border-[#ff6b35]" : "")}>
                    <b>🍽️ {m.nome}</b>
                    <div className="text-xs">{m.itens.length} itens</div>
                    <div className={"text-xs font-mono " + tempoCor(now - m.abertaEm)}>⏱️ {hms(now - m.abertaEm)}</div>
                    <div className="text-sm font-bold text-[#ff6b35]">{fmt(m.itens.reduce((s, i) => s + (i.precoBase + i.precoExtras) * i.qtd, 0))}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {aba === "balcao" && (
            <>
              <h3 className="font-bold mb-2 neon-text-orange">🏪 Venda Balcão</h3>
              <div className="text-sm text-white/60">Selecione produtos para venda direta no balcão.</div>
              <button className="btn-cyan w-full mt-2" onClick={() => setShowItemLivre(true)}>+ Item Livre</button>
            </>
          )}
        </aside>

        {/* COL 2: Produtos */}
        <section className="flex-1 glass-strong p-3 overflow-hidden flex flex-col">
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="🔎 Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
            <select className="input max-w-xs" value={catSel} onChange={e => setCatSel(e.target.value)}>
              <option value="todas">Todas categorias</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {produtosFiltrados.map(p => (
              <button key={p.id} onClick={() => addProduto(p)} className="card p-2 text-left hover:border-[#ff6b35] transition">
                <img src={p.imagens[0] || "https://placehold.co/200x150/1a1a1a/ff6b35?text=MH"} className="w-full h-20 object-cover rounded mb-1" />
                <div className="text-xs font-bold line-clamp-2">{p.nome}</div>
                <div className="text-sm text-[#ff6b35] font-extrabold">{fmt(p.precoPromo ?? p.preco)}</div>
                {p.tipo !== "simples" && <div className="text-[9px] text-cyan-300">⚙️ Personalizar</div>}
              </button>
            ))}
            {(aba === "delivery" && !pedidoAtivo) && <div className="col-span-full text-center text-white/40 py-10">Selecione um pedido à esquerda</div>}
            {(aba === "mesas" && !mesaAtiva) && <div className="col-span-full text-center text-white/40 py-10">Selecione/crie uma mesa</div>}
          </div>
        </section>

        {/* COL 3: Carrinho + Pagamento */}
        <aside className="w-[400px] flex flex-col gap-2 flex-shrink-0">
          <div className="glass-strong p-3 flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold neon-text-orange">🛒 Comanda</h3>
              {(aba === "delivery" && pedidoAtivo) && (
                <button className="btn-ghost !text-xs text-red-400" onClick={() => cancelarPedido(pedidoAtivo)}>✕ Cancelar</button>
              )}
            </div>
            {(aba === "delivery" && pedidoAtivo) && (
              <>
                <div className="text-xs text-white/70 mb-2 p-2 bg-white/5 rounded">
                  <b>#{pedidoAtivo.numero}</b> · {pedidoAtivo.cliente.nome} · {pedidoAtivo.cliente.tel}
                  {pedidoAtivo.cliente.endereco && <div>📍 {pedidoAtivo.cliente.endereco}</div>}
                </div>

                {/* TIMELINE DE STATUS — clicável para avançar OU voltar */}
                <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Status do Pedido</span>
                    <span className="text-[10px] text-white/40">clique para alterar</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {STATUS_SEQ.map((s, idx) => {
                      const curIdx = STATUS_SEQ.indexOf(pedidoAtivo.status);
                      const isAtual = pedidoAtivo.status === s;
                      const isPassado = idx < curIdx;
                      const info = STATUS_INFO[s];
                      return (
                        <button
                          key={s}
                          onClick={() => mudarStatus(pedidoAtivo, s)}
                          title={info.label}
                          className={
                            "flex flex-col items-center gap-0.5 py-1.5 px-1 rounded text-[9px] font-bold transition border " +
                            (isAtual
                              ? "bg-[#ff6b35] text-black border-[#ff6b35] scale-105 shadow-lg shadow-[#ff6b35]/40"
                              : isPassado
                                ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
                                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white")
                          }
                        >
                          <span className="text-base leading-none">{info.icon}</span>
                          <span className="leading-none">{info.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Atalhos avançar/voltar */}
                  <div className="flex gap-1 mt-2">
                    <button
                      className="btn-ghost !text-[10px] flex-1 !py-1"
                      disabled={STATUS_SEQ.indexOf(pedidoAtivo.status) === 0}
                      onClick={() => {
                        const i = STATUS_SEQ.indexOf(pedidoAtivo.status);
                        if (i > 0) mudarStatus(pedidoAtivo, STATUS_SEQ[i - 1]);
                      }}
                    >◀ Voltar</button>
                    <button
                      className="btn-cyan !text-[10px] flex-1 !py-1"
                      disabled={STATUS_SEQ.indexOf(pedidoAtivo.status) === STATUS_SEQ.length - 1}
                      onClick={() => {
                        const i = STATUS_SEQ.indexOf(pedidoAtivo.status);
                        if (i < STATUS_SEQ.length - 1) mudarStatus(pedidoAtivo, STATUS_SEQ[i + 1]);
                      }}
                    >Avançar ▶</button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              {carrinhoAtual.map(it => (
                <div key={it.uid} className="bg-white/5 rounded p-2 text-sm flex gap-2">
                  <div className="flex-1">
                    <div className="font-semibold">{it.qtd}x {it.nome}</div>
                    {it.selecoes?.map((g, gi) => (
                      <div key={gi} className="text-[10px] text-white/60">{g.grupo}: {g.itens.map(i => `${i.qtd}x ${i.nome}`).join(", ")}</div>
                    ))}
                    <div className="text-[#ff6b35] font-bold text-xs">{fmt((it.precoBase + it.precoExtras) * it.qtd)}</div>
                  </div>
                  <button className="text-red-400 text-xs" onClick={() => removeItem(it.uid)}>🗑️</button>
                </div>
              ))}
              {carrinhoAtual.length === 0 && <div className="text-white/40 text-center py-6 text-sm">Sem itens</div>}
            </div>
          </div>

          {/* Pagamento fixo */}
          <div className="glass-strong p-3 flex-shrink-0">
            <div className="flex justify-between text-lg mb-2">
              <span>Subtotal</span><b>{fmt(subtotal)}</b>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="number" className="input" placeholder="Desconto R$" value={desconto || ""} onChange={e => setDesconto(+e.target.value || 0)} />
              <select className="input" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                <option>Dinheiro</option><option>PIX</option><option>Crédito</option><option>Débito</option>
              </select>
            </div>
            {pagamento === "Dinheiro" && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="number" className="input" placeholder="Recebido" value={valorRecebido} onChange={e => setValorRecebido(e.target.value)} />
                <div className="input flex items-center justify-between"><span className="text-white/50 text-xs">Troco:</span><b className="text-green-300">{fmt(troco)}</b></div>
              </div>
            )}
            <input className="input mb-2" placeholder="Observações" value={obs} onChange={e => setObs(e.target.value)} />
            <div className="text-2xl font-extrabold text-center mb-2 neon-text-orange">{fmt(total)}</div>
            <button className="btn-neon w-full text-lg" onClick={finalizar}>💰 FINALIZAR (F8)</button>
          </div>
        </aside>
      </div>

      {/* Modais */}
      {aberto && <PDVPersonalizar produto={aberto} onClose={() => setAberto(null)} onAdd={(it) => { addItem(it); setAberto(null); }} />}

      {showItemLivre && (
        <ItemLivreModal onClose={() => setShowItemLivre(false)} onAdd={(nome, preco) => { addItem({ uid: newId(), produtoId: "livre", nome, qtd: 1, precoBase: preco, precoExtras: 0 }); setShowItemLivre(false); }} />
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmar(false)} />
          <div className="relative glass-strong p-6 max-w-sm w-full text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-xl font-extrabold neon-text-orange mb-2">Confirmar Venda?</h2>
            <div className="text-3xl font-extrabold mb-1">{fmt(total)}</div>
            <div className="text-sm text-white/60 mb-4">{pagamento}{troco ? ` · Troco ${fmt(troco)}` : ""}</div>
            <div className="space-y-2">
              <button className="btn-neon w-full" onClick={() => confirmarFinalizar(true)}>🖨️ Finalizar e Imprimir</button>
              <button className="btn-cyan w-full" onClick={() => confirmarFinalizar(false)}>✓ Apenas Finalizar</button>
              <button className="btn-ghost w-full" onClick={() => setConfirmar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(s: string) {
  const m: any = {
    novo: "bg-blue-500/30 text-blue-300", producao: "bg-yellow-500/30 text-yellow-300",
    pronto: "bg-green-500/30 text-green-300", saiu: "bg-orange-500/30 text-orange-300",
    entregue: "bg-emerald-500/30 text-emerald-300", pago: "bg-purple-500/30 text-purple-300",
  };
  return m[s] || "bg-white/10 text-white";
}

function hms(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

function ItemLivreModal({ onClose, onAdd }: { onClose: () => void; onAdd: (n: string, p: number) => void }) {
  const [nome, setNome] = useState(""); const [preco, setPreco] = useState(0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative glass-strong p-5 w-full max-w-sm">
        <h2 className="text-xl font-extrabold neon-text-orange mb-3">Item Livre</h2>
        <input className="input mb-2" placeholder="Nome do item" value={nome} onChange={e => setNome(e.target.value)} />
        <input type="number" className="input mb-3" placeholder="Preço" value={preco || ""} onChange={e => setPreco(+e.target.value)} />
        <button className="btn-neon w-full" onClick={() => nome && preco > 0 && onAdd(nome, preco)}>Adicionar</button>
      </div>
    </div>
  );
}

function PDVPersonalizar({ produto, onClose, onAdd }: { produto: Produto; onClose: () => void; onAdd: (it: CarrinhoItem) => void }) {
  const [sel, setSel] = useState<Record<string, Record<string, number>>>({});
  function setQ(g: string, i: string, q: number, max: number) { setSel(s => ({ ...s, [g]: { ...(s[g] || {}), [i]: Math.max(0, Math.min(max, q)) } })); }
  const grupos = produto.grupos || [];
  const extras = grupos.reduce((s, g) => s + calcExtraGrupo(g, Object.entries(sel[g.id] || {}).filter(([_, q]) => q > 0).map(([id, q]) => ({ id, qtd: q }))), 0);
  const base = produto.precoPromo ?? produto.preco;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-2xl max-h-[90vh] overflow-auto p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-extrabold neon-text-orange">{produto.nome}</h2>
          <button className="btn-ghost !p-2" onClick={onClose}>✕</button>
        </div>
        {grupos.map(g => {
          const tot = Object.values(sel[g.id] || {}).reduce((a, b) => a + b, 0);
          return (
            <div key={g.id} className="card p-3 mb-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{g.nome}</h3>
                {g.limiteGratis > 0 && <span className={"pill " + (tot > g.limiteGratis ? "bg-orange-500/30 text-orange-300" : "bg-green-500/20 text-green-300")}>{tot}/{g.limiteGratis}</span>}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {g.itens.map(i => {
                  const q = sel[g.id]?.[i.id] || 0;
                  return (
                    <div key={i.id} className={"flex items-center justify-between p-2 rounded border " + (q ? "border-[#ff6b35] bg-[#ff6b35]/10" : "border-white/10")}>
                      <div className="text-sm flex-1">
                        <div>{i.nome}</div>
                        <div className="text-[10px] text-white/60">{i.preco > 0 ? `+${fmt(i.preco)}` : "Grátis"}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost !px-2 !py-0" onClick={() => setQ(g.id, i.id, q - 1, i.maxRepeat)}>-</button>
                        <span className="w-4 text-center font-bold">{q}</span>
                        <button className="btn-ghost !px-2 !py-0" onClick={() => setQ(g.id, i.id, q + 1, i.maxRepeat)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <div className="text-2xl font-extrabold neon-text-orange">{fmt(base + extras)}</div>
          <button className="btn-neon" onClick={() => {
            const selecoes = grupos.map(g => ({
              grupo: g.nome,
              itens: Object.entries(sel[g.id] || {}).filter(([_, q]) => q > 0).map(([id, q]) => {
                const it = g.itens.find(x => x.id === id)!;
                return { nome: it.nome, qtd: q, preco: it.preco, gratis: g.limiteGratis };
              }),
            })).filter(g => g.itens.length > 0);
            onAdd({ uid: newId(), produtoId: produto.id, nome: produto.nome, qtd: 1, precoBase: base, precoExtras: extras, imagem: produto.imagens[0], selecoes });
          }}>Adicionar</button>
        </div>
      </div>
    </div>
  );
}
