import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

/* ======================== TYPES ======================== */
export type Categoria = { id: string; nome: string; ordem: number };

export type GrupoOpcao = {
  id: string;
  nome: string;             // Ex: Sabores
  limiteGratis: number;     // Ex: 5
  itens: { id: string; nome: string; preco: number; maxRepeat: number }[];
};

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  precoPromo?: number;
  categoriaId: string;
  imagens: string[];
  destaque?: boolean;
  promocao?: boolean;
  pausado?: boolean;
  tempoPreparoMin?: number;
  tipo: "simples" | "meio" | "multi";
  grupos?: GrupoOpcao[];   // multi / meio
  ordem: number;
  vendidos?: number;
  avaliacao?: number;
  ofertaBebidas?: string[];
};

export type CarrinhoItem = {
  uid: string;
  produtoId: string;
  nome: string;
  qtd: number;
  precoBase: number;
  precoExtras: number;
  imagem?: string;
  selecoes?: { grupo: string; itens: { nome: string; qtd: number; preco: number; gratis: number }[] }[];
  obs?: string;
};

export type Cupom = {
  id: string; codigo: string; tipo: "perc" | "valor" | "frete";
  valor: number; minimo: number; total: number; usados: number; validade: string;
};

export type Pedido = {
  id: string;
  numero: number;
  cliente: { nome: string; tel: string; endereco?: string; referencia?: string };
  itens: CarrinhoItem[];
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
  pagamento: string;
  troco?: number;
  tipoPedido?: "retirada" | "entrega";
  obs?: string;
  status: "novo" | "producao" | "pronto" | "saiu" | "entregue" | "pago" | "cancelado" | "finalizado";
  historicoStatus?: { status: "novo" | "producao" | "pronto" | "saiu" | "entregue" | "pago" | "cancelado" | "finalizado"; em: number }[];
  criadoEm: number;
  origem: "site" | "balcao" | "mesa";
  mesa?: string;
};

export type Mesa = { id: string; nome: string; itens: CarrinhoItem[]; abertaEm: number };

export type Visual = {
  logoUrl: string;
  textoAcimaAnuncios: string;
  /* Marca */
  corPrimaria: string;        // botões principais, neon laranja
  corSecundaria: string;      // acento ciano
  corDestaque: string;        // rosa/pink (gradiente)
  /* Fundos */
  corFundo: string;           // background geral
  corFundoCard: string;       // cards / glass
  corFundoHeader: string;     // header / navbars
  /* Textos */
  corTexto: string;           // texto principal
  corTextoSuave: string;      // texto secundário/labels
  /* Botões */
  corBotao: string;           // bg botão primário (gradient start)
  corBotaoFim: string;        // bg botão primário (gradient end)
  corBotaoTexto: string;      // texto do botão primário
  corBotaoGhostBg: string;    // bg botão ghost
  corBotaoGhostTexto: string; // texto botão ghost
  /* Status */
  corSucesso: string;
  corPerigo: string;
  corAviso: string;
  corInfo: string;
  /* Bordas */
  corBorda: string;
  /* Raio */
  raioBorda: number;          // px
  /* Upload de produtos */
  produtoImagemMaxKB?: number;
  produtoImagemMaxWidth?: number;
};

export type Config = {
  loja: { nome: string; titulo: string; slogan: string; tel: string; endereco: string; cidade: string };
  visual: Visual;
  social: { whatsapp: string; instagram: string; tiktok: string; site: string };
  sobre: { titulo: string; texto1: string; texto2: string; imagem: string };
  rodape: { esq: string; dir: string; copyright: string };
  horarios: { [k: string]: { aberto: boolean; abre: string; fecha: string } };
  delivery: { taxa: number; minimo: number; tempoMedio: number; raio: number };
  anuncios: { id: string; texto: string; ativo: boolean }[];
  firebase?: any;
};

const dia = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

