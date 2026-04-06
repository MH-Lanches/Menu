import { StoreData } from '../types';

export const initialStoreData: StoreData = {
  categories: [
    { id: 'cat-1', name: 'Lanches', icon: '🍔', order: 1, active: true },
    { id: 'cat-2', name: 'Pizzas', icon: '🍕', order: 2, active: true },
    { id: 'cat-3', name: 'Bebidas', icon: '🥤', order: 3, active: true },
    { id: 'cat-4', name: 'Sobremesas', icon: '🍰', order: 4, active: true },
    { id: 'cat-5', name: 'Combos', icon: '🎁', order: 5, active: true },
  ],
  products: [
    {
      id: 'prod-1',
      name: 'X-Burger Clássico',
      description: 'Pão brioche, hambúrguer 180g, queijo cheddar, alface, tomate e molho especial',
      price: 25.90,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
      categoryId: 'cat-1',
      active: true,
      additionalBars: [
        {
          id: 'bar-1',
          name: 'Adicionais de Carne',
          maxSelection: 3,
          required: false,
          items: [
            { id: 'add-1', name: 'Hambúrguer Extra', price: 8.00 },
            { id: 'add-2', name: 'Bacon', price: 5.00 },
            { id: 'add-3', name: 'Ovo', price: 3.00 },
          ]
        },
        {
          id: 'bar-2',
          name: 'Molhos',
          maxSelection: 2,
          required: false,
          items: [
            { id: 'add-4', name: 'Molho Barbecue', price: 2.00 },
            { id: 'add-5', name: 'Maionese da Casa', price: 2.00 },
            { id: 'add-6', name: 'Mostarda e Mel', price: 2.50 },
          ]
        }
      ]
    },
    {
      id: 'prod-2',
      name: 'X-Bacon Premium',
      description: 'Pão australiano, hambúrguer 200g, muito bacon crocante, queijo e cebola caramelizada',
      price: 32.90,
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop',
      categoryId: 'cat-1',
      active: true,
      additionalBars: [
        {
          id: 'bar-3',
          name: 'Extras',
          maxSelection: 5,
          required: false,
          items: [
            { id: 'add-7', name: 'Bacon Extra', price: 6.00 },
            { id: 'add-8', name: 'Cebola Crispy', price: 4.00 },
            { id: 'add-9', name: 'Jalapeño', price: 3.00 },
          ]
        }
      ]
    },
    {
      id: 'prod-3',
      name: 'Pizza Margherita',
      description: 'Molho de tomate, mussarela, tomate fresco e manjericão',
      price: 45.90,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop',
      categoryId: 'cat-2',
      active: true,
      isPizza: true,
      allowHalf: true,
      additionalBars: [
        {
          id: 'bar-4',
          name: 'Bordas',
          maxSelection: 1,
          required: false,
          items: [
            { id: 'add-10', name: 'Borda Catupiry', price: 8.00 },
            { id: 'add-11', name: 'Borda Cheddar', price: 8.00 },
          ]
        }
      ]
    },
    {
      id: 'prod-4',
      name: 'Pizza Calabresa',
      description: 'Molho de tomate, mussarela, calabresa fatiada e cebola',
      price: 42.90,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
      categoryId: 'cat-2',
      active: true,
      isPizza: true,
      allowHalf: true,
      additionalBars: [
        {
          id: 'bar-5',
          name: 'Bordas',
          maxSelection: 1,
          required: false,
          items: [
            { id: 'add-12', name: 'Borda Catupiry', price: 8.00 },
            { id: 'add-13', name: 'Borda Cheddar', price: 8.00 },
          ]
        }
      ]
    },
    {
      id: 'prod-5',
      name: 'Refrigerante Lata',
      description: 'Coca-Cola, Guaraná ou Fanta - 350ml',
      price: 6.00,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop',
      categoryId: 'cat-3',
      active: true,
      additionalBars: []
    },
    {
      id: 'prod-6',
      name: 'Suco Natural',
      description: 'Laranja, Limão ou Maracujá - 500ml',
      price: 10.00,
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop',
      categoryId: 'cat-3',
      active: true,
      additionalBars: []
    },
    {
      id: 'prod-7',
      name: 'Brownie com Sorvete',
      description: 'Brownie artesanal com sorvete de creme e calda de chocolate',
      price: 18.90,
      image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=400&fit=crop',
      categoryId: 'cat-4',
      active: true,
      additionalBars: [
        {
          id: 'bar-6',
          name: 'Coberturas',
          maxSelection: 2,
          required: false,
          items: [
            { id: 'add-14', name: 'Calda Extra', price: 3.00 },
            { id: 'add-15', name: 'Granulado', price: 2.00 },
          ]
        }
      ]
    },
    {
      id: 'prod-8',
      name: 'Combo Família',
      description: '2 X-Burgers + 1 Porção de Batata + 2 Refrigerantes',
      price: 69.90,
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop',
      categoryId: 'cat-5',
      active: true,
      additionalBars: []
    }
  ],
  settings: {
    storeName: 'Delivery Express',
    footerText: '© 2024 Delivery Express - Todos os direitos reservados',
    whatsappNumber: '5511999999999',
    deliveryFee: 5.00,
    minOrder: 20.00,
    primaryColor: '#ef4444',
    secondaryColor: '#f97316',
    accentColor: '#22c55e',
    logo: '',
    bannerImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
    address: 'Rua das Delícias, 123 - Centro',
    acceptScheduling: true,
    businessHours: {
      sunday: { open: '18:00', close: '23:00', enabled: false },
      monday: { open: '18:00', close: '23:00', enabled: true },
      tuesday: { open: '18:00', close: '23:00', enabled: true },
      wednesday: { open: '18:00', close: '23:00', enabled: true },
      thursday: { open: '18:00', close: '23:00', enabled: true },
      friday: { open: '18:00', close: '00:00', enabled: true },
      saturday: { open: '18:00', close: '00:00', enabled: true },
    }
  }
};
