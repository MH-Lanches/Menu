import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Package, Bike, CheckCircle2, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Order } from "../types";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { cn } from "../lib/utils";

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const STEPS = [
  { id: 'novo', label: 'Recebido', icon: Bell },
  { id: 'producao', label: 'Em Produção', icon: Package },
  { id: 'pronto', label: 'Pronto', icon: CheckCircle2 },
  { id: 'saiu-entrega', label: 'Em Entrega', icon: Bike },
  { id: 'entregue', label: 'Entregue', icon: CheckCircle2 }
];

export default function TrackingModal({ isOpen, onClose, orderId }: TrackingModalProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const orderRef = ref(db, `pedidos/${orderId}`);
    const unsubscribe = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) setOrder(snapshot.val());
    });
    return () => unsubscribe();
  }, [orderId]);

  const currentStepIndex = STEPS.findIndex(s => s.id === order?.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass rounded-3xl p-8 border border-neon-cyan/30"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-neon-cyan">Acompanhar Pedido</h2>
                <p className="text-xs text-gray-500 font-mono">ID: {orderId}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            {!order ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600 animate-spin-slow" />
                <p className="text-gray-400">Buscando informações...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5" />
                  <div className="space-y-8">
                    {STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.id} className="flex items-center gap-6 relative">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-500",
                            isCompleted ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]" : "bg-white/5 text-gray-600",
                            isCurrent && "scale-125 animate-pulse"
                          )}>
                            <step.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className={cn(
                              "font-bold transition-colors",
                              isCompleted ? "text-white" : "text-gray-600"
                            )}>{step.label}</p>
                            {isCurrent && <p className="text-[10px] text-neon-cyan font-bold animate-pulse">ATUAL</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">Previsão de entrega</span>
                    <span className="text-white font-bold">30-45 min</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 glass-card rounded-xl font-bold hover:bg-white/5 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