/* ======================== DEFAULT DATA ======================== */
const defaultConfig: Config = {
  loja: { nome: "MH Lanches", titulo: "MH Lanches • Hamburgueria Artesanal", slogan: "O sabor que conquista!", tel: "(11) 99999-9999", endereco: "Av. Paulista, 1000", cidade: "São Paulo - SP" },
  visual: {
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572",
    textoAcimaAnuncios: "Mais que uma lanchonete!",
    corPrimaria: "#ff6b35",
    corSecundaria: "#00d4ff",
    corDestaque: "#ff2d92",
    corFundo: "#07070a",
    corFundoCard: "rgba(255,255,255,0.04)",
    corFundoHeader: "rgba(20,20,28,0.75)",
    corTexto: "#f5f5f7",
    corTextoSuave: "rgba(255,255,255,0.6)",
    corBotao: "#ff6b35",
    corBotaoFim: "#ff2d92",
    corBotaoTexto: "#ffffff",
    corBotaoGhostBg: "rgba(255,255,255,0.05)",
    corBotaoGhostTexto: "#f5f5f7",
    corSucesso: "#00ff9d",
    corPerigo: "#ff3355",
    corAviso: "#ffd400",
    corInfo: "#00d4ff",
    corBorda: "rgba(255,255,255,0.08)",
    raioBorda: 16,
    produtoImagemMaxKB: 280,
    produtoImagemMaxWidth: 1024,
  },
  social: { whatsapp: "5511999999999", instagram: "@mhlanches", tiktok: "@mhlanches", site: "mhlanches.com" },
  sobre: { titulo: "Sobre a MH Lanches", texto1: "Há mais de 10 anos servindo os melhores lanches da região com ingredientes frescos e selecionados.", texto2: "Nossa missão é entregar sabor, qualidade e rapidez em cada pedido!", imagem: "" },
  rodape: { esq: "MH Lanches © Todos os direitos", dir: "Pedidos via WhatsApp", copyright: "Desenvolvido com ❤️" },
  horarios: Object.fromEntries(dia.map(d => [d, { aberto: true, abre: "18:00", fecha: "23:30" }])) as any,
  delivery: { taxa: 7, minimo: 25, tempoMedio: 45, raio: 8 },
  anuncios: [
    { id: "a1", texto: "🔥 PROMOÇÃO: 2 X-Bacon + 2 Refrigerantes por R$ 49,90!", ativo: true },
    { id: "a2", texto: "🚚 Entrega grátis acima de R$ 80,00", ativo: true },
  ],
};

const idGen = () => Math.random().toString(36).slice(2, 10);

const defaultCategorias: Categoria[] = [
  { id: "c1", nome: "🍔 Hambúrgueres", ordem: 1 },
  { id: "c2", nome: "🍕 Pizzas", ordem: 2 },
  { id: "c3", nome: "🥟 Pastéis", ordem: 3 },
  { id: "c4", nome: "🥤 Bebidas", ordem: 4 },
  { id: "c5", nome: "🍟 Acompanhamentos", ordem: 5 },
];

