export type Addition = {
  id: string;
  name: string;
  price: number;
};

export type AdditionGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  options: Addition[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  active: boolean;
  additionGroups: AdditionGroup[];
  isPizza?: boolean;
};

export type Category = {
  id: string;
  name: string;
  order: number;
};

export type OperatingHour = {
  day: number; // 0-6
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  closed: boolean;
};

export type StoreSettings = {
  name: string;
  footerText: string;
  deliveryFee: number;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string;
  operatingHours: OperatingHour[];
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  observations: string;
  selectedAdditions: { groupId: string; additions: Addition[] }[];
  halfAndHalf?: {
    otherProductId: string;
    otherProductName: string;
    otherPrice: number;
  };
};
