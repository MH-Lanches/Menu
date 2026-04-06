import { useState, useMemo, useEffect } from 'react';
import { Header } from '../components/customer/Header';
import { CategoryFilter } from '../components/customer/CategoryFilter';
import { ProductCard } from '../components/customer/ProductCard';
import { ProductModal } from '../components/customer/ProductModal';
import { Cart } from '../components/customer/Cart';
import { FloatingCart } from '../components/customer/FloatingCart';
import { Footer } from '../components/customer/Footer';
import { useStoreContext } from '../context/StoreContext';
import { Product } from '../types';
import { Settings } from 'lucide-react';

export function CustomerPage() {
  const { storeData, getFavoriteProducts } = useStoreContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);

  const sortedCategories = useMemo(() => {
    return [...storeData.categories]
      .filter(c => c.active)
      .sort((a, b) => a.order - b.order);
  }, [storeData.categories]);

  const filteredProducts = useMemo(() => {
    let products = showFavorites 
      ? getFavoriteProducts()
      : storeData.products.filter(p => p.active);

    // Filter by category
    if (selectedCategory) {
      products = products.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.price.toString().includes(query)
      );
    }

    return products;
  }, [storeData.products, selectedCategory, searchQuery, showFavorites, getFavoriteProducts]);

  const productsByCategory = useMemo(() => {
    if (selectedCategory || showFavorites || searchQuery) {
      return [{ category: null, products: filteredProducts }];
    }

    return sortedCategories
      .map(category => ({
        category,
        products: filteredProducts.filter(p => p.categoryId === category.id)
      }))
      .filter(group => group.products.length > 0);
  }, [filteredProducts, sortedCategories, selectedCategory, showFavorites, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <CategoryFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhum item encontrado</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery ? 'Tente buscar por outro termo' : 'Não há produtos nesta categoria'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {productsByCategory.map(({ category, products }) => (
              <section key={category?.id || 'all'}>
                {category && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </h2>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <FloatingCart onClick={() => setShowCart(true)} />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {showCart && (
        <Cart onClose={() => setShowCart(false)} />
      )}
    </div>
  );
}
