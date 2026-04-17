// ============================================================
// MH LANCHES • Shared store (localStorage + cross-tab sync)
// ============================================================
import { useEffect, useState, useCallback } from "react";

export const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572";

// ---------- Types ----------
export type OptionItem = { id: string; nome: string; preco: number; maxRepeat: number };
export type OptionGroup = {
  id: string;
  nome: string;
  regra: string;          // texto de regra exibido
  freeLimit: number;      // qtd grátis total no grupo
  itens: OptionItem[];
};

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagens: string[];      // URLs / dataURI
  destaque?: boolean;
  promocao?: boolean;
  pausado?: boolean;
  meioMeio?: boolean;     // pizza
  multiEscolha?: boolean; // pastel/burguer
  grupos?: OptionGroup[];
  tempoPreparo?: number;
  bebidasSugeridas?: string[]; // ids de produtos bebida
  ordem?: number;
};

export type Categoria = { id: string; nome: string; ordem: number };

export type CartOptionPick = {
  groupId: string;
  groupNome: string;
  itemId: string;
  itemNome: string;
  qtd: number;
  precoUnit: number;     // preço cobrado (0 se grátis)
};

export type CartItem = {
  uid: string;            // unique line id
  produtoId: string;
  nome: string;
  preco: number;          // base
  qtd: number;
  imagem?: string;
  picks?: CartOptionPick[];
  metades?: { nome: string; preco: number }[]; // pizza meio a meio
  obs?: string;
  totalLinha: number;
};

export type Cupom = {
  id: string;
  codigo: string;
  tipo: "percentual" | "valor" | "frete";
  valor: number;
  qtdTotal: number;
  usados: number;
  valorMin: number;
  validade: string;       // ISO date
  ativo: boolean;
};

export type StatusPedido =
  | "novo"
  | "producao"
  | "pronto"
  | "saiu"
  | "entregue"
  | "pago"
  | "cancelado";

export type Pagamento = {
  forma: "dinheiro" | "cartao" | "pix" | "loja";
  troco?: number;
  recebido?: number;
};

export type Pedido = {
  id: string;
  numero: number;
  criadoEm: number;
  atualizadoEm: number;
  status: StatusPedido;
  tipo: "entrega" | "retirada" | "mesa" | "balcao";
  cliente?: string;
  endereco?: string;
  referencia?: string;
  telefone?: string;
  itens: CartItem[];
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
  cupomCodigo?: string;
  pagamento?: Pagamento;
  obs?: string;
  mesa?: string;
  origem: "site" | "pdv";
};

export type DiaHorario = {
  fechado: boolean;
  abre: string;   // "18:00"
  fecha: string;  // "23:00"
};

export type ConfigLoja = {
  nome: string;
  titulo: string;
  slogan: string;
  textoHero: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  instagram: string;
  facebook: string;
  sobre: string;
};

export type ConfigVisual = {
  logoUrl: string;
  cores: {
    primary: string;
    accent: string;
    bg: string;
    card: string;
    text: string;
    btn: string;
    btnText: string;
    success: string;
    danger: string;
  };
  imgMaxWidth: number;
  imgTargetKB: number;
};

export type ConfigDelivery = {
  taxa: number;
  valorMin: number;
  tempoMedio: number;
  raio: number;
};

export type Anuncio = { id: string; texto: string; ativo: boolean };

export type ConfigImpressora = {
  logoUrl: string;
  cabecalho: string;
  rodape: string;
  obs: string;
};

export type ConfigWhats = {
  titulo: string;
  template: string;
};

export type ConfigHorarios = {
  dias: DiaHorario[]; // 0=dom .. 6=sab
  fechamentoProgramado?: { data: string; motivo: string } | null;
};

export type ConfigFirebase = {
  apiKey: string; authDomain: string; databaseURL: string;
  projectId: string; storageBucket: string; messagingSenderId: string; appId: string;
};

