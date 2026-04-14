import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { Product, Addon } from "../types";
import { cn } from "../lib/utils";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (customizedItem: any) => void;
}

export default function CustomizeModal({ isOpen, onClose, product, onAddToCart }: CustomizeModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (product) {
      setTotal(product.preco);
      setSelectedAddons([]);
      setSelectedFlavors([]);
      setObservation("");
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.preco, 0);
    setTotal(product.preco + addonsTotal);
  }, [selectedAddons, product]);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.nome === addon.nome);
      if (exists) return prev.filter(a => a.nome !== addon.nome);
      return [...prev, addon];
    });
  };

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => {
      const exists = prev.includes(flavor);
      if (exists) return prev.filter(f => f !== flavor);
      
      const limit = product?.tipo === 'pizza' ? 2 : (product?.tipo === 'pastel' ? 5 : 1);
      if (prev.length >= limit) return prev;
      
      return [...prev, flavor];
    });
  };

  const handleAdd = () => {
    if (!product) return;
    onAddToCart({
      id: `${product.id}-${Date.now()}`,
      produtoId: product.id,
      nome: product.nome,
      preco: total,
      qtd: 1,
      observacao: observation,
      adicionais: selectedAddons,
      sabores: selectedFlavors
    });
    onClose();
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg glass rounded-3xl p-8 border border-neon-pink/30 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-neon-pink">{product.nome}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-400">{product.descricao}</p>

              {(product.tipo === 'pizza' || product.tipo === 'pastel') && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neon-cyan flex justify-between">
                    <span>Escolha até {product.tipo === 'pizza' ? 2 : 5} sabores</span>
                    <span className="text-xs opacity-50">{selectedFlavors.length}/{product.tipo === 'pizza' ? 2 : 5}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {product.sabores?.map(s => (
                      <button
                        key={s.nome}
                        onClick={() => toggleFlavor(s.nome)}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-semibold transition-all",
                          selectedFlavors.includes(s.nome)
                            ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                            : "border-white/10 text-gray-500 hover:border-white/20"
                        )}
                      >
                        {s.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(product.adicionais || product.opcionais) && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neon-pink">Adicionais / Opcionais</h4>
                  <div className="space-y-2">
                    {(product.adicionais || product.opcionais)?.map(addon => (
                      <button
                        key={addon.nome}
                        onClick={() => toggleAddon(addon)}
                        className={cn(
                          "w-full flex justify-between items-center p-4 rounded-xl border transition-all",
                          selectedAddons.find(a => a.nome === addon.nome)
                            ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                            : "border-white/10 text-gray-500 hover:border-white/20"
                        )}
                      >
                        <span className="font-semibold">{addon.nome}</span>
                        <span className="text-xs font-bold">+ R$ {addon.preco.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-bold text-gray-400">Observações</h4>
                <textarea 
                  rows={2}
                  placeholder="Ex: Sem cebola, ponto da carne..."
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-semibold">Total</span>
                  <span className="text-2xl font-black text-neon-cyan">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  onClick={handleAdd}
                  className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-cyan text-white rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-pink/20"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
