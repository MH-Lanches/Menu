import { useEffect, useMemo, useState } from "react";
import {
  Produto, Categoria, Cupom, Config, Pedido, Anuncio,
  getConfig, setConfig, getProdutos, setProdutos, getCategorias, setCategorias,
  getCupons, setCupons, getPedidos, getVendas, getCancelados, getAnalytics,
  fmt, uid, useLive, applyTheme, LOGO_URL, DEFAULT_CONFIG,
} from "../store";
import { Orbs, Toast } from "../components/Common";

// ============== Login ==============
type Sess = { user: "admin" | "func"; ts: number } | null;
const SESS_KEY = "mh_session";
const TRY_KEY = "mh_login_try";

function getSess(): Sess {
  try {
    const s = JSON.parse(localStorage.getItem(SESS_KEY) || "null");
    if (!s) return null;
    if (Date.now() - s.ts > 7 * 3600_000) return null;
    return s;
  } catch { return null; }
}

export default function Admin() {
  const [sess, setSess] = useState<Sess>(getSess());
  const [config] = useLive(getConfig, ["config"]);
  useEffect(() => { applyTheme(config); }, [config]);

  if (!sess) return <Login onLogin={(s) => { localStorage.setItem(SESS_KEY, JSON.stringify(s)); setSess(s); }} />;

  return <Painel sess={sess} onLogout={() => { localStorage.removeItem(SESS_KEY); setSess(null); }} />;
}

function Login({ onLogin }: { onLogin: (s: NonNullable<Sess>) => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const tries = JSON.parse(localStorage.getItem(TRY_KEY) || "{\"n\":0,\"until\":0}");
    if (tries.until > Date.now()) {
      const min = Math.ceil((tries.until - Date.now()) / 60000);
      setErr(`Bloqueado por ${min} min.`); return;
    }
    if (user === "admin" && pass === "admin123") { localStorage.removeItem(TRY_KEY); onLogin({ user: "admin", ts: Date.now() }); return; }
    if (user === "func" && pass === "func123") { localStorage.removeItem(TRY_KEY); onLogin({ user: "func", ts: Date.now() }); return; }
    const n = (tries.n || 0) + 1;
    if (n >= 5) {
      localStorage.setItem(TRY_KEY, JSON.stringify({ n: 0, until: Date.now() + 15 * 60_000 }));
      setErr("Muitas tentativas. Bloqueado 15 min."); return;
    }
    localStorage.setItem(TRY_KEY, JSON.stringify({ n, until: 0 }));
    setErr(`Credenciais inválidas (${5 - n} tentativas restantes)`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Orbs />
      <div className="glass-strong rounded-2xl p-8 w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <img src={LOGO_URL} className="w-24 mx-auto logo-hero" />
          <h1 className="text-2xl font-black gradient-text mt-2">Admin MH Lanches</h1>
          <p className="text-white/60 text-sm">admin/admin123 • func/func123</p>
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} />
          <input className="input" placeholder="Senha" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button onClick={submit} className="btn-neon w-full">Entrar</button>
        </div>
      </div>
    </div>
  );
}

// ============== Painel ==============
type Tab = "dashboard" | "produtos" | "categorias" | "pedidos" | "cupons" | "relatorios" | "config";

function Painel({ sess, onLogout }: { sess: NonNullable<Sess>; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2000); };

  const allTabs: { id: Tab; label: string; icon: string; admin?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "produtos", label: "Produtos", icon: "📦" },
    { id: "categorias", label: "Categorias", icon: "🏷️" },
    { id: "pedidos", label: "Pedidos", icon: "📋" },
    { id: "cupons", label: "Cupons", icon: "🎫", admin: true },
    { id: "relatorios", label: "Relatórios", icon: "📈", admin: true },
    { id: "config", label: "Configurações", icon: "⚙️", admin: true },
  ];
  const tabs = allTabs.filter(t => !t.admin || sess.user === "admin");

  return (
    <div className="min-h-screen flex relative">
      <Orbs />
      {/* Sidebar */}
      <aside className="w-64 glass-strong border-r border-white/10 flex flex-col relative z-10">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <img src={LOGO_URL} className="w-10 h-10 logo-hero" />
          <div>
            <div className="font-black gradient-text">MH Admin</div>
            <div className="text-xs text-white/50">{sess.user.toUpperCase()}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition ${
                tab === t.id ? "bg-gradient-to-r from-orange-500/30 to-pink-500/20 border border-orange-500/40 shadow-neon" : "hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <a href="#/site" className="btn-ghost w-full text-sm">🌐 Ver Site</a>
          <a href="#/pdv" className="btn-ghost w-full text-sm">💰 PDV</a>
          <button onClick={onLogout} className="btn-danger w-full text-sm">🚪 Sair</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "produtos" && <ProdutosTab showToast={showToast} />}
        {tab === "categorias" && <CategoriasTab showToast={showToast} />}
        {tab === "pedidos" && <PedidosTab />}
        {tab === "cupons" && <CuponsTab showToast={showToast} />}
        {tab === "relatorios" && <RelatoriosTab />}
        {tab === "config" && <ConfigTab showToast={showToast} />}
      </main>

      <Toast msg={toast} />
    </div>
  );
}

