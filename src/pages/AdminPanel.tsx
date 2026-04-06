import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, Eye, EyeOff, GripVertical,
  Settings, Package, Tag, Clock, DollarSign, Palette, X,
  ChevronUp, ChevronDown, Save, Image as ImageIcon, Menu, Hash
} from 'lucide-react';
import { getProducts, saveProducts, getCategories, saveCategories, getSettings, saveSettings } from '../store';
import type { Product, Category, StoreSettings, AddonGroup, AddonItem } from '../types';



export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'settings' | 'operations'>('products');
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [categories, setCategories] = useState<Category[]>(getCategories);
  const [settings, setSettings] = useState<StoreSettings>(getSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInactive = showInactiveOnly ? !p.active : true;
    return matchesSearch && matchesInactive;
  });

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } else {
      setProducts(prev => [...prev, product]);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleSaveCategory = (category: Category) => {
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    } else {
      setCategories(prev => [...prev, category]);
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setProducts(prev => prev.filter(p => p.category !== id));
    }
  };

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(c => c.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sorted.length - 1)) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = sorted[index].order;
    sorted[index].order = sorted[swapIndex].order;
    sorted[swapIndex].order = tempOrder;
    setCategories([...sorted]);
  };

  const tabs = [
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'categories' as const, label: 'Categorias', icon: Tag },
    { id: 'operations' as const, label: 'Operação', icon: Clock },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg bg-gray-800">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: settings.primaryColor }}>
                <Hash size={18} className="text-white" />
              </div>
              <h1 className="text-lg font-bold">Painel Admin</h1>
            </div>
          </div>
          <a href="#/" className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors flex items-center gap-2">
            <Eye size={14} /> Ver Site
          </a>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)] w-64 bg-gray-900 border-r border-gray-800 z-30 transition-transform duration-200`}>
          <nav className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                style={activeTab === tab.id ? { background: `${settings.primaryColor}20`, color: settings.primaryColor } : {}}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-57px)]">
          {activeTab === 'products' && (
            <ProductsTab
              products={filteredProducts}
              categories={sortedCategories}
              searchTerm={searchTerm}
              showInactiveOnly={showInactiveOnly}
              setSearchTerm={setSearchTerm}
              setShowInactiveOnly={setShowInactiveOnly}
              setEditingProduct={setEditingProduct}
              setShowProductModal={setShowProductModal}
              handleDeleteProduct={handleDeleteProduct}
              handleToggleActive={handleToggleActive}
              settings={settings}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={sortedCategories}
              setEditingCategory={setEditingCategory}
              setShowCategoryModal={setShowCategoryModal}
              handleDeleteCategory={handleDeleteCategory}
              moveCategory={moveCategory}
              settings={settings}
            />
          )}
          {activeTab === 'operations' && (
            <OperationsTab settings={settings} setSettings={setSettings} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} setSettings={setSettings} />
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={sortedCategories}
          onSave={handleSaveProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          settings={settings}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        />
      )}
    </div>
  );
}

function ProductsTab({ products, searchTerm, showInactiveOnly, setSearchTerm, setShowInactiveOnly, setEditingProduct, setShowProductModal, handleDeleteProduct, handleToggleActive, settings }: any) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Produtos</h2>
        <button
          onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
          style={{ background: settings.primaryColor }}
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
          />
        </div>
        <button
          onClick={() => setShowInactiveOnly(!showInactiveOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${showInactiveOnly
            ? 'border-red-500 bg-red-500/10 text-red-400'
            : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
            }`}
        >
          {showInactiveOnly ? <Eye size={16} /> : <EyeOff size={16} />}
          {showInactiveOnly ? 'Apenas Pausados' : 'Mostrar Pausados'}
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Nenhum produto encontrado</p>
          <p className="text-gray-500 text-sm mt-1">Adicione seu primeiro produto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: Product) => (
            <div
              key={product.id}
              className={`rounded-xl border transition-all ${product.active ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-60'}`}
            >
              <div className="relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-t-xl" />
                ) : (
                  <div className="w-full h-40 bg-gray-700 rounded-t-xl flex items-center justify-center">
                    <ImageIcon size={40} className="text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => handleToggleActive(product.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm"
                >
                  {product.active ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-red-400" />}
                </button>
                {product.isHalfHalf && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white">
                    Meio a Meio
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-lg" style={{ color: settings.primaryColor }}>
                    R$ {product.price.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                      className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductModal({ product, categories, onSave, onClose, settings }: any) {
  const [form, setForm] = useState<Product>(product || {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.id || '',
    image: '',
    active: true,
    addons: [],
    isHalfHalf: false,
  });
  const [activeAddonTab, setActiveAddonTab] = useState(0);

  const handleAddonGroupChange = (index: number, field: string, value: any) => {
    const newAddons = [...form.addons];
    if (!newAddons[index]) newAddons[index] = { id: crypto.randomUUID(), name: '', items: [], maxSelection: 5 };
    (newAddons[index] as any)[field] = value;
    setForm({ ...form, addons: newAddons });
  };

  const handleAddonItemChange = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    const newAddons = [...form.addons];
    if (!newAddons[groupIndex]) return;
    const newItems = [...newAddons[groupIndex].items];
    if (!newItems[itemIndex]) newItems[itemIndex] = { id: crypto.randomUUID(), name: '', price: 0 };
    (newItems[itemIndex] as any)[field] = value;
    newAddons[groupIndex].items = newItems;
    setForm({ ...form, addons: newAddons });
  };

  const addAddonGroup = () => {
    setForm({ ...form, addons: [...form.addons, { id: crypto.randomUUID(), name: '', items: [], maxSelection: 5 }] });
  };

  const removeAddonGroup = (index: number) => {
    setForm({ ...form, addons: form.addons.filter((_: any, i: number) => i !== index) });
  };

  const addAddonItem = (groupIndex: number) => {
    const newAddons = [...form.addons];
    newAddons[groupIndex].items.push({ id: crypto.randomUUID(), name: '', price: 0 });
    setForm({ ...form, addons: newAddons });
  };

  const removeAddonItem = (groupIndex: number, itemIndex: number) => {
    const newAddons = [...form.addons];
    newAddons[groupIndex].items = newAddons[groupIndex].items.filter((_: any, i: number) => i !== itemIndex);
    setForm({ ...form, addons: newAddons });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl my-8 border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500 resize-none"
              rows={2}
              placeholder="Descrição do produto"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categoria *</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              >
                <option value="">Selecione...</option>
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">URL da Imagem</label>
              <input
                type="text"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Half-Half Option */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
            <button
              onClick={() => setForm({ ...form, isHalfHalf: !form.isHalfHalf })}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: form.isHalfHalf ? settings.primaryColor : '#374151' }}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isHalfHalf ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm font-medium">Pizza Meio a Meio</span>
          </div>

          {/* Addons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Adicionais</h4>
              <button
                onClick={addAddonGroup}
                disabled={form.addons.length >= 2}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} /> Grupo ({form.addons.length}/2)
              </button>
            </div>

            {form.addons.length > 0 && (
              <div className="flex gap-2 mb-3">
                {form.addons.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveAddonTab(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeAddonTab === i
                      ? 'text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    style={activeAddonTab === i ? { background: settings.primaryColor } : {}}
                  >
                    Barra {i + 1}
                  </button>
                ))}
              </div>
            )}

            {form.addons.map((group: AddonGroup, groupIndex: number) => (
              activeAddonTab === groupIndex && (
                <div key={group.id} className="p-4 rounded-lg bg-gray-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={e => handleAddonGroupChange(groupIndex, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none"
                      placeholder="Nome do grupo (ex: Adicionais)"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Máx:</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={group.maxSelection}
                        onChange={e => handleAddonGroupChange(groupIndex, 'maxSelection', parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm text-center focus:outline-none"
                      />
                    </div>
                    <button onClick={() => removeAddonGroup(groupIndex)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item: AddonItem, itemIndex: number) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleAddonItemChange(groupIndex, itemIndex, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none"
                          placeholder="Nome do adicional"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={e => handleAddonItemChange(groupIndex, itemIndex, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm text-center focus:outline-none"
                          placeholder="R$ 0.00"
                        />
                        <button onClick={() => removeAddonItem(groupIndex, itemIndex)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addAddonItem(groupIndex)}
                      disabled={group.items.length >= 10}
                      className="w-full py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm disabled:opacity-40"
                    >
                      + Adicionar Item ({group.items.length}/10)
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: settings.primaryColor }}
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ categories, setEditingCategory, setShowCategoryModal, handleDeleteCategory, moveCategory, settings }: any) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Categorias</h2>
        <button
          onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
          style={{ background: settings.primaryColor }}
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-4">Organize as categorias usando as setas para definir a ordem de exibição.</p>

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Nenhuma categoria criada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category: Category, index: number) => (
            <div key={category.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
              <GripVertical size={18} className="text-gray-500" />
              <span className="flex-1 font-medium">{category.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === categories.length - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-gray-700"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryModal({ category, onSave, onClose }: any) {
  const [name, setName] = useState(category?.name || '');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold">{category ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800"><X size={20} /></button>
        </div>
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Categoria</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-gray-500"
            placeholder="Ex: Lanches, Bebidas..."
            autoFocus
          />
        </div>
        <div className="flex gap-3 p-4 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 font-medium">Cancelar</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                id: category?.id || crypto.randomUUID(),
                name: name.trim(),
                order: category?.order || Date.now(),
              });
            }}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function OperationsTab({ settings, setSettings }: { settings: StoreSettings; setSettings: (s: StoreSettings) => void }) {
  const updateSchedule = (day: string, field: string, value: any) => {
    const newSchedule = settings.schedule.map(s =>
      s.day === day ? { ...s, [field]: value } : s
    );
    setSettings({ ...settings, schedule: newSchedule });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Operação</h2>

      {/* Delivery Fee */}
      <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign size={18} /> Taxa de Entrega
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">R$</span>
          <input
            type="number"
            step="0.50"
            min="0"
            value={settings.deliveryFee}
            onChange={e => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
            className="w-32 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-lg font-bold focus:outline-none focus:border-gray-500"
          />
          <span className="text-sm text-gray-400">Defina o valor da entrega</span>
        </div>
      </div>

      {/* Schedule */}
      <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} /> Horário de Funcionamento
        </h3>
        <div className="space-y-2">
          {settings.schedule.map(day => (
            <div key={day.day} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50">
              <button
                onClick={() => updateSchedule(day.day, 'open', !day.open)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: day.open ? settings.primaryColor : '#374151' }}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${day.open ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="w-20 text-sm font-medium">{day.day}</span>
              {day.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.openTime}
                    onChange={e => updateSchedule(day.day, 'openTime', e.target.value)}
                    className="px-2 py-1 rounded bg-gray-600 border border-gray-500 text-white text-sm focus:outline-none"
                  />
                  <span className="text-gray-400">até</span>
                  <input
                    type="time"
                    value={day.closeTime}
                    onChange={e => updateSchedule(day.day, 'closeTime', e.target.value)}
                    className="px-2 py-1 rounded bg-gray-600 border border-gray-500 text-white text-sm focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-red-400">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ settings, setSettings }: { settings: StoreSettings; setSettings: (s: StoreSettings) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>

      <div className="space-y-6">
        {/* Store Info */}
        <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings size={18} /> Informações da Loja
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nome da Loja</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">WhatsApp (com DDD)</label>
              <input
                type="text"
                value={settings.storePhone}
                onChange={e => setSettings({ ...settings, storePhone: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-gray-500"
                placeholder="5511999999999"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Texto do Rodapé</label>
              <input
                type="text"
                value={settings.footerText}
                onChange={e => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Palette size={18} /> Paleta de Cores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { key: 'primaryColor', label: 'Cor Principal' },
              { key: 'secondaryColor', label: 'Cor Secundária' },
              { key: 'accentColor', label: 'Cor de Destaque' },
              { key: 'backgroundColor', label: 'Fundo' },
              { key: 'textColor', label: 'Texto' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm text-gray-300 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(settings as any)[key]}
                    onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={(settings as any)[key]}
                    onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="mt-4">
            <label className="block text-sm text-gray-300 mb-2">Temas Prontos</label>
            <div className="flex flex-wrap gap-2">
              {[
                { name: '🔥 Laranja', primary: '#FF4500', secondary: '#FF6B35', accent: '#FFD700' },
                { name: '🟢 Verde', primary: '#22C55E', secondary: '#16A34A', accent: '#86EFAC' },
                { name: '🔴 Vermelho', primary: '#EF4444', secondary: '#DC2626', accent: '#FCA5A5' },
                { name: '🟣 Roxo', primary: '#8B5CF6', secondary: '#7C3AED', accent: '#C4B5FD' },
                { name: '🔵 Azul', primary: '#3B82F6', secondary: '#2563EB', accent: '#93C5FD' },
                { name: '🟡 Amarelo', primary: '#EAB308', secondary: '#CA8A04', accent: '#FDE047' },
              ].map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setSettings({
                    ...settings,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent,
                  })}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
