export interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

export type ProductType = 'simple' | 'halfhalf' | 'special';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: ProductType;
  images: string[];
  addons: string[];
  flavors?: string[];
  maxFlavors?: number;
  active: boolean;
  halfPrice?: boolean;
}

export const defaultAddons: Addon[] = [
  { id: 'a1', name: 'Bacon', price: 3.00, category: 'pizzas', active: true },
  { id: 'a2', name: 'Cheddar', price: 3.00, category: 'pizzas', active: true },
  { id: 'a3', name: 'Catupiry', price: 3.50, category: 'pizzas', active: true },
  { id: 'a4', name: 'Borda Recheada', price: 5.00, category: 'pizzas', active: true },
  { id: 'a5', name: 'Queijo Extra', price: 4.00, category: 'pizzas', active: true },
  { id: 'a6', name: 'Azeitona', price: 2.00, category: 'pizzas', active: true },
  { id: 'a7', name: 'Milho', price: 2.00, category: 'pizzas', active: true },
  { id: 'a8', name: 'Cebola', price: 1.50, category: 'pizzas', active: true },
  { id: 'a9', name: 'Presunto', price: 3.00, category: 'pizzas', active: true },
  { id: 'a10', name: 'Calabresa', price: 3.00, category: 'pizzas', active: true },
  { id: 'a11', name: 'Requeijão', price: 3.00, category: 'pastels', active: true },
  { id: 'a12', name: 'Catupiry (Pastel)', price: 3.50, category: 'pastels', active: true },
  { id: 'a13', name: 'Cheddar (Pastel)', price: 3.00, category: 'pastels', active: true },
  { id: 'a14', name: 'Bacon (Pastel)', price: 3.00, category: 'pastels', active: true },
  { id: 'a15', name: 'Queijo Extra (Pastel)', price: 4.00, category: 'pastels', active: true },
  { id: 'a16', name: 'Ovo', price: 2.00, category: 'burgers', active: true },
  { id: 'a17', name: 'Bacon (Burger)', price: 3.00, category: 'burgers', active: true },
  { id: 'a18', name: 'Queijo Extra (Burger)', price: 3.50, category: 'burgers', active: true },
  { id: 'a19', name: 'Molho Especial', price: 2.00, category: 'burgers', active: true },
  { id: 'a20', name: 'Cebola Caramelizada', price: 2.50, category: 'burgers', active: true },
];