const defaultProdutos: Produto[] = [
  {
    id: "p1", nome: "X-Bacon Especial", descricao: "Pão brioche, blend 180g, bacon crocante, queijo cheddar derretido, alface, tomate e molho da casa.",
    preco: 32.9, precoPromo: 28.9, categoriaId: "c1",
    imagens: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"],
    destaque: true, promocao: true, tipo: "simples", ordem: 1, vendidos: 142, avaliacao: 4.9, ofertaBebidas: ["p6", "p7"],
  },
  {
    id: "p2", nome: "Smash Duplo", descricao: "Dois discos de carne smash, queijo prato duplo, cebola caramelizada e maionese verde.",
    preco: 36.9, categoriaId: "c1",
    imagens: ["https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600"],
    destaque: true, tipo: "simples", ordem: 2, vendidos: 98, avaliacao: 4.8, ofertaBebidas: ["p6", "p7"],
  },
  {
    id: "p3", nome: "Cheese Burger Clássico", descricao: "Pão, hambúrguer 150g, queijo cheddar, picles e molho especial.",
    preco: 24.9, categoriaId: "c1",
    imagens: ["https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600"],
    tipo: "simples", ordem: 3, vendidos: 76, avaliacao: 4.7, ofertaBebidas: ["p6", "p7"],
  },
  {
    id: "p4", nome: "Pizza Grande - Monte a sua", descricao: "Massa artesanal 35cm. Escolha até 2 sabores e personalize com bordas e adicionais.",
    preco: 59.9, categoriaId: "c2",
    imagens: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"],
    destaque: true, tipo: "meio", ordem: 1, tempoPreparoMin: 30, vendidos: 64, avaliacao: 4.9, ofertaBebidas: ["p6", "p7"],
    grupos: [
      { id: "g1", nome: "Sabores", limiteGratis: 2, itens: [
        { id: "i1", nome: "Calabresa", preco: 8, maxRepeat: 2 },
        { id: "i2", nome: "Mussarela", preco: 6, maxRepeat: 2 },
        { id: "i3", nome: "Portuguesa", preco: 10, maxRepeat: 2 },
        { id: "i4", nome: "Frango c/ Catupiry", preco: 10, maxRepeat: 2 },
      ]},
      { id: "g2", nome: "Borda", limiteGratis: 0, itens: [
        { id: "i5", nome: "Sem Borda", preco: 0, maxRepeat: 1 },
        { id: "i6", nome: "Borda Catupiry", preco: 9, maxRepeat: 1 },
        { id: "i7", nome: "Borda Cheddar", preco: 9, maxRepeat: 1 },
      ]},
    ],
  },
  {
    id: "p5", nome: "Pastel Personalizado", descricao: "Massa fina e crocante. Monte do seu jeito!",
    preco: 14.9, categoriaId: "c3",
    imagens: ["https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"],
    tipo: "multi", ordem: 1, vendidos: 51, avaliacao: 4.6, ofertaBebidas: ["p6", "p7"],
    grupos: [
      { id: "g3", nome: "Recheios", limiteGratis: 3, itens: [
        { id: "r1", nome: "Carne", preco: 3, maxRepeat: 3 },
        { id: "r2", nome: "Queijo", preco: 3, maxRepeat: 3 },
        { id: "r3", nome: "Frango", preco: 3, maxRepeat: 3 },
        { id: "r4", nome: "Calabresa", preco: 3, maxRepeat: 3 },
        { id: "r5", nome: "Palmito", preco: 4, maxRepeat: 2 },
      ]},
      { id: "g4", nome: "Adicionais", limiteGratis: 1, itens: [
        { id: "a1", nome: "Catupiry", preco: 2, maxRepeat: 2 },
        { id: "a2", nome: "Bacon", preco: 3, maxRepeat: 2 },
        { id: "a3", nome: "Cheddar", preco: 2, maxRepeat: 2 },
      ]},
    ],
  },
  {
    id: "p6", nome: "Coca-Cola 2L", descricao: "Refrigerante gelado 2 litros.", preco: 14, categoriaId: "c4",
    imagens: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600"], tipo: "simples", ordem: 1, vendidos: 200, avaliacao: 4.8,
  },
  {
    id: "p7", nome: "Suco Natural Laranja 500ml", descricao: "Suco natural feito na hora.", preco: 9.5, categoriaId: "c4",
    imagens: ["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600"], tipo: "simples", ordem: 2, vendidos: 60, avaliacao: 4.7,
  },
  {
    id: "p8", nome: "Batata Frita Crocante", descricao: "Porção 400g com cheddar e bacon opcional.", preco: 22, categoriaId: "c5",
    imagens: ["https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600"], tipo: "simples", ordem: 1, vendidos: 88, avaliacao: 4.9,
  },
];

const defaultCupons: Cupom[] = [
  { id: "cu1", codigo: "BEMVINDO10", tipo: "perc", valor: 10, minimo: 30, total: 100, usados: 4, validade: "2026-12-31" },
  { id: "cu2", codigo: "FRETEGRATIS", tipo: "frete", valor: 0, minimo: 50, total: 50, usados: 12, validade: "2026-12-31" },
];

