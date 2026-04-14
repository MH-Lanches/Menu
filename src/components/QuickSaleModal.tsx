import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Minus, ShoppingCart, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { Product, OrderItem, Order } from "../types";
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickSaleModal({ isOpen, onClose, onSuccess }: QuickSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");

  useEffect(() => {
    onValue(ref(db, "produtos"), (snapshot) => {
      if (snapshot.exists()) setProducts(Object.values(snapshot.val()));
    });
  }, []);

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) && !p.pausado
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.produtoId === product.id);
      if (existing) {
        return prev.map(item => 
          item.produtoId === product.id ? { ...item, qtd: item.qtd + 1 } : item
        );
      }
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        produtoId: String(product.id),
        nome: product.nome,
        preco: product.preco,
        qtd: 1
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qtd + delta);
        return { ...item, qtd: newQty };
      }
      return item;
    }).filter(item => item.qtd > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);

  const handleFinish = async () => {
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: `BAL-${Date.now().toString(36).toUpperCase()}`,
      tipo: 'balcao',
      cliente: { nome: "Consumidor Balcão", telefone: "", endereco: "" },
      itens: cart,
      pagamento: paymentMethod,
      subtotal,
      desconto: 0,
      taxa: 0,
      total: subtotal,
      status: 'pago',
      data: new Date().toISOString()
    };

    try {
      await set(ref(db, `pedidos/${newOrder.id}`), newOrder);
      setCart([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-5xl glass rounded-3xl p-8 border border-neon-cyan/30 flex gap-8 h-[85vh]"
          >
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" /> Venda Rápida (Balcão)
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:border-neon-cyan outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="glass-card p-4 rounded-xl text-left hover:border-neon-cyan transition-all group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3">
                      <img src={prod.imagem} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="font-bold text-sm line-clamp-1">{prod.nome}</h4>
                    <p className="text-neon-cyan font-black">R$ {prod.preco.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Cart & Payment */}
            <div className="w-80 flex flex-col border-l border-white/5 pl-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-400">Carrinho</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold line-clamp-1">{item.nome}</span>
                      <span className="text-xs text-neon-cyan">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-neon-pink transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-mono">{item.qtd}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-neon-cyan transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Carrinho vazio</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-3 gap-2">
                  {['dinheiro', 'pix', 'cartao'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold border transition-all",
                        paymentMethod === method 
                          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" 
                          : "border-white/10 text-gray-500"
                      )}
                    >
                      {method.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">Total</span>
                  <span className="text-2xl font-black text-neon-cyan">R$ {subtotal.toFixed(2)}</span>
                </div>

                <button 
                  onClick={handleFinish}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-neon-cyan text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-neon-cyan/20"
                >
                  <DollarSign className="w-5 h-5" /> FINALIZAR VENDA
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
