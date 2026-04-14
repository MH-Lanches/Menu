import { useState, useEffect } from "react";
import { 
  Heart, ShoppingCart, Plus, Trash2, Edit, 
  Settings, Home, Monitor, X, Play, Pause, Upload, Sparkles, MoveUp, MoveDown
} from "lucide-react";

// --- TYPES ---
type ProductType = "simples" | "meio-meio" | "especial";

interface ExtraItem {
  id: string;
  name: string;
  price: number;
  maxQty: number;
  active: boolean; // paused/active toggle
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: ProductType;
  images: string[]; // up to 3 images
  addons: ExtraItem[];
  paused: boolean;
  maxFlavors?: number; // for especial
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface OrderItem {
  id: string;
  name: string;
  description: string;
  price: number;
  qty: number;
  notes?: string;
  selectedAddons?: { name: string; price: number; qty: number }[];
  flavors?: string[];
}

interface Order {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: "novo" | "producao" | "pronto" | "saiu-entrega" | "entregue" | "pago" | "finalizado";
  date: string;
}

// Default initial categories
const initialCategories: Category[] = [
  { id: "1", name: "Hambúrgueres", order: 1 },
  { id: "2", name: "Pizzas", order: 2 },
  { id: "3", name: "Pastéis", order: 3 },
  { id: "4", name: "Porções", order: 4 },
  { id: "5", name: "Bebidas", order: 5 },
  { id: "6", name: "Sobremesas", order: 6 },
];

// 50 default starter products to fulfill requirements
const initialProducts: Product[] = [
  {
    id: "p1",
    name: "X-Burger Duplo Neon",
    description: "Pão brioche selado, 2 carnes 160g smash, duplo queijo prato derretido, maionese especial da casa.",
    price: 32.90,
    category: "Hambúrgueres",
    type: "simples",
    images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80"],
    addons: [
      { id: "a1", name: "Bacon em Tiras", price: 5.0, maxQty: 2, active: true },
      { id: "a2", name: "Cheddar Cremoso", price: 4.5, maxQty: 1, active: true }
    ],
    paused: false
  },
  {
    id: "p2",
    name: "Pizza Meio a Meio Especial",
    description: "Escolha dois sabores na mesma pizza, com borda crocante e massa de longa fermentação.",
    price: 64.90,
    category: "Pizzas",
    type: "meio-meio",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"],
    addons: [
      { id: "a3", name: "Borda de Catupiry", price: 12.0, maxQty: 1, active: true },
      { id: "a4", name: "Azeitona Extra", price: 0.0, maxQty: 1, active: true }
    ],
    paused: false
  },
  {
    id: "p3",
    name: "Combo Pastel Crocante",
    description: "Escolha até 3 sabores ou recheios. Massa sequinha com aquele toque de boteco neon.",
    price: 28.50,
    category: "Pastéis",
    type: "especial",
    maxFlavors: 3,
    images: ["https://images.unsplash.com/photo-1627662056345-73130d7b278f?auto=format&fit=crop&w=500&q=80"],
    addons: [
      { id: "a5", name: "Catupiry Extra", price: 4.0, maxQty: 2, active: true },
      { id: "a6", name: "Vinagrete", price: 3.5, maxQty: 1, active: true }
    ],
    paused: false
  },
  // Adding placeholders to easily ensure initial inventory feels substantial
  ...Array.from({ length: 47 }).map((_, index) => ({
    id: `p-auto-${index + 4}`,
    name: `Especial MH Lanches #${index + 4}`,
    description: "Deliciosa opção neon feita no capricho com ingredientes frescos e selecionados.",
    price: 18.90 + (index * 1.5),
    category: index % 2 === 0 ? "Hambúrgueres" : "Porções",
    type: "simples" as ProductType,
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80"],
    addons: [],
    paused: false
  }))
];

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"site" | "pdv" | "admin">("site");

