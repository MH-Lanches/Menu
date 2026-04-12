import { CartItem } from "../types/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: number) => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemove,
  onIncrement,
  onDecrement,
}: CartDrawerProps) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const delivery = subtotal >= 50 ? 0 : 6.99;
  const total = subtotal + delivery;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-black text-gray-900">Meu Pedido</h2>
              <p className="text-xs text-gray-500 font-semibold">
                {items.reduce((a, b) => a + b.qty, 0)} {items.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free delivery bar */}
        {subtotal < 50 && subtotal > 0 && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">🛵</span>
              <span className="text-xs font-bold text-amber-700">
                Falta R$ {(50 - subtotal).toFixed(2).replace(".", ",")} para frete grátis!
              </span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${(subtotal / 50) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        {subtotal >= 50 && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2">
            <span>🎉</span>
            <span className="text-xs font-bold text-green-700">Você ganhou frete grátis!</span>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-16">
              <div className="text-7xl mb-4">🛒</div>
              <h3 className="font-black text-gray-700 text-lg">Carrinho vazio</h3>
              <p className="text-gray-400 text-sm mt-2">Adicione itens do cardápio para começar</p>
              <button
                onClick={onClose}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</h4>
                  <p className="text-red-600 font-black text-sm mt-0.5">
                    R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                      <button
                        onClick={() => item.qty === 1 ? onRemove(item.id) : onDecrement(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        {item.qty === 1 ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </button>
                      <span className="text-sm font-black text-gray-900 w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => onIncrement(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500 font-semibold">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-semibold">
                <span>Entrega</span>
                <span className={delivery === 0 ? "text-green-600 font-bold" : ""}>
                  {delivery === 0 ? "GRÁTIS 🎉" : `R$ ${delivery.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-red-600">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            {/* Notes */}
            <input
              type="text"
              placeholder="💬 Alguma observação? (ex: sem cebola)"
              className="w-full text-sm px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-red-300 outline-none font-semibold text-gray-600 placeholder:text-gray-400"
            />

            {/* Checkout button */}
            <button className="btn-shine w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black py-4 rounded-2xl text-base shadow-xl shadow-red-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
              <span>Finalizar Pedido</span>
              <span className="text-xl">🛵</span>
            </button>

            <p className="text-center text-xs text-gray-400 font-semibold">
              Pague na entrega: 💳 Crédito • 💵 Débito • 🔵 Pix • 💰 Dinheiro
            </p>
          </div>
        )}
      </div>
    </>
  );
}