// ============== Dashboard ==============
function Dashboard() {
  const [pedidos] = useLive(getPedidos, ["pedidos"]);
  const [vendas] = useLive(getVendas, ["vendas"]);
  const [cancs] = useLive(getCancelados, ["cancelados"]);
  const analytics = getAnalytics();

  const hojeIni = new Date(); hojeIni.setHours(0, 0, 0, 0);
  const semIni = new Date(hojeIni); semIni.setDate(semIni.getDate() - 7);
  const mesIni = new Date(hojeIni); mesIni.setDate(1);

  const fat = (arr: Pedido[], from: Date) => arr.filter(p => p.criadoEm >= from.getTime()).reduce((s, p) => s + p.total, 0);
  const all = [...vendas, ...pedidos];
  const fatHoje = fat(all, hojeIni);
  const fatSem = fat(all, semIni);
  const fatMes = fat(all, mesIni);
  const ticket = vendas.length ? vendas.reduce((s, p) => s + p.total, 0) / vendas.length : 0;
  const cancPct = (vendas.length + cancs.length) > 0 ? (cancs.length / (vendas.length + cancs.length)) * 100 : 0;

  const carrinhos = analytics.funil.carrinho_aberto || 0;
  const enviados = analytics.funil.pedido_enviado || 0;
  const conv = carrinhos > 0 ? (enviados / carrinhos) * 100 : 0;

  const visitsHoje = analytics.visitas.filter(v => v.ts >= hojeIni.getTime()).length;

  // Top 5 produtos
  const topMap: Record<string, { nome: string; qtd: number; tot: number }> = {};
  vendas.forEach(v => v.itens.forEach(i => {
    if (!topMap[i.produtoId]) topMap[i.produtoId] = { nome: i.nome, qtd: 0, tot: 0 };
    topMap[i.produtoId].qtd += i.qtd;
    topMap[i.produtoId].tot += i.totalLinha;
  }));
  const top5 = Object.values(topMap).sort((a, b) => b.qtd - a.qtd).slice(0, 5);

  // Picos
  const picos = analytics.picos;
  const maxPico = Math.max(1, ...Object.values(picos));

  return (
    <div>
      <h1 className="text-3xl font-black gradient-text mb-6">📊 Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="💰 Hoje" v={fmt(fatHoje)} />
        <KPI label="📅 Semana" v={fmt(fatSem)} />
        <KPI label="🗓 Mês" v={fmt(fatMes)} />
        <KPI label="🎯 Ticket Médio" v={fmt(ticket)} />
        <KPI label="❌ Cancelados" v={`${cancs.length} (${cancPct.toFixed(1)}%)`} />
        <KPI label="📈 Conversão" v={`${conv.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">⏰ Horários de Pico</h3>
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 24 }, (_, h) => h).map(h => {
              const v = picos[h] || 0;
              return (
                <div key={h} className="flex-1 flex flex-col items-center justify-end">
                  <div className="bg-gradient-to-t from-orange-500 to-pink-500 w-full rounded-t" style={{ height: `${(v / maxPico) * 100}%`, minHeight: v ? 4 : 0 }} />
                  <div className="text-[10px] text-white/40 mt-1">{h}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">🏆 Top 5 Produtos</h3>
          {top5.length ? (
            <div className="space-y-2">
              {top5.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{i + 1}. {p.nome}</span>
                  <span><b>{p.qtd}</b> un · <span className="text-orange-400">{fmt(p.tot)}</span></span>
                </div>
              ))}
            </div>
          ) : <div className="text-white/40 text-sm">Nenhuma venda registrada ainda.</div>}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">📋 Últimos pedidos</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {pedidos.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                <span>#{p.numero} • {p.cliente || p.tipo}</span>
                <span className={`status-${p.status} text-xs px-2 py-0.5 rounded`}>{p.status}</span>
                <span className="text-orange-400 font-bold">{fmt(p.total)}</span>
              </div>
            ))}
            {!pedidos.length && <div className="text-white/40 text-sm">Sem pedidos ativos.</div>}
          </div>
          <div className="text-xs text-white/40 mt-2">Visitas hoje: {visitsHoje}</div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, v }: { label: string; v: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-xl font-black gradient-text mt-1">{v}</div>
    </div>
  );
}

// ============== Produtos ==============
function ProdutosTab({ showToast }: { showToast: (s: string) => void }) {
  const [produtos, refresh] = useLive(getProdutos, ["produtos"]);
  const [cats] = useLive(getCategorias, ["categorias"]);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [busca, setBusca] = useState("");

  const filtered = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const novo = (): Produto => ({
    id: uid(), nome: "Novo produto", descricao: "", preco: 0,
    categoria: cats[0]?.id || "", imagens: [], ordem: produtos.length + 1,
  });

  const remover = (id: string) => {
    if (!confirm("Remover este produto?")) return;
    setProdutos(produtos.filter(p => p.id !== id));
    showToast("Produto removido");
    refresh();
  };

  const move = (id: string, dir: -1 | 1) => {
    const arr = [...produtos];
    const i = arr.findIndex(p => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((p, idx) => p.ordem = idx + 1);
    setProdutos(arr);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-black gradient-text">📦 Produtos ({produtos.length})</h1>
        <button onClick={() => setEditing(novo())} className="btn-neon">➕ Novo Produto</button>
      </div>

      <input className="input mb-4 max-w-sm" placeholder="🔎 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="card p-3 flex gap-3">
            {p.imagens[0] ? (
              <img src={p.imagens[0]} className="w-20 h-20 rounded-lg object-cover" />
            ) : <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center text-3xl">🍔</div>}
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{p.nome}</div>
              <div className="text-xs text-white/50 truncate">{cats.find(c => c.id === p.categoria)?.nome}</div>
              <div className="text-orange-400 font-black">{fmt(p.preco)}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {p.destaque && <span className="text-[9px] bg-orange-500/30 px-1.5 rounded">⭐</span>}
                {p.promocao && <span className="text-[9px] bg-red-500/30 px-1.5 rounded">🔥</span>}
                {p.pausado && <span className="text-[9px] bg-yellow-500/30 px-1.5 rounded">⏸️</span>}
                {p.multiEscolha && <span className="text-[9px] bg-cyan-500/30 px-1.5 rounded">multi</span>}
                {p.meioMeio && <span className="text-[9px] bg-purple-500/30 px-1.5 rounded">½</span>}
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => setEditing({ ...p })} className="btn-ghost !py-1 !px-2 text-xs">✏️</button>
                <button onClick={() => move(p.id, -1)} className="btn-ghost !py-1 !px-2 text-xs">▲</button>
                <button onClick={() => move(p.id, 1)} className="btn-ghost !py-1 !px-2 text-xs">▼</button>
                <button onClick={() => remover(p.id)} className="btn-danger !py-1 !px-2 text-xs">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProdutoEditor
          produto={editing}
          cats={cats}
          allProds={produtos}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            const exists = produtos.find(x => x.id === p.id);
            const arr = exists ? produtos.map(x => x.id === p.id ? p : x) : [...produtos, p];
            setProdutos(arr);
            setEditing(null);
            showToast("✓ Produto salvo");
          }}
        />
      )}
    </div>
  );
}

function ProdutoEditor({ produto, cats, allProds, onClose, onSave }: {
  produto: Produto; cats: Categoria[]; allProds: Produto[];
  onClose: () => void; onSave: (p: Produto) => void;
}) {
  const [p, setP] = useState<Produto>({ ...produto, grupos: produto.grupos || [], imagens: produto.imagens || [], bebidasSugeridas: produto.bebidasSugeridas || [] });
  const update = <K extends keyof Produto>(k: K, v: Produto[K]) => setP(s => ({ ...s, [k]: v }));

  const onUploadImg = async (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      // simple compress via canvas
      const img = new Image();
      img.onload = () => {
        const cfg = getConfig();
        const max = cfg.visual.imgMaxWidth || 1024;
        const scale = Math.min(1, max / img.width);
        const w = img.width * scale, h = img.height * scale;
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const data = cv.toDataURL("image/webp", 0.85);
        update("imagens", [...p.imagens, data]);
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  };

  const addGrupo = () => update("grupos", [...(p.grupos || []), { id: uid(), nome: "Novo grupo", regra: "Escolha", freeLimit: 1, itens: [] }]);
  const delGrupo = (gid: string) => update("grupos", (p.grupos || []).filter(g => g.id !== gid));
  const updGrupo = (gid: string, patch: Partial<NonNullable<Produto["grupos"]>[number]>) => update("grupos", (p.grupos || []).map(g => g.id === gid ? { ...g, ...patch } : g));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card !max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black gradient-text">{produto.nome === "Novo produto" ? "Novo Produto" : "Editar Produto"}</h2>
            <button onClick={onClose} className="btn-ghost !p-2">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome"><input className="input" value={p.nome} onChange={e => update("nome", e.target.value)} /></Field>
            <Field label="Preço (R$)"><input type="number" step="0.01" className="input" value={p.preco} onChange={e => update("preco", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Categoria">
              <select className="select" value={p.categoria} onChange={e => update("categoria", e.target.value)}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label="Tempo preparo (min)"><input type="number" className="input" value={p.tempoPreparo || 0} onChange={e => update("tempoPreparo", parseInt(e.target.value) || 0)} /></Field>
          </div>
          <Field label="Descrição"><textarea className="textarea" rows={3} value={p.descricao} onChange={e => update("descricao", e.target.value)} /></Field>

          <div className="flex gap-3 flex-wrap mt-3">
            <Toggle label="⭐ Destaque" v={!!p.destaque} on={v => update("destaque", v)} />
            <Toggle label="🔥 Promoção" v={!!p.promocao} on={v => update("promocao", v)} />
            <Toggle label="⏸️ Pausado" v={!!p.pausado} on={v => update("pausado", v)} />
            <Toggle label="🍕 Meio a Meio" v={!!p.meioMeio} on={v => update("meioMeio", v)} />
            <Toggle label="🥟 Multi-escolha" v={!!p.multiEscolha} on={v => update("multiEscolha", v)} />
          </div>

          {/* Imagens */}
          <div className="mt-4">
            <label className="text-xs font-bold text-white/60">Imagens</label>
            <div className="flex gap-2 flex-wrap mt-2">
              {p.imagens.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={img} className={`w-full h-full object-cover rounded-lg ${i === 0 ? "ring-2 ring-orange-400" : ""}`} />
                  <button onClick={() => update("imagens", p.imagens.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs">✕</button>
                  {i !== 0 && <button onClick={() => { const a = [...p.imagens]; [a[0], a[i]] = [a[i], a[0]]; update("imagens", a); }} className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] py-0.5">Capa</button>}
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400">
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUploadImg(e.target.files[0])} />
                <span className="text-2xl">+</span>
              </label>
              <input className="input flex-1 min-w-[200px]" placeholder="Cole URL e Enter" onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { update("imagens", [...p.imagens, v]); (e.target as HTMLInputElement).value = ""; }
                }
              }} />
            </div>
          </div>

          {/* Grupos opções */}
          {(p.multiEscolha || p.meioMeio) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white/60">Grupos de Opções</label>
                <button onClick={addGrupo} className="btn-ghost !py-1 !px-2 text-xs">➕ Grupo</button>
              </div>
              <div className="space-y-3">
                {(p.grupos || []).map(g => (
                  <div key={g.id} className="card p-3">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input className="input" placeholder="Nome (Sabores)" value={g.nome} onChange={e => updGrupo(g.id, { nome: e.target.value })} />
                      <input className="input" placeholder="Regra (Escolha 5 grátis)" value={g.regra} onChange={e => updGrupo(g.id, { regra: e.target.value })} />
                      <input type="number" className="input" placeholder="Grátis" value={g.freeLimit} onChange={e => updGrupo(g.id, { freeLimit: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1">
                      {g.itens.map((it, ii) => (
                        <div key={it.id} className="grid grid-cols-12 gap-1">
                          <input className="input col-span-5" placeholder="Item" value={it.nome} onChange={e => updGrupo(g.id, { itens: g.itens.map((x, k) => k === ii ? { ...x, nome: e.target.value } : x) })} />
                          <input type="number" step="0.01" className="input col-span-3" placeholder="Preço" value={it.preco} onChange={e => updGrupo(g.id, { itens: g.itens.map((x, k) => k === ii ? { ...x, preco: parseFloat(e.target.value) || 0 } : x) })} />
                          <input type="number" className="input col-span-2" placeholder="Max" value={it.maxRepeat} onChange={e => updGrupo(g.id, { itens: g.itens.map((x, k) => k === ii ? { ...x, maxRepeat: parseInt(e.target.value) || 1 } : x) })} />
                          <button onClick={() => updGrupo(g.id, { itens: g.itens.filter((_, k) => k !== ii) })} className="btn-danger col-span-2 text-xs">✕</button>
                        </div>
                      ))}
                      <button onClick={() => updGrupo(g.id, { itens: [...g.itens, { id: uid(), nome: "Item", preco: 0, maxRepeat: 1 }] })} className="btn-ghost !py-1 text-xs w-full">+ Item</button>
                    </div>
                    <button onClick={() => delGrupo(g.id)} className="btn-danger w-full mt-2 text-xs">Remover grupo</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bebidas sugeridas */}
          <div className="mt-4">
            <label className="text-xs font-bold text-white/60">🥤 Bebidas Sugeridas</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {allProds.filter(x => x.id !== p.id).map(b => {
                const sel = p.bebidasSugeridas?.includes(b.id);
                return (
                  <button key={b.id} onClick={() => {
                    const arr = p.bebidasSugeridas || [];
                    update("bebidasSugeridas", sel ? arr.filter(x => x !== b.id) : [...arr, b.id]);
                  }} className={`text-xs px-2 py-1 rounded-full border ${sel ? "bg-orange-500/30 border-orange-400" : "border-white/15"}`}>
                    {b.nome}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => onSave(p)} className="btn-neon w-full mt-4">💾 Salvar Produto</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-bold text-white/60 block mb-1">{label}</label>{children}</div>;
}
function Toggle({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return <button onClick={() => on(!v)} className={`px-3 py-1.5 rounded-full border text-xs ${v ? "bg-orange-500/30 border-orange-400 text-orange-200" : "border-white/15 text-white/60"}`}>{label}</button>;
}

// ============== Categorias ==============
function CategoriasTab({ showToast }: { showToast: (s: string) => void }) {
  const [cats, refresh] = useLive(getCategorias, ["categorias"]);
  const [novo, setNovo] = useState("");

  const add = () => {
    if (!novo.trim()) return;
    setCategorias([...cats, { id: uid(), nome: novo.trim(), ordem: cats.length + 1 }]);
    setNovo(""); showToast("Categoria criada"); refresh();
  };
  const move = (id: string, dir: -1 | 1) => {
    const arr = [...cats]; const i = arr.findIndex(c => c.id === id); const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((c, k) => c.ordem = k + 1);
    setCategorias(arr);
  };
  const upd = (id: string, nome: string) => setCategorias(cats.map(c => c.id === id ? { ...c, nome } : c));
  const del = (id: string) => { if (confirm("Remover?")) setCategorias(cats.filter(c => c.id !== id)); };

  return (
    <div>
      <h1 className="text-3xl font-black gradient-text mb-6">🏷️ Categorias</h1>
      <div className="card p-4 mb-4 flex gap-2">
        <input className="input" placeholder="Nova categoria (ex: 🍔 Lanches)" value={novo} onChange={e => setNovo(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button onClick={add} className="btn-neon whitespace-nowrap">➕ Adicionar</button>
      </div>
      <div className="space-y-2 max-w-xl">
        {cats.sort((a, b) => a.ordem - b.ordem).map(c => (
          <div key={c.id} className="card p-3 flex items-center gap-2">
            <input className="input flex-1" value={c.nome} onChange={e => upd(c.id, e.target.value)} />
            <button onClick={() => move(c.id, -1)} className="btn-ghost !py-1 !px-2">▲</button>
            <button onClick={() => move(c.id, 1)} className="btn-ghost !py-1 !px-2">▼</button>
            <button onClick={() => del(c.id)} className="btn-danger !py-1 !px-2">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Pedidos ==============
function PedidosTab() {
  const [tab, setTab] = useState<"ativos" | "vendas" | "cancelados">("ativos");
  const [pedidos] = useLive(getPedidos, ["pedidos"]);
  const [vendas] = useLive(getVendas, ["vendas"]);
  const [cancs] = useLive(getCancelados, ["cancelados"]);

  const lista = tab === "ativos" ? pedidos : tab === "vendas" ? vendas : cancs;

  return (
    <div>
      <h1 className="text-3xl font-black gradient-text mb-4">📋 Pedidos</h1>
      <div className="flex gap-2 mb-4">
        {[["ativos", `Ativos (${pedidos.length})`], ["vendas", `Vendas (${vendas.length})`], ["cancelados", `Cancelados (${cancs.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === k ? "btn-neon !py-2" : "btn-ghost"}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {lista.map(p => (
          <div key={p.id} className="card p-3 flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-white/50">#{p.numero}</div>
              <span className={`status-${p.status} text-xs px-2 py-0.5 rounded`}>{p.status}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold">{p.cliente || p.tipo} • {p.tipo}</div>
              <div className="text-xs text-white/50">{p.itens.length} itens · {new Date(p.criadoEm).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-black">{fmt(p.total)}</div>
            </div>
          </div>
        ))}
        {!lista.length && <div className="text-white/40 text-center py-10">Nenhum pedido.</div>}
      </div>
    </div>
  );
}

// ============== Cupons ==============
function CuponsTab({ showToast }: { showToast: (s: string) => void }) {
  const [cupons, refresh] = useLive(getCupons, ["cupons"]);
  const novo = (): Cupom => ({ id: uid(), codigo: "NOVO", tipo: "percentual", valor: 10, qtdTotal: 100, usados: 0, valorMin: 0, validade: "2030-12-31", ativo: true });
  const add = () => { setCupons([...cupons, novo()]); refresh(); };
  const upd = (id: string, patch: Partial<Cupom>) => setCupons(cupons.map(c => c.id === id ? { ...c, ...patch } : c));
  const del = (id: string) => { if (confirm("Remover?")) { setCupons(cupons.filter(c => c.id !== id)); showToast("Removido"); } };

  return (
    <div>
      <div className="flex justify-between mb-5">
        <h1 className="text-3xl font-black gradient-text">🎫 Cupons</h1>
        <button onClick={add} className="btn-neon">➕ Novo Cupom</button>
      </div>
      <div className="space-y-3">
        {cupons.map(c => (
          <div key={c.id} className="card p-3 grid grid-cols-12 gap-2 items-center">
            <input className="input col-span-2" value={c.codigo} onChange={e => upd(c.id, { codigo: e.target.value.toUpperCase() })} />
            <select className="select col-span-2" value={c.tipo} onChange={e => upd(c.id, { tipo: e.target.value as any })}>
              <option value="percentual">% Percentual</option>
              <option value="valor">R$ Valor fixo</option>
              <option value="frete">🚚 Frete grátis</option>
            </select>
            <input type="number" className="input col-span-1" placeholder="Valor" value={c.valor} onChange={e => upd(c.id, { valor: parseFloat(e.target.value) || 0 })} />
            <input type="number" className="input col-span-1" placeholder="Min" value={c.valorMin} onChange={e => upd(c.id, { valorMin: parseFloat(e.target.value) || 0 })} />
            <input type="number" className="input col-span-1" placeholder="Qtd" value={c.qtdTotal} onChange={e => upd(c.id, { qtdTotal: parseInt(e.target.value) || 0 })} />
            <input type="date" className="input col-span-2" value={c.validade} onChange={e => upd(c.id, { validade: e.target.value })} />
            <button onClick={() => upd(c.id, { ativo: !c.ativo })} className={`col-span-1 px-2 py-1 rounded text-xs ${c.ativo ? "bg-green-500/30 text-green-300" : "bg-white/10 text-white/50"}`}>{c.ativo ? "Ativo" : "Inativo"}</button>
            <button onClick={() => del(c.id)} className="btn-danger col-span-2 text-xs">🗑 Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Relatórios ==============
function RelatoriosTab() {
  const [vendas] = useLive(getVendas, ["vendas"]);
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes" | "ano" | "tudo">("mes");

  const from = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (periodo === "semana") d.setDate(d.getDate() - 7);
    if (periodo === "mes") d.setDate(1);
    if (periodo === "ano") { d.setMonth(0); d.setDate(1); }
    if (periodo === "tudo") return new Date(0);
    return d;
  }, [periodo]);

  const filtered = vendas.filter(v => v.criadoEm >= from.getTime());
  const total = filtered.reduce((s, v) => s + v.total, 0);
  const ticket = filtered.length ? total / filtered.length : 0;
  const desc = filtered.reduce((s, v) => s + v.desconto, 0);

  const ranking: Record<string, { nome: string; qtd: number; tot: number }> = {};
  filtered.forEach(v => v.itens.forEach(i => {
    if (!ranking[i.produtoId]) ranking[i.produtoId] = { nome: i.nome, qtd: 0, tot: 0 };
    ranking[i.produtoId].qtd += i.qtd; ranking[i.produtoId].tot += i.totalLinha;
  }));
  const top = Object.values(ranking).sort((a, b) => b.qtd - a.qtd);

  const exportar = () => {
    const csv = "Numero,Data,Cliente,Tipo,Total\n" +
      filtered.map(v => `${v.numero},${new Date(v.criadoEm).toISOString()},${v.cliente || "-"},${v.tipo},${v.total}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "vendas.csv"; a.click();
  };

  return (
    <div>
      <h1 className="text-3xl font-black gradient-text mb-5">📈 Relatórios</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["hoje", "semana", "mes", "ano", "tudo"].map(p => (
          <button key={p} onClick={() => setPeriodo(p as any)} className={`px-4 py-2 rounded-xl text-sm font-bold ${periodo === p ? "btn-neon !py-2" : "btn-ghost"}`}>{p.toUpperCase()}</button>
        ))}
        <button onClick={exportar} className="btn-ghost ml-auto">⬇️ Exportar CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI label="Vendas" v={String(filtered.length)} />
        <KPI label="Faturamento" v={fmt(total)} />
        <KPI label="Ticket Médio" v={fmt(ticket)} />
        <KPI label="Descontos" v={fmt(desc)} />
      </div>

      <div className="card p-5">
        <h3 className="font-bold mb-3">🏆 Ranking de produtos</h3>
        {top.length ? (
          <div className="space-y-1">
            {top.map((p, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                <span>{i + 1}. {p.nome}</span>
                <span><b>{p.qtd}</b> un · <span className="text-orange-400">{fmt(p.tot)}</span></span>
              </div>
            ))}
          </div>
        ) : <div className="text-white/40">Nenhuma venda no período.</div>}
      </div>
    </div>
  );
}

// ============== Configurações ==============
function ConfigTab({ showToast }: { showToast: (s: string) => void }) {
  const [cfg, setCfg] = useState<Config>(() => getConfig());
  const [sub, setSub] = useState<"loja" | "visual" | "delivery" | "anuncios" | "horarios" | "impressora" | "whats" | "firebase" | "backup">("loja");

  const save = () => { setConfig(cfg); applyTheme(cfg); showToast("✓ Configurações salvas"); };
  const upd = (path: string[], val: any) => {
    setCfg(prev => {
      const c: any = { ...prev };
      let o = c;
      for (let i = 0; i < path.length - 1; i++) { o[path[i]] = { ...o[path[i]] }; o = o[path[i]]; }
      o[path[path.length - 1]] = val;
      return c;
    });
  };

  const subs = [
    ["loja", "🏪 Loja"], ["visual", "🎨 Visual"], ["delivery", "🛵 Delivery"],
    ["anuncios", "📢 Anúncios"], ["horarios", "🕐 Horários"],
    ["impressora", "🖨️ Impressora"], ["whats", "💬 WhatsApp"],
    ["firebase", "🔥 Firebase"], ["backup", "💾 Backup"],
  ] as const;

  return (
    <div>
      <div className="flex justify-between mb-5">
        <h1 className="text-3xl font-black gradient-text">⚙️ Configurações</h1>
        <button onClick={save} className="btn-neon">💾 Salvar Tudo</button>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {subs.map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${sub === k ? "btn-neon !py-1.5" : "btn-ghost"}`}>{l}</button>
        ))}
      </div>

      <div className="card p-5 space-y-3">
        {sub === "loja" && (
          <>
            <Field label="Nome"><input className="input" value={cfg.loja.nome} onChange={e => upd(["loja", "nome"], e.target.value)} /></Field>
            <Field label="Slogan"><input className="input" value={cfg.loja.slogan} onChange={e => upd(["loja", "slogan"], e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone"><input className="input" value={cfg.loja.telefone} onChange={e => upd(["loja", "telefone"], e.target.value)} /></Field>
              <Field label="WhatsApp (DDI+DDD+nº)"><input className="input" value={cfg.loja.whatsapp} onChange={e => upd(["loja", "whatsapp"], e.target.value)} /></Field>
              <Field label="Endereço"><input className="input" value={cfg.loja.endereco} onChange={e => upd(["loja", "endereco"], e.target.value)} /></Field>
              <Field label="Cidade"><input className="input" value={cfg.loja.cidade} onChange={e => upd(["loja", "cidade"], e.target.value)} /></Field>
              <Field label="Instagram"><input className="input" value={cfg.loja.instagram} onChange={e => upd(["loja", "instagram"], e.target.value)} /></Field>
              <Field label="Facebook"><input className="input" value={cfg.loja.facebook} onChange={e => upd(["loja", "facebook"], e.target.value)} /></Field>
            </div>
            <Field label="Sobre nós"><textarea className="textarea" rows={3} value={cfg.loja.sobre} onChange={e => upd(["loja", "sobre"], e.target.value)} /></Field>
          </>
        )}

        {sub === "visual" && (
          <>
            <div className="flex items-center gap-4">
              <img src={cfg.visual.logoUrl} className="logo-hero w-24 h-24 object-contain" />
              <div className="flex-1 space-y-2">
                <input className="input" value={cfg.visual.logoUrl} onChange={e => upd(["visual", "logoUrl"], e.target.value)} placeholder="URL da logo" />
                <div className="flex gap-2">
                  <label className="btn-ghost cursor-pointer text-sm">📁 Upload<input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onload = () => upd(["visual", "logoUrl"], r.result as string); r.readAsDataURL(f);
                  }} /></label>
                  <button onClick={() => upd(["visual", "logoUrl"], LOGO_URL)} className="btn-ghost text-sm">↺ Restaurar Padrão</button>
                  <button onClick={() => upd(["visual", "logoUrl"], "")} className="btn-danger text-sm">✕ Remover</button>
                </div>
              </div>
            </div>
            <Field label="🏷️ Texto acima dos anúncios">
              <input className="input" value={cfg.loja.textoHero} onChange={e => upd(["loja", "textoHero"], e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(cfg.visual.cores).map(([k, v]) => (
                <Field key={k} label={k}>
                  <div className="flex gap-2">
                    <input type="color" value={v.startsWith("rgba") ? "#ffffff" : v} onChange={e => upd(["visual", "cores", k], e.target.value)} className="w-12 h-10 rounded" />
                    <input className="input" value={v} onChange={e => upd(["visual", "cores", k], e.target.value)} />
                  </div>
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Largura máx imagem (px)"><input type="number" className="input" value={cfg.visual.imgMaxWidth} onChange={e => upd(["visual", "imgMaxWidth"], parseInt(e.target.value) || 1024)} /></Field>
              <Field label="Peso alvo (KB)"><input type="number" className="input" value={cfg.visual.imgTargetKB} onChange={e => upd(["visual", "imgTargetKB"], parseInt(e.target.value) || 250)} /></Field>
            </div>
          </>
        )}

        {sub === "delivery" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Taxa entrega (R$)"><input type="number" step="0.01" className="input" value={cfg.delivery.taxa} onChange={e => upd(["delivery", "taxa"], parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Pedido mínimo (R$)"><input type="number" step="0.01" className="input" value={cfg.delivery.valorMin} onChange={e => upd(["delivery", "valorMin"], parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Tempo médio (min)"><input type="number" className="input" value={cfg.delivery.tempoMedio} onChange={e => upd(["delivery", "tempoMedio"], parseInt(e.target.value) || 0)} /></Field>
            <Field label="Raio entrega (km)"><input type="number" step="0.1" className="input" value={cfg.delivery.raio} onChange={e => upd(["delivery", "raio"], parseFloat(e.target.value) || 0)} /></Field>
          </div>
        )}

        {sub === "anuncios" && (
          <div className="space-y-2">
            {cfg.anuncios.map((a, i) => (
              <div key={a.id} className="flex gap-2">
                <input className="input flex-1" value={a.texto} onChange={e => upd(["anuncios"], cfg.anuncios.map((x, j) => j === i ? { ...x, texto: e.target.value } : x))} />
                <button onClick={() => upd(["anuncios"], cfg.anuncios.map((x, j) => j === i ? { ...x, ativo: !x.ativo } : x))} className={`px-3 rounded ${a.ativo ? "bg-green-500/30" : "bg-white/10"}`}>{a.ativo ? "✓" : "✕"}</button>
                <button onClick={() => upd(["anuncios"], cfg.anuncios.filter((_, j) => j !== i))} className="btn-danger !px-3">🗑</button>
              </div>
            ))}
            <button onClick={() => upd(["anuncios"], [...cfg.anuncios, { id: uid(), texto: "Novo anúncio", ativo: true } as Anuncio])} className="btn-ghost w-full">➕ Anúncio</button>
          </div>
        )}

        {sub === "horarios" && (
          <div className="space-y-2">
            {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-2 font-bold text-sm">{d}</span>
                <button onClick={() => upd(["horarios", "dias"], cfg.horarios.dias.map((x, j) => j === i ? { ...x, fechado: !x.fechado } : x))} className={`col-span-2 px-3 py-2 rounded ${cfg.horarios.dias[i].fechado ? "bg-red-500/30" : "bg-green-500/30"}`}>
                  {cfg.horarios.dias[i].fechado ? "Fechado" : "Aberto"}
                </button>
                <input type="time" className="input col-span-3" value={cfg.horarios.dias[i].abre} onChange={e => upd(["horarios", "dias"], cfg.horarios.dias.map((x, j) => j === i ? { ...x, abre: e.target.value } : x))} disabled={cfg.horarios.dias[i].fechado} />
                <span className="col-span-1 text-center">→</span>
                <input type="time" className="input col-span-3" value={cfg.horarios.dias[i].fecha} onChange={e => upd(["horarios", "dias"], cfg.horarios.dias.map((x, j) => j === i ? { ...x, fecha: e.target.value } : x))} disabled={cfg.horarios.dias[i].fechado} />
              </div>
            ))}
            <h3 className="font-bold mt-4">Fechamento programado</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input" value={cfg.horarios.fechamentoProgramado?.data || ""} onChange={e => upd(["horarios", "fechamentoProgramado"], e.target.value ? { data: e.target.value, motivo: cfg.horarios.fechamentoProgramado?.motivo || "" } : null)} />
              <input className="input" placeholder="Motivo" value={cfg.horarios.fechamentoProgramado?.motivo || ""} onChange={e => upd(["horarios", "fechamentoProgramado"], { data: cfg.horarios.fechamentoProgramado?.data || "", motivo: e.target.value })} />
            </div>
          </div>
        )}

        {sub === "impressora" && (
          <>
            <Field label="URL do logo da impressão"><input className="input" value={cfg.impressora.logoUrl} onChange={e => upd(["impressora", "logoUrl"], e.target.value)} /></Field>
            <Field label="Cabeçalho"><textarea className="textarea" rows={4} value={cfg.impressora.cabecalho} onChange={e => upd(["impressora", "cabecalho"], e.target.value)} /></Field>
            <Field label="Rodapé"><textarea className="textarea" rows={3} value={cfg.impressora.rodape} onChange={e => upd(["impressora", "rodape"], e.target.value)} /></Field>
            <Field label="Observações extras"><textarea className="textarea" rows={2} value={cfg.impressora.obs} onChange={e => upd(["impressora", "obs"], e.target.value)} /></Field>
          </>
        )}

        {sub === "whats" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Field label="Título"><input className="input" value={cfg.whats.titulo} onChange={e => upd(["whats", "titulo"], e.target.value)} /></Field>
              <Field label="Template">
                <textarea id="wpl" className="textarea font-mono text-xs" rows={14} value={cfg.whats.template} onChange={e => upd(["whats", "template"], e.target.value)} />
              </Field>
              <div className="text-xs text-white/60">Variáveis (clique p/ inserir):</div>
              <div className="flex flex-wrap gap-1">
                {["{{itens}}", "{{subtotal}}", "{{desconto}}", "{{taxa}}", "{{total}}", "{{cliente}}", "{{endereco}}", "{{referencia}}", "{{pagamento}}", "{{troco}}", "{{tipo}}", "{{obs}}"].map(v => (
                  <button key={v} onClick={() => upd(["whats", "template"], cfg.whats.template + v)} className="text-xs px-2 py-1 rounded bg-orange-500/20 border border-orange-400/40">{v}</button>
                ))}
              </div>
              <div className="text-xs text-white/60">Emojis:</div>
              <div className="flex flex-wrap gap-1">
                {["🍔", "🛵", "🏪", "💳", "💵", "📱", "🎉", "✅", "❤️", "🔥", "⭐", "📍", "🚩"].map(e => (
                  <button key={e} onClick={() => upd(["whats", "template"], cfg.whats.template + e)} className="text-lg px-1.5 hover:scale-125 transition">{e}</button>
                ))}
              </div>
              <button onClick={() => upd(["whats", "template"], DEFAULT_CONFIG.whats.template)} className="btn-ghost w-full text-sm">↺ Restaurar Padrão</button>
            </div>
            <div>
              <div className="text-xs text-white/60 mb-1">Prévia:</div>
              <div className="card p-3 whitespace-pre-wrap text-sm font-mono max-h-[450px] overflow-y-auto">
                {cfg.whats.template
                  .replace("{{itens}}", "• 1x X-Bacon — R$ 28,90\n• 1x Coca 350ml — R$ 6,00")
                  .replace("{{subtotal}}", "34,90")
                  .replace("{{desconto}}", "0,00")
                  .replace("{{taxa}}", "8,00")
                  .replace("{{total}}", "42,90")
                  .replace("{{cliente}}", "João Silva")
                  .replace("{{endereco}}", "Rua das Flores, 123")
                  .replace("{{referencia}}", "Próximo ao mercado")
                  .replace("{{pagamento}}", "Dinheiro")
                  .replace("{{troco}}", "R$ 50,00")
                  .replace("{{tipo}}", "🛵 ENTREGA")
                  .replace("{{obs}}", "-")}
              </div>
            </div>
          </div>
        )}

        {sub === "firebase" && (
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(cfg.firebase).map(k => (
              <Field key={k} label={k}><input className="input" value={(cfg.firebase as any)[k]} onChange={e => upd(["firebase", k], e.target.value)} /></Field>
            ))}
            <div className="col-span-2 text-xs text-white/50">💡 Sem Firebase configurado, o sistema funciona 100% via localStorage com sync entre abas.</div>
          </div>
        )}

        {sub === "backup" && (
          <div className="space-y-3">
            <button onClick={() => {
              const data = {
                config: getConfig(), produtos: getProdutos(), categorias: getCategorias(),
                cupons: getCupons(), pedidos: getPedidos(), vendas: getVendas(), cancelados: getCancelados(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mh-backup-${Date.now()}.json`; a.click();
            }} className="btn-neon">⬇️ Exportar Backup JSON</button>
            <label className="btn-ghost cursor-pointer block text-center">📥 Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                const txt = await f.text();
                const d = JSON.parse(txt);
                if (d.config) setConfig(d.config);
                if (d.produtos) setProdutos(d.produtos);
                if (d.categorias) setCategorias(d.categorias);
                if (d.cupons) setCupons(d.cupons);
                showToast("✓ Importado");
              }} />
            </label>
            <button onClick={() => {
              const senha = prompt("Senha admin para resetar:");
              if (senha !== "admin123") return;
              if (!confirm("RESETAR TUDO?")) return;
              localStorage.clear();
              location.reload();
            }} className="btn-danger">🗑 RESETAR TUDO (cuidado!)</button>
          </div>
        )}
      </div>
    </div>
  );
}
