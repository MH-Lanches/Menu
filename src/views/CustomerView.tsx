import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Product } from '../types/store';
import { ShoppingCart, Search, Star, Clock, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore, parse } from 'date-fns';

interface CustomerViewProps {}

const CustomerView: React.FC<CustomerViewProps> = () => {
  const { state } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedExtras: any[] }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    paymentMethod: 'Pix',
  });

  // Check if store is open
  const isStoreOpen = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay().toString();
    const dayConfig = state.config.openingHours[dayOfWeek];
    if (!dayConfig) return false;

    const currentTime = format(now, 'HH:mm');
    return isAfter(parse(currentTime, 'HH:mm', new Date()), parse(dayConfig.open, 'HH:mm', new Date())) &&
           isBefore(parse(currentTime, 'HH:mm', new Date()), parse(dayConfig.close, 'HH:mm', new Date()));
  }, [state.config.openingHours]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return state.products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory ? p.category === activeCategory : true;
      return matchesSearch && matchesCategory && p.isActive;
    });
  }, [state.products, searchTerm, activeCategory]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.product.price + (item.selectedExtras?.reduce((exSum, ex) => exSum + ex.price, 0) || 0);
      return sum + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  const cartSubtotal = cartTotal + state.config.deliveryFee;

  // Cart actions
  const addToCart = (product: Product) => {
    // For simplicity, we'll assume no extras for now, or you can implement a modal for extras
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, selectedExtras: [] }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // WhatsApp Order Generation
  const sendWhatsAppOrder = () => {
    if (!customerInfo.name || !customerInfo.address) {
      alert('Por favor, preencha seu nome e endereço.');
      return;
    }

    let message = `*Novo Pedido - ${state.config.name}*\n`;
    message += `--------------------------------\n`;
    message += `👤 *Cliente:* ${customerInfo.name}\n`;
    message += `📍 *Endereço:* ${customerInfo.address}\n`;
    message += `💳 *Pagamento:* ${customerInfo.paymentMethod}\n`;
    message += `--------------------------------\n`;
    message += `🛒 *Itens:*\n`;

    cart.forEach(item => {
      const itemExtras = item.selectedExtras?.map(ex => `  + ${ex.name} (R$ ${ex.price.toFixed(2)})`).join('\n') || '';
      message += `• ${item.product.name} x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n${itemExtras}\n`;
    });

    message += `--------------------------------\n`;
    message += `💰 *Subtotal:* R$ ${cartTotal.toFixed(2)}\n`;
    message += `🚚 *Entrega:* R$ ${state.config.deliveryFee.toFixed(2)}\n`;
    message += `💵 *TOTAL:* R$ ${cartSubtotal.toFixed(2)}\n`;
    message += `--------------------------------\n`;
    message += `⏰ *Status:* ${isStoreOpen ? 'Pedido Imediato' : 'Agendado (Loja Fechada)'}\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMessage}`; // Replace with actual number
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900" style={{ '--primary': state.config.primaryColor } as any}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
            {state.config.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{state.config.name}</h1>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              {isStoreOpen ? 'Aberto agora' : 'Fechado'}
            </div>
          </div>
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Search size={24} />
        </button>
      </header>

      {/* Banner/Hero */}
      <div className="px-4 py-4">
        <div className="relative h-32 md:h-48 rounded-2xl overflow-hidden bg-slate-900 flex items-center px-6">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Bateu a fome?</h2>
            <p className="text-slate-300 text-sm md:text-base">Os melhores produtos na sua porta!</p>
          </div>
          <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-black to-transparent" />
        </div>
      </div>

      {/* Search & Categories */}
      <div className="px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="O que você quer comer hoje?"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Tudo
          </button>
          {state.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <main className="px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <motion.div
            layout
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
          >
            <div className="relative h-40 w-full">
              <img 
                src={product.image || 'https://via.placeholder.com/400x300'} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
                  favorites.includes(product.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'
                }`}
              >
                <Star size={18} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                <span className="font-bold text-red-600">R$ {product.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                {product.description}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Adicionar
              </button>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="text-gray-300 mb-4 flex justify-center">
              <Search size={48} />
            </div>
            <p className="text-gray-500 font-medium">Nenhum item encontrado.</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <span className="font-bold">Ver Carrinho</span>
            </div>
            <span className="font-bold text-lg">R$ {cartSubtotal.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[32px] max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-800">Meu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <img src={item.product.image || 'https://via.placeholder.com/40'} className="w-16 h-16 rounded-xl object-cover" alt="" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">R$ {item.product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center border rounded-lg text-gray-500">-</button>
                          <span className="font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center border rounded-lg text-gray-500">+</button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-red-500 font-medium mt-1">Remover</button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      Seu carrinho está vazio.
                    </div>
                  )}
                </div>

                {/* Checkout Info */}
                {cart.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-gray-800">Informações de Entrega</h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Seu nome completo"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Endereço completo (Rua, nº, Bairro)"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-lg text-gray-800">Forma de Pagamento</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['Pix', 'Cartão', 'Dinheiro'].map(method => (
                          <button
                            key={method}
                            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                            className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                              customerInfo.paymentMethod === method ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Taxa de Entrega</span>
                        <span>R$ {state.config.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>R$ {cartSubtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {!isStoreOpen && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 text-amber-700">
                        <Clock size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm">
                          A loja está fechada no momento. Seu pedido será <strong>agendado</strong> e preparado assim que abrirmos!
                        </p>
                      </div>
                    )}

                    <button
                      onClick={sendWhatsAppOrder}
                      className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl text-lg shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Finalizar Pedido via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 text-center">
        <p className="text-sm text-gray-400 font-medium">{state.config.footerText}</p>
      </footer>
    </div>
  );
};

export default CustomerView;
