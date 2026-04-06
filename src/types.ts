export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  active: boolean;
  favorite?: boolean;
  addons: AddonGroup[];
  isHalfHalf?: boolean;
  halfHalfOptions?: string[];
  halfHalfPrice?: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  items: AddonItem[];
  maxSelection: number;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  footerText: string;
  deliveryFee: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  schedule: DaySchedule[];
  halfHalfEnabled: boolean;
  halfHalfCategories: string[];
}

export interface DaySchedule {
  day: string;
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: { groupId: string; items: AddonItem[] }[];
  observation: string;
  isHalfHalf?: boolean;
  halfHalfProduct?: Product;
  subtotal: number;
}

export interface Order {
  customerName: string;
  customerPhone: string;
  address: string;
  items: CartItem[];
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  change?: string;
  scheduledFor?: string;
}
