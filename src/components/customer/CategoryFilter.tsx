import { useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

interface CategoryFilterProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
}

export function CategoryFilter({ 
  selectedCategory, 
  setSelectedCategory, 
  showFavorites, 
  setShowFavorites 
}: CategoryFilterProps) {
  const { storeData, getFavoriteProducts } = useStoreContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const categories = [...storeData.categories]
    .filter(c => c.active)
    .sort((a, b) => a.order - b.order);

  const favoritesCount = getFavoriteProducts().length;

  useEffect(() => {
    if (scrollRef.current && selectedCategory) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string | null) => {
    setShowFavorites(false);
    setSelectedCategory(categoryId);
  };

  const handleFavoritesClick = () => {
    setSelectedCategory(null);
    setShowFavorites(!showFavorites);
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 px-4 py-3 overflow-x-auto category-scroll"
      >
        {/* All Button */}
        <button
          onClick={() => handleCategoryClick(null)}
          data-active={!selectedCategory && !showFavorites}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedCategory && !showFavorites
              ? 'text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={!selectedCategory && !showFavorites ? { backgroundColor: 'var(--primary)' } : {}}
        >
          Todos
        </button>

        {/* Favorites Button */}
        {favoritesCount > 0 && (
          <button
            onClick={handleFavoritesClick}
            data-active={showFavorites}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showFavorites
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={showFavorites ? { backgroundColor: '#ef4444' } : {}}
          >
            <Heart size={16} fill={showFavorites ? 'currentColor' : 'none'} />
            <span>Favoritos</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              showFavorites ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {favoritesCount}
            </span>
          </button>
        )}

        {/* Category Buttons */}
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            data-active={selectedCategory === category.id}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === category.id ? { backgroundColor: 'var(--primary)' } : {}}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
