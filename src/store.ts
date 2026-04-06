import { Category, Product, StoreSettings } from './types';

const defaultSchedule = [
  { day: 'Segunda', open: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Terça', open: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Quarta', open: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Quinta', open: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Sexta', open: true, openTime: '09:00', closeTime: '23:00' },
  { day: 'Sábado', open: true, openTime: '09:00', closeTime: '23:00' },
  { day: 'Domingo', open: true, openTime: '10:00', closeTime: '22:00' },
];

export const defaultSettings: StoreSettings = {
  storeName: 'Meu Delivery',
  storePhone: '',
  footerText: '© 2025 Meu Delivery - Todos os direitos reservados',
  deliveryFee: 5.00,
  primaryColor: '#FF4500',
  secondaryColor: '#FF6B35',
  accentColor: '#FFD700',
  backgroundColor: '#0F0F0F',
  textColor: '#FFFFFF',
  schedule: defaultSchedule,
  halfHalfEnabled: true,
  halfHalfCategories: [],
};

export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem('delivery_products');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem('delivery_products', JSON.stringify(products));
};

export const getCategories = (): Category[] => {
  try {
    const data = localStorage.getItem('delivery_categories');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem('delivery_categories', JSON.stringify(categories));
};

export const getSettings = (): StoreSettings => {
  try {
    const data = localStorage.getItem('delivery_settings');
    return data ? { ...defaultSettings, ...JSON.parse(data) } : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
};

export const saveSettings = (settings: StoreSettings) => {
  localStorage.setItem('delivery_settings', JSON.stringify(settings));
};

export const isStoreOpen = (): { open: boolean; message: string } => {
  const settings = getSettings();
  const now = new Date();
  const dayIndex = now.getDay();
  const dayMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const currentDay = dayMap[dayIndex];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const schedule = settings.schedule.find(s => s.day === currentDay);
  if (!schedule || !schedule.open) {
    return { open: false, message: 'Loja fechada hoje' };
  }

  const [openH, openM] = schedule.openTime.split(':').map(Number);
  const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentTime >= openMinutes && currentTime <= closeMinutes) {
    return { open: true, message: 'Loja aberta' };
  }

  if (currentTime < openMinutes) {
    return { open: false, message: `Abre às ${schedule.openTime}` };
  }
  return { open: false, message: `Fecha às ${schedule.closeTime}` };
};
