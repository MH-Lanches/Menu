import React, { useState, useEffect } from "react";
import { 
  Plus, Minus, ShoppingCart, Heart, Trash2, Edit2, Save, X, ArrowUp, 
  ArrowDown, Palette, Truck, Clock 
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  favorites?: boolean;
};

type Category = {
  id: string;
  name: string;
  order: number;
};

type Order = {
  id: string;
  date: string;
  customer: string;
  address: string;
  items: string;
  total: number;
};

type Settings = {
  brandName: string;
  slogan: string;
  whatsapp: string;
  deliveryFee: number;
  minOrder: number;
  openingTime: string;
  closingTime: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  pin: string;
};

const DEFAULT_SETTINGS: Settings = {
  brandName: "Sabor Express",
  slogan: "O melhor delivery da cidade",
  whatsapp: "5511999999999",
  deliveryFee: 8,
  minOrder: 30,
  openingTime: "17:00",
  closingTime: "23:30",
  address: "Rua das Flores, 456",
  primaryColor: "#22c55e",
  accentColor: "#eab308",
  pin: "1234"
};

const INITIAL_CATEGORIES: Category[] = [
  { id: "c1", name: "Pizzas", order: 0 },
  { id: "c2", name: "Lanches", order: 1 },
  { id: "c3", name: "Bebidas", order: 2 },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Pizza Margherita",
    description: "Molho especial, muçarela e manjericão",
    category: "Pizzas",
    price: 42.9,
    image: "https://picsum.photos/id/1015/400/300",
    available: true,
  },
  {
    id: "2",
    name: "X-Bacon",
    description: "Hambúrguer artesanal, bacon crocante e queijo",
    category: "Lanches",
    price: 27.9,
    image: "https://picsum.photos/id/292/400/300",
    available: true,
  },
  {
    id: "3",
    name: "Coca-Cola 2L",
    description: "Refrigerante gelado",
    category: "Bebidas",
    price: 13,
    image: "https://picsum.photos/id/201/400/300",
    available: true,
  }
];

