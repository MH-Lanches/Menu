import { FormEvent, useEffect, useMemo, useState } from "react";

/* ── Tipos ─────────────────────────────────────────────── */
type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
};

type Settings = {
  brandName: string;
  slogan: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrderValue: number;
  accessPin: string;
};

type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  serviceType: "delivery" | "retirada";
  subtotal: number;
  total: number;
  itemsLabel: string;
};

/* ── Constantes ────────────────────────────────────────── */
const SETTINGS_KEY = "delivery-settings";
const PRODUCTS_KEY = "delivery-products";
const ORDERS_KEY = "delivery-orders";

const defaultSettings: Settings = {
  brandName: "ChefExpress",
  slogan: "Sabor na sua porta, rapidez no seu dia",
  whatsappNumber: "5511999999999",
  deliveryFee: 6,
  minOrderValue: 20,
  accessPin: "1234",
};

const defaultProducts: Product[] = [
  {
    id: "p1",
    name: "Smash Burger Artesanal",
    description: "Pão brioche tostado, blend 160g, cheddar derretido e maionese da casa.",
    category: "Burgers",
    price: 29.9,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p2",
    name: "Pizza Marguerita Premium",
    description: "Molho italiano, muçarela de búfala e manjericão fresco.",
    category: "Pizzas",
    price: 49.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p3",
    name: "Combo Executivo",
    description: "Prato do dia + bebida 350ml. Monte seu combo rápido!",
    category: "Combos",
    price: 34,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p4",
    name: "Açaí Premium 500ml",
    description: "Açaí cremoso com granola, banana, leite condensado e morango.",
    category: "Sobremesas",
    price: 22,
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p5",
    name: "Batata Frita Crocante",
    description: "Porção generosa com cheddar e bacon.",
    category: "Acompanhamentos",
    price: 18,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
  },
];

/* ── Helpers ───────────────────────────────────────────── */
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Erro ao salvar:", e);
  }
};

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);