export type Config = {
  loja: ConfigLoja;
  visual: ConfigVisual;
  delivery: ConfigDelivery;
  anuncios: Anuncio[];
  impressora: ConfigImpressora;
  whats: ConfigWhats;
  horarios: ConfigHorarios;
  firebase: ConfigFirebase;
};

// ---------- Defaults ----------
const DEFAULT_TEMPLATE = `🍔 *NOVO PEDIDO MH LANCHES*

📋 *Tipo:* {{tipo}}

🛒 *Itens:*
{{itens}}

━━━━━━━━━━━━━━━
Subtotal: R$ {{subtotal}}
Desconto: R$ {{desconto}}
Taxa entrega: R$ {{taxa}}
*TOTAL: R$ {{total}}*
━━━━━━━━━━━━━━━

👤 Cliente: {{cliente}}
📍 Endereço: {{endereco}}
🚩 Referência: {{referencia}}
💳 Pagamento: {{pagamento}}
💸 Troco: {{troco}}

Obrigado! 🙏`;

export const DEFAULT_CONFIG: Config = {
  loja: {
    nome: "MH Lanches",
    titulo: "MH Lanches • Delivery",
    slogan: "Mais que uma lanchonete!",
    textoHero: "Mais que uma lanchonete!",
    telefone: "(11) 99999-9999",
    whatsapp: "5511999999999",
    endereco: "Rua das Brasas, 123",
    cidade: "São Paulo - SP",
    instagram: "@mhlanches",
    facebook: "mhlanches",
    sobre: "Os melhores lanches artesanais da região, feitos com ingredientes selecionados.",
  },
  visual: {
    logoUrl: LOGO_URL,
    cores: {
      primary: "#ff6b35",
      accent: "#00d4ff",
      bg: "#07070a",
      card: "rgba(255,255,255,0.05)",
      text: "#f5f5f7",
      btn: "#ff6b35",
      btnText: "#ffffff",
      success: "#22c55e",
      danger: "#ef4444",
    },
    imgMaxWidth: 1024,
    imgTargetKB: 250,
  },
  delivery: { taxa: 8, valorMin: 20, tempoMedio: 45, raio: 5 },
  anuncios: [
    { id: "a1", texto: "🔥 Combo família com 20% OFF — use cupom FAMILIA20", ativo: true },
    { id: "a2", texto: "🛵 Entrega rápida em toda região!", ativo: true },
    { id: "a3", texto: "⭐ Experimente nosso Smash Duplo, sucesso da casa!", ativo: true },
  ],
  impressora: {
    logoUrl: LOGO_URL,
    cabecalho: "MH LANCHES\nCNPJ: 00.000.000/0001-00\nRua das Brasas, 123\nTel: (11) 99999-9999",
    rodape: "Obrigado pela preferência!\nVolte sempre! 🍔",
    obs: "Cupom não-fiscal",
  },
  whats: { titulo: "Pedido MH Lanches", template: DEFAULT_TEMPLATE },
  horarios: {
    dias: [
      { fechado: false, abre: "18:00", fecha: "23:30" }, // dom
      { fechado: true,  abre: "18:00", fecha: "23:00" }, // seg
      { fechado: false, abre: "18:00", fecha: "23:00" }, // ter
      { fechado: false, abre: "18:00", fecha: "23:00" }, // qua
      { fechado: false, abre: "18:00", fecha: "23:00" }, // qui
      { fechado: false, abre: "18:00", fecha: "00:00" }, // sex
      { fechado: false, abre: "18:00", fecha: "00:00" }, // sab
    ],
    fechamentoProgramado: null,
  },
  firebase: { apiKey: "", authDomain: "", databaseURL: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" },
};

// ---------- Demo data ----------
const DEMO_CATS: Categoria[] = [
  { id: "c1", nome: "🍔 Lanches",  ordem: 1 },
  { id: "c2", nome: "🍕 Pizzas",   ordem: 2 },
  { id: "c3", nome: "🥟 Pastéis",  ordem: 3 },
  { id: "c4", nome: "🥤 Bebidas",  ordem: 4 },
];

const IMG_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=70&auto=format&fit=crop";
const IMG_SMASH  = "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=70&auto=format&fit=crop";
const IMG_CHEESE = "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=70&auto=format&fit=crop";
const IMG_PIZZA  = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=70&auto=format&fit=crop";
const IMG_PASTEL = "https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=800&q=70&auto=format&fit=crop";
const IMG_COCA   = "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=70&auto=format&fit=crop";
const IMG_GUARA  = "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=600&q=70&auto=format&fit=crop";
const IMG_SUCO   = "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=70&auto=format&fit=crop";
const IMG_AGUA   = "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=70&auto=format&fit=crop";

const DEMO_PRODS: Produto[] = [
  {
    id: "p1", nome: "X-Bacon", descricao: "Hambúrguer 150g, queijo cheddar, bacon crocante, alface, tomate e maionese da casa.",
    preco: 28.9, categoria: "c1", imagens: [IMG_BURGER, IMG_SMASH], destaque: true,
    bebidasSugeridas: ["b1", "b3"], ordem: 1, tempoPreparo: 25,
  },
  {
    id: "p2", nome: "Smash Duplo", descricao: "Dois smashes 90g, queijo cheddar derretido, cebola caramelizada e molho especial.",
    preco: 32.5, categoria: "c1", imagens: [IMG_SMASH, IMG_BURGER], destaque: true, promocao: true,
    bebidasSugeridas: ["b1", "b2"], ordem: 2, tempoPreparo: 30,
  },
  {
    id: "p3", nome: "Cheese Burger", descricao: "Hambúrguer 120g com queijo cheddar duplo, picles e maionese.",
    preco: 22.0, categoria: "c1", imagens: [IMG_CHEESE], bebidasSugeridas: ["b1", "b4"], ordem: 3, tempoPreparo: 20,
  },
  {
    id: "p4", nome: "Pizza Margherita (Meio a Meio)", descricao: "Pizza grande, escolha 2 sabores!",
    preco: 49.9, categoria: "c2", imagens: [IMG_PIZZA], meioMeio: true, ordem: 1, tempoPreparo: 35,
    grupos: [{
      id: "g_pz", nome: "Sabores", regra: "Escolha até 2 sabores", freeLimit: 2,
      itens: [
        { id: "s1", nome: "Margherita", preco: 49.9, maxRepeat: 2 },
        { id: "s2", nome: "Calabresa", preco: 52.9, maxRepeat: 2 },
        { id: "s3", nome: "Portuguesa", preco: 54.9, maxRepeat: 2 },
        { id: "s4", nome: "Frango c/ Catupiry", preco: 56.9, maxRepeat: 2 },
        { id: "s5", nome: "Quatro Queijos", preco: 58.9, maxRepeat: 2 },
      ],
    }],
  },
  {
    id: "p5", nome: "Pastel Especial", descricao: "Pastel grande, monte do seu jeito!",
    preco: 12.0, categoria: "c3", imagens: [IMG_PASTEL], multiEscolha: true, ordem: 1, tempoPreparo: 15,
    grupos: [
      {
        id: "g1", nome: "Sabores", regra: "Escolha até 2 sabores grátis", freeLimit: 2,
        itens: [
          { id: "i1", nome: "Carne", preco: 3.0, maxRepeat: 2 },
          { id: "i2", nome: "Queijo", preco: 3.0, maxRepeat: 2 },
          { id: "i3", nome: "Frango", preco: 3.5, maxRepeat: 2 },
          { id: "i4", nome: "Pizza", preco: 3.0, maxRepeat: 2 },
          { id: "i5", nome: "Palmito", preco: 4.0, maxRepeat: 2 },
        ],
      },
      {
        id: "g2", nome: "Adicionais", regra: "Escolha até 5 adicionais grátis (acima cobra)", freeLimit: 5,
        itens: [
          { id: "a1", nome: "Salada", preco: 1.0, maxRepeat: 3 },
          { id: "a2", nome: "Orégano", preco: 0.5, maxRepeat: 1 },
          { id: "a3", nome: "Pimenta", preco: 0.5, maxRepeat: 1 },
          { id: "a4", nome: "Catupiry extra", preco: 3.5, maxRepeat: 3 },
          { id: "a5", nome: "Bacon", preco: 4.0, maxRepeat: 3 },
        ],
      },
    ],
  },
  { id: "b1", nome: "Coca-Cola 350ml", descricao: "Lata gelada 350ml.", preco: 6.0, categoria: "c4", imagens: [IMG_COCA], ordem: 1 },
  { id: "b2", nome: "Guaraná 2L", descricao: "Garrafa 2 litros gelada.", preco: 14.0, categoria: "c4", imagens: [IMG_GUARA], ordem: 2 },
  { id: "b3", nome: "Suco de Laranja 500ml", descricao: "Natural, sem açúcar.", preco: 9.0, categoria: "c4", imagens: [IMG_SUCO], ordem: 3 },
  { id: "b4", nome: "Água Mineral 500ml", descricao: "Sem gás.", preco: 4.0, categoria: "c4", imagens: [IMG_AGUA], ordem: 4 },
];

const DEMO_CUPONS: Cupom[] = [
  { id: "cp1", codigo: "FAMILIA20", tipo: "percentual", valor: 20, qtdTotal: 100, usados: 0, valorMin: 50, validade: "2030-12-31", ativo: true },
  { id: "cp2", codigo: "FRETE",     tipo: "frete",      valor: 0,  qtdTotal: 50,  usados: 0, valorMin: 30, validade: "2030-12-31", ativo: true },
];

// ---------- Storage helpers ----------
const KEYS = {
  config: "mh_config",
  produtos: "mh_produtos",
  categorias: "mh_categorias",
  pedidos: "mh_pedidos",
  vendas: "mh_vendas",
  cancelados: "mh_cancelados",
  cupons: "mh_cupons",
  favoritos: "mh_favoritos",
  pedidoAtivo: "mh_pedido_ativo",
  numero: "mh_numero",
  visitas: "mh_visitas",
  funil: "mh_funil",
  picos: "mh_picos",
  session: "mh_session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
function write<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {/* noop */}
}

export function getConfig(): Config {
  const cfg = read<Config>(KEYS.config, DEFAULT_CONFIG);
  // merge to ensure new fields exist
  return {
    ...DEFAULT_CONFIG,
    ...cfg,
    loja:       { ...DEFAULT_CONFIG.loja, ...(cfg.loja || {}) },
    visual:     { ...DEFAULT_CONFIG.visual, ...(cfg.visual || {}), cores: { ...DEFAULT_CONFIG.visual.cores, ...((cfg.visual?.cores) || {}) } },
    delivery:   { ...DEFAULT_CONFIG.delivery, ...(cfg.delivery || {}) },
    impressora: { ...DEFAULT_CONFIG.impressora, ...(cfg.impressora || {}) },
    whats:      { ...DEFAULT_CONFIG.whats, ...(cfg.whats || {}) },
    horarios:   { ...DEFAULT_CONFIG.horarios, ...(cfg.horarios || {}) },
    firebase:   { ...DEFAULT_CONFIG.firebase, ...(cfg.firebase || {}) },
    anuncios:   cfg.anuncios?.length ? cfg.anuncios : DEFAULT_CONFIG.anuncios,
  };
}
export function setConfig(c: Config) { write(KEYS.config, c); broadcast("config"); }

export function getProdutos(): Produto[] {
  const arr = read<Produto[]>(KEYS.produtos, []);
  if (!arr.length) { write(KEYS.produtos, DEMO_PRODS); return DEMO_PRODS; }
  return arr;
}
export function setProdutos(p: Produto[]) { write(KEYS.produtos, p); broadcast("produtos"); }

export function getCategorias(): Categoria[] {
  const arr = read<Categoria[]>(KEYS.categorias, []);
  if (!arr.length) { write(KEYS.categorias, DEMO_CATS); return DEMO_CATS; }
  return arr;
}
export function setCategorias(c: Categoria[]) { write(KEYS.categorias, c); broadcast("categorias"); }

export function getPedidos(): Pedido[] { return read<Pedido[]>(KEYS.pedidos, []); }
export function setPedidos(p: Pedido[]) { write(KEYS.pedidos, p); broadcast("pedidos"); }

export function getVendas(): Pedido[] { return read<Pedido[]>(KEYS.vendas, []); }
export function setVendas(p: Pedido[]) { write(KEYS.vendas, p); broadcast("vendas"); }

export function getCancelados(): Pedido[] { return read<Pedido[]>(KEYS.cancelados, []); }
export function setCancelados(p: Pedido[]) { write(KEYS.cancelados, p); broadcast("cancelados"); }

export function getCupons(): Cupom[] {
  const arr = read<Cupom[]>(KEYS.cupons, []);
  if (!arr.length) { write(KEYS.cupons, DEMO_CUPONS); return DEMO_CUPONS; }
  return arr;
}
export function setCupons(c: Cupom[]) { write(KEYS.cupons, c); broadcast("cupons"); }

export function getFavoritos(): string[] { return read<string[]>(KEYS.favoritos, []); }
export function setFavoritos(f: string[]) { write(KEYS.favoritos, f); broadcast("favoritos"); }

export function getPedidoAtivoId(): string | null { return read<string | null>(KEYS.pedidoAtivo, null); }
export function setPedidoAtivoId(id: string | null) { write(KEYS.pedidoAtivo, id); broadcast("pedidoAtivo"); }

export function nextNumero(): number {
  const n = read<number>(KEYS.numero, 1000);
  const next = n + 1;
  write(KEYS.numero, next);
  return next;
}

// ---------- Analytics ----------
export function trackVisita(page: string) {
  const v = read<{ ts: number; page: string }[]>(KEYS.visitas, []);
  v.push({ ts: Date.now(), page });
  write(KEYS.visitas, v.slice(-2000));
  const h = new Date().getHours();
  const picos = read<Record<string, number>>(KEYS.picos, {});
  picos[h] = (picos[h] || 0) + 1;
  write(KEYS.picos, picos);
}
export function trackFunil(evt: "carrinho_aberto" | "produto_adicionado" | "pedido_enviado") {
  const f = read<Record<string, number>>(KEYS.funil, {});
  f[evt] = (f[evt] || 0) + 1;
  write(KEYS.funil, f);
}
export function getAnalytics() {
  return {
    visitas: read<{ ts: number; page: string }[]>(KEYS.visitas, []),
    funil: read<Record<string, number>>(KEYS.funil, {}),
    picos: read<Record<string, number>>(KEYS.picos, {}),
  };
}

// ---------- Cross-tab sync ----------
type Channel = "config" | "produtos" | "categorias" | "pedidos" | "vendas" | "cancelados" | "cupons" | "favoritos" | "pedidoAtivo";
const SYNC_KEY = "mh_sync_event";
function broadcast(channel: Channel) {
  try { localStorage.setItem(SYNC_KEY, channel + ":" + Date.now()); } catch {/*noop*/}
  window.dispatchEvent(new CustomEvent("mh-sync", { detail: channel }));
}
export function useSync(channels: Channel[], cb: () => void) {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key !== SYNC_KEY) return;
      const ch = (e.newValue || "").split(":")[0] as Channel;
      if (channels.includes(ch)) cb();
    };
    const onCustom = (e: Event) => {
      const ch = (e as CustomEvent).detail as Channel;
      if (channels.includes(ch)) cb();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("mh-sync", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mh-sync", onCustom as EventListener);
    };
  }, [channels, cb]);
}

