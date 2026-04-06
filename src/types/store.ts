export interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

export interface ExtraBar {
  name: string;
  maxSelection: number;
  items: ExtraItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isActive: boolean;
  isHalfAndHalf?: boolean;
  extraBars?: ExtraBar[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface DayConfig {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface StoreConfig {
  name: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  deliveryFee: number;
  openingHours: Record<string, DayConfig>;
}

export interface AppState {
  products: Product[];
  categories: Category[];
  config: StoreConfig;
}

export const initialState: AppState = {
  products: [],
  categories: [],
  config: {
    name: "Meu Delivery",
    footerText: "© 2024 Meu Delivery - Todos os direitos reservados",
    primaryColor: "#ef4444",
    secondaryColor: "#1f2937",
    deliveryFee: 5.00,
    openingHours: {
      "0": { open: "18:00", close: "23:00", isOpen: true },
      "1": { open: "18:00", close: "23:00", isOpen: true },
      "2": { open: "18:00", close: "23:00", isOpen: true },
      "3": { open: "18:00", close: "23:00", isOpen: true },
      "4": { open: "18:00", close: "23:00", isOpen: true },
      "5": { open: "18:00", close: "23:00", isOpen: false },
      "6": { open: "00:00", close: "00:00", isOpen: false },
    }
  }
};
