import { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Logo } from "../components/Shell";
import { deleteStorageByUrl, uploadProdutoImagem } from "../firebase";
import { cropResizeCompress, fileToDataUrl, type AreaPixels } from "../imageUpload";
import { fmt, newId, useStore, type Cupom, type GrupoOpcao, type Produto, type Visual } from "../store";

type Tab = "dashboard" | "produtos" | "categorias" | "pedidos" | "config" | "cupons" | "relatorios";

export default function Admin() {
  const [logged, setLogged] = useState<boolean>(() => {
    const s = localStorage.getItem("mh_session");
    if (!s) return false;
    try { const d = JSON.parse(s); if (Date.now() < d.exp) return true; } catch {}
    return false;
  });
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [erro, setErro] = useState("");
  const [tries, setTries] = useState(0);

  function login() {
    if (tries >= 5) return setErro("🔒 Bloqueado por excesso de tentativas");
    if ((user === "admin" && pwd === "admin123") || (user === "func" && pwd === "func123")) {
      const sess = { user, role: user === "admin" ? "ADMIN" : "FUNC", exp: Date.now() + 7 * 60 * 60 * 1000 };
      localStorage.setItem("mh_session", JSON.stringify(sess));
      setLogged(true);
    } else {
      setTries(t => t + 1);
      setErro("Credenciais inválidas");
    }
  }

  if (!logged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-orbs" />
        <div className="glass-strong p-8 w-full max-w-sm relative">
          <div className="text-center mb-6">
            <div className="inline-block logo-anim text-6xl mb-3">🍔</div>
            <h1 className="text-2xl font-extrabold neon-text-orange">MH Admin</h1>
            <p className="text-white/60 text-sm">Faça login para continuar</p>
          </div>
          <input className="input mb-2" placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} />
          <input className="input mb-3" placeholder="Senha" type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          {erro && <div className="text-red-400 text-xs mb-2 text-center">{erro}</div>}
          <button className="btn-neon w-full" onClick={login}>Entrar</button>
          <div className="text-[10px] text-white/40 mt-4 text-center">admin/admin123 · func/func123</div>
        </div>
      </div>
    );
  }

  return <AdminInterno onLogout={() => { localStorage.removeItem("mh_session"); setLogged(false); }} />;
}

