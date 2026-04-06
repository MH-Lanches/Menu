import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Filter, X, Package } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';
import { Product, AdditionalBar, Additional } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function ProductsTab() {
  const { storeData, addProduct, updateProduct, deleteProduct, toggleProductActive } = useStoreContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    categoryId: '',
    isPizza: false,
    allowHalf: false,
  });
  const [additionalBars, setAdditionalBars] = useState<AdditionalBar[]>([]);

  const filteredProducts = useMemo(() => {
    let products = storeData.products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.price.toString().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      products = products.filter(p => p.categoryId === filterCategory);
    }

    if (showInactiveOnly) {
      products = products.filter(p => !p.active);
    }

    return products;
  }, [storeData.products, searchQuery, filterCategory, showInactiveOnly]);

  const getCategoryName = (categoryId: string) => {
    return storeData.categories.find(c => c.id === categoryId)?.name || 'Sem categoria';
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image: product.image,
        categoryId: product.categoryId,
        isPizza: product.isPizza || false,
        allowHalf: product.allowHalf || false,
      });
      setAdditionalBars(product.additionalBars);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        categoryId: storeData.categories[0]?.id || '',
        isPizza: false,
        allowHalf: false,
      });
      setAdditionalBars([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const addAdditionalBar = () => {
    setAdditionalBars(prev => [...prev, {
      id: uuidv4(),
      name: '',
      items: [],
      maxSelection: 3,
      required: false,
    }]);
  };

  const updateAdditionalBar = (barId: string, updates: Partial<AdditionalBar>) => {
    setAdditionalBars(prev => prev.map(bar => 
      bar.id === barId ? { ...bar, ...updates } : bar
    ));
  };

  const removeAdditionalBar = (barId: string) => {
    setAdditionalBars(prev => prev.filter(bar => bar.id !== barId));
  };

  const addAdditionalItem = (barId: string) => {
    setAdditionalBars(prev => prev.map(bar => {
      if (bar.id !== barId) return bar;
      return {
        ...bar,
        items: [...bar.items, { id: uuidv4(), name: '', price: 0 }]
      };
    }));
  };

  const updateAdditionalItem = (barId: string, itemId: string, updates: Partial<Additional>) => {
    setAdditionalBars(prev => prev.map(bar => {
      if (bar.id !== barId) return bar;
      return {
        ...bar,
        items: bar.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      };
    }));
  };

  const removeAdditionalItem = (barId: string, itemId: string) => {
    setAdditionalBars(prev => prev.map(bar => {
      if (bar.id !== barId) return bar;
      return {
        ...bar,
        items: bar.items.filter(item => item.id !== itemId)
      };
    }));
  };

  const handleSave = () => {
    const product: Product = {
      id: editingProduct?.id || uuidv4(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      image: formData.image,
      categoryId: formData.categoryId,
      active: editingProduct?.active ?? true,
      isPizza: formData.isPizza,
      allowHalf: formData.allowHalf,
      additionalBars: additionalBars.filter(bar => bar.name && bar.items.length > 0),
    };

    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }

    closeModal();
  };

  const handleDelete = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou preço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
          >
            <option value="all">Todas categorias</option>
            {storeData.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowInactiveOnly(!showInactiveOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              showInactiveOnly 
                ? 'bg-amber-50 border-amber-300 text-amber-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            <span>Pausados</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className={`bg-white rounded-xl overflow-hidden shadow-sm border transition-all ${
              !product.active ? 'opacity-60 border-amber-300' : 'border-gray-100'
            }`}
          >
            <div className="relative h-40">
              <img
                src={product.image || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Status Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                product.active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {product.active ? 'Ativo' : 'Pausado'}
              </div>

              {/* Category Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                {getCategoryName(product.categoryId)}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-red-500">
                  R$ {product.price.toFixed(2)}
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleProductActive(product.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      product.active 
                        ? 'text-amber-500 hover:bg-amber-50' 
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={product.active ? 'Pausar' : 'Ativar'}
                  >
                    {product.active ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  
                  <button
                    onClick={() => openModal(product)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">Nenhum produto encontrado</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || showInactiveOnly 
              ? 'Tente ajustar os filtros' 
              : 'Adicione seu primeiro produto'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: X-Burger Especial"
                      className="w-full p-3 border border-gray-200 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o produto..."
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-3 border border-gray-200 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                    >
                      <option value="">Selecione...</option>
                      {storeData.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pizza Options */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-medium text-amber-800 mb-3">🍕 Opções de Pizza</h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPizza}
                        onChange={(e) => setFormData({ ...formData, isPizza: e.target.checked })}
                        className="custom-checkbox"
                      />
                      <span className="text-sm text-gray-700">Este é um produto de Pizza</span>
                    </label>
                    
                    {formData.isPizza && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowHalf}
                          onChange={(e) => setFormData({ ...formData, allowHalf: e.target.checked })}
                          className="custom-checkbox"
                        />
                        <span className="text-sm text-gray-700">Permitir Meio a Meio</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Bars */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Barras de Adicionais</h3>
                    <button
                      onClick={addAdditionalBar}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                    >
                      <Plus size={16} />
                      <span>Nova Barra</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {additionalBars.map((bar, barIndex) => (
                      <div key={bar.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={bar.name}
                              onChange={(e) => updateAdditionalBar(bar.id, { name: e.target.value })}
                              placeholder={`Nome da Barra ${barIndex + 1}`}
                              className="p-2 border border-gray-200 rounded-lg text-sm"
                            />
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Máx:</span>
                              <input
                                type="number"
                                min="1"
                                value={bar.maxSelection}
                                onChange={(e) => updateAdditionalBar(bar.id, { maxSelection: parseInt(e.target.value) || 1 })}
                                className="w-16 p-2 border border-gray-200 rounded-lg text-sm text-center"
                              />
                            </div>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bar.required}
                                onChange={(e) => updateAdditionalBar(bar.id, { required: e.target.checked })}
                                className="custom-checkbox"
                              />
                              <span className="text-sm text-gray-600">Obrigatório</span>
                            </label>
                          </div>
                          
                          <button
                            onClick={() => removeAdditionalBar(bar.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {bar.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateAdditionalItem(bar.id, item.id, { name: e.target.value })}
                                placeholder="Nome do adicional"
                                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => updateAdditionalItem(bar.id, item.id, { price: parseFloat(e.target.value) || 0 })}
                                  className="w-20 p-2 border border-gray-200 rounded-lg text-sm text-center"
                                />
                              </div>
                              <button
                                onClick={() => removeAdditionalItem(bar.id, item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => addAdditionalItem(bar.id)}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                          >
                            + Adicionar Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.price || !formData.categoryId}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