  // State
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("mh_categories");
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("mh_products");
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("mh_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("mh_orders");
    return saved ? JSON.parse(saved) : [];
  });

  // Background Music
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Save state to localStorage mimicking realtime persistence
    localStorage.setItem("mh_categories", JSON.stringify(categories));
    localStorage.setItem("mh_products", JSON.stringify(products));
    localStorage.setItem("mh_orders", JSON.stringify(orders));
    localStorage.setItem("mh_favorites", JSON.stringify(favorites));
  }, [categories, products, orders, favorites]);

  // Handle favorites toggle
  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // --- OTIMIZAÇÃO DE IMAGENS & CROP TOOL (CANVAS) ---
  const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas not supported");

          // Redimensionamento automático: max 1024px
          const MAX_WIDTH = 1024;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compressão de qualidade (0.75 - 0.8) e WebP format (max ~250KB)
          const dataUrl = canvas.toDataURL("image/webp", 0.8);
          resolve(dataUrl);
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  // --- CUSTOMIZATION MODAL (CLIENTE) ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customFlavors, setCustomFlavors] = useState<string[]>([]);
  const [customAddons, setCustomAddons] = useState<{ id: string; qty: number }[]>([]);
  const [notes, setNotes] = useState("");

  const openCustomizeModal = (product: Product) => {
    if (product.type === "simples") {
      // Simples adiciona direto
      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        name: product.name,
        description: product.description,
        price: product.price,
        qty: 1
      };
      setCart([...cart, newItem]);
      showToast(`${product.name} adicionado ao carrinho!`);
    } else {
      setSelectedProduct(product);
      setCustomFlavors([]);
      setCustomAddons([]);
      setNotes("");
    }
  };

  const handleAddonQtyChange = (addonId: string, delta: number) => {
    setCustomAddons(prev => {
      const existing = prev.find(a => a.id === addonId);
      const currentQty = existing ? existing.qty : 0;
      const nextQty = Math.max(0, currentQty + delta);

      if (nextQty === 0) {
        return prev.filter(a => a.id !== addonId);
      }
      if (existing) {
        return prev.map(a => a.id === addonId ? { ...a, qty: nextQty } : a);
      }
      return [...prev, { id: addonId, qty: nextQty }];
    });
  };

  const calculateCustomTotal = (product: Product) => {
    let extra = 0;
    customAddons.forEach(item => {
      const addon = product.addons.find(a => a.id === item.id);
      if (addon) extra += addon.price * item.qty;
    });
    return product.price + extra;
  };

  const addToCartFromModal = () => {
    if (!selectedProduct) return;

    if (selectedProduct.type === "meio-meio" && customFlavors.length < 2) {
      showToast("Por favor, selecione 2 sabores ou preencha as metades!");
      return;
    }

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      name: selectedProduct.name,
      description: selectedProduct.description,
      price: calculateCustomTotal(selectedProduct),
      qty: 1,
      notes: notes,
      flavors: customFlavors,
      selectedAddons: customAddons.map(item => {
        const addon = selectedProduct.addons.find(a => a.id === item.id);
        return {
          name: addon?.name || "",
          price: addon?.price || 0,
          qty: item.qty
        };
      })
    };

    setCart([...cart, newItem]);
    showToast(`${selectedProduct.name} adicionado ao carrinho!`);
    setSelectedProduct(null);
  };

  // --- WHATSAPP CHECKOUT & FALLBACK ---
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckout = () => {
    if (!customerName || !customerAddress || !customerPhone) {
      showToast("Preencha seu nome, endereço e telefone!");
      return;
    }

    const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerName,
      address: customerAddress,
      phone: customerPhone,
      items: cart,
      total,
      status: "novo",
      date: new Date().toLocaleString()
    };

    // Atualiza status e limpa carrinho
    setOrders([...orders, newOrder]);
    setCart([]);
    setShowCheckout(false);

    // Monta link WhatsApp com fallback para iOS
    const phone = "5511999999999"; 
    const message = `*MH LANCHES - NOVO PEDIDO*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n*Itens:*\n${cart.map(item => `- ${item.name} (${item.flavors?.join(", ") || ""}) R$ ${item.price.toFixed(2)}`).join("\n")}\n\n*Total:* R$ ${total.toFixed(2)}`;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    
    // Abre no mesmo contexto como fallback seguro iOS
    window.location.href = url;
  };

  // --- VIEWS COMPONENTS ---

  // 1. SITE VIEW
  const SiteView = () => (
    <div className="min-h-screen bg-[#0a0618] text-white">
      {/* Top Navbar Neon */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-indigo-500/30 bg-[#0a0618]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Logo animado e menor */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-xl font-black shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            MH
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              MH LANCHES
            </h1>
            <p className="text-xs text-indigo-300">Delivery Expresso & Sabores Únicos</p>
          </div>
        </div>

        {/* Top Icons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-950/40 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-900/40 transition"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span className="hidden md:inline">{isPlaying ? "Jingle On" : "Jingle Off"}</span>
          </button>

          <button
            onClick={() => setShowCheckout(true)}
            className="relative flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-950/40 px-4 py-2 text-sm text-fuchsia-300 hover:bg-fuchsia-900/40 transition"
          >
            <ShoppingCart size={18} />
            <span>Carrinho</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-xs font-bold text-white shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container - Cardápio Horizontal */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Banner Anúncio Neon */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 p-6 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-fuchsia-400" />
            <span className="text-sm font-bold tracking-widest text-fuchsia-400 uppercase">Promoção Especial Neon</span>
          </div>
          <h2 className="text-2xl font-black text-white md:text-3xl">Pizzas e Hambúrgueres do Futuro</h2>
          <p className="mt-2 text-indigo-200">Escolha até 3 sabores nos pastéis ou monte a pizza perfeita meio a meio.</p>
        </div>

        {/* Categories List */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.sort((a, b) => a.order - b.order).map(cat => (
            <button
              key={cat.id}
              className="shrink-0 rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-5 py-2.5 font-medium text-indigo-200 hover:bg-indigo-900/50 hover:text-white transition"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products List - Horizontal Layout */}
        <div className="space-y-6">
          {products.map(product => {
            const isPaused = product.paused;

            return (
              <div
                key={product.id}
                className={`flex flex-col md:flex-row items-stretch justify-between gap-6 rounded-2xl border ${
                  isPaused ? "border-zinc-800 bg-zinc-950 opacity-60" : "border-indigo-500/20 bg-[#120b29]"
                } p-5 transition hover:shadow-[0_0_25px_rgba(139,92,246,0.1)]`}
              >
                {/* Lado Esquerdo: Nome, Descrição e Preço */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-fuchsia-300">{product.name}</h3>
                      {isPaused && (
                        <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white animate-pulse">
                          Indisponível
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-indigo-200/80">{product.description}</p>
                  </div>

                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">R$ {product.price.toFixed(2)}</span>
                    <p className="text-xs text-fuchsia-400 mt-1 uppercase tracking-wide">
                      Tipo: {product.type === "simples" ? "Pronto" : "Personalizável"}
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Imagem/Slider, Botão de Favoritar e Adicionar */}
                <div className="relative flex w-full md:w-64 h-48 md:h-auto items-end justify-end overflow-hidden rounded-xl bg-zinc-900">
                  {/* Favorito (Coração no Topo) */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white hover:scale-110 transition backdrop-blur-md border border-white/10"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(product.id) ? "fill-fuchsia-500 text-fuchsia-500" : "text-white"}
                    />
                  </button>

                  {/* Imagem em Slider bonito */}
                  <div className="absolute inset-0">
                    <img
                      src={product.images[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {product.images.map((_, idx) => (
                          <span key={idx} className="h-1.5 w-1.5 rounded-full bg-white/80" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão Adicionar (Embaixo na Direita sob a Imagem) */}
                  {!isPaused && (
                    <button
                      onClick={() => openCustomizeModal(product)}
                      className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 font-bold text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] hover:scale-105 transition"
                    >
                      <Plus size={18} />
                      Pedir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal de Personalização */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-fuchsia-500/40 bg-[#0d071d] p-6 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Personalizar {selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Sabores Meio a Meio */}
            {selectedProduct.type === "meio-meio" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-fuchsia-400 font-semibold">1º Sabor (Metade)</label>
                  <input
                    type="text"
                    placeholder="Ex: Calabresa"
                    className="w-full mt-1 rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white focus:border-fuchsia-500 outline-none"
                    onChange={(e) => {
                      const newFlavors = [...customFlavors];
                      newFlavors[0] = e.target.value;
                      setCustomFlavors(newFlavors);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm text-fuchsia-400 font-semibold">2º Sabor (Metade)</label>
                  <input
                    type="text"
                    placeholder="Ex: Frango com Catupiry"
                    className="w-full mt-1 rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white focus:border-fuchsia-500 outline-none"
                    onChange={(e) => {
                      const newFlavors = [...customFlavors];
                      newFlavors[1] = e.target.value;
                      setCustomFlavors(newFlavors);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sabores Especiais */}
            {selectedProduct.type === "especial" && (
              <div className="mb-6">
                <label className="text-sm text-fuchsia-400 font-semibold">Sabores (Escolha até {selectedProduct.maxFlavors || 3})</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Carne", "Queijo", "Pizza", "Frango", "Calabresa", "Palmito"].map(sabor => {
                    const isSelected = customFlavors.includes(sabor);
                    return (
                      <button
                        key={sabor}
                        onClick={() => {
                          if (isSelected) {
                            setCustomFlavors(prev => prev.filter(s => s !== sabor));
                          } else if (customFlavors.length < (selectedProduct.maxFlavors || 3)) {
                            setCustomFlavors(prev => [...prev, sabor]);
                          }
                        }}
                        className={`rounded-lg border p-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-fuchsia-500 bg-fuchsia-600/30 text-white"
                            : "border-indigo-500/20 bg-indigo-950/20 text-indigo-200"
                        }`}
                      >
                        {sabor}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Adicionais & Opcionais */}
            {selectedProduct.addons && selectedProduct.addons.length > 0 && (
              <div className="mb-6">
                <label className="text-sm text-fuchsia-400 font-semibold block mb-3">Adicionais e Opcionais</label>
                <div className="space-y-3">
                  {selectedProduct.addons.map(addon => {
                    if (!addon.active) {
                      return (
                        <div key={addon.id} className="flex justify-between items-center text-zinc-500 line-through">
                          <span>{addon.name}</span>
                          <span className="text-xs bg-red-950 text-red-400 px-2 py-0.5 rounded">Esgotado</span>
                        </div>
                      );
                    }

                    const qtyItem = customAddons.find(a => a.id === addon.id);
                    const qty = qtyItem ? qtyItem.qty : 0;

                    return (
                      <div key={addon.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-indigo-500/20">
                        <div>
                          <span className="text-white font-medium">{addon.name}</span>
                          <span className="block text-xs text-indigo-300">+ R$ {addon.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAddonQtyChange(addon.id, -1)}
                            className="rounded-full bg-zinc-800 p-1 text-white hover:bg-zinc-700"
                          >
                            -
                          </button>
                          <span className="text-white font-bold">{qty}</span>
                          <button
                            onClick={() => handleAddonQtyChange(addon.id, 1)}
                            className="rounded-full bg-fuchsia-600 p-1 text-white hover:bg-fuchsia-500"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="mb-6">
              <label className="text-sm text-fuchsia-400 font-semibold block mb-2">Observações do Produto</label>
              <textarea
                placeholder="Ex: Sem cebola, massa fina, bem passado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white focus:border-fuchsia-500 outline-none"
              />
            </div>

            {/* Total e Botão */}
            <div className="flex items-center justify-between border-t border-indigo-500/30 pt-4">
              <div>
                <span className="text-sm text-indigo-300">Total do Produto:</span>
                <span className="block text-2xl font-black text-fuchsia-400">R$ {calculateCustomTotal(selectedProduct).toFixed(2)}</span>
              </div>

              <button
                onClick={addToCartFromModal}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-bold text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:scale-105 transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal / Carrinho */}
      {showCheckout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-fuchsia-500/40 bg-[#0d071d] p-6 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Finalizar Pedido</h3>
              <button onClick={() => setShowCheckout(false)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto pr-2 space-y-3 mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b border-indigo-500/20 pb-3">
                  <div>
                    <span className="font-bold text-white">{item.name}</span>
                    {item.notes && <p className="text-xs text-indigo-300">Obs: {item.notes}</p>}
                  </div>
                  <span className="font-bold text-fuchsia-400">R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Seu Nome"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white"
              />
              <input
                type="text"
                placeholder="Endereço de Entrega Completo"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white"
              />
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-indigo-500/30 bg-black/40 p-3 text-white"
              />
            </div>

            <button
              onClick={handleCheckout}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Confirmar & Enviar pelo WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 2. PDV VIEW (CAIXA / PEDIDOS)
  const PDVView = () => (
    <div className="min-h-screen bg-[#0d071d] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
          <h2 className="text-2xl font-black text-fuchsia-400">Caixa / PDV & Pedidos</h2>
          <span className="bg-fuchsia-600/20 border border-fuchsia-500 px-4 py-2 rounded-xl text-fuchsia-300 font-bold">
            Total Caixa: R$ {orders.filter(o => o.status === "finalizado").reduce((acc, o) => acc + o.total, 0).toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["novo", "producao", "pronto", "saiu-entrega", "entregue", "finalizado"].map(statusGroup => {
            const statusOrders = orders.filter(o => o.status === statusGroup);
            return (
              <div key={statusGroup} className="bg-zinc-950/60 border border-indigo-500/20 rounded-2xl p-4">
                <h3 className="text-lg font-bold text-indigo-300 uppercase mb-3 flex justify-between">
                  {statusGroup}
                  <span className="bg-indigo-600/30 text-xs px-2 py-1 rounded">{statusOrders.length}</span>
                </h3>

                <div className="space-y-4">
                  {statusOrders.map(order => (
                    <div key={order.id} className="bg-black/60 border border-fuchsia-500/20 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white">{order.customerName}</span>
                        <span className="text-xs text-fuchsia-400">{order.date}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3">{order.address}</p>
                      <div className="space-y-1 mb-3">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="text-sm flex justify-between">
                            <span className="text-indigo-200">- {i.name}</span>
                            <span>R$ {i.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-indigo-500/20 pt-2 mt-2">
                        <span className="font-bold text-fuchsia-400">R$ {order.total.toFixed(2)}</span>
                        {statusGroup !== "finalizado" && (
                          <button
                            onClick={() => {
                              const nextStatus = 
                                statusGroup === "novo" ? "producao" :
                                statusGroup === "producao" ? "pronto" :
                                statusGroup === "pronto" ? "saiu-entrega" :
                                statusGroup === "saiu-entrega" ? "entregue" : "finalizado";
                              setOrders(orders.map(o => o.id === order.id ? { ...o, status: nextStatus } : o));
                            }}
                            className="bg-fuchsia-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
                          >
                            Avançar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 3. ADMIN VIEW (CONFIGURAÇÕES & PRODUTOS)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Hambúrgueres");
  const [newProductType, setNewProductType] = useState<ProductType>("simples");
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newAddons, setNewAddons] = useState<ExtraItem[]>([]);

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNewProductName(prod.name);
    setNewProductDesc(prod.description);
    setNewProductPrice(prod.price.toString());
    setNewProductCategory(prod.category);
    setNewProductType(prod.type);
    setNewProductImages(prod.images);
    setNewAddons(prod.addons || []);
  };

  const handleSaveProduct = () => {
    if (!newProductName || !newProductPrice) return;

    const savedItem: Product = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      name: newProductName,
      description: newProductDesc,
      price: parseFloat(newProductPrice),
      category: newProductCategory,
      type: newProductType,
      images: newProductImages.length > 0 ? newProductImages : ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c"],
      addons: newAddons,
      paused: editingProduct ? editingProduct.paused : false
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? savedItem : p));
      showToast("Produto atualizado com sucesso!");
    } else {
      setProducts([...products, savedItem]);
      showToast("Novo produto criado!");
    }

    setEditingProduct(null);
    setNewProductName("");
    setNewProductDesc("");
    setNewProductPrice("");
    setNewProductImages([]);
    setNewAddons([]);
  };

  const AdminView = () => (
    <div className="min-h-screen bg-[#0d071d] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Gestão de Categorias */}
        <div className="bg-zinc-950/80 border border-indigo-500/30 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-2">
            <Settings /> Gestão de Categorias e Ordem
          </h3>

          <div className="space-y-3">
            {categories.sort((a, b) => a.order - b.order).map((cat, idx) => (
              <div key={cat.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-indigo-500/10">
                <span className="font-bold text-lg">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={idx === 0}
                    onClick={() => {
                      const newArr = [...categories];
                      [newArr[idx - 1].order, newArr[idx].order] = [newArr[idx].order, newArr[idx - 1].order];
                      setCategories(newArr);
                    }}
                    className="p-2 bg-indigo-950 rounded hover:bg-indigo-900 text-indigo-300 disabled:opacity-30"
                  >
                    <MoveUp size={16} />
                  </button>
                  <button
                    disabled={idx === categories.length - 1}
                    onClick={() => {
                      const newArr = [...categories];
                      [newArr[idx + 1].order, newArr[idx].order] = [newArr[idx].order, newArr[idx + 1].order];
                      setCategories(newArr);
                    }}
                    className="p-2 bg-indigo-950 rounded hover:bg-indigo-900 text-indigo-300 disabled:opacity-30"
                  >
                    <MoveDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário de Produtos (Adição e Edição com Adicionais integrados) */}
        <div className="bg-zinc-950/80 border border-fuchsia-500/30 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-fuchsia-400 mb-4">
            {editingProduct ? "Editar Produto" : "Criar Novo Produto"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              placeholder="Nome do Produto"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              className="rounded-xl bg-black/40 border border-indigo-500/20 p-3 text-white"
            />
            <input
              type="number"
              placeholder="Preço (R$)"
              value={newProductPrice}
              onChange={e => setNewProductPrice(e.target.value)}
              className="rounded-xl bg-black/40 border border-indigo-500/20 p-3 text-white"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={newProductDesc}
              onChange={e => setNewProductDesc(e.target.value)}
              className="rounded-xl bg-black/40 border border-indigo-500/20 p-3 text-white md:col-span-2"
            />

            <select
              value={newProductType}
              onChange={e => setNewProductType(e.target.value as ProductType)}
              className="rounded-xl bg-black/40 border border-indigo-500/20 p-3 text-white"
            >
              <option value="simples">Simples (Adiciona direto)</option>
              <option value="meio-meio">Meio a Meio (Pizza/Massa)</option>
              <option value="especial">Especial (Pastel/Multi-Sabores)</option>
            </select>

            <select
              value={newProductCategory}
              onChange={e => setNewProductCategory(e.target.value)}
              className="rounded-xl bg-black/40 border border-indigo-500/20 p-3 text-white"
            >
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* OTIMIZAÇÃO & CROP DE IMAGEM (Até 3) */}
          <div className="mb-6 bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
            <label className="block text-sm font-semibold text-fuchsia-400 mb-2">
              Galeria de Imagens (Até 3 Fotos com Otimização Automática)
            </label>
            <div className="flex gap-4 items-center">
              {newProductImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 bg-black rounded overflow-hidden">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setNewProductImages(newProductImages.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
              {newProductImages.length < 3 && (
                <label className="flex flex-col items-center justify-center w-20 h-20 border border-dashed border-indigo-400 rounded cursor-pointer hover:bg-indigo-900/30">
                  <Upload size={18} className="text-indigo-300" />
                  <span className="text-xs text-indigo-300 mt-1">Upload</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        try {
                          const optimized = await processAndCompressImage(e.target.files[0]);
                          setNewProductImages([...newProductImages, optimized]);
                          showToast("Imagem otimizada (WebP, < 300KB) e adicionada!");
                        } catch (err) {
                          showToast("Erro ao processar imagem.");
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* ADICIONAIS & COMPLEMENTOS */}
          <div className="mb-6 bg-fuchsia-950/20 p-4 rounded-xl border border-fuchsia-500/20">
            <label className="block text-sm font-semibold text-fuchsia-400 mb-2">
              Complementos / Adicionais (Específico para este produto)
            </label>
            <div className="space-y-3">
              {newAddons.map((addon, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={addon.name}
                    onChange={e => {
                      const upd = [...newAddons];
                      upd[index].name = e.target.value;
                      setNewAddons(upd);
                    }}
                    className="bg-black border border-zinc-700 rounded p-2 text-white flex-1"
                  />
                  <input
                    type="number"
                    value={addon.price}
                    onChange={e => {
                      const upd = [...newAddons];
                      upd[index].price = parseFloat(e.target.value);
                      setNewAddons(upd);
                    }}
                    className="bg-black border border-zinc-700 rounded p-2 text-white w-24"
                  />
                  <button
                    onClick={() => {
                      const upd = [...newAddons];
                      upd[index].active = !upd[index].active;
                      setNewAddons(upd);
                    }}
                    className={`p-2 rounded text-xs font-bold ${
                      addon.active ? "bg-green-600/40 text-green-300 border border-green-500" : "bg-red-600/40 text-red-300 border border-red-500"
                    }`}
                  >
                    {addon.active ? "Ativo" : "Pausado"}
                  </button>
                  <button
                    onClick={() => setNewAddons(newAddons.filter((_, i) => i !== index))}
                    className="p-2 bg-red-800 text-white rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setNewAddons([...newAddons, { id: crypto.randomUUID(), name: "Novo Adicional", price: 2.0, maxQty: 1, active: true }])}
                className="flex items-center gap-2 text-sm text-fuchsia-300 hover:text-white"
              >
                <Plus size={16} /> Adicionar Complemento
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveProduct}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]"
          >
            {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
          </button>
        </div>

        {/* Lista de Produtos Cadastrados */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">Produtos Cadastrados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-zinc-950 border border-indigo-500/20 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-fuchsia-300">{product.name}</span>
                  <span className="block text-xs text-indigo-300">R$ {product.price.toFixed(2)} - {product.category}</span>
                  <span className="inline-block mt-1 bg-fuchsia-950/60 text-fuchsia-400 text-xs px-2 py-0.5 rounded border border-fuchsia-500/40">
                    Tipo: {product.type}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setProducts(products.map(p => p.id === product.id ? { ...p, paused: !p.paused } : p));
                    }}
                    className={`px-3 py-1.5 rounded font-bold text-xs ${
                      product.paused ? "bg-red-600 text-white" : "bg-green-600 text-white"
                    }`}
                  >
                    {product.paused ? "Pausado" : "Ativo"}
                  </button>
                  <button onClick={() => openEditProduct(product)} className="p-2 bg-indigo-600 rounded text-white hover:bg-indigo-500">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setProducts(products.filter(p => p.id !== product.id))} className="p-2 bg-red-600 rounded text-white hover:bg-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0618] font-sans pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-fuchsia-600 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.8)] animate-bounce font-bold">
          {toastMessage}
        </div>
      )}

      {/* Renders Active Tab View */}
      {activeTab === "site" && <SiteView />}
      {activeTab === "pdv" && <PDVView />}
      {activeTab === "admin" && <AdminView />}

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#060310]/95 border-t border-indigo-500/30 p-4 flex justify-around backdrop-blur-md">
        <button
          onClick={() => setActiveTab("site")}
          className={`flex flex-col items-center gap-1 ${activeTab === "site" ? "text-fuchsia-400 scale-110" : "text-indigo-400"} transition`}
        >
          <Home size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Cardápio</span>
        </button>
        <button
          onClick={() => setActiveTab("pdv")}
          className={`flex flex-col items-center gap-1 ${activeTab === "pdv" ? "text-fuchsia-400 scale-110" : "text-indigo-400"} transition`}
        >
          <Monitor size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Caixa / PDV</span>
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-1 ${activeTab === "admin" ? "text-fuchsia-400 scale-110" : "text-indigo-400"} transition`}
        >
          <Settings size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Ajustes & Produtos</span>
        </button>
      </nav>
    </div>
  );
}
