import { Heart, Plus } from 'lucide-react';
import { Product } from '../../types';
import { useStoreContext } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useStoreContext();
  const favorite = isFavorite(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div 
      className="product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
      onClick={() => onSelect(product)}
    >
      {/* Image */}
      <div className="relative aspect-square">
        <img
          src={product.image || 'https://via.placeholder.com/400x400?text=Sem+Imagem'}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            favorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>

        {/* Pizza Half Badge */}
        {product.isPizza && product.allowHalf && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            Meio a Meio
          </div>
        )}

        {/* Add Button */}
        <button
          className="absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: 'var(--primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2rem]">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            R$ {product.price.toFixed(2)}
          </span>
          
          {product.additionalBars.length > 0 && (
            <span className="text-xs text-gray-400">
              + adicionais
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
