export interface Additional {
  id: string;
  name: string;
  price: number;
}

export interface AdditionalBar {
  id: string;
  name: string;
  items: Additional[];
  maxSelection: number;
  required: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  active: boolean;
  additionalBars: AdditionalBar[];
  isPizza?: boolean;
  allowHalf?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

export interface StoreSettings {
  storeName: string;
  footerText: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrder: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  businessHours: BusinessHours;
  acceptScheduling: boolean;
  logo: string;
  bannerImage: string;
  address: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedAdditionals: { barId: string; items: Additional[] }[];
  observations: string;
  isHalf?: boolean;
  halfProduct?: Product;
  halfAdditionals?: { barId: string; items: Additional[] }[];
  unitPrice: number;
}

export interface Favorite {
  productId: string;
  addedAt: number;
}

export interface StoreData {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'sunday', label: 'Domingo' },
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
];
