import { useState, useMemo } from 'react';
import { useData, Product, AddonItem } from '../store/DataContext';
import { ShoppingCart, Heart, Search, X, Plus, Minus, Clock, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ClientPage() {
  const { 
    settings, categories, products, cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart,
    favorites, toggleFavorite, isStoreOpen 
  } = useData();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal State
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, AddonItem[]>>({});
  const [isHalfHalf, setIsHalfHalf] = useState(false);
  const [halfProductId, setHalfProductId] = useState<string>('');

  const activeProducts = useMemo(() => products.filter(p => p.isActive), [products]);
  
  const favoriteProducts = useMemo(() => 
    activeProducts.filter(p => favorites.includes(p.id)), 
  [activeProducts, favorites]);

  const displayedProducts = useMemo(() => {
    let filtered = activeProducts;
    if (activeCategory === 'favorites') return favoriteProducts;
    if (activeCategory !== 'all') filtered = filtered.filter(p => p.categoryId === activeCategory);
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [activeProducts, favoriteProducts, activeCategory, searchTerm]);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const formatPrice = (p: number) => `R$ ${p.toFixed(2).replace('.', ',')}`;

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setNotes('');
    setSelectedAddons({});
    setIsHalfHalf(false);
    setHalfProductId('');
  };

  const handleAddonToggle = (groupId: string, addon: AddonItem, max: number) => {
    setSelectedAddons(prev => {
      const current = prev[groupId] || [];
      const exists = current.find(a => a.id === addon.id);
      if (exists) {
        return { ...prev, [groupId]: current.filter(a => a.id !== addon.id) };
      }
      if (current.length >= max) return prev; // limit reached
      return { ...prev, [groupId]: [...current, addon] };
    });
  };

  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;
    let basePrice = selectedProduct.price;

    if (isHalfHalf && halfProductId) {
      const halfProduct = products.find(p => p.id === halfProductId);
      if (halfProduct) {
        // usually half-half is the most expensive
        basePrice = Math.max(selectedProduct.price, halfProduct.price);
      }
    }

    let addonsPrice = 0;
    Object.values(selectedAddons).flat().forEach(addon => addonsPrice += addon.price);

    return (basePrice + addonsPrice);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart({
      productId: selectedProduct.id,
      quantity,
      notes,
      addons: selectedAddons,
      isHalfHalf,
      halfProductId: isHalfHalf ? halfProductId : undefined,
      price: calculateItemPrice()
    });
    setSelectedProduct(null);
  };

  const storeOpen = isStoreOpen();

  const handleCheckout = () => {
    if (cart.length === 0) return;

    let message = `*Novo Pedido - ${settings.storeName}*\n\n`;
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      message += `${item.quantity}x ${product.name}`;
      if (item.isHalfHalf && item.halfProductId) {
        const halfP = products.find(p => p.id === item.halfProductId);
        if (halfP) message += ` (Meio a meio com ${halfP.name})`;
      }
      message += ` - ${formatPrice(item.price * item.quantity)}\n`;
      
      const addons = Object.values(item.addons).flat();
      if (addons.length > 0) {
        message += `   Adicionais: ${addons.map(a => a.name).join(', ')}\n`;
      }
      if (item.notes) {
        message += `   Obs: ${item.notes}\n`;
      }
      message += '\n';
    });

    message += `*Subtotal:* ${formatPrice(cartTotal)}\n`;
    message += `*Taxa de Entrega:* ${formatPrice(settings.deliveryFee)}\n`;
    message += `*Total:* ${formatPrice(cartTotal + settings.deliveryFee)}\n\n`;

    if (!storeOpen) {
      message = `*AGENDAMENTO DE PEDIDO*\n(Loja fechada no momento)\n\n` + message;
    }

    message += `Por favor, me informe a chave PIX ou envie o link de pagamento, além do tempo estimado de entrega. Meu endereço é: `;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encoded}`, '_blank');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header style={{ backgroundColor: settings.primaryColor }} className="text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold truncate">{settings.storeName}</h1>
            <div className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1", storeOpen ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
              <Clock size={12} /> {storeOpen ? 'Aberto' : 'Fechado'}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar itens no cardápio..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 border-none focus:ring-2 focus:ring-white/50 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Categories Horizontal Scroll */}
      <div className="bg-white border-b sticky top-[110px] z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-2 py-3 flex overflow-x-auto hide-scrollbar gap-2 snap-x">
          <button 
            onClick={() => setActiveCategory('all')}
            className={cn("whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors snap-start", activeCategory === 'all' ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
            style={activeCategory === 'all' ? { backgroundColor: settings.primaryColor } : {}}
          >
            Todos
          </button>
          {favorites.length > 0 && (
            <button 
              onClick={() => setActiveCategory('favorites')}
              className={cn("whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 snap-start", activeCategory === 'favorites' ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
              style={activeCategory === 'favorites' ? { backgroundColor: settings.primaryColor } : {}}
            >
              <Heart size={14} className={activeCategory === 'favorites' ? "fill-current" : "text-red-500"} /> Favoritos
            </button>
          )}
          {categories.sort((a,b) => a.order - b.order).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn("whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors snap-start", activeCategory === cat.id ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
              style={activeCategory === cat.id ? { backgroundColor: settings.primaryColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {displayedProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Nenhum produto encontrado.
          </div>
        ) : (
          displayedProducts.map(prod => (
            <div 
              key={prod.id} 
              onClick={() => openProductModal(prod)}
              className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-2">{prod.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{prod.description}</p>
                </div>
                <div className="font-medium text-gray-900 mt-3">{formatPrice(prod.price)}</div>
              </div>
              {prod.image && (
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Footer Details */}
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
        <p>{settings.footerText}</p>
        <p className="mt-2">Taxa de Entrega: {formatPrice(settings.deliveryFee)}</p>
        <Link to="/admin" className="inline-block mt-4 text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors">Acessar Painel Admin</Link>
      </footer>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white z-20 flex justify-center">
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: settings.primaryColor }}
            className="w-full max-w-md text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-between shadow-lg shadow-black/10 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-2.5 py-1 rounded text-sm">{cart.reduce((a,c) => a+c.quantity, 0)}</div>
              <span>Ver Carrinho</span>
            </div>
            <span>{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-black/50 md:p-4 md:items-center md:justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Modal Header/Image */}
            <div className="relative shrink-0">
              {selectedProduct.image ? (
                <div className="w-full h-48 md:h-64 bg-gray-200 relative">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="w-full h-16" style={{ backgroundColor: settings.primaryColor }}></div>
              )}
              
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-4 right-4 bg-white/30 backdrop-blur-md text-white md:text-gray-800 md:bg-white p-2 rounded-full hover:bg-white/50 transition-colors"
              >
                <X size={20} />
              </button>

              <button 
                onClick={() => toggleFavorite(selectedProduct.id)}
                className="absolute top-4 left-4 bg-white/30 backdrop-blur-md md:bg-white p-2 rounded-full hover:bg-white/50 transition-colors"
              >
                <Heart size={20} className={cn("transition-colors", favorites.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-white md:text-gray-400")} />
              </button>

              <div className={cn("absolute bottom-0 left-0 p-4 w-full", selectedProduct.image ? "text-white" : "text-gray-900")}>
                <h2 className="text-2xl font-bold leading-tight">{selectedProduct.name}</h2>
                <p className="font-medium mt-1 opacity-90">{formatPrice(selectedProduct.price)}</p>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
              <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>

              {/* Half-Half Logic */}
              {categories.find(c => c.id === selectedProduct.categoryId)?.isHalfHalfAllowed && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <label className="flex items-center justify-between font-bold text-purple-900 mb-2 cursor-pointer">
                    <span>Dividir a Pizza? (Meio a Meio)</span>
                    <input type="checkbox" checked={isHalfHalf} onChange={e => { setIsHalfHalf(e.target.checked); setHalfProductId(''); }} className="w-5 h-5 text-purple-600 rounded" />
                  </label>
                  {isHalfHalf && (
                    <div className="mt-3">
                      <p className="text-sm text-purple-700 mb-2">Será cobrado o valor da opção mais cara.</p>
                      <select 
                        value={halfProductId} 
                        onChange={e => setHalfProductId(e.target.value)}
                        className="w-full p-3 rounded-lg border-purple-200 bg-white"
                      >
                        <option value="">Selecione o 2º Sabor...</option>
                        {products.filter(p => p.categoryId === selectedProduct.categoryId && p.id !== selectedProduct.id && p.isActive).map(p => (
                          <option key={p.id} value={p.id}>{p.name} (+ {formatPrice(p.price)})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Addons */}
              {selectedProduct.addonGroups.map(group => (
                <div key={group.id} className="bg-gray-50 border rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b">
                    <div>
                      <h4 className="font-bold text-gray-800">{group.name}</h4>
                      <p className="text-xs text-gray-500">Escolha até {group.max} opções</p>
                    </div>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                      {(selectedAddons[group.id] || []).length} / {group.max}
                    </span>
                  </div>
                  <div className="divide-y">
                    {group.addons.map(addon => {
                      const isSelected = (selectedAddons[group.id] || []).some(a => a.id === addon.id);
                      return (
                        <label key={addon.id} className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                          <div>
                            <span className="text-gray-800 font-medium block">{addon.name}</span>
                            {addon.price > 0 && <span className="text-sm text-green-600">+ {formatPrice(addon.price)}</span>}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleAddonToggle(group.id, addon, group.max)}
                            className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Alguma observação?</h4>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Tirar cebola, maionese à parte..."
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer (Add to Cart) */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t p-4 flex gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-2 border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><Minus size={18} /></button>
                <span className="font-bold w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><Plus size={18} /></button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={isHalfHalf && !halfProductId}
                style={{ backgroundColor: settings.primaryColor }}
                className={cn("flex-1 text-white font-bold rounded-xl flex items-center justify-between px-4 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100")}
              >
                <span>Adicionar</span>
                <span>{formatPrice(calculateItemPrice() * quantity)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 md:bg-black/50 md:p-4 md:items-center md:justify-center overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-gray-50 md:bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={20} /> Seu Pedido
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.id} className="bg-white p-4 rounded-xl border flex gap-4 shadow-sm">
                    <div className="flex flex-col items-center justify-between bg-gray-50 rounded-lg border p-1">
                      <button onClick={() => updateCartItemQuantity(item.id, 1)} className="p-1.5 text-gray-600"><Plus size={14}/></button>
                      <span className="font-bold text-sm my-1">{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, -1)} className="p-1.5 text-gray-600"><Minus size={14}/></button>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 leading-tight pr-2">{product.name}</h4>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      
                      {item.isHalfHalf && item.halfProductId && (
                        <p className="text-xs text-purple-600 font-medium mt-1">Meio a meio: {products.find(p=>p.id===item.halfProductId)?.name}</p>
                      )}
                      
                      {Object.values(item.addons).flat().length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          + {Object.values(item.addons).flat().map(a => a.name).join(', ')}
                        </p>
                      )}

                      {item.notes && <p className="text-xs text-amber-600 mt-1 italic">Obs: {item.notes}</p>}
                      
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 font-medium mt-3 border-b border-transparent hover:border-red-500">
                        Remover item
                      </button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                  <ShoppingCart size={48} className="text-gray-300 mb-4" />
                  <p>Seu carrinho está vazio.</p>
                </div>
              )}

              {cart.length > 0 && (
                <div className="bg-white p-4 rounded-xl border space-y-2 text-sm shadow-sm mt-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxa de Entrega</span>
                    <span>{formatPrice(settings.deliveryFee)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal + settings.deliveryFee)}</span>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-white p-4 border-t shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                {!storeOpen && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex gap-2">
                    <Clock size={20} className="shrink-0" />
                    <p>A loja está <strong>fechada</strong> agora. Você pode enviar como <strong>Agendamento</strong>.</p>
                  </div>
                )}
                
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-[#25D366] text-white px-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebe57] transition-colors shadow-lg shadow-[#25D366]/20 active:scale-95"
                >
                  <MessageCircle size={22} /> {storeOpen ? 'Enviar Pedido por WhatsApp' : 'Agendar Pedido via WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
