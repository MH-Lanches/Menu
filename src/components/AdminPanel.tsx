import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category, AdditionGroup, Addition, StoreSettings, OperatingHour } from '../types';
import { 
  Settings, 
  Package, 
  LayoutGrid, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff,
  Search,
  X
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { products, setProducts, categories, setCategories, settings, setSettings, saveToStorage } = useStore();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveToStorage();
    alert('Configurações salvas!');
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct?.id === product.id) {
      setProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      setProducts([...products, product]);
    }
    setEditingProduct(null);
    saveToStorage();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== id));
      saveToStorage();
    }
  };

  const toggleProductStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p));
    saveToStorage();
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCats.length) return;
    [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
    setCategories(newCats);
    saveToStorage();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 space-y-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> Admin Delivery
        </h1>
        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'products' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <Package className="w-5 h-5" /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'categories' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <LayoutGrid className="w-5 h-5" /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" /> Configurações
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">Gestão de Produtos</h2>
              <button 
                onClick={() => setEditingProduct({
                  id: Date.now().toString(),
                  name: '',
                  description: '',
                  price: 0,
                  image: '',
                  categoryId: categories[0]?.id || '',
                  active: true,
                  additionGroups: [],
                })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" /> Novo Produto
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar produto..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showInactive} 
                  onChange={(e) => setShowInactive(e.target.checked)} 
                  className="w-4 h-4"
                />
                <span className="text-gray-600">Mostrar Inativos</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .filter(p => showInactive || p.active)
                .map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <img src={product.image || 'https://via.placeholder.com/150'} className="w-20 h-20 object-cover rounded-lg" alt={product.name} />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-2 rounded-lg transition ${product.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                        >
                          {product.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                      <p className="text-blue-600 font-bold mt-2">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">Categorias</h2>
              <button 
                onClick={() => {
                  const name = prompt('Nome da categoria:');
                  if (name) {
                    setCategories([...categories, { id: Date.now().toString(), name, order: categories.length }]);
                    saveToStorage();
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" /> Nova Categoria
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Nome</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Ordem</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.sort((a, b) => a.order - b.order).map((cat, index) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium">{cat.name}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => moveCategory(index, 'up')} className="p-1 text-gray-400 hover:text-blue-600"><ArrowUp className="w-4 h-4" /></button>
                          <button onClick={() => moveCategory(index, 'down')} className="p-1 text-gray-400 hover:text-blue-600"><ArrowDown className="w-4 h-4" /></button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => {
                            setCategories(categories.filter(c => c.id !== cat.id));
                            saveToStorage();
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Configurações da Loja</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nome da Loja</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">WhatsApp (Ex: 5511999999999)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Taxa de Entrega (R$)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cor Principal</label>
                  <input 
                    type="color" 
                    className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Texto do Rodapé</label>
                <textarea 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.footerText}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                />
              </div>
              <button 
                onClick={() => handleSaveSettings(settings)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Salvar Configurações
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Horário de Funcionamento</h3>
              <div className="space-y-4">
                {settings.operatingHours.map((hour, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                    <span className="w-24 font-medium text-gray-600">
                      {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][hour.day]}
                    </span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        className="p-1 border rounded outline-none" 
                        value={hour.open} 
                        onChange={(e) => {
                          const newHours = [...settings.operatingHours];
                          newHours[idx].open = e.target.value;
                          setSettings({ ...settings, operatingHours: newHours });
                        }}
                      />
                      <span>até</span>
                      <input 
                        type="time" 
                        className="p-1 border rounded outline-none" 
                        value={hour.close} 
                        onChange={(e) => {
                          const newHours = [...settings.operatingHours];
                          newHours[idx].close = e.target.value;
                          setSettings({ ...settings, operatingHours: newHours });
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-2 ml-auto">
                      <input 
                        type="checkbox" 
                        checked={hour.closed} 
                        onChange={(e) => {
                          const newHours = [...settings.operatingHours];
                          newHours[idx].closed = e.target.checked;
                          setSettings({ ...settings, operatingHours: newHours });
                        }} 
                      />
                      <span className="text-sm text-gray-500">Fechado</span>
                    </label>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setSettings(settings);
                  saveToStorage();
                  alert('Horários salvos!');
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Salvar Horários
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-screen overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingProduct.id === products[0]?.id && !products.some(p => p.id === editingProduct.id) ? 'Novo Produto' : 'Editar Produto'}</h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select 
                      className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingProduct.categoryId}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    >
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isPizza" 
                    checked={editingProduct.isPizza} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPizza: e.target.checked })}
                  />
                  <label htmlFor="isPizza" className="text-sm font-medium text-gray-700">Produto permite Meio a Meio (Pizza)</label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Grupos de Adicionais</h3>
                  <button 
                    onClick={() => {
                      setEditingProduct({
                        ...editingProduct,
                        additionGroups: [...editingProduct.additionGroups, { id: Date.now().toString(), name: 'Novo Grupo', min: 0, max: 5, options: [] }]
                      });
                    }}
                    className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Grupo
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {editingProduct.additionGroups.map((group, gIdx) => (
                    <div key={group.id} className="p-4 border rounded-xl bg-gray-50 space-y-3">
                      <div className="flex justify-between items-start">
                        <input 
                          type="text" 
                          className="font-bold bg-transparent border-b border-gray-300 outline-none focus:border-blue-500"
                          value={group.name}
                          onChange={(e) => {
                            const newGroups = [...editingProduct.additionGroups];
                            newGroups[gIdx].name = e.target.value;
                            setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newGroups = editingProduct.additionGroups.filter((_, i) => i !== gIdx);
                            setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex gap-4">
                        <div>
                          <label className="text-xs text-gray-500">Mín</label>
                          <input 
                            type="number" 
                            className="w-16 p-1 border rounded outline-none" 
                            value={group.min}
                            onChange={(e) => {
                              const newGroups = [...editingProduct.additionGroups];
                              newGroups[gIdx].min = parseInt(e.target.value) || 0;
                              setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Máx</label>
                          <input 
                            type="number" 
                            className="w-16 p-1 border rounded outline-none" 
                            value={group.max}
                            onChange={(e) => {
                              const newGroups = [...editingProduct.additionGroups];
                              newGroups[gIdx].max = parseInt(e.target.value) || 0;
                              setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {group.options.map((opt, oIdx) => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              className="flex-1 p-1 text-sm border rounded outline-none" 
                              value={opt.name}
                              onChange={(e) => {
                                const newGroups = [...editingProduct.additionGroups];
                                newGroups[gIdx].options[oIdx].name = e.target.value;
                                setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                              }}
                            />
                            <input 
                              type="number" 
                              className="w-20 p-1 text-sm border rounded outline-none" 
                              value={opt.price}
                              onChange={(e) => {
                                const newGroups = [...editingProduct.additionGroups];
                                newGroups[gIdx].options[oIdx].price = parseFloat(e.target.value) || 0;
                                setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                              }}
                            />
                            <button 
                              onClick={() => {
                                const newGroups = [...editingProduct.additionGroups];
                                newGroups[gIdx].options = newGroups[gIdx].options.filter((_, i) => i !== oIdx);
                                setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newGroups = [...editingProduct.additionGroups];
                            newGroups[gIdx].options.push({ id: Date.now().toString(), name: 'Novo Item', price: 0 });
                            setEditingProduct({ ...editingProduct, additionGroups: newGroups });
                          }}
                          className="w-full py-1 text-xs text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          + Adicionar Opção
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setEditingProduct(null)} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
              <button 
                onClick={() => handleSaveProduct(editingProduct!)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
