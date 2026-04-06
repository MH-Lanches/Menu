import React, { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { Product } from '../../types/store';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, X } from 'lucide-react';

interface ProductManagerProps {}

const ProductManager: React.FC<ProductManagerProps> = () => {
  const { state, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInactive, setFilterInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isActive: true,
    extraBars: []
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: state.categories[0]?.id || '',
        image: '',
        isActive: true,
        extraBars: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    updateState(prev => {
      if (editingProduct) {
        return {
          ...prev,
          products: prev.products.map(p => p.id === editingProduct.id ? (formData as Product) : p)
        };
      } else {
        const newProduct: Product = {
          ...formData,
          id: Math.random().toString(36).substr(2, 9),
        } as Product;
        return {
          ...prev,
          products: [...prev.products, newProduct]
        };
      }
    });

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      updateState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    }
  };

  const toggleActive = (id: string) => {
    updateState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
    }));
  };

  const filteredProducts = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInactive = filterInactive ? !p.isActive : true;
    return matchesSearch && matchesInactive;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterInactive(!filterInactive)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterInactive ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inativos
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Produto</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Categoria</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Preço</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.image || 'https://via.placeholder.com/40'} 
                      alt={product.name} 
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {state.categories.find(c => c.id === product.category)?.name || 'Sem Categoria'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  R$ {product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(product.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {product.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {product.isActive ? 'Ativo' : 'Pausado'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nome do Produto</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Selecione uma categoria</option>
                    {state.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">URL da Imagem</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Extra Bars Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">Adicionais (Opcional)</h4>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      extraBars: [...(formData.extraBars || []), { name: 'Novo Adicional', maxSelection: 5, items: [] }]
                    })}
                    className="text-sm text-red-600 hover:underline"
                  >
                    + Adicionar Barra de Adicionais
                  </button>
                </div>

                {formData.extraBars?.map((bar, barIdx) => (
                  <div key={barIdx} className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Nome da barra (ex: Molhos)"
                        className="bg-transparent font-medium text-gray-800 outline-none border-b border-transparent focus:border-red-500"
                        value={bar.name}
                        onChange={(e) => {
                          const newBars = [...(formData.extraBars || [])];
                          newBars[barIdx].name = e.target.value;
                          setFormData({ ...formData, extraBars: newBars });
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Máx. seleção:</span>
                        <input
                          type="number"
                          className="w-12 px-2 py-1 text-sm border rounded"
                          value={bar.maxSelection}
                          onChange={(e) => {
                            const newBars = [...(formData.extraBars || [])];
                            newBars[barIdx].maxSelection = parseInt(e.target.value);
                            setFormData({ ...formData, extraBars: newBars });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBars = formData.extraBars?.filter((_, i) => i !== barIdx);
                            setFormData({ ...formData, extraBars: newBars });
                          }}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {bar.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nome"
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            value={item.name}
                            onChange={(e) => {
                              const newBars = [...(formData.extraBars || [])];
                              newBars[barIdx].items[itemIdx].name = e.target.value;
                              setFormData({ ...formData, extraBars: newBars });
                            }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Preço"
                            className="w-20 px-2 py-1 text-sm border rounded"
                            value={item.price}
                            onChange={(e) => {
                              const newBars = [...(formData.extraBars || [])];
                              newBars[barIdx].items[itemIdx].price = parseFloat(e.target.value);
                              setFormData({ ...formData, extraBars: newBars });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newBars = [...(formData.extraBars || [])];
                              newBars[barIdx].items.splice(itemIdx, 1);
                              setFormData({ ...formData, extraBars: newBars });
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newBars = [...(formData.extraBars || [])];
                          newBars[barIdx].items.push({ id: Math.random().toString(), name: '', price: 0 });
                          setFormData({ ...formData, extraBars: newBars });
                        }}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        + Adicionar Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