function AdminInterno({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "produtos", label: "Produtos", icon: "📦" },
    { id: "categorias", label: "Categorias", icon: "🏷️" },
    { id: "pedidos", label: "Pedidos", icon: "📋" },
    { id: "cupons", label: "Cupons", icon: "🎫" },
    { id: "relatorios", label: "Relatórios", icon: "📈" },
    { id: "config", label: "Configurações", icon: "⚙️" },
  ];
  return (
    <div className="min-h-screen flex">
      <div className="bg-orbs" />
      <aside className="w-64 glass-strong m-3 p-4 flex flex-col gap-1 sticky top-3 self-start max-h-[calc(100vh-24px)]">
        <Logo />
        <div className="my-4 border-t border-white/10" />
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"text-left px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm transition " +
              (tab === t.id ? "bg-gradient-to-r from-[#ff6b35] to-[#ff2d92] text-white shadow-lg font-bold" : "hover:bg-white/5 text-white/70")}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="btn-ghost text-xs" onClick={onLogout}>🚪 Sair</button>
      </aside>
      <main className="flex-1 p-3 overflow-auto relative z-10">
        {tab === "dashboard" && <Dashboard />}
        {tab === "produtos" && <ProdutosAdmin />}
        {tab === "categorias" && <CategoriasAdmin />}
        {tab === "pedidos" && <PedidosAdmin />}
        {tab === "cupons" && <CuponsAdmin />}
        {tab === "relatorios" && <RelatoriosAdmin />}
        {tab === "config" && <ConfigAdmin />}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/60 uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-extrabold mt-1" style={{ color }}>{value}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { vendas, pedidos, produtos } = useStore();
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const vendasHoje = vendas.filter(v => v.criadoEm >= hoje.getTime());
  const fatHoje = vendasHoje.reduce((s, v) => s + v.total, 0);
  const fatMes = vendas.filter(v => new Date(v.criadoEm).getMonth() === new Date().getMonth()).reduce((s, v) => s + v.total, 0);
  const ranking = [...produtos].sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0)).slice(0, 5);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold neon-text-orange">📊 Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="💰" label="Vendas Hoje" value={vendasHoje.length.toString()} color="#ff6b35" />
        <StatCard icon="📈" label="Faturamento Hoje" value={fmt(fatHoje)} color="#00ff9d" />
        <StatCard icon="📅" label="Faturamento Mês" value={fmt(fatMes)} color="#00d4ff" />
        <StatCard icon="🛵" label="Pedidos Abertos" value={pedidos.filter(p => p.status !== "finalizado" && p.status !== "cancelado").length.toString()} color="#ffd400" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-bold mb-3 neon-text-cyan">🏆 Top Produtos</h3>
          <div className="space-y-2">
            {ranking.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                <div className="text-2xl font-extrabold text-[#ff6b35]">#{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{p.nome}</div>
                  <div className="text-xs text-white/60">{p.vendidos || 0} vendidos · {fmt(p.preco)}</div>
                </div>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ff6b35] to-[#ff2d92]" style={{ width: `${Math.min(100, ((p.vendidos || 0) / (ranking[0].vendidos || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-3 neon-text-cyan">📋 Últimos Pedidos</h3>
          <div className="space-y-2">
            {pedidos.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                <div>
                  <b>#{p.numero}</b> · {p.cliente.nome}
                  <div className="text-[11px] text-white/50">{new Date(p.criadoEm).toLocaleString("pt-BR")}</div>
                </div>
                <div className="text-right">
                  <span className="pill bg-[#ff6b35]/30 text-[#ff6b35]">{p.status}</span>
                  <div className="font-bold mt-1">{fmt(p.total)}</div>
                </div>
              </div>
            ))}
            {pedidos.length === 0 && <div className="text-white/50 text-sm text-center py-4">Sem pedidos ainda</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProdutosAdmin() {
  const { produtos, setProdutos, categorias } = useStore();
  const [editando, setEditando] = useState<Produto | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState("todos");

  const lista = produtos
    .filter(p => filtroCat === "todos" || p.categoriaId === filtroCat)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.ordem - b.ordem);

  function novo() {
    setEditando({
      id: newId(), nome: "", descricao: "", preco: 0, categoriaId: categorias[0]?.id || "",
      imagens: [], tipo: "simples", ordem: produtos.length + 1, grupos: [],
    });
  }

  function salvar(p: Produto) {
    const exists = produtos.find(x => x.id === p.id);
    setProdutos(exists ? produtos.map(x => x.id === p.id ? p : x) : [...produtos, p]);
    setEditando(null);
  }

  function moverOrdem(id: string, dir: -1 | 1) {
    const arr = [...produtos].sort((a, b) => a.ordem - b.ordem);
    const i = arr.findIndex(p => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i].ordem, arr[j].ordem] = [arr[j].ordem, arr[i].ordem];
    setProdutos(arr);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold neon-text-orange">📦 Produtos</h1>
        <button className="btn-neon" onClick={novo}>+ Novo Produto</button>
      </div>
      <div className="card p-3 flex flex-wrap gap-2">
        <input className="input flex-1 min-w-[200px]" placeholder="🔎 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="input max-w-xs" value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
          <option value="todos">Todas categorias</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="grid gap-2">
        {lista.map(p => (
          <div key={p.id} className="card p-3 flex items-center gap-3">
            <div className="flex flex-col">
              <button className="text-white/40 hover:text-white" onClick={() => moverOrdem(p.id, -1)}>▲</button>
              <button className="text-white/40 hover:text-white" onClick={() => moverOrdem(p.id, 1)}>▼</button>
            </div>
            <img src={p.imagens[0] || "https://placehold.co/80x80/1a1a1a/ff6b35?text=MH"} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="font-bold">{p.nome} {p.pausado && <span className="pill bg-red-500/30 text-red-300">⏸️ Pausado</span>}</div>
              <div className="text-xs text-white/60">{categorias.find(c => c.id === p.categoriaId)?.nome} · {p.tipo}</div>
              <div className="text-sm font-bold text-[#ff6b35]">{fmt(p.precoPromo ?? p.preco)}</div>
            </div>
            <div className="flex gap-1">
              <button className="btn-ghost !text-xs" onClick={() => setProdutos(produtos.map(x => x.id === p.id ? { ...x, pausado: !x.pausado } : x))}>{p.pausado ? "▶️" : "⏸️"}</button>
              <button className="btn-ghost !text-xs" onClick={() => setEditando(p)}>✏️</button>
              <button className="btn-ghost !text-xs text-red-400" onClick={async () => {
                if (!confirm("Excluir produto?")) return;
                await Promise.all((p.imagens || []).map(img => deleteStorageByUrl(img)));
                setProdutos(produtos.filter(x => x.id !== p.id));
              }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {editando && <ProdutoEditor produto={editando} onClose={() => setEditando(null)} onSave={salvar} />}
    </div>
  );
}

type UploadDraft = { id: string; src: string; name: string };
type UploadItemState = { id: string; name: string; progress: number; status: string };

function ProdutoEditor({ produto, onClose, onSave }: { produto: Produto; onClose: () => void; onSave: (p: Produto) => void }) {
  const { categorias, config } = useStore();
  const [p, setP] = useState<Produto>(produto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [novaUrl, setNovaUrl] = useState("");
  const [filaCrop, setFilaCrop] = useState<UploadDraft[]>([]);
  const [indiceCrop, setIndiceCrop] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<AreaPixels | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStates, setUploadStates] = useState<UploadItemState[]>([]);

  const limiteKB = config.visual.produtoImagemMaxKB || 280;
  const maxWidth = config.visual.produtoImagemMaxWidth || 1024;
  const atual = filaCrop[indiceCrop] || null;

  function addGrupo() {
    setP({ ...p, grupos: [...(p.grupos || []), { id: newId(), nome: "Nova Categoria", limiteGratis: 0, itens: [] }] });
  }
  function updGrupo(gid: string, patch: Partial<GrupoOpcao>) {
    setP({ ...p, grupos: (p.grupos || []).map(g => g.id === gid ? { ...g, ...patch } : g) });
  }
  function delGrupo(gid: string) { setP({ ...p, grupos: (p.grupos || []).filter(g => g.id !== gid) }); }
  function addItem(gid: string) {
    setP({ ...p, grupos: (p.grupos || []).map(g => g.id === gid ? { ...g, itens: [...g.itens, { id: newId(), nome: "Item", preco: 0, maxRepeat: 1 }] } : g) });
  }
  function updItem(gid: string, iid: string, patch: any) {
    setP({ ...p, grupos: (p.grupos || []).map(g => g.id === gid ? { ...g, itens: g.itens.map(i => i.id === iid ? { ...i, ...patch } : i) } : g) });
  }
  function delItem(gid: string, iid: string) {
    setP({ ...p, grupos: (p.grupos || []).map(g => g.id === gid ? { ...g, itens: g.itens.filter(i => i.id !== iid) } : g) });
  }

  async function receberArquivos(files: FileList | null) {
    if (!files?.length) return;
    const validos = Array.from(files).filter(f => f.type.startsWith("image/"));
    const drafts = await Promise.all(validos.map(async file => ({ id: newId(), src: await fileToDataUrl(file), name: file.name })));
    setFilaCrop(drafts);
    setIndiceCrop(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function setUploadState(id: string, patch: Partial<UploadItemState>) {
    setUploadStates(prev => {
      const idx = prev.findIndex(x => x.id === id);
      if (idx === -1) return [...prev, { id, name: patch.name || "imagem", progress: patch.progress || 0, status: patch.status || "Aguardando" }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  async function confirmarCrop() {
    if (!atual || !croppedAreaPixels || uploading) return;
    setUploading(true);
    setUploadState(atual.id, { name: atual.name, progress: 8, status: "Processando imagem..." });
    try {
      const { blob, ext } = await cropResizeCompress(atual.src, croppedAreaPixels, { maxKB: limiteKB, maxWidth, format: "image/webp" });
      setUploadState(atual.id, { progress: 18, status: `Compactando até ~${limiteKB}KB...` });
      const up = await uploadProdutoImagem({
        produtoId: p.id,
        fileName: atual.name.replace(/\.[^.]+$/, "") + "." + ext,
        blob,
        onProgress: (pct) => setUploadState(atual.id, { progress: Math.max(18, pct), status: pct >= 100 ? "Upload concluído" : `Enviando... ${pct}%` }),
      });
      setP(cur => ({ ...cur, imagens: [...cur.imagens, up.url] }));
      setUploadState(atual.id, { progress: 100, status: "✅ Pronto" });
      if (indiceCrop < filaCrop.length - 1) {
        setIndiceCrop(i => i + 1);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        setFilaCrop([]);
        setIndiceCrop(0);
      }
    } catch (e) {
      console.error(e);
      setUploadState(atual.id, { progress: 0, status: "❌ Falha no upload" });
      alert("Não foi possível processar/enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  function fecharCrop() {
    if (uploading) return;
    setFilaCrop([]);
    setIndiceCrop(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function adicionarPorUrl() {
    if (!novaUrl.trim()) return;
    setP(cur => ({ ...cur, imagens: [...cur.imagens, novaUrl.trim()] }));
    setNovaUrl("");
  }

  async function removerImagem(url: string) {
    if (!confirm("Remover esta imagem?")) return;
    setP(cur => ({ ...cur, imagens: cur.imagens.filter(x => x !== url) }));
    await deleteStorageByUrl(url);
  }

  function tornarCapa(url: string) {
    setP(cur => ({ ...cur, imagens: [url, ...cur.imagens.filter(x => x !== url)] }));
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-strong w-full max-w-5xl max-h-[92vh] overflow-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold neon-text-orange">✏️ Produto</h2>
              <div className="text-xs text-white/55">Galeria com upload múltiplo, crop, compressão e envio para Firebase Storage.</div>
            </div>
            <button className="btn-ghost !p-2" onClick={onClose}>✕</button>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-4 items-start">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><label className="text-xs text-white/60">Nome</label><input className="input" value={p.nome} onChange={e => setP({ ...p, nome: e.target.value })} /></div>
                <div className="md:col-span-2"><label className="text-xs text-white/60">Descrição</label><textarea className="input" value={p.descricao} onChange={e => setP({ ...p, descricao: e.target.value })} /></div>
                <div><label className="text-xs text-white/60">Preço</label><input type="number" className="input" value={p.preco} onChange={e => setP({ ...p, preco: +e.target.value })} /></div>
                <div><label className="text-xs text-white/60">Preço Promo</label><input type="number" className="input" value={p.precoPromo || ""} onChange={e => setP({ ...p, precoPromo: +e.target.value || undefined })} /></div>
                <div><label className="text-xs text-white/60">Categoria</label>
                  <select className="input" value={p.categoriaId} onChange={e => setP({ ...p, categoriaId: e.target.value })}>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-white/60">Tipo</label>
                  <select className="input" value={p.tipo} onChange={e => setP({ ...p, tipo: e.target.value as any })}>
                    <option value="simples">Simples</option>
                    <option value="meio">Meio a Meio (Pizza)</option>
                    <option value="multi">Multi-escolha (Pastel)</option>
                  </select>
                </div>
                <div><label className="text-xs text-white/60">Tempo Preparo (min)</label><input type="number" className="input" value={p.tempoPreparoMin || ""} onChange={e => setP({ ...p, tempoPreparoMin: +e.target.value || undefined })} /></div>
                <div className="flex gap-3 items-center pt-5">
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p.destaque} onChange={e => setP({ ...p, destaque: e.target.checked })} /> ⭐ Destaque</label>
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p.promocao} onChange={e => setP({ ...p, promocao: e.target.checked })} /> 🔥 Promoção</label>
                </div>
              </div>

              {(p.tipo === "meio" || p.tipo === "multi") && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold neon-text-cyan">Grupos de Opções</h3>
                    <button className="btn-cyan !text-xs" onClick={addGrupo}>+ Categoria</button>
                  </div>
                  <div className="space-y-3">
                    {(p.grupos || []).map(g => (
                      <div key={g.id} className="card p-3">
                        <div className="grid sm:grid-cols-3 gap-2 mb-2">
                          <input className="input" placeholder="Nome (Ex: Sabores)" value={g.nome} onChange={e => updGrupo(g.id, { nome: e.target.value })} />
                          <input type="number" className="input" placeholder="Limite Grátis" value={g.limiteGratis} onChange={e => updGrupo(g.id, { limiteGratis: +e.target.value })} />
                          <button className="btn-ghost text-red-400 text-xs" onClick={() => delGrupo(g.id)}>🗑️ Excluir grupo</button>
                        </div>
                        <div className="space-y-1">
                          {g.itens.map(i => (
                            <div key={i.id} className="grid grid-cols-12 gap-1 items-center">
                              <input className="input col-span-5 !py-1" placeholder="Nome" value={i.nome} onChange={e => updItem(g.id, i.id, { nome: e.target.value })} />
                              <input type="number" className="input col-span-3 !py-1" placeholder="Preço" value={i.preco} onChange={e => updItem(g.id, i.id, { preco: +e.target.value })} />
                              <input type="number" className="input col-span-3 !py-1" placeholder="Max repete" value={i.maxRepeat} onChange={e => updItem(g.id, i.id, { maxRepeat: +e.target.value })} />
                              <button className="text-red-400 col-span-1 text-sm" onClick={() => delItem(g.id, i.id)}>🗑️</button>
                            </div>
                          ))}
                          <button className="btn-ghost text-xs mt-1" onClick={() => addItem(g.id)}>+ Item</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-bold text-base">🖼️ Galeria de Imagens</h3>
                    <div className="text-[11px] text-white/60">Máx {maxWidth}px de largura · alvo de até {limiteKB}KB por imagem · upload múltiplo</div>
                  </div>
                  <button type="button" className="btn-neon !text-xs" onClick={() => fileInputRef.current?.click()}>
                    Clique para enviar imagem do seu dispositivo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => receberArquivos(e.target.files)} />
                </div>

                <div className="flex gap-2">
                  <input className="input flex-1" value={novaUrl} onChange={e => setNovaUrl(e.target.value)} placeholder="Ou adicione uma imagem via URL https://..." />
                  <button type="button" className="btn-cyan !text-xs" onClick={adicionarPorUrl}>+ URL</button>
                </div>

                {p.imagens.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">Nenhuma imagem ainda. Envie várias imagens para aparecerem no slider do cardápio.</div>}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {p.imagens.map((img, idx) => (
                    <div key={img + idx} className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                      <div className="relative aspect-[4/3] bg-black/30">
                        <img src={img} className="w-full h-full object-cover" />
                        {idx === 0 && <span className="absolute top-2 left-2 pill bg-emerald-500/80 text-white">Capa</span>}
                      </div>
                      <div className="p-2 space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {idx !== 0 && <button type="button" className="btn-cyan !text-[10px] !px-2 !py-1" onClick={() => tornarCapa(img)}>⭐ Tornar capa</button>}
                          <button type="button" className="btn-ghost !text-[10px] !px-2 !py-1 text-red-300" onClick={() => removerImagem(img)}>🗑️ Remover</button>
                        </div>
                        <div className="text-[10px] text-white/45 line-clamp-2 break-all">{img.startsWith("data:") ? "Imagem local compactada" : img}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {uploadStates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-xs font-bold text-white/75">📤 Progresso dos uploads</div>
                    {uploadStates.slice(-6).map(u => (
                      <div key={u.id} className="rounded-xl bg-black/20 border border-white/10 p-2">
                        <div className="flex items-center justify-between text-[11px] gap-2">
                          <span className="truncate">{u.name}</span>
                          <span className="text-white/60">{u.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#ff6b35]" style={{ width: `${u.progress}%` }} />
                        </div>
                        <div className="text-[10px] text-white/50 mt-1">{u.status}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
            <button className="btn-neon flex-1" disabled={uploading || !!atual} onClick={() => onSave(p)}>
              {uploading || !!atual ? "Aguarde concluir o upload" : "💾 Salvar"}
            </button>
          </div>
        </div>
      </div>

      {atual && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={fecharCrop} />
          <div className="relative w-full max-w-4xl glass-strong p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div>
                <div className="text-lg font-extrabold neon-text-cyan">✂️ Ajustar imagem antes de salvar</div>
                <div className="text-xs text-white/55">Arraste com mouse ou toque para mover. Pinça/zoom no celular também funciona.</div>
              </div>
              <div className="pill bg-white/10 text-white/80">{indiceCrop + 1} / {filaCrop.length}</div>
            </div>
            <div className="relative h-[48vh] min-h-[320px] rounded-2xl overflow-hidden bg-black/60 border border-white/10">
              <Cropper
                image={atual.src}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels as AreaPixels)}
                showGrid
              />
            </div>
            <div className="mt-4 grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div>
                <div className="text-xs text-white/60 mb-1">Zoom</div>
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(+e.target.value)} className="w-full accent-[#ff6b35]" />
              </div>
              <button type="button" className="btn-ghost" onClick={fecharCrop} disabled={uploading}>Cancelar</button>
              <button type="button" className="btn-neon" onClick={confirmarCrop} disabled={uploading}>{uploading ? "Enviando..." : "Usar recorte e enviar"}</button>
            </div>
            <div className="text-[11px] text-white/45 mt-2">Compressão automática: até {maxWidth}px · meta ~{limiteKB}KB por imagem · formato WebP.</div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoriasAdmin() {
  const { categorias, setCategorias } = useStore();
  const [novo, setNovo] = useState("");
  const list = [...categorias].sort((a, b) => a.ordem - b.ordem);

  function add() {
    if (!novo.trim()) return;
    setCategorias([...categorias, { id: newId(), nome: novo, ordem: categorias.length + 1 }]);
    setNovo("");
  }
  function mover(id: string, dir: -1 | 1) {
    const arr = [...list]; const i = arr.findIndex(c => c.id === id); const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i].ordem, arr[j].ordem] = [arr[j].ordem, arr[i].ordem];
    setCategorias(arr);
  }
  function rename(id: string) {
    const n = prompt("Novo nome:", list.find(c => c.id === id)?.nome);
    if (n) setCategorias(categorias.map(c => c.id === id ? { ...c, nome: n } : c));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold neon-text-orange">🏷️ Categorias</h1>
      <div className="card p-3 flex gap-2">
        <input className="input" placeholder="Nova categoria (ex: 🍔 Hambúrgueres)" value={novo} onChange={e => setNovo(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button className="btn-neon" onClick={add}>+ Adicionar</button>
      </div>
      <div className="space-y-2">
        {list.map(c => (
          <div key={c.id} className="card p-3 flex items-center gap-3">
            <div className="flex flex-col">
              <button className="text-white/40" onClick={() => mover(c.id, -1)}>▲</button>
              <button className="text-white/40" onClick={() => mover(c.id, 1)}>▼</button>
            </div>
            <div className="flex-1 font-bold">{c.nome}</div>
            <button className="btn-ghost !text-xs" onClick={() => rename(c.id)}>✏️</button>
            <button className="btn-ghost !text-xs text-red-400" onClick={() => confirm("Excluir?") && setCategorias(categorias.filter(x => x.id !== c.id))}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PedidosAdmin() {
  const { pedidos, vendas, cancelados } = useStore();
  const [filtro, setFiltro] = useState<"ativos" | "vendas" | "cancelados">("ativos");
  const lista = filtro === "ativos" ? pedidos : filtro === "vendas" ? vendas : cancelados;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold neon-text-orange">📋 Pedidos</h1>
      <div className="flex gap-2">
        {[["ativos","Ativos"],["vendas","Vendas"],["cancelados","Cancelados"]].map(([k, l]) => (
          <button key={k} className={"px-4 py-2 rounded-lg font-bold " + (filtro === k ? "btn-neon" : "btn-ghost")} onClick={() => setFiltro(k as any)}>{l} ({k === "ativos" ? pedidos.length : k === "vendas" ? vendas.length : cancelados.length})</button>
        ))}
      </div>
      <div className="grid gap-2">
        {lista.map(p => (
          <div key={p.id} className="card p-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <div className="font-bold">#{p.numero} · {p.cliente.nome}</div>
              <div className="text-xs text-white/60">{new Date(p.criadoEm).toLocaleString("pt-BR")} · {p.itens.length} itens</div>
            </div>
            <div className="text-right">
              <span className="pill bg-[#ff6b35]/30 text-[#ff6b35]">{p.status}</span>
              <div className="font-bold text-lg">{fmt(p.total)}</div>
            </div>
          </div>
        ))}
        {lista.length === 0 && <div className="card p-8 text-center text-white/50">Nenhum pedido</div>}
      </div>
    </div>
  );
}

function CuponsAdmin() {
  const { cupons, setCupons } = useStore();
  const [edit, setEdit] = useState<Cupom | null>(null);
  function novo() { setEdit({ id: newId(), codigo: "", tipo: "perc", valor: 10, minimo: 0, total: 100, usados: 0, validade: "2026-12-31" }); }
  function salvar(c: Cupom) {
    setCupons(cupons.find(x => x.id === c.id) ? cupons.map(x => x.id === c.id ? c : x) : [...cupons, c]);
    setEdit(null);
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold neon-text-orange">🎫 Cupons</h1>
        <button className="btn-neon" onClick={novo}>+ Novo Cupom</button>
      </div>
      <div className="grid gap-2">
        {cupons.map(c => (
          <div key={c.id} className="card p-3 flex justify-between items-center">
            <div>
              <div className="font-extrabold neon-text-cyan">{c.codigo}</div>
              <div className="text-xs text-white/60">{c.tipo === "perc" ? `${c.valor}% off` : c.tipo === "valor" ? `R$ ${c.valor} off` : "Frete grátis"} · mín {fmt(c.minimo)} · {c.usados}/{c.total} usos · até {c.validade}</div>
            </div>
            <div className="flex gap-1">
              <button className="btn-ghost !text-xs" onClick={() => setEdit(c)}>✏️</button>
              <button className="btn-ghost !text-xs text-red-400" onClick={() => setCupons(cupons.filter(x => x.id !== c.id))}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEdit(null)} />
          <div className="relative glass-strong p-5 w-full max-w-md space-y-2">
            <h2 className="text-xl font-bold neon-text-orange">Cupom</h2>
            <input className="input" placeholder="CÓDIGO" value={edit.codigo} onChange={e => setEdit({ ...edit, codigo: e.target.value.toUpperCase() })} />
            <select className="input" value={edit.tipo} onChange={e => setEdit({ ...edit, tipo: e.target.value as any })}>
              <option value="perc">Porcentagem</option><option value="valor">Valor Fixo</option><option value="frete">Frete Grátis</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="input" placeholder="Valor" value={edit.valor} onChange={e => setEdit({ ...edit, valor: +e.target.value })} />
              <input type="number" className="input" placeholder="Mínimo" value={edit.minimo} onChange={e => setEdit({ ...edit, minimo: +e.target.value })} />
              <input type="number" className="input" placeholder="Total" value={edit.total} onChange={e => setEdit({ ...edit, total: +e.target.value })} />
              <input type="date" className="input" value={edit.validade} onChange={e => setEdit({ ...edit, validade: e.target.value })} />
            </div>
            <button className="btn-neon w-full" onClick={() => salvar(edit)}>💾 Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RelatoriosAdmin() {
  const { vendas } = useStore();
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes" | "ano" | "tudo">("mes");

  const filtered = useMemo(() => {
    const now = Date.now();
    const periods: any = {
      hoje: 86400000, semana: 7 * 86400000, mes: 30 * 86400000, ano: 365 * 86400000, tudo: Infinity,
    };
    return vendas.filter(v => now - v.criadoEm < periods[periodo]);
  }, [vendas, periodo]);

  const total = filtered.reduce((s, v) => s + v.total, 0);
  const desconto = filtered.reduce((s, v) => s + v.desconto, 0);
  const ticket = filtered.length ? total / filtered.length : 0;

  function exportCSV() {
    const csv = "Numero,Cliente,Data,Total,Pagamento\n" + filtered.map(v => `${v.numero},${v.cliente.nome},${new Date(v.criadoEm).toLocaleString("pt-BR")},${v.total},${v.pagamento}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `vendas_${periodo}.csv`; a.click();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold neon-text-orange">📈 Relatórios</h1>
      <div className="card p-3 flex gap-2 flex-wrap">
        {["hoje","semana","mes","ano","tudo"].map(p => (
          <button key={p} className={"px-3 py-1.5 rounded-lg text-sm font-bold " + (periodo === p ? "btn-neon" : "btn-ghost")} onClick={() => setPeriodo(p as any)}>{p.toUpperCase()}</button>
        ))}
        <div className="flex-1" />
        <button className="btn-cyan" onClick={exportCSV}>📥 Exportar CSV</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="🛒" label="Vendas" value={filtered.length.toString()} color="#ff6b35" />
        <StatCard icon="💰" label="Faturamento" value={fmt(total)} color="#00ff9d" />
        <StatCard icon="🎫" label="Descontos" value={fmt(desconto)} color="#ffd400" />
        <StatCard icon="🎯" label="Ticket Médio" value={fmt(ticket)} color="#00d4ff" />
      </div>
      <div className="card p-3">
        <h3 className="font-bold mb-2">Histórico de Vendas</h3>
        <div className="space-y-1 max-h-96 overflow-auto">
          {filtered.map(v => (
            <div key={v.id} className="flex justify-between p-2 bg-white/5 rounded text-sm">
              <span>#{v.numero} · {v.cliente.nome}</span>
              <span className="text-xs text-white/60">{new Date(v.criadoEm).toLocaleString("pt-BR")}</span>
              <b className="text-[#ff6b35]">{fmt(v.total)}</b>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-4 text-white/50">Nenhuma venda no período</div>}
        </div>
      </div>
    </div>
  );
}

function ConfigAdmin() {
  const { config, setConfig } = useStore();
  const [c, setC] = useState(config);
  const [aba, setAba] = useState<"loja" | "visual" | "horario" | "delivery" | "anuncios" | "firebase" | "backup">("loja");
  useEffect(() => { setC(config); }, [config]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold neon-text-orange">⚙️ Configurações</h1>
      <div className="flex flex-wrap gap-1">
        {[["loja","🏪 Loja"],["visual","🎨 Visual"],["horario","🕒 Horários"],["delivery","🛵 Delivery"],["anuncios","📢 Anúncios"],["firebase","🔥 Firebase"],["backup","💾 Backup"]].map(([k, l]) => (
          <button key={k} className={"px-3 py-1.5 rounded-lg text-sm font-bold " + (aba === k ? "btn-neon" : "btn-ghost")} onClick={() => setAba(k as any)}>{l}</button>
        ))}
      </div>

      {aba === "visual" && <VisualTab c={c} setC={setC} />}

      {aba === "loja" && (
        <div className="card p-4 grid md:grid-cols-2 gap-3">
          <div><label className="text-xs text-white/60">Nome</label><input className="input" value={c.loja.nome} onChange={e => setC({ ...c, loja: { ...c.loja, nome: e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">Slogan</label><input className="input" value={c.loja.slogan} onChange={e => setC({ ...c, loja: { ...c.loja, slogan: e.target.value } })} /></div>
          <div className="md:col-span-2"><label className="text-xs text-white/60">Título</label><input className="input" value={c.loja.titulo} onChange={e => setC({ ...c, loja: { ...c.loja, titulo: e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">Telefone</label><input className="input" value={c.loja.tel} onChange={e => setC({ ...c, loja: { ...c.loja, tel: e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">WhatsApp</label><input className="input" value={c.social.whatsapp} onChange={e => setC({ ...c, social: { ...c.social, whatsapp: e.target.value } })} /></div>
          <div className="md:col-span-2"><label className="text-xs text-white/60">Endereço</label><input className="input" value={c.loja.endereco} onChange={e => setC({ ...c, loja: { ...c.loja, endereco: e.target.value } })} /></div>
        </div>
      )}

      {aba === "horario" && (
        <div className="card p-4 space-y-2">
          {Object.entries(c.horarios).map(([d, h]: any) => (
            <div key={d} className="grid grid-cols-4 gap-2 items-center">
              <div className="font-bold uppercase text-sm">{d}</div>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={h.aberto} onChange={e => setC({ ...c, horarios: { ...c.horarios, [d]: { ...h, aberto: e.target.checked } } })} /> Aberto</label>
              <input type="time" className="input" value={h.abre} onChange={e => setC({ ...c, horarios: { ...c.horarios, [d]: { ...h, abre: e.target.value } } })} />
              <input type="time" className="input" value={h.fecha} onChange={e => setC({ ...c, horarios: { ...c.horarios, [d]: { ...h, fecha: e.target.value } } })} />
            </div>
          ))}
        </div>
      )}

      {aba === "delivery" && (
        <div className="card p-4 grid md:grid-cols-2 gap-3">
          <div><label className="text-xs text-white/60">Taxa Entrega</label><input type="number" className="input" value={c.delivery.taxa} onChange={e => setC({ ...c, delivery: { ...c.delivery, taxa: +e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">Pedido Mínimo</label><input type="number" className="input" value={c.delivery.minimo} onChange={e => setC({ ...c, delivery: { ...c.delivery, minimo: +e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">Tempo Médio (min)</label><input type="number" className="input" value={c.delivery.tempoMedio} onChange={e => setC({ ...c, delivery: { ...c.delivery, tempoMedio: +e.target.value } })} /></div>
          <div><label className="text-xs text-white/60">Raio (km)</label><input type="number" className="input" value={c.delivery.raio} onChange={e => setC({ ...c, delivery: { ...c.delivery, raio: +e.target.value } })} /></div>
        </div>
      )}

      {aba === "anuncios" && (
        <div className="card p-4 space-y-2">
          {c.anuncios.map((a, i) => (
            <div key={a.id} className="flex gap-2 items-center">
              <input className="input flex-1" value={a.texto} onChange={e => { const arr = [...c.anuncios]; arr[i].texto = e.target.value; setC({ ...c, anuncios: arr }); }} />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={a.ativo} onChange={e => { const arr = [...c.anuncios]; arr[i].ativo = e.target.checked; setC({ ...c, anuncios: arr }); }} /> Ativo</label>
              <button className="text-red-400" onClick={() => setC({ ...c, anuncios: c.anuncios.filter(x => x.id !== a.id) })}>🗑️</button>
            </div>
          ))}
          <button className="btn-cyan" onClick={() => setC({ ...c, anuncios: [...c.anuncios, { id: newId(), texto: "Novo anúncio", ativo: true }] })}>+ Anúncio</button>
        </div>
      )}

      {aba === "firebase" && (
        <div className="card p-4 space-y-2">
          <div className="text-xs text-white/60 mb-2">Cole abaixo os dados da sua conta Firebase. Salvos em localStorage.</div>
          {["apiKey","authDomain","databaseURL","projectId","storageBucket","messagingSenderId","appId"].map(k => (
            <input key={k} className="input" placeholder={k} value={c.firebase?.[k] || ""} onChange={e => setC({ ...c, firebase: { ...(c.firebase || {}), [k]: e.target.value } })} />
          ))}
        </div>
      )}

      {aba === "backup" && <BackupTab />}

      <button className="btn-neon w-full" onClick={() => { setConfig(c); alert("✅ Configurações salvas!"); }}>💾 Salvar Configurações</button>
    </div>
  );
}

/* ============================================================
   🎨 VISUAL TAB — Personalização completa de cores
   Aplica em Site, Admin e PDV ao salvar.
   ============================================================ */

const PRESETS: { nome: string; emoji: string; visual: Partial<Visual> }[] = [
  {
    nome: "Dark Neon (padrão)", emoji: "🌃",
    visual: {
      corPrimaria: "#ff6b35", corSecundaria: "#00d4ff", corDestaque: "#ff2d92",
      corFundo: "#07070a", corFundoCard: "rgba(255,255,255,0.04)", corFundoHeader: "rgba(20,20,28,0.75)",
      corTexto: "#f5f5f7", corTextoSuave: "rgba(255,255,255,0.6)",
      corBotao: "#ff6b35", corBotaoFim: "#ff2d92", corBotaoTexto: "#ffffff",
      corBotaoGhostBg: "rgba(255,255,255,0.05)", corBotaoGhostTexto: "#f5f5f7",
      corSucesso: "#00ff9d", corPerigo: "#ff3355", corAviso: "#ffd400", corInfo: "#00d4ff",
      corBorda: "rgba(255,255,255,0.08)", raioBorda: 16,
    },
  },
  {
    nome: "Cyber Purple", emoji: "🟣",
    visual: {
      corPrimaria: "#a855f7", corSecundaria: "#22d3ee", corDestaque: "#ec4899",
      corFundo: "#0a0612", corFundoCard: "rgba(168,85,247,0.06)", corFundoHeader: "rgba(30,15,50,0.8)",
      corBotao: "#a855f7", corBotaoFim: "#ec4899",
      corBorda: "rgba(168,85,247,0.18)", raioBorda: 18,
    },
  },
  {
    nome: "Matrix Green", emoji: "🟢",
    visual: {
      corPrimaria: "#22c55e", corSecundaria: "#84cc16", corDestaque: "#10b981",
      corFundo: "#020a05", corFundoCard: "rgba(34,197,94,0.05)", corFundoHeader: "rgba(8,28,15,0.85)",
      corBotao: "#22c55e", corBotaoFim: "#10b981",
      corBorda: "rgba(34,197,94,0.18)", raioBorda: 12,
    },
  },
  {
    nome: "Sunset Orange", emoji: "🌅",
    visual: {
      corPrimaria: "#f97316", corSecundaria: "#fbbf24", corDestaque: "#ef4444",
      corFundo: "#1a0a05", corFundoCard: "rgba(249,115,22,0.06)", corFundoHeader: "rgba(40,18,8,0.82)",
      corBotao: "#f97316", corBotaoFim: "#ef4444",
      corBorda: "rgba(249,115,22,0.2)", raioBorda: 16,
    },
  },
  {
    nome: "Ocean Blue", emoji: "🌊",
    visual: {
      corPrimaria: "#3b82f6", corSecundaria: "#06b6d4", corDestaque: "#8b5cf6",
      corFundo: "#04080f", corFundoCard: "rgba(59,130,246,0.05)", corFundoHeader: "rgba(8,18,38,0.82)",
      corBotao: "#3b82f6", corBotaoFim: "#06b6d4",
      corBorda: "rgba(59,130,246,0.18)", raioBorda: 14,
    },
  },
  {
    nome: "Hot Pink", emoji: "💖",
    visual: {
      corPrimaria: "#ec4899", corSecundaria: "#f472b6", corDestaque: "#a855f7",
      corFundo: "#10040c", corFundoCard: "rgba(236,72,153,0.06)", corFundoHeader: "rgba(40,8,28,0.82)",
      corBotao: "#ec4899", corBotaoFim: "#a855f7",
      corBorda: "rgba(236,72,153,0.18)", raioBorda: 18,
    },
  },
];

function ColorField({ label, hint, value, onChange, allowAlpha }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; allowAlpha?: boolean;
}) {
  // Para o input nativo type=color, precisamos de #rrggbb sem alpha
  const hexOnly = value.startsWith("#") ? value.slice(0, 7) : "#000000";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>{label}</label>
        {hint && <span className="text-[10px]" style={{ color: "var(--mh-text-soft)" }}>{hint}</span>}
      </div>
      <div className="flex gap-2 items-center">
        <div className="relative w-12 h-10 rounded-lg overflow-hidden border" style={{ borderColor: "var(--mh-border)" }}>
          <input
            type="color"
            value={hexOnly}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0"
            style={{ background: "transparent" }}
          />
        </div>
        <input
          type="text"
          className="input flex-1 font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowAlpha ? "#rrggbb ou rgba(...)" : "#rrggbb"}
        />
      </div>
    </div>
  );
}

function VisualTab({ c, setC }: { c: ReturnType<typeof useStore>["config"]; setC: (c: any) => void }) {
  const v = c.visual;
  const upd = (patch: Partial<Visual>) => setC({ ...c, visual: { ...v, ...patch } });

  function aplicarPreset(preset: Partial<Visual>) {
    upd(preset);
  }

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <div className="card p-3 flex items-start gap-3 text-sm" style={{ borderColor: "rgba(var(--mh-info-rgb,0,212,255),0.3)" }}>
        <span className="text-2xl">🎨</span>
        <div>
          <div className="font-bold">Personalização Visual Global</div>
          <div className="text-xs" style={{ color: "var(--mh-text-soft)" }}>
            As cores definidas aqui se aplicam às <b>3 interfaces</b>: Site do cliente, Admin e PDV.
            Clique em <b>💾 Salvar Configurações</b> no final para aplicar.
          </div>
        </div>
      </div>

      {/* Presets prontos */}
      <div className="card p-4">
        <h3 className="font-extrabold mb-3 flex items-center gap-2">⚡ Temas Prontos <span className="text-xs font-normal" style={{ color: "var(--mh-text-soft)" }}>(clique para aplicar)</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => aplicarPreset(p.visual)}
              className="rounded-xl p-3 border text-left transition hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${p.visual.corPrimaria}22, ${p.visual.corDestaque}22)`,
                borderColor: "var(--mh-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-bold text-sm">{p.nome}</span>
              </div>
              <div className="flex gap-1">
                <span className="w-6 h-6 rounded-md shadow" style={{ background: p.visual.corPrimaria }} />
                <span className="w-6 h-6 rounded-md shadow" style={{ background: p.visual.corSecundaria }} />
                <span className="w-6 h-6 rounded-md shadow" style={{ background: p.visual.corDestaque }} />
                <span className="w-6 h-6 rounded-md shadow border" style={{ background: p.visual.corFundo, borderColor: "var(--mh-border)" }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="card p-4">
        <h3 className="font-extrabold mb-3 flex items-center gap-2">🏷️ Logo da Marca
          <span className="text-xs font-normal" style={{ color: "var(--mh-text-soft)" }}>
            (aplica no site, header, favicon e ícone do PWA)
          </span>
        </h3>

        <div className="grid md:grid-cols-[180px_1fr] gap-4 items-start">
          {/* Preview */}
          <div className="relative aspect-square rounded-2xl flex items-center justify-center overflow-hidden border"
            style={{
              borderColor: "var(--mh-border)",
              background: "radial-gradient(circle at center, rgba(var(--mh-primary-rgb),.18), transparent 70%)",
            }}>
            {v.logoUrl ? (
              <img src={v.logoUrl} alt="Preview" className="logo-anim w-[85%] h-[85%] object-contain"
                style={{ filter: "drop-shadow(0 0 20px rgba(var(--mh-primary-rgb),.6))" }} />
            ) : (
              <div className="text-5xl opacity-50">🍔</div>
            )}
          </div>

          {/* Controles */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
                URL da Imagem
              </label>
              <input className="input mt-1" value={v.logoUrl}
                onChange={(e) => upd({ logoUrl: e.target.value })}
                placeholder="https://exemplo.com/minha-logo.png" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
                Ou enviar arquivo do dispositivo
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="input mt-1 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--mh-primary)] file:text-white file:font-bold file:cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert("Imagem muito grande! Use uma imagem com até 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => upd({ logoUrl: String(reader.result || "") });
                  reader.readAsDataURL(file);
                }}
              />
              <div className="text-[11px] mt-1" style={{ color: "var(--mh-text-soft)" }}>
                Recomendado: PNG transparente, até 2MB. A imagem fica salva localmente.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="btn-cyan text-xs"
                onClick={() => upd({ logoUrl: "https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572" })}
              >
                ↺ Restaurar logo padrão MH Lanches
              </button>
              {v.logoUrl && (
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => { if (confirm("Remover a logo? O site voltará a exibir o emoji padrão.")) upd({ logoUrl: "" }); }}
                >
                  ✕ Remover logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Marca */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🎯 Cores da Marca</h3>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
            Texto acima da barra de anúncios
          </label>
          <input
            className="input mt-1"
            value={v.textoAcimaAnuncios || ""}
            onChange={(e) => upd({ textoAcimaAnuncios: e.target.value })}
            placeholder="Mais que uma lanchonete!"
          />
          <div className="text-[11px] mt-1" style={{ color: "var(--mh-text-soft)" }}>
            Esse texto aparece no site principal, logo acima da barra rotativa de anúncios.
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <ColorField label="Cor Primária" hint="botões, links, neon" value={v.corPrimaria} onChange={(x) => upd({ corPrimaria: x })} />
          <ColorField label="Cor Secundária" hint="acento" value={v.corSecundaria} onChange={(x) => upd({ corSecundaria: x })} />
          <ColorField label="Cor de Destaque" hint="gradiente final" value={v.corDestaque} onChange={(x) => upd({ corDestaque: x })} />
        </div>
      </div>

      {/* Fundos */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🖼️ Fundos</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <ColorField label="Fundo Geral" hint="background da página" value={v.corFundo} onChange={(x) => upd({ corFundo: x })} />
          <ColorField label="Fundo dos Cards" hint="rgba para transparência" value={v.corFundoCard} onChange={(x) => upd({ corFundoCard: x })} allowAlpha />
          <ColorField label="Fundo do Header" hint="rgba para transparência" value={v.corFundoHeader} onChange={(x) => upd({ corFundoHeader: x })} allowAlpha />
        </div>
      </div>

      {/* Textos */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🔤 Textos</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <ColorField label="Texto Principal" value={v.corTexto} onChange={(x) => upd({ corTexto: x })} />
          <ColorField label="Texto Suave" hint="labels e dicas" value={v.corTextoSuave} onChange={(x) => upd({ corTextoSuave: x })} allowAlpha />
        </div>
      </div>

      {/* Botões */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🔘 Botões</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <ColorField label="Botão (início)" value={v.corBotao} onChange={(x) => upd({ corBotao: x })} />
          <ColorField label="Botão (fim)" hint="gradiente" value={v.corBotaoFim} onChange={(x) => upd({ corBotaoFim: x })} />
          <ColorField label="Texto do Botão" value={v.corBotaoTexto} onChange={(x) => upd({ corBotaoTexto: x })} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <ColorField label="Botão Ghost — Fundo" value={v.corBotaoGhostBg} onChange={(x) => upd({ corBotaoGhostBg: x })} allowAlpha />
          <ColorField label="Botão Ghost — Texto" value={v.corBotaoGhostTexto} onChange={(x) => upd({ corBotaoGhostTexto: x })} />
        </div>
      </div>

      {/* Status */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🚦 Status</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <ColorField label="✅ Sucesso" value={v.corSucesso} onChange={(x) => upd({ corSucesso: x })} />
          <ColorField label="❌ Perigo" value={v.corPerigo} onChange={(x) => upd({ corPerigo: x })} />
          <ColorField label="⚠️ Aviso" value={v.corAviso} onChange={(x) => upd({ corAviso: x })} />
          <ColorField label="ℹ️ Info" value={v.corInfo} onChange={(x) => upd({ corInfo: x })} />
        </div>
      </div>

      {/* Bordas e raio */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">🧱 Bordas & Forma</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <ColorField label="Cor das Bordas" value={v.corBorda} onChange={(x) => upd({ corBorda: x })} allowAlpha />
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
              Raio da Borda — {v.raioBorda}px
            </label>
            <input
              type="range" min={0} max={32} value={v.raioBorda}
              onChange={(e) => upd({ raioBorda: +e.target.value })}
              className="w-full accent-[var(--mh-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Upload de produto */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">📷 Imagens dos Produtos</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
              Largura Máxima — {v.produtoImagemMaxWidth || 1024}px
            </label>
            <input
              type="range"
              min={600}
              max={1600}
              step={32}
              value={v.produtoImagemMaxWidth || 1024}
              onChange={(e) => upd({ produtoImagemMaxWidth: +e.target.value })}
              className="w-full accent-[var(--mh-primary)]"
            />
            <div className="text-[11px] mt-1" style={{ color: "var(--mh-text-soft)" }}>
              Ideal para manter o site rápido no celular. Recomendado: 1024px.
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mh-text-soft)" }}>
              Peso Alvo por Imagem — {v.produtoImagemMaxKB || 280}KB
            </label>
            <input
              type="range"
              min={120}
              max={500}
              step={10}
              value={v.produtoImagemMaxKB || 280}
              onChange={(e) => upd({ produtoImagemMaxKB: +e.target.value })}
              className="w-full accent-[var(--mh-primary)]"
            />
            <div className="text-[11px] mt-1" style={{ color: "var(--mh-text-soft)" }}>
              O editor compacta automaticamente para WebP antes do upload ao Firebase Storage.
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold">👁️ Pré-visualização</h3>
        <div
          className="rounded-2xl p-4 border space-y-3"
          style={{ background: v.corFundo, color: v.corTexto, borderColor: v.corBorda }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${v.corPrimaria}, ${v.corDestaque})` }}
            >🍔</div>
            <div>
              <div className="text-lg font-extrabold" style={{ color: v.corPrimaria }}>{c.loja.nome}</div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: v.corTextoSuave }}>{c.loja.slogan}</div>
            </div>
          </div>
          <div className="rounded-xl p-3 border" style={{ background: v.corFundoCard, borderColor: v.corBorda }}>
            <div className="font-bold mb-1">Card de Produto</div>
            <div className="text-xs mb-3" style={{ color: v.corTextoSuave }}>X-Bacon Especial — pão brioche, blend 180g, bacon crocante.</div>
            <div className="flex gap-2 flex-wrap">
              <button
                className="px-4 py-2 rounded-xl font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${v.corBotao}, ${v.corBotaoFim})`, color: v.corBotaoTexto, borderRadius: v.raioBorda }}
              >Adicionar</button>
              <button
                className="px-4 py-2 rounded-xl font-bold text-sm border"
                style={{ background: v.corBotaoGhostBg, color: v.corBotaoGhostTexto, borderColor: v.corBorda, borderRadius: v.raioBorda }}
              >Ghost</button>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: v.corSucesso + "33", color: v.corSucesso }}>✅ Sucesso</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: v.corPerigo + "33", color: v.corPerigo }}>❌ Perigo</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: v.corAviso + "33", color: v.corAviso }}>⚠️ Aviso</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: v.corInfo + "33", color: v.corInfo }}>ℹ️ Info</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackupTab() {
  const store = useStore();
  function exportar() {
    const data = { config: store.config, categorias: store.categorias, produtos: store.produtos, pedidos: store.pedidos, vendas: store.vendas, cancelados: store.cancelados, mesas: store.mesas, cupons: store.cupons };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mh_backup_${Date.now()}.json`; a.click();
  }
  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result as string);
        if (d.config) store.setConfig(d.config);
        if (d.categorias) store.setCategorias(d.categorias);
        if (d.produtos) store.setProdutos(d.produtos);
        if (d.pedidos) store.setPedidos(d.pedidos);
        if (d.vendas) store.setVendas(d.vendas);
        if (d.cancelados) store.setCancelados(d.cancelados);
        if (d.mesas) store.setMesas(d.mesas);
        if (d.cupons) store.setCupons(d.cupons);
        alert("✅ Backup restaurado!");
      } catch { alert("Arquivo inválido"); }
    };
    r.readAsText(f);
  }
  function reset() {
    const p = prompt("Digite a senha admin para RESETAR todos os dados:");
    if (p === "admin123") {
      ["mh_config","mh_categorias","mh_produtos","mh_pedidos","mh_vendas","mh_cancelados","mh_mesas","mh_cupons"].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    } else if (p) alert("Senha incorreta");
  }
  return (
    <div className="card p-4 space-y-3">
      <button className="btn-neon w-full" onClick={exportar}>📥 Exportar Backup (JSON)</button>
      <label className="btn-cyan w-full block text-center cursor-pointer">
        📤 Importar Backup
        <input type="file" accept="application/json" className="hidden" onChange={importar} />
      </label>
      <button className="btn-ghost w-full text-red-400" onClick={reset}>🔥 RESETAR TUDO (senha: admin123)</button>
    </div>
  );
}
