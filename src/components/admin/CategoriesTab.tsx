import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, X, FolderOpen } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';
import { Category } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const EMOJI_OPTIONS = ['🍔', '🍕', '🌭', '🌮', '🥤', '🍦', '🍰', '🥗', '🍟', '🍗', '🎁', '⭐', '🔥', '❤️', '🥪'];

export function CategoriesTab() {
  const { storeData, addCategory, updateCategory, deleteCategory, reorderCategories } = useStoreContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '🍔' });

  const sortedCategories = [...storeData.categories].sort((a, b) => a.order - b.order);

  const getProductCount = (categoryId: string) => {
    return storeData.products.filter(p => p.categoryId === categoryId).length;
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, icon: category.icon });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', icon: '🍔' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = () => {
    const category: Category = {
      id: editingCategory?.id || uuidv4(),
      name: formData.name,
      icon: formData.icon,
      order: editingCategory?.order ?? sortedCategories.length + 1,
      active: editingCategory?.active ?? true,
    };

    if (editingCategory) {
      updateCategory(category);
    } else {
      addCategory(category);
    }

    closeModal();
  };

  const handleDelete = (categoryId: string) => {
    const productCount = getProductCount(categoryId);
    if (productCount > 0) {
      alert(`Esta categoria possui ${productCount} produto(s). Remova os produtos primeiro.`);
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategory(categoryId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={20} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> Arraste as categorias para cima ou para baixo para reordenar como aparecem no cardápio do cliente.
        </p>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FolderOpen size={32} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">Nenhuma categoria</h3>
            <p className="text-gray-500 mt-1">Crie categorias para organizar seus produtos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedCategories.map((category, index) => (
              <div 
                key={category.id} 
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !category.active ? 'opacity-50' : ''
                }`}
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => reorderCategories(category.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => reorderCategories(category.id, 'down')}
                    disabled={index === sortedCategories.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  {category.icon}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {getProductCount(category.id)} produto(s)
                  </p>
                </div>

                {/* Order Badge */}
                <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  Ordem: {category.order}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(category)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lanches, Bebidas..."
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        formData.icon === emoji
                          ? 'bg-red-100 ring-2 ring-red-500'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{formData.icon}</span>
                  <span className="font-semibold">{formData.name || 'Nome da categoria'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
