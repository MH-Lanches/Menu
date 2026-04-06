import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Settings, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  MessageCircle,
  X
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  favorites?: boolean;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

interface Addon {
  name: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  observation: string;
  selectedAddons: { groupName: string; addons: Addon[] }[];
}

interface Settings {
  brandName: string;
  slogan: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrderValue: number;
  adminPin: string;
  footerText: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
  };
  openingHours: OpeningHours;
  address: string;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const defaultSettings: Settings = {
  brandName: "Sabor Prime",
  slogan: "O melhor delivery da cidade",
  whatsappNumber: "5511988887777",
  deliveryFee: 8,
  minOrderValue: 30,
  adminPin: "1234",
  footerText: "© Sabor Prime Delivery - Todos direitos reservados",
  colors: {
    primary: "#22c55e",
    accent: "#eab308",
    background: "#0a0a0a",
    card: "#171717",
    text: "#f5f5f5",
  },
  openingHours: {
    '0': { open: "18:00", close: "23:30", closed: false },
    '1': { open: "18:00", close: "23:30", closed: false },
    '2': { open: "18:00", close: "23:30", closed: false },
    '3': { open: "18:00", close: "23:30", closed: false },
    '4': { open: "18:00", close: "23:30", closed: false },
    '5': { open: "18:00", close: "00:00", closed: false },
    '6': { open: "17:00", close: "23:30", closed: false },
  },
  address: "Rua das Palmeiras, 123 - Centro",
};

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Hambúrguer Clássico",
    description: "Carne 180g, queijo cheddar, alface, tomate e molho especial",
    category: "Lanches",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    available: true,
  },
  {
    id: "2",
    name: "Pizza Margherita",
    description: "Molho de tomate, muçarela, manjericão fresco e azeite",
    category: "Pizzas",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1604382355076-e894e2a1e5d2?w=600",
    available: true,
  },
  {
    id: "3",
    name: "Coca-Cola 350ml",
    description: "Refrigerante gelado",
    category: "Bebidas",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600",
    available: true,
  },
];

const initialCategories: Category[] = [
  { id: "cat1", name: "Lanches", order: 0 },
  { id: "cat2", name: "Pizzas", order: 1 },
  { id: "cat3", name: "Bebidas", order: 2 },
];

