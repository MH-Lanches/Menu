import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, StoreSettings, OperatingHour } from './types';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: StoreSettings = {
  name: 'Meu Delivery',
  footerText: '© 2024 Meu Delivery - Todos os direitos reservados',
  deliveryFee: 5.0,
  primaryColor: '#e11d48',
  secondaryColor: '#fb7185',
  whatsappNumber: '5500000000000',
  operatingHours: [
    { day: 0, open: '18:00', close: '23:00', closed: false },
    { day: 1, open: '18:00', close: '23:00', closed: false },
    { day: 2, open: '18:00', close: '23:00', closed: false },
    { day: 3, open: '18:00', close: '23:00', closed: false },
    { day: 4, open: '18:00', close: '23:00', closed: false },
    { day: 5, open: '18:00', close: '23:00', closed: false },
    { day: 6, open: '18:00', close: '23:00', closed: false },
  ],
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Lanches', order: 0 },
  { id: '2', name: 'Bebidas', order: 1 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'X-Burger Especial',
    description: 'Pão, carne 180g, queijo, alface, tomate e maionese da casa.',
    price: 25.0,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58kk',
    categoryId: '1',
    active: true,
    additionGroups: [
      {
        id: 'ag1',
        name: 'Adicionais',
        min: 0,
        max: 5,
        options: [
          { id: 'a1', name: 'Bacon extra', price: 3.0 },
          { id: 'a2', name: 'Ovo', price: 2.0 },
          { id: 'a3', name: 'Queijo extra', price: 3.0 },
        ],
      },
    ],
  },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const saveToStorage = () => {
    localStorage.setItem('delivery_products', JSON.stringify(products));
    localStorage.setItem('delivery_categories', JSON.stringify(categories));
    localStorage.setItem('delivery_settings', JSON.stringify(settings));
  };

  const loadFromStorage = () => {
    const storedProducts = localStorage.getItem('delivery_products');
    const storedCategories = localStorage.getItem('delivery_categories');
    const storedSettings = localStorage.getItem('delivery_settings');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    else setProducts(DEFAULT_PRODUCTS);

    if (storedCategories) setCategories(JSON.parse(storedCategories));
    else setCategories(DEFAULT_CATEGORIES);

    if (storedSettings) setSettings(JSON.parse(storedSettings));
    else setSettings(DEFAULT_SETTINGS);
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <StoreContext.Provider value={{ products, categories, settings, setProducts, setCategories, setSettings, saveToStorage, loadFromStorage }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
