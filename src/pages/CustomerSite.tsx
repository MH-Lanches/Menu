import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Search, MapPin, Clock, Star, ChevronRight, Menu, X, Phone, Instagram, Facebook, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { cn, formatCurrency } from '../lib/utils';

export default function CustomerSite({ config }: { config: any }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [orderId, setOrderId] = useState<string | null>(localStorage.getItem('latestOrderId'));
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  useEffect(() => {
    // Load local storage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    const qCats = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qProducts = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCats();
      unsubscribeProducts();
    };
  }, []);

  // Real-time Order Listener
  useEffect(() => {
    if (!orderId) {
      setCurrentOrder(null);
      return;
    }

    // Listener for orders
    const unsubOrder = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentOrder({ id: snapshot.id, ...snapshot.data() });
      } else {
        // If it disappears from orders, it might be in canceled or history
        onSnapshot(doc(db, 'canceled', orderId), (snapC) => {
          if (snapC.exists()) setCurrentOrder({ id: snapC.id, ...snapC.data(), status: 'cancelado' });
          else {
            onSnapshot(doc(db, 'history', orderId), (snapH) => {
              if (snapH.exists()) setCurrentOrder({ id: snapH.id, ...snapH.data(), status: 'entregue' });
            });
          }
        });
      }
    });

    return () => unsubOrder();
  }, [orderId]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    const orderData = {
      items: cart,
      total: cartTotal + (config?.deliveryFee || 0),
      status: 'novo',
      createdAt: serverTimestamp(),
      customerName: 'Cliente via Web',
      type: 'delivery',
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);
      localStorage.setItem('latestOrderId', docRef.id);
      setIsTrackerOpen(true);
      
      const message = `*NOVO PEDIDO: MH LANCHES*%0A%0A` + 
        `Cod: #${docRef.id.slice(-4)}%0A` +
        `--------------------%0A` +
        cart.map(i => `${i.quantity}x ${i.name} - ${formatCurrency(i.price * i.quantity)}`).join('%0A') +
        `%0A--------------------%0A` +
        `*Total:* ${formatCurrency(orderData.total)}%0A%0A` +
        `Acompanhe seu pedido em: ${window.location.origin}`;
      
      window.open(`https://wa.me/${config?.phone?.replace(/\D/g, '')}?text=${message}`);
      
      setCart([]);
      setIsCartOpen(false);
    } catch (e) {
      console.error("Erro ao criar pedido:", e);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory || (activeCategory === 'favs' && favorites.includes(p.id));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-bg-base text-text-main selection:bg-brand-primary/40 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-border-dim">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.5)] border-2 border-brand-secondary">MH</div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight uppercase tracking-tight">{config?.name || 'MH LANCHES'}</h1>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={config?.isOpen ? "status-badge-open" : "status-badge-closed"}>
                  {config?.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-dim" />
            <input 
              type="text" 
              placeholder="Buscar no cardápio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {orderId && (
              <button 
                onClick={() => setIsTrackerOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/20 transition-all"
              >
                <Clock size={14} /> Status do Pedido
              </button>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-surface rounded-full hover:bg-border-dim transition-colors group"
            >
              <ShoppingCart className="h-6 w-6 group-hover:text-brand-secondary transition-colors" />
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-primary text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-bg-base"
                  >
                    {cart.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-12 rounded-3xl overflow-hidden aspect-[21/9] group border border-border-dim">
          <img 
            src={config?.heroUrl || "https://picsum.photos/seed/mhl_hero/1920/1080"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent flex flex-col justify-end p-8">
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-brand-secondary font-bold tracking-widest uppercase text-sm mb-2"
            >
              Mais que uma lanchonete!
            </motion.p>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 text-white"
            >
              Sabor que Supera <br /> Expectativas
            </motion.h2>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-brand-primary text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 w-fit shadow-xl"
            >
              Ver Menu <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="sticky top-16 z-40 bg-bg-base/95 backdrop-blur py-4 mb-8 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-3">
          <button 
            onClick={() => setActiveCategory('all')}
            className={cn("cat-pill", activeCategory === 'all' && "active")}
          >
            🔥 Todos
          </button>
          <button 
            onClick={() => setActiveCategory('favs')}
            className={cn("cat-pill", activeCategory === 'favs' && "active bg-danger-base border-danger-base")}
          >
            <Heart className={cn("h-4 w-4", activeCategory === 'favs' && "fill-current")} /> Meus Favoritos ({favorites.length})
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn("cat-pill", activeCategory === cat.id && "active")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product.id}
                className="p-card"
              >
                <div className="aspect-square relative overflow-hidden bg-bg-base/50">
                  <img 
                    src={product.images?.[0] || 'https://picsum.photos/seed/pdt/400/400'} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                      onClick={() => toggleFavorite(product.id)}
                      className={cn(
                        "p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg border",
                        favorites.includes(product.id) ? "bg-danger-base border-danger-base text-white" : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", favorites.includes(product.id) && "fill-current")} />
                    </button>
                  </div>
                  {product.isPromotion && (
                    <div className="absolute top-4 left-0 bg-danger-base text-white px-3 py-1 text-[10px] font-black uppercase rounded-r-lg shadow-lg">
                      🔥 Promoção
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute bottom-4 left-4 bg-brand-secondary text-black px-3 py-1 text-[10px] font-black uppercase rounded-lg shadow-lg">
                      ⭐ Destaque
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                      {categories.find(c => c.id === product.categoryId)?.name}
                    </span>
                    <div className="flex items-center gap-1 text-text-dim text-xs">
                      <Star className="h-3 w-3 fill-brand-secondary text-brand-secondary" />
                      4.9
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-brand-secondary transition-colors uppercase tracking-tight">{product.name}</h3>
                  <p className="text-text-dim text-xs line-clamp-2 mb-4 leading-relaxed">{product.description || 'Sabor inigualável preparado com ingredientes selecionados.'}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xl font-black text-brand-secondary">{formatCurrency(product.price)}</div>
                    <button 
                      onClick={() => addToCart(product)}
                      className={cn(
                        "bg-brand-primary hover:bg-brand-primary/80 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95",
                        product.isPaused && "opacity-50 cursor-not-allowed grayscale"
                      )}
                      disabled={product.isPaused}
                    >
                      {product.isPaused ? 'Indisponível' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border-dim z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-dim flex items-center justify-between bg-bg-base/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold italic uppercase tracking-tighter">Seu Carrinho</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-bg-base rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <ShoppingCart className="h-16 w-16 mb-4 text-text-dim" />
                    <p className="text-lg uppercase font-bold tracking-tighter italic">Seu carrinho está vazio</p>
                    <p className="text-xs text-text-dim">Escolha algo saboroso no menu</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-bg-base/40 border border-border-dim/50">
                      <img 
                        src={item.images?.[0] || 'https://picsum.photos/seed/cart/100/100'} 
                        className="w-20 h-20 rounded-xl object-cover border border-border-dim"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-sm uppercase tracking-tight">{item.name}</h4>
                          <span className="font-black text-brand-secondary text-sm">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center bg-surface border border-border-dim rounded-lg overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-3 py-1 hover:bg-border-dim transition-colors"
                            >-</button>
                            <span className="px-2 text-xs font-bold w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-3 py-1 hover:bg-border-dim transition-colors"
                            >+</button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-[10px] font-bold text-danger-base hover:text-red-400 uppercase tracking-widest transition-colors"
                          >Remover</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-bg-base border-t border-border-dim shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-text-dim text-sm">
                      <span className="uppercase tracking-widest font-semibold">Subtotal</span>
                      <span className="font-mono">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-text-dim text-sm">
                      <span className="uppercase tracking-widest font-semibold">Taxa Entrega</span>
                      <span className="text-success-base font-bold font-mono">{formatCurrency(config?.deliveryFee || 0)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black italic pt-2 border-t border-border-dim mt-4">
                      <span className="uppercase">Total</span>
                      <span className="text-brand-secondary">{formatCurrency(cartTotal + (config?.deliveryFee || 0))}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase italic tracking-wider"
                  >
                    Confirmar & Enviar WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTrackerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-surface border border-border-dim rounded-[32px] overflow-hidden z-[70] shadow-2xl"
            >
              <div className="p-6 border-b border-border-dim flex justify-between items-center bg-bg-base/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Acompanhar Pedido</h3>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-[0.2em]">{currentOrder?.id ? `#${currentOrder.id.slice(-4)}` : 'Carregando...'}</p>
                  </div>
                </div>
                <button onClick={() => setIsTrackerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-text-dim"><X size={20}/></button>
              </div>

              <div className="p-8">
                {currentOrder ? (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-6 relative">
                      {/* Vertical Line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border-dim"></div>

                      <StatusStep 
                        icon={<CheckCircle size={16}/>} 
                        label="Novo Pedido" 
                        desc="Pedido recebido com sucesso" 
                        active={['novo', 'producao', 'pronto', 'entrega', 'entregue'].includes(currentOrder.status)}
                        current={currentOrder.status === 'novo'}
                      />
                      <StatusStep 
                        icon={<Clock size={16}/>} 
                        label="Em Produção" 
                        desc="Sendo preparado com carinho" 
                        active={['producao', 'pronto', 'entrega', 'entregue'].includes(currentOrder.status)}
                        current={currentOrder.status === 'producao'}
                      />
                      <StatusStep 
                        icon={<ShoppingBag size={16}/>} 
                        label="Pronto" 
                        desc="Pronto para entrega" 
                        active={['pronto', 'entrega', 'entregue'].includes(currentOrder.status)}
                        current={currentOrder.status === 'pronto'}
                      />
                      <StatusStep 
                        icon={<MapPin size={16}/>} 
                        label="Saiu p/ Entrega" 
                        desc="Em trânsito até você" 
                        active={['entrega', 'entregue'].includes(currentOrder.status)}
                        current={currentOrder.status === 'entrega'}
                      />
                      <StatusStep 
                        icon={<CheckCircle size={16}/>} 
                        label="Entregue" 
                        desc="Entregue ao cliente" 
                        active={currentOrder.status === 'entregue'}
                        current={currentOrder.status === 'entregue'}
                        isLast
                      />

                      {currentOrder.status === 'cancelado' && (
                        <div className="mt-4 p-4 bg-danger-base/10 border border-danger-base/30 rounded-2xl flex items-center gap-4 text-danger-base">
                           <XCircle size={24} />
                           <div>
                              <p className="font-black uppercase text-xs tracking-widest">Pedido Cancelado</p>
                              <p className="text-[10px] font-bold opacity-70 italic uppercase mt-1">Sinto muito! Entre em contato para mais detalhes.</p>
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => window.open(`https://wa.me/${config?.phone.replace(/\D/g, '')}`)}
                      className="w-full py-4 bg-success-base/10 border border-success-base/30 text-success-base hover:bg-success-base hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
                    >
                      <Phone size={14} /> Falar com Atendente
                    </button>
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center">
                    <Clock size={48} className="animate-pulse mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Sincronizando Status...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-border-dim bg-bg-base py-12 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-brand-primary">MH LANCHES <span className="text-white opacity-40 font-light">ERP</span></h2>
            <p className="text-text-dim max-w-sm mb-6 leading-relaxed">Referência em delivery profissional. Tecnologia e sabor unidos para proporcionar a melhor experiência gastronômica da sua região.</p>
            <div className="flex gap-4">
              <a href="#" className="p-2.5 bg-surface border border-border-dim rounded-xl hover:bg-brand-primary transition-all text-text-dim hover:text-white"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="p-2.5 bg-surface border border-border-dim rounded-xl hover:bg-brand-primary transition-all text-text-dim hover:text-white"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="p-2.5 bg-surface border border-border-dim rounded-xl hover:bg-brand-primary transition-all text-text-dim hover:text-white"><Phone className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-[0.2em] text-text-dim mb-6 py-1 border-b border-brand-primary/50 w-fit">Horários</h4>
            <ul className="space-y-3 text-sm text-text-main font-medium">
              <li className="flex justify-between"><span>Seg - Sex</span> <span className="text-brand-secondary">18:00 - 23:30</span></li>
              <li className="flex justify-between"><span>Sáb - Dom</span> <span className="text-brand-secondary">18:00 - 00:30</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-[0.2em] text-text-dim mb-6 py-1 border-b border-brand-primary/50 w-fit">Contato</h4>
            <ul className="space-y-4 text-sm text-text-main font-medium">
              <li className="flex gap-3 items-start"><MapPin className="h-5 w-5 shrink-0 text-brand-primary" /> {config?.address || 'Av. Principal, 123 - Centro'}</li>
              <li className="flex gap-3 items-start"><Phone className="h-5 w-5 shrink-0 text-brand-primary" /> {config?.phone || '(11) 99999-9999'}</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatusStep({ icon, label, desc, active, current, isLast }: { icon: any, label: string, desc: string, active?: boolean, current?: boolean, isLast?: boolean }) {
  return (
    <div className="flex gap-4 relative">
      <div className={cn(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-500",
        active ? "bg-brand-primary border-brand-primary text-white shadow-lg" : "bg-surface border-border-dim text-text-dim",
        current && "animate-pulse ring-4 ring-brand-primary/20 scale-110"
      )}>
        {active ? icon : <div className="w-2 h-2 bg-text-dim rounded-full"></div>}
      </div>
      <div className="flex-1 pb-2">
        <h4 className={cn("text-xs font-black uppercase tracking-widest transition-colors", active ? "text-white" : "text-text-dim")}>{label}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-tight transition-colors", active ? "text-text-dim" : "text-text-dim/40")}>{desc}</p>
      </div>
    </div>
  );
}
