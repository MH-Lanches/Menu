import { useState, useEffect, useMemo } from 'react';
import { defaultProducts, defaultAddons, categoryEmojis, type Product, type Addon, type ProductType } from './data/products';

// ==================== TYPES ====================
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  flavor1?: string;
  flavor2?: string;
  selectedFlavors?: string[];
  addons: { name: string; price: number }[];
  observation?: string;
  total: number;
}

interface Order {
  id: string;
  customer: { name: string; phone: string; address: string; payment: string };
  items: CartItem[];
  total: number;
  deliveryFee: number;
  coupon?: { code: string; discount: number; type: string };
  status: string;
  date: string;
}

interface Coupon {
  code: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  minPurchase: number;
  validUntil: string;
  active: boolean;
}

// ==================== PERSISTENCE ====================
function loadProducts(): Product[] {
  const saved = localStorage.getItem('mh_products');
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaultProducts; }
  }
  localStorage.setItem('mh_products', JSON.stringify(defaultProducts));
  return defaultProducts;
}

function saveProducts(products: Product[]) {
  localStorage.setItem('mh_products', JSON.stringify(products));
}

function loadAddons(): Addon[] {
  const saved = localStorage.getItem('mh_addons');
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaultAddons; }
  }
  localStorage.setItem('mh_addons', JSON.stringify(defaultAddons));
  return defaultAddons;
}

function saveAddons(addons: Addon[]) {
  localStorage.setItem('mh_addons', JSON.stringify(addons));
}

function loadCoupons(): Coupon[] {
  const saved = localStorage.getItem('mh_coupons');
  if (saved) { try { return JSON.parse(saved); } catch {} }
  const defaults: Coupon[] = [
    { code: 'BEMVINDO', type: 'percent', value: 10, maxUses: 50, usedCount: 0, minPurchase: 30, validUntil: '2025-12-31', active: true },
    { code: 'FRETEGRATIS', type: 'frete', value: 0, maxUses: 20, usedCount: 0, minPurchase: 50, validUntil: '2025-12-31', active: true },
    { code: 'DESCONTO10', type: 'fixed', value: 10, maxUses: 30, usedCount: 0, minPurchase: 40, validUntil: '2025-12-31', active: true },
  ];
  localStorage.setItem('mh_coupons', JSON.stringify(defaults));
  return defaults;
}

function saveCoupons(c: Coupon[]) { localStorage.setItem('mh_coupons', JSON.stringify(c)); }

function loadOrders(): Order[] {
  const saved = localStorage.getItem('mh_orders');
  if (saved) { try { return JSON.parse(saved); } catch {} }
  return [];
}

function saveOrders(o: Order[]) { localStorage.setItem('mh_orders', JSON.stringify(o)); }

function loadConfig() {
  const saved = localStorage.getItem('mh_config');
  if (saved) { try { return JSON.parse(saved); } catch {} }
  return {
    storeName: 'MH Lanches',
    title: 'MH Lanches',
    subtitle: 'O melhor delivery da cidade!',
    phone: '5511999999999',
    address: 'Rua Exemplo, 123 - Centro',
    deliveryFee: 5.00,
    minOrder: 15.00,
    hours: [
      { day: 'Domingo', open: '18:00', close: '23:00', closed: false },
      { day: 'Segunda', open: '18:00', close: '23:00', closed: false },
      { day: 'Terça', open: '18:00', close: '23:00', closed: false },
      { day: 'Quarta', open: '18:00', close: '23:00', closed: false },
      { day: 'Quinta', open: '18:00', close: '23:00', closed: false },
      { day: 'Sexta', open: '18:00', close: '00:00', closed: false },
      { day: 'Sábado', open: '18:00', close: '00:00', closed: false },
    ],
    social: { whatsapp: '5511999999999', instagram: '#', facebook: '#' },
    aboutTitle: 'Sobre Nós',
    aboutText: 'O MH Lanches nasceu da paixão por fazer o melhor lanche da cidade. Desde 2020, servimos sabor com qualidade.',
    footerText: '© 2025 MH Lanches - Todos os direitos reservados.',
    announcements: ['🔥 Promoção: 2 X-Bacon por R$45!', '🚚 Frete grátis acima de R$50!', '⭐ Peça pelo WhatsApp!'],
    logo: 'https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572',
  };
}

function saveConfig(c: any) { localStorage.setItem('mh_config', JSON.stringify(c)); }