export default function App() {
  const [view, setView] = useState<"store" | "admin">("store");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);

  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCart, setShowCart] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [observation, setObservation] = useState("");

  const [isOpen, setIsOpen] = useState(true);
  const [adminTab, setAdminTab] = useState<"config" | "products" | "categories" | "orders" | "appearance">("config");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<any>({
    name: "", description: "", category: "Pizzas", price: 0, image: "", available: true
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load data
  useEffect(() => {
    const savedSettings = localStorage.getItem("sx_settings");
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedProducts = localStorage.getItem("sx_products");
    if (savedProducts) setProducts(JSON.parse(savedProducts));

    const savedCategories = localStorage.getItem("sx_categories");
    if (savedCategories) setCategories(JSON.parse(savedCategories));

    const savedOrders = localStorage.getItem("sx_orders");
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem("sx_settings", JSON.stringify(settings));
    localStorage.setItem("sx_products", JSON.stringify(products));
    localStorage.setItem("sx_categories", JSON.stringify(categories));
    localStorage.setItem("sx_orders", JSON.stringify(orders));
  }, [settings, products, categories, orders]);

  // Check open status
  useEffect(() => {
    const hour = new Date().getHours();
    const [openHour] = settings.openingTime.split(":").map(Number);
    const [closeHour] = settings.closingTime.split(":").map(Number);
    setIsOpen(hour >= openHour && hour < closeHour);
  }, [settings]);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat && p.available;
  });

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalTotal = cartTotal + settings.deliveryFee;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += 1;
        return updated;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as any[];
    });
  };

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerAddress) {
      alert("Preencha nome e endereço");
      return;
    }
    if (cartTotal < settings.minOrder) {
      alert(`Valor mínimo: R$ ${settings.minOrder}`);
      return;
    }

    let msg = `*🍔 PEDIDO - ${settings.brandName}*\\n\\n`;
    msg += `*Cliente:* ${customerName}\\n`;
    msg += `*Endereço:* ${customerAddress}\\n`;
    msg += `*Pagamento:* ${paymentMethod}\\n\\n`;
    msg += `*ITENS*\\n`;

    cart.forEach(item => {
      msg += `• ${item.quantity}x ${item.name} = R$${(item.price * item.quantity).toFixed(2)}\\n`;
    });

    msg += `\\n*Subtotal:* R$${cartTotal.toFixed(2)}\\n`;
    msg += `*Entrega:* R$${settings.deliveryFee.toFixed(2)}\\n`;
    msg += `*Total:* R$${finalTotal.toFixed(2)}\\n\\n`;
    if (observation) msg += `*Obs:* ${observation}\\n`;

    const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    const newOrder: Order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: customerName,
      address: customerAddress,
      items: cart.map(i => `${i.quantity}x ${i.name}`).join(" | "),
      total: finalTotal
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setShowCart(false);
    setCustomerName("");
    setCustomerAddress("");
    setObservation("");
    alert("Pedido enviado com sucesso pelo WhatsApp!");
  };

  const toggleFavorite = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? {...p, favorites: !p.favorites} : p));
  };

  const saveProduct = () => {
    if (!newProduct.name || !newProduct.price) return alert("Nome e preço são obrigatórios");

    const prod: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: newProduct.name,
      description: newProduct.description || "",
      category: newProduct.category,
      price: Number(newProduct.price),
      image: newProduct.image || `https://picsum.photos/id/${Math.floor(Math.random()*100)}/400/300`,
      available: true
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? prod : p));
    } else {
      setProducts(prev => [...prev, prod]);
    }

    setNewProduct({ name: "", description: "", category: "Pizzas", price: 0, image: "" });
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (!confirm("Excluir produto permanentemente?")) return;
    setProducts(p => p.filter(x => x.id !== id));
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      order: categories.length
    };
    setCategories([...categories, cat]);
    setNewCategoryName("");
  };

  const moveCategoryUpDown = (id: string, dir: "up" | "down") => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx < 0) return;
    const newCats = [...categories];
    if (dir === "up" && idx > 0) {
      [newCats[idx], newCats[idx-1]] = [newCats[idx-1], newCats[idx]];
    } else if (dir === "down" && idx < categories.length - 1) {
      [newCats[idx], newCats[idx+1]] = [newCats[idx+1], newCats[idx]];
    }
    setCategories(newCats.map((c, i) => ({...c, order: i})));
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(s => ({...s, [key]: value}));
  };

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans">
      <header className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <div className="text-4xl">🍔</div>
            <div>
              <div className="text-3xl font-bold tracking-tighter" style={{ color: settings.primaryColor }}>
                {settings.brandName}
              </div>
              <p className="text-[10px] text-zinc-500 -mt-1">{settings.slogan}</p>
            </div>
          </div>

          <div className="flex items-center gap-x-4">
            <div className={`px-4 py-1.5 rounded-3xl text-xs flex items-center gap-2 font-medium ${isOpen ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              <div className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-400" : "bg-red-500"} animate-pulse`} />
              {isOpen ? "ABERTO AGORA" : "FECHADO"}
            </div>

            <button
              onClick={() => view === "store" ? setShowPinModal(true) : setView("store")}
              className="flex items-center gap-x-2 bg-zinc-800 hover:bg-zinc-700 transition-colors px-5 py-2.5 rounded-3xl text-sm"
            >
              <Palette className="w-4 h-4" />
              {view === "store" ? "PAINEL ADMIN" : "VOLTAR AO CARDÁPIO"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {view === "store" ? (
          <>
            {/* HERO */}
            <div className="relative h-80 bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#22c55e_0.8px,transparent_1px)] [background-size:20px_20px] opacity-10" />
              <div className="text-center z-10 px-6">
                <div className="inline text-6xl mb-6 block">🚀</div>
                <h1 className="text-5xl font-bold tracking-tighter mb-3">Peça agora</h1>
                <p className="text-zinc-400">Entrega rápida • Qualidade garantida</p>
              </div>
            </div>

            {/* SEARCH AND CATEGORIES */}
            <div className="sticky top-[73px] bg-zinc-950 z-40 border-b border-zinc-800">
              <div className="px-5 pt-6 pb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="O que você está com fome?"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-3xl py-4 px-6 text-lg placeholder:text-zinc-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 px-5 pb-6 overflow-x-auto scrollbar-hide">
                <div onClick={() => setSelectedCategory("all")} className={`px-7 py-2 rounded-3xl text-sm whitespace-nowrap transition-all cursor-pointer ${selectedCategory === "all" ? "bg-white text-black" : "bg-zinc-900"}`}>Todos</div>
                {sortedCategories.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-7 py-2 rounded-3xl text-sm whitespace-nowrap transition-all cursor-pointer ${selectedCategory === c.name ? "bg-white text-black" : "bg-zinc-900"}`}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* MENU GRID */}
            <div className="p-5 grid grid-cols-2 gap-4 pb-28">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-zinc-900 rounded-3xl overflow-hidden">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-full h-44 object-cover" />
                    <button 
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-4 right-4 bg-black/70 p-2 rounded-2xl"
                    >
                      <Heart className={`w-5 h-5 transition-all ${product.favorites ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-[17px] leading-tight mb-1">{product.name}</div>
                    <div className="text-xs text-zinc-400 mb-4 line-clamp-2 h-9">{product.description}</div>
                    
                    <div className="flex justify-between items-center">
                      <div style={{color: settings.primaryColor}} className="font-mono text-2xl font-bold">
                        R${product.price}
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-white text-black px-7 py-2.5 rounded-2xl text-xs font-bold active:bg-emerald-400 transition-all"
                      >
                        ADICIONAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ADMIN PANEL */
          <div className="p-6">
            <div className="flex border-b border-zinc-700 mb-8 overflow-x-auto">
              {(["config","products","categories","orders","appearance"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAdminTab(t)}
                  className={`px-8 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${adminTab === t ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400"}`}
                >
                  {t === "config" && "Loja"}
                  {t === "products" && "Cardápio"}
                  {t === "categories" && "Categorias"}
                  {t === "orders" && "Vendas"}
                  {t === "appearance" && "Visual"}
                </button>
              ))}
            </div>

            {adminTab === "config" && (
              <div className="space-y-8 max-w-md">
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Nome da Marca</label>
                  <input value={settings.brandName} onChange={e => updateSetting("brandName", e.target.value)} className="bg-zinc-900 border border-zinc-700 w-full rounded-2xl px-5 py-4" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">WhatsApp para pedidos</label>
                  <input value={settings.whatsapp} onChange={e => updateSetting("whatsapp", e.target.value)} className="bg-zinc-900 border border-zinc-700 w-full rounded-2xl px-5 py-4" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Abre às</label>
                    <input type="time" value={settings.openingTime} onChange={e => updateSetting("openingTime", e.target.value)} className="bg-zinc-900 border border-zinc-700 w-full rounded-2xl px-5 py-4" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Fecha às</label>
                    <input type="time" value={settings.closingTime} onChange={e => updateSetting("closingTime", e.target.value)} className="bg-zinc-900 border border-zinc-700 w-full rounded-2xl px-5 py-4" />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Taxa de entrega (R$)</label>
                  <input type="number" value={settings.deliveryFee} onChange={e => updateSetting("deliveryFee", parseFloat(e.target.value))} className="bg-zinc-900 border border-zinc-700 w-full rounded-2xl px-5 py-4" />
                </div>
              </div>
            )}

            {adminTab === "products" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="font-semibold text-xl">Produtos • {products.length}</div>
                  <button onClick={() => {setEditingProduct(null); setNewProduct({name:"", description:"", category:"Pizzas", price: 25, image:""})}} className="bg-emerald-600 px-6 py-3 rounded-2xl flex items-center gap-2 text-sm">
                    <Plus size={18} /> Novo Item
                  </button>
                </div>

                <div className="space-y-4">
                  {products.map(p => (
                    <div key={p.id} className="flex gap-4 bg-zinc-900 p-4 rounded-3xl border border-zinc-800">
                      <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium leading-tight">{p.name}</div>
                        <div className="text-emerald-400 font-mono text-sm">R$ {p.price}</div>
                        <div className="text-xs text-zinc-500 mt-2 line-clamp-2">{p.description}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditingProduct(p)} className="p-3 bg-zinc-800 rounded-2xl"><Edit2 size={18} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-3 bg-zinc-800 rounded-2xl text-red-400"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FORM */}
                <div className="mt-16 border border-dashed border-zinc-700 rounded-3xl p-8">
                  <h4 className="font-medium mb-5">{editingProduct ? "Editar" : "Adicionar"} Produto</h4>
                  <input type="text" placeholder="Nome" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="block w-full mb-4 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4" />
                  <input type="number" placeholder="Preço" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="block w-full mb-4 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4" />
                  
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="block w-full mb-4 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>

                  <input type="text" placeholder="URL da foto" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="block w-full mb-6 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4" />
                  
                  <div className="flex gap-4">
                    <button onClick={() => {setEditingProduct(null); setNewProduct({})}} className="flex-1 py-4 text-zinc-400">Cancelar</button>
                    <button onClick={saveProduct} className="flex-1 py-4 bg-white text-black font-bold rounded-2xl">SALVAR ITEM</button>
                  </div>
                </div>
              </div>
            )}

            {adminTab === "categories" && (
              <div>
                <div className="flex gap-3 mb-8">
                  <input 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nome da nova categoria" 
                    className="flex-1 bg-zinc-900 border border-zinc-700 px-5 rounded-3xl" 
                  />
                  <button onClick={addNewCategory} className="bg-white text-black px-10 rounded-3xl font-medium">Criar</button>
                </div>

                {sortedCategories.map((cat, i) => (
                  <div key={cat.id} className="bg-zinc-900 mb-3 px-6 py-5 rounded-3xl flex items-center justify-between border border-zinc-800">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex gap-1">
                      <button disabled={i===0} onClick={() => moveCategoryUpDown(cat.id, "up")} className="p-3 disabled:opacity-40"><ArrowUp size={18} /></button>
                      <button disabled={i===categories.length-1} onClick={() => moveCategoryUpDown(cat.id, "down")} className="p-3 disabled:opacity-40"><ArrowDown size={18} /></button>
                      <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="p-3 text-red-400"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === "orders" && (
              <div>
                <h2 className="text-2xl font-bold mb-8">Histórico de Vendas</h2>
                {orders.length > 0 ? orders.map(o => (
                  <div key={o.id} className="bg-zinc-900 p-6 rounded-3xl mb-4 border border-zinc-800">
                    <div className="text-xs text-zinc-500">{new Date(o.date).toLocaleString()}</div>
                    <div className="font-semibold mt-1">{o.customer}</div>
                    <div className="text-sm text-zinc-400 mt-1">{o.address}</div>
                    <div className="mt-4 text-emerald-400 font-mono">R$ {o.total}</div>
                  </div>
                )) : <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-3xl">Nenhum pedido ainda</div>}
              </div>
            )}

            {adminTab === "appearance" && (
              <div className="max-w-xs">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-3"><Palette className="inline" /> Personalização</h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="text-xs text-zinc-400 mb-3">COR PRINCIPAL</div>
                    <input 
                      type="color" 
                      value={settings.primaryColor} 
                      onChange={(e) => updateSetting("primaryColor", e.target.value)}
                      className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-800"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 mb-3">COR DE DESTAQUE</div>
                    <input 
                      type="color" 
                      value={settings.accentColor} 
                      onChange={(e) => updateSetting("accentColor", e.target.value)}
                      className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-800"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="mt-12 text-xs text-red-400 flex items-center gap-2"
                >
                  <Trash2 size={15} /> LIMPAR TODOS OS DADOS
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CART BUTTON */}
      {view === "store" && cart.length > 0 && (
        <div onClick={() => setShowCart(true)} className="fixed bottom-6 right-6 bg-white text-black shadow-2xl shadow-emerald-600/40 flex items-center gap-x-3 pl-6 pr-8 py-4 rounded-3xl font-bold z-50 cursor-pointer active:scale-95">
          <ShoppingCart />
          <span>{cart.length}</span>
          <div className="h-5 w-px bg-black/30" />
          <span>R$ {cartTotal.toFixed(2)}</span>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 z-[999] flex items-end">
          <div className="bg-zinc-900 w-full rounded-t-3xl max-h-[88%] overflow-hidden">
            <div className="px-6 py-6 flex justify-between border-b border-zinc-700">
              <div className="text-2xl font-bold">Carrinho</div>
              <button onClick={() => setShowCart(false)}><X /></button>
            </div>

            <div className="p-6 overflow-auto" style={{maxHeight: "420px"}}>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between py-5 border-b border-zinc-800">
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-zinc-500">R${item.price}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex border border-zinc-700 rounded-3xl">
                      <button className="px-4 py-2" onClick={() => changeQuantity(item.id, -1)}>-</button>
                      <div className="px-4 py-2 font-mono border-x border-zinc-700">{item.quantity}</div>
                      <button className="px-4 py-2" onClick={() => changeQuantity(item.id, 1)}>+</button>
                    </div>
                    <div className="font-medium tabular-nums">R${(item.price*item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-zinc-700 space-y-6">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Taxa entrega</span>
                <span className="text-emerald-400">R$ {settings.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-3xl font-bold border-t border-zinc-700 pt-6">
                <span>Total</span>
                <span style={{color: settings.primaryColor}}>R${finalTotal.toFixed(2)}</span>
              </div>

              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome completo" className="bg-zinc-800 w-full py-5 px-6 rounded-3xl border border-zinc-700" />
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Endereço completo com número" className="bg-zinc-800 w-full py-5 px-6 rounded-3xl border border-zinc-700" />

              <button 
                onClick={sendWhatsAppOrder}
                className="w-full py-7 bg-gradient-to-r from-emerald-500 to-teal-400 text-xl font-bold text-black rounded-3xl mt-4 active:scale-95 transition-all"
              >
                FINALIZAR E ENVIAR NO WHATSAPP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-3xl p-10 w-full max-w-[320px]">
            <div className="text-center">
              <div className="text-6xl mb-6">🔐</div>
              <h3 className="text-3xl font-bold mb-2">Acesso Restrito</h3>
              <p className="text-zinc-400 mb-8">Digite o PIN do administrador</p>
            </div>
            
            <input 
              type="password" 
              maxLength={6}
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)}
              className="block w-full text-center text-6xl font-mono tracking-widest bg-transparent border border-zinc-700 focus:border-white rounded-3xl py-8 mb-8 outline-none"
              autoFocus
            />

            <button 
              onClick={() => {
                if (pinInput === settings.pin) {
                  setView("admin");
                  setShowPinModal(false);
                  setPinInput("");
                } else {
                  alert("PIN incorreto!");
                  setPinInput("");
                }
              }}
              className="bg-white text-black w-full py-5 rounded-3xl text-xl font-semibold"
            >
              ACESSAR PAINEL
            </button>
            <button onClick={() => {setShowPinModal(false); setPinInput("");}} className="text-xs text-zinc-400 mt-8 block mx-auto">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
