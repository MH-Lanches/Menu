import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdditionalItem {
  id: string;
  name: string;
  price: number;
}

export interface AdditionalBar {
  id: string;
  name: string;
  limit: number;
  items: AdditionalItem[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: string;
  active: boolean;
  isPizza: boolean;
  additionals: AdditionalBar[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Config {
  primaryColor: string;
  footerText: string;
  deliveryFee: number;
  phone: string;
  schedule: Record<number, DaySchedule>;
}

interface StoreState {
  products: Product[];
  categories: Category[];
  config: Config;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategory: (id: string, direction: 'up' | 'down') => void;
  
  updateConfig: (config: Partial<Config>) => void;
  updateSchedule: (day: number, schedule: Partial<DaySchedule>) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const defaultSchedule = {
  0: { isOpen: true, openTime: '18:00', closeTime: '23:00' }, // Sun
  1: { isOpen: false, openTime: '18:00', closeTime: '23:00' }, // Mon
  2: { isOpen: true, openTime: '18:00', closeTime: '23:00' }, // Tue
  3: { isOpen: true, openTime: '18:00', closeTime: '23:00' }, // Wed
  4: { isOpen: true, openTime: '18:00', closeTime: '23:00' }, // Thu
  5: { isOpen: true, openTime: '18:00', closeTime: '23:59' }, // Fri
  6: { isOpen: true, openTime: '18:00', closeTime: '23:59' }, // Sat
};

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Lanches', order: 1 },
  { id: 'cat-2', name: 'Pizzas', order: 2 },
  { id: 'cat-3', name: 'Bebidas', order: 3 },
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'X-Tudo',
    price: 25.90,
    description: 'Hambúrguer 200g, queijo, presunto, bacon, ovo, alface e tomate.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
    categoryId: 'cat-1',
    active: true,
    isPizza: false,
    additionals: [
      {
        id: 'add-bar-1',
        name: 'Adicionais',
        limit: 3,
        items: [
          { id: 'item-1', name: 'Bacon Extra', price: 4.0 },
          { id: 'item-2', name: 'Ovo', price: 2.0 },
        ]
      }
    ]
  },
  {
    id: 'prod-2',
    name: 'Pizza Calabresa',
    price: 45.00,
    description: 'Molho de tomate, mussarela, calabresa fatiada e cebola.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
    categoryId: 'cat-2',
    active: true,
    isPizza: true,
    additionals: []
  },
  {
    id: 'prod-3',
    name: 'Pizza Marguerita',
    price: 42.00,
    description: 'Molho de tomate, mussarela, tomate e manjericão fresco.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
    categoryId: 'cat-2',
    active: true,
    isPizza: true,
    additionals: []
  }
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: initialProducts,
      categories: initialCategories,
      config: {
        primaryColor: '#ef4444', // red-500
        footerText: 'Delivery App © 2026',
        deliveryFee: 5.0,
        phone: '5511999999999',
        schedule: defaultSchedule,
      },
      favorites: [],

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: generateId() }]
      })),
      
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      toggleProductActive: (id) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, active: !p.active } : p)
      })),

      addCategory: (name) => set((state) => {
        const maxOrder = Math.max(0, ...state.categories.map(c => c.order));
        return {
          categories: [...state.categories, { id: generateId(), name, order: maxOrder + 1 }]
        };
      }),

      updateCategory: (id, name) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, name } : c)
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      reorderCategory: (id, direction) => set((state) => {
        const cats = [...state.categories].sort((a, b) => a.order - b.order);
        const index = cats.findIndex(c => c.id === id);
        if (index < 0) return state;
        
        if (direction === 'up' && index > 0) {
          const temp = cats[index].order;
          cats[index].order = cats[index - 1].order;
          cats[index - 1].order = temp;
        } else if (direction === 'down' && index < cats.length - 1) {
          const temp = cats[index].order;
          cats[index].order = cats[index + 1].order;
          cats[index + 1].order = temp;
        }
        
        return { categories: cats };
      }),

      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates }
      })),

      updateSchedule: (day, schedule) => set((state) => ({
        config: {
          ...state.config,
          schedule: {
            ...state.config.schedule,
            [day]: { ...state.config.schedule[day], ...schedule }
          }
        }
      })),

      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id) 
          ? state.favorites.filter(fId => fId !== id)
          : [...state.favorites, id]
      }))
    }),
    {
      name: 'delivery-storage',
    }
  )
);