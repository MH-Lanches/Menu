import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Heart, Trash2, Edit2, Save, 
  Truck, Menu, X, ChevronUp, ChevronDown, 
  Search, Settings 
} from 'lucide-react';

interface AddonOption {
  name: string;
  price: number;
}

interface AddonGroup {
  name: string;
  maxSelect: number;
  options: AddonOption[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  active: boolean;
  addonGroups: AddonGroup[];
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface StoreConfig {
  name: string;
  deliveryFee: number;
  openTime: string;
  closeTime: string;
  phone: string;
  address: string;
  footerText: string;
  primaryColor: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  selectedAddons: { groupName: string; option: AddonOption }[];
}

interface SaleData {
  day: string;
  amount: number;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'X-Tudo',
    price: 18.90,
    description: 'Hambúrguer, queijo, presunto, ovo, alface, tomate e maionese',
    image: 'https://picsum.photos/id/292/600/400',
    category: 'Lanches',
    active: true,
    addonGroups: [
      {
        name: 'Molhos',
        maxSelect: 3,
        options: [
          { name: 'Maionese', price: 1.5 },
          { name: 'Ketchup', price: 0 },
          { name: 'Mostarda', price: 0 },
          { name: 'Barbecue', price: 2.5 },
        ]
      },
      {
        name: 'Bebidas',
        maxSelect: 1,
        options: [
          { name: 'Coca 350ml', price: 6.0 },
          { name: 'Guaraná', price: 6.0 },
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'X-Bacon',
    price: 22.50,
    description: 'Hambúrguer, bacon crocante, queijo, alface e tomate',
    image: 'https://picsum.photos/id/201/600/400',
    category: 'Lanches',
    active: true,
    addonGroups: [
      {
        name: 'Extras',
        maxSelect: 2,
        options: [
          { name: 'Ovo', price: 3.0 },
          { name: 'Queijo extra', price: 4.0 },
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Coca-Cola 600ml',
    price: 8.00,
    description: 'Refrigerante gelado',
    image: 'https://picsum.photos/id/30/600/400',
    category: 'Bebidas',
    active: true,
    addonGroups: []
  },
  {
    id: '4',
    name: 'Batata Frita',
    price: 14.90,
    description: 'Porção média com molho cheddar',
    image: 'https://picsum.photos/id/292/600/400',
    category: 'Acompanhamentos',
    active: true,
    addonGroups: []
  },
  {
    id: '5',
    name: 'Milk Shake Chocolate',
    price: 13.50,
    description: 'Delicioso milk shake de chocolate',
    image: 'https://picsum.photos/id/431/600/400',
    category: 'Bebidas',
    active: true,
    addonGroups: []
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Lanches', order: 1 },
  { id: 'c2', name: 'Bebidas', order: 2 },
  { id: 'c3', name: 'Acompanhamentos', order: 3 },
];

const INITIAL_CONFIG: StoreConfig = {
  name: 'Sabor Express',
  deliveryFee: 8.00,
  openTime: '11:00',
  closeTime: '23:00',
  phone: '11987654321',
  address: 'Rua das Delícias, 123 - Centro',
  footerText: '© Sabor Express - Delivery Autônomo via GitHub',
  primaryColor: '#f59e0b',
};

const INITIAL_SALES: SaleData[] = [
  { day: 'Seg', amount: 245 },
  { day: 'Ter', amount: 189 },
  { day: 'Qua', amount: 312 },
  { day: 'Qui', amount: 267 },
  { day: 'Sex', amount: 398 },
  { day: 'Sáb', amount: 452 },
  { day: 'Dom', amount: 176 },
];

export default function App() {
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [config, setConfig] = useState<StoreConfig>(INITIAL_CONFIG);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNotes, setModalNotes] = useState('');
  const [modalSelectedAddons, setModalSelectedAddons] = useState<{groupName: string, option: AddonOption}[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('username/delivery-repo');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'products' | 'categories' | 'history'>('dashboard');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState(config.address);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('pix');
  const [showPausedOnly, setShowPausedOnly] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('deliveryProducts');
    const savedCategories = localStorage.getItem('deliveryCategories');
    const savedConfig = localStorage.getItem('deliveryConfig');
    const savedFavorites = localStorage.getItem('deliveryFavorites');
    const savedCart = localStorage.getItem('deliveryCart');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('deliveryProducts', JSON.stringify(products));
    localStorage.setItem('deliveryCategories', JSON.stringify(categories));
    localStorage.setItem('deliveryConfig', JSON.stringify(config));
    localStorage.setItem('deliveryFavorites', JSON.stringify(favorites));
    localStorage.setItem('deliveryCart', JSON.stringify(cart));
  }, [products, categories, config, favorites, cart]);

  const isStoreOpen = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    const [openH, openM] = config.openTime.split(':').map(Number);
    const [closeH, closeM] = config.closeTime.split(':').map(Number);
    
    const currentTime = currentHour * 60 + currentMin;
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const storeOpen = isStoreOpen();

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesActive = !showPausedOnly || !p.active;
      return matchesSearch && matchesCategory && matchesActive;
    })
    .sort((a, b) => {
      if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
      if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
      return 0;
    });

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const categoryNames = ['Todos', ...sortedCategories.map(c => c.name)];

  const addToCart = (product: Product, quantity: number, notes: string, selectedAddons: any[]) => {
    const existingIndex = cart.findIndex(item => 
      item.productId === product.id && 
      item.notes === notes &&
      JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons)
    );
    
    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        notes,
        selectedAddons
      }]);
    }
    setShowProductModal(false);
    setModalQuantity(1);
    setModalNotes('');
    setModalSelectedAddons([]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateCartQuantity = (index: number, newQty: number) => {
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

  const calculateCartTotal = () => {
    const itemsTotal = cart.reduce((sum, item) => {
      const addonsTotal = item.selectedAddons.reduce((aSum, addon) => aSum + addon.option.price, 0);
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);
    return itemsTotal + config.deliveryFee;
  };

  const sendToWhatsApp = () => {
    if (!customerName || cart.length === 0) return alert('Preencha seu nome e adicione itens');

    let message = `*🛵 NOVO PEDIDO - ${config.name}*\\n\\n`;
    message += `*Nome:* ${customerName}\\n`;
    message += `*Endereço:* ${customerAddress}\\n`;
    message += `*Pagamento:* ${paymentMethod.toUpperCase()}\\n\\n`;
    message += `*ITENS:*\\n`;

    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - R$${(item.price * item.quantity).toFixed(2)}\\n`;
      if (item.selectedAddons.length > 0) {
        message += `  Adicionais: ${item.selectedAddons.map(a => a.option.name).join(', ')}\\n`;
      }
      if (item.notes) message += `  Obs: ${item.notes}\\n`;
    });

    message += `\\n*Taxa de entrega:* R$${config.deliveryFee.toFixed(2)}\\n`;
    message += `*TOTAL:* R$${calculateCartTotal().toFixed(2)}\\n\\n`;
    message += `Horário do pedido: ${new Date().toLocaleTimeString('pt-BR')}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${config.phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Simulate sale
    alert('Pedido enviado para o WhatsApp! Obrigado pelo seu pedido.');
    setCart([]);
    setIsCartOpen(false);
    setCustomerName('');
  };

  const saveProduct = (updatedProduct: Product) => {
    if (products.find(p => p.id === updatedProduct.id)) {
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      setProducts([...products, updatedProduct]);
    }
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    setProducts(products.filter(p => p.id !== id));
  };

  const toggleProductActive = (id: string) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  const addCategory = () => {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;
    const newCat: Category = {
      id: 'c' + Date.now(),
      name: name.trim(),
      order: categories.length + 1
    };
    setCategories([...categories, newCat]);
  };

  const deleteCategory = (id: string) => {
    if (!confirm('Excluir categoria? Produtos nesta categoria não serão excluídos.')) return;
    setCategories(categories.filter(c => c.id !== id));
  };

  const reorderCategory = (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return;
    
    const newCategories = [...categories];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (swapIdx < 0 || swapIdx >= newCategories.length) return;
    
    [newCategories[idx], newCategories[swapIdx]] = [newCategories[swapIdx], newCategories[idx]];
    
    // Update orders
    const updated = newCategories.map((cat, i) => ({...cat, order: i + 1}));
    setCategories(updated);
  };

  const updateConfig = (newConfig: Partial<StoreConfig>) => {
    setConfig({ ...config, ...newConfig });
    setShowSettingsModal(false);
  };

  const simulateSync = () => {
    if (!githubToken) {
      alert('Por favor insira um token do GitHub');
      return;
    }
    alert(`✅ Sincronizado com sucesso!\n\nRepositório: ${repoName}\nAlterações salvas no JSON via GitHub API (simulado)`);
    setShowSyncModal(false);
    setGithubToken('');
  };

  // Admin product edit form state
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    image: 'https://picsum.photos/id/292/600/400',
    category: 'Lanches',
    active: true,
    addonGroups: [
      { name: 'Adicionais', maxSelect: 4, options: [{name: '', price: 0}] },
    ]
  });

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      price: 15.9,
      description: '',
      image: 'https://picsum.photos/id/201/600/400',
      category: categories[0]?.name || 'Lanches',
      active: true,
      addonGroups: [
        { name: 'Molhos', maxSelect: 3, options: [{name: 'Ketchup', price: 0}, {name: 'Maionese', price: 2}] }
      ]
    });
  };

  const openEditProduct = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({...product});
    } else {
      resetNewProduct();
      setEditingProduct(null);
    }
    // Modal is controlled in render
  };

  return (
    <div className="min-h-screen bg-zinc-50" style={{ '--primary': config.primaryColor } as any}>
      {/* TOP NAV */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <div className="flex items-center gap-x-2">
                <div className="w-9 h-9 bg-orange-500 text-white rounded-2xl flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-2xl tracking-tighter text-zinc-900">{config.name}</div>
                  <div className="text-[10px] text-zinc-400 -mt-1">DELIVERY AUTÔNOMO</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              <div 
                onClick={() => setView(view === 'client' ? 'admin' : 'client')}
                className="flex items-center gap-x-1.5 bg-zinc-100 hover:bg-zinc-200 transition-colors text-xs font-medium px-4 py-1.5 rounded-3xl cursor-pointer border"
              >
                {view === 'client' ? <Settings className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                <span>{view === 'client' ? 'PAINEL ADMIN' : 'VER CARDÁPIO'}</span>
              </div>

              {view === 'client' && (
                <>
                  <div onClick={() => setIsCartOpen(true)} className="relative flex items-center justify-center w-10 h-10 hover:bg-zinc-100 rounded-2xl cursor-pointer transition-all active:scale-95">
                    <ShoppingCart className="w-5 h-5 text-zinc-700" />
                    {cart.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-full shadow">
                        {cart.length}
                      </div>
                    )}
                  </div>
                </>
              )}

              {view === 'admin' && (
                <div onClick={() => setShowSyncModal(true)} className="flex items-center gap-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 h-9 rounded-3xl cursor-pointer transition-colors">
                  <Save className="w-4 h-4" /> SINCRONIZAR
                </div>
              )}
            </div>
          </div>
        </div>

        {view === 'admin' && (
          <div className="border-t bg-white">
            <div className="max-w-6xl mx-auto px-6 flex text-sm">
              {(['dashboard', 'products', 'categories', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveAdminTab(tab)}
                  className={`px-8 py-3 font-medium border-b-2 transition-all ${activeAdminTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
                >
                  {tab === 'dashboard' && 'DASHBOARD'}
                  {tab === 'products' && 'PRODUTOS'}
                  {tab === 'categories' && 'CATEGORIAS'}
                  {tab === 'history' && 'HISTÓRICO'}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto">
        {view === 'client' ? (
          /* CLIENT VIEW */
          <div>
            {/* HERO */}
            <div className="h-80 bg-gradient-to-br from-orange-600 via-amber-600 to-red-500 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:30px_30px]"></div>
              <div className="relative z-10 text-center px-5">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-sm tracking-[2px] px-6 py-2 rounded-3xl mb-6">
                  {storeOpen ? '🟢 ABERTO AGORA' : '🔴 FECHADO'}
                </div>
                <h1 className="text-white text-6xl font-bold tracking-tighter">O que você vai pedir hoje?</h1>
                <p className="text-orange-100 mt-3 max-w-md mx-auto">Lanches frescos • Entrega rápida • Qualidade garantida</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-50 to-transparent"></div>
            </div>

            {/* FILTERS */}
            <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
              <div className="max-w-6xl mx-auto px-5 py-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-4 top-3 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar lanches, bebidas..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-100 focus:bg-white border border-transparent focus:border-orange-200 rounded-3xl outline-none text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scroll">
                    {categoryNames.map(cat => (
                      <div 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-3xl cursor-pointer transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white shadow-inner' : 'bg-white border hover:bg-orange-50'}`}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            <div className="max-w-6xl mx-auto px-5 pt-8 pb-24">
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <div className="font-semibold text-xl">{selectedCategory === 'Todos' ? 'Todos os itens' : selectedCategory}</div>
                  <div className="text-sm text-zinc-500">{filteredProducts.length} produtos</div>
                </div>
                
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={showPausedOnly} onChange={(e) => setShowPausedOnly(e.target.checked)} className="accent-orange-500" />
                  <span>Ver apenas pausados</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => {
                      setSelectedProductForModal(product);
                      setShowProductModal(true);
                      setModalQuantity(1);
                      setModalNotes('');
                      setModalSelectedAddons([]);
                    }}
                    className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 hover:border-orange-200 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="relative h-52">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {!product.active && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white uppercase text-[10px] font-bold tracking-widest px-3 py-1 rounded-3xl">PAUSADO</div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                        className="absolute top-4 left-4 bg-white/90 hover:bg-white p-2 rounded-2xl shadow transition-all"
                      >
                        <Heart className={`w-4 h-4 transition-all ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-zinc-500'}`} />
                      </button>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between">
                        <div className="font-semibold text-lg leading-none">{product.name}</div>
                        <div className="font-mono text-orange-600 text-lg">R${product.price.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-2 mt-2.5 mb-4">{product.description}</div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">{product.category}</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleProductActive(product.id); }}
                          className={`text-[10px] px-3 py-px rounded-full ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                        >
                          {product.active ? 'ATIVO' : 'PAUSADO'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ADMIN PANEL */
          <div className="p-8">
            {activeAdminTab === 'dashboard' && (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 border">
                  <div className="flex justify-between mb-8">
                    <div>
                      <div className="uppercase text-xs tracking-[1px] text-zinc-400">FATURAMENTO HOJE</div>
                      <div className="text-6xl font-semibold text-zinc-900 tracking-tighter mt-1">R$1.284</div>
                    </div>
                    <div className={`px-6 py-2 rounded-3xl text-sm flex items-center gap-2 self-start ${storeOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${storeOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {storeOpen ? 'ABERTO' : 'FECHADO'}
                    </div>
                  </div>

                  <div className="h-72">
                    <div className="flex h-full items-end gap-3">
                      {INITIAL_SALES.map((sale, idx) => (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-y-2">
                          <div 
                            className="bg-gradient-to-t from-orange-400 to-amber-400 w-full rounded-t transition-all hover:scale-105" 
                            style={{height: `${Math.max(70, sale.amount / 4)}px`}}
                          ></div>
                          <div className="text-xs text-zinc-400">{sale.day}</div>
                          <div className="font-mono text-[10px]">R${sale.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-3xl p-7 border">
                    <div className="text-sm text-zinc-500">TAXA DE ENTREGA</div>
                    <div className="flex items-end gap-1 mt-3">
                      <span className="text-6xl font-semibold tabular-nums">8</span>
                      <span className="text-3xl text-zinc-300">,00</span>
                    </div>
                    <div className="text-xs text-emerald-600 mt-6">+2% este mês</div>
                  </div>
                  
                  <div onClick={() => setShowSettingsModal(true)} className="bg-white border rounded-3xl p-7 cursor-pointer hover:shadow transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Configurações da Loja</div>
                        <div className="text-sm text-zinc-500 mt-3">Horários • Cores • Informações</div>
                      </div>
                      <Settings className="w-8 h-8 text-orange-400 group-hover:rotate-12 transition" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="text-2xl font-semibold">Gestão de Estoque</div>
                  <button 
                    onClick={() => {resetNewProduct(); setEditingProduct(null); setShowProductModal(true); }}
                    className="flex items-center gap-x-2 bg-zinc-900 hover:bg-black text-white px-5 py-3 rounded-3xl text-sm"
                  >
                    <Plus className="w-4 h-4" /> NOVO PRODUTO
                  </button>
                </div>

                <div className="bg-white rounded-3xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pl-8 py-5 text-xs font-medium text-zinc-400">PRODUTO</th>
                        <th className="text-left py-5 text-xs font-medium text-zinc-400">CATEGORIA</th>
                        <th className="text-right py-5 text-xs font-medium text-zinc-400 pr-8">PREÇO</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b last:border-none group">
                          <td className="pl-8 py-4">
                            <div className="flex items-center gap-x-4">
                              <img src={product.image} className="w-12 h-12 object-cover rounded-2xl" />
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-zinc-500 line-clamp-1">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="inline-block bg-zinc-100 px-4 py-1 text-xs rounded-3xl">{product.category}</span>
                          </td>
                          <td className="py-4 text-right font-mono pr-8">R${product.price.toFixed(2)}</td>
                          <td className="pr-8">
                            <div className="flex items-center justify-end gap-x-2 opacity-30 group-hover:opacity-100 transition-all">
                              <button onClick={() => toggleProductActive(product.id)} className="p-2 hover:bg-zinc-100 rounded-xl">
                                {product.active ? '👁️' : '🚫'}
                              </button>
                              <button onClick={() => openEditProduct(product)} className="p-2 hover:bg-zinc-100 rounded-xl">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-zinc-100 rounded-xl text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeAdminTab === 'categories' && (
              <div className="max-w-md">
                <div className="flex justify-between mb-5">
                  <div className="font-semibold text-xl">Categorias do Cardápio</div>
                  <button onClick={addCategory} className="text-sm flex items-center gap-1 bg-white border px-4 rounded-3xl">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {sortedCategories.map((category, idx) => (
                    <div key={category.id} className="bg-white border flex items-center justify-between px-6 py-5 rounded-3xl group">
                      <div className="font-medium">{category.name}</div>
                      <div className="flex items-center gap-x-1">
                        <button 
                          onClick={() => reorderCategory(category.id, 'up')} 
                          disabled={idx === 0}
                          className="disabled:opacity-30 p-2"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => reorderCategory(category.id, 'down')} 
                          disabled={idx === sortedCategories.length - 1}
                          className="disabled:opacity-30 p-2"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="ml-4 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-xs text-zinc-400 px-2">A ordem acima define a exibição no cardápio do cliente.</div>
              </div>
            )}

            {activeAdminTab === 'history' && (
              <div>
                <div className="text-xl font-semibold mb-6">Últimos Pedidos</div>
                <div className="space-y-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white border rounded-3xl p-6 flex justify-between items-center">
                      <div>
                        <div className="font-medium">João Silva #{1000 + i}</div>
                        <div className="text-sm text-zinc-500">3 itens • Entrega em 25 min</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">R$ {(42 + i * 3)}.90</div>
                        <div className="text-xs text-emerald-500">Concluído</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRODUCT MODAL - used for both client detail and admin edit */}
      {(showProductModal && (view === 'client' ? selectedProductForModal : true)) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={() => {
          setShowProductModal(false); 
          setSelectedProductForModal(null);
          setEditingProduct(null);
        }}>
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white w-full max-w-xl max-h-[92vh] overflow-auto rounded-3xl shadow-2xl"
          >
            {view === 'client' && selectedProductForModal ? (
              /* CLIENT PRODUCT DETAIL */
              <div>
                <div className="relative">
                  <img src={selectedProductForModal.image} className="w-full h-80 object-cover" />
                  <button onClick={() => setShowProductModal(false)} className="absolute top-6 right-6 bg-black/60 text-white p-3 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{selectedProductForModal.name}</div>
                      <div className="text-orange-600 font-mono text-3xl mt-1">R${selectedProductForModal.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => toggleFavorite(selectedProductForModal.id)} className="mt-2">
                      <Heart className={`w-8 h-8 ${favorites.includes(selectedProductForModal.id) ? "fill-red-500 text-red-500" : "text-zinc-300"}`} />
                    </button>
                  </div>
                  
                  <p className="mt-4 text-zinc-600 leading-relaxed">{selectedProductForModal.description}</p>

                  {/* ADDONS */}
                  {selectedProductForModal.addonGroups.length > 0 && (
                    <div className="mt-8 space-y-8">
                      {selectedProductForModal.addonGroups.map((group, gIndex) => (
                        <div key={gIndex}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="font-medium">{group.name}</div>
                            <div className="text-xs text-zinc-400">máx. {group.maxSelect}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {group.options.map((opt, oIndex) => {
                              const isSelected = modalSelectedAddons.some(a => a.option.name === opt.name && a.groupName === group.name);
                              return (
                                <div 
                                  key={oIndex} 
                                  onClick={() => {
                                    const currentForGroup = modalSelectedAddons.filter(a => a.groupName === group.name);
                                    if (isSelected) {
                                      setModalSelectedAddons(modalSelectedAddons.filter(a => !(a.groupName === group.name && a.option.name === opt.name)));
                                    } else if (currentForGroup.length < group.maxSelect) {
                                      setModalSelectedAddons([...modalSelectedAddons, {groupName: group.name, option: opt}]);
                                    } else {
                                      alert(`Máximo de ${group.maxSelect} para ${group.name}`);
                                    }
                                  }}
                                  className={`border rounded-2xl px-4 py-4 cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'border-orange-500 bg-orange-50' : 'hover:border-zinc-300'}`}
                                >
                                  <div>{opt.name}</div>
                                  <div className="font-mono text-xs text-right">+R${opt.price.toFixed(2)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8">
                    <label className="block text-xs tracking-widest mb-2 text-zinc-500">ALGUMA OBSERVAÇÃO?</label>
                    <textarea 
                      value={modalNotes} 
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full h-20 border-2 focus:border-orange-300 rounded-3xl p-5 text-sm" 
                      placeholder="Sem cebola, ponto da carne etc..."
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-x-6">
                      <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="border w-9 h-9 flex items-center justify-center rounded-2xl active:bg-zinc-100">-</button>
                      <div className="tabular-nums w-6 text-center font-semibold text-xl">{modalQuantity}</div>
                      <button onClick={() => setModalQuantity(modalQuantity + 1)} className="border w-9 h-9 flex items-center justify-center rounded-2xl active:bg-zinc-100">+</button>
                    </div>
                    
                    <button 
                      onClick={() => addToCart(selectedProductForModal, modalQuantity, modalNotes, modalSelectedAddons)}
                      className="bg-orange-500 text-white px-10 py-4 rounded-3xl flex-1 ml-6 font-medium active:scale-[0.985] transition-transform"
                    >
                      Adicionar • R${((selectedProductForModal.price * modalQuantity) + modalSelectedAddons.reduce((sum, a) => sum + a.option.price, 0)).toFixed(2)}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ADMIN EDIT MODAL */
              <div className="p-8">
                <div className="text-xl font-semibold mb-6">Editar Produto</div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">NOME DO PRODUTO</label>
                    <input 
                      value={newProduct.name || ''} 
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full border rounded-2xl px-5 py-4" 
                      placeholder="Nome do produto" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-zinc-500 block mb-2">PREÇO</label>
                      <div className="relative">
                        <span className="absolute left-5 top-4 text-zinc-400">R$</span>
                        <input 
                          type="number" 
                          value={newProduct.price || 0} 
                          onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                          className="w-full border rounded-2xl pl-10 py-4" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-2">CATEGORIA</label>
                      <select 
                        value={newProduct.category} 
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full border rounded-2xl px-5 py-4 bg-white"
                      >
                        {sortedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">DESCRIÇÃO</label>
                    <textarea 
                      value={newProduct.description || ''} 
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="border w-full rounded-3xl p-5 h-28" 
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">URL DA IMAGEM</label>
                    <input 
                      value={newProduct.image || ''} 
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      className="border w-full rounded-2xl px-5 py-4 text-sm" 
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-4 items-center">
                      <div className="font-medium">Adicionais e Opcionais</div>
                      <button onClick={() => {
                        const groups = newProduct.addonGroups || [];
                        setNewProduct({
                          ...newProduct, 
                          addonGroups: [...groups, {name: 'Novo Grupo', maxSelect: 2, options: [{name:'Item', price: 2}]}]
                        });
                      }} className="text-xs flex items-center gap-1 text-orange-600">
                        + Grupo
                      </button>
                    </div>
                    
                    {(newProduct.addonGroups || []).map((group, index) => (
                      <div key={index} className="mb-8 border-l-2 border-orange-200 pl-5">
                        <input 
                          value={group.name} 
                          onChange={e => {
                            const grps = [...(newProduct.addonGroups || [])];
                            grps[index].name = e.target.value;
                            setNewProduct({...newProduct, addonGroups: grps});
                          }}
                          className="font-medium mb-3 block w-full border-none focus:ring-0 p-0 text-lg" 
                        />
                        
                        <div className="flex gap-3 mb-4">
                          <div className="flex-1">
                            <div className="text-xs text-zinc-400">MÁX SELEÇÃO</div>
                            <input 
                              type="number" 
                              value={group.maxSelect} 
                              onChange={e => {
                                const grps = [...(newProduct.addonGroups || [])];
                                grps[index].maxSelect = parseInt(e.target.value) || 1;
                                setNewProduct({...newProduct, addonGroups: grps});
                              }}
                              className="border rounded-xl py-2 px-4 w-20 text-sm" 
                            />
                          </div>
                        </div>
                        
                        {group.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-4 mb-3">
                            <input 
                              placeholder="Nome do adicional" 
                              value={opt.name} 
                              onChange={ev => {
                                const grps = [...(newProduct.addonGroups || [])];
                                grps[index].options[optIdx].name = ev.target.value;
                                setNewProduct({...newProduct, addonGroups: grps});
                              }}
                              className="flex-1 border rounded-2xl px-5 py-3 text-sm" 
                            />
                            <div className="w-28">
                              <div className="flex items-center border rounded-2xl px-4">
                                <span className="text-zinc-400 text-xs">R$</span>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={opt.price} 
                                  onChange={ev => {
                                    const grps = [...(newProduct.addonGroups || [])];
                                    grps[index].options[optIdx].price = parseFloat(ev.target.value) || 0;
                                    setNewProduct({...newProduct, addonGroups: grps});
                                  }}
                                  className="flex-1 py-3 focus:outline-none text-sm" 
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const grps = [...(newProduct.addonGroups || [])];
                                grps[index].options.splice(optIdx, 1);
                                setNewProduct({...newProduct, addonGroups: grps});
                              }}
                              className="text-red-400"
                            >×</button>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => {
                            const grps = [...(newProduct.addonGroups || [])];
                            grps[index].options.push({name: 'Novo item', price: 2.5});
                            setNewProduct({...newProduct, addonGroups: grps});
                          }}
                          className="text-xs text-orange-500 flex items-center gap-x-1 mt-2"
                        >
                          <Plus className="w-3 h-3" /> Adicionar opção
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-12">
                  <button 
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-4 text-sm font-medium border rounded-3xl"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={() => {
                      if (!newProduct.name) return alert("Nome é obrigatório");
                      const prodToSave: Product = {
                        id: editingProduct ? editingProduct.id : 'p' + Date.now(),
                        name: newProduct.name!,
                        price: newProduct.price || 0,
                        description: newProduct.description || '',
                        image: newProduct.image || 'https://picsum.photos/id/292/600/400',
                        category: newProduct.category || 'Lanches',
                        active: newProduct.active !== undefined ? newProduct.active : true,
                        addonGroups: newProduct.addonGroups || []
                      };
                      saveProduct(prodToSave);
                      setShowProductModal(false);
                    }}
                    className="flex-1 py-4 bg-orange-500 text-white font-medium rounded-3xl"
                  >
                    SALVAR PRODUTO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && view === 'client' && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="px-7 pt-8 pb-6 border-b flex justify-between items-center">
              <div className="font-semibold text-2xl">Seu Carrinho</div>
              <button onClick={() => setIsCartOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                <div className="text-6xl mb-6">🛍️</div>
                <div className="font-medium">Seu carrinho está vazio</div>
                <div className="text-sm text-zinc-500 mt-3">Adicione alguns lanches deliciosos</div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto px-6 pt-4 space-y-6">
                  {cart.map((item, index) => {
                    const addonsPrice = item.selectedAddons.reduce((s, ad) => s + ad.option.price, 0);
                    
                    return (
                      <div key={index} className="border rounded-3xl p-5">
                        <div className="flex justify-between">
                          <div className="font-medium">{item.quantity}× {item.name}</div>
                          <div className="font-mono">R${((item.price + addonsPrice) * item.quantity).toFixed(2)}</div>
                        </div>
                        
                        {item.selectedAddons.length > 0 && <div className="text-xs mt-2 text-zinc-500">+ {item.selectedAddons.map(a => a.option.name).join(" • ")}</div>}
                        {item.notes && <div className="text-xs mt-1 italic text-amber-600">“{item.notes}”</div>}
                        
                        <div className="flex justify-between mt-6">
                          <div className="flex items-center gap-x-4 text-sm">
                            <button onClick={() => updateCartQuantity(index, item.quantity - 1)} className="w-7 h-7 border flex items-center justify-center rounded-lg">-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(index, item.quantity + 1)} className="w-7 h-7 border flex items-center justify-center rounded-lg">+</button>
                          </div>
                          <button onClick={() => removeFromCart(index)} className="text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-7 border-t mt-auto">
                  <div className="flex justify-between text-sm mb-1">
                    <div>Subtotal</div>
                    <div>R${cart.reduce((sum, item) => {
                      const addons = item.selectedAddons.reduce((a, b) => a + b.option.price, 0);
                      return sum + (item.price + addons) * item.quantity;
                    }, 0).toFixed(2)}</div>
                  </div>
                  <div className="flex justify-between text-sm mb-6">
                    <div>Taxa de entrega</div>
                    <div className="text-emerald-600">R${config.deliveryFee.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex justify-between font-semibold text-xl mb-8">
                    <div>Total</div>
                    <div>R${calculateCartTotal().toFixed(2)}</div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      value={customerName} 
                      onChange={e => setCustomerName(e.target.value)} 
                      placeholder="Seu nome completo" 
                      className="border w-full px-5 py-4 rounded-3xl" 
                    />
                    <input 
                      value={customerAddress} 
                      onChange={e => setCustomerAddress(e.target.value)} 
                      placeholder="Endereço completo" 
                      className="border w-full px-5 py-4 rounded-3xl" 
                    />
                    
                    <div className="flex gap-2">
                      {(['pix', 'dinheiro', 'cartao'] as const).map((pm) => (
                        <button 
                          key={pm}
                          onClick={() => setPaymentMethod(pm)}
                          className={`flex-1 py-3 text-xs rounded-3xl border transition-all ${paymentMethod === pm ? 'bg-zinc-900 text-white border-zinc-900' : ''}`}
                        >
                          {pm.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={sendToWhatsApp}
                    disabled={!storeOpen}
                    className={`mt-6 w-full py-5 text-lg font-medium rounded-3xl flex items-center justify-center gap-x-3 transition-all ${storeOpen ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
                  >
                    {storeOpen ? 'ENVIAR PEDIDO PELO WHATSAPP' : 'LOJA FECHADA NO MOMENTO'}
                  </button>
                  
                  {!storeOpen && <div className="text-center text-xs text-zinc-400 mt-4">Pedidos serão preparados assim que abrirmos</div>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[120]" onClick={() => setShowSettingsModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-lg p-8">
            <div className="font-semibold text-2xl mb-8">Configurações da Loja</div>
            
            <div className="space-y-8">
              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block">Nome da Loja</label>
                <input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full border py-4 rounded-3xl px-6" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest mb-3 block">Abre às</label>
                  <input type="time" value={config.openTime} onChange={e => setConfig({...config, openTime: e.target.value})} className="w-full border py-4 rounded-3xl px-6" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-3 block">Fecha às</label>
                  <input type="time" value={config.closeTime} onChange={e => setConfig({...config, closeTime: e.target.value})} className="w-full border py-4 rounded-3xl px-6" />
                </div>
              </div>
              
              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block">Taxa de entrega</label>
                <div className="relative">
                  <span className="absolute left-6 top-4">R$</span>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={config.deliveryFee} 
                    onChange={e => setConfig({...config, deliveryFee: parseFloat(e.target.value)})} 
                    className="pl-12 w-full border py-4 rounded-3xl px-6" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block">Rodapé</label>
                <input value={config.footerText} onChange={e => setConfig({...config, footerText: e.target.value})} className="w-full border py-4 rounded-3xl px-6 text-sm" />
              </div>
            </div>

            <div className="flex gap-x-3 mt-12">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-4 text-sm border rounded-3xl">FECHAR</button>
              <button onClick={() => updateConfig({})} className="flex-1 py-4 bg-zinc-900 text-white rounded-3xl text-sm">SALVAR CONFIGURAÇÕES</button>
            </div>
          </div>
        </div>
      )}

      {/* SYNC MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[120]">
          <div className="bg-white max-w-md w-full rounded-3xl p-8">
            <div className="flex items-center gap-x-3 mb-6">
              <div className="bg-black text-white px-4 py-1 rounded-3xl text-xs font-mono tracking-wider">GITHUB</div>
              <div className="font-semibold">Sincronização Automática</div>
            </div>
            
            <div className="text-sm leading-relaxed text-zinc-600 mb-7">
              Todas as alterações são salvas automaticamente no seu repositório GitHub. 
              Insira o Personal Access Token e o nome do repositório para sincronizar os JSONs.
            </div>
            
            <input 
              value={repoName} 
              onChange={(e) => setRepoName(e.target.value)} 
              placeholder="seuusuario/delivery-json" 
              className="w-full px-5 py-4 border rounded-3xl mb-4"
            />
            
            <input 
              type="password"
              value={githubToken} 
              onChange={(e) => setGithubToken(e.target.value)} 
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" 
              className="w-full px-5 py-4 border rounded-3xl mb-8"
            />
            
            <div className="flex items-center gap-x-4">
              <button onClick={() => setShowSyncModal(false)} className="flex-1 py-4 text-sm border rounded-3xl">CANCELAR</button>
              <button onClick={simulateSync} className="flex-1 py-4 bg-emerald-600 text-white rounded-3xl">SINCRONIZAR AGORA</button>
            </div>
            
            <div className="text-[10px] text-center text-zinc-400 mt-8">Simulação de integração com GitHub API</div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-900 text-white/70 py-8 text-xs text-center">
        {config.footerText}
        <div className="mt-3 text-[10px]">Hospedado no GitHub • Dados salvos em JSON</div>
      </footer>
    </div>
  );
}
