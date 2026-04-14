import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, ShoppingBasket, Plus, Minus } from "lucide-react";
import { OrderItem } from "../types";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  taxaEntrega: number;
}

export default function CartModal({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQty, 
  onRemove, 
  onCheckout,
  taxaEntrega 
}: CartModalProps) {
  const subtotal = items.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
  const total = subtotal + taxaEntrega;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md glass border-l border-neon-pink/30 flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <h2 className="font-display text-2xl font-bold text-neon-pink">Carrinho</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <ShoppingBasket className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Seu carrinho está vazio</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="glass-card p-4 rounded-xl flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-white">{item.nome}</p>
                      <p className="text-neon-pink font-bold">
                        R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-black/30 rounded-lg p-1">
                        <button 
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:text-neon-pink transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.qtd}</span>
                        <button 
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:text-neon-cyan transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 glass border-t border-white/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa de Entrega</span>
                    <span>R$ {taxaEntrega.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-neon-cyan pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-cyan rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-pink/20"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
