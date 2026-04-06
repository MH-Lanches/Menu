import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ScheduleDay = { open: string; close: string; isOpen: boolean };

export type Settings = {
  storeName: string;
  primaryColor: string;
  footerText: string;
  deliveryFee: number;
  whatsappNumber: string;
  schedule: Record<number, ScheduleDay>; // 0 = Sunday, 1 = Monday, etc.
};

export type Category = {
  id: string;
  name: string;
  order: number;
  isHalfHalfAllowed: boolean;
};

export type AddonItem = {
  id: string;
  name: string;
  price: number;
};

export type AddonGroup = {
  id: string;
  name: string;
  max: number;
  addons: AddonItem[];
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  isActive: boolean;
  addonGroups: AddonGroup[];
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  notes: string;
  addons: Record<string, AddonItem[]>; // groupId -> selected addons
  isHalfHalf: boolean;
  halfProductId?: string; // If half-and-half, the other product ID
  price: number;
};

type DataContextType = {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id' | 'order'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  reorderCategories: (id: string, direction: 'up' | 'down') => void;
  products: Product[];
  addProduct: (prod: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartItemQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isStoreOpen: () => boolean;
};

const defaultSettings: Settings = {
  storeName: "Meu Delivery",
  primaryColor: "#ef4444",
  footerText: "© 2026 Meu Delivery - Todos os direitos reservados",
  deliveryFee: 5.00,
  whatsappNumber: "5511999999999",
  schedule: {
    0: { open: "18:00", close: "23:59", isOpen: true },
    1: { open: "18:00", close: "23:59", isOpen: true },
    2: { open: "18:00", close: "23:59", isOpen: true },
    3: { open: "18:00", close: "23:59", isOpen: true },
    4: { open: "18:00", close: "23:59", isOpen: true },
    5: { open: "18:00", close: "23:59", isOpen: true },
    6: { open: "18:00", close: "23:59", isOpen: true },
  }
};

const defaultCategories: Category[] = [
  { id: 'cat_1', name: 'Lanches', order: 1, isHalfHalfAllowed: false },
  { id: 'cat_2', name: 'Pizzas', order: 2, isHalfHalfAllowed: true },
  { id: 'cat_3', name: 'Bebidas', order: 3, isHalfHalfAllowed: false },
];

const defaultProducts: Product[] = [
  {
    id: 'prod_1',
    categoryId: 'cat_1',
    name: 'X-Burger',
    price: 25.00,
    description: 'Pão, carne artesanal 150g e queijo prato.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500',
    isActive: true,
    addonGroups: [
      {
        id: 'ag_1',
        name: 'Adicionais',
        max: 3,
        addons: [
          { id: 'a_1', name: 'Bacon', price: 4 },
          { id: 'a_2', name: 'Ovo', price: 2 },
          { id: 'a_3', name: 'Cheddar', price: 3 }
        ]
      }
    ]
  },
  {
    id: 'prod_2',
    categoryId: 'cat_2',
    name: 'Pizza Calabresa',
    price: 45.00,
    description: 'Calabresa fatiada, cebola e azeitonas.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=500',
    isActive: true,
    addonGroups: []
  },
  {
    id: 'prod_3',
    categoryId: 'cat_2',
    name: 'Pizza Marguerita',
    price: 42.00,
    description: 'Mussarela, tomate e manjericão fresco.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500',
    isActive: true,
    addonGroups: []
  }
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = localStorage.getItem('delivery_settings');
    return s ? JSON.parse(s) : defaultSettings;
  });
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const c = localStorage.getItem('delivery_categories');
    return c ? JSON.parse(c) : defaultCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const p = localStorage.getItem('delivery_products');
    return p ? JSON.parse(p) : defaultProducts;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const c = localStorage.getItem('delivery_cart');
    return c ? JSON.parse(c) : [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const f = localStorage.getItem('delivery_favorites');
    return f ? JSON.parse(f) : [];
  });

  useEffect(() => localStorage.setItem('delivery_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('delivery_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('delivery_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('delivery_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('delivery_favorites', JSON.stringify(favorites)), [favorites]);

  const updateSettings = (newSettings: Partial<Settings>) => setSettings(s => ({ ...s, ...newSettings }));

  const addCategory = (cat: Omit<Category, 'id' | 'order'>) => {
    const newId = `cat_${Date.now()}`;
    const order = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 1;
    setCategories(prev => [...prev, { ...cat, id: newId, order }]);
  };

  const updateCategory = (id: string, cat: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...cat } : c));
  };

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    // also remove products? let's just leave products orphaned or let admin handle it
  };

  const reorderCategories = (id: string, direction: 'up' | 'down') => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      
      const newCats = [...prev];
      const temp = newCats[idx].order;
      newCats[idx].order = newCats[targetIdx].order;
      newCats[targetIdx].order = temp;
      
      return newCats.sort((a, b) => a.order - b.order);
    });
  };

  const addProduct = (prod: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...prod, id: `prod_${Date.now()}` }]);
  };

  const updateProduct = (id: string, prod: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...prod } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart(prev => [...prev, { ...item, id: `cart_${Date.now()}_${Math.random()}` }]);
  };

  const updateCartItemQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isStoreOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const scheduleDay = settings.schedule[day];
    
    if (!scheduleDay || !scheduleDay.isOpen) return false;
    
    const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // Handle overnight shifts if close < open
    if (scheduleDay.close < scheduleDay.open) {
      return timeStr >= scheduleDay.open || timeStr <= scheduleDay.close;
    }
    
    return timeStr >= scheduleDay.open && timeStr <= scheduleDay.close;
  };

  return (
    <DataContext.Provider value={{
      settings, updateSettings,
      categories, addCategory, updateCategory, removeCategory, reorderCategories,
      products, addProduct, updateProduct, removeProduct, toggleProductActive,
      cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart,
      favorites, toggleFavorite,
      isStoreOpen
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