export default function App() {
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{groupName: string, addons: Addon[]}[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');

  // Load from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('delivery_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedProducts = localStorage.getItem('delivery_products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));

    const savedCategories = localStorage.getItem('delivery_categories');
    if (savedCategories) setCategories(JSON.parse(savedCategories));

    const savedFavorites = localStorage.getItem('delivery_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('delivery_settings', JSON.stringify(settings));
    localStorage.setItem('delivery_products', JSON.stringify(products));
    localStorage.setItem('delivery_categories', JSON.stringify(categories));
    localStorage.setItem('delivery_favorites', JSON.stringify(favorites));
  }, [settings, products, categories, favorites]);

  // Check if store is open
  useEffect(() => {
    const now = new Date();
    const dayKey = now.getDay().toString();
    const hours = settings.openingHours[dayKey];
    
    if (!hours || hours.closed) {
      setIsOpen(false);
      return;
    }

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const isOpenNow = currentTime >= hours.open && currentTime <= hours.close;
    setIsOpen(isOpenNow);
  }, [settings.openingHours]);

  const filteredProducts = products
    .filter(p => p.available)
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
      if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
      return 0;
    });

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const cartTotal = cart.reduce((sum, item) => {
    const addonTotal = item.selectedAddons.reduce((addonSum, group) => 
      addonSum + group.addons.reduce((s, a) => s + a.price, 0), 0);
    return sum + (item.product.price * item.quantity) + (addonTotal * item.quantity);
  }, 0);

  const finalTotal = cartTotal + settings.deliveryFee;

  const addToCart = (product: Product) => {
    const existing = cart.findIndex(item => item.product.id === product.id);
    
    if (existing !== -1) {
      const updatedCart = [...cart];
      updatedCart[existing].quantity += quantity;
      updatedCart[existing].observation = observation;
      updatedCart[existing].selectedAddons = selectedAddons;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        product,
        quantity,
        observation,
        selectedAddons
      }]);
    }
    
    setShowProductModal(false);
    setQuantity(1);
    setObservation('');
    setSelectedAddons([]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQty;
    setCart(newCart);
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const sendToWhatsApp = () => {
    if (!customerName || !customerAddress) {
      alert("Por favor preencha nome e endereço");
      return;
    }

    let message = `*🛍️ NOVO PEDIDO - ${settings.brandName}*\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Endereço:* ${customerAddress}\n`;
    message += `*Pagamento:* ${paymentMethod}\n\n`;
    
    message += `*📋 ITENS:*\n`;
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.product.name} - R$${(item.product.price * item.quantity).toFixed(2)}\n`;
      if (item.observation) message += `  Obs: ${item.observation}\n`;
      
      item.selectedAddons.forEach(group => {
        if (group.addons.length > 0) {
          message += `  + ${group.groupName}: ${group.addons.map(a => a.name).join(', ')}\n`;
        }
      });
    });
    
    message += `\n*Subtotal:* R$${cartTotal.toFixed(2)}\n`;
    message += `*Taxa de entrega:* R$${settings.deliveryFee.toFixed(2)}\n`;
    message += `*TOTAL:* R$${finalTotal.toFixed(2)}\n\n`;
    message += `⏰ Pedido feito às ${new Date().toLocaleTimeString('pt-BR')}`;

    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Save order
    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customerName,
      address: customerAddress,
      total: finalTotal,
      items: cart.length
    };
    
    const savedOrders = JSON.parse(localStorage.getItem('delivery_orders') || '[]');
    localStorage.setItem('delivery_orders', JSON.stringify([...savedOrders, order]));
    
    alert("Pedido enviado com sucesso via WhatsApp!");
    setCart([]);
    setShowCart(false);
    setCustomerName('');
    setCustomerAddress('');
  };

  // Admin Functions
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "Novo Produto",
      description: "Descrição do produto",
      category: categories[0]?.name || "Lanches",
      price: 19.90,
      image: "https://images.unsplash.com/photo-1565299623641-4e8d8c5b5f?w=600",
      available: true,
    };
    setProducts([...products, newProduct]);
  };

  const deleteProduct = (id: string) => {
    if (confirm("Excluir este produto?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const addCategory = () => {
    const newCat: Category = {
      id: Date.now().toString(),
      name: "Nova Categoria",
      order: categories.length
    };
    setCategories([...categories, newCat]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(categories.map(cat => cat.id === id ? {...cat, name} : cat));
  };

  const deleteCategory = (id: string) => {
    if (confirm("Excluir categoria?")) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    newCategories.forEach((cat, i) => cat.order = i);
    
    setCategories(newCategories);
  };

  const toggleProductAvailability = (id: string) => {
    setProducts(products.map(p => 
      p.id === id ? {...p, available: !p.available} : p
    ));
  };

  const enterAdminMode = () => {
    if (pinInput === settings.adminPin) {
      setView('admin');
      setShowAdminPin(false);
      setPinInput('');
    } else {
      alert("PIN incorreto!");
    }
  };

  const colorPicker = (colorKey: keyof Settings['colors'], label: string) => (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium w-28">{label}:</label>
      <input 
        type="color" 
        value={settings.colors[colorKey]}
        onChange={(e) => updateSettings({
          colors: { ...settings.colors, [colorKey]: e.target.value }
        })}
        className="w-12 h-9 rounded border border-zinc-700 cursor-pointer"
      />
      <span className="text-xs font-mono text-zinc-400">{settings.colors[colorKey]}</span>
    </div>
  );

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: settings.colors.background, color: settings.colors.text }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-2xl">🍔</div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight" style={{color: settings.colors.primary}}>
                {settings.brandName}
              </h1>
              <p className="text-xs text-zinc-400 -mt-1">{settings.slogan}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('client')}
              className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${view === 'client' ? 'bg-white text-black' : 'bg-zinc-900'}`}
            >
              Loja
            </button>
            
            <button
              onClick={() => setShowAdminPin(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-2xl flex items-center gap-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
            
            {cart.length > 0 && (
              <button 
                onClick={() => setShowCart(true)}
                className="relative flex items-center justify-center w-10 h-10 bg-white text-black rounded-2xl"
                style={{backgroundColor: settings.colors.primary}}
              >
                <ShoppingCart className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </div>
              </button>
            )}
          </div>
        </div>

        {view === 'client' && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar lanches, pizzas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-3xl py-3 px-5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        )}
      </header>

      {/* CLIENT VIEW */}
      {view === 'client' && (
        <div className="max-w-3xl mx-auto">
          {/* STATUS */}
          <div className={`mx-4 mt-4 rounded-3xl p-4 flex items-center gap-3 ${isOpen ? 'bg-emerald-900/30' : 'bg-red-900/30'}`}>
            <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <div className="text-sm font-medium">
              {isOpen ? '✅ Loja Aberta agora' : '🔴 Loja Fechada'}
            </div>
            {!isOpen && (
              <div className="text-xs text-zinc-400 ml-auto">
                Abre {settings.openingHours[new Date().getDay().toString()]?.open || '18:00'}
              </div>
            )}
          </div>

          {/* CATEGORIES */}
          <div className="px-4 pt-6 pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 whitespace-nowrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-3xl text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-white text-black' : 'bg-zinc-900'}`}
              >
                Todos
              </button>
              
              {sortedCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-6 py-2 rounded-3xl text-sm font-medium transition-all ${selectedCategory === cat.name ? 'bg-white text-black' : 'bg-zinc-900'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="px-4 pt-2 grid grid-cols-1 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                Nenhum produto encontrado
              </div>
            ) : (
              filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                    setQuantity(1);
                  }}
                  className="bg-zinc-900 rounded-3xl overflow-hidden flex cursor-pointer active:scale-[0.985] transition-all border border-zinc-800"
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="text-xl"
                        >
                          {favorites.includes(product.id) ? '❤️' : '♡'}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{product.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="font-mono font-bold text-xl" style={{ color: settings.colors.primary }}>
                        R${product.price.toFixed(2)}
                      </div>
                      <div className="bg-zinc-800 text-xs px-4 py-1 rounded-2xl">Adicionar</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER INFO */}
          <div className="text-center text-xs text-zinc-500 py-10">
            {settings.footerText}
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {view === 'admin' && (
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Painel Administrativo</h2>
            <button 
              onClick={() => setView('client')}
              className="px-6 py-2 bg-zinc-800 rounded-2xl text-sm"
            >
              Voltar para Loja
            </button>
          </div>

          {/* SETTINGS */}
          <div className="bg-zinc-900 rounded-3xl p-6 mb-8">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Configurações da Loja
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5">Nome da Marca</label>
                <input 
                  type="text" 
                  value={settings.brandName}
                  onChange={(e) => updateSettings({ brandName: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5">WhatsApp</label>
                <input 
                  type="text" 
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5">Taxa de Entrega</label>
                  <input 
                    type="number" 
                    value={settings.deliveryFee}
                    onChange={(e) => updateSettings({ deliveryFee: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5">Valor Mínimo</label>
                  <input 
                    type="number" 
                    value={settings.minOrderValue}
                    onChange={(e) => updateSettings({ minOrderValue: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-3">Paleta de Cores</label>
                <div className="grid grid-cols-1 gap-4">
                  {colorPicker('primary', 'Cor Principal')}
                  {colorPicker('accent', 'Cor de Destaque')}
                  {colorPicker('background', 'Fundo')}
                  {colorPicker('card', 'Cards')}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-3">Horário de Funcionamento</label>
                <div className="space-y-4">
                  {DAYS.map((day, index) => {
                    const dayKey = index.toString();
                    const hours = settings.openingHours[dayKey] || { open: "18:00", close: "23:00", closed: false };
                    
                    return (
                      <div key={day} className="flex items-center gap-4 bg-black p-4 rounded-2xl">
                        <div className="w-24 font-medium">{day}</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!hours.closed}
                            onChange={(e) => {
                              const newHours = {...settings.openingHours};
                              newHours[dayKey] = {...hours, closed: !e.target.checked};
                              updateSettings({ openingHours: newHours });
                            }}
                          />
                          <span className="text-sm">Aberto</span>
                        </label>
                        
                        {!hours.closed && (
                          <>
                            <input 
                              type="time" 
                              value={hours.open}
                              onChange={(e) => {
                                const newHours = {...settings.openingHours};
                                newHours[dayKey] = {...hours, open: e.target.value};
                                updateSettings({ openingHours: newHours });
                              }}
                              className="bg-zinc-900 px-3 py-1 rounded-xl text-sm"
                            />
                            <span className="text-zinc-500">até</span>
                            <input 
                              type="time" 
                              value={hours.close}
                              onChange={(e) => {
                                const newHours = {...settings.openingHours};
                                newHours[dayKey] = {...hours, close: e.target.value};
                                updateSettings({ openingHours: newHours });
                              }}
                              className="bg-zinc-900 px-3 py-1 rounded-xl text-sm"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORIES ADMIN */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-semibold text-lg">Categorias</h3>
              <button onClick={addCategory} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-2xl text-sm">
                <Plus className="w-4 h-4" /> Nova
              </button>
            </div>
            
            <div className="space-y-2">
              {sortedCategories.map((cat, idx) => (
                <div key={cat.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, e.target.value)}
                      className="bg-transparent font-medium focus:outline-none w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveCategory(cat.id, 'up')} disabled={idx === 0} className="p-2 hover:bg-zinc-800 rounded-xl disabled:opacity-30">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveCategory(cat.id, 'down')} disabled={idx === sortedCategories.length-1} className="p-2 hover:bg-zinc-800 rounded-xl disabled:opacity-30">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-400 hover:bg-zinc-800 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCTS ADMIN */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-semibold text-lg">Produtos ({products.length})</h3>
              <button 
                onClick={addProduct}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-2xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar Produto
              </button>
            </div>

            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="bg-zinc-900 rounded-3xl p-4 flex gap-4">
                  <img src={product.image} className="w-20 h-20 object-cover rounded-2xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-emerald-400 font-mono text-sm">R${product.price}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleProductAvailability(product.id)}
                          className={`px-3 py-1 text-xs rounded-2xl ${product.available ? 'bg-emerald-900 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
                        >
                          {product.available ? 'ATIVO' : 'PAUSADO'}
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1 mt-1">{product.description}</div>
                    <div className="text-[10px] text-zinc-500 mt-2">{product.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-end">
          <div className="bg-zinc-900 w-full max-w-3xl mx-auto rounded-t-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between z-10">
              <button onClick={() => setShowProductModal(false)} className="p-2">
                <X className="w-6 h-6" />
              </button>
              <div className="font-semibold">Detalhes do Produto</div>
              <button 
                onClick={() => toggleFavorite(selectedProduct.id)}
                className="text-2xl"
              >
                {favorites.includes(selectedProduct.id) ? '❤️' : '♡'}
              </button>
            </div>

            <img 
              src={selectedProduct.image} 
              alt={selectedProduct.name}
              className="w-full h-64 object-cover"
            />

            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold">{selectedProduct.name}</h2>
                  <p className="text-3xl font-mono mt-1" style={{color: settings.colors.primary}}>
                    R${selectedProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-zinc-300 leading-relaxed">{selectedProduct.description}</p>

              {selectedProduct.category === "Pizzas" && (
                <div className="mt-6 bg-amber-900/30 border border-amber-500/30 p-4 rounded-2xl text-sm">
                  <strong>🍕 Meio a Meio disponível:</strong> Escolha 2 sabores diferentes pagando o valor médio.
                </div>
              )}

              <div className="mt-8">
                <div className="text-sm uppercase tracking-widest mb-3 text-zinc-400">Quantidade</div>
                <div className="flex items-center gap-6">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center border border-zinc-700 rounded-2xl active:bg-zinc-800">
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-4xl font-mono w-12 text-center">{quantity}</div>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center border border-zinc-700 rounded-2xl active:bg-zinc-800">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-sm uppercase tracking-widest mb-3 text-zinc-400">Observações</div>
                <textarea 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Sem cebola, bem passada, etc..."
                  className="w-full h-24 bg-black border border-zinc-700 rounded-3xl p-4 text-sm resize-y"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 sticky bottom-0 bg-zinc-900">
              <button 
                onClick={() => addToCart(selectedProduct)}
                className="w-full py-4 bg-white text-black font-semibold rounded-3xl text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{backgroundColor: settings.colors.primary}}
              >
                Adicionar ao Carrinho • R$ {((selectedProduct.price * quantity)).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART BOTTOM SHEET */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-end">
          <div className="bg-zinc-900 w-full max-w-3xl mx-auto rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-700 flex justify-between items-center">
              <div className="font-semibold text-xl">Seu Carrinho ({cart.length})</div>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="bg-black rounded-2xl p-4">
                  <div className="flex justify-between">
                    <div>
                      <div>{item.quantity}x {item.product.name}</div>
                      <div className="text-xs text-zinc-400">R${(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-zinc-700 rounded-2xl">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="px-3 py-2">-</button>
                        <div className="px-4 font-mono">{item.quantity}</div>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-3 py-2">+</button>
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-red-400">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-zinc-700 space-y-4 bg-zinc-900">
              <div className="flex justify-between text-sm">
                <div>Subtotal</div>
                <div>R${cartTotal.toFixed(2)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Taxa de entrega</div>
                <div>R${settings.deliveryFee.toFixed(2)}</div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-zinc-700 pt-4">
                <div>Total</div>
                <div style={{color: settings.colors.primary}}>R${finalTotal.toFixed(2)}</div>
              </div>

              <div className="pt-2">
                <input 
                  type="text" 
                  placeholder="Seu nome completo" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black rounded-2xl px-5 py-4 border border-zinc-700 text-sm mb-3"
                />
                <input 
                  type="text" 
                  placeholder="Endereço completo com número" 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-black rounded-2xl px-5 py-4 border border-zinc-700 text-sm mb-3"
                />
                
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-black rounded-2xl px-5 py-4 border border-zinc-700 text-sm"
                >
                  <option>Dinheiro</option>
                  <option>Pix</option>
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                </select>
              </div>

              <button 
                onClick={sendToWhatsApp}
                disabled={finalTotal < settings.minOrderValue}
                className="w-full py-4 rounded-3xl font-bold text-lg mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                style={{ backgroundColor: settings.colors.primary, color: '#000' }}
              >
                <MessageCircle className="w-6 h-6" />
                ENVIAR PEDIDO PELO WHATSAPP
              </button>
              
              {finalTotal < settings.minOrderValue && (
                <p className="text-center text-xs text-amber-400">Pedido mínimo: R${settings.minOrderValue}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PIN MODAL */}
      {showAdminPin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-xs rounded-3xl p-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Acesso Administrativo</h3>
            
            <input
              type="password"
              placeholder="Digite o PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl px-6 py-5 text-center text-3xl tracking-[8px] mb-8 focus:outline-none"
              maxLength={4}
            />
            
            <button 
              onClick={enterAdminMode}
              className="w-full py-4 bg-white text-black rounded-2xl font-semibold"
            >
              ENTRAR
            </button>
            
            <button 
              onClick={() => {setShowAdminPin(false); setPinInput('');}}
              className="w-full py-4 text-zinc-400 mt-3"
            >
              Cancelar
            </button>
            
            <div className="text-center text-[10px] text-zinc-500 mt-8">
              PIN padrão: 1234
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
