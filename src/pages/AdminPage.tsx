import { useState } from 'react';
import { useData, Category, Product } from '../store/DataContext';
import { Link } from 'react-router-dom';
import { Settings, Clock, Package, GripVertical, Plus, Trash2, Edit, Eye, EyeOff, Search, Save, Download, Upload } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AdminPage: React.FC = () => {
  const { 
    settings, updateSettings, 
    categories, addCategory, removeCategory, reorderCategories,
    products, addProduct, updateProduct, removeProduct, toggleProductActive 
  } = useData();

  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  
  // Tab: Menu
  const [searchTerm, setSearchTerm] = useState('');
  const [showPausedOnly, setShowPausedOnly] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Tab: Settings
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    alert('Configurações salvas!');
  };

  const handleDayToggle = (dayIndex: number) => {
    setLocalSettings(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayIndex]: { ...prev.schedule[dayIndex], isOpen: !prev.schedule[dayIndex].isOpen }
      }
    }));
  };

  const handleTimeChange = (dayIndex: number, type: 'open' | 'close', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayIndex]: { ...prev.schedule[dayIndex], [type]: value }
      }
    }));
  };

  const filteredProducts = products.filter(p => {
    if (showPausedOnly && p.isActive) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSaveProduct = () => {
    if (editingProduct?.id) {
      updateProduct(editingProduct.id, editingProduct);
    } else {
      addProduct(editingProduct as Omit<Product, 'id'>);
    }
    setEditingProduct(null);
  };

  const handleExportJSON = () => {
    const data = { settings, categories, products };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.settings && data.categories && data.products) {
          localStorage.setItem('delivery_settings', JSON.stringify(data.settings));
          localStorage.setItem('delivery_categories', JSON.stringify(data.categories));
          localStorage.setItem('delivery_products', JSON.stringify(data.products));
          window.location.reload();
        } else {
          alert('Arquivo JSON inválido!');
        }
      } catch {
        alert('Erro ao ler o arquivo!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
          <p className="text-sm text-gray-500">Gestão do Delivery</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('menu')}
            className={cn("w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left", activeTab === 'menu' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700")}
          >
            <Package size={20} />
            <span className="font-medium">Cardápio</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left", activeTab === 'settings' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700")}
          >
            <Settings size={20} />
            <span className="font-medium">Configurações</span>
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <Link to="/" className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-sm">Ver Site ao Vivo</span>
            </Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'menu' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Categorias</h2>
                <button 
                  onClick={() => setEditingCategory({ name: '', isHalfHalfAllowed: false })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" /> Nova Categoria
                </button>
              </div>

              {editingCategory && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex flex-col gap-4">
                  <input 
                    type="text" 
                    placeholder="Nome da Categoria" 
                    className="border rounded p-2"
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={editingCategory.isHalfHalfAllowed} 
                      onChange={e => setEditingCategory({ ...editingCategory, isHalfHalfAllowed: e.target.checked })}
                    />
                    <span>Permitir Meio a Meio (Calcula pelo maior valor)</span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-gray-600">Cancelar</button>
                    <button 
                      onClick={() => {
                        addCategory(editingCategory as Omit<Category, 'id' | 'order'>);
                        setEditingCategory(null);
                      }} 
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {categories.sort((a,b) => a.order - b.order).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <button onClick={() => reorderCategories(cat.id, 'up')} className="text-gray-400 hover:text-gray-600"><GripVertical size={16} /></button>
                      </div>
                      <span className="font-medium">{cat.name} {cat.isHalfHalfAllowed && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded ml-2">Meio a Meio</span>}</span>
                    </div>
                    <button onClick={() => removeCategory(cat.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">Produtos</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar produto..." 
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setShowPausedOnly(!showPausedOnly)}
                    className={cn("px-4 py-2 rounded-lg text-sm font-medium border", showPausedOnly ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-700 hover:bg-gray-50")}
                  >
                    Pausados
                  </button>
                  <button 
                    onClick={() => setEditingProduct({ name: '', price: 0, description: '', image: '', isActive: true, addonGroups: [], categoryId: categories[0]?.id })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center shrink-0"
                  >
                    <Plus size={16} className="mr-2" /> Novo Produto
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredProducts.map(prod => (
                  <div key={prod.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border", !prod.isActive ? "bg-gray-100 opacity-75" : "bg-white")}>
                    <div className="flex items-start space-x-4">
                      {prod.image && <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover rounded-md" />}
                      <div>
                        <h3 className="font-bold">{prod.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{prod.description}</p>
                        <p className="font-medium text-green-600 mt-1">R$ {prod.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <button 
                        onClick={() => toggleProductActive(prod.id)}
                        className={cn("p-2 rounded-lg border", prod.isActive ? "text-green-600 border-green-200 hover:bg-green-50" : "text-gray-500 border-gray-200 hover:bg-gray-100")}
                        title={prod.isActive ? "Pausar Produto" : "Ativar Produto"}
                      >
                        {prod.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => setEditingProduct(prod)}
                        className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => removeProduct(prod.id)}
                        className="p-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings size={20}/> Geral</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                  <input type="text" value={localSettings.storeName} onChange={e => setLocalSettings({...localSettings, storeName: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número do WhatsApp (Ex: 5511999999999)</label>
                  <input type="text" value={localSettings.whatsappNumber} onChange={e => setLocalSettings({...localSettings, whatsappNumber: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Entrega (R$)</label>
                  <input type="number" step="0.5" value={localSettings.deliveryFee} onChange={e => setLocalSettings({...localSettings, deliveryFee: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
                  <div className="flex gap-4">
                    <input type="color" value={localSettings.primaryColor} onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})} className="h-10 w-20 cursor-pointer border rounded" />
                    <input type="text" value={localSettings.primaryColor} onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})} className="flex-1 p-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Rodapé</label>
                  <input type="text" value={localSettings.footerText} onChange={e => setLocalSettings({...localSettings, footerText: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock size={20}/> Horário de Funcionamento</h2>
              <div className="space-y-4">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, idx) => {
                  const schedule = localSettings.schedule[idx];
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox" 
                          checked={schedule?.isOpen || false} 
                          onChange={() => handleDayToggle(idx)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="font-medium w-20">{day}</span>
                      </div>
                      {schedule?.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={schedule.open} onChange={(e) => handleTimeChange(idx, 'open', e.target.value)} className="p-1.5 border rounded" />
                          <span>até</span>
                          <input type="time" value={schedule.close} onChange={(e) => handleTimeChange(idx, 'close', e.target.value)} className="p-1.5 border rounded" />
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-sm">Fechado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button onClick={handleExportJSON} className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700">
                  <Download size={16} /> Exportar Backup (produtos.json)
                </button>
                <label className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700 cursor-pointer">
                  <Upload size={16} /> Importar Backup
                  <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
                </label>
              </div>

              <button onClick={handleSaveSettings} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700">
                <Save size={20} /> Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                  <input type="number" step="0.5" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select value={editingProduct.categoryId || ''} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})} className="w-full p-2 border rounded">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full p-2 border rounded h-20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">URL da Imagem</label>
                  <input type="text" value={editingProduct.image || ''} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full p-2 border rounded" />
                </div>
              </div>

              {/* Addons Sections */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Grupos de Adicionais (Max 2)</h3>
                  {(editingProduct.addonGroups?.length || 0) < 2 && (
                    <button 
                      onClick={() => setEditingProduct({
                        ...editingProduct, 
                        addonGroups: [...(editingProduct.addonGroups || []), { id: `ag_${Date.now()}`, name: 'Novo Grupo', max: 5, addons: [] }]
                      })}
                      className="text-sm text-blue-600 font-medium"
                    >
                      + Adicionar Grupo
                    </button>
                  )}
                </div>

                {editingProduct.addonGroups?.map((group, gIdx) => (
                  <div key={group.id} className="p-4 border rounded bg-gray-50 mb-4 space-y-4">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={group.name} 
                        onChange={e => {
                          const newGroups = [...(editingProduct.addonGroups || [])];
                          newGroups[gIdx].name = e.target.value;
                          setEditingProduct({...editingProduct, addonGroups: newGroups});
                        }}
                        className="flex-1 p-2 border rounded text-sm" placeholder="Nome (Ex: Escolha o Ponto da Carne)" 
                      />
                      <input 
                        type="number" 
                        title="Máximo de Opções"
                        value={group.max}
                        onChange={e => {
                          const newGroups = [...(editingProduct.addonGroups || [])];
                          newGroups[gIdx].max = Number(e.target.value);
                          setEditingProduct({...editingProduct, addonGroups: newGroups});
                        }}
                        className="w-20 p-2 border rounded text-sm" 
                      />
                      <button 
                        onClick={() => {
                          const newGroups = [...(editingProduct.addonGroups || [])];
                          newGroups.splice(gIdx, 1);
                          setEditingProduct({...editingProduct, addonGroups: newGroups});
                        }}
                        className="text-red-500 p-2"
                      ><Trash2 size={16}/></button>
                    </div>

                    {/* Addons inside group */}
                    <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                      {group.addons.map((addon, aIdx) => (
                        <div key={addon.id} className="flex gap-2">
                          <input 
                            type="text" 
                            value={addon.name}
                            onChange={e => {
                              const newGroups = [...(editingProduct.addonGroups || [])];
                              newGroups[gIdx].addons[aIdx].name = e.target.value;
                              setEditingProduct({...editingProduct, addonGroups: newGroups});
                            }}
                            className="flex-1 p-1 border rounded text-sm" placeholder="Nome do item"
                          />
                          <input 
                            type="number" 
                            value={addon.price}
                            onChange={e => {
                              const newGroups = [...(editingProduct.addonGroups || [])];
                              newGroups[gIdx].addons[aIdx].price = Number(e.target.value);
                              setEditingProduct({...editingProduct, addonGroups: newGroups});
                            }}
                            className="w-20 p-1 border rounded text-sm" placeholder="Valor"
                          />
                          <button 
                            onClick={() => {
                              const newGroups = [...(editingProduct.addonGroups || [])];
                              newGroups[gIdx].addons.splice(aIdx, 1);
                              setEditingProduct({...editingProduct, addonGroups: newGroups});
                            }}
                            className="text-red-500"
                          >&times;</button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newGroups = [...(editingProduct.addonGroups || [])];
                          newGroups[gIdx].addons.push({ id: `ad_${Date.now()}`, name: '', price: 0 });
                          setEditingProduct({...editingProduct, addonGroups: newGroups});
                        }}
                        className="text-sm text-gray-500 font-medium hover:text-gray-800"
                      >+ Adicionar Item</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 font-medium">Cancelar</button>
              <button onClick={handleSaveProduct} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Salvar Produto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;