/* ════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════════════════════ */
export default function App() {
  /* ── State ─────────────────────────────────────────── */
  const [mode, setMode] = useState<"shop" | "admin">("shop");
  const [settings, setSettings] = useState<Settings>(() => readStorage(SETTINGS_KEY, defaultSettings));
  const [products, setProducts] = useState<Product[]>(() => readStorage(PRODUCTS_KEY, defaultProducts));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(ORDERS_KEY, []));

  const [cart, setCart] = useState<Record<string, number>>({});
  const [serviceType, setServiceType] = useState<"delivery" | "retirada">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [productDraft, setProductDraft] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    category: "",
    price: 0,
    image: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  /* ── Persistência ──────────────────────────────────── */
  useEffect(() => { saveStorage(SETTINGS_KEY, settings); }, [settings]);
  useEffect(() => { saveStorage(PRODUCTS_KEY, products); }, [products]);
  useEffect(() => { saveStorage(ORDERS_KEY, orders); }, [orders]);

  /* ── Toast ─────────────────────────────────────────── */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  /* ── Derivações ────────────────────────────────────── */
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      const matchSearch = !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [activeCategory, products, search]);

  const cartItems = useMemo(
    () =>
      products
        .map((p) => ({ ...p, qty: cart[p.id] ?? 0 }))
        .filter((p) => p.qty > 0),
    [cart, products]
  );

  const subtotal = useMemo(() => cartItems.reduce((a, i) => a + i.price * i.qty, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((a, i) => a + i.qty, 0), [cartItems]);
  const deliveryFee = serviceType === "delivery" ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  const isOrderValid = subtotal >= settings.minOrderValue && customerName.trim().length >= 3;

  /* ── Ações ─────────────────────────────────────────── */
  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[id] ?? 0) + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const clearOrder = () => {
    setCart({});
    setCustomerName("");
    setCustomerAddress("");
    setNote("");
    setPaymentMethod("Pix");
    setCartOpen(false);
    setCheckoutOpen(false);
  };

  const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");

  const buildWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push(`🛒 *Novo Pedido — ${settings.brandName}*`);
    lines.push("");
    cartItems.forEach((i) => {
      lines.push(`▸ ${i.qty}x ${i.name}  —  ${formatCurrency(i.price * i.qty)}`);
    });
    lines.push("");
    lines.push(`💰 Subtotal: ${formatCurrency(subtotal)}`);
    lines.push(`🚚 Entrega: ${formatCurrency(deliveryFee)}`);
    lines.push(`✅ *Total: ${formatCurrency(total)}*`);
    lines.push("");
    lines.push(`👤 Cliente: ${customerName}`);
    lines.push(`📦 Tipo: ${serviceType === "delivery" ? "Entrega" : "Retirada"}`);
    if (serviceType === "delivery") lines.push(`📍 Endereço: ${customerAddress || "Não informado"}`);
    lines.push(`💳 Pagamento: ${paymentMethod}`);
    if (note.trim()) lines.push(`📝 Obs: ${note}`);
    return lines.join("\n");
  };

  const sendWhatsApp = () => {
    if (!isOrderValid || cartItems.length === 0) return;
    const msg = encodeURIComponent(buildWhatsAppMessage());
    const phone = sanitizePhone(settings.whatsappNumber);
    const url = `https://wa.me/${phone}?text=${msg}`;
    const order: Order = {
      id: uid(),
      createdAt: new Date().toISOString(),
      customerName,
      serviceType,
      subtotal,
      total,
      itemsLabel: cartItems.map((i) => `${i.qty}x ${i.name}`).join(", "),
    };
    setOrders((prev) => [order, ...prev].slice(0, 50));
    window.open(url, "_blank", "noopener,noreferrer");
    clearOrder();
  };

  /* ── Admin helpers ─────────────────────────────────── */
  const unlockAdmin = () => {
    if (adminPinInput === settings.accessPin) {
      setAdminUnlocked(true);
      setAdminPinInput("");
    } else {
      showToast("PIN incorreto!");
    }
  };

  const updateSetting = (key: keyof Settings, value: string | number) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setProductDraft({ name: p.name, description: p.description, category: p.category, price: p.price, image: p.image });
  };

  const resetDraft = () => {
    setEditingId(null);
    setProductDraft({ name: "", description: "", category: "", price: 0, image: "" });
  };

  const saveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!productDraft.name.trim() || !productDraft.category.trim() || productDraft.price <= 0) return;
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...productDraft, price: Number(productDraft.price) } : p))
      );
    } else {
      setProducts((prev) => [{ id: uid(), ...productDraft, price: Number(productDraft.price) }, ...prev]);
    }
    resetDraft();
    showToast(editingId ? "Produto atualizado!" : "Produto adicionado!");
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    showToast("Produto removido");
  };

  /* ── Helpers de input ──────────────────────────────── */
  const inputCls =
    "w-full bg-zinc-800/80 text-white px-4 py-3 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-sm placeholder:text-zinc-500 transition-colors";
  const labelCls = "block text-zinc-400 text-xs font-medium mb-1.5";

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">

      {/* ── TOAST ────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg animate-slide-down">
          {toastMsg}
        </div>
      )}

      {/* ── SHOP ─────────────────────────────────────── */}
      {mode === "shop" && (
        <div className="pb-28">

          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/60">
            <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
                    {settings.brandName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-white leading-tight">{settings.brandName}</h1>
                    <p className="text-[10px] text-zinc-500 leading-tight">{settings.slogan}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMode("admin")}
                  className="btn-press text-zinc-500 hover:text-zinc-300 p-2 -mr-2"
                  aria-label="Painel admin"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Busca */}
              <div className="relative mt-2.5">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar no cardápio..."
                  className="w-full bg-zinc-900 text-white pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="max-w-lg mx-auto px-4 pb-2.5">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`btn-press whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeCategory === cat
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Lista de Produtos */}
          <div className="max-w-lg mx-auto px-4 pt-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🔍</p>
                <p className="text-zinc-500 text-sm">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredProducts.map((product) => {
                  const qty = cart[product.id] ?? 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800/50 animate-fade-in"
                    >
                      <div className="flex gap-3 p-3">
                        {/* Imagem */}
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                          <img
                            src={product.image || "https://placehold.co/200x200/1a1a2e/666?text=📷"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1a1a2e/666?text=📷";
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                            <span className="text-emerald-400 text-xs font-bold">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>

                        {/* Info + ações */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight truncate">
                              {product.name}
                            </h3>
                            <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug line-clamp-2">
                              {product.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-emerald-400 text-sm font-bold">
                              {formatCurrency(product.price)}
                            </span>

                            {qty === 0 ? (
                              <button
                                onClick={() => updateQty(product.id, 1)}
                                className="btn-press bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                              >
                                Adicionar
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg p-1">
                                <button
                                  onClick={() => updateQty(product.id, -1)}
                                  className="btn-press w-7 h-7 flex items-center justify-center bg-red-500/20 text-red-400 rounded-md font-bold text-sm transition-colors"
                                >
                                  −
                                </button>
                                <span className="text-white font-bold text-sm w-6 text-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQty(product.id, 1)}
                                  className="btn-press w-7 h-7 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-sm transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN ────────────────────────────────────── */}
      {mode === "admin" && (
        <div className="pb-8">
          {/* Header Admin */}
          <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/60">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="text-base font-bold text-white">⚙️ Painel Admin</h1>
              <button
                onClick={() => { setAdminUnlocked(false); setMode("shop"); }}
                className="btn-press text-zinc-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800"
              >
                ← Voltar à Loja
              </button>
            </div>
          </header>

          {!adminUnlocked ? (
            <div className="max-w-sm mx-auto px-4 pt-8">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <h2 className="text-lg font-bold text-white mb-1">Acesso Restrito</h2>
                <p className="text-zinc-500 text-xs mb-5">Digite o PIN para gerenciar sua loja</p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
                  className="w-full bg-zinc-800 text-white text-center text-2xl tracking-[0.5em] py-4 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none mb-4"
                  placeholder="····"
                  autoFocus
                />
                <button
                  onClick={unlockAdmin}
                  className="btn-press w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Entrar
                </button>
                <p className="text-zinc-600 text-[10px] mt-4">PIN padrão: 1234</p>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

              {/* Config da loja */}
              <section className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  🏪 Configurações da Loja
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Nome da Marca</label>
                    <input type="text" value={settings.brandName} onChange={(e) => updateSetting("brandName", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Slogan</label>
                    <input type="text" value={settings.slogan} onChange={(e) => updateSetting("slogan", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp (com código do país)</label>
                    <input type="tel" value={settings.whatsappNumber} onChange={(e) => updateSetting("whatsappNumber", e.target.value)} className={inputCls} placeholder="5511999999999" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Taxa Entrega (R$)</label>
                      <input type="number" step="0.01" value={settings.deliveryFee} onChange={(e) => updateSetting("deliveryFee", Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Pedido Mínimo (R$)</label>
                      <input type="number" step="0.01" value={settings.minOrderValue} onChange={(e) => updateSetting("minOrderValue", Number(e.target.value))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>PIN de Acesso</label>
                    <input type="password" maxLength={6} value={settings.accessPin} onChange={(e) => updateSetting("accessPin", e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Form de produto */}
              <section className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <h2 className="text-sm font-bold text-white mb-3">
                  {editingId ? "✏️ Editar Produto" : "➕ Novo Produto"}
                </h2>
                <form onSubmit={saveProduct} className="space-y-3">
                  <div>
                    <label className={labelCls}>Nome</label>
                    <input type="text" value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} className={inputCls} placeholder="Ex: Smash Burger" />
                  </div>
                  <div>
                    <label className={labelCls}>Descrição</label>
                    <textarea value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} className={inputCls + " resize-none"} rows={2} placeholder="Descrição do produto" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Categoria</label>
                      <input type="text" value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })} className={inputCls} placeholder="Ex: Burgers" />
                    </div>
                    <div>
                      <label className={labelCls}>Preço (R$)</label>
                      <input type="number" step="0.01" value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: Number(e.target.value) })} className={inputCls} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>URL da Imagem</label>
                    <input type="url" value={productDraft.image} onChange={(e) => setProductDraft({ ...productDraft, image: e.target.value })} className={inputCls} placeholder="https://..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-press flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                      {editingId ? "Salvar Alterações" : "Adicionar Produto"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetDraft} className="btn-press px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors text-sm">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* Lista de produtos */}
              <section className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <h2 className="text-sm font-bold text-white mb-3">📦 Produtos ({products.length})</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-zinc-600 text-xs text-center py-4">Nenhum produto cadastrado.</p>
                  ) : (
                    products.map((p) => (
                      <div key={p.id} className="bg-zinc-800/60 rounded-xl p-2.5 flex items-center gap-2.5">
                        <img
                          src={p.image || "https://placehold.co/80x80/1a1a2e/666?text=📷"}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/1a1a2e/666?text=📷"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                          <p className="text-emerald-400 text-[10px]">{formatCurrency(p.price)} · {p.category}</p>
                        </div>
                        <button onClick={() => startEdit(p)} className="text-zinc-400 hover:text-blue-400 p-1.5 text-sm">✏️</button>
                        <button onClick={() => removeProduct(p.id)} className="text-zinc-400 hover:text-red-400 p-1.5 text-sm">🗑️</button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Histórico de pedidos */}
              <section className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <h2 className="text-sm font-bold text-white mb-3">📋 Últimos Pedidos ({orders.length})</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-zinc-600 text-xs text-center py-4">Nenhum pedido registrado.</p>
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="bg-zinc-800/60 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-semibold">{o.customerName}</span>
                          <span className="text-emerald-400 text-xs font-bold">{formatCurrency(o.total)}</span>
                        </div>
                        <p className="text-zinc-500 text-[10px] mt-1">
                          {new Date(o.createdAt).toLocaleDateString("pt-BR")} · {o.serviceType === "delivery" ? "Entrega" : "Retirada"}
                        </p>
                        <p className="text-zinc-600 text-[10px] mt-0.5 truncate">{o.itemsLabel}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>
          )}
        </div>
      )}

      {/* ── BARRA FLUTUANTE DO CARRINHO ───────────────── */}
      {mode === "shop" && cartCount > 0 && !cartOpen && !checkoutOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800/60 safe-bottom">
          <div className="max-w-lg mx-auto px-4 py-3">
            <button
              onClick={() => setCartOpen(true)}
              className="btn-press w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-pulse-glow transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
                Ver Carrinho
              </span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET: CARRINHO ────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={() => setCartOpen(false)} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[85vh] overflow-y-auto safe-bottom animate-slide-up">
            <div className="max-w-lg mx-auto p-5">
              {/* Handle */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Seu Carrinho</h2>
                <button onClick={() => setCartOpen(false)} className="text-zinc-400 hover:text-white text-2xl leading-none">×</button>
              </div>

              {/* Itens */}
              <div className="space-y-2.5 mb-5 max-h-[40vh] overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-zinc-600 text-center py-8 text-sm">Seu carrinho está vazio.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="bg-zinc-800/60 rounded-xl p-3 flex items-center gap-3">
                      <img
                        src={item.image || "https://placehold.co/80x80/1a1a2e/666?text=📷"}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/1a1a2e/666?text=📷"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-emerald-400 text-xs font-bold">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="btn-press w-7 h-7 flex items-center justify-center bg-zinc-700 text-white rounded-lg text-sm font-bold">−</button>
                        <span className="text-white font-bold text-sm w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="btn-press w-7 h-7 flex items-center justify-center bg-emerald-500/80 text-white rounded-lg text-sm font-bold">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Resumo + ações */}
              {cartItems.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  {/* Tipo de serviço */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setServiceType("delivery")}
                      className={`btn-press flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        serviceType === "delivery" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      🚚 Entrega
                    </button>
                    <button
                      onClick={() => setServiceType("retirada")}
                      className={`btn-press flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        serviceType === "retirada" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      🏪 Retirada
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>Taxa de entrega</span>
                      <span>{serviceType === "delivery" ? formatCurrency(settings.deliveryFee) : "Grátis"}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-zinc-800">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="btn-press w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
                  >
                    Finalizar Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET: CHECKOUT ────────────────────── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={() => setCheckoutOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[92vh] overflow-y-auto safe-bottom animate-slide-up">
            <div className="max-w-lg mx-auto p-5">
              {/* Handle */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Finalizar Pedido</h2>
                <button onClick={() => setCheckoutOpen(false)} className="text-zinc-400 hover:text-white text-2xl leading-none">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Seu Nome *</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} placeholder="Digite seu nome completo" autoFocus />
                </div>

                {serviceType === "delivery" && (
                  <div>
                    <label className={labelCls}>Endereço de Entrega *</label>
                    <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Rua, número, bairro, complemento" />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Forma de Pagamento</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                    <option value="Pix">💠 Pix</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Cartão de Débito">💳 Cartão de Débito</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " resize-none"} rows={2} placeholder="Ex: Sem cebola, ponto de referência..." />
                </div>

                {/* Resumo final */}
                <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-zinc-400 text-xs">
                    <span>Subtotal ({cartCount} itens)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-xs">
                    <span>Taxa de entrega</span>
                    <span>{serviceType === "delivery" ? formatCurrency(settings.deliveryFee) : "Grátis"}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-700">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {subtotal < settings.minOrderValue && (
                    <p className="text-amber-500 text-[11px]">⚠️ Pedido mínimo: {formatCurrency(settings.minOrderValue)}</p>
                  )}
                </div>

                <button
                  onClick={sendWhatsApp}
                  disabled={!isOrderValid || cartItems.length === 0}
                  className={`btn-press w-full font-semibold py-4 rounded-2xl transition-colors text-sm ${
                    isOrderValid && cartItems.length > 0
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {cartItems.length === 0
                    ? "Adicione itens ao carrinho"
                    : subtotal < settings.minOrderValue
                    ? `Pedido mínimo: ${formatCurrency(settings.minOrderValue)}`
                    : !customerName.trim()
                    ? "Informe seu nome para continuar"
                    : "📱 Enviar Pedido via WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