// ==================== MAIN APP ====================
export default function App() {
  const [page, setPage] = useState<'site' | 'admin' | 'pdv'>('site');
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [addons, setAddons] = useState<Addon[]>(loadAddons);
  const [coupons, setCoupons] = useState<Coupon[]>(loadCoupons);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [config] = useState(loadConfig);

  // Persist to localStorage whenever state changes
  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveAddons(addons); }, [addons]);
  useEffect(() => { saveCoupons(coupons); }, [coupons]);
  useEffect(() => { saveOrders(orders); }, [orders]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-cyan-900/30 px-4 py-2 flex gap-2 justify-center">
        <button onClick={() => setPage('site')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${page === 'site' ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}>
          🏪 Cardápio
        </button>
        <button onClick={() => setPage('admin')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${page === 'admin' ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}>
          ⚙️ Admin
        </button>
        <button onClick={() => setPage('pdv')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${page === 'pdv' ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
          🖥️ PDV
        </button>
      </nav>
      <div className="pt-14">
        {page === 'site' && <CustomerPage products={products} addons={addons} coupons={coupons} setCoupons={setCoupons} setOrders={setOrders} config={config} />}
        {page === 'admin' && <AdminPage products={products} setProducts={setProducts} addons={addons} setAddons={setAddons} coupons={coupons} setCoupons={setCoupons} config={config} />}
        {page === 'pdv' && <PDVPage orders={orders} setOrders={setOrders} />}
      </div>
    </div>
  );
}

// ==================== CUSTOMER PAGE ====================
function CustomerPage({ products, addons, coupons, setCoupons, setOrders, config }: {
  products: Product[]; addons: Addon[]; coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>; config: any;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [favorites, setFavorites] = useState<string[]>(() => { const s = localStorage.getItem('mh_favs'); return s ? JSON.parse(s) : []; });
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [customerInfo, setCustomerInfo] = useState(() => {
    const s = localStorage.getItem('mh_customer');
    return s ? JSON.parse(s) : { name: '', phone: '', address: '', payment: 'pix' };
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(localStorage.getItem('mh_pedidoId'));
  const [_orderStatus, _setOrderStatus] = useState<string>('');
  const [toastMsg, setToastMsg] = useState('');
  const [whatsappFallback, setWhatsappFallback] = useState('');

  // Save cart to localStorage
  useEffect(() => { localStorage.setItem('mh_cart', JSON.stringify(cart)); }, [cart]);

  // Load cart from localStorage
  useEffect(() => {
    const s = localStorage.getItem('mh_cart');
    if (s) { try { setCart(JSON.parse(s)); } catch {} }
  }, []);

  // Announcement rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement(prev => (prev + 1) % (config.announcements?.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [config.announcements]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.filter(p => p.active).map(p => p.category))];
    return ['Todos', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return selectedCategory === 'Todos' ? products : products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.total * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const deliveryFee = config.deliveryFee;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'frete') return deliveryFee;
    if (appliedCoupon.type === 'percent') return cartTotal * (appliedCoupon.value / 100);
    if (appliedCoupon.type === 'fixed') return appliedCoupon.value;
    return 0;
  }, [appliedCoupon, cartTotal, deliveryFee]);

  const finalTotal = Math.max(0, cartTotal + deliveryFee - couponDiscount);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleFav = (id: string) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('mh_favs', JSON.stringify(newFavs));
  };

  const openProduct = (p: Product) => {
    if (!p.active) return;
    if (p.type === 'simple') {
      addToCart(p, {});
    } else {
      setSelectedProduct(p);
    }
  };

  const addToCart = (product: Product, opts: any) => {
    let name = product.name;
    let basePrice = product.price;
    const addonsList: { name: string; price: number }[] = [];

    if (product.type === 'halfhalf') {
      const f1 = opts.flavor1 || product.flavors?.[0] || '';
      const f2 = opts.flavor2 || product.flavors?.[1] || '';
      name = `${product.name} (${f1} / ${f2})`;
      if (product.halfPrice) basePrice = product.price;
    }

    if (product.type === 'special') {
      const flavors = opts.selectedFlavors || [];
      if (flavors.length > 0) name = `${product.name} (${flavors.join(' + ')})`;
    }

    if (opts.addons?.length > 0) {
      opts.addons.forEach((aid: string) => {
        const a = addons.find(x => x.id === aid);
        if (a && a.active) {
          addonsList.push({ name: a.name, price: a.price });
        }
      });
    }

    const addonsTotal = addonsList.reduce((s, a) => s + a.price, 0);
    const total = basePrice + addonsTotal;

    const item: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name,
      price: total,
      quantity: 1,
      flavor1: opts.flavor1,
      flavor2: opts.flavor2,
      selectedFlavors: opts.selectedFlavors,
      addons: addonsList,
      observation: opts.observation || '',
      total,
    };

    setCart(prev => [...prev, item]);
    showToast(`✅ ${product.name} adicionado ao carrinho!`);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const applyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!coupon) { setCouponMsg('❌ Cupom inválido'); return; }
    if (!coupon.active) { setCouponMsg('❌ Cupom expirado'); return; }
    if (coupon.usedCount >= coupon.maxUses) { setCouponMsg('❌ Cupom esgotado'); return; }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) { setCouponMsg('❌ Cupom vencido'); return; }
    if (cartTotal < coupon.minPurchase) { setCouponMsg(`❌ Mínimo R$${coupon.minPurchase.toFixed(2)}`); return; }
    setAppliedCoupon(coupon);
    setCouponMsg(`✅ Cupom aplicado!`);
  };

  const sendWhatsApp = () => {
    if (cart.length === 0) return;
    if (!customerInfo.name || !customerInfo.phone) { setCouponMsg('Preencha nome e telefone!'); return; }
    if (cartTotal < config.minOrder) { setCouponMsg(`Mínimo: R$${config.minOrder.toFixed(2)}`); return; }

    localStorage.setItem('mh_customer', JSON.stringify(customerInfo));

    const orderId = `MH${Date.now()}`;
    setLastOrderId(orderId);
    localStorage.setItem('mh_pedidoId', orderId);

    const order: Order = {
      id: orderId,
      customer: customerInfo,
      items: cart,
      total: finalTotal,
      deliveryFee,
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscount, type: appliedCoupon.type } : undefined,
      status: 'Novo',
      date: new Date().toISOString(),
    };

    setOrders(prev => [...prev, order]);

    // If coupon used, increment counter
    if (appliedCoupon) {
      setCoupons(prev => prev.map(c =>
        c.code === appliedCoupon.code ? { ...c, usedCount: c.usedCount + 1 } : c
      ));
    }

    let msg = `🔔 *NOVO PEDIDO - MH LANCHES*\n`;
    msg += `📋 Pedido: ${orderId}\n`;
    msg += `👤 ${customerInfo.name}\n📞 ${customerInfo.phone}\n📍 ${customerInfo.address}\n\n`;
    cart.forEach((item, i) => {
      msg += `${i + 1}. ${item.name} x${item.quantity} - R$${(item.total * item.quantity).toFixed(2)}\n`;
      if (item.observation) msg += `   📝 ${item.observation}\n`;
      if (item.addons.length > 0) {
        item.addons.forEach(a => { msg += `   ➕ ${a.name} (R$${a.price.toFixed(2)})\n`; });
      }
    });
    msg += `\n💰 Subtotal: R$${cartTotal.toFixed(2)}`;
    msg += `\n🚚 Entrega: R$${deliveryFee.toFixed(2)}`;
    if (appliedCoupon) {
      msg += `\n🎫 Cupom: ${appliedCoupon.code} (-R$${couponDiscount.toFixed(2)})`;
    }
    msg += `\n💵 *TOTAL: R$${finalTotal.toFixed(2)}*`;
    msg += `\n💳 Pagamento: ${customerInfo.payment}`;

    const phone = (config.social?.whatsapp || config.phone || '5511999999999').replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;

    setCart([]);
    setCartOpen(false);
    setShowCheckout(false);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg('');

    // Try opening WhatsApp
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch {
      // Fallback
    }

    // Show fallback link
    setWhatsappFallback(url);
    setTimeout(() => setWhatsappFallback(''), 30000);

    showToast('✅ Pedido enviado! Acompanhe pelo ícone de status.');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] bg-cyan-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-xl shadow-cyan-500/30 font-bold text-sm animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* WhatsApp Fallback */}
      {whatsappFallback && (
        <div className="fixed top-20 left-4 right-4 z-[998] bg-green-600/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Não abriu o WhatsApp?</span>
          <a href={whatsappFallback} target="_blank" rel="noopener noreferrer"
            className="bg-white text-green-700 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors whitespace-nowrap">
            Abrir WhatsApp Manualmente
          </a>
          <button onClick={() => setWhatsappFallback('')} className="text-white/70 hover:text-white text-xl ml-1">✕</button>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-cyan-900/20 px-3 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors" title="Cardápio">
              📋
            </button>
            <button className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors" title="Música">
              🎵
            </button>
            <button onClick={() => setCartOpen(true)} className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors relative" title="Carrinho">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
            <button onClick={() => setStatusOpen(true)} className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors" title="Status do Pedido">
              📦
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Announcement Banner */}
      {config.announcements?.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-600/20 via-purple-600/20 to-pink-600/20 border-b border-cyan-800/20 py-2 text-center">
          <p className="text-sm font-medium text-cyan-300 animate-pulse">{config.announcements[currentAnnouncement]}</p>
        </div>
      )}

      {/* Hero */}
      <section className="relative py-10 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />
        <img
          src={config.logo}
          alt="Logo"
          className="w-48 h-48 mx-auto mb-4 object-contain drop-shadow-2xl animate-[logoFloatSwing_6s_ease-in-out_infinite]"
          style={{ border: 'none', filter: 'drop-shadow(0 0 30px rgba(0,255,255,0.2))' }}
        />
        <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">{config.title}</h1>
        <p className="text-gray-400 text-sm">{config.subtitle}</p>
        <div className="mt-3 flex justify-center gap-3">
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">🟢 Aberto</span>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">Min. R${config.minOrder.toFixed(2)}</span>
        </div>
      </section>

      {/* Categories */}
      <div className="sticky top-12 z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50 py-2 overflow-x-auto">
        <div className="flex gap-2 px-3 max-w-6xl mx-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20 border border-cyan-500/30'
                : 'bg-gray-800/60 text-gray-400 hover:text-white border border-gray-700/30'}`}>
              {categoryEmojis[cat] || '📦'} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <main className="max-w-6xl mx-auto px-3 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id}
              onClick={() => openProduct(product)}
              className={`relative rounded-2xl border transition-all duration-300 cursor-pointer group overflow-hidden
                ${product.active
                  ? 'bg-gray-900/60 border-gray-700/30 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10'
                  : 'bg-gray-900/30 border-gray-800/20 opacity-50 cursor-not-allowed'}`}>
              {/* Image */}
              <div className="relative h-40 bg-gray-800/50 flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{categoryEmojis[product.category] || '🍽️'}</span>
                )}
                {!product.active && (
                  <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                    <span className="text-red-500 font-black text-lg tracking-wider border-2 border-red-500 px-4 py-1 rounded-lg">EM FALTA!</span>
                  </div>
                )}
                {/* Type badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {product.type === 'halfhalf' && <span className="bg-purple-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🍕 Meio a Meio</span>}
                  {product.type === 'special' && <span className="bg-amber-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🥟 Especial</span>}
                </div>
                {/* Favorite */}
                <button onClick={(e) => { e.stopPropagation(); toggleFav(product.id); }}
                  className="absolute top-2 right-2 text-xl drop-shadow-lg hover:scale-125 transition-transform">
                  {favorites.includes(product.id) ? '❤️' : '🤍'}
                </button>
              </div>
              {/* Info */}
              <div className="p-3">
                <h3 className="font-bold text-white text-sm mb-1">{product.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-black text-lg">R$ {product.price.toFixed(2)}</span>
                  {product.active && (
                    <button onClick={(e) => { e.stopPropagation(); openProduct(product); }}
                      className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-cyan-500/30 transition-colors border border-cyan-500/30">
                      {product.type === 'simple' ? '+ Adicionar' : 'Personalizar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">{config.aboutTitle}</h2>
        <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">{config.aboutText}</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6 px-4 text-center">
        <p className="text-gray-600 text-xs">{config.footerText}</p>
        <div className="flex justify-center gap-4 mt-3">
          {config.social?.whatsapp && <a href={`https://wa.me/${config.social.whatsapp}`} target="_blank" className="text-green-500 hover:text-green-400 text-lg">📱</a>}
          {config.social?.instagram && <a href={config.social.instagram} target="_blank" className="text-pink-500 hover:text-pink-400 text-lg">📷</a>}
          {config.social?.facebook && <a href={config.social.facebook} target="_blank" className="text-blue-500 hover:text-blue-400 text-lg">👤</a>}
        </div>
      </footer>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setCartOpen(false); setShowCheckout(false); }} />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-700/50 overflow-y-auto">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/30 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-cyan-400">🛒 Carrinho ({cartCount})</h2>
              <button onClick={() => { setCartOpen(false); setShowCheckout(false); }} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {!showCheckout ? (
              <div className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p className="text-4xl mb-3">🛒</p>
                    <p>Seu carrinho está vazio</p>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-white flex-1 mr-2">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-sm hover:text-red-300">✕</button>
                        </div>
                        {item.observation && <p className="text-xs text-gray-500 mb-1">📝 {item.observation}</p>}
                        {item.addons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.addons.map((a, i) => (
                              <span key={i} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">+ {a.name}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600">-</button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600">+</button>
                          </div>
                          <span className="text-cyan-400 font-bold text-sm">R$ {(item.total * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Coupon */}
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                      <label className="text-xs text-gray-400 mb-1 block">🎫 Tem cupom de desconto?</label>
                      <div className="flex gap-2">
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Digite o código"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500 outline-none" />
                        <button onClick={applyCoupon} className="bg-purple-500/30 text-purple-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-500/40 transition-colors">Aplicar</button>
                      </div>
                      {couponMsg && <p className="text-xs mt-1 text-gray-400">{couponMsg}</p>}
                      {appliedCoupon && (
                        <p className="text-xs text-green-400 mt-1">✅ {appliedCoupon.code} aplicado!</p>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 space-y-1">
                      <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm text-gray-400"><span>Taxa de entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-400"><span>🎫 Desconto</span><span>-R$ {couponDiscount.toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between font-black text-lg text-white border-t border-gray-700/50 pt-2 mt-1">
                        <span>Total</span>
                        <span className="text-cyan-400">R$ {finalTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button onClick={() => {
                      if (cartTotal < config.minOrder) { showToast(`Mínimo R$${config.minOrder.toFixed(2)}`); return; }
                      setShowCheckout(true);
                    }} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl font-bold text-sm hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg shadow-cyan-500/20">
                      Finalizar Pedido
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Checkout Form */
              <div className="p-4 space-y-4">
                <h3 className="text-base font-bold text-white">📋 Dados para Entrega</h3>
                <input value={customerInfo.name} onChange={e => setCustomerInfo((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none" />
                <input value={customerInfo.phone} onChange={e => setCustomerInfo((prev: any) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefone (com DDD)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none" />
                <input value={customerInfo.address} onChange={e => setCustomerInfo((prev: any) => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none" />
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Forma de Pagamento</label>
                  <select value={customerInfo.payment} onChange={e => setCustomerInfo((prev: any) => ({ ...prev, payment: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                  </select>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex justify-between font-black text-lg text-white">
                    <span>Total</span>
                    <span className="text-cyan-400">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowCheckout(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-600 transition-colors">
                    ← Voltar
                  </button>
                  <button onClick={sendWhatsApp} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-500/20">
                    📲 Enviar WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setStatusOpen(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-700/50 max-w-sm w-full p-5">
            <button onClick={() => setStatusOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg">✕</button>
            <h3 className="text-lg font-black text-cyan-400 mb-4">📦 Status do Pedido</h3>
            {lastOrderId ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Pedido: <span className="text-white font-bold">{lastOrderId}</span></p>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 space-y-2">
                  {['Novo', 'Em Produção', 'Pronto', 'Saiu para Entrega', 'Entregue'].map((status, i) => {
                    const statuses = ['Novo', 'Em Produção', 'Pronto', 'Saiu para Entrega', 'Entregue'];
                    const currentIdx = statuses.indexOf(_orderStatus || 'Novo');
                    const done = i <= currentIdx;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm ${done ? 'text-white font-bold' : 'text-gray-600'}`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 text-center">Atualize a página para verificar mudanças de status.</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">Nenhum pedido ativo encontrado.</p>
            )}
          </div>
        </div>
      )}

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          addons={addons.filter(a => selectedProduct.addons.includes(a.id))}
          onAdd={(opts) => { addToCart(selectedProduct, opts); setSelectedProduct(null); }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

// ==================== PRODUCT CUSTOMIZATION MODAL ====================
function ProductCustomizationModal({ product, addons, onAdd, onClose }: {
  product: Product; addons: Addon[]; onAdd: (opts: any) => void; onClose: () => void;
}) {
  const [flavor1, setFlavor1] = useState(product.flavors?.[0] || '');
  const [flavor2, setFlavor2] = useState(product.flavors?.[1] || '');
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [observation, setObservation] = useState('');

  const addonsTotal = selectedAddons.reduce((sum, aid) => {
    const a = addons.find(x => x.id === aid);
    return sum + (a?.price || 0);
  }, 0);

  const total = product.price + addonsTotal;

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const toggleFlavor = (f: string) => {
    const max = product.maxFlavors || 3;
    setSelectedFlavors(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      if (prev.length >= max) return prev;
      return [...prev, f];
    });
  };

  const canSubmit = () => {
    if (product.type === 'halfhalf') return flavor1 && flavor2 && flavor1 !== flavor2;
    if (product.type === 'special') return selectedFlavors.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/30 p-4 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-white">{product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 space-y-5">
          {/* Half-Half */}
          {product.type === 'halfhalf' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-bold">🟦 1ª Metade</label>
                <select value={flavor1} onChange={e => setFlavor1(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500">
                  {product.flavors?.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-bold">🟥 2ª Metade</label>
                <select value={flavor2} onChange={e => setFlavor2(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500">
                  {product.flavors?.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="flex rounded-xl overflow-hidden h-20">
                  <div className="flex-1 bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs border-r border-gray-700">
                    {flavor1 || 'Selecione'}
                  </div>
                  <div className="flex-1 bg-red-500/20 flex items-center justify-center text-red-300 font-bold text-xs">
                    {flavor2 || 'Selecione'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special (multi-flavor) */}
          {product.type === 'special' && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-bold">
                🥟 Escolha até {product.maxFlavors} sabores ({selectedFlavors.length}/{product.maxFlavors})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.flavors?.map(f => (
                  <button key={f} onClick={() => toggleFlavor(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${selectedFlavors.includes(f)
                      ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/30 hover:border-gray-600'}`}>
                    {selectedFlavors.includes(f) ? '☑' : '☐'} {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {addons.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-bold">➕ Adicionais</label>
              <div className="space-y-2">
                {addons.map(a => (
                  <button key={a.id} onClick={() => toggleAddon(a.id)}
                    disabled={!a.active}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border ${!a.active
                      ? 'opacity-30 cursor-not-allowed bg-gray-800/20 border-gray-800/20 line-through'
                      : selectedAddons.includes(a.id)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-gray-800/40 text-gray-300 border-gray-700/30 hover:border-gray-600'}`}>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs font-bold text-green-400">+ R${a.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Observation */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block font-bold">📝 Observações</label>
            <textarea value={observation} onChange={e => setObservation(e.target.value)}
              placeholder="Ex: Sem cebola, ponto da carne..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500 outline-none resize-none h-20" />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Total:</span>
            <span className="text-xl font-black text-cyan-400">R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={() => {
            if (!canSubmit()) return;
            onAdd({
              flavor1, flavor2, selectedFlavors,
              addons: selectedAddons,
              observation,
            });
          }}
            disabled={!canSubmit()}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg shadow-cyan-500/20">
            Adicionar ao Carrinho — R$ {total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== ADMIN PAGE ====================
function AdminPage({ products, setProducts, addons, setAddons, coupons, setCoupons, config: _config }: {
  products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addons: Addon[]; setAddons: React.Dispatch<React.SetStateAction<Addon[]>>;
  coupons: Coupon[]; setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  config: any;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders] = useState<Order[]>(loadOrders());
  const [config, setConfig] = useState(_config);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos');
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700/50 p-6 space-y-4">
          <img src={config.logo} alt="Logo" className="w-24 h-24 mx-auto object-contain mb-2" style={{ border: 'none' }} />
          <h2 className="text-xl font-black text-center text-cyan-400">Painel Admin</h2>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" type="password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none" />
          {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
          <button onClick={handleLogin} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl font-bold text-sm hover:from-cyan-400 hover:to-purple-400 transition-all">
            Entrar
          </button>
          <p className="text-gray-600 text-[10px] text-center">admin / admin123</p>
        </div>
      </div>
    );
  }

  const saveProduct = (product: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      let updated: Product[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = product;
      } else {
        updated = [...prev, product];
      }
      saveProducts(updated);
      return updated;
    });
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
  };

  const toggleProductActive = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setProducts(updated);
    saveProducts(updated);
  };

  const saveAddon = (addon: Addon) => {
    setAddons(prev => {
      const idx = prev.findIndex(a => a.id === addon.id);
      let updated: Addon[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = addon;
      } else {
        updated = [...prev, { ...addon, id: `a${Date.now()}` }];
      }
      saveAddons(updated);
      return updated;
    });
    setEditingAddon(null);
  };

  const deleteAddon = (id: string) => {
    const updated = addons.filter(a => a.id !== id);
    setAddons(updated);
    saveAddons(updated);
  };

  const toggleAddonActive = (id: string) => {
    const updated = addons.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAddons(updated);
    saveAddons(updated);
  };

  const saveCouponFn = (coupon: Coupon) => {
    setCoupons(prev => {
      const idx = prev.findIndex(c => c.code === coupon.code);
      let updated: Coupon[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = coupon;
      } else {
        updated = [...prev, coupon];
      }
      saveCoupons(updated);
      return updated;
    });
    setEditingCoupon(null);
  };

  const deleteCoupon = (code: string) => {
    const updated = coupons.filter(c => c.code !== code);
    setCoupons(updated);
    saveCoupons(updated);
  };

  const saveConfigFn = () => {
    saveConfig(config);
    alert('Configurações salvas!');
  };

  const resetProducts = () => {
    if (!confirm('Resetar todos os produtos para o padrão?')) return;
    setProducts(defaultProducts);
    saveProducts(defaultProducts);
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.active).length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/30 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">⚙️ Painel Admin</h1>
        <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">Sair</button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 bg-gray-900/50 border-b border-gray-800/50 overflow-x-auto">
        {[
          { id: 'dashboard', label: '�� Dashboard' },
          { id: 'products', label: '🍔 Produtos' },
          { id: 'addons', label: '➕ Adicionais' },
          { id: 'coupons', label: '🎫 Cupons' },
          { id: 'orders', label: '📦 Pedidos' },
          { id: 'settings', label: '⚙️ Config' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-500 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500">Produtos</p>
                <p className="text-2xl font-black text-cyan-400">{stats.activeProducts}/{stats.totalProducts}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500">Pedidos</p>
                <p className="text-2xl font-black text-purple-400">{stats.totalOrders}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500">Faturamento</p>
                <p className="text-2xl font-black text-green-400">R${stats.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500">Cupons</p>
                <p className="text-2xl font-black text-amber-400">{coupons.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Produtos ({products.length})</h2>
              <div className="flex gap-2">
                <button onClick={resetProducts} className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20">Resetar Padrão</button>
                <button onClick={() => setEditingProduct({
                  id: `p${Date.now()}`, name: '', description: '', price: 0, category: 'Hambúrgueres',
                  type: 'simple', images: [], addons: [], active: true,
                })} className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 font-bold">+ Novo Produto</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(p => (
                <div key={p.id} className={`bg-gray-900/60 rounded-xl border p-3 ${p.active ? 'border-gray-700/30' : 'border-gray-800/20 opacity-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{p.name || 'Sem nome'}</h3>
                      <span className="text-[10px] text-gray-500">{p.category} • {p.type === 'simple' ? 'Simples' : p.type === 'halfhalf' ? 'Meio a Meio' : 'Especial'}</span>
                    </div>
                    <span className="text-cyan-400 font-black text-sm">R${p.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => toggleProductActive(p.id)} className={`text-[10px] px-2 py-1 rounded font-bold ${p.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.active ? 'Ativo' : 'Pausado'}
                    </button>
                    <button onClick={() => setEditingProduct(p)} className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-bold">Editar</button>
                    <button onClick={() => deleteProduct(p.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 font-bold">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Addons */}
        {activeTab === 'addons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Adicionais ({addons.length})</h2>
              <button onClick={() => setEditingAddon({ id: '', name: '', price: 0, category: 'pizzas', active: true })} className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg font-bold">+ Novo Adicional</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {addons.map(a => (
                <div key={a.id} className={`bg-gray-900/60 rounded-lg border p-3 flex items-center justify-between ${a.active ? 'border-gray-700/30' : 'border-gray-800/20 opacity-40'}`}>
                  <div>
                    <span className={`text-sm font-medium ${a.active ? 'text-white' : 'line-through text-gray-600'}`}>{a.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({a.category})</span>
                    <span className="text-xs text-green-400 ml-1">+R${a.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleAddonActive(a.id)} className={`text-[10px] px-2 py-0.5 rounded font-bold ${a.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {a.active ? '✓' : '✕'}
                    </button>
                    <button onClick={() => setEditingAddon(a)} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">Editar</button>
                    <button onClick={() => deleteAddon(a.id)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupons */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">🎫 Cupons ({coupons.length})</h2>
              <button onClick={() => setEditingCoupon({ code: '', type: 'percent', value: 0, maxUses: 10, usedCount: 0, minPurchase: 0, validUntil: '2025-12-31', active: true })} className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg font-bold">+ Novo Cupom</button>
            </div>
            <div className="space-y-2">
              {coupons.map(c => (
                <div key={c.code} className={`bg-gray-900/60 rounded-lg border p-3 ${c.active ? 'border-gray-700/30' : 'border-gray-800/20 opacity-40'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded">{c.code}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {c.type === 'percent' ? `${c.value}% OFF` : c.type === 'fixed' ? `R$${c.value.toFixed(2)} OFF` : 'Frete Grátis'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">Min: R${c.minPurchase.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[10px] text-gray-500">{c.usedCount}/{c.maxUses}</span>
                      <button onClick={() => setEditingCoupon(c)} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">Editar</button>
                      <button onClick={() => deleteCoupon(c.code)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">📦 Pedidos ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-10">Nenhum pedido ainda.</p>
            ) : (
              [...orders].reverse().map(o => (
                <div key={o.id} className="bg-gray-900/60 rounded-xl border border-gray-700/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400">{o.id}</span>
                    <span className="text-xs text-gray-500">{new Date(o.date).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-white">{o.customer.name} • {o.customer.phone}</p>
                  <p className="text-xs text-gray-500">{o.items.length} itens • <span className="text-green-400 font-bold">R${o.total.toFixed(2)}</span></p>
                  <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">{o.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">⚙️ Configurações</h2>
            <div className="bg-gray-900/60 rounded-xl border border-gray-700/30 p-4 space-y-3">
              <h3 className="text-sm font-bold text-cyan-400">Dados da Loja</h3>
              <input value={config.storeName} onChange={e => setConfig({ ...config, storeName: e.target.value })} placeholder="Nome da Loja" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} placeholder="Título do Site" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <input value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} placeholder="Slogan" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <input value={config.phone} onChange={e => setConfig({ ...config, phone: e.target.value })} placeholder="Telefone" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <input value={config.address} onChange={e => setConfig({ ...config, address: e.target.value })} placeholder="Endereço" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={config.deliveryFee} onChange={e => setConfig({ ...config, deliveryFee: parseFloat(e.target.value) || 0 })} placeholder="Taxa Entrega" type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
                <input value={config.minOrder} onChange={e => setConfig({ ...config, minOrder: parseFloat(e.target.value) || 0 })} placeholder="Pedido Mínimo" type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              </div>
              <input value={config.social?.whatsapp || ''} onChange={e => setConfig({ ...config, social: { ...config.social, whatsapp: e.target.value } })} placeholder="WhatsApp (número)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <input value={config.logo} onChange={e => setConfig({ ...config, logo: e.target.value })} placeholder="URL da Logo" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <textarea value={config.aboutText} onChange={e => setConfig({ ...config, aboutText: e.target.value })} placeholder="Texto Sobre Nós" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none resize-none h-20" />
              <input value={config.footerText} onChange={e => setConfig({ ...config, footerText: e.target.value })} placeholder="Texto do Rodapé" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
              <button onClick={saveConfigFn} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-bold text-sm">💾 Salvar Configurações</button>
            </div>

            {/* Hours */}
            <div className="bg-gray-900/60 rounded-xl border border-gray-700/30 p-4 space-y-3">
              <h3 className="text-sm font-bold text-amber-400">⏰ Horário de Funcionamento</h3>
              {config.hours.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20">{h.day}</span>
                  <button onClick={() => { const hours = [...config.hours]; hours[i].closed = !hours[i].closed; setConfig({ ...config, hours }); }}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${h.closed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {h.closed ? 'Fechado' : 'Aberto'}
                  </button>
                  {!h.closed && (
                    <div className="flex items-center gap-1">
                      <input value={h.open} onChange={e => { const hours = [...config.hours]; hours[i].open = e.target.value; setConfig({ ...config, hours }); }}
                        className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white text-center" />
                      <span className="text-gray-600">até</span>
                      <input value={h.close} onChange={e => { const hours = [...config.hours]; hours[i].close = e.target.value; setConfig({ ...config, hours }); }}
                        className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white text-center" />
                    </div>
                  )}
                </div>
              ))}
              <button onClick={saveConfigFn} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-bold text-sm">💾 Salvar Horários</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductEditor product={editingProduct} onSave={saveProduct} onClose={() => setEditingProduct(null)} allCategories={[...new Set(products.map(p => p.category))]} />
      )}

      {/* Edit Addon Modal */}
      {editingAddon && (
        <AddonEditor addon={editingAddon} onSave={saveAddon} onClose={() => setEditingAddon(null)} />
      )}

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <CouponEditor coupon={editingCoupon} onSave={saveCouponFn} onClose={() => setEditingCoupon(null)} />
      )}
    </div>
  );
}

// ==================== PRODUCT EDITOR ====================
function ProductEditor({ product, onSave, onClose, allCategories }: {
  product: Product; onSave: (p: Product) => void; onClose: () => void; allCategories: string[];
}) {
  const [form, setForm] = useState<Product>({ ...product });
  const [newCat, setNewCat] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSave = () => {
    if (!form.name || form.price <= 0) { alert('Preencha nome e preço!'); return; }
    onSave(form);
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setForm({ ...form, images: [...(form.images || []), imageUrl.trim()] });
      setImageUrl('');
    }
  };

  const removeImage = (idx: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const toggleAddon = (id: string) => {
    setForm({ ...form, addons: form.addons.includes(id) ? form.addons.filter(a => a !== id) : [...form.addons, id] });
  };

  const categories = [...new Set([...allCategories])];

  const [addons] = useState<Addon[]>(loadAddons());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/30 p-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">✏️ {product.name ? 'Editar' : 'Novo'} Produto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nome *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none resize-none h-16" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preço (R$) *</label>
              <input value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} type="number" step="0.5"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none">
                <option value="simple">Simples</option>
                <option value="halfhalf">Meio a Meio (Pizza)</option>
                <option value="special">Especial (Pastel)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none mb-1">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nova categoria"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none" />
              <button onClick={() => { if (newCat.trim()) { setForm({ ...form, category: newCat.trim() }); setNewCat(''); } }}
                className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1.5 rounded font-bold">+ Add</button>
            </div>
          </div>

          {/* Half-half flavors */}
          {form.type === 'halfhalf' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sabores (separados por vírgula)</label>
              <input value={form.flavors?.join(', ') || ''} onChange={e => setForm({ ...form, flavors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
          )}

          {/* Special flavors */}
          {form.type === 'special' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sabores (separados por vírgula)</label>
              <input value={form.flavors?.join(', ') || ''} onChange={e => setForm({ ...form, flavors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none mb-1" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Máx. sabores</label>
                  <input value={form.maxFlavors || 3} onChange={e => setForm({ ...form, maxFlavors: parseInt(e.target.value) || 3 })} type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">🖼️ Imagens</label>
            <div className="flex gap-1 mb-2">
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL da imagem"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none" />
              <button onClick={addImage} className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1.5 rounded font-bold">+ Add</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(form.images || []).map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700/30">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500/80 text-white text-[8px] w-4 h-4 flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Addons for this product */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">➕ Adicionais disponíveis</label>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {addons.map(a => (
                <button key={a.id} onClick={() => toggleAddon(a.id)}
                  className={`text-[10px] px-2 py-1 rounded text-left transition-all ${form.addons.includes(a.id) ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-gray-800/40 text-gray-500 border border-gray-700/20'}`}>
                  {form.addons.includes(a.id) ? '☑' : '☐'} {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/30 p-4 flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-700 text-white py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
          <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2.5 rounded-xl font-bold text-sm">💾 Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== ADDON EDITOR ====================
function AddonEditor({ addon, onSave, onClose }: {
  addon: Addon; onSave: (a: Addon) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...addon });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700/50 max-w-sm w-full p-4 space-y-3">
        <h3 className="text-base font-bold text-white">✏️ Adicional</h3>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} placeholder="Preço" type="number" step="0.5"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none">
            <option value="pizzas">Pizzas</option>
            <option value="pastels">Pastéis</option>
            <option value="burgers">Hambúrgueres</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-700 text-white py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2.5 rounded-xl font-bold text-sm">💾 Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== COUPON EDITOR ====================
function CouponEditor({ coupon, onSave, onClose }: {
  coupon: Coupon; onSave: (c: Coupon) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...coupon });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700/50 max-w-sm w-full p-4 space-y-3">
        <h3 className="text-base font-bold text-white">🎫 Cupom</h3>
        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Código (ex: NATAL10)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none font-bold tracking-wider" />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none">
          <option value="percent">Porcentagem (%)</option>
          <option value="fixed">Valor Fixo (R$)</option>
          <option value="frete">Frete Grátis</option>
        </select>
        {form.type !== 'frete' && (
          <input value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} placeholder={form.type === 'percent' ? 'Porcentagem (ex: 10)' : 'Valor (ex: 5.00)'} type="number" step="0.5"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
        )}
        <div className="grid grid-cols-2 gap-2">
          <input value={form.maxUses} onChange={e => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} placeholder="Máx. usos" type="number"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
          <input value={form.minPurchase} onChange={e => setForm({ ...form, minPurchase: parseFloat(e.target.value) || 0 })} placeholder="Compra mín. R$" type="number" step="0.5"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">Validade</label>
          <input value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} type="date"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-700 text-white py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-bold text-sm">💾 Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== PDV PAGE ====================
function PDVPage({ orders, setOrders }: {
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}) {

  const updateStatus = (orderId: string, status: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    saveOrders(updated);
  };

  const statusColors: Record<string, string> = {
    'Novo': 'bg-blue-500/20 text-blue-400',
    'Em Produção': 'bg-amber-500/20 text-amber-400',
    'Pronto': 'bg-green-500/20 text-green-400',
    'Saiu para Entrega': 'bg-purple-500/20 text-purple-400',
    'Entregue': 'bg-cyan-500/20 text-cyan-400',
    'Pago': 'bg-gray-500/20 text-gray-400',
  };

  const statusFlow = ['Novo', 'Em Produção', 'Pronto', 'Saiu para Entrega', 'Entregue', 'Pago'];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/30 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">🖥️ PDV - Caixa</h1>
        <span className="text-xs text-gray-500">{orders.length} pedidos</span>
      </header>

      <div className="max-w-5xl mx-auto p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🖥️</p>
            <p className="text-lg font-bold">Nenhum pedido ainda</p>
            <p className="text-sm">Pedidos feitos pelo cardápio aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...orders].reverse().map(order => (
              <div key={order.id} className="bg-gray-900/60 rounded-xl border border-gray-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold text-cyan-400">{order.id}</span>
                    <span className={`text-xs ml-2 px-2 py-0.5 rounded-full font-bold ${statusColors[order.status] || 'bg-gray-700 text-gray-400'}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-sm text-white mb-1">{order.customer.name} • {order.customer.phone}</p>
                <p className="text-xs text-gray-500 mb-3">{order.customer.address}</p>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="text-xs text-gray-300 flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-gray-500">R${(item.total * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-700/30 pt-2 mb-3">
                  <span className="text-xs text-gray-400">Total: <span className="text-green-400 font-bold text-base">R${order.total.toFixed(2)}</span></span>
                  <span className="text-xs text-gray-500">{order.customer.payment}</span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {statusFlow.map(status => {
                    if (order.status === 'Pago') return null;
                    const isNext = statusFlow.indexOf(status) === statusFlow.indexOf(order.status) + 1;
                    return (
                      <button key={status} onClick={() => updateStatus(order.id, status)}
                        className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${isNext
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/40'
                          : 'bg-gray-800/50 text-gray-500 border border-gray-700/20'}`}>
                        → {status}
                      </button>
                    );
                  })}
                  {order.status !== 'Pago' && (
                    <button onClick={() => updateStatus(order.id, 'Pago')}
                      className="text-[10px] px-2 py-1 rounded font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                      💰 Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
