import { useEffect, useMemo, useRef, useState } from "react";

import { calcExtraGrupo, fmt, newId, useStore, type CarrinhoItem, type Pedido, type Produto } from "../store";
import { pushPedido, subscribePedido } from "../firebase";
import { logCartOpen, logOrderSent, logProductAdd, logVisitOncePerSession } from "../analytics";

type CheckoutPayload = {
  tipoPedido: "retirada" | "entrega";
  pagamento: "Pagar na Loja" | "Pix" | "Dinheiro" | "Cartão";
  nome?: string;
  endereco?: string;
  referencia?: string;
  trocoPara?: number;
};

export default function Site() {
  const { config, categorias, produtos, cupons, setCupons, pedidos, setPedidos, proximoNumero } = useStore();
  const [favoritos, setFavoritos] = useState<string[]>(() => JSON.parse(localStorage.getItem("mh_fav") || "[]"));
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const irParaCardapio = () => {
    const el = document.getElementById("cardapio");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [catAtiva, setCatAtiva] = useState<string>("todos");

  const [aberto, setAberto] = useState<Produto | null>(null);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [cliente, setCliente] = useState(() => {
    const salvo = JSON.parse(localStorage.getItem("mh_cliente") || "{}");
    return { nome: "", tel: "", endereco: "", referencia: "", ...salvo };
  });
  const [cupomCod, setCupomCod] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [pedidoEnviado, setPedidoEnviado] = useState<string | null>(() => localStorage.getItem("mh_meuPedidoId"));
  const [statusModalAberto, setStatusModalAberto] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bebidasSugeridas, setBebidasSugeridas] = useState<Produto[]>([]);
  const [installEvt, setInstallEvt] = useState<any>(null);

  useEffect(() => {
    if (pedidoEnviado) localStorage.setItem("mh_meuPedidoId", pedidoEnviado);
    else localStorage.removeItem("mh_meuPedidoId");
  }, [pedidoEnviado]);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; emoji: string }[]>([]);
  const [flying, setFlying] = useState<{ id: string; x: number; y: number; tx: number; ty: number; img?: string }[]>([]);

  useEffect(() => { localStorage.setItem("mh_fav", JSON.stringify(favoritos)); }, [favoritos]);
  useEffect(() => { localStorage.setItem("mh_cliente", JSON.stringify(cliente)); }, [cliente]);
  useEffect(() => { logVisitOncePerSession(); }, []);
  useEffect(() => {
    const onInstall = (e: any) => {
      e.preventDefault?.();
      setInstallEvt(e);
    };
    window.addEventListener("beforeinstallprompt", onInstall as any);
    return () => window.removeEventListener("beforeinstallprompt", onInstall as any);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % Math.max(1, config.anuncios.filter(a => a.ativo).length)), 5000);
    return () => clearInterval(t);
  }, [config.anuncios]);

  // verificar status loja
  const lojaAberta = useMemo(() => {
    const d = new Date();
    const dias = ["dom","seg","ter","qua","qui","sex","sab"];
    const h = config.horarios?.[dias[d.getDay()]];
    if (!h?.aberto) return false;
    const now = d.getHours() * 60 + d.getMinutes();
    const [ha, ma] = h.abre.split(":").map(Number);
    const [hf, mf] = h.fecha.split(":").map(Number);
    const a = ha * 60 + ma, f = hf * 60 + mf;
    return f > a ? now >= a && now <= f : now >= a || now <= f;
  }, [config]);

  const produtosFiltrados = useMemo(() => {
    let arr = produtos.filter(p => !p.pausado);
    if (catAtiva === "favoritos") arr = arr.filter(p => favoritos.includes(p.id));
    else if (catAtiva !== "todos") arr = arr.filter(p => p.categoriaId === catAtiva);

    return arr.sort((a, b) => a.ordem - b.ordem);
  }, [produtos, catAtiva, favoritos]);

  const totals = useMemo(() => {
    const sub = carrinho.reduce((s, i) => s + (i.precoBase + i.precoExtras) * i.qtd, 0);
    let desc = 0;
    let taxa = config.delivery.taxa;
    if (cupomAplicado) {
      if (cupomAplicado.tipo === "perc") desc = sub * (cupomAplicado.valor / 100);
      else if (cupomAplicado.tipo === "valor") desc = cupomAplicado.valor;
      else if (cupomAplicado.tipo === "frete") taxa = 0;
    }
    return { sub, desc, taxa, total: sub - desc + taxa };
  }, [carrinho, cupomAplicado, config]);

  function sugerirBebidas(produto: Produto) {
    if (!produto.ofertaBebidas?.length) return;
    const bebidas = produto.ofertaBebidas
      .map(id => produtos.find(p => p.id === id && !p.pausado))
      .filter(Boolean) as Produto[];
    if (bebidas.length) setBebidasSugeridas(bebidas);
  }

  function adicionarProdutoAoCarrinho(produto: Produto, item: CarrinhoItem, ev?: React.MouseEvent) {
    setCarrinho(c => [...c, item]);
    logProductAdd(produto.id, produto.nome);
    flyToCart(ev, item.imagem || produto.imagens[0]);
    sugerirBebidas(produto);
  }

  function toggleFav(id: string, ev?: React.MouseEvent) {
    setFavoritos(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    if (ev) {
      const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const newP = Array.from({ length: 8 }).map(() => ({
        id: newId(), x: cx, y: cy, emoji: ["❤️","💖","✨","💕"][Math.floor(Math.random()*4)],
      }));
      setParticles(p => [...p, ...newP]);
      setTimeout(() => setParticles(p => p.filter(x => !newP.find(n => n.id === x.id))), 800);
    }
  }

  function adicionarSimples(p: Produto, ev?: React.MouseEvent) {
    const item: CarrinhoItem = { uid: newId(), produtoId: p.id, nome: p.nome, qtd: 1, precoBase: p.precoPromo ?? p.preco, precoExtras: 0, imagem: p.imagens[0] };
    adicionarProdutoAoCarrinho(p, item, ev);
  }

  function flyToCart(ev?: React.MouseEvent, img?: string) {
    if (!ev || !cartIconRef.current) return;
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const c = cartIconRef.current.getBoundingClientRect();
    const id = newId();
    setFlying(f => [...f, { id, x: r.left, y: r.top, tx: c.left - r.left, ty: c.top - r.top, img }]);
    setTimeout(() => setFlying(f => f.filter(x => x.id !== id)), 800);
  }

  function aplicarCupom() {
    const c = cupons.find(x => x.codigo.toUpperCase() === cupomCod.toUpperCase());
    if (!c) return alert("Cupom não encontrado");
    if (c.usados >= c.total) return alert("Cupom esgotado");
    if (totals.sub < c.minimo) return alert(`Pedido mínimo: ${fmt(c.minimo)}`);
    if (new Date(c.validade) < new Date()) return alert("Cupom expirado");
    setCupomAplicado(c);
  }

  function enviarPedido(payload: CheckoutPayload) {
    if (payload.tipoPedido === "entrega") {
      if (!payload.nome || !payload.endereco || !payload.referencia) return alert("Preencha nome, endereço e ponto de referência");
      if (payload.pagamento === "Dinheiro" && payload.trocoPara && payload.trocoPara <= Math.max(0, totals.sub - totals.desc + totals.taxa)) {
        return alert("O valor do troco deve ser maior que o total do pedido");
      }
    }

    if (totals.sub < config.delivery.minimo) return alert(`Pedido mínimo: ${fmt(config.delivery.minimo)}`);

    const numero = proximoNumero();
    const id = newId();
    const taxaPedido = payload.tipoPedido === "entrega" ? totals.taxa : 0;
    const totalPedido = Math.max(0, totals.sub - totals.desc) + taxaPedido;
    const clientePedido = {
      nome: payload.tipoPedido === "retirada" ? (payload.nome || cliente.nome || "Cliente") : (payload.nome || cliente.nome),
      tel: cliente.tel || "",
      endereco: payload.tipoPedido === "entrega" ? payload.endereco : "Retirada na loja",
      referencia: payload.tipoPedido === "entrega" ? payload.referencia : "",
    };

    const ped: Pedido = {
      id,
      numero,
      cliente: clientePedido,
      itens: carrinho,
      subtotal: totals.sub,
      desconto: totals.desc,
      taxa: taxaPedido,
      total: totalPedido,
      pagamento: payload.pagamento,
      troco: payload.pagamento === "Dinheiro" ? payload.trocoPara || 0 : 0,
      tipoPedido: payload.tipoPedido,
      status: "novo",
      historicoStatus: [{ status: "novo", em: Date.now() }],
      criadoEm: Date.now(),
      origem: "site",
    };

    setCliente((c: typeof cliente) => ({ ...c, nome: clientePedido.nome, endereco: payload.endereco || c.endereco, referencia: payload.referencia || c.referencia }));
    setPedidos([ped, ...pedidos]);
    pushPedido(ped);

    if (cupomAplicado) setCupons(cupons.map(c => c.id === cupomAplicado.id ? { ...c, usados: c.usados + 1 } : c));

    const resumoItens = carrinho.map(i => `• ${i.qtd}x ${i.nome} - ${fmt((i.precoBase + i.precoExtras) * i.qtd)}`).join("%0A");
    const msg = [
      payload.tipoPedido === "retirada" ? `🏪 *NOVO PEDIDO RETIRADA #${numero}*` : `🛵 *NOVO PEDIDO ENTREGA #${numero}*`,
      `*Cliente:* ${clientePedido.nome}`,
      payload.tipoPedido === "entrega" ? `*Endereço:* ${clientePedido.endereco}` : `*Retirada:* No balcão da loja`,
      payload.tipoPedido === "entrega" ? `*Referência:* ${clientePedido.referencia}` : null,
      `*Pagamento:* ${payload.pagamento}`,
      payload.pagamento === "Dinheiro" && payload.trocoPara ? `*Troco para:* ${fmt(payload.trocoPara)}` : null,
      "",
      "*Itens:*",
      resumoItens,
      "",
      `Subtotal: ${fmt(totals.sub)}`,
      `Desconto: ${fmt(totals.desc)}`,
      `Taxa: ${fmt(taxaPedido)}`,
      `*TOTAL: ${fmt(totalPedido)}*`,
    ].filter(Boolean).join("%0A");

    window.open(`https://api.whatsapp.com/send?phone=${config.social.whatsapp}&text=${msg}`, "_blank");
    logOrderSent({ total: totalPedido, itens: carrinho.length, tipoPedido: payload.tipoPedido });
    setPedidoEnviado(id);
    setCarrinho([]);
    setCheckout(false);
    setMostrarCarrinho(false);
    setStatusModalAberto(true);
  }

  // Acompanhar status
  const meuPedido = pedidoEnviado ? pedidos.find(p => p.id === pedidoEnviado) : null;

  const anunciosAtivos = config.anuncios.filter(a => a.ativo);

  return (
    <div className="min-h-screen">
      <div className="bg-orbs" />

      {/* Particles & flying items */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        {particles.map((p, i) => (
          <span key={p.id} className="particle absolute text-xl"
            style={{ left: p.x, top: p.y, ["--dx" as any]: `${(Math.random()-0.5)*120}px`, ["--dy" as any]: `${-Math.random()*100-20}px`, animationDelay: `${i*0.02}s` }}>
            {p.emoji}
          </span>
        ))}
        {flying.map(f => (
          <img key={f.id} src={f.img} className="fly absolute w-12 h-12 rounded-full object-cover border-2 border-[#ff6b35] shadow-[0_0_20px_rgba(255,107,53,.7)]"
            style={{ left: f.x, top: f.y, ["--tx" as any]: `${f.tx}px`, ["--ty" as any]: `${f.ty}px` }} />
        ))}
      </div>

      {/* HEADER FIXO */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[60px] px-3 py-2 flex items-center justify-between gap-2 bg-[rgba(10,10,15,0.92)] backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/40"
      >
        <span className={"pill flex items-center gap-1 shrink-0 " + (lojaAberta ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
          <span className={"w-2 h-2 rounded-full " + (lojaAberta ? "bg-green-400 dot-live" : "bg-red-400")} />
          {lojaAberta ? "Aberto" : "Fechado"}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost relative flex items-center gap-1 text-lg h-9"
            onClick={irParaCardapio}
            title="Ir para o cardápio"
          >
            🍔 <span className="hidden sm:inline text-sm font-semibold">Cardápio</span>
          </button>
          <button
            className="btn-ghost relative flex items-center gap-1 text-lg h-9"
            onClick={() => setStatusModalAberto(true)}
            title="Acompanhar status do meu pedido"
          >
            🛵 <span className="hidden sm:inline text-sm font-semibold">Status</span>
            {pedidoEnviado && meuPedido && meuPedido.status !== "finalizado" && meuPedido.status !== "cancelado" && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 dot-live shadow-[0_0_8px_#00ff9d]" />
            )}
          </button>
          <button ref={cartIconRef} className="btn-neon relative h-9 flex items-center" onClick={() => { logCartOpen(); setMostrarCarrinho(true); }}>
            🛒 <span className="hidden sm:inline">Carrinho</span>
            {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-[#ff6b35] text-xs font-extrabold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">{carrinho.length}</span>}
          </button>
        </div>
      </header>

      {/* Spacer para o header fixo */}
      <div className="h-[60px]" />

      {/* LOGO HERO — animada (cabe inteira na tela do celular) */}
      {config.visual?.logoUrl && (
        <section className="relative z-10 mx-3 mt-2 overflow-hidden flex items-center justify-center"
          style={{ height: "min(48vh, 360px)" }}
        >
          {/* Halos de fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="logo-halo absolute w-[60%] max-w-[340px] aspect-square rounded-full"
              style={{ background: "radial-gradient(circle, rgba(var(--mh-primary-rgb),.35) 0%, transparent 65%)" }} />
            <div className="logo-halo absolute w-[45%] max-w-[260px] aspect-square rounded-full"
              style={{ background: "radial-gradient(circle, rgba(var(--mh-accent-rgb),.30) 0%, transparent 65%)", animationDelay: "1.5s" }} />
          </div>
          <img
            src={config.visual.logoUrl}
            alt={config.loja.nome}
            className="logo-hero relative z-10 max-h-full max-w-[70%] md:max-w-[340px] object-contain select-none"
            draggable={false}
          />
        </section>
      )}

      {!!config.visual.textoAcimaAnuncios?.trim() && (
        <section className="relative z-10 mx-3 mt-2 px-4 text-center">
          <div className="text-sm md:text-lg font-black uppercase tracking-[0.28em] text-white/90 drop-shadow-[0_0_18px_rgba(255,107,53,0.35)]">
            {config.visual.textoAcimaAnuncios}
          </div>
        </section>
      )}

      {/* HERO BANNER */}
      <section className="relative z-10 mx-3 mt-3 glass-strong p-6 md:p-10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/15 via-transparent to-[#00d4ff]/15" />
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-extrabold neon-text-orange mb-2">{config.loja.titulo}</h1>
          <p className="text-white/70 text-sm md:text-base mb-3">⏱️ Entrega em ~{config.delivery.tempoMedio}min · 🚚 Taxa {fmt(config.delivery.taxa)} · 💰 Mínimo {fmt(config.delivery.minimo)}</p>
          {anunciosAtivos.length > 0 && (
            <div className="glass px-4 py-2 inline-block text-sm font-semibold neon-text-cyan animate-pulse">
              {anunciosAtivos[bannerIdx]?.texto}
            </div>
          )}
        </div>
      </section>



      {/* CATEGORIAS */}
      <nav className="sticky top-[60px] z-40 mx-3 mt-3 glass-strong px-3 py-2 overflow-x-auto shadow-lg shadow-black/30">
        <div className="flex gap-2 whitespace-nowrap">
          <CatChip active={catAtiva === "todos"} onClick={() => setCatAtiva("todos")} label="🍽️ Todos" />
          <CatChip active={catAtiva === "favoritos"} onClick={() => setCatAtiva("favoritos")} label={`❤️ Favoritos (${favoritos.length})`} />
          {categorias.sort((a, b) => a.ordem - b.ordem).map(c => (
            <CatChip key={c.id} active={catAtiva === c.id} onClick={() => setCatAtiva(c.id)} label={c.nome} />
          ))}
        </div>
      </nav>

      {/* PRODUTOS GRID */}
      <main id="cardapio" className="relative z-10 mx-3 mt-4 mb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 scroll-mt-[126px]">
        {produtosFiltrados.map(p => (
          <ProdutoCard key={p.id} p={p}
            fav={favoritos.includes(p.id)}
            onFav={(e) => toggleFav(p.id, e)}
            onAdd={(e) => p.tipo === "simples" ? adicionarSimples(p, e) : setAberto(p)}
            onOpen={() => setAberto(p)} />
        ))}
        {produtosFiltrados.length === 0 && (
          <div className="col-span-full glass p-10 text-center text-white/60">Nenhum produto encontrado</div>
        )}
      </main>

      {/* SOBRE NÓS */}
      <section className="relative z-10 mx-3 mb-6 glass-strong p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h2 className="text-2xl font-extrabold neon-text-cyan mb-3">{config.sobre.titulo}</h2>
          <p className="text-white/80 mb-2">{config.sobre.texto1}</p>
          <p className="text-white/70">{config.sobre.texto2}</p>
        </div>
        <div className="rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-[#ff6b35]/30 to-[#00d4ff]/20 flex items-center justify-center text-7xl">🍔</div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 mx-3 mb-3 glass px-4 py-4 grid md:grid-cols-3 gap-3 text-xs text-white/70">
        <div>{config.rodape.esq}</div>
        <div className="text-center">{config.rodape.copyright}</div>
        <div className="md:text-right">📞 {config.loja.tel} · 📍 {config.loja.endereco}</div>
      </footer>

      {/* Modal Personalizar */}
      {aberto && <PersonalizarModal produto={aberto} onClose={() => setAberto(null)} onAdd={(item, ev) => { adicionarProdutoAoCarrinho(aberto, item, ev); setAberto(null); }} />}

      {/* Carrinho lateral */}
      {mostrarCarrinho && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMostrarCarrinho(false)} />
          <div className="relative glass-strong w-full max-w-md h-full overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold neon-text-orange">🛒 Seu Carrinho</h2>
              <button className="btn-ghost !p-2" onClick={() => setMostrarCarrinho(false)}>✕</button>
            </div>
            {carrinho.length === 0 ? (
              <div className="text-center text-white/50 py-12">Carrinho vazio</div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {carrinho.map((it, idx) => (
                    <div key={it.uid} className="card p-3 flex gap-3">
                      {it.imagem && <img src={it.imagem} className="w-14 h-14 object-cover rounded-lg" />}
                      <div className="flex-1">
                        <div className="font-bold text-sm">{it.nome}</div>
                        {it.selecoes?.map((g, gi) => (
                          <div key={gi} className="text-[11px] text-white/60">
                            <b>{g.grupo}:</b> {g.itens.map(i => `${i.qtd}x ${i.nome}`).join(", ")}
                          </div>
                        ))}
                        <div className="text-[#ff6b35] font-bold text-sm mt-1">{fmt((it.precoBase + it.precoExtras) * it.qtd)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button className="text-red-400 text-xs" onClick={() => setCarrinho(c => c.filter((_, i) => i !== idx))}>🗑️</button>
                        <div className="flex items-center gap-1 text-xs">
                          <button className="btn-ghost !px-2 !py-0.5" onClick={() => setCarrinho(c => c.map((x, i) => i === idx ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x))}>-</button>
                          <span className="font-bold">{it.qtd}</span>
                          <button className="btn-ghost !px-2 !py-0.5" onClick={() => setCarrinho(c => c.map((x, i) => i === idx ? { ...x, qtd: x.qtd + 1 } : x))}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card p-3 mb-3 space-y-2">
                  <div className="text-sm font-bold">🎟️ Aplicar cupom de desconto</div>
                  <div className="flex gap-2">
                    <input className="input" placeholder="Digite seu cupom" value={cupomCod} onChange={e => setCupomCod(e.target.value.toUpperCase())} />
                    <button className="btn-cyan whitespace-nowrap" onClick={aplicarCupom}>Aplicar</button>
                  </div>
                  {cupomAplicado && (
                    <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-400/20 px-3 py-2 text-xs text-green-200">
                      <span>✓ Cupom <b>{cupomAplicado.codigo}</b> aplicado com sucesso</span>
                      <button className="text-red-300" onClick={() => setCupomAplicado(null)}>remover</button>
                    </div>
                  )}
                </div>

                <div className="card p-4 space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span>Subtotal dos produtos</span><b>{fmt(totals.sub)}</b></div>
                  <div className="flex justify-between text-green-300"><span>Desconto do cupom</span><b>- {fmt(totals.desc)}</b></div>
                  <div className="flex justify-between text-lg pt-2 border-t border-white/10"><span>Valor total da compra</span><b className="neon-text-orange text-2xl">{fmt(Math.max(0, totals.sub - totals.desc))}</b></div>
                </div>

                <div className="space-y-2">
                  <button className="btn-ghost w-full justify-center" onClick={() => { setMostrarCarrinho(false); irParaCardapio(); }}>← Continuar comprando</button>
                  <button className="btn-neon w-full justify-center" onClick={() => { setMostrarCarrinho(false); setCheckout(true); }}>Continuar para WhatsApp →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {checkout && (
        <CheckoutWhatsAppModal
          clienteInicial={cliente}
          subtotal={totals.sub}
          desconto={totals.desc}
          taxaEntrega={totals.taxa}
          minimo={config.delivery.minimo}
          onClose={() => setCheckout(false)}
          onSalvarCliente={(dados: { nome?: string; endereco?: string; referencia?: string }) => setCliente((c: typeof cliente) => ({ ...c, ...dados }))}
          onEnviar={enviarPedido}
        />
      )}

      {bebidasSugeridas.length > 0 && (
        <BebidaSuggestionModal
          bebidas={bebidasSugeridas}
          onClose={() => setBebidasSugeridas([])}
          onAdd={(p) => {
            adicionarSimples(p);
            setBebidasSugeridas([]);
          }}
        />
      )}

      {/* Modal de acompanhamento de pedido em tempo real */}
      {statusModalAberto && (
        <StatusPedidoModal
          pedidoIdAtivo={pedidoEnviado}
          onClose={() => setStatusModalAberto(false)}
          onLimpar={() => { setPedidoEnviado(null); }}
        />
      )}

      {installEvt && (
        <button
          className="fixed bottom-3 left-3 z-40 btn-cyan flex items-center gap-2"
          onClick={async () => {
            try {
              await installEvt.prompt?.();
              await installEvt.userChoice;
            } finally {
              setInstallEvt(null);
            }
          }}
        >
          📲 Instalar app
        </button>
      )}

      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-3 right-3 z-40 w-12 h-12 rounded-full btn-neon !p-0 flex items-center justify-center" title="Topo">↑</button>
    </div>
  );
}

function BebidaSuggestionModal({ bebidas, onClose, onAdd }: { bebidas: Produto[]; onClose: () => void; onAdd: (p: Produto) => void }) {
  return (
    <div className="fixed inset-0 z-[72] flex items-end md:items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-xl p-4 rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Sugestão automática</div>
            <h3 className="text-2xl font-extrabold neon-text-cyan">🥤 Que tal uma bebida?</h3>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose}>✕</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {bebidas.map((p) => (
            <button key={p.id} className="card p-3 text-left" onClick={() => onAdd(p)}>
              <img src={p.imagens[0]} className="w-full h-28 object-cover rounded-xl mb-3" />
              <div className="font-bold">{p.nome}</div>
              <div className="text-xs text-white/60 line-clamp-2 mt-1">{p.descricao}</div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-lg font-extrabold neon-text-orange">{fmt(p.precoPromo ?? p.preco)}</div>
                <span className="btn-neon !px-3 !py-1.5 text-sm">Adicionar</span>
              </div>
            </button>
          ))}
        </div>
        <button className="btn-ghost w-full mt-4" onClick={onClose}>Agora não</button>
      </div>
    </div>
  );
}

function CheckoutWhatsAppModal({
  clienteInicial,
  subtotal,
  desconto,
  taxaEntrega,
  minimo,
  onClose,
  onSalvarCliente,
  onEnviar,
}: {
  clienteInicial: { nome?: string; endereco?: string; referencia?: string };
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  minimo: number;
  onClose: () => void;
  onSalvarCliente: (dados: { nome?: string; endereco?: string; referencia?: string }) => void;
  onEnviar: (payload: CheckoutPayload) => void;
}) {
  const [etapa, setEtapa] = useState<"tipo" | "retirada" | "entrega">("tipo");
  const [pagamento, setPagamento] = useState<CheckoutPayload["pagamento"] | "">("");
  const [nome, setNome] = useState(clienteInicial.nome || "");
  const [endereco, setEndereco] = useState(clienteInicial.endereco || "");
  const [referencia, setReferencia] = useState(clienteInicial.referencia || "");
  const [precisaTroco, setPrecisaTroco] = useState<boolean | null>(null);
  const [trocoPara, setTrocoPara] = useState("");

  const totalProdutos = Math.max(0, subtotal - desconto);
  const totalEntrega = totalProdutos + taxaEntrega;
  const trocoNumero = Number(trocoPara.replace(",", ".")) || 0;

  const faltando: string[] = [];
  if (!nome.trim()) faltando.push("nome");
  if (!endereco.trim()) faltando.push("endereço");
  if (!referencia.trim()) faltando.push("ponto de referência");
  if (!pagamento) faltando.push("forma de pagamento");
  if (pagamento === "Dinheiro" && precisaTroco === null) faltando.push("informar se precisa de troco");
  if (pagamento === "Dinheiro" && precisaTroco && !trocoNumero) faltando.push("valor do troco");
  if (pagamento === "Dinheiro" && precisaTroco && trocoNumero <= totalEntrega) faltando.push("troco maior que o total");

  const entregaValida = faltando.length === 0 && totalProdutos >= minimo;
  const retiradaValida = Boolean(pagamento) && totalProdutos >= minimo;

  const PaymentCard = ({ label, icon }: { label: CheckoutPayload["pagamento"]; icon: string }) => (
    <button
      type="button"
      onClick={() => {
        setPagamento(label);
        if (label !== "Dinheiro") {
          setPrecisaTroco(null);
          setTrocoPara("");
        }
      }}
      className={"card p-4 text-left transition border " + (pagamento === label ? "border-[var(--mh-primary)] ring-2 ring-[color:rgba(var(--mh-primary-rgb),0.22)]" : "border-white/10 hover:border-white/20")}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-bold">{label}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass-strong w-full max-w-2xl max-h-[92vh] overflow-auto rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Finalização</div>
            <h2 className="text-2xl font-extrabold neon-text-orange">Continuar para WhatsApp</h2>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose}>✕</button>
        </div>

        <div className="card p-3 mb-4 flex items-center justify-between text-sm gap-3">
          <div>
            <div className="text-white/55 text-xs">Valor dos produtos</div>
            <div className="font-extrabold text-xl neon-text-orange">{fmt(totalProdutos)}</div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className={"pill " + (etapa === "tipo" ? "bg-orange-500/20 text-orange-200" : "bg-white/5 text-white/60")}>1. Tipo de pedido</span>
            <span className={"pill " + (etapa !== "tipo" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5 text-white/60")}>2. Finalização</span>
          </div>
        </div>

        {etapa === "tipo" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <button className="card p-5 text-left hover:-translate-y-1 transition" onClick={() => { setEtapa("retirada"); setPagamento(""); setPrecisaTroco(null); setTrocoPara(""); }}>
                <div className="text-4xl mb-3">🏪</div>
                <div className="text-lg font-extrabold">RETIRADA</div>
                <div className="text-sm text-white/60 mt-1">Retire na loja sem alteração no valor do pedido.</div>
                <div className="mt-4 text-2xl font-extrabold neon-text-orange">{fmt(totalProdutos)}</div>
              </button>
              <button className="card p-5 text-left hover:-translate-y-1 transition" onClick={() => { setEtapa("entrega"); setPagamento(""); setPrecisaTroco(null); setTrocoPara(""); }}>
                <div className="text-4xl mb-3">🛵</div>
                <div className="text-lg font-extrabold">ENTREGA</div>
                <div className="text-sm text-white/60 mt-1">Valor dos produtos + taxa de entrega configurada pela loja.</div>
                <div className="mt-4 flex items-end gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-white/45">Produtos</div>
                    <div className="font-bold">{fmt(totalProdutos)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/45">Taxa</div>
                    <div className="font-bold text-cyan-300">{fmt(taxaEntrega)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/45">Total</div>
                    <div className="text-2xl font-extrabold neon-text-orange">{fmt(totalEntrega)}</div>
                  </div>
                </div>
              </button>
            </div>
            {totalProdutos < minimo && <div className="card p-3 text-sm text-orange-200">⚠️ Pedido mínimo para envio: <b>{fmt(minimo)}</b></div>}
          </div>
        )}

        {etapa === "retirada" && (
          <div className="space-y-4">
            <button className="btn-ghost" onClick={() => setEtapa("tipo")}>← Voltar</button>
            <div className="card p-4 bg-green-500/10 border border-green-400/20">
              <div className="text-sm text-green-200 font-bold mb-1">🏪 Pedido para retirada</div>
              <div className="text-white/80">Sem alteração no valor pois o pedido será retirado na loja.</div>
              <div className="mt-3 text-2xl font-extrabold neon-text-orange">{fmt(totalProdutos)}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <PaymentCard label="Pagar na Loja" icon="💵" />
              <PaymentCard label="Pix" icon="📱" />
            </div>
            {totalProdutos < minimo && <div className="text-sm text-orange-200">⚠️ Pedido mínimo: {fmt(minimo)}</div>}
            <button className="btn-neon w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed" disabled={!retiradaValida} onClick={() => { onSalvarCliente({ nome: nome || clienteInicial.nome || "Cliente" }); onEnviar({ tipoPedido: "retirada", pagamento: pagamento as CheckoutPayload["pagamento"], nome: nome || clienteInicial.nome || "Cliente" }); }}>
              Enviar pedido para WhatsApp →
            </button>
          </div>
        )}

        {etapa === "entrega" && (
          <div className="space-y-4">
            <button className="btn-ghost" onClick={() => setEtapa("tipo")}>← Voltar</button>
            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Valor dos produtos</span><b>{fmt(totalProdutos)}</b></div>
              <div className="flex justify-between text-sm text-cyan-200"><span>Taxa de entrega</span><b>{fmt(taxaEntrega)}</b></div>
              <div className="flex justify-between text-lg border-t border-white/10 pt-2"><span>Total</span><b className="neon-text-orange text-2xl">{fmt(totalEntrega)}</b></div>
            </div>
            <div className="card p-4 text-sm text-yellow-100 bg-yellow-500/10 border border-yellow-300/20">
              🛵 Nossos valores são baseados na distância média. Se o seu endereço for muito longe, podemos precisar fazer um pequeno ajuste na taxa para que a entrega seja possível. Entraremos em contato se necessário! 😉
            </div>
            <div className="grid gap-3">
              <input className="input" placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} />
              <input className="input" placeholder="Endereço completo *" value={endereco} onChange={e => setEndereco(e.target.value)} />
              <input className="input" placeholder="Ponto de referência *" value={referencia} onChange={e => setReferencia(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <PaymentCard label="Dinheiro" icon="💵" />
              <PaymentCard label="Cartão" icon="💳" />
              <PaymentCard label="Pix" icon="📱" />
            </div>

            {pagamento === "Dinheiro" && (
              <div className="card p-4 space-y-3">
                <div className="font-bold">Precisa de troco?</div>
                <div className="flex gap-2">
                  <button className={"btn-ghost flex-1 justify-center " + (precisaTroco === true ? "!border-[var(--mh-primary)]" : "")} onClick={() => setPrecisaTroco(true)}>Sim</button>
                  <button className={"btn-ghost flex-1 justify-center " + (precisaTroco === false ? "!border-[var(--mh-primary)]" : "")} onClick={() => { setPrecisaTroco(false); setTrocoPara(""); }}>Não</button>
                </div>
                {precisaTroco && <input className="input" placeholder="Troco para quanto? *" value={trocoPara} onChange={e => setTrocoPara(e.target.value)} />}
              </div>
            )}

            {faltando.length > 0 && <div className="text-sm text-orange-200">⚠️ Preencha corretamente: {faltando.join(", ")}</div>}
            {totalProdutos < minimo && <div className="text-sm text-orange-200">⚠️ Pedido mínimo: {fmt(minimo)}</div>}
            <button
              className="btn-neon w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!entregaValida}
              onClick={() => { onSalvarCliente({ nome, endereco, referencia }); onEnviar({ tipoPedido: "entrega", pagamento: pagamento as CheckoutPayload["pagamento"], nome, endereco, referencia, trocoPara: pagamento === "Dinheiro" && precisaTroco ? trocoNumero : 0 }); }}
            >
              Enviar pedido para WhatsApp →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, label }: any) {
  return (
    <button onClick={onClick}
      className={"px-4 py-1.5 rounded-full text-sm font-semibold transition shrink-0 " +
        (active ? "bg-gradient-to-r from-[#ff6b35] to-[#ff2d92] text-white shadow-lg" : "bg-white/5 text-white/70 hover:bg-white/10")}>
      {label}
    </button>
  );
}

function ProdutoCard({ p, fav, onFav, onAdd, onOpen }: { p: Produto; fav: boolean; onFav: (e: React.MouseEvent) => void; onAdd: (e: React.MouseEvent) => void; onOpen: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const img = p.imagens[imgIdx] || "https://placehold.co/600x400/1a1a1a/ff6b35?text=MH+Lanches";
  return (
    <article className="card overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden cursor-pointer group" onClick={onOpen}>
        <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {p.destaque && <span className="pill bg-yellow-400/90 text-black">⭐ Destaque</span>}
          {p.promocao && <span className="pill bg-red-500/90 text-white">🔥 Promo</span>}
          {p.tempoPreparoMin && <span className="pill bg-black/60 text-white">⏱️ {p.tempoPreparoMin}min</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFav(e); }}
          className={"absolute top-2 right-2 w-9 h-9 rounded-full backdrop-blur bg-black/40 flex items-center justify-center text-lg " + (fav ? "heart-pop" : "")}>
          {fav ? "❤️" : "🤍"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAdd(e); }}
          className="absolute bottom-2 right-2 w-11 h-11 rounded-full btn-neon !p-0 flex items-center justify-center text-2xl shadow-xl">+</button>
        <div className="absolute bottom-2 left-2 text-[9px] bg-black/50 text-white/70 px-2 py-0.5 rounded">📷 Imagem ilustrativa</div>
        {p.imagens.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + p.imagens.length) % p.imagens.length); }} className="bg-black/40 w-7 h-7 rounded-full">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % p.imagens.length); }} className="bg-black/40 w-7 h-7 rounded-full">›</button>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-sm mb-1">{p.nome}</h3>
        <p className="text-xs text-white/60 line-clamp-2 mb-2 flex-1">{p.descricao}</p>
        <div className="flex items-center justify-between">
          <div>
            {p.precoPromo ? (
              <>
                <div className="text-xs text-white/40 line-through">{fmt(p.preco)}</div>
                <div className="text-[#ff6b35] font-extrabold text-lg neon-text-orange">{fmt(p.precoPromo)}</div>
              </>
            ) : (
              <div className="text-[#ff6b35] font-extrabold text-lg neon-text-orange">{fmt(p.preco)}</div>
            )}
          </div>
          <div className="text-xs text-yellow-300">⭐ {(p.avaliacao || 0).toFixed(1)}</div>
        </div>
      </div>
    </article>
  );
}

function PersonalizarModal({ produto, onClose, onAdd }: { produto: Produto; onClose: () => void; onAdd: (it: CarrinhoItem, ev: React.MouseEvent) => void }) {
  const [sel, setSel] = useState<Record<string, Record<string, number>>>({});
  const [obs, setObs] = useState("");
  const [imgIdx, setImgIdx] = useState(0);

  function setQ(grupoId: string, itemId: string, q: number, max: number) {
    setSel(s => ({ ...s, [grupoId]: { ...(s[grupoId] || {}), [itemId]: Math.max(0, Math.min(max, q)) } }));
  }

  const grupos = produto.grupos || [];
  const extras = grupos.reduce((sum, g) => {
    const arr = Object.entries(sel[g.id] || {}).filter(([_, q]) => q > 0).map(([id, q]) => ({ id, qtd: q }));
    return sum + calcExtraGrupo(g, arr);
  }, 0);
  const precoBase = produto.precoPromo ?? produto.preco;
  const total = precoBase + extras;

  function adicionar(ev: React.MouseEvent) {
    const selecoes = grupos.map(g => ({
      grupo: g.nome,
      itens: Object.entries(sel[g.id] || {}).filter(([_, q]) => q > 0).map(([id, q]) => {
        const it = g.itens.find(x => x.id === id)!;
        return { nome: it.nome, qtd: q, preco: it.preco, gratis: g.limiteGratis };
      }),
    })).filter(g => g.itens.length > 0);
    onAdd({
      uid: newId(), produtoId: produto.id, nome: produto.nome, qtd: 1,
      precoBase, precoExtras: extras, imagem: produto.imagens[0], selecoes, obs,
    }, ev);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong w-full md:max-w-2xl max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-2xl">
        <div className="sticky top-0 glass-strong p-4 flex items-center justify-between border-b border-white/10 z-10">
          <div>
            <h2 className="text-xl font-extrabold neon-text-orange">{produto.nome}</h2>
            <p className="text-xs text-white/60">{produto.descricao}</p>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose}>✕</button>
        </div>

        {produto.imagens[0] && (
          <div className="relative h-52 md:h-64 overflow-hidden bg-black/30">
            <img src={produto.imagens[imgIdx] || produto.imagens[0]} className="w-full h-full object-cover" />
            {produto.imagens.length > 1 && (
              <>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                  <button className="w-9 h-9 rounded-full bg-black/40 text-white text-xl" onClick={() => setImgIdx(i => (i - 1 + produto.imagens.length) % produto.imagens.length)}>‹</button>
                  <button className="w-9 h-9 rounded-full bg-black/40 text-white text-xl" onClick={() => setImgIdx(i => (i + 1) % produto.imagens.length)}>›</button>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {produto.imagens.map((_, i) => (
                    <button key={i} className={"w-2.5 h-2.5 rounded-full " + (i === imgIdx ? "bg-white" : "bg-white/35")} onClick={() => setImgIdx(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {grupos.map(g => {
            const totalSel = Object.values(sel[g.id] || {}).reduce((a, b) => a + b, 0);
            const exceeds = totalSel > g.limiteGratis;
            return (
              <div key={g.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{g.nome}</h3>
                  {g.limiteGratis > 0 && (
                    <span className={"pill " + (exceeds ? "bg-orange-500/30 text-orange-200" : "bg-green-500/20 text-green-300")}>
                      {totalSel} / {g.limiteGratis} grátis
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/60 mb-2">
                  {g.limiteGratis > 0 ? `Escolha até ${g.limiteGratis} grátis. Extras serão cobrados.` : "Escolha 1"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {g.itens.map(i => {
                    const q = sel[g.id]?.[i.id] || 0;
                    const ativo = q > 0;
                    return (
                      <div key={i.id} className={"flex items-center justify-between p-2 rounded-lg border transition " + (ativo ? "border-[#ff6b35] bg-[#ff6b35]/10" : "border-white/10 bg-white/5")}>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{i.nome}</div>
                          <div className="text-[11px] text-white/60">{i.preco > 0 ? `+ ${fmt(i.preco)}` : "Grátis"} · máx {i.maxRepeat}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="btn-ghost !px-2 !py-0.5" onClick={() => setQ(g.id, i.id, q - 1, i.maxRepeat)}>-</button>
                          <span className="w-5 text-center font-bold">{q}</span>
                          <button className="btn-ghost !px-2 !py-0.5" onClick={() => setQ(g.id, i.id, q + 1, i.maxRepeat)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <textarea className="input" placeholder="Observações (sem cebola, ponto da carne...)" value={obs} onChange={e => setObs(e.target.value)} />
        </div>

        <div className="sticky bottom-0 glass-strong p-3 flex items-center justify-between border-t border-white/10">
          <div>
            <div className="text-xs text-white/60">Total</div>
            <div className="text-2xl font-extrabold neon-text-orange">{fmt(total)}</div>
          </div>
          <button className="btn-neon" onClick={adicionar}>Adicionar +</button>
        </div>
      </div>
    </div>
  );
}

function StatusTracker({ status }: { status: string }) {
  const steps = [
    { k: "novo", label: "Novo", icon: "🔵" },
    { k: "producao", label: "Produção", icon: "🟡" },
    { k: "pronto", label: "Pronto", icon: "🟢" },
    { k: "saiu", label: "Saiu", icon: "🛵" },
    { k: "entregue", label: "Entregue", icon: "✅" },
  ];
  if (status === "cancelado") {
    return <div className="bg-gray-700 text-red-300 p-4 rounded-lg text-center font-bold">❌ PEDIDO CANCELADO</div>;
  }
  const idx = steps.findIndex(s => s.k === status);
  return (
    <div className="flex justify-between">
      {steps.map((s, i) => (
        <div key={s.k} className={"flex flex-col items-center text-center flex-1 relative " + (i <= idx ? "opacity-100" : "opacity-30")}>
          {i > 0 && (
            <div className={"absolute top-4 right-1/2 w-full h-0.5 -z-0 " + (i <= idx ? "bg-[#ff6b35] shadow-[0_0_8px_#ff6b35]" : "bg-white/10")} />
          )}
          <div className={"relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm " + (i <= idx ? "bg-[#ff6b35] shadow-[0_0_15px_#ff6b35]" : "bg-white/10")}>{s.icon}</div>
          <div className="text-[10px] mt-1 font-semibold">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ===================== MODAL: STATUS DO PEDIDO EM TEMPO REAL ===================== */
function StatusPedidoModal({
  pedidoIdAtivo,
  onClose,
  onLimpar,
}: {
  pedidoIdAtivo: string | null;
  onClose: () => void;
  onLimpar: () => void;
}) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  // Escuta o pedido ativo em tempo real
  useEffect(() => {
    if (!pedidoIdAtivo) { setPedido(null); return; }
    setLoading(true);
    const unsub = subscribePedido(pedidoIdAtivo, p => {
      setPedido(p);
      setLoading(false);
    });
    return unsub;
  }, [pedidoIdAtivo]);

  const statusInfo: Record<string, { label: string; icon: string; cor: string; desc: string }> = {
    novo:       { label: "Pedido Recebido",   icon: "🔵", cor: "#00d4ff", desc: "Recebemos seu pedido! Em instantes ele entra em produção." },
    producao:   { label: "Em Produção",       icon: "🟡", cor: "#ffd400", desc: "Nossos chefs estão preparando seu pedido com carinho." },
    pronto:     { label: "Pronto",            icon: "🟢", cor: "#00ff9d", desc: "Seu pedido está pronto! Saindo para entrega em breve." },
    saiu:       { label: "Saiu para Entrega", icon: "🛵", cor: "#ff6b35", desc: "Está a caminho! Prepare-se para receber 🤤" },
    entregue:   { label: "Entregue",          icon: "✅", cor: "#00ff9d", desc: "Pedido entregue! Bom apetite 🍔" },
    pago:       { label: "Pago",              icon: "💰", cor: "#00ff9d", desc: "Pagamento confirmado. Obrigado pela preferência!" },
    finalizado: { label: "Finalizado",        icon: "🏁", cor: "#00ff9d", desc: "Pedido concluído. Volte sempre!" },
    cancelado:  { label: "Cancelado",         icon: "❌", cor: "#ff3355", desc: "Este pedido foi cancelado." },
  };

  const semPedido = !pedidoIdAtivo;
  const info = pedido ? statusInfo[pedido.status] : null;
  const cancelado = pedido?.status === "cancelado";

  // Tempo decorrido
  const minutosDecorridos = pedido ? Math.floor((Date.now() - pedido.criadoEm) / 60000) : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={
          "relative glass-strong w-full max-w-lg max-h-[92vh] overflow-auto p-5 rounded-2xl transition-all " +
          (cancelado ? "bg-gray-700/60 grayscale-[0.4]" : "")
        }
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={"text-xl font-extrabold flex items-center gap-2 " + (cancelado ? "text-white/70" : "neon-text-orange")}>
            🛵 Status do Pedido
          </h2>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* SEM PEDIDO ATIVO */}
        {semPedido && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">📭</div>
            <div className="text-xl font-bold mb-2">Nenhum pedido ativo</div>
            <p className="text-white/60 text-sm max-w-xs mx-auto">
              Você ainda não possui pedidos em andamento.<br />
              Faça seu pedido pelo cardápio para acompanhar em tempo real!
            </p>
            <button className="btn-neon mt-6" onClick={onClose}>Ver cardápio</button>
          </div>
        )}

        {/* CARREGANDO */}
        {!semPedido && loading && !pedido && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-spin inline-block">⏳</div>
            <div className="text-white/70">Carregando pedido...</div>
          </div>
        )}

        {/* PEDIDO NÃO ENCONTRADO */}
        {!semPedido && !loading && !pedido && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">❓</div>
            <div className="text-lg font-bold mb-2">Pedido não encontrado</div>
            <p className="text-white/60 text-sm mb-4">
              Não foi possível localizar este pedido. Pode ter sido removido.
            </p>
            <button className="btn-ghost" onClick={onLimpar}>Limpar</button>
          </div>
        )}

        {/* PEDIDO CANCELADO */}
        {pedido && cancelado && (
          <div className="text-center py-10 px-3">
            <div className="text-6xl mb-5 opacity-70">❌</div>
            <div
              className="text-4xl sm:text-5xl font-black text-red-500 mb-5 tracking-wide"
              style={{ textShadow: "0 0 20px rgba(255, 51, 85, 0.6)" }}
            >
              Pedido Cancelado !
            </div>
            <p className="text-white text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
              Caso não esteja ciente do motivo que levou ao cancelamento, favor entrar em contato com a nossa equipe. Aguardamos seu próximo pedido!
            </p>
            <div className="flex gap-2 justify-center">
              <button className="btn-ghost" onClick={() => { onLimpar(); onClose(); }}>
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* PEDIDO ATIVO */}
        {pedido && !cancelado && info && (
          <>
            {/* Cabeçalho com tempo decorrido */}
            <div className="flex items-center justify-end mb-4 p-3 rounded-xl bg-white/5">
              <div className="text-right">
                <div className="text-xs text-white/50">Tempo decorrido</div>
                <div className="text-lg font-bold">{minutosDecorridos} min</div>
              </div>
            </div>

            {/* Status atual destacado */}
            <div
              className="rounded-xl p-4 mb-4 text-center border"
              style={{
                background: `linear-gradient(135deg, ${info.cor}22, ${info.cor}08)`,
                borderColor: `${info.cor}55`,
                boxShadow: `0 0 25px ${info.cor}33`,
              }}
            >
              <div className="text-4xl mb-1 animate-pulse">{info.icon}</div>
              <div className="text-xl font-extrabold" style={{ color: info.cor, textShadow: `0 0 10px ${info.cor}` }}>
                {info.label}
              </div>
              <div className="text-xs text-white/70 mt-1">{info.desc}</div>
            </div>

            {/* Timeline */}
            <div className="mb-5">
              <StatusTracker status={pedido.status} />
            </div>

            {/* Detalhes do pedido */}
            <div className="space-y-2 text-sm border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-white/60">Cliente</span>
                <span className="font-semibold">{pedido.cliente?.nome}</span>
              </div>
              {pedido.cliente?.endereco && (
                <div className="flex justify-between gap-3">
                  <span className="text-white/60 shrink-0">Endereço</span>
                  <span className="font-semibold text-right text-xs">{pedido.cliente.endereco}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">Itens</span>
                <span className="font-semibold">{pedido.itens?.length} produto(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Pagamento</span>
                <span className="font-semibold">{pedido.pagamento}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-white/10">
                <span className="text-white/60">Total</span>
                <span className="font-extrabold text-[#ff6b35] text-lg">{fmt(pedido.total)}</span>
              </div>
            </div>

            {/* Lista resumida de itens */}
            <details className="mt-4 group">
              <summary className="cursor-pointer text-xs text-white/60 hover:text-white select-none">
                Ver itens do pedido
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-white/70 pl-3">
                {pedido.itens?.map((it, i) => (
                  <li key={i}>• {it.qtd}x {it.nome}</li>
                ))}
              </ul>
            </details>

            {/* Ações */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-white/10">
              <button className="btn-ghost flex-1 text-xs" onClick={onLimpar} title="Esquecer este pedido">
                🗑️ Esquecer
              </button>
              <button className="btn-neon flex-1" onClick={onClose}>OK</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
