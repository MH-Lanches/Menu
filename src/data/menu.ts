export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  badgeColor?: string;
  rating: number;
  reviews: number;
  time: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const categories: Category[] = [
  { id: "all", label: "Todos", icon: "🍽️" },
  { id: "burgers", label: "Burgers", icon: "🍔" },
  { id: "hotdog", label: "Hot Dogs", icon: "🌭" },
  { id: "pizza", label: "Pizzas", icon: "🍕" },
  { id: "fries", label: "Batatas", icon: "🍟" },
  { id: "drinks", label: "Bebidas", icon: "🥤" },
  { id: "desserts", label: "Sobremesas", icon: "🍨" },
];

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Smash Burger Clássico",
    description: "Blend 180g, queijo cheddar, alface, tomate, picles e molho especial da casa",
    price: 28.90,
    originalPrice: 34.90,
    image: "/images/burger-classic.png",
    category: "burgers",
    badge: "🔥 Top",
    badgeColor: "bg-red-500",
    rating: 4.9,
    reviews: 842,
    time: "25 min",
    popular: true,
  },
  {
    id: 2,
    name: "Double Smash BBQ",
    description: "Dois blends 120g, cheddar duplo, bacon crocante, cebola caramelizada e BBQ",
    price: 39.90,
    image: "/images/burger-classic.png",
    category: "burgers",
    badge: "⚡ Novo",
    badgeColor: "bg-purple-500",
    rating: 4.8,
    reviews: 310,
    time: "30 min",
    popular: true,
  },
  {
    id: 3,
    name: "Hot Dog Gourmet",
    description: "Salsicha artesanal, mostarda dijon, maionese de alho, vinagrete e batata palha",
    price: 19.90,
    originalPrice: 24.90,
    image: "/images/hot-dog.png",
    category: "hotdog",
    badge: "💛 Favorito",
    badgeColor: "bg-yellow-500",
    rating: 4.7,
    reviews: 567,
    time: "20 min",
    popular: true,
  },
  {
    id: 4,
    name: "Hot Dog Churrasco",
    description: "Salsicha grelhada, molho churrasco, cebola tostada, queijo ralado e orégano",
    price: 22.90,
    image: "/images/hot-dog.png",
    category: "hotdog",
    rating: 4.6,
    reviews: 221,
    time: "20 min",
  },
  {
    id: 5,
    name: "Pizza Pepperoni",
    description: "Molho de tomate artesanal, mussarela premium, fatias de pepperoni e azeitonas",
    price: 49.90,
    image: "/images/pizza-slice.png",
    category: "pizza",
    badge: "🍕 Chef",
    badgeColor: "bg-orange-500",
    rating: 4.9,
    reviews: 1203,
    time: "40 min",
    popular: true,
  },
  {
    id: 6,
    name: "Pizza 4 Queijos",
    description: "Mussarela, parmesão, gorgonzola e catupiry, finalizada com azeite e manjericão",
    price: 52.90,
    originalPrice: 58.90,
    image: "/images/pizza-slice.png",
    category: "pizza",
    rating: 4.8,
    reviews: 744,
    time: "40 min",
  },
  {
    id: 7,
    name: "Batata Frita Rústica",
    description: "Batatas em palito finas e crocantes, temperadas com sal, páprica e alecrim",
    price: 14.90,
    image: "/images/fries.png",
    category: "fries",
    badge: "🥔 Crocante",
    badgeColor: "bg-yellow-600",
    rating: 4.7,
    reviews: 923,
    time: "15 min",
    popular: true,
  },
  {
    id: 8,
    name: "Batata Loaded",
    description: "Batata frita, cheddar derretido, bacon bits, cebolinha e creme azedo",
    price: 24.90,
    image: "/images/fries.png",
    category: "fries",
    rating: 4.9,
    reviews: 411,
    time: "20 min",
  },
  {
    id: 9,
    name: "Refrigerante 350ml",
    description: "Coca-Cola, Guaraná Antarctica, Fanta Laranja ou Sprite gelados",
    price: 6.90,
    image: "/images/fries.png",
    category: "drinks",
    rating: 4.5,
    reviews: 1840,
    time: "5 min",
  },
  {
    id: 10,
    name: "Milkshake Artesanal",
    description: "Escolha: Chocolate, Morango, Baunilha ou Ovomaltine — 500ml cremoso",
    price: 22.90,
    originalPrice: 27.90,
    image: "/images/fries.png",
    category: "drinks",
    badge: "🥛 Premium",
    badgeColor: "bg-pink-500",
    rating: 4.9,
    reviews: 678,
    time: "10 min",
    popular: true,
  },
];

export const promos = [
  {
    id: 1,
    title: "Combo do Dia",
    subtitle: "Burger + Fritas + Refri",
    discount: "30% OFF",
    color: "from-red-600 to-red-400",
    emoji: "🍔",
  },
  {
    id: 2,
    title: "Frete GRÁTIS",
    subtitle: "Pedidos acima de R$ 50",
    discount: "Hoje!",
    color: "from-orange-500 to-yellow-400",
    emoji: "🛵",
  },
  {
    id: 3,
    title: "Pizza Família",
    subtitle: "Grande + 2 Refris",
    discount: "25% OFF",
    color: "from-purple-600 to-pink-400",
    emoji: "🍕",
  },
];