/* ======================== STORE ======================== */
type Store = {
  config: Config;
  setConfig: (c: Config) => void;
  categorias: Categoria[];
  setCategorias: (c: Categoria[]) => void;
  produtos: Produto[];
  setProdutos: (p: Produto[]) => void;
  pedidos: Pedido[];
  setPedidos: (p: Pedido[]) => void;
  vendas: Pedido[];
  setVendas: (v: Pedido[]) => void;
  cancelados: Pedido[];
  setCancelados: (c: Pedido[]) => void;
  mesas: Mesa[];
  setMesas: (m: Mesa[]) => void;
  cupons: Cupom[];
  setCupons: (c: Cupom[]) => void;
  proximoNumero: () => number;
};

const Ctx = createContext<Store | null>(null);

function useLS<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : init; } catch { return init; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useLS<Config>("mh_config", defaultConfig);
  const [categorias, setCategorias] = useLS<Categoria[]>("mh_categorias", defaultCategorias);
  const [produtos, setProdutos] = useLS<Produto[]>("mh_produtos", defaultProdutos);
  const [pedidos, setPedidos] = useLS<Pedido[]>("mh_pedidos", []);
  const [vendas, setVendas] = useLS<Pedido[]>("mh_vendas", []);
  const [cancelados, setCancelados] = useLS<Pedido[]>("mh_cancelados", []);
  const [mesas, setMesas] = useLS<Mesa[]>("mh_mesas", []);
  const [cupons, setCupons] = useLS<Cupom[]>("mh_cupons", defaultCupons);

  const proximoNumero = useCallback(() => {
    const all = [...pedidos, ...vendas, ...cancelados];
    return (all.length === 0 ? 1000 : Math.max(...all.map(p => p.numero)) + 1);
  }, [pedidos, vendas, cancelados]);

  // sincronizar entre abas
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key?.startsWith("mh_")) return;
      try {
        if (e.key === "mh_pedidos" && e.newValue) setPedidos(JSON.parse(e.newValue));
        if (e.key === "mh_produtos" && e.newValue) setProdutos(JSON.parse(e.newValue));
        if (e.key === "mh_categorias" && e.newValue) setCategorias(JSON.parse(e.newValue));
        if (e.key === "mh_vendas" && e.newValue) setVendas(JSON.parse(e.newValue));
        if (e.key === "mh_cancelados" && e.newValue) setCancelados(JSON.parse(e.newValue));
        if (e.key === "mh_mesas" && e.newValue) setMesas(JSON.parse(e.newValue));
        if (e.key === "mh_config" && e.newValue) setConfig(JSON.parse(e.newValue));
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo(() => ({
    config, setConfig, categorias, setCategorias, produtos, setProdutos,
    pedidos, setPedidos, vendas, setVendas, cancelados, setCancelados,
    mesas, setMesas, cupons, setCupons, proximoNumero,
  }), [config, categorias, produtos, pedidos, vendas, cancelados, mesas, cupons, proximoNumero]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

/* ======================== HELPERS ======================== */
export const fmt = (n: number) => "R$ " + (n || 0).toFixed(2).replace(".", ",");
export const newId = idGen;

export function calcExtraGrupo(g: GrupoOpcao, sel: { id: string; qtd: number }[]) {
  const total = sel.reduce((s, x) => s + x.qtd, 0);
  let pagos = Math.max(0, total - g.limiteGratis);
  // ordenar selecionados por preco desc para cobrar os mais caros primeiro
  const ordenados = [...sel].map(s => ({...s, preco: g.itens.find(i => i.id === s.id)?.preco ?? 0}))
    .sort((a, b) => b.preco - a.preco);
  let extra = 0;
  for (const item of ordenados) {
    const cobrar = Math.min(item.qtd, pagos);
    extra += cobrar * item.preco;
    pagos -= cobrar;
    if (pagos <= 0) break;
  }
  return extra;
}
