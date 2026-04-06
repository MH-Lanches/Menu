import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, AdditionGroup } from '../types';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Clock, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ArrowRight
} from 'lucide-react';

const ClientStore: React.FC = () => {
  const { products, categories, settings } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedAdditions, setSelectedAdditions] = useState<{ groupId: string; additions: any[] }[]>([]);
  const [otherFlavor, setOtherFlavor] = useState<Product | null>(null);

  useEffect(() => {
    const storedFavs = localStorage.getItem('delivery_favorites');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));
  }, []);

  useEffect(() => {
    const checkStoreStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const hour = settings.operatingHours[day];
      
      if (hour.closed || currentTime < hour.open || currentTime > hour.close) {
        setIsStoreOpen(false);
      } else {
        setIsStoreOpen(true);
      }
    };
    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 60000);
    return () => clearInterval(interval);
  }, [settings.operatingHours]);

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('delivery_favorites', JSON.stringify(newFavs));
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && JSON.stringify(i.selectedAdditions) === JSON.stringify(item.selectedAdditions));
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(false);
    setSelectedProduct(null);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const calculateSubtotal = (item: CartItem) => {
    let total = item.price * item.quantity;
    item.selectedAdditions.forEach(group => {
      group.additions.forEach(add => {
        total += add.price * item.quantity;
      });
    });
    if (item.halfAndHalf) {
      const diff = (item.halfAndHalf.otherPrice - item.price) / 2;
      total += diff * item.quantity;
    }
    return total;
  };

  const calculateProductTotal = (product: Product) => {
    let total = product.price;
    selectedAdditions.forEach(group => {
      group.additions.forEach((add: any) => {
        total += add.price;
      });
    });
    if (otherFlavor) {
      total += (otherFlavor.price - product.price) / 2;
    }
    return total;
  };

  const cartTotal = cart.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  const grandTotal = cartTotal + settings.deliveryFee;

  const formatWhatsAppMessage = () => {
    let message = `*Novo Pedido - ${settings.name}*\n\n`;
    message += `*Cliente:* \nNome: \nEndereço: \n\n`;
    message += `*Itens:*\n`;
    cart.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} (x${item.quantity})\n`;
      item.selectedAdditions.forEach(group => {
        message += `   - ${group.additions.map(a => a.name).join(', ')}\n`;
      });
      if (item.halfAndHalf) {
        message += `   - Meio a Meio: ${item.halfAndHalf.otherProductName}\n`;
      }
      message += `   Subtotal: R$ ${calculateSubtotal(item).toFixed(2)}\n\n`;
    });
    message += `*Taxa de Entrega:* R$ ${settings.deliveryFee.toFixed(2)}\n`;
    message += `*Total:* R$ ${grandTotal.toFixed(2)}\n\n`;
    message += `*Pagamento:* \n`;
    
    return encodeURIComponent(message);
  };

  const handleOrder = () => {
    const msg = formatWhatsAppMessage();
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${msg}`, '_blank');
  };

  const filteredProducts = products.filter(p => 
    p.active && 
    (p.categoryId === activeCategory || (activeCategory === 'favorites' && favorites.includes(p.id))) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans" style={{ '--primary-color': settings.primaryColor } as any}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
            {settings.name[0]}
          </div>
          <h1 className="text-xl font-bold text-gray-800">{settings.name}</h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="p-2 rounded-full bg-gray-100 text-gray-600 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Status Banner */}
      {!isStoreOpen && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> Loja Fechada - Pedidos Agendados
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar no cardápio..." 
            className="w-full pl-10 pr-4 py-3 bg-white border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveCategory('favorites')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${activeCategory === 'favorites' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            ❤️ Favoritos
          </button>
          {categories.sort((a, b) => a.order - b.order).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${activeCategory === cat.id ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)}
              className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-red-200 transition"
            >
              <img src={product.image || 'https://via.placeholder.com/100'} className="w-20 h-20 object-cover rounded-xl" alt={product.name} />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{product.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                <p className="text-red-600 font-bold mt-1">R$ {product.price.toFixed(2)}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                className={`p-2 rounded-full ${favorites.includes(product.id) ? 'text-red-500 bg-red-50' : 'text-gray-300 bg-gray-50 hover:bg-gray-100'}`}
              >
                <Star className="w-5 h-5" />
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-xs">
        {settings.footerText}
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 relative animate-in slide-in-from-bottom duration-300">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <img src={selectedProduct.image || 'https://via.placeholder.com/400'} className="w-full h-48 object-cover rounded-2xl mb-4" alt={selectedProduct.name} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h2>
            <p className="text-gray-500 mb-4">{selectedProduct.description}</p>

            {/* Pizza Meio a Meio */}
            {selectedProduct.isPizza && (
              <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" /> Pizza Meio a Meio
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                    <span className="font-medium">Sabor 1: {selectedProduct.name}</span>
                    <span className="text-blue-600 font-bold">R$ {selectedProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-blue-600 font-medium">Escolha o segundo sabor:</label>
                    <select 
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none"
                      onChange={(e) => {
                        const other = products.find(p => p.id === e.target.value);
                        if (other) {
                          setOtherFlavor(other);
                        }
                      }}
                    >
                      <option value="">Selecione um sabor</option>
                      {products.filter(p => p.id !== selectedProduct.id && p.isPizza).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  {otherFlavor && (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                      <span className="font-medium">Sabor 2: {otherFlavor.name}</span>
                      <span className="text-blue-600 font-bold">R$ {otherFlavor.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additions */}
            <div className="space-y-6 mb-8">
              {selectedProduct.additionGroups.map(group => (
                <div key={group.id} className="space-y-3">
                  <h3 className="font-bold text-gray-800">{group.name} ({group.min} a {group.max})</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map(opt => (
                      <label key={opt.id} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-red-500" 
                            onChange={(e) => {
                              const currentSelected = selectedAdditions.find(g => g.groupId === group.id);
                              if (!currentSelected) {
                                setSelectedAdditions([...selectedAdditions, { groupId: group.id, additions: [opt] }]);
                              } else {
                                const options = currentSelected.additions.includes(opt) 
                                  ? currentSelected.additions.filter(a => a.id !== opt.id)
                                  : [...currentSelected.additions, opt];
                                setSelectedAdditions(selectedAdditions.map(g => g.groupId === group.id ? { ...g, additions: options } : g));
                              }
                            }}
                          />
                          <span className="text-gray-700">{opt.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">+ R$ {opt.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <span className="text-gray-500 text-sm">Total:</span>
                <span className="text-xl font-bold text-red-600 ml-2">R$ {calculateProductTotal(selectedProduct).toFixed(2)}</span>
              </div>
              <button 
                onClick={() => {
                  addToCart({
                    productId: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity: 1,
                    observations: '',
                    selectedAdditions: selectedAdditions,
                    halfAndHalf: otherFlavor ? {
                      otherProductId: otherFlavor.id,
                      otherProductName: otherFlavor.name,
                      otherPrice: otherFlavor.price
                    } : undefined
                  });
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center gap-2"
              >
                Adicionar <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsCartOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Meu Carrinho</h2>
            
            <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Seu carrinho está vazio.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3 border rounded-2xl">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {item.selectedAdditions.map(g => g.additions.map(a => a.name).join(', ')).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(idx, -1)} className="p-1 border rounded-lg"><Minus className="w-4 h-4" /></button>
                      <span className="font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="p-1 border rounded-lg"><Plus className="w-4 h-4" /></button>
                      <button onClick={() => removeFromCart(idx)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Entrega</span>
                <span>R$ {settings.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t">
                <span>Total</span>
                <span>R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleOrder}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-2xl font-bold text-white transition flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isStoreOpen ? 'Enviar Pedido' : 'Agendar Pedido'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientStore;