// React hook for live data
export function useLive<T>(getter: () => T, channels: Channel[]): [T, () => void] {
  const [v, setV] = useState<T>(() => getter());
  const refresh = useCallback(() => setV(getter()), [getter]);
  useSync(channels, refresh);
  return [v, refresh];
}

// ---------- Open / Closed ----------
export function isLojaAberta(cfg: Config = getConfig()): boolean {
  const fp = cfg.horarios.fechamentoProgramado;
  if (fp && fp.data === new Date().toISOString().slice(0, 10)) return false;
  const now = new Date();
  const dia = cfg.horarios.dias[now.getDay()];
  if (!dia || dia.fechado) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [ah, am] = dia.abre.split(":").map(Number);
  const [fh, fm] = dia.fecha.split(":").map(Number);
  const a = ah * 60 + am;
  let f = fh * 60 + fm;
  if (f <= a) f += 24 * 60; // cruza meia-noite
  const curN = cur < a ? cur + 24 * 60 : cur;
  return curN >= a && curN <= f;
}

// ---------- Format ----------
export const fmt = (n: number) => "R$ " + n.toFixed(2).replace(".", ",");
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- Apply CSS vars from config ----------
export function applyTheme(c: Config = getConfig()) {
  const r = document.documentElement;
  r.style.setProperty("--mh-primary", c.visual.cores.primary);
  r.style.setProperty("--mh-accent", c.visual.cores.accent);
  r.style.setProperty("--mh-bg-1", c.visual.cores.bg);
  r.style.setProperty("--mh-text", c.visual.cores.text);
  r.style.setProperty("--mh-success", c.visual.cores.success);
  r.style.setProperty("--mh-danger", c.visual.cores.danger);
}

