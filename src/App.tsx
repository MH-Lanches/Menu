import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
};

type Category = {
  id: string;
  name: string;
  order: number;
};

type Settings = {
  brandName: string;
  slogan: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrderValue: number;
  accessPin: string;
};

type Theme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
};

type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  serviceType: "delivery" | "retirada";
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemsLabel: string;
  items: { name: string; quantity: number; price: number }[];
  paymentMethod: string;
  address?: string;
  note?: string;
};

const SETTINGS_KEY = "delivery-settings";
const PRODUCTS_KEY = "delivery-products";
const CATEGORIES_KEY = "delivery-categories";
const THEME_KEY = "delivery-theme";
const ORDERS_KEY = "delivery-orders";

const defaultSettings: Settings = {
  brandName: "Delivery",
  slogan: "Seu delivery favorito",
  whatsappNumber: "5511999999999",
  deliveryFee: 5,
  minOrderValue: 20,
  accessPin: "1234",
};

const defaultTheme: Theme = {
  primary: "#10b981",
  secondary: "#6366f1",
  accent: "#f59e0b",
  background: "#09090b",
  surface: "#18181b",
  text: "#f4f4f5",
  textMuted: "#a1a1aa",
};

const defaultCategories: Category[] = [
  { id: "cat1", name: "Lanches", order: 0 },
  { id: "cat2", name: "Pizzas", order: 1 },
  { id: "cat3", name: "Bebidas", order: 2 },
  { id: "cat4", name: "Sobremesas", order: 3 },
];

