import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, Clock, CreditCard, Wallet, Banknote, Send, CalendarClock } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

interface CartProps {
  onClose: () => void;
}

type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash';

export function Cart({ onClose }: CartProps) {
  const { cart, storeData, updateCartItem, removeFromCart, clearCart, getCartTotal, isStoreOpen } = useStoreContext();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cashChange, setCashChange] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const open = isStoreOpen();
  const subtotal = getCartTotal();
  const deliveryFee = storeData.settings.deliveryFee;
  const total = subtotal + deliveryFee;
  const minOrderMet = subtotal >= storeData.settings.minOrder;

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateCartItem(itemId, { quantity: newQuantity });
    }
  };

  const formatWhatsAppMessage = () => {
    let message = `🛒 *NOVO PEDIDO*\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📍 *Endereço:* ${customerAddress}\n\n`;
    
    if (isScheduled) {
      message += `⏰ *PEDIDO AGENDADO* (Preparar quando abrir)\n\n`;
    }
    
    message += `*━━━━━━ ITENS ━━━━━━*\n\n`;
    
    cart.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`;
      message += `   Qtd: ${item.quantity} x R$ ${item.unitPrice.toFixed(2)}\n`;
      
      // Half pizza
      if (item.isHalf && item.halfProduct) {
        message += `   🍕 Meio a Meio com: ${item.halfProduct.name}\n`;
      }
      
      // Additionals
      item.selectedAdditionals.forEach(bar => {
        if (bar.items.length > 0) {
          const barInfo = item.product.additionalBars.find(b => b.id === bar.barId);
          message += `   ➕ ${barInfo?.name}: ${bar.items.map(i => i.name).join(', ')}\n`;
        }
      });
      
      // Half additionals
      if (item.isHalf && item.halfAdditionals) {
        item.halfAdditionals.forEach(bar => {
          if (bar.items.length > 0) {
            const barInfo = item.halfProduct?.additionalBars.find(b => b.id === bar.barId);
            message += `   ➕ ${barInfo?.name} (2ª metade): ${bar.items.map(i => i.name).join(', ')}\n`;
          }
        });
      }
      
      // Observations
      if (item.observations) {
        message += `   📝 Obs: ${item.observations}\n`;
      }
      
      message += `   💰 Subtotal: R$ ${(item.unitPrice * item.quantity).toFixed(2)}\n\n`;
    });
    
    message += `*━━━━━━━━━━━━━━━━*\n\n`;
    message += `📦 Subtotal: R$ ${subtotal.toFixed(2)}\n`;
    message += `🛵 Entrega: R$ ${deliveryFee.toFixed(2)}\n`;
    message += `💵 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    
    message += `*━━━━ PAGAMENTO ━━━━*\n`;
    const paymentLabels: Record<PaymentMethod, string> = {
      pix: '📱 PIX',
      credit: '💳 Cartão de Crédito',
      debit: '💳 Cartão de Débito',
      cash: '💵 Dinheiro'
    };
    message += `${paymentLabels[paymentMethod]}\n`;
    
    if (paymentMethod === 'cash' && cashChange) {
      message += `Troco para: R$ ${cashChange}\n`;
    }
    
    message += `\n*Obrigado pela preferência!* 🙏`;
    
    return encodeURIComponent(message);
  };

  const handleSendOrder = () => {
    const message = formatWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${storeData.settings.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    clearCart();
    onClose();
  };

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-backdrop animate-fade-in">
        <div className="bg-white w-full max-w-md md:rounded-2xl overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold">Carrinho</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag size={36} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Carrinho vazio</h3>
            <p className="text-gray-500 mt-1">Adicione itens do cardápio</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl text-white font-medium"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Ver Cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-backdrop animate-fade-in">
      <div 
        className="bg-white w-full max-w-md max-h-[90vh] md:rounded-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button onClick={() => setStep('cart')} className="p-1 hover:bg-gray-100 rounded-full">
                ←
              </button>
            )}
            <h2 className="text-lg font-bold">
              {step === 'cart' ? 'Carrinho' : 'Finalizar Pedido'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'cart' ? (
            <div className="p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex gap-3">
                    <img
                      src={item.product.image || 'https://via.placeholder.com/80'}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.product.name}</h4>
                      
                      {item.isHalf && item.halfProduct && (
                        <p className="text-xs text-amber-600">
                          + {item.halfProduct.name}
                        </p>
                      )}
                      
                      {item.selectedAdditionals.some(b => b.items.length > 0) && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.selectedAdditionals
                            .flatMap(b => b.items.map(i => i.name))
                            .join(', ')}
                        </p>
                      )}
                      
                      {item.observations && (
                        <p className="text-xs text-gray-400 truncate">📝 {item.observations}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold" style={{ color: 'var(--primary)' }}>
                          R$ {(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200"
                          >
                            {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={clearCart}
                className="w-full py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
              >
                Limpar carrinho
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Store Status */}
              {!open && storeData.settings.acceptScheduling && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Clock size={18} />
                    <span className="font-medium">Loja fechada</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    Seu pedido será preparado quando abrirmos.
                  </p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span className="text-sm text-amber-800 font-medium">
                      <CalendarClock size={14} className="inline mr-1" />
                      Agendar pedido
                    </span>
                  </label>
                </div>
              )}

              {!open && !storeData.settings.acceptScheduling && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-800">
                    <Clock size={18} />
                    <span className="font-medium">Loja fechada</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Não estamos aceitando pedidos no momento.
                  </p>
                </div>
              )}

              {/* Customer Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de entrega *</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Rua, número, bairro, complemento..."
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none h-20"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pagamento *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pix', label: 'PIX', icon: Wallet },
                    { id: 'credit', label: 'Crédito', icon: CreditCard },
                    { id: 'debit', label: 'Débito', icon: CreditCard },
                    { id: 'cash', label: 'Dinheiro', icon: Banknote },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <method.icon size={18} className={paymentMethod === method.id ? 'text-red-500' : 'text-gray-500'} />
                      <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-red-700' : 'text-gray-700'}`}>
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
                
                {paymentMethod === 'cash' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={cashChange}
                      onChange={(e) => setCashChange(e.target.value)}
                      placeholder="Troco para quanto? (opcional)"
                      className="w-full p-3 border border-gray-200 rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 safe-bottom">
          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxa de entrega</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Min Order Warning */}
          {!minOrderMet && (
            <p className="text-center text-sm text-amber-600 mb-3">
              Pedido mínimo: R$ {storeData.settings.minOrder.toFixed(2)}
            </p>
          )}

          {step === 'cart' ? (
            <button
              onClick={() => setStep('checkout')}
              disabled={!minOrderMet}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSendOrder}
              disabled={!customerName || !customerAddress || (!open && !isScheduled) || (!open && !storeData.settings.acceptScheduling)}
              className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#25D366' }}
            >
              <Send size={18} />
              <span>Enviar Pedido via WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