export const defaultProducts: Product[] = [
  // HAMBURGUERES (10)
  { id: 'h1', name: 'X-Burger Clássico', description: 'Hambúrguer 150g, queijo, alface, tomate e molho da casa.', price: 22.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h2', name: 'X-Bacon', description: 'Hambúrguer 150g, bacon crocante, queijo, alface e tomate.', price: 26.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h3', name: 'X-Salada', description: 'Hambúrguer 150g, queijo, alface, tomate, cebola e maionese.', price: 20.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h4', name: 'X-Egg', description: 'Hambúrguer 150g, ovo, queijo, alface e tomate.', price: 24.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h5', name: 'X-Tudo', description: 'Hambúrguer 180g, ovo, bacon, presunto, queijo, milho, alface e tomate.', price: 32.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h6', name: 'Duplo Burger', description: 'Dois hambúrgueres 150g, queijo cheddar, cebola caramelizada e molho especial.', price: 34.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h7', name: 'Cheese Burger', description: 'Hambúrguer 180g, muito queijo cheddar derretido e molho da casa.', price: 28.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h8', name: 'Chicken Burger', description: 'Frango empanado crocante, alface, tomate e maionese de ervas.', price: 24.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h9', name: 'Smash Burger', description: 'Dois smash 90g, queijo, cebola, picles e molho secreto.', price: 30.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },
  { id: 'h10', name: 'Veggie Burger', description: 'Hambúrguer vegetal, queijo, rúcula, tomate seco e molho vegano.', price: 26.00, category: 'Hambúrgueres', type: 'simple', images: [], addons: ['a16','a17','a18','a19','a20'], active: true },

  // PIZZAS - MEIO A MEIO (10)
  { id: 'p1', name: 'Pizza Calabresa', description: 'Calabresa fatiada, cebola, azeitona e orégano.', price: 42.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p2', name: 'Pizza Mussarela', description: 'Mussarela, tomate, azeitona e orégano.', price: 38.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p3', name: 'Pizza Margherita', description: 'Mussarela, tomate, manjericão fresco e azeite.', price: 40.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p4', name: 'Pizza Frango com Catupiry', description: 'Frango desfiado, catupiry, milho e orégano.', price: 44.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p5', name: 'Pizza Portuguesa', description: 'Presunto, ovo, cebola, azeitona, ervilha e mussarela.', price: 44.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p6', name: 'Pizza 4 Queijos', description: 'Mussarela, provolone, parmesão e gorgonzola.', price: 46.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p7', name: 'Pizza Pepperoni', description: 'Pepperoni, mussarela, molho de tomate e orégano.', price: 46.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p8', name: 'Pizza Napolitana', description: 'Tomate fatiado, mussarela, parmesão ralado e manjericão.', price: 42.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p9', name: 'Pizza Bacon', description: 'Bacon crocante, mussarela, cebola e molho barbecue.', price: 46.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },
  { id: 'p10', name: 'Pizza Supreme', description: 'Calabresa, bacon, presunto, queijo, ovo e azeitona.', price: 50.00, category: 'Pizzas', type: 'halfhalf', images: [], addons: ['a1','a2','a3','a4','a5','a6','a7','a8'], flavors: ['Calabresa', 'Mussarela', 'Margherita', 'Frango', 'Portuguesa', '4 Queijos', 'Pepperoni', 'Napolitana'], maxFlavors: 2, active: true, halfPrice: true },

  // PASTEIS - ESPECIAL (8)
  { id: 'pa1', name: 'Pastel de Carne', description: 'Massa crocante recheada com carne moída temperada.', price: 12.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa2', name: 'Pastel de Queijo', description: 'Massa crocante recheada com queijo derretido.', price: 10.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa3', name: 'Pastel de Frango', description: 'Massa crocante recheada com frango desfiado.', price: 12.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa4', name: 'Pastel Pizza', description: 'Massa crocante com mussarela, presunto, tomate e orégano.', price: 14.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa5', name: 'Pastel de Palmito', description: 'Massa crocante recheada com palmito cremoso.', price: 14.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa6', name: 'Pastel de Camarão', description: 'Massa crocante recheada com camarão temperado.', price: 18.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa7', name: 'Pastel de Calabresa', description: 'Massa crocante com calabresa fatiada e queijo.', price: 12.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },
  { id: 'pa8', name: 'Pastel Especial MH', description: 'Carne, queijo, bacon, milho, catupiry e orégano.', price: 18.00, category: 'Pastéis', type: 'special', images: [], addons: ['a11','a12','a13','a14','a15'], flavors: ['Carne', 'Queijo', 'Frango', 'Pizza', 'Palmito', 'Camarão', 'Calabresa', 'Especial'], maxFlavors: 3, active: true },

  // PORCOES (8)
  { id: 'por1', name: 'Batata Frita', description: 'Porção generosa de batata frita crocante.', price: 18.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por2', name: 'Batata com Cheddar e Bacon', description: 'Batata frita coberta com cheddar cremoso e bacon crocante.', price: 28.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por3', name: 'Onion Rings', description: 'Anéis de cebola empanados e fritos, crocantes.', price: 20.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por4', name: 'Nuggets (10 un)', description: '10 nuggets crocantes com molho à escolha.', price: 22.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por5', name: 'Bolinho de Queijo (8 un)', description: '8 bolinhos de queijo empanados e fritos.', price: 24.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por6', name: 'Mandioca Frita', description: 'Porção de mandioca frita crocante por fora e macia por dentro.', price: 18.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por7', name: 'Tábua de Frios', description: 'Presunto, salame, queijo, azeitona e torradinhas.', price: 45.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },
  { id: 'por8', name: 'Polenta Frita', description: 'Porção de polenta frita crocante com molho de tomate.', price: 18.00, category: 'Porções', type: 'simple', images: [], addons: [], active: true },

  // BEBIDAS (8)
  { id: 'b1', name: 'Coca-Cola 350ml', description: 'Lata gelada.', price: 6.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b2', name: 'Coca-Cola 2L', description: 'Garrafa 2 litros.', price: 12.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b3', name: 'Guaraná Antarctica 350ml', description: 'Lata gelada.', price: 5.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b4', name: 'Sprite 350ml', description: 'Lata gelada.', price: 5.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b5', name: 'Suco Natural 500ml', description: 'Laranja, limão ou maracujá.', price: 8.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b6', name: 'Ágar Mineral 500ml', description: 'Sem gás.', price: 3.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b7', name: 'Cerveja Lata 350ml', description: 'Brahma, Skol ou Antarctica.', price: 7.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },
  { id: 'b8', name: 'Milkshake 400ml', description: 'Chocolate, morango ou baunilha.', price: 14.00, category: 'Bebidas', type: 'simple', images: [], addons: [], active: true },

  // SOBREMESAS (6)
  { id: 's1', name: 'Brownie com Sorvete', description: 'Brownie quentinho com bola de sorvete de baunilha e calda de chocolate.', price: 16.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
  { id: 's2', name: 'Petit Gâteau', description: 'Bolinho de chocolate com centro derretido e sorvete.', price: 18.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
  { id: 's3', name: 'Açaí 500ml', description: 'Açaí cremoso com granola, banana e leite condensado.', price: 20.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
  { id: 's4', name: 'Pudim de Leite', description: 'Fatia generosa de pudim de leite condensado.', price: 12.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
  { id: 's5', name: 'Churros (3 un)', description: '3 churros recheados com doce de leite e cobertura de chocolate.', price: 14.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
  { id: 's6', name: 'Sorvete 2 Bolas', description: 'Escolha 2 sabores: chocolate, baunilha, morango ou flocos.', price: 10.00, category: 'Sobremesas', type: 'simple', images: [], addons: [], active: true },
];

export const categoryEmojis: Record<string, string> = {
  'Hambúrgueres': '🍔',
  'Pizzas': '🍕',
  'Pastéis': '🥟',
  'Porções': '🍟',
  'Bebidas': '🥤',
  'Sobremesas': '🍰',
};
