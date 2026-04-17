import { useEffect, useMemo, useRef, useState } from "react";
import {
  Produto, CartItem, Pedido, Cupom, CartOptionPick,
  getConfig, getProdutos, getCategorias, getCupons, getFavoritos, setFavoritos,
  getPedidoAtivoId, setPedidoAtivoId, getPedidos, setPedidos,
  isLojaAberta, fmt, uid, useLive, nextNumero, buildWhatsMsg,
  trackVisita, trackFunil, applyTheme,
} from "../store";
import { Orbs, Modal, Badge, Toast } from "../components/Common";

// =================== Helpers ===================
function calcLinha(prod: Produto, picks: CartOptionPick[], qtd: number, metades?: { nome: string; preco: number }[]): number {
  let base = prod.preco;
  if (metades && metades.length === 2) {
    base = Math.max(metades[0].preco, metades[1].preco);
  }
  const extras = picks.reduce((s, p) => s + p.precoUnit * p.qtd, 0);
  return (base + extras) * qtd;
}

// Distribui custo: dentro do limite grátis (cobrando primeiro mais caros) = 0
function computePicks(group: { freeLimit: number; itens: { id: string; nome: string; preco: number }[] }, counts: Record<string, number>): CartOptionPick[] {
  const flat: { itemId: string; nome: string; preco: number }[] = [];
  for (const it of group.itens) {
    const c = counts[it.id] || 0;
    for (let i = 0; i < c; i++) flat.push({ itemId: it.id, nome: it.nome, preco: it.preco });
  }
  // ordena por preço desc — os mais caros consomem o "grátis"
  flat.sort((a, b) => b.preco - a.preco);
  const free = group.freeLimit;
  const result: CartOptionPick[] = [];
  flat.forEach((u, idx) => {
    const cobra = idx >= free ? u.preco : 0;
    // agrupa por item
    const ex = result.find(r => r.itemId === u.itemId && r.precoUnit === cobra);
    if (ex) ex.qtd += 1;
    else result.push({ groupId: "", groupNome: "", itemId: u.itemId, itemNome: u.nome, qtd: 1, precoUnit: cobra });
  });
  return result;
}

