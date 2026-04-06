import { ShoppingBag } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

interface FloatingCartProps {
  onClick: () => void;
}

export function FloatingCart({ onClick }: FloatingCartProps) {
  const { getCartItemsCount, getCartTotal } = useStoreContext();
  const count = getCartItemsCount();
  const total = getCartTotal();

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto md:bottom-6 z-40 py-3 px-4 md:px-6 rounded-2xl text-white font-semibold flex items-center justify-between md:justify-center gap-4 floating-cart animate-slide-up"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <ShoppingBag size={22} />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-xs font-bold rounded-full flex items-center justify-center" style={{ color: 'var(--primary)' }}>
            {count}
          </span>
        </div>
        <span className="md:hidden">Ver carrinho</span>
      </div>
      
      <span className="font-bold text-lg">
        R$ {total.toFixed(2)}
      </span>
    </button>
  );
}
