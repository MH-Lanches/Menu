import { useState, useEffect, useCallback } from 'react';
import { StoreData, Product, Category, StoreSettings, CartItem, Favorite, DayOfWeek } from '../types';
import { initialStoreData } from '../data/initialData';

const STORE_KEY = 'delivery_store_data';
const CART_KEY = 'delivery_cart';
const FAVORITES_KEY = 'delivery_favorites';

export function useStore() {
  const [storeData, setStoreData] = useState<StoreData>(() => {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialStoreData;
      }
    }
    return initialStoreData;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(storeData));
  }, [storeData]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Check if store is open
  const isStoreOpen = useCallback((): boolean => {
    const now = new Date();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const hours = storeData.settings.businessHours[currentDay];
    
    if (!hours || !hours.enabled) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    let closeTime = closeHour * 60 + closeMin;
    
    // Handle closing after midnight
    if (closeTime < openTime) {
      closeTime += 24 * 60;
      const adjustedCurrentTime = currentTime < openTime ? currentTime + 24 * 60 : currentTime;
      return adjustedCurrentTime >= openTime && adjustedCurrentTime < closeTime;
    }
    
    return currentTime >= openTime && currentTime < closeTime;
  }, [storeData.settings.businessHours]);

  // Product operations
  const addProduct = useCallback((product: Product) => {
    setStoreData(prev => ({
      ...prev,
      products: [...prev.products, product]
    }));
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setStoreData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p)
    }));
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setStoreData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  }, []);

  const toggleProductActive = useCallback((productId: string) => {
    setStoreData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, active: !p.active } : p
      )
    }));
  }, []);

  // Category operations
  const addCategory = useCallback((category: Category) => {
    setStoreData(prev => ({
      ...prev,
      categories: [...prev.categories, category]
    }));
  }, []);

  const updateCategory = useCallback((category: Category) => {
    setStoreData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === category.id ? category : c)
    }));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setStoreData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryId),
      products: prev.products.filter(p => p.categoryId !== categoryId)
    }));
  }, []);

  const reorderCategories = useCallback((categoryId: string, direction: 'up' | 'down') => {
    setStoreData(prev => {
      const sorted = [...prev.categories].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(c => c.id === categoryId);
      
      if (direction === 'up' && index > 0) {
        const temp = sorted[index].order;
        sorted[index].order = sorted[index - 1].order;
        sorted[index - 1].order = temp;
      } else if (direction === 'down' && index < sorted.length - 1) {
        const temp = sorted[index].order;
        sorted[index].order = sorted[index + 1].order;
        sorted[index + 1].order = temp;
      }
      
      return { ...prev, categories: sorted };
    });
  }, []);

  // Settings operations
  const updateSettings = useCallback((settings: Partial<StoreSettings>) => {
    setStoreData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  }, []);

  // Cart operations
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => [...prev, item]);
  }, []);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const getCartItemsCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Favorites operations
  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.productId === productId);
      if (exists) {
        return prev.filter(f => f.productId !== productId);
      }
      return [...prev, { productId, addedAt: Date.now() }];
    });
  }, []);

  const isFavorite = useCallback((productId: string) => {
    return favorites.some(f => f.productId === productId);
  }, [favorites]);

  const getFavoriteProducts = useCallback(() => {
    return storeData.products.filter(p => 
      favorites.some(f => f.productId === p.id) && p.active
    );
  }, [storeData.products, favorites]);

  // Apply theme colors
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', storeData.settings.primaryColor);
    document.documentElement.style.setProperty('--secondary', storeData.settings.secondaryColor);
    document.documentElement.style.setProperty('--accent', storeData.settings.accentColor);
  }, [storeData.settings.primaryColor, storeData.settings.secondaryColor, storeData.settings.accentColor]);

  return {
    storeData,
    cart,
    favorites,
    isStoreOpen,
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    // Categories
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    // Settings
    updateSettings,
    // Cart
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    // Favorites
    toggleFavorite,
    isFavorite,
    getFavoriteProducts,
  };
}
