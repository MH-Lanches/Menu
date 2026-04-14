import { motion, AnimatePresence } from "motion/react";
import { X, Bike, QrCode, CreditCard, Banknote, Send } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  total: number;
}

export default function CheckoutModal({ isOpen, onClose, onSubmit, total }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    complemento: "",
    pagamento: "pix",
    troco: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md glass rounded-3xl p-8 border border-neon-cyan/30 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-neon-cyan">Finalizar Pedido</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Nome</label>
                <input 
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Telefone</label>
                <input 
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={e => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Endereço</label>
                <input 
                  type="text"
                  required
                  value={formData.endereco}
                  onChange={e => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Complemento (opcional)</label>
                <input 
                  type="text"
                  value={formData.complemento}
                  onChange={e => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pix", label: "Pix", icon: QrCode },
                    { id: "cartao", label: "Cartão", icon: CreditCard },
                    { id: "dinheiro", label: "Dinheiro", icon: Banknote }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pagamento: method.id }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        formData.pagamento === method.id 
                          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" 
                          : "border-white/10 text-gray-500 hover:border-white/20"
                      )}
                    >
                      <method.icon className="w-6 h-6" />
                      <span className="text-xs font-bold">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.pagamento === "dinheiro" && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Troco para quanto?</label>
                  <input 
                    type="text"
                    placeholder="Ex: R$ 50,00"
                    value={formData.troco}
                    onChange={e => setFormData(prev => ({ ...prev, troco: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan outline-none"
                  />
                </motion.div>
              )}

              <div className="pt-4">
                <div className="flex justify-between items-center mb-4 p-4 bg-white/5 rounded-2xl">
                  <span className="text-gray-400 font-semibold">Total a pagar</span>
                  <span className="text-2xl font-black text-neon-cyan">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/20"
                >
                  <Send className="w-5 h-5" /> Enviar pelo WhatsApp
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