const defaultProducts: Product[] = [
  {
    id: "p1",
    name: "Hambúrguer Artesanal",
    description: "Pão brioche, carne 180g, queijo, alface, tomate e maionese",
    category: "Lanches",
    price: 24.9,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  },
  {
    id: "p2",
    name: "Pizza Marguerita",
    description: "Massa italiana, tomate, mussarela e manjericão",
    category: "Pizzas",
    price: 45.9,
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&q=80",
  },
  {
    id: "p3",
    name: "Refrigerante 350ml",
    description: "Lata",
    category: "Bebidas",
    price: 5,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
  },
  {
    id: "p4",
    name: "Sorvete",
    description: "Diversos sabores",
    category: "Sobremesas",
    price: 12,
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get("admin") === "1" ? "admin" : "shop";

  const [mode] = useState<"shop" | "admin">(initialMode);
  const [settings, setSettings] = useState<Settings>(() => readStorage(SETTINGS_KEY, defaultSettings));
  const [theme, setTheme] = useState<Theme>(() => readStorage(THEME_KEY, defaultTheme));
  const [categories, setCategories] = useState<Category[]>(() => readStorage(CATEGORIES_KEY, defaultCategories));
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
  const [adminTab, setAdminTab] = useState<"dashboard" | "settings" | "products" | "categories" | "theme">("dashboard");

  const [productDraft, setProductDraft] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    category: "",
    price: 0,
    image: "",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [categoryDraft, setCategoryDraft] = useState("");
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Persistência
  useEffect(() => window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);
  useEffect(() => window.localStorage.setItem(THEME_KEY, JSON.stringify(theme)), [theme]);
  useEffect(() => window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)), [categories]);
  useEffect(() => window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)), [products]);
  useEffect(() => window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)), [orders]);

  // Categorias ordenadas
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Todos", ...sortedCategories.filter((c) => set.has(c.name)).map((c) => c.name)];
  }, [products, sortedCategories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const sameCategory = activeCategory === "Todos" || product.category === activeCategory;
        const query = search.trim().toLowerCase();
        const hasSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
        return sameCategory && hasSearch;
      })
      .sort((a, b) => {
        const catA = sortedCategories.find((c) => c.name === a.category)?.order ?? 0;
        const catB = sortedCategories.find((c) => c.name === b.category)?.order ?? 0;
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
      });
  }, [activeCategory, products, search, sortedCategories]);

  const cartItems = useMemo(() => {
    return products
      .map((product) => ({ ...product, quantity: cart[product.id] ?? 0 }))
      .filter((p) => p.quantity > 0);
  }, [cart, products]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = serviceType === "delivery" ? settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  const isOrderValid = subtotal >= settings.minOrderValue && customerName.trim().length >= 2;

  // Dashboard stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveryOrders = orders.filter((o) => o.serviceType === "delivery").length;
    const pickupOrders = orders.filter((o) => o.serviceType === "retirada").length;
    return { totalOrders, totalRevenue, avgOrder, deliveryOrders, pickupOrders };
  }, [orders]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + delta;
      if (nextQuantity <= 0) {
        const { [productId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: nextQuantity };
    });
  };

  const clearOrderState = () => {
    setCart({});
    setCustomerName("");
    setCustomerAddress("");
    setNote("");
    setPaymentMethod("Pix");
    setMobileCartOpen(false);
  };

  const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");

  const buildMessage = () => {
    const lines: string[] = [];
    lines.push(`*🍔 Novo Pedido - ${settings.brandName}*`);
    lines.push("");
    lines.push("*Itens:*");
    cartItems.forEach((item) => {
      lines.push(`• ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`);
    });
    lines.push("");
    lines.push(`_Subtotal: ${formatCurrency(subtotal)}_`);
    if (serviceType === "delivery") {
      lines.push(`_Taxa entrega: ${formatCurrency(deliveryFee)}_`);
    }
    lines.push(`*TOTAL: ${formatCurrency(total)}*`);
    lines.push("");
    lines.push("*Cliente:* " + customerName);
    lines.push("*Tipo:* " + (serviceType === "delivery" ? "🚗 Entrega" : "🏠 Retirada"));
    if (serviceType === "delivery" && customerAddress.trim()) {
      lines.push("*Endereço:* " + customerAddress);
    }
    lines.push("*Pagamento:* " + paymentMethod);
    if (note.trim()) {
      lines.push("*Obs:* " + note);
    }
    return lines.join("\n");
  };

  const checkoutOnWhatsApp = () => {
    if (!isOrderValid || cartItems.length === 0) return;

    const message = buildMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = sanitizePhone(settings.whatsappNumber);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;

    const order: Order = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      customerName,
      serviceType,
      subtotal,
      deliveryFee,
      total,
      itemsLabel: cartItems.map((item) => `${item.quantity}x ${item.name}`).join(", "),
      items: cartItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      paymentMethod,
      address: serviceType === "delivery" ? customerAddress : undefined,
      note: note.trim() || undefined,
    };

    setOrders((current) => [order, ...current].slice(0, 50));
    window.open(url, "_blank", "noopener,noreferrer");
    clearOrderState();
  };

  // Product handlers
  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductDraft({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  const resetProductDraft = () => {
    setEditingProductId(null);
    setProductDraft({ name: "", description: "", category: "", price: 0, image: "" });
  };

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!productDraft.name.trim() || !productDraft.category.trim() || productDraft.price <= 0) return;

    if (editingProductId) {
      setProducts((current) =>
        current.map((p) => (p.id === editingProductId ? { ...p, ...productDraft, price: Number(productDraft.price) } : p))
      );
      resetProductDraft();
      return;
    }

    const newProduct: Product = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      ...productDraft,
      price: Number(productDraft.price),
    };
    setProducts((current) => [newProduct, ...current]);
    resetProductDraft();
  };

  const removeProduct = (id: string) => {
    setProducts((current) => current.filter((p) => p.id !== id));
    setCart((current) => {
      const { [id]: _, ...rest } = current;
      return rest;
    });
  };

  const handleDragStart = (id: string) => setDraggedProduct(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedProduct || draggedProduct === targetId) return;
    setProducts((current) => {
      const items = [...current];
      const fromIndex = items.findIndex((p) => p.id === draggedProduct);
      const toIndex = items.findIndex((p) => p.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return items;
    });
    setDraggedProduct(null);
  };

  // Category handlers
  const addCategory = () => {
    if (!categoryDraft.trim()) return;
    const newCat: Category = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      name: categoryDraft.trim(),
      order: categories.length,
    };
    setCategories((current) => [...current, newCat]);
    setCategoryDraft("");
  };

  const removeCategory = (id: string) => {
    setCategories((current) => current.filter((c) => c.id !== id));
  };

  const moveCategory = (id: string, direction: "up" | "down") => {
    setCategories((current) => {
      const items = [...current].sort((a, b) => a.order - b.order);
      const index = items.findIndex((c) => c.id === id);
      if (index === -1) return current;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return current;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return items.map((c, i) => ({ ...c, order: i }));
    });
  };

  // CSS vars for theme
  const cssVars = {
    "--primary": theme.primary,
    "--secondary": theme.secondary,
    "--accent": theme.accent,
    "--background": theme.background,
    "--surface": theme.surface,
    "--text": theme.text,
    "--text-muted": theme.textMuted,
  } as React.CSSProperties;

  // Admin Tabs
  const AdminTabs = () => (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {[
        { key: "dashboard", label: "📊 Dashboard" },
        { key: "settings", label: "⚙️ Configurações" },
        { key: "products", label: "🍔 Produtos" },
        { key: "categories", label: "📁 Categorias" },
        { key: "theme", label: "🎨 Cores" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setAdminTab(tab.key as typeof adminTab)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            adminTab === tab.key ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
          style={adminTab === tab.key ? { backgroundColor: theme.primary, color: "#000" } : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Render Shop
  const renderShop = () => (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/50" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: theme.text }}>
              {settings.brandName}
            </h1>
            <p className="text-xs" style={{ color: theme.textMuted }}>{settings.slogan}</p>
          </div>
          <a
            href="?admin=1"
            className="rounded-lg p-2 text-xs hover:bg-zinc-800"
            style={{ color: theme.textMuted }}
          >
            ⚙️
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-40 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
          alt="Hero"
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundColor: theme.background }} />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-2xl font-bold" style={{ color: theme.text }}>
            {settings.brandName}
          </p>
          <p className="text-sm" style={{ color: theme.textMuted }}>{settings.slogan}</p>
        </div>
      </section>

      {/* Search */}
      <div className="px-4 py-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none"
          style={{ color: theme.text }}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: activeCategory === cat ? theme.primary : "transparent",
              color: activeCategory === cat ? "#000" : theme.textMuted,
              border: activeCategory !== cat ? `1px solid ${theme.surface}` : "none",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {filteredProducts.map((product) => {
          const quantity = cart[product.id] ?? 0;
          return (
            <motion.div
              key={product.id}
              layout
              className="group relative overflow-hidden rounded-xl border border-zinc-800"
              style={{ backgroundColor: theme.surface }}
              draggable
              onDragStart={() => handleDragStart(product.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(product.id)}
            >
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold" style={{ color: theme.text }}>
                  {product.name}
                </p>
                <p className="mt-1 text-xs line-clamp-2" style={{ color: theme.textMuted }}>
                  {product.description}
                </p>
                <p className="mt-2 font-semibold" style={{ color: theme.primary }}>
                  {formatCurrency(product.price)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  {quantity === 0 ? (
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-full rounded-lg py-2 text-xs font-medium"
                      style={{ backgroundColor: theme.primary, color: "#000" }}
                    >
                      Adicionar
                    </button>
                  ) : (
                    <div className="flex w-full items-center justify-between rounded-lg bg-zinc-800/50 p-1">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold"
                        style={{ color: theme.primary }}
                      >
                        −
                      </button>
                      <span className="font-medium" style={{ color: theme.text }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold"
                        style={{ color: theme.primary }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 p-3 pb-safe" style={{ backgroundColor: theme.background }}>
          <button
            onClick={() => setMobileCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-medium"
            style={{ backgroundColor: theme.primary, color: "#000" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-sm">
                {cartItemCount}
              </span>
              <span className="font-semibold">Ver pedido</span>
            </div>
            <span className="font-bold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      <AnimatePresence>
        {mobileCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setMobileCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: theme.surface }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
                <h3 className="text-lg font-bold" style={{ color: theme.text }}>Seu Pedido</h3>
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="rounded-lg px-3 py-1 text-sm"
                  style={{ backgroundColor: theme.surface, color: theme.textMuted }}
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(85vh - 200px)" }}>
                {cartItems.length === 0 ? (
                  <p className="text-center py-8" style={{ color: theme.textMuted }}>Carrinho vazio</p>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                        <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: theme.text }}>{item.name}</p>
                          <p className="text-sm" style={{ color: theme.primary }}>{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-full border border-zinc-700"
                            style={{ color: theme.text }}
                          >
                            −
                          </button>
                          <span className="w-6 text-center" style={{ color: theme.text }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-full border border-zinc-700"
                            style={{ color: theme.text }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Form */}
              {cartItems.length > 0 && (
                <div className="border-t border-zinc-800 p-4">
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => setServiceType("delivery")}
                      className="flex-1 rounded-lg py-2 text-sm font-medium"
                      style={{
                        backgroundColor: serviceType === "delivery" ? theme.primary : "transparent",
                        color: serviceType === "delivery" ? "#000" : theme.textMuted,
                        border: `1px solid ${serviceType === "delivery" ? theme.primary : theme.surface}`,
                      }}
                    >
                      🚗 Entrega
                    </button>
                    <button
                      onClick={() => setServiceType("retirada")}
                      className="flex-1 rounded-lg py-2 text-sm font-medium"
                      style={{
                        backgroundColor: serviceType === "retirada" ? theme.primary : "transparent",
                        color: serviceType === "retirada" ? "#000" : theme.textMuted,
                        border: `1px solid ${serviceType === "retirada" ? theme.primary : theme.surface}`,
                      }}
                    >
                      🏠 Retirada
                    </button>
                  </div>

                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none"
                    style={{ color: theme.text }}
                  />

                  {serviceType === "delivery" && (
                    <input
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Endereço de entrega"
                      className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none"
                      style={{ color: theme.text }}
                    />
                  )}

                  <input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Pagamento (Pix, Dinheiro, Cartão)"
                    className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none"
                    style={{ color: theme.text }}
                  />

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Observações (opcional)"
                    rows={2}
                    className="mb-3 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none"
                    style={{ color: theme.text }}
                  />

                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span style={{ color: theme.textMuted }}>Subtotal</span>
                    <span style={{ color: theme.text }}>{formatCurrency(subtotal)}</span>
                  </div>
                  {serviceType === "delivery" && (
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span style={{ color: theme.textMuted }}>Taxa entrega</span>
                      <span style={{ color: theme.text }}>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between text-lg font-bold">
                    <span style={{ color: theme.text }}>Total</span>
                    <span style={{ color: theme.primary }}>{formatCurrency(total)}</span>
                  </div>
                  <p className="mb-3 text-xs" style={{ color: theme.textMuted }}>
                    Pedido mínimo: {formatCurrency(settings.minOrderValue)}
                  </p>

                  <button
                    onClick={checkoutOnWhatsApp}
                    disabled={!isOrderValid}
                    className="w-full rounded-xl py-3 font-bold transition disabled:opacity-50"
                    style={{ backgroundColor: isOrderValid ? theme.primary : theme.surface, color: isOrderValid ? "#000" : theme.textMuted }}
                  >
                    💬 Enviar pedido no WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );

  // Render Admin
  const renderAdmin = () => (
    <main className="min-h-screen p-4 pb-20">
      <div className="mx-auto max-w-2xl">
        {!adminUnlocked ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 p-6" style={{ backgroundColor: theme.surface }}>
              <h2 className="text-xl font-bold" style={{ color: theme.text }}>🔐 Admin</h2>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Digite seu PIN para acessar</p>
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="PIN"
                className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-lg tracking-widest outline-none"
                style={{ color: theme.text }}
                onKeyDown={(e) => e.key === "Enter" && setAdminUnlocked(adminPinInput === settings.accessPin)}
              />
              <button
                onClick={() => setAdminUnlocked(adminPinInput === settings.accessPin)}
                className="mt-4 w-full rounded-xl py-3 font-semibold"
                style={{ backgroundColor: theme.primary, color: "#000" }}
              >
                Entrar
              </button>
              <div className="mt-4 text-center">
                <a href="." className="text-sm underline" style={{ color: theme.textMuted }}>← Voltar para loja</a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold" style={{ color: theme.text }}>Painel Admin</h1>
              <div className="flex gap-2">
                <a
                  href="."
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: theme.surface, color: theme.text }}
                >
                  ← Loja
                </a>
                <button
                  onClick={() => setAdminUnlocked(false)}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: theme.surface, color: theme.text }}
                >
                  Sair
                </button>
              </div>
            </div>

            <AdminTabs />

            {/* Dashboard */}
            {adminTab === "dashboard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Pedidos</p>
                    <p className="text-2xl font-bold" style={{ color: theme.primary }}>{stats.totalOrders}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Receita</p>
                    <p className="text-2xl font-bold" style={{ color: theme.text }}>{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Ticket Médio</p>
                    <p className="text-2xl font-bold" style={{ color: theme.text }}>{formatCurrency(stats.avgOrder)}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-xs" style={{ color: theme.textMuted }}>Entregas</p>
                    <p className="text-2xl font-bold" style={{ color: theme.text }}>{stats.deliveryOrders}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: theme.surface }}>
                  <h3 className="mb-3 font-semibold" style={{ color: theme.text }}>Últimos Pedidos</h3>
                  {orders.length === 0 ? (
                    <p className="text-sm" style={{ color: theme.textMuted }}>Nenhum pedido ainda</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <div>
                            <p className="font-medium" style={{ color: theme.text }}>{order.customerName}</p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>{order.itemsLabel}</p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>
                              {new Date(order.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" style={{ color: theme.primary }}>{formatCurrency(order.total)}</p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>
                              {order.serviceType === "delivery" ? "🚗" : "🏠"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings */}
            {adminTab === "settings" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: theme.surface }}>
                  <h3 className="mb-4 font-semibold" style={{ color: theme.text }}>Configurações</h3>
                  <div className="space-y-3">
                    <input
                      value={settings.brandName}
                      onChange={(e) => setSettings((s) => ({ ...s, brandName: e.target.value }))}
                      placeholder="Nome da marca"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <input
                      value={settings.slogan}
                      onChange={(e) => setSettings((s) => ({ ...s, slogan: e.target.value }))}
                      placeholder="Slogan"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <input
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))}
                      placeholder="WhatsApp (com DDI)"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={settings.deliveryFee}
                        onChange={(e) => setSettings((s) => ({ ...s, deliveryFee: Number(e.target.value) }))}
                        placeholder="Taxa entrega"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                        style={{ color: theme.text }}
                      />
                      <input
                        type="number"
                        value={settings.minOrderValue}
                        onChange={(e) => setSettings((s) => ({ ...s, minOrderValue: Number(e.target.value) }))}
                        placeholder="Pedido mín."
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                        style={{ color: theme.text }}
                      />
                    </div>
                    <input
                      type="password"
                      value={settings.accessPin}
                      onChange={(e) => setSettings((s) => ({ ...s, accessPin: e.target.value }))}
                      placeholder="PIN Admin"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {adminTab === "products" && (
              <div className="space-y-4">
                <form onSubmit={handleSaveProduct} className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: theme.surface }}>
                  <h3 className="mb-4 font-semibold" style={{ color: theme.text }}>
                    {editingProductId ? "Editar Produto" : "Novo Produto"}
                  </h3>
                  <div className="space-y-3">
                    <input
                      value={productDraft.name}
                      onChange={(e) => setProductDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nome"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <textarea
                      value={productDraft.description}
                      onChange={(e) => setProductDraft((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Descrição"
                      rows={2}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={productDraft.category}
                        onChange={(e) => setProductDraft((p) => ({ ...p, category: e.target.value }))}
                        placeholder="Categoria"
                        list="category-list"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                        style={{ color: theme.text }}
                      />
                      <datalist id="category-list">
                        {categories.map((c) => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                      <input
                        type="number"
                        step="0.01"
                        value={productDraft.price || ""}
                        onChange={(e) => setProductDraft((p) => ({ ...p, price: Number(e.target.value) }))}
                        placeholder="Preço"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                        style={{ color: theme.text }}
                      />
                    </div>
                    <input
                      value={productDraft.image}
                      onChange={(e) => setProductDraft((p) => ({ ...p, image: e.target.value }))}
                      placeholder="URL da imagem"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      style={{ color: theme.text }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-medium"
                        style={{ backgroundColor: theme.primary, color: "#000" }}
                      >
                        {editingProductId ? "Salvar" : "Adicionar"}
                      </button>
                      {editingProductId && (
                        <button
                          type="button"
                          onClick={resetProductDraft}
                          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
                          style={{ color: theme.text }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
                    Arraste para reordenar • {products.length} produtos
                  </p>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
                      style={{ backgroundColor: theme.surface }}
                      draggable
                      onDragStart={() => handleDragStart(product.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(product.id)}
                    >
                      <span className="text-xl">⋮⋮</span>
                      <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: theme.text }}>{product.name}</p>
                        <p className="text-sm" style={{ color: theme.primary }}>{formatCurrency(product.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditProduct(product)}
                          className="rounded-lg border border-zinc-700 px-3 py-1 text-xs"
                          style={{ color: theme.text }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {adminTab === "categories" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={categoryDraft}
                    onChange={(e) => setCategoryDraft(e.target.value)}
                    placeholder="Nova categoria"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                    style={{ color: theme.text }}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="rounded-lg px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: theme.primary, color: "#000" }}
                  >
                    +
                  </button>
                </div>

                <div className="space-y-2">
                  {sortedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <span className="font-medium" style={{ color: theme.text }}>{cat.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveCategory(cat.id, "up")}
                          className="rounded-lg border border-zinc-700 px-2 py-1 text-xs"
                          style={{ color: theme.text }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCategory(cat.id, "down")}
                          className="rounded-lg border border-zinc-700 px-2 py-1 text-xs"
                          style={{ color: theme.text }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeCategory(cat.id)}
                          className="rounded-lg border border-red-500/50 px-2 py-1 text-xs text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theme */}
            {adminTab === "theme" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: theme.surface }}>
                  <h3 className="mb-4 font-semibold" style={{ color: theme.text }}>Paleta de Cores</h3>
                  <div className="space-y-4">
                    {[
                      { key: "primary", label: "Cor Principal (Botões)" },
                      { key: "secondary", label: "Cor Secundária" },
                      { key: "accent", label: "Cor de Destaque" },
                      { key: "background", label: "Fundo" },
                      { key: "surface", label: "Superfície (Cards)" },
                      { key: "text", label: "Texto" },
                      { key: "textMuted", label: "Texto Secundário" },
                    ].map((field) => (
                      <div key={field.key} className="flex items-center justify-between">
                        <label className="text-sm" style={{ color: theme.textMuted }}>{field.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={theme[field.key as keyof Theme]}
                            onChange={(e) => setTheme((t) => ({ ...t, [field.key]: e.target.value }))}
                            className="h-10 w-14 cursor-pointer rounded-lg border-0"
                          />
                          <span className="text-xs font-mono" style={{ color: theme.textMuted }}>
                            {theme[field.key as keyof Theme]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 p-4" style={{ backgroundColor: theme.surface }}>
                  <h3 className="mb-4 font-semibold" style={{ color: theme.text }}>Preview</h3>
                  <div className="flex gap-3">
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium"
                      style={{ backgroundColor: theme.primary, color: "#000" }}
                    >
                      Botão Principal
                    </button>
                    <button
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
                      style={{ color: theme.text }}
                    >
                      Secundário
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );

  return (
    <div style={cssVars}>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {mode === "shop" ? renderShop() : renderAdmin()}
      </div>
    </div>
  );
}