import { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { checkStoreOpen } from '../utils/time';
import { Heart, Search, X, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces & Cart State
interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
  selectedAdditionals: Record<string, string[]>; // barId -> itemIds
  halfHalfProduct?: Product; // For pizza half and half
}

export default function Client() {
  const { products, categories, config, favorites, toggleFavorite } = useStore();
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const activeProducts = products.filter(p => p.active);

  const { isOpen, message } = checkStoreOpen(config.schedule);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products based on search and category
  const displayProducts = useMemo(() => {
    let filtered = activeProducts;
    if (search) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(p => favorites.includes(p.id));
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    return filtered;
  }, [activeProducts, search, selectedCategory, favorites]);

  // Product Selection Modal State
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedAdditionals, setSelectedAdditionals] = useState<Record<string, string[]>>({});
  const [halfPizzaId, setHalfPizzaId] = useState<string>('');

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setNotes('');
    setSelectedAdditionals({});
    setHalfPizzaId('');
  };

  const closeProductModal = () => setSelectedProduct(null);

  const toggleAdditional = (barId: string, itemId: string, maxLimit: number) => {
    setSelectedAdditionals(prev => {
      const barSelection = prev[barId] || [];
      if (barSelection.includes(itemId)) {
        return { ...prev, [barId]: barSelection.filter(id => id !== itemId) };
      }
      if (barSelection.length >= maxLimit) return prev;
      return { ...prev, [barId]: [...barSelection, itemId] };
    });
  };

  const calculateItemTotal = (product: Product, qty: number, adds: Record<string, string[]>, halfPizzaId?: string) => {
    let basePrice = product.price;
    if (product.isPizza && halfPizzaId) {
      const halfPizza = products.find(p => p.id === halfPizzaId);
      if (halfPizza) {
        // Average or Max? Let's use max
        basePrice = Math.max(product.price, halfPizza.price);
      }
    }

    let addTotal = 0;
    product.additionals.forEach(bar => {
      const selected = adds[bar.id] || [];
      selected.forEach(itemId => {
        const item = bar.items.find(i => i.id === itemId);
        if (item) addTotal += item.price;
      });
    });

    return (basePrice + addTotal) * qty;
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    let halfPizza = undefined;
    if (selectedProduct.isPizza && halfPizzaId) {
      halfPizza = products.find(p => p.id === halfPizzaId);
    }

    const newItem: CartItem = {
      id: Math.random().toString(36).substring(7),
      product: selectedProduct,
      quantity,
      notes,
      selectedAdditionals,
      halfHalfProduct: halfPizza
    };

    setCart(prev => [...prev, newItem]);
    closeProductModal();
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const cartTotal = cart.reduce((acc, item) => 
    acc + calculateItemTotal(item.product, item.quantity, item.selectedAdditionals, item.halfHalfProduct?.id), 0
  );

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const sendOrderToWhatsApp = () => {
    const phone = config.phone.replace(/\D/g, '');
    let text = `*Novo Pedido*\n\n`;

    cart.forEach(item => {
      const isHalf = item.halfHalfProduct;
      const name = isHalf ? `1/2 ${item.product.name} + 1/2 ${isHalf.name}` : item.product.name;
      text += `*${item.quantity}x ${name}* - ${formatMoney(calculateItemTotal(item.product, item.quantity, item.selectedAdditionals, isHalf?.id))}\n`;
      
      item.product.additionals.forEach(bar => {
        const sel = item.selectedAdditionals[bar.id] || [];
        sel.forEach(id => {
          const add = bar.items.find(i => i.id === id);
          if (add) text += `  + ${add.name}\n`;
        });
      });
      if (item.notes) text += `  Obs: ${item.notes}\n`;
      text += `\n`;
    });

    text += `Subtotal: ${formatMoney(cartTotal)}\n`;
    text += `Taxa de Entrega: ${formatMoney(config.deliveryFee)}\n`;
    text += `*Total: ${formatMoney(cartTotal + config.deliveryFee)}*\n\n`;
    
    if (!isOpen) text += `*(Agendamento)*\n`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setCart([]);
    setIsCartOpen(false);
  };

  const headerStyle = { backgroundColor: config.primaryColor };
  const textPrimaryStyle = { color: config.primaryColor };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm" style={headerStyle}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-3 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Menu Digital</h1>
            <div className={cn("px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1", 
              isOpen ? "bg-white/20" : "bg-red-500/80")}>
              <span className={cn("w-2 h-2 rounded-full", isOpen ? "bg-green-400" : "bg-red-200")}></span>
              {isOpen ? "Aberto agora" : message || "Fechado"}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
            <input 
              type="text" 
              placeholder="Buscar itens..." 
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-4 px-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={cn("px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border",
              selectedCategory === 'all' ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-700 border-gray-200")}
          >
            Todos
          </button>
          <button 
            onClick={() => setSelectedCategory('favorites')}
            className={cn("px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border flex items-center gap-1",
              selectedCategory === 'favorites' ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-700 border-gray-200")}
          >
            <Heart size={14} className={selectedCategory === 'favorites' ? "fill-white" : ""} /> Favoritos
          </button>
          {sortedCategories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn("px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border",
                selectedCategory === cat.id ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-gray-700 border-gray-200")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="mt-4 grid gap-4">
          {displayProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Nenhum produto encontrado.</div>
          ) : (
            displayProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex cursor-pointer" onClick={() => openProductModal(product)}>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Heart size={18} className={cn("text-gray-400", favorites.includes(product.id) && "fill-red-500 text-red-500")} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="mt-3 font-semibold" style={textPrimaryStyle}>
                    {formatMoney(product.price)}
                  </div>
                </div>
                {product.imageUrl && (
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-30 bg-white/80 backdrop-blur-md border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-between shadow-lg"
              style={headerStyle}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
                  {cart.length}
                </div>
                <span>Ver Carrinho</span>
              </div>
              <span>{formatMoney(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
            <div className="relative">
              {selectedProduct.imageUrl && (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-48 object-cover" />
              )}
              <button onClick={closeProductModal} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full backdrop-blur">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 pb-32">
              <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedProduct.description}</p>
              <div className="text-xl font-semibold mt-2" style={textPrimaryStyle}>{formatMoney(selectedProduct.price)}</div>

              {/* Pizza Half/Half Logic */}
              {selectedProduct.isPizza && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Pizza Meio a Meio (Opcional)</h4>
                  <p className="text-xs text-gray-500 mb-3">Escolha o 2º sabor. O valor será o da pizza mais cara.</p>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    value={halfPizzaId}
                    onChange={(e) => setHalfPizzaId(e.target.value)}
                  >
                    <option value="">Apenas 1 Sabor (Inteira)</option>
                    {activeProducts.filter(p => p.isPizza && p.id !== selectedProduct.id).map(p => (
                      <option key={p.id} value={p.id}>+ 1/2 {p.name} ({formatMoney(p.price)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Additionals */}
              {selectedProduct.additionals.map(bar => (
                <div key={bar.id} className="mt-6 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-baseline mb-3">
                    <h4 className="font-semibold text-gray-800">{bar.name}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">Até {bar.limit} itens</span>
                  </div>
                  <div className="space-y-2">
                    {bar.items.map(item => {
                      const selected = (selectedAdditionals[bar.id] || []).includes(item.id);
                      const maxReached = (selectedAdditionals[bar.id] || []).length >= bar.limit;
                      return (
                        <label key={item.id} className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors", 
                          selected ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-200 hover:bg-gray-50")}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={selected}
                              onChange={() => toggleAdditional(bar.id, item.id, bar.limit)}
                              disabled={!selected && maxReached}
                              className="w-5 h-5 accent-[var(--color-primary)]" 
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">+ {formatMoney(item.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Observações</h4>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Ex: Tirar cebola, maionese à parte..."
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-12">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-gray-600 hover:text-gray-900">-</button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 text-[var(--color-primary)] font-bold">+</button>
              </div>
              <button 
                onClick={addToCart}
                className="flex-1 rounded-lg text-white font-semibold flex items-center justify-between px-4 h-12"
                style={headerStyle}
              >
                <span>Adicionar</span>
                <span>{formatMoney(calculateItemTotal(selectedProduct, quantity, selectedAdditionals, halfPizzaId))}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
              <h2 className="text-xl font-bold text-gray-800">Seu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {cart.map(item => (
                <div key={item.id} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item.quantity}x</span>
                        {item.halfHalfProduct ? `1/2 ${item.product.name} + 1/2 ${item.halfHalfProduct.name}` : item.product.name}
                      </h4>
                      {Object.entries(item.selectedAdditionals).map(([barId, itemIds]) => {
                        const bar = item.product.additionals.find(b => b.id === barId);
                        if (!bar) return null;
                        return itemIds.map(id => {
                          const add = bar.items.find(i => i.id === id);
                          if (!add) return null;
                          return <div key={id} className="text-sm text-gray-500 pl-8">+ {add.name}</div>
                        });
                      })}
                      {item.notes && <div className="text-sm text-gray-500 pl-8 mt-1 italic">Obs: {item.notes}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-medium text-gray-800">
                        {formatMoney(calculateItemTotal(item.product, item.quantity, item.selectedAdditionals, item.halfHalfProduct?.id))}
                      </span>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 underline">Remover</button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                  <span>Taxa de Entrega</span>
                  <span>{formatMoney(config.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span style={textPrimaryStyle}>{formatMoney(cartTotal + config.deliveryFee)}</span>
                </div>
              </div>
              
              {!isOpen && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-sm">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p>A loja está fechada no momento. Seu pedido será enviado como <strong>agendamento</strong> para quando abrirmos.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <button 
                onClick={sendOrderToWhatsApp}
                className="w-full rounded-xl text-white font-bold flex items-center justify-center gap-2 h-14"
                style={headerStyle}
              >
                {isOpen ? "Enviar Pedido via WhatsApp" : "Agendar via WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-gray-400 py-6 border-t border-gray-200 flex flex-col items-center gap-2">
        <span>{config.footerText}</span>
        <a href="/admin" className="text-xs text-gray-300 hover:text-gray-500 underline transition-colors">Acessar Painel</a>
      </footer>
    </div>
  );
}