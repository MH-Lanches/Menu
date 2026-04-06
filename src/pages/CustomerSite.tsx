import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, X, ChevronLeft,
  MessageCircle, Heart, ArrowLeft,
  CreditCard, QrCode, Banknote, Calendar,
  Tag, UtensilsCrossed
} from 'lucide-react';
import { getProducts, getCategories, getSettings, isStoreOpen } from '../store';
import type { Product, Category, StoreSettings, CartItem, AddonItem, Order } from '../types';

export default function CustomerSite({ settings: parentSettings }: { settings: StoreSettings }) {
  const [settings, setSettings] = useState<StoreSettings>(parentSettings);
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [categories, setCategories] = useState<Category[]>(getCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem('delivery_favorites');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(getSettings());
      setProducts(getProducts());
      setCategories(getCategories());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('delivery_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const storeStatus = isStoreOpen();

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const favoriteProducts = useMemo(() =>
    products.filter(p => favorites.includes(p.id) && p.active),
    [products, favorites]
  );

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.active);
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    return filtered;
  }, [products, searchTerm, activeCategory]);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart]
  );

  const cartCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    setSelectedProduct(null);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      return { ...item, quantity: newQty, subtotal: calcItemSubtotal(item) * newQty / item.quantity };
    }).map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      const baseSubtotal = calcItemSubtotal(item) * newQty;
      return { ...item, quantity: newQty, subtotal: baseSubtotal };
    }));
  };

  const calcItemSubtotal = (item: CartItem): number => {
    let base = item.product.price;
    if (item.isHalfHalf && item.halfHalfProduct) {
      base = (item.product.price + item.halfHalfProduct.price) / 2;
    }
    const addonsTotal = item.selectedAddons.reduce((sum, g) =>
      sum + g.items.reduce((s, a) => s + a.price, 0), 0);
    return (base + addonsTotal) * item.quantity;
  };

  const sendToWhatsApp = (order: Order) => {
    const phone = settings.storePhone.replace(/\D/g, '');
    if (!phone) {
      alert('Configure o número do WhatsApp nas configurações do painel admin.');
      return;
    }

    let message = `🛒 *NOVO PEDIDO - ${settings.storeName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *Cliente:* ${order.customerName}\n`;
    if (order.customerPhone) message += `📱 *Telefone:* ${order.customerPhone}\n`;
    message += `📍 *Endereço:* ${order.address}\n\n`;

    if (order.scheduledFor) {
      message += `📅 *Agendado para:* ${order.scheduledFor}\n\n`;
    }

    message += `📋 *ITENS DO PEDIDO:*\n`;
    message += `────────────────────\n`;

    order.items.forEach((item, idx) => {
      let itemName = item.product.name;
      if (item.isHalfHalf && item.halfHalfProduct) {
        itemName = `${item.product.name} + ${item.halfHalfProduct.name} (Meio a Meio)`;
      }
      message += `\n*${idx + 1}. ${itemName}*\n`;
      message += `   Qtd: ${item.quantity} | R$ ${item.subtotal.toFixed(2)}\n`;
      if (item.selectedAddons.length > 0) {
        item.selectedAddons.forEach(group => {
          if (group.items.length > 0) {
            message += `   ➕ ${group.items.map(i => `${i.name} (+R$${i.price.toFixed(2)})`).join(', ')}\n`;
          }
        });
      }
      if (item.observation) {
        message += `   📝 _${item.observation}_\n`;
      }
    });

    message += `\n────────────────────\n`;
    message += `🛵 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2)}\n`;
    message += `💰 *TOTAL: R$ ${order.total.toFixed(2)}*\n\n`;
    message += `💳 *Pagamento:* ${order.paymentMethod}`;
    if (order.change) {
      message += `\n💵 *Troco para:* ${order.change}`;
    }

    message += `\n\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⏰ Pedido enviado em ${new Date().toLocaleString('pt-BR')}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${settings.backgroundColor}ee` }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: settings.primaryColor }}>
                {settings.storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">{settings.storeName}</h1>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${storeStatus.open ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-xs ${storeStatus.open ? 'text-green-400' : 'text-red-400'}`}>
                    {storeStatus.open ? 'Aberto' : storeStatus.message}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`p-2 rounded-xl transition-all ${showFavorites ? 'text-red-400' : 'text-gray-400'}`}
              >
                <Heart size={20} fill={showFavorites ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-xl bg-gray-800/50 text-gray-300"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: settings.primaryColor }}>
                    {cartCount}
                  </span>
                )}
              </button>
              <a href="#/admin" className="p-2 rounded-xl bg-gray-800/50 text-gray-400">
                <SettingsIcon size={18} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar no cardápio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-30"
            style={{ focusRingColor: settings.primaryColor } as any}
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!searchTerm && !showFavorites && (
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'text-white' : 'bg-gray-800/60 text-gray-400'}`}
              style={activeCategory === 'all' ? { background: settings.primaryColor } : {}}
            >
              Todos
            </button>
            {sortedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'text-white' : 'bg-gray-800/60 text-gray-400'}`}
                style={activeCategory === cat.id ? { background: settings.primaryColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {showFavorites && (
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setShowFavorites(false)} className="p-1">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart size={20} className="text-red-400" fill="currentColor" /> Favoritos
            </h2>
          </div>
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">Nenhum favorito ainda</p>
              <p className="text-gray-500 text-sm mt-1">Toque no ❤️ de um produto para favoritar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  settings={settings}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      {!showFavorites && (
        <div className="max-w-2xl mx-auto px-4 pb-32">
          {searchTerm ? (
            <>
              <h2 className="text-lg font-bold mb-3">Resultados da busca</h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      settings={settings}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : activeCategory === 'all' ? (
            sortedCategories.map(cat => {
              const catProducts = products.filter(p => p.category === cat.id && p.active);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} className="mb-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Tag size={18} style={{ color: settings.primaryColor }} />
                    {cat.name}
                    <span className="text-sm font-normal text-gray-400">({catProducts.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {catProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        settings={settings}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={toggleFavorite}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <h2 className="text-lg font-bold mb-3">
                {sortedCategories.find(c => c.id === activeCategory)?.name}
              </h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Nenhum produto nesta categoria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      settings={settings}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && !showCheckout && (
        <div className="fixed bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-bold flex items-center justify-between shadow-2xl transition-all hover:scale-[1.02]"
            style={{ background: settings.primaryColor }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {cartCount}
              </div>
              <span>Ver Carrinho</span>
            </div>
            <span className="text-lg">R$ {(cartTotal + settings.deliveryFee).toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          settings={settings}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={() => toggleFavorite(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          settings={settings}
          storeStatus={storeStatus}
          onClose={() => setShowCart(false)}
          onRemove={removeFromCart}
          onUpdateQuantity={updateCartQuantity}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          settings={settings}
          storeStatus={storeStatus}
          onClose={() => setShowCheckout(false)}
          onSendOrder={sendToWhatsApp}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
        />
      )}
    </div>
  );
}

function ProductCard({ product, settings, isFavorite, onToggleFavorite, onSelect }: {
  product: Product;
  settings: StoreSettings;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60 transition-all text-left"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold" style={{ color: settings.primaryColor }}>
            R$ {product.price.toFixed(2)}
          </span>
          {product.isHalfHalf && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
              Meio a Meio
            </span>
          )}
        </div>
      </div>
      <div className="relative flex-shrink-0">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-24 h-24 rounded-xl object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-gray-700 flex items-center justify-center">
            <UtensilsCrossed size={24} className="text-gray-500" />
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(product.id); }}
          className="absolute -top-1.5 -left-1.5 p-1 rounded-full bg-gray-900/80 backdrop-blur-sm"
        >
          <Heart size={14} className={isFavorite ? 'text-red-400' : 'text-gray-400'} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </button>
  );
}

function ProductDetailModal({ product, settings, isFavorite, onToggleFavorite, onClose, onAddToCart }: {
  product: Product;
  settings: StoreSettings;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{ groupId: string; items: AddonItem[] }[]>([]);
  const [halfHalfProduct, setHalfHalfProduct] = useState<Product | null>(null);
  const [showHalfHalfPicker, setShowHalfHalfPicker] = useState(false);

  const allProducts = getProducts();
  const halfHalfOptions = allProducts.filter(p => p.active && p.category === product.category && p.id !== product.id);

  const addonsTotal = selectedAddons.reduce((sum, g) =>
    sum + g.items.reduce((s, a) => s + a.price, 0), 0);

  let basePrice = product.price;
  if (product.isHalfHalf && halfHalfProduct) {
    basePrice = (product.price + halfHalfProduct.price) / 2;
  }
  const subtotal = (basePrice + addonsTotal) * quantity;

  const toggleAddon = (groupId: string, addon: AddonItem) => {
    setSelectedAddons(prev => {
      const groupIdx = prev.findIndex(g => g.groupId === groupId);
      const group = product.addons.find(a => a.id === groupId);
      if (!group) return prev;

      if (groupIdx === -1) {
        return [...prev, { groupId, items: [addon] }];
      }

      const newGroups = [...prev];
      const itemIdx = newGroups[groupIdx].items.findIndex(i => i.id === addon.id);

      if (itemIdx === -1) {
        if (newGroups[groupIdx].items.length >= group.maxSelection) return prev;
        newGroups[groupIdx].items.push(addon);
      } else {
        newGroups[groupIdx].items.splice(itemIdx, 1);
        if (newGroups[groupIdx].items.length === 0) {
          newGroups.splice(groupIdx, 1);
        }
      }
      return newGroups;
    });
  };

  const isAddonSelected = (groupId: string, addonId: string) => {
    const group = selectedAddons.find(g => g.groupId === groupId);
    return group ? group.items.some(i => i.id === addonId) : false;
  };

  const getAddonGroupSelectedCount = (groupId: string) => {
    const group = selectedAddons.find(g => g.groupId === groupId);
    return group ? group.items.length : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Image */}
        <div className="relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-48 sm:h-56 object-cover" />
          ) : (
            <div className="w-full h-48 sm:h-56 bg-gray-700 flex items-center justify-center">
              <UtensilsCrossed size={48} className="text-gray-500" />
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 left-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white">
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm"
          >
            <Heart size={20} className={isFavorite ? 'text-red-400' : 'text-white'} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p className="text-gray-400 text-sm mt-1">{product.description}</p>
          <p className="text-xl font-bold mt-3" style={{ color: settings.primaryColor }}>
            R$ {basePrice.toFixed(2)}
          </p>

          {/* Half-Half Selection */}
          {product.isHalfHalf && (
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h3 className="font-semibold text-sm text-purple-300 mb-2">🍕 Escolha o segundo sabor:</h3>
              {halfHalfProduct ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{halfHalfProduct.name} - R$ {halfHalfProduct.price.toFixed(2)}</span>
                  <button
                    onClick={() => setHalfHalfProduct(null)}
                    className="text-xs text-red-400 underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowHalfHalfPicker(true)}
                  className="w-full py-2 rounded-lg border border-dashed border-purple-400 text-purple-300 text-sm"
                >
                  + Selecionar segundo sabor
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Preço medio a meio: R$ {halfHalfProduct ? ((product.price + halfHalfProduct.price) / 2).toFixed(2) : product.price.toFixed(2)}
              </p>
            </div>
          )}

          {/* Addons */}
          {product.addons.map(group => (
            <div key={group.id} className="mt-4">
              <h3 className="font-semibold text-sm mb-1">
                {group.name}
                <span className="text-gray-400 font-normal ml-1">
                  (máx. {group.maxSelection})
                </span>
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {getAddonGroupSelectedCount(group.id)}/{group.maxSelection} selecionados
              </p>
              <div className="space-y-1">
                {group.items.map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(group.id, addon)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${isAddonSelected(group.id, addon.id)
                      ? 'border'
                      : 'bg-gray-800/50 border border-transparent'
                      }`}
                    style={isAddonSelected(group.id, addon.id) ? { borderColor: settings.primaryColor, background: `${settings.primaryColor}10` } : {}}
                  >
                    <span>{addon.name}</span>
                    <span className={`font-medium ${addon.price > 0 ? '' : 'text-gray-500'}`}>
                      {addon.price > 0 ? `+ R$ ${addon.price.toFixed(2)}` : 'Grátis'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Observation */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-500 resize-none"
              rows={2}
              placeholder="Ex: Sem cebola, ponto da carne..."
            />
          </div>

          {/* Quantity & Add */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 rounded-l-lg hover:bg-gray-700"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 rounded-r-lg hover:bg-gray-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => onAddToCart({
                product,
                quantity,
                selectedAddons,
                observation,
                isHalfHalf: product.isHalfHalf,
                halfHalfProduct: halfHalfProduct || undefined,
                subtotal,
              })}
              className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: settings.primaryColor }}
            >
              <Plus size={18} />
              Adicionar · R$ {subtotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Half-Half Picker */}
      {showHalfHalfPicker && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-end sm:items-center justify-center">
          <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Escolha o segundo sabor</h3>
              <button onClick={() => setShowHalfHalfPicker(false)} className="p-2 rounded-lg hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {halfHalfOptions.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setHalfHalfProduct(p); setShowHalfHalfPicker(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-700" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-sm" style={{ color: settings.primaryColor }}>R$ {p.price.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartModal({ cart, settings, storeStatus, onClose, onRemove, onUpdateQuantity, onCheckout }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} /> Seu Pedido
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800"><X size={20} /></button>
        </div>

        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">Carrinho vazio</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cart.map((item: CartItem, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">
                          {item.product.name}
                          {item.isHalfHalf && item.halfHalfProduct && ` + ${item.halfHalfProduct.name}`}
                        </h4>
                        {item.observation && (
                          <p className="text-xs text-gray-400 mt-0.5">📝 {item.observation}</p>
                        )}
                        {item.selectedAddons.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            ➕ {item.selectedAddons.flatMap(g => g.items.map(i => i.name)).join(', ')}
                          </p>
                        )}
                        <p className="font-bold mt-1 text-sm" style={{ color: settings.primaryColor }}>
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-700 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(idx, -1)}
                          className="p-1.5 rounded-l-lg hover:bg-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, 1)}
                          className="p-1.5 rounded-r-lg hover:bg-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => onRemove(idx)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {cart.reduce((s: number, i: CartItem) => s + i.subtotal, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Taxa de entrega</span>
                  <span>R$ {settings.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-800">
                  <span>Total</span>
                  <span style={{ color: settings.primaryColor }}>
                    R$ {(cart.reduce((s: number, i: CartItem) => s + i.subtotal, 0) + settings.deliveryFee).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full mt-4 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: settings.primaryColor }}
              >
                <MessageCircle size={18} />
                {storeStatus.open ? 'Enviar Pedido via WhatsApp' : 'Agendar Pedido'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ cart, settings, storeStatus, onClose, onSendOrder, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime }: any) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [change, setChange] = useState('');

  const subtotal = cart.reduce((s: number, i: CartItem) => s + i.subtotal, 0);
  const total = subtotal + settings.deliveryFee;

  const handleSubmit = () => {
    if (!customerName.trim() || !address.trim() || !paymentMethod) {
      alert('Preencha nome, endereço e forma de pagamento.');
      return;
    }

    const order: Order = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      items: cart,
      deliveryFee: settings.deliveryFee,
      total,
      paymentMethod,
      change: change || undefined,
      scheduledFor: !storeStatus.open && scheduledDate ? `${scheduledDate} ${scheduledTime || 'no horário de abertura'}` : undefined,
    };

    onSendOrder(order);
    onClose();
  };

  const paymentMethods = [
    { id: 'pix', label: 'PIX', icon: QrCode },
    { id: 'cartao', label: 'Cartão', icon: CreditCard },
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle size={20} /> Finalizar Pedido
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4">
          {!storeStatus.open && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-amber-400" />
                <span className="font-semibold text-amber-300 text-sm">Loja fechada - Agendamento</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Seu pedido será preparado quando a loja estiver aberta.</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Endereço *</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500 resize-none"
              rows={2}
              placeholder="Rua, número, bairro, complemento..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento *</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${paymentMethod === method.id ? 'border-2' : 'border border-gray-700 bg-gray-800/50'}`}
                  style={paymentMethod === method.id ? { borderColor: settings.primaryColor, background: `${settings.primaryColor}10` } : {}}
                >
                  <method.icon size={20} style={{ color: paymentMethod === method.id ? settings.primaryColor : '#9CA3AF' }} />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'dinheiro' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Troco para quanto?</label>
              <input
                type="text"
                value={change}
                onChange={e => setChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
                placeholder="Ex: R$ 50,00"
              />
            </div>
          )}

          {/* Summary */}
          <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
            <h4 className="font-semibold text-sm mb-2">Resumo do Pedido</h4>
            {cart.map((item: CartItem, idx: number) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-gray-300">{item.quantity}x {item.product.name}</span>
                <span>R$ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-gray-700 mt-2">
              <span>Taxa de entrega</span>
              <span>R$ {settings.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-700 mt-2">
              <span>Total</span>
              <span style={{ color: settings.primaryColor }}>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: settings.primaryColor }}
          >
            <MessageCircle size={18} />
            {storeStatus.open ? 'Enviar Pedido via WhatsApp' : 'Agendar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PackageIcon({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
