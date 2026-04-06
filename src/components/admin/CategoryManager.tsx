import React, { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { Category } from '../../types/store';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface CategoryManagerProps {}

const CategoryManager: React.FC<CategoryManagerProps> = () => {
  const { state, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    updateState(prev => {
      if (editingCategory) {
        return {
          ...prev,
          categories: prev.categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryName } : c)
        };
      } else {
        const newCategory: Category = {
          id: Math.random().toString(36).substr(2, 9),
          name: categoryName,
          order: prev.categories.length
        };
        return {
          ...prev,
          categories: [...prev.categories, newCategory].sort((a, b) => a.order - b.order)
        };
      }
    });

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Isso não excluirá os produtos, mas eles ficarão sem categoria.')) {
      updateState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id)
      }));
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...state.categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    // Swap
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    
    // Re-assign order
    const reordered = newCategories.map((cat, i) => ({ ...cat, order: i }));

    updateState(prev => ({
      ...prev,
      categories: reordered
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Categorias do Cardápio</h3>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-10"></th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nome</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ordem</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.categories.map((category, index) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === state.categories.length - 1}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {index + 1}º
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {state.categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nome da Categoria</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import { X } from 'lucide-react';

export default CategoryManager;
