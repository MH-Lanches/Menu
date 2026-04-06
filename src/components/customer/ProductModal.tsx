import { useState, useMemo } from 'react';
import { X, Minus, Plus, Heart, MessageSquare } from 'lucide-react';
import { Product, Additional, CartItem } from '../../types';
import { useStoreContext } from '../../context/StoreContext';
import { v4 as uuidv4 } from 'uuid';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { storeData, addToCart, toggleFavorite, isFavorite } = useStoreContext();
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [selectedAdditionals, setSelectedAdditionals] = useState<{ barId: string; items: Additional[] }[]>(
    product.additionalBars.map(bar => ({ barId: bar.id, items: [] }))
  );
  const [isHalf, setIsHalf] = useState(false);
  const [halfProduct, setHalfProduct] = useState<Product | null>(null);
  const [halfAdditionals, setHalfAdditionals] = useState<{ barId: string; items: Additional[] }[]>([]);

  const favorite = isFavorite(product.id);

  // Get other pizzas for half selection
  const otherPizzas = useMemo(() => {
    if (!product.isPizza || !product.allowHalf) return [];
    return storeData.products.filter(p => 
      p.id !== product.id && 
      p.isPizza && 
      p.allowHalf && 
      p.active &&
      p.categoryId === product.categoryId
    );
  }, [storeData.products, product]);

  const handleAdditionalToggle = (barId: string, additional: Additional, maxSelection: number) => {
    setSelectedAdditionals(prev => {
      return prev.map(bar => {
        if (bar.barId !== barId) return bar;
        
        const exists = bar.items.find(item => item.id === additional.id);
        if (exists) {
          return { ...bar, items: bar.items.filter(item => item.id !== additional.id) };
        }
        
        if (bar.items.length >= maxSelection) {
          return { ...bar, items: [...bar.items.slice(1), additional] };
        }
        
        return { ...bar, items: [...bar.items, additional] };
      });
    });
  };

  const handleHalfAdditionalToggle = (barId: string, additional: Additional, maxSelection: number) => {
    setHalfAdditionals(prev => {
      return prev.map(bar => {
        if (bar.barId !== barId) return bar;
        
        const exists = bar.items.find(item => item.id === additional.id);
        if (exists) {
          return { ...bar, items: bar.items.filter(item => item.id !== additional.id) };
        }
        
        if (bar.items.length >= maxSelection) {
          return { ...bar, items: [...bar.items.slice(1), additional] };
        }
        
        return { ...bar, items: [...bar.items, additional] };
      });
    });
  };

  const calculatePrice = () => {
    let price = product.price;
    
    // Add additionals price
    selectedAdditionals.forEach(bar => {
      bar.items.forEach(item => {
        price += item.price;
      });
    });

    // Handle half pizza
    if (isHalf && halfProduct) {
      const halfPrice = Math.max(product.price, halfProduct.price);
      price = halfPrice;
      
      // Add half additionals
      halfAdditionals.forEach(bar => {
        bar.items.forEach(item => {
          price += item.price;
        });
      });
    }

    return price;
  };

  const totalPrice = calculatePrice() * quantity;

  const handleSelectHalfProduct = (p: Product) => {
    setHalfProduct(p);
    setHalfAdditionals(p.additionalBars.map(bar => ({ barId: bar.id, items: [] })));
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: uuidv4(),
      product,
      quantity,
      selectedAdditionals,
      observations,
      isHalf,
      halfProduct: halfProduct || undefined,
      halfAdditionals: isHalf ? halfAdditionals : undefined,
      unitPrice: calculatePrice(),
    };
    
    addToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-backdrop animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg max-h-[90vh] md:max-h-[85vh] md:rounded-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Image Header */}
        <div className="relative h-48 md:h-56">
          <img
            src={product.image || 'https://via.placeholder.com/400x400?text=Sem+Imagem'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(product.id)}
            className={`absolute top-4 left-4 p-2 rounded-full transition-all ${
              favorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
          </button>

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-xl shadow-lg">
            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              R$ {product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-12rem)] md:max-h-[calc(85vh-14rem)]">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-gray-600 mt-1">{product.description}</p>

            {/* Half Pizza Option */}
            {product.isPizza && product.allowHalf && otherPizzas.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalf}
                    onChange={(e) => {
                      setIsHalf(e.target.checked);
                      if (!e.target.checked) {
                        setHalfProduct(null);
                        setHalfAdditionals([]);
                      }
                    }}
                    className="custom-checkbox"
                  />
                  <span className="font-medium text-amber-800">🍕 Fazer Meio a Meio</span>
                </label>

                {isHalf && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-amber-700">Escolha a outra metade:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {otherPizzas.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectHalfProduct(p)}
                          className={`p-2 rounded-lg text-sm text-left transition-all ${
                            halfProduct?.id === p.id
                              ? 'bg-amber-500 text-white'
                              : 'bg-white border border-amber-200 hover:border-amber-400'
                          }`}
                        >
                          <span className="font-medium block truncate">{p.name}</span>
                          <span className={halfProduct?.id === p.id ? 'text-amber-100' : 'text-amber-600'}>
                            R$ {p.price.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additionals */}
            {product.additionalBars.map(bar => (
              <div key={bar.id} className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{bar.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {bar.required ? 'Obrigatório' : 'Opcional'} • Máx: {bar.maxSelection}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {bar.items.map(item => {
                    const selected = selectedAdditionals
                      .find(b => b.barId === bar.id)?.items
                      .find(i => i.id === item.id);
                    
                    return (
                      <label 
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selected 
                            ? 'border-2 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selected ? { borderColor: 'var(--primary)' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleAdditionalToggle(bar.id, item, bar.maxSelection)}
                            className="custom-checkbox"
                          />
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                        <span className="font-medium" style={{ color: 'var(--primary)' }}>
                          +R$ {item.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Half Product Additionals */}
            {isHalf && halfProduct && halfProduct.additionalBars.map(bar => (
              <div key={`half-${bar.id}`} className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {bar.name} <span className="text-amber-600">(2ª metade)</span>
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Máx: {bar.maxSelection}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {bar.items.map(item => {
                    const selected = halfAdditionals
                      .find(b => b.barId === bar.id)?.items
                      .find(i => i.id === item.id);
                    
                    return (
                      <label 
                        key={`half-${item.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selected 
                            ? 'border-2 bg-amber-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selected ? { borderColor: '#f59e0b' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleHalfAdditionalToggle(bar.id, item, bar.maxSelection)}
                            className="custom-checkbox"
                          />
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                        <span className="font-medium text-amber-600">
                          +R$ {item.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Observations */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={18} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Observações</h3>
              </div>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Tirar cebola, sem salada..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 safe-bottom">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddToCart}
              disabled={isHalf && !halfProduct}
              className="flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <span>Adicionar</span>
              <span className="font-bold">R$ {totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
