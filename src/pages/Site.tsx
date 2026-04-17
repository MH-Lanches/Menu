import { useEffect, useMemo, useRef, useState } from "react";

import { calcExtraGrupo, fmt, newId, useStore, type CarrinhoItem, type Pedido, type Produto } from "../store";
import { pushPedido, subscribePedido } from "../firebase";

export default function Site() {
  const { config, categorias, produtos, cupons, setCupons, pedidos, setPedidos, proximoNumero } = useStore();
  const [favoritos, setFavoritos] = useState<string[]>(() => JSON.parse(localStorage.getItem("mh_fav") || "[]"));
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [catAtiva, setCatAtiva] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<Produto | null>(null);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [cliente, setCliente] = useState(() => JSON.parse(localStorage.getItem("mh_cliente") || '{"nome":"","tel":"","endereco":""}'));
  const [pagamento, setPagamento] = useState("PIX");
  const [trocoPara, setTrocoPara] = useState("");
  const [cupomCod, setCupomCod] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [pedidoEnviado, setPedidoEnviado] = useState<string | null>(() => localStorage.getItem("mh_meuPedidoId"));
  const [statusModalAberto, setStatusModalAberto] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    if (pedidoEnviado) localStorage.setItem("mh_meuPedidoId", pedidoEnviado);
    else localStorage.removeItem("mh_meuPedidoId");
  }, [pedidoEnviado]);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; emoji: string }[]>([]);
  const [flying, setFlying] = useState<{ id: string; x: number; y: number; tx: number; ty: number; img?: string }[]>([]);

  useEffect(() => { localStorage.setItem("mh_fav", JSON.stringify(favoritos)); }, [favoritos]);
  useEffect(() => { localStorage.setItem("mh_cliente", JSON.stringify(cliente)); }, [cliente]);
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
    if (busca.trim()) arr = arr.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
    return arr.sort((a, b) => a.ordem - b.ordem);
  }, [produtos, catAtiva, busca, favoritos]);

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
    setCarrinho(c => [...c, item]);
    flyToCart(ev, p.imagens[0]);
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

  function enviarPedido() {
    if (!cliente.nome || !cliente.tel) return alert("Preencha nome e telefone");
    if (totals.sub < config.delivery.minimo) return alert(`Pedido mínimo: ${fmt(config.delivery.minimo)}`);
    const numero = proximoNumero();
    const id = newId();
    const ped: any = {
      id, numero, cliente, itens: carrinho,
      subtotal: totals.sub, desconto: totals.desc, taxa: totals.taxa, total: totals.total,
      pagamento, troco: pagamento === "Dinheiro" ? Number(trocoPara) || 0 : 0,
      status: "novo", criadoEm: Date.now(), origem: "site",
    };
    setPedidos([ped, ...pedidos]);
    // Publica no Firebase para sincronia em tempo real entre dispositivos / PDV
    pushPedido(ped);
    if (cupomAplicado) setCupons(cupons.map(c => c.id === cupomAplicado.id ? { ...c, usados: c.usados + 1 } : c));
    // WhatsApp
    const msg = `🛵 *NOVO PEDIDO #${numero}*%0A*Cliente:* ${cliente.nome}%0A*Tel:* ${cliente.tel}%0A${cliente.endereco ? "*End:* " + cliente.endereco + "%0A" : ""}%0A*Itens:*%0A${carrinho.map(i => `• ${i.qtd}x ${i.nome} - ${fmt((i.precoBase+i.precoExtras)*i.qtd)}`).join("%0A")}%0A%0ASubtotal: ${fmt(totals.sub)}%0ADesconto: ${fmt(totals.desc)}%0ATaxa: ${fmt(totals.taxa)}%0A*TOTAL: ${fmt(totals.total)}*%0APagamento: ${pagamento}`;
    window.open(`https://api.whatsapp.com/send?phone=${config.social.whatsapp}&text=${msg}`, "_blank");
    setPedidoEnviado(id);
    setCarrinho([]); setCheckout(false); setMostrarCarrinho(false);
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

      {/* HEADER */}
      <header className="relative z-30 glass-strong mx-3 mt-3 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input className="input" placeholder="🔎 Buscar produtos..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className={"pill flex items-center gap-1 " + (lojaAberta ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
            <span className={"w-2 h-2 rounded-full " + (lojaAberta ? "bg-green-400 dot-live" : "bg-red-400")} />
            {lojaAberta ? "Aberto" : "Fechado"}
          </span>
          <button
            className="btn-ghost relative flex items-center gap-1 text-xl"
            onClick={() => setStatusModalAberto(true)}
            title="Acompanhar status do meu pedido"
          >
            🛵 <span className="hidden sm:inline text-sm font-semibold">Status</span>
            {pedidoEnviado && meuPedido && meuPedido.status !== "finalizado" && meuPedido.status !== "cancelado" && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 dot-live shadow-[0_0_8px_#00ff9d]" />
            )}
          </button>
          <button ref={cartIconRef} className="btn-neon relative" onClick={() => setMostrarCarrinho(true)}>
            🛒 <span className="hidden sm:inline">Carrinho</span>
            {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-[#ff6b35] text-xs font-extrabold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">{carrinho.length}</span>}
          </button>
        </div>
      </header>

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

      {/* HERO BANNER */}
      <section className="relative z-10 mx-3 mt-3 glass-strong p-6 md:p-10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/15 via-transparent to-[#00d4ff]/15" />
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-extrabold neon-text-orange mb-2">{config.loja.titulo}</h1>
          <p className="text-white/70 text-sm md:text-base mb-4">⏱️ Entrega em ~{config.delivery.tempoMedio}min · 🚚 Taxa {fmt(config.delivery.taxa)} · 💰 Mínimo {fmt(config.delivery.minimo)}</p>
          {anunciosAtivos.length > 0 && (
            <div className="glass px-4 py-2 inline-block text-sm font-semibold neon-text-cyan animate-pulse">
              {anunciosAtivos[bannerIdx]?.texto}
            </div>
          )}
        </div>
      </section>

      {/* MOBILE search */}
      <div className="md:hidden mx-3 mt-3">
        <input className="input" placeholder="🔎 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* CATEGORIAS */}
      <nav className="sticky top-0 z-20 mx-3 mt-3 glass-strong px-3 py-2 overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          <CatChip active={catAtiva === "todos"} onClick={() => setCatAtiva("todos")} label="🍽️ Todos" />
          <CatChip active={catAtiva === "favoritos"} onClick={() => setCatAtiva("favoritos")} label={`❤️ Favoritos (${favoritos.length})`} />
          {categorias.sort((a, b) => a.ordem - b.ordem).map(c => (
            <CatChip key={c.id} active={catAtiva === c.id} onClick={() => setCatAtiva(c.id)} label={c.nome} />
          ))}
        </div>
      </nav>

      {/* PRODUTOS GRID */}
      <main className="relative z-10 mx-3 mt-4 mb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      {aberto && <PersonalizarModal produto={aberto} onClose={() => setAberto(null)} onAdd={(item, ev) => { setCarrinho(c => [...c, item]); flyToCart(ev, item.imagem); setAberto(null); }} />}

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

                <div className="card p-3 mb-3">
                  <div className="flex gap-2">
                    <input className="input" placeholder="🎫 Cupom" value={cupomCod} onChange={e => setCupomCod(e.target.value)} />
                    <button className="btn-cyan" onClick={aplicarCupom}>Aplicar</button>
                  </div>
                  {cupomAplicado && <div className="text-xs text-green-300 mt-2">✓ Cupom <b>{cupomAplicado.codigo}</b> aplicado!</div>}
                </div>

                <div className="card p-3 space-y-1 text-sm mb-3">
                  <div className="flex justify-between"><span>Subtotal</span><b>{fmt(totals.sub)}</b></div>
                  <div className="flex justify-between text-green-300"><span>Desconto</span><b>- {fmt(totals.desc)}</b></div>
                  <div className="flex justify-between"><span>Taxa entrega</span><b>{fmt(totals.taxa)}</b></div>
                  <div className="flex justify-between text-lg pt-2 border-t border-white/10"><span>Total</span><b className="neon-text-orange">{fmt(totals.total)}</b></div>
                </div>

                {!checkout ? (
                  <button className="btn-neon w-full" onClick={() => setCheckout(true)}>Finalizar Pedido →</button>
                ) : (
                  <div className="space-y-2">
                    <input className="input" placeholder="Seu nome" value={cliente.nome} onChange={e => setCliente({ ...cliente, nome: e.target.value })} />
                    <input className="input" placeholder="Telefone (WhatsApp)" value={cliente.tel} onChange={e => setCliente({ ...cliente, tel: e.target.value })} />
                    <input className="input" placeholder="Endereço completo" value={cliente.endereco} onChange={e => setCliente({ ...cliente, endereco: e.target.value })} />
                    <select className="input" value={pagamento} onChange={e => setPagamento(e.target.value)}>
                      <option>PIX</option><option>Dinheiro</option><option>Cartão Crédito</option><option>Cartão Débito</option>
                    </select>
                    {pagamento === "Dinheiro" && (
                      <input className="input" placeholder="Troco para R$..." value={trocoPara} onChange={e => setTrocoPara(e.target.value)} />
                    )}
                    <button className="btn-neon w-full" onClick={enviarPedido}>📲 Enviar via WhatsApp</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de acompanhamento de pedido em tempo real */}
      {statusModalAberto && (
        <StatusPedidoModal
          pedidoIdAtivo={pedidoEnviado}
          onClose={() => setStatusModalAberto(false)}
          onLimpar={() => { setPedidoEnviado(null); }}
        />
      )}

      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-3 right-3 z-40 w-12 h-12 rounded-full btn-neon !p-0 flex items-center justify-center" title="Topo">↑</button>
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

        {produto.imagens[0] && <img src={produto.imagens[0]} className="w-full h-48 object-cover" />}

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