// =================== Main ===================
export default function Site() {
  const [config] = useLive(getConfig, ["config"]);
  const [produtos] = useLive(getProdutos, ["produtos"]);
  const [categorias] = useLive(getCategorias, ["categorias"]);
  const [favs, setFavs] = useState<string[]>(() => getFavoritos());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [prodModal, setProdModal] = useState<Produto | null>(null);
  const [bebidasSug, setBebidasSug] = useState<Produto[] | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [anuncioIdx, setAnuncioIdx] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => { trackVisita("site"); }, []);
  useEffect(() => { applyTheme(config); }, [config]);

  // Anúncios rotativos
  useEffect(() => {
    const ativos = config.anuncios.filter(a => a.ativo);
    if (ativos.length < 2) return;
    const t = setInterval(() => setAnuncioIdx(i => (i + 1) % ativos.length), 5000);
    return () => clearInterval(t);
  }, [config.anuncios]);

  // PWA
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Toast helper
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // Favoritos
  const toggleFav = (id: string, fromEl?: HTMLElement | null) => {
    const has = favs.includes(id);
    const nv = has ? favs.filter(x => x !== id) : [...favs, id];
    setFavs(nv); setFavoritos(nv);
    if (!has && fromEl) {
      // partículas
      const rect = fromEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      for (let i = 0; i < 6; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = cx + "px"; p.style.top = cy + "px";
        const ang = (Math.PI * 2 * i) / 6;
        p.style.setProperty("--dx", Math.cos(ang) * 40 + "px");
        p.style.setProperty("--dy", Math.sin(ang) * 40 + "px");
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
      }
    }
  };

  // Loja aberta?
  const aberta = isLojaAberta(config);

  // Categorias com favoritos no topo
  const cats = useMemo(() => {
    const arr: { id: string; nome: string; ordem: number }[] = [...categorias].sort((a, b) => a.ordem - b.ordem);
    if (favs.length) arr.unshift({ id: "_fav", nome: `❤️ Favoritos (${favs.length})`, ordem: 0 });
    return arr;
  }, [categorias, favs]);

  // Produtos filtrados
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos
      .filter(p => !p.pausado || true) // mostra mas marca
      .filter(p => !q || p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q))
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99));
  }, [produtos, busca]);

  const grouped = useMemo(() => {
    const map: Record<string, Produto[]> = {};
    cats.forEach(c => {
      if (c.id === "_fav") {
        map[c.id] = visiveis.filter(p => favs.includes(p.id));
      } else {
        map[c.id] = visiveis.filter(p => p.categoria === c.id);
      }
    });
    return map;
  }, [cats, visiveis, favs]);

  // Cart helpers
  const cartCount = cart.reduce((s, i) => s + i.qtd, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.totalLinha, 0);

  const addCart = (item: CartItem, srcEl?: HTMLElement | null) => {
    setCart(c => [...c, item]);
    trackFunil("produto_adicionado");
    showToast("✓ Adicionado ao carrinho");
    // fly to cart anim
    if (srcEl && item.imagem) {
      const cartBtn = document.getElementById("cart-btn");
      if (cartBtn) {
        const r1 = srcEl.getBoundingClientRect();
        const r2 = cartBtn.getBoundingClientRect();
        const img = document.createElement("img");
        img.src = item.imagem;
        img.className = "fly-img";
        img.style.left = r1.left + "px";
        img.style.top = r1.top + "px";
        img.style.setProperty("--fx", (r2.left - r1.left) + "px");
        img.style.setProperty("--fy", (r2.top - r1.top) + "px");
        document.body.appendChild(img);
        setTimeout(() => img.remove(), 800);
      }
    }
  };

  // Sugerir bebida
  const sugerirBebida = (prod: Produto) => {
    if (!prod.bebidasSugeridas?.length) return;
    const bebidas = prod.bebidasSugeridas.map(id => produtos.find(p => p.id === id)).filter(Boolean) as Produto[];
    if (bebidas.length) setBebidasSug(bebidas);
  };

  const handleAddSimple = (prod: Produto, el: HTMLElement | null) => {
    if (prod.pausado) { showToast("Produto indisponível"); return; }
    if (prod.multiEscolha || prod.meioMeio) { setProdModal(prod); return; }
    const item: CartItem = {
      uid: uid(), produtoId: prod.id, nome: prod.nome, preco: prod.preco, qtd: 1,
      imagem: prod.imagens[0], totalLinha: prod.preco,
    };
    addCart(item, el);
    sugerirBebida(prod);
  };

  return (
    <div className="min-h-screen relative">
      <Orbs />

      {/* HEADER FIXO */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 flex items-center justify-between gap-2"
        style={{
          height: 60,
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${aberta ? "bg-green-500/20 border-green-400/50 text-green-300 pulse-green" : "bg-red-500/20 border-red-400/50 text-red-300"}`}>
            {aberta ? "🟢 Aberto" : "🔴 Fechado"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a href="#cardapio" className="btn-ghost !py-1.5 !px-2.5 text-xs sm:text-sm">🍔 <span className="hidden sm:inline">Cardápio</span></a>
          <button
            onClick={() => setStatusOpen(true)}
            className={`btn-ghost !py-1.5 !px-2.5 text-xs sm:text-sm ${getPedidoAtivoId() ? "pulse-green border-green-500" : ""}`}
          >
            🛵 <span className="hidden sm:inline">Status</span>
          </button>
          <button id="cart-btn" onClick={() => { setCartOpen(true); trackFunil("carrinho_aberto"); }} className="btn-neon !py-1.5 !px-3 text-xs sm:text-sm relative">
            🛒 <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-neon-cyan">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo (com padding-top do header) */}
      <main className="relative z-10" style={{ paddingTop: 60 }}>
        {/* HERO LOGO */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-6 pb-2">
          <div className="relative" style={{ height: "min(48vh, 360px)" }}>
            <div className="halo" style={{ width: 320, height: 320, background: "radial-gradient(circle, rgba(255,107,53,0.55), transparent 60%)", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
            <div className="halo" style={{ width: 280, height: 280, background: "radial-gradient(circle, rgba(0,212,255,0.45), transparent 60%)", left: "50%", top: "50%", transform: "translate(-50%,-50%)", animationDelay: "-2s" }} />
            <img src={config.visual.logoUrl} alt="MH Lanches" className="logo-hero relative h-full w-auto object-contain" />
          </div>
          <p className="text-center text-lg sm:text-xl font-bold gradient-text mt-2">{config.loja.textoHero}</p>
        </section>

        {/* Banner anúncios */}
        {config.anuncios.filter(a => a.ativo).length > 0 && (
          <div className="px-3 mb-3">
            <div className="glass rounded-2xl py-2.5 px-4 text-center text-sm font-semibold text-white/90 border-orange-500/30">
              {config.anuncios.filter(a => a.ativo)[anuncioIdx]?.texto}
            </div>
          </div>
        )}

        {/* Install PWA */}
        {installPrompt && (
          <div className="px-3 mb-2">
            <button onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }} className="btn-ghost w-full">📲 Instalar App</button>
          </div>
        )}

        {/* Search */}
        <div className="px-3 mb-2">
          <input className="input" placeholder="🔎 Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {/* Barra de Categorias STICKY abaixo do header */}
        <div
          className="sticky z-40 px-3 py-2"
          style={{ top: 60, background: "rgba(7,7,10,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {cats.map(c => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeCat === c.id
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-neon"
                    : "glass border-white/15 text-white/80"
                }`}
              >
                {c.nome}
              </a>
            ))}
          </div>
        </div>

        {/* CARDÁPIO */}
        <section id="cardapio" className="px-3 pb-32 pt-4 space-y-8 max-w-5xl mx-auto">
          {cats.map(cat => {
            const prods = grouped[cat.id] || [];
            if (!prods.length) return null;
            return (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <h2 className="text-xl sm:text-2xl font-black mb-3 gradient-text">{cat.nome}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prods.map(p => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      fav={favs.includes(p.id)}
                      onFav={(el) => toggleFav(p.id, el)}
                      onAdd={(el) => handleAddSimple(p, el)}
                      onOpen={() => setProdModal(p)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {!visiveis.length && (
            <div className="text-center py-20 text-white/50">Nenhum produto encontrado.</div>
          )}
        </section>

        <footer className="text-center text-white/40 text-xs pb-6">
          <p>{config.loja.endereco} • {config.loja.cidade}</p>
          <p>{config.loja.telefone} • {config.loja.instagram}</p>
          <p className="mt-2">© MH Lanches — Sistema ERP Delivery</p>
        </footer>
      </main>

      {/* Personalização */}
      {prodModal && (
        <ProdutoModal
          produto={prodModal}
          onClose={() => setProdModal(null)}
          onAdd={(item) => {
            addCart(item);
            sugerirBebida(prodModal);
            setProdModal(null);
          }}
        />
      )}

      {/* Sugestão de bebidas */}
      <Modal open={!!bebidasSug} onClose={() => setBebidasSug(null)} max="max-w-lg">
        <div className="p-5">
          <h3 className="text-2xl font-black gradient-text-cyan mb-1">Que tal uma bebida? 🥤</h3>
          <p className="text-white/60 text-sm mb-4">Combina perfeitamente com seu pedido!</p>
          <div className="grid grid-cols-2 gap-3">
            {bebidasSug?.map(b => (
              <div key={b.id} className="card p-3 text-center">
                {b.imagens[0] && <img src={b.imagens[0]} alt={b.nome} className="w-full h-24 object-cover rounded-lg mb-2" />}
                <div className="font-bold text-sm">{b.nome}</div>
                <div className="text-orange-400 font-black my-1">{fmt(b.preco)}</div>
                <button
                  onClick={() => {
                    addCart({ uid: uid(), produtoId: b.id, nome: b.nome, preco: b.preco, qtd: 1, imagem: b.imagens[0], totalLinha: b.preco });
                    setBebidasSug(null);
                  }}
                  className="btn-neon w-full !py-1.5 text-sm"
                >➕ Adicionar</button>
              </div>
            ))}
          </div>
          <button onClick={() => setBebidasSug(null)} className="btn-ghost w-full mt-4">Não, obrigado</button>
        </div>
      </Modal>

      {/* Carrinho */}
      <CarrinhoDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        subtotal={cartSubtotal}
        onUpdate={setCart}
        config={config}
        cupons={getCupons()}
        onPedidoEnviado={() => { setCart([]); setCartOpen(false); }}
        showToast={showToast}
        aberta={aberta}
      />

      {/* Status pedido */}
      <StatusPedidoModal open={statusOpen} onClose={() => setStatusOpen(false)} />

      <Toast msg={toast} />
    </div>
  );
}

// =================== Product Card ===================
function ProductCard({ p, fav, onFav, onAdd, onOpen }: {
  p: Produto; fav: boolean; onFav: (el: HTMLElement | null) => void;
  onAdd: (el: HTMLElement | null) => void; onOpen: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const heartRef = useRef<HTMLButtonElement>(null);
  const [popping, setPopping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="relative">
        {p.imagens[imgIdx] ? (
          <img ref={imgRef} src={p.imagens[imgIdx]} alt={p.nome} className="w-full h-44 object-cover cursor-pointer" onClick={onOpen} />
        ) : (
          <div className="w-full h-44 bg-white/5 flex items-center justify-center text-white/30 text-5xl">🍔</div>
        )}

        {/* badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.destaque && <Badge color="primary">⭐ Destaque</Badge>}
          {p.promocao && <Badge color="danger">🔥 Promoção</Badge>}
          {p.tempoPreparo && <Badge color="accent">⏱️ {p.tempoPreparo}min</Badge>}
          {p.pausado && <Badge color="warn">⏸️ Indisponível</Badge>}
        </div>

        <button
          ref={heartRef}
          onClick={() => { setPopping(true); onFav(heartRef.current); setTimeout(() => setPopping(false), 500); }}
          className={`absolute top-2 right-2 w-9 h-9 rounded-full glass-strong flex items-center justify-center text-lg ${popping ? "heart-pop" : ""}`}
        >
          {fav ? "❤️" : "🤍"}
        </button>

        <button
          onClick={() => onAdd(imgRef.current)}
          disabled={p.pausado}
          className="absolute bottom-2 right-2 btn-neon !w-10 !h-10 !p-0 rounded-full text-xl"
        >
          ＋
        </button>

        {/* indicators */}
        {p.imagens.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {p.imagens.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full ${i === imgIdx ? "bg-orange-400" : "bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-black text-base">{p.nome}</h3>
        <p className="text-white/60 text-xs mt-0.5 line-clamp-2 flex-1">{p.descricao}</p>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-xl font-black gradient-text">{fmt(p.preco)}</span>
          <span className="text-[10px] text-white/30">Imagem ilustrativa</span>
        </div>
      </div>
    </div>
  );
}

// =================== Modal Personalização ===================
function ProdutoModal({ produto, onClose, onAdd }: { produto: Produto; onClose: () => void; onAdd: (i: CartItem) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  // multi-escolha: counts por grupo/item
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  // meio a meio: 2 sabores selecionados
  const [meio, setMeio] = useState<{ id: string; nome: string; preco: number }[]>([]);

  const grupo0 = produto.grupos?.[0];

  const picks: CartOptionPick[] = useMemo(() => {
    if (!produto.grupos) return [];
    const out: CartOptionPick[] = [];
    for (const g of produto.grupos) {
      if (produto.meioMeio && g === grupo0) continue; // pizza usa metades
      const result = computePicks(g, counts[g.id] || {});
      result.forEach(r => { r.groupId = g.id; r.groupNome = g.nome; });
      out.push(...result);
    }
    return out;
  }, [produto, counts, grupo0]);

  const metades = produto.meioMeio && meio.length === 2 ? meio.map(m => ({ nome: m.nome, preco: m.preco })) : undefined;
  const total = calcLinha(produto, picks, qtd, metades);

  const inc = (gid: string, iid: string, max: number, freeLimit: number) => {
    setCounts(prev => {
      const g = { ...(prev[gid] || {}) };
      const cur = g[iid] || 0;
      if (cur >= max) return prev;
      g[iid] = cur + 1;
      return { ...prev, [gid]: g };
    });
    void freeLimit;
  };
  const dec = (gid: string, iid: string) => {
    setCounts(prev => {
      const g = { ...(prev[gid] || {}) };
      const cur = g[iid] || 0;
      if (cur <= 0) return prev;
      g[iid] = cur - 1;
      return { ...prev, [gid]: g };
    });
  };

  const groupTotal = (gid: string) => Object.values(counts[gid] || {}).reduce((s, n) => s + n, 0);

  const canAdd = produto.meioMeio ? meio.length === 2 : true;

  const handleAdd = () => {
    if (!canAdd) return;
    const item: CartItem = {
      uid: uid(), produtoId: produto.id, nome: produto.nome, preco: produto.preco, qtd, obs: obs.trim() || undefined,
      imagem: produto.imagens[0], picks: picks.length ? picks : undefined,
      metades, totalLinha: total,
    };
    onAdd(item);
  };

  return (
    <Modal open onClose={onClose} max="max-w-2xl">
      <div className="relative">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full glass-strong text-lg">✕</button>
        {produto.imagens[imgIdx] && (
          <img src={produto.imagens[imgIdx]} alt={produto.nome} className="w-full h-56 object-cover" />
        )}
        {produto.imagens.length > 1 && (
          <div className="absolute top-48 left-1/2 -translate-x-1/2 flex gap-1.5">
            {produto.imagens.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-2.5 h-2.5 rounded-full ${i === imgIdx ? "bg-orange-400" : "bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-2xl font-black">{produto.nome}</h2>
        <p className="text-white/70 text-sm mt-1">{produto.descricao}</p>
        <div className="text-2xl gradient-text font-black mt-2">A partir de {fmt(produto.preco)}</div>

        {/* Meio a Meio (pizza) */}
        {produto.meioMeio && grupo0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">🍕 Sabores (Meio a Meio)</h3>
              <span className={`text-xs font-bold ${meio.length === 2 ? "text-green-400" : "text-orange-400"}`}>{meio.length} / 2</span>
            </div>
            <p className="text-xs text-white/60 mb-2">{grupo0.regra}. Preço = sabor mais caro.</p>
            <div className="grid grid-cols-1 gap-2">
              {grupo0.itens.map(it => {
                const sel = meio.find(m => m.id === it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => {
                      if (sel) setMeio(meio.filter(m => m.id !== it.id));
                      else if (meio.length < 2) setMeio([...meio, { id: it.id, nome: it.nome, preco: it.preco }]);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border ${sel ? "bg-orange-500/15 border-orange-400" : "border-white/10 hover:border-orange-400/50"}`}
                  >
                    <span className="font-semibold">{it.nome}</span>
                    <span className="text-orange-300 font-bold">{fmt(it.preco)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Multi-escolha */}
        {produto.multiEscolha && produto.grupos?.map(g => {
          const total = groupTotal(g.id);
          const exceeded = total > g.freeLimit;
          return (
            <div key={g.id} className="mt-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">{g.nome}</h3>
                <span className={`text-xs font-bold ${exceeded ? "text-red-400" : "text-green-400"}`}>{total} / {g.freeLimit} grátis</span>
              </div>
              <p className="text-xs text-white/60 mb-2">{g.regra}</p>
              <div className="space-y-2">
                {g.itens.map(it => {
                  const c = counts[g.id]?.[it.id] || 0;
                  return (
                    <div key={it.id} className="flex items-center justify-between p-2.5 rounded-xl glass">
                      <div>
                        <div className="font-semibold text-sm">{it.nome}</div>
                        <div className="text-xs text-white/50">+ {fmt(it.preco)} (acima do limite)</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => dec(g.id, it.id)} className="w-8 h-8 rounded-full glass-strong text-lg disabled:opacity-30" disabled={c === 0}>−</button>
                        <span className="w-6 text-center font-black">{c}</span>
                        <button onClick={() => inc(g.id, it.id, it.maxRepeat, g.freeLimit)} className="w-8 h-8 rounded-full bg-orange-500/30 border border-orange-400 text-lg disabled:opacity-30" disabled={c >= it.maxRepeat}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quantidade + obs */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60">Quantidade</label>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setQtd(Math.max(1, qtd - 1))} className="btn-ghost !py-1 !px-3">−</button>
              <span className="text-2xl font-black w-8 text-center">{qtd}</span>
              <button onClick={() => setQtd(qtd + 1)} className="btn-ghost !py-1 !px-3">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">Observação</label>
            <input className="input mt-1" placeholder="Ex: sem cebola..." value={obs} onChange={e => setObs(e.target.value)} />
          </div>
        </div>

        <button onClick={handleAdd} disabled={!canAdd} className="btn-neon w-full mt-5 !py-3 text-lg">
          Adicionar — {fmt(total)}
        </button>
      </div>
    </Modal>
  );
}

// =================== Carrinho Drawer ===================
function CarrinhoDrawer({ open, onClose, items, subtotal, onUpdate, config, cupons, onPedidoEnviado, showToast, aberta }: {
  open: boolean; onClose: () => void; items: CartItem[]; subtotal: number;
  onUpdate: (c: CartItem[]) => void; config: ReturnType<typeof getConfig>; cupons: Cupom[];
  onPedidoEnviado: () => void; showToast: (s: string) => void; aberta: boolean;
}) {
  const [cupomCode, setCupomCode] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => { if (!open) { setCheckoutOpen(false); } }, [open]);

  const aplicarCupom = () => {
    setCupomErro("");
    const c = cupons.find(x => x.codigo.toLowerCase() === cupomCode.toLowerCase().trim() && x.ativo);
    if (!c) { setCupomErro("Cupom inválido."); return; }
    if (subtotal < c.valorMin) { setCupomErro(`Pedido mínimo ${fmt(c.valorMin)}.`); return; }
    if (new Date(c.validade) < new Date()) { setCupomErro("Cupom vencido."); return; }
    if (c.usados >= c.qtdTotal) { setCupomErro("Cupom esgotado."); return; }
    setCupomAplicado(c);
    setCupomCode("");
    showToast("✓ Cupom aplicado!");
  };

  const desconto = cupomAplicado
    ? cupomAplicado.tipo === "percentual" ? subtotal * (cupomAplicado.valor / 100)
      : cupomAplicado.tipo === "valor" ? cupomAplicado.valor : 0
    : 0;
  const total = subtotal - desconto;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 z-[81] w-full sm:w-[420px] glass-strong flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-black gradient-text">🛒 Seu Carrinho</h2>
          <button onClick={onClose} className="btn-ghost !p-2">✕</button>
        </div>

        {!items.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/50 p-8 text-center">
            <div className="text-6xl mb-3">🛒</div>
            <p>Seu carrinho está vazio</p>
            <button onClick={onClose} className="btn-neon mt-4">← Continuar comprando</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(it => (
                <div key={it.uid} className="card p-3 flex gap-3">
                  {it.imagem && <img src={it.imagem} className="w-16 h-16 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm">{it.qtd}x {it.nome}</div>
                      <button onClick={() => onUpdate(items.filter(x => x.uid !== it.uid))} className="text-red-400 text-xs">✕</button>
                    </div>
                    {it.metades && <div className="text-xs text-white/60">½ {it.metades.map(m => m.nome).join(" + ½ ")}</div>}
                    {it.picks?.map((p, i) => (
                      <div key={i} className="text-xs text-white/60">• {p.qtd}x {p.itemNome}{p.precoUnit > 0 ? ` (+${fmt(p.precoUnit * p.qtd)})` : ""}</div>
                    ))}
                    {it.obs && <div className="text-xs text-yellow-400">📝 {it.obs}</div>}
                    <div className="text-orange-400 font-black mt-1">{fmt(it.totalLinha)}</div>
                  </div>
                </div>
              ))}

              {/* Cupom */}
              <div className="card p-3">
                <div className="text-xs text-white/60 font-bold mb-2">🎫 CUPOM DE DESCONTO</div>
                {cupomAplicado ? (
                  <div className="flex items-center justify-between bg-green-500/15 border border-green-400/40 rounded-lg p-2">
                    <span className="text-green-300 font-bold text-sm">✓ {cupomAplicado.codigo}</span>
                    <button onClick={() => setCupomAplicado(null)} className="text-green-300 text-sm">✕</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input className="input" placeholder="Digite o código..." value={cupomCode} onChange={e => setCupomCode(e.target.value)} />
                      <button onClick={aplicarCupom} className="btn-ghost whitespace-nowrap">Aplicar</button>
                    </div>
                    {cupomErro && <div className="text-red-400 text-xs mt-1">{cupomErro}</div>}
                  </>
                )}
              </div>

              {/* Resumo */}
              <div className="card p-4 border-orange-500/30">
                <div className="flex justify-between text-sm mb-1"><span className="text-white/70">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-sm mb-1 text-green-400"><span>Desconto</span><span>− {fmt(desconto)}</span></div>}
                <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-white/10">
                  <span className="font-bold">TOTAL</span>
                  <span className="text-3xl font-black gradient-text">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 space-y-2">
              <button onClick={() => setCheckoutOpen(true)} disabled={!aberta} className="btn-neon btn-whats w-full !py-3 text-base">
                💬 {aberta ? "Continuar para WhatsApp" : "Loja Fechada"}
              </button>
              <button onClick={onClose} className="btn-ghost w-full">← Continuar comprando</button>
            </div>
          </>
        )}
      </aside>

      {checkoutOpen && (
        <CheckoutWizard
          items={items} subtotal={subtotal} desconto={desconto} cupom={cupomAplicado}
          config={config}
          onClose={() => setCheckoutOpen(false)}
          onSent={(p) => {
            // grava pedido localmente
            const all = getPedidos();
            setPedidos([p, ...all]);
            setPedidoAtivoId(p.id);
            trackFunil("pedido_enviado");
            // abre whatsapp
            const msg = encodeURIComponent(buildWhatsMsg(p, config));
            window.open(`https://wa.me/${config.loja.whatsapp}?text=${msg}`, "_blank");
            onPedidoEnviado();
            showToast("Pedido enviado! 🎉");
          }}
        />
      )}
    </>
  );
}

// =================== Checkout Wizard ===================
function CheckoutWizard({ items, subtotal, desconto, cupom, config, onClose, onSent }: {
  items: CartItem[]; subtotal: number; desconto: number; cupom: Cupom | null;
  config: ReturnType<typeof getConfig>; onClose: () => void; onSent: (p: Pedido) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<"entrega" | "retirada" | null>(null);
  const [pagamento, setPagamento] = useState<"dinheiro" | "cartao" | "pix" | "loja" | null>(null);
  const [precisaTroco, setPrecisaTroco] = useState<"sim" | "nao" | null>(null);
  const [troco, setTroco] = useState<string>("");
  const [cliente, setCliente] = useState("");
  const [endereco, setEndereco] = useState("");
  const [referencia, setReferencia] = useState("");

  const taxa = tipo === "entrega" ? (cupom?.tipo === "frete" ? 0 : config.delivery.taxa) : 0;
  const total = subtotal - desconto + taxa;
  const trocoNum = parseFloat(troco.replace(",", ".")) || 0;

  const erros: string[] = [];
  if (tipo === "entrega") {
    if (!cliente.trim()) erros.push("nome");
    if (!endereco.trim()) erros.push("endereço");
    if (!referencia.trim()) erros.push("referência");
    if (pagamento === "dinheiro" && precisaTroco === "sim") {
      if (!trocoNum || trocoNum <= total) erros.push("troco maior que total");
    }
    if (!pagamento) erros.push("forma de pagamento");
  }
  if (tipo === "retirada" && !pagamento) erros.push("forma de pagamento");

  const finalizar = () => {
    if (erros.length) return;
    const pedido: Pedido = {
      id: uid(), numero: nextNumero(), criadoEm: Date.now(), atualizadoEm: Date.now(),
      status: "novo", tipo: tipo!,
      cliente: cliente.trim() || undefined,
      endereco: endereco.trim() || undefined,
      referencia: referencia.trim() || undefined,
      itens: items, subtotal, desconto, taxa, total,
      cupomCodigo: cupom?.codigo,
      pagamento: pagamento ? {
        forma: pagamento,
        troco: pagamento === "dinheiro" && precisaTroco === "sim" ? trocoNum : undefined,
      } : undefined,
      origem: "site",
    };
    onSent(pedido);
  };

  return (
    <Modal open onClose={onClose} max="max-w-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black gradient-text">Finalizar Pedido</h2>
          <button onClick={onClose} className="btn-ghost !p-2">✕</button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Como prefere receber?</h3>
            <button
              onClick={() => { setTipo("retirada"); setStep(2); }}
              className="w-full card p-5 text-left hover:border-orange-500/50"
            >
              <div className="text-3xl mb-1">🏪</div>
              <div className="font-black text-lg">RETIRADA</div>
              <div className="text-white/60 text-sm">Buscar na loja • Sem taxa</div>
            </button>
            <button
              onClick={() => { setTipo("entrega"); setStep(2); }}
              className="w-full card p-5 text-left hover:border-cyan-400/50"
            >
              <div className="text-3xl mb-1">🛵</div>
              <div className="font-black text-lg">ENTREGA</div>
              <div className="text-white/60 text-sm">Taxa: {fmt(config.delivery.taxa)} • ~{config.delivery.tempoMedio}min</div>
            </button>
          </div>
        )}

        {step === 2 && tipo === "retirada" && (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">← Voltar</button>
            <div className="bg-green-500/15 border border-green-400/40 rounded-xl p-4 text-center">
              <div className="text-2xl">🏪 Retirada na loja</div>
              <div className="text-3xl font-black gradient-text mt-2">Total: {fmt(total)}</div>
              <div className="text-sm text-white/60 mt-1">Sem alteração — você retira na loja 😊</div>
            </div>
            <h3 className="font-bold">Forma de pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              <PagBtn icon="💵" label="Pagar na Loja" sel={pagamento === "loja"} onClick={() => setPagamento("loja")} />
              <PagBtn icon="📱" label="PIX" sel={pagamento === "pix"} onClick={() => setPagamento("pix")} />
            </div>
            {erros.length > 0 && <div className="text-orange-400 text-sm">⚠️ Selecione a forma de pagamento</div>}
            <button onClick={finalizar} disabled={!!erros.length} className="btn-neon btn-whats w-full !py-3">
              💬 Enviar via WhatsApp
            </button>
          </div>
        )}

        {step === 2 && tipo === "entrega" && (
          <div className="space-y-3">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">← Voltar</button>

            <div className="card p-4 border-orange-500/30">
              <div className="flex justify-between text-sm"><span>Produtos</span><span>{fmt(subtotal - desconto)}</span></div>
              <div className="flex justify-between text-sm"><span>Taxa entrega</span><span>{fmt(taxa)}</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-white/10 items-baseline">
                <span className="font-bold">TOTAL</span>
                <span className="text-2xl font-black gradient-text">{fmt(total)}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-3 text-sm text-yellow-100/90">
              🛵 Nossos valores são baseados na distância média. Se o seu endereço for muito longe, podemos precisar fazer um pequeno ajuste na taxa para que a entrega seja possível. Entraremos em contato se necessário! 😉
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold">👤 Nome completo <span className="text-red-400">*</span></label>
              <input className="input" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Seu nome" />
              <label className="text-xs font-bold">📍 Endereço completo <span className="text-red-400">*</span></label>
              <input className="input" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro" />
              <label className="text-xs font-bold">🚩 Ponto de referência <span className="text-red-400">*</span></label>
              <input className="input" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Próximo a..." />
            </div>

            <h3 className="font-bold mt-3">Pagamento</h3>
            <div className="grid grid-cols-3 gap-2">
              <PagBtn icon="💵" label="Dinheiro" sel={pagamento === "dinheiro"} onClick={() => setPagamento("dinheiro")} />
              <PagBtn icon="💳" label="Cartão" sel={pagamento === "cartao"} onClick={() => setPagamento("cartao")} />
              <PagBtn icon="📱" label="PIX" sel={pagamento === "pix"} onClick={() => setPagamento("pix")} />
            </div>

            {pagamento === "dinheiro" && (
              <div className="space-y-2">
                <div className="text-sm">Precisa de troco?</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPrecisaTroco("sim")} className={`btn-ghost ${precisaTroco === "sim" ? "border-orange-500 bg-orange-500/10" : ""}`}>SIM</button>
                  <button onClick={() => { setPrecisaTroco("nao"); setTroco(""); }} className={`btn-ghost ${precisaTroco === "nao" ? "border-orange-500 bg-orange-500/10" : ""}`}>NÃO</button>
                </div>
                {precisaTroco === "sim" && (
                  <>
                    <label className="text-xs font-bold">💸 Troco para quanto? (R$) <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" className="input" value={troco} onChange={e => setTroco(e.target.value)} placeholder={`> ${total.toFixed(2)}`} />
                    {trocoNum > 0 && trocoNum > total && <div className="text-xs text-green-400">Troco: {fmt(trocoNum - total)}</div>}
                  </>
                )}
              </div>
            )}

            {erros.length > 0 && <div className="text-orange-400 text-sm">⚠️ Preencha: {erros.join(", ")}</div>}

            <button onClick={finalizar} disabled={!!erros.length} className="btn-neon btn-whats w-full !py-3 text-base">
              💬 Enviar via WhatsApp
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PagBtn({ icon, label, sel, onClick }: { icon: string; label: string; sel: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`card p-3 text-center ${sel ? "border-orange-500 bg-orange-500/10 shadow-neon" : ""}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-xs font-bold mt-1">{label}</div>
    </button>
  );
}

// =================== Status Pedido Modal ===================
function StatusPedidoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pedidoId, setPedidoId] = useState<string | null>(getPedidoAtivoId());
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = getPedidoAtivoId();
    setPedidoId(id);
    if (id) {
      const all = [...getPedidos(), ...((window as any).getCancs?.() || [])];
      setPedido(all.find(p => p.id === id) || null);
    }
  }, [open]);

  // sync live
  useEffect(() => {
    const refresh = () => {
      const id = getPedidoAtivoId();
      setPedidoId(id);
      if (!id) { setPedido(null); return; }
      const all = getPedidos();
      const c = JSON.parse(localStorage.getItem("mh_cancelados") || "[]") as Pedido[];
      setPedido([...all, ...c].find(p => p.id === id) || null);
    };
    window.addEventListener("mh-sync", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("mh-sync", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!open) return null;

  const cancelado = pedido?.status === "cancelado";

  const steps: { key: Pedido["status"]; label: string; icon: string }[] = [
    { key: "novo", label: "Novo", icon: "📥" },
    { key: "producao", label: "Em Produção", icon: "🍳" },
    { key: "pronto", label: "Pronto", icon: "✅" },
    { key: "saiu", label: "Saiu p/ Entrega", icon: "🛵" },
    { key: "entregue", label: "Entregue", icon: "🎉" },
  ];
  const currentIdx = pedido ? steps.findIndex(s => s.key === pedido.status) : -1;

  return (
    <Modal open={open} onClose={onClose} max="max-w-lg">
      <div className={`p-5 ${cancelado ? "grayscale-[0.4] opacity-90" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black gradient-text">🛵 Status do Pedido</h2>
          <button onClick={onClose} className="btn-ghost !p-2">✕</button>
        </div>

        {!pedidoId || !pedido ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-white/60 mb-4">Nenhum pedido ativo</p>
            <button onClick={onClose} className="btn-neon">Ver cardápio</button>
          </div>
        ) : cancelado ? (
          <div className="text-center py-6">
            <div className="text-5xl font-black text-red-500 mb-4">Pedido Cancelado !</div>
            <p className="text-white/85 leading-relaxed">
              Caso não esteja ciente do motivo que levou ao cancelamento, favor entrar em contato com a nossa equipe. Aguardamos seu próximo pedido!
            </p>
            <button onClick={() => { setPedidoAtivoId(null); onClose(); }} className="btn-neon mt-6">Fechar</button>
          </div>
        ) : (
          <div>
            <div className="card p-4 text-center mb-4 border-orange-500/40">
              <div className="text-xs text-white/60">Pedido #{pedido.numero}</div>
              <div className="text-3xl mt-1">{steps[currentIdx]?.icon}</div>
              <div className="text-xl font-black gradient-text mt-1">{steps[currentIdx]?.label || pedido.status}</div>
            </div>

            <div className="relative pl-10 space-y-4 mb-5">
              {steps.map((s, i) => (
                <div key={s.key} className="relative">
                  <div className={`absolute -left-9 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                    i < currentIdx ? "bg-green-500/30 text-green-300 border border-green-400" :
                    i === currentIdx ? "bg-orange-500 text-white shadow-neon" :
                    "bg-white/5 text-white/30 border border-white/10"
                  }`}>{i + 1}</div>
                  {i < steps.length - 1 && (
                    <div className={`absolute -left-[26px] top-7 w-0.5 h-7 ${i < currentIdx ? "bg-green-500" : "bg-white/10"}`} />
                  )}
                  <div className={`text-sm font-semibold ${i === currentIdx ? "text-white" : "text-white/50"}`}>
                    {s.icon} {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-3 text-sm space-y-1">
              {pedido.cliente && <div><span className="text-white/50">Cliente:</span> <b>{pedido.cliente}</b></div>}
              {pedido.endereco && <div><span className="text-white/50">Endereço:</span> {pedido.endereco}</div>}
              <div><span className="text-white/50">Pagamento:</span> {pedido.pagamento?.forma || "-"}</div>
              <div><span className="text-white/50">Total:</span> <b className="gradient-text">{fmt(pedido.total)}</b></div>
            </div>

            <details className="card p-3 mt-2 text-sm">
              <summary className="cursor-pointer font-bold">📋 Itens do pedido</summary>
              <div className="mt-2 space-y-1">
                {pedido.itens.map(i => (
                  <div key={i.uid} className="text-white/80">{i.qtd}x {i.nome} — {fmt(i.totalLinha)}</div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </Modal>
  );
}