// ---------- Build WhatsApp message ----------
export function buildWhatsMsg(p: Pedido, cfg: Config = getConfig()): string {
  const itens = p.itens.map(i => {
    const extras = i.picks?.length ? "\n   " + i.picks.map(x => `• ${x.qtd}x ${x.itemNome}${x.precoUnit > 0 ? ` (+${fmt(x.precoUnit * x.qtd)})` : ""}`).join("\n   ") : "";
    const metades = i.metades?.length ? "\n   " + i.metades.map(m => `½ ${m.nome}`).join("\n   ") : "";
    const obs = i.obs ? `\n   📝 ${i.obs}` : "";
    return `• ${i.qtd}x ${i.nome} — ${fmt(i.totalLinha)}${metades}${extras}${obs}`;
  }).join("\n");

  const map: Record<string, string> = {
    itens, subtotal: p.subtotal.toFixed(2).replace(".", ","),
    desconto: p.desconto.toFixed(2).replace(".", ","),
    taxa: p.taxa.toFixed(2).replace(".", ","),
    total: p.total.toFixed(2).replace(".", ","),
    cliente: p.cliente || "-", endereco: p.endereco || "-",
    referencia: p.referencia || "-",
    pagamento: p.pagamento?.forma === "dinheiro" ? "Dinheiro" : p.pagamento?.forma === "cartao" ? "Cartão" : p.pagamento?.forma === "pix" ? "PIX" : p.pagamento?.forma === "loja" ? "Pagar na loja" : "-",
    troco: p.pagamento?.troco ? fmt(p.pagamento.troco) : "Não",
    tipo: p.tipo === "entrega" ? "🛵 ENTREGA" : p.tipo === "retirada" ? "🏪 RETIRADA" : p.tipo,
    obs: p.obs || "-",
  };
  return cfg.whats.template.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] ?? "");
}
