import { useEffect, useRef, useState } from "react";
import {
  Pedido, CartItem, StatusPedido,
  getConfig, getProdutos, getCategorias, getPedidos, setPedidos,
  getVendas, setVendas, getCancelados, setCancelados,
  fmt, uid, useLive, applyTheme, nextNumero,
} from "../store";
import { Orbs, Modal, Toast } from "../components/Common";

const STATUS_FLOW: StatusPedido[] = ["novo", "producao", "pronto", "saiu", "entregue", "pago"];
const STATUS_INFO: Record<StatusPedido, { label: string; icon: string }> = {
  novo: { label: "Novo", icon: "📥" },
  producao: { label: "Produção", icon: "🍳" },
  pronto: { label: "Pronto", icon: "✅" },
  saiu: { label: "Saiu", icon: "🛵" },
  entregue: { label: "Entregue", icon: "🎉" },
  pago: { label: "Pago", icon: "💰" },
  cancelado: { label: "Cancelado", icon: "❌" },
};

function useTimer() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
}

function fmtTimer(ms: number): { txt: string; cls: string } {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const txt = (h > 0 ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const cls = m < 15 ? "text-green-400" : m < 30 ? "text-yellow-400" : "text-red-400";
  return { txt, cls };
}

export default function Pdv() {
  const [config] = useLive(getConfig, ["config"]);
  useEffect(() => { applyTheme(config); }, [config]);

  const [tab, setTab] = useState<"delivery" | "mesas" | "balcao">("delivery");
  const [pedidos, refreshPedidos] = useLive(getPedidos, ["pedidos"]);
  const [products] = useLive(getProdutos, ["produtos"]);
  const [cats] = useLive(getCategorias, ["categorias"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2000); };
  const lastPedidoCount = useRef(pedidos.length);

  // Som de novo pedido
  useEffect(() => {
    if (pedidos.length > lastPedidoCount.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.15;
        o.start(); o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2);
        setTimeout(() => o.stop(), 250);
      } catch {/*noop*/}
      showToast("🔔 Novo pedido!");
    }
    lastPedidoCount.current = pedidos.length;
  }, [pedidos.length]);

  // Atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); setTab("delivery"); }
      if (e.key === "F3") { e.preventDefault(); setTab("mesas"); }
      if (e.key === "F4") { e.preventDefault(); setTab("balcao"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ativos = pedidos.filter(p => p.status !== "cancelado" && p.tipo !== "balcao");
  const deliveryList = ativos.filter(p => p.tipo === "entrega" || p.tipo === "retirada");
  const mesasList = ativos.filter(p => p.tipo === "mesa");

  const lista = tab === "delivery" ? deliveryList : tab === "mesas" ? mesasList : [];
  const selected = pedidos.find(p => p.id === selectedId);

  // Update status (avançar/retroceder/cancelar/finalizar)
  const updateStatus = (id: string, status: StatusPedido) => {
    const all = getPedidos();
    const p = all.find(x => x.id === id);
    if (!p) return;
    if (status === "cancelado") {
      const c = getCancelados();
      setCancelados([{ ...p, status, atualizadoEm: Date.now() }, ...c]);
      setPedidos(all.filter(x => x.id !== id));
      setSelectedId(null);
      showToast("Pedido cancelado");
      return;
    }
    if (status === "pago") {
      // finalizar venda
      if (!confirm("Finalizar como venda paga?")) return;
      const v = getVendas();
      setVendas([{ ...p, status: "pago", atualizadoEm: Date.now() }, ...v]);
      setPedidos(all.filter(x => x.id !== id));
      setSelectedId(null);
      showToast("✓ Venda finalizada");
      return;
    }
    setPedidos(all.map(x => x.id === id ? { ...x, status, atualizadoEm: Date.now() } : x));
    refreshPedidos();
  };

  // Novo pedido balcão / mesa
  const [novaMesa, setNovaMesa] = useState("");
  const [balcaoCart, setBalcaoCart] = useState<CartItem[]>([]);
  const [mesaCart, setMesaCart] = useState<CartItem[]>([]);
  const [showItemLivre, setShowItemLivre] = useState(false);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Orbs />
      {/* Header */}
      <header className="glass-strong border-b border-white/10 px-4 py-2 flex items-center gap-3 relative z-10">
        <h1 className="text-xl font-black gradient-text">💰 PDV MH Lanches</h1>
        <div className="flex gap-1 ml-4">
          {[
            ["delivery", "🛵 Delivery (F2)"], ["mesas", "🍽️ Mesas (F3)"], ["balcao", "🏪 Balcão (F4)"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${tab === k ? "btn-neon !py-1.5 !px-3" : "btn-ghost !py-1.5"}`}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <a href="#/admin" className="btn-ghost text-sm">⚙️ Admin</a>
          <a href="#/site" className="btn-ghost text-sm">🌐 Site</a>
        </div>
      </header>

      {/* 3 Colunas */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* COL 1 - Lista pedidos */}
        <aside className="w-72 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10 text-xs text-white/60 font-bold">
            {tab === "delivery" && `${deliveryList.length} pedidos ativos`}
            {tab === "mesas" && `${mesasList.length} mesas abertas`}
            {tab === "balcao" && "Venda direta"}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {tab === "balcao" ? (
              <div className="text-center text-white/40 text-sm p-4">Balcão: monte o carrinho à direita.</div>
            ) : tab === "mesas" ? (
              <>
                <div className="card p-2">
                  <input className="input text-sm" placeholder="Nome da mesa..." value={novaMesa} onChange={e => setNovaMesa(e.target.value)} />
                  <button onClick={() => {
                    if (!novaMesa.trim()) return;
                    const p: Pedido = {
                      id: uid(), numero: nextNumero(), criadoEm: Date.now(), atualizadoEm: Date.now(),
                      status: "novo", tipo: "mesa", mesa: novaMesa.trim(),
                      itens: [], subtotal: 0, desconto: 0, taxa: 0, total: 0, origem: "pdv",
                    };
                    setPedidos([p, ...getPedidos()]);
                    setSelectedId(p.id);
                    setNovaMesa("");
                  }} className="btn-neon w-full mt-2 !py-1.5 text-xs">+ Abrir Mesa</button>
                </div>
                {mesasList.map(p => <PedidoCard key={p.id} p={p} sel={selectedId === p.id} onClick={() => setSelectedId(p.id)} />)}
              </>
            ) : (
              lista.map(p => <PedidoCard key={p.id} p={p} sel={selectedId === p.id} onClick={() => setSelectedId(p.id)} />)
            )}
            {tab !== "balcao" && !lista.length && <div className="text-center text-white/30 text-sm py-8">Nenhum pedido</div>}
          </div>
        </aside>

        {/* COL 2 - Produtos */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
            {cats.map(c => (
              <a key={c.id} href={`#pdv-cat-${c.id}`} className="btn-ghost text-xs whitespace-nowrap !py-1 !px-2">{c.nome}</a>
            ))}
            <button onClick={() => setShowItemLivre(true)} className="btn-neon !py-1 !px-2 text-xs whitespace-nowrap ml-auto">＋ Item Livre</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {cats.map(c => {
              const ps = products.filter(p => p.categoria === c.id);
              if (!ps.length) return null;
              return (
                <div key={c.id} id={`pdv-cat-${c.id}`} className="mb-4">
                  <h3 className="text-sm font-black text-white/60 mb-2">{c.nome}</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {ps.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const item: CartItem = { uid: uid(), produtoId: p.id, nome: p.nome, preco: p.preco, qtd: 1, imagem: p.imagens[0], totalLinha: p.preco };
                          if (tab === "balcao") setBalcaoCart(c => [...c, item]);
                          else if (tab === "mesas" && selected) {
                            const all = getPedidos();
                            setPedidos(all.map(x => x.id === selected.id ? {
                              ...x, itens: [...x.itens, item],
                              subtotal: x.subtotal + item.totalLinha, total: x.total + item.totalLinha,
                              atualizadoEm: Date.now()
                            } : x));
                          } else if (tab === "delivery" && selected) {
                            const all = getPedidos();
                            setPedidos(all.map(x => x.id === selected.id ? {
                              ...x, itens: [...x.itens, item],
                              subtotal: x.subtotal + item.totalLinha, total: x.total + item.totalLinha,
                              atualizadoEm: Date.now()
                            } : x));
                          } else setBalcaoCart(c => [...c, item]);
                        }}
                        className="card p-2 text-left hover:border-orange-500/50"
                      >
                        {p.imagens[0] ? <img src={p.imagens[0]} className="w-full h-16 object-cover rounded" /> : <div className="w-full h-16 bg-white/5 rounded flex items-center justify-center text-2xl">🍔</div>}
                        <div className="text-xs font-bold mt-1 truncate">{p.nome}</div>
                        <div className="text-orange-400 font-black text-sm">{fmt(p.preco)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COL 3 - Carrinho + Pagamento */}
        <aside className="w-[680px] border-l border-white/10 flex">
          <CarrinhoCol
            tab={tab}
            selected={selected}
            balcaoCart={balcaoCart}
            setBalcaoCart={setBalcaoCart}
            updateStatus={updateStatus}
            mesaCart={mesaCart}
            setMesaCart={setMesaCart}
            onFinalizarBalcao={(cart, pagamento) => {
              const subtotal = cart.reduce((s, i) => s + i.totalLinha, 0);
              const p: Pedido = {
                id: uid(), numero: nextNumero(), criadoEm: Date.now(), atualizadoEm: Date.now(),
                status: "pago", tipo: "balcao",
                itens: cart, subtotal, desconto: 0, taxa: 0, total: subtotal,
                pagamento, origem: "pdv",
              };
              setVendas([p, ...getVendas()]);
              setBalcaoCart([]);
              showToast("✓ Venda balcão registrada");
            }}
          />
        </aside>
      </div>

      {/* Item livre modal */}
      <ItemLivreModal
        open={showItemLivre}
        onClose={() => setShowItemLivre(false)}
        onAdd={(item) => {
          if (tab === "balcao") setBalcaoCart(c => [...c, item]);
          else if (selected) {
            const all = getPedidos();
            setPedidos(all.map(x => x.id === selected.id ? {
              ...x, itens: [...x.itens, item],
              subtotal: x.subtotal + item.totalLinha, total: x.total + item.totalLinha,
              atualizadoEm: Date.now()
            } : x));
          }
          setShowItemLivre(false);
        }}
      />

      <Toast msg={toast} />
    </div>
  );
}

// =========== Pedido Card ===========
function PedidoCard({ p, sel, onClick }: { p: Pedido; sel: boolean; onClick: () => void }) {
  useTimer();
  const t = fmtTimer(Date.now() - p.criadoEm);
  const info = STATUS_INFO[p.status];
  return (
    <button onClick={onClick} className={`card p-2.5 w-full text-left ${sel ? "border-orange-500 shadow-neon" : ""}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-black text-orange-400">#{p.numero}</span>
        <span className={`font-mono font-bold ${t.cls}`}>{t.txt}</span>
      </div>
      <div className="font-bold text-sm mt-1 truncate">{p.cliente || p.mesa || p.tipo}</div>
      <div className="flex justify-between items-center mt-1">
        <span className={`status-${p.status} text-[10px] px-1.5 py-0.5 rounded`}>{info.icon} {info.label}</span>
        <span className="text-orange-400 font-bold text-sm">{fmt(p.total)}</span>
      </div>
    </button>
  );
}

// =========== Carrinho Col ===========
function CarrinhoCol({ tab, selected, balcaoCart, setBalcaoCart, updateStatus, onFinalizarBalcao }: {
  tab: "delivery" | "mesas" | "balcao";
  selected: Pedido | undefined;
  balcaoCart: CartItem[];
  setBalcaoCart: (c: CartItem[]) => void;
  updateStatus: (id: string, status: StatusPedido) => void;
  mesaCart: CartItem[]; setMesaCart: (c: CartItem[]) => void;
  onFinalizarBalcao: (cart: CartItem[], pag: { forma: "dinheiro" | "cartao" | "pix"; recebido?: number; troco?: number }) => void;
}) {
  const items = tab === "balcao" ? balcaoCart : (selected?.itens || []);
  const subtotal = items.reduce((s, i) => s + i.totalLinha, 0);
  const [desconto, setDesconto] = useState(0);
  const total = Math.max(0, subtotal - desconto);
  const [forma, setForma] = useState<"dinheiro" | "cartao" | "pix">("dinheiro");
  const [recebido, setRecebido] = useState<string>("");
  const recebidoNum = parseFloat(recebido) || 0;
  const troco = forma === "dinheiro" ? Math.max(0, recebidoNum - total) : 0;

  const printCupom = () => {
    const cfg = getConfig();
    const w = window.open("", "_blank");
    if (!w) return;
    const itensHtml = items.map(i => `<div>${i.qtd}x ${i.nome} — R$ ${i.totalLinha.toFixed(2)}</div>`).join("");
    w.document.write(`
      <html><head><title>Cupom</title><style>
        body{font-family:monospace;padding:10px;width:280px;font-size:12px}
        h1{font-size:14px;text-align:center}.line{border-top:1px dashed #000;margin:8px 0}
      </style></head><body>
      <h1>${cfg.loja.nome}</h1>
      <pre style="white-space:pre-wrap;font-size:10px;text-align:center">${cfg.impressora.cabecalho}</pre>
      <div class="line"></div>
      ${itensHtml}
      <div class="line"></div>
      <div>Subtotal: R$ ${subtotal.toFixed(2)}</div>
      <div>Desconto: R$ ${desconto.toFixed(2)}</div>
      <div><b>TOTAL: R$ ${total.toFixed(2)}</b></div>
      <div class="line"></div>
      <pre style="white-space:pre-wrap;font-size:10px;text-align:center">${cfg.impressora.rodape}</pre>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 200);
  };

  return (
    <>
      {/* Carrinho */}
      <div className="w-1/2 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10 font-bold flex justify-between items-center">
          <span>🛒 {tab === "balcao" ? "Balcão" : selected ? `#${selected.numero} • ${selected.cliente || selected.mesa || selected.tipo}` : "Selecione um pedido"}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {items.map(i => (
            <div key={i.uid} className="card p-2 text-sm flex justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{i.qtd}x {i.nome}</div>
                {i.obs && <div className="text-xs text-yellow-400">📝 {i.obs}</div>}
              </div>
              <div className="text-orange-400 font-bold">{fmt(i.totalLinha)}</div>
              <button onClick={() => {
                if (tab === "balcao") setBalcaoCart(balcaoCart.filter(x => x.uid !== i.uid));
                else if (selected) {
                  const all = getPedidos();
                  setPedidos(all.map(x => x.id === selected.id ? {
                    ...x, itens: x.itens.filter(z => z.uid !== i.uid),
                    subtotal: x.subtotal - i.totalLinha, total: x.total - i.totalLinha
                  } : x));
                }
              }} className="text-red-400 text-xs">✕</button>
            </div>
          ))}
          {!items.length && <div className="text-center text-white/30 text-sm py-8">Vazio</div>}
        </div>
        {/* Status timeline (delivery) */}
        {tab === "delivery" && selected && (
          <div className="p-2 border-t border-white/10">
            <div className="flex justify-between mb-2">
              <button onClick={() => updateStatus(selected.id, "cancelado")} className="btn-danger !py-1 !px-2 text-xs">❌ Cancelar</button>
              <div className="flex gap-1">
                <button onClick={() => {
                  const i = STATUS_FLOW.indexOf(selected.status);
                  if (i > 0) updateStatus(selected.id, STATUS_FLOW[i - 1]);
                }} className="btn-ghost !py-1 !px-2 text-xs">◀</button>
                <button onClick={() => {
                  const i = STATUS_FLOW.indexOf(selected.status);
                  if (i < STATUS_FLOW.length - 1) updateStatus(selected.id, STATUS_FLOW[i + 1]);
                }} className="btn-ghost !py-1 !px-2 text-xs">▶</button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {STATUS_FLOW.map((s, i) => {
                const cur = STATUS_FLOW.indexOf(selected.status);
                const active = s === selected.status;
                const past = i < cur;
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`p-1.5 rounded text-[10px] font-bold ${
                      active ? "bg-orange-500 text-white shadow-neon" :
                      past ? "bg-green-500/30 text-green-300" : "bg-white/5 text-white/40"
                    }`}
                  >
                    {STATUS_INFO[s].icon}<br />{STATUS_INFO[s].label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagamento */}
      <div className="w-1/2 flex flex-col">
        <div className="p-3 border-b border-white/10 font-bold">💳 Pagamento</div>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          <div className="card p-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm">
              <span>Desconto (R$)</span>
              <input type="number" step="0.01" className="input !py-1 !w-24 text-right" value={desconto || ""} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-white/10">
              <span className="font-bold">TOTAL</span>
              <span className="text-2xl font-black gradient-text">{fmt(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[["dinheiro", "💵"], ["cartao", "💳"], ["pix", "📱"]].map(([k, ic]) => (
              <button key={k} onClick={() => setForma(k as any)} className={`card p-3 text-center ${forma === k ? "border-orange-500 bg-orange-500/10 shadow-neon" : ""}`}>
                <div className="text-2xl">{ic}</div>
                <div className="text-xs font-bold mt-1">{k.toUpperCase()}</div>
              </button>
            ))}
          </div>

          {forma === "dinheiro" && (
            <div>
              <label className="text-xs font-bold">Valor recebido</label>
              <input type="number" step="0.01" className="input mt-1" value={recebido} onChange={e => setRecebido(e.target.value)} placeholder="0,00" />
              {recebidoNum > 0 && (
                <div className="text-sm mt-1">
                  Troco: <span className="text-green-400 font-black">{fmt(troco)}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={printCupom} className="btn-ghost text-sm">🖨 Imprimir</button>
            {tab === "balcao" && (
              <button onClick={() => onFinalizarBalcao(items, { forma, recebido: recebidoNum, troco })} disabled={!items.length} className="btn-neon">💾 Finalizar Venda</button>
            )}
            {tab !== "balcao" && selected && (
              <button onClick={() => updateStatus(selected.id, "pago")} disabled={!items.length} className="btn-neon">✅ Finalizar (F8)</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =========== Item Livre ===========
function ItemLivreModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (i: CartItem) => void }) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  if (!open) return null;
  return (
    <Modal open onClose={onClose} max="max-w-sm">
      <div className="p-5 space-y-3">
        <h2 className="text-xl font-black gradient-text">➕ Item Livre</h2>
        <input className="input" placeholder="Nome do item" value={nome} onChange={e => setNome(e.target.value)} />
        <input type="number" step="0.01" className="input" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
        <button onClick={() => {
          const v = parseFloat(valor) || 0;
          if (!nome.trim() || !v) return;
          onAdd({ uid: uid(), produtoId: "_livre", nome: nome.trim(), preco: v, qtd: 1, totalLinha: v });
          setNome(""); setValor("");
        }} className="btn-neon w-full">Adicionar</button>
      </div>
    </Modal>
  );
}


