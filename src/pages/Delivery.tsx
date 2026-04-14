import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, Category, SiteConfig, OrderItem, Order, Announcement } from "../types";
import { ShoppingCart, Utensils, Music, Search, X, Heart, Plus, Clock, Bike, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import { cn } from "../lib/utils";
import CartModal from "../components/CartModal";
import CheckoutModal from "../components/CheckoutModal";
import CustomizeModal from "../components/CustomizeModal";
import TrackingModal from "../components/TrackingModal";

export default function Delivery() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // Fetch Config
    onValue(ref(db, "config"), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.val());
    });

    // Fetch Announcements
    onValue(ref(db, "anuncios"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAnnouncements(Object.values(data).filter((a: any) => a.ativo));
      }
    });

    // Fetch Categories
    onValue(ref(db, "categorias"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const catList = Array.isArray(data) ? data : Object.values(data);
        setCategories(["Todos", ...catList.map(c => typeof c === 'string' ? c : c.nome)]);
      }
    });

    // Fetch Products
    onValue(ref(db, "produtos"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const prodList = Array.isArray(data) ? data : Object.values(data);
        setProducts(prodList);
      }
    });
    
    // Load last order and cart
    const savedCart = localStorage.getItem("mh_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
    
    const savedOrderId = localStorage.getItem("mh_last_order_id");
    if (savedOrderId) setLastOrderId(savedOrderId);

    // Load favorites
    const savedFavs = localStorage.getItem("mh_favorites");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    // Scroll listener for back to top
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem("mh_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleMusic = () => {
    const audio = document.getElementById("jingle-audio") as HTMLAudioElement;
    if (audio) {
      if (isPlaying) audio.pause();
      else audio.play();
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    localStorage.setItem("mh_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (announcements.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [announcements]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "Todos" || p.categoria === activeCategory;
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && !p.pausado;
  });

  const handleProductClick = (product: Product) => {
    if (product.tipo === 'pizza' || product.tipo === 'pastel' || product.adicionais?.length || product.opcionais?.length) {
      setSelectedProduct(product);
      setIsCustomizeOpen(true);
    } else {
      addToCartSimple(product);
    }
  };

  const addToCartSimple = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.produtoId === product.id && !item.adicionais?.length);
      if (existing) {
        return prev.map(item => 
          (item.produtoId === product.id && !item.adicionais?.length) ? { ...item, qtd: item.qtd + 1 } : item
        );
      }
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        produtoId: String(product.id),
        nome: product.nome,
        preco: product.preco,
        qtd: 1
      }];
    });
  };

  const addCustomizedToCart = (item: OrderItem) => {
    setCart(prev => [...prev, item]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qtd + delta);
        return { ...item, qtd: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckoutSubmit = async (formData: any) => {
    const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    const taxa = config?.taxaEntrega || 5;
    const total = subtotal + taxa;

    const newOrder: Order = {
      id: `PED-${Date.now().toString(36).toUpperCase()}`,
      tipo: 'delivery',
      cliente: formData,
      itens: cart,
      pagamento: formData.pagamento,
      troco: formData.troco,
      subtotal,
      desconto: 0,
      taxa,
      total,
      status: 'novo',
      data: new Date().toISOString()
    };

    try {
      await set(ref(db, `pedidos/${newOrder.id}`), newOrder);
      
      // WhatsApp Message
      const itensTexto = cart.map(i => `• ${i.qtd}x ${i.nome} = R$ ${(i.preco * i.qtd).toFixed(2)}`).join('\n');
      const msg = `🍔 *NOVO PEDIDO - MH LANCHES*\n\n👤 *Cliente:* ${formData.nome}\n📱 *Telefone:* ${formData.telefone}\n📍 *Endereço:* ${formData.endereco}${formData.complemento ? '\n🏠 ' + formData.complemento : ''}\n\n📋 *ITENS:*\n${itensTexto}\n\n💰 *Subtotal:* R$ ${subtotal.toFixed(2)}\n🛵 *Taxa Entrega:* R$ ${taxa.toFixed(2)}\n\n💵 *TOTAL: R$ ${total.toFixed(2)}*\n\n💳 *Pagamento:* ${formData.pagamento.toUpperCase()}${formData.troco ? `\n💰 *Troco:* ${formData.troco}` : ''}`;
      
      const phone = (config?.whatsapp || "5500000000000").replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

      setCart([]);
      setIsCheckoutOpen(false);
      localStorage.setItem("mh_last_order_id", newOrder.id);
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      alert("Erro ao enviar pedido. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        taxaEntrega={config?.taxaEntrega || 5}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmit={handleCheckoutSubmit}
        total={cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0) + (config?.taxaEntrega || 5)}
      />

      <CustomizeModal 
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        product={selectedProduct}
        onAddToCart={addCustomizedToCart}
      />

      <TrackingModal 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        orderId={lastOrderId}
      />

      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", isOpen ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className={cn("text-sm font-semibold", isOpen ? "text-green-500" : "text-red-500")}>
              {isOpen ? "ABERTO" : "FECHADO"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastOrderId && (
              <button 
                onClick={() => setIsTrackingOpen(true)}
                className="glass p-2 rounded-xl hover:scale-105 transition-transform border-neon-cyan/20 flex items-center gap-2"
              >
                <Clock className="w-5 h-5 text-neon-cyan" />
                <span className="text-[10px] font-bold text-neon-cyan hidden sm:inline">ACOMPANHAR PEDIDO</span>
              </button>
            )}
            <button 
              onClick={toggleMusic}
              className={cn(
                "glass p-2 rounded-xl hover:scale-105 transition-transform border-neon-cyan/20",
                isPlaying && "bg-neon-pink/20 border-neon-pink/50"
              )}
            >
              <Music className={cn("w-5 h-5", isPlaying ? "text-white animate-bounce" : "text-neon-pink")} />
            </button>
            <audio id="jingle-audio" loop>
              <source src="/music/mh.mp3" type="audio/mpeg" />
            </audio>
            <button onClick={() => setIsCartOpen(true)} className="relative glass p-2 rounded-xl hover:scale-105 transition-transform border-neon-cyan/20">
              <ShoppingCart className="w-5 h-5 text-neon-cyan" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((acc, item) => acc + item.qtd, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="pt-20 pb-8 px-4 text-center">
        <motion.img 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          src={config?.logoUrl || "https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572"}
          alt="MH Lanches Logo"
          className="mx-auto mb-4 w-64 h-auto md:w-80 animate-logo-float"
        />
        <h1 className="font-display text-3xl md:text-5xl font-black neon-text text-neon-pink mb-2">
          {config?.tituloPrincipal || "MH LANCHES"}
        </h1>
        <p className="text-gray-400 text-lg">{config?.slogan || "Seu delivery favorito!"}</p>
      </header>

      {/* Banner */}
      {announcements.length > 0 && (
        <section className="px-4 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl overflow-hidden relative h-40 md:h-56">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 flex flex-col justify-center items-center p-8 text-center"
                >
                  <h3 className="font-display text-xl md:text-3xl font-black text-white mb-2">
                    {announcements[currentBanner].titulo}
                  </h3>
                  <p className="text-gray-300 max-w-md">
                    {announcements[currentBanner].texto}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {announcements.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentBanner(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentBanner ? "bg-white w-6" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="px-4 mb-8">
        <div className="max-w-2xl mx-auto relative">
          <div className="glass rounded-xl flex items-center px-4 py-3 border-neon-cyan/20">
            <Search className="w-5 h-5 text-neon-cyan mr-3" />
            <input 
              type="text" 
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 mb-6 sticky top-12 z-40 py-3 bg-[#0a0a1a]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all text-sm",
                  activeCategory === cat 
                    ? "bg-gradient-to-r from-neon-pink to-neon-cyan text-white shadow-[0_0_15px_rgba(255,0,255,0.4)]" 
                    : "glass-card hover:border-neon-pink text-gray-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(prod => (
              <motion.div 
                layout
                key={prod.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleProductClick(prod)}
                className="glass-card rounded-2xl overflow-hidden flex group hover:border-neon-pink/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-2 mb-2">
                      {prod.promocao && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">PROMOÇÃO</span>}
                      {prod.destaque && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">DESTAQUE</span>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{prod.nome}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{prod.descricao}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-neon-pink">
                      R$ {prod.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <div className="w-10 h-10 bg-gradient-to-r from-neon-pink to-neon-cyan rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-neon-pink/20">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="w-32 md:w-48 relative overflow-hidden">
                  <img 
                    src={prod.imagem || "https://picsum.photos/seed/burger/400/400"} 
                    alt={prod.nome}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <button 
                    onClick={(e) => toggleFavorite(e, String(prod.id))}
                    className={cn(
                      "absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full transition-colors",
                      favorites.includes(String(prod.id)) ? "text-red-500" : "text-white/60 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", favorites.includes(String(prod.id)) && "fill-current")} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Utensils className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">Nenhum produto encontrado nesta categoria.</p>
          </div>
        )}
      </main>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-neon-pink text-white rounded-full flex items-center justify-center shadow-lg shadow-neon-pink/40 hover:scale-110 active:scale-95 transition-transform"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* About Section */}
      <section className="mt-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-neon-cyan mb-8">Sobre Nós</h2>
          <div className="glass-card p-10 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-pink" />
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan p-1">
              <div className="w-full h-full rounded-full bg-[#0a0a1a] flex items-center justify-center overflow-hidden">
                <Utensils className="w-12 h-12 text-neon-cyan" />
              </div>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {config?.sobreTexto1 || "Fundada em 2020, a MH Lanches nasceu do sonho de trazer o verdadeiro sabor do hambúrguer artesanal para nossa região."}
            </p>
            <p className="text-gray-400 leading-relaxed">
              {config?.sobreTexto2 || "Hoje, somos referência em qualidade e atendimento, sempre com o compromisso de oferecer o melhor para nossos clientes."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="mt-20 glass py-12 px-4 border-t border-neon-pink/20">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="font-display text-2xl font-bold text-neon-pink mb-4">
            {config?.lojaNome || "MH LANCHES"}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {config?.lojaEndereco || "Av. Principal, 123 - Centro"}
          </p>
          <div className="flex justify-center gap-4 mb-8">
            {/* Social Links would go here */}
          </div>
          <p className="text-gray-500 text-xs">
            {config?.copyright || "© 2024 MH Lanches. Todos os direitos reservados."}
          </p>
        </div>
      </footer>
    </div>
  );
}
