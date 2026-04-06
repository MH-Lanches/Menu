import { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { Settings, Tag, Package, Plus, Edit2, Trash2, GripVertical, Check, X, Search, Pause, Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'config'>('products');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
            <a href="/" className="text-sm font-medium text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded-md transition-colors">Ver Loja</a>
          </div>
          <nav className="flex gap-2">
            <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={18} />} label="Produtos" />
            <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Tag size={18} />} label="Categorias" />
            <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={18} />} label="Configurações" />
          </nav>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'config' && <ConfigTab />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
        active ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")}
    >
      {icon} {label}
    </button>
  );
}

// --- CONFIG TAB ---
function ConfigTab() {
  const { config, updateConfig, updateSchedule } = useStore();
  
  return (
    <div className="space-y-8 animate-in fade-in">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Aparência e Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Cor Principal (Hexadecimal)</label>
            <div className="flex gap-3">
              <input type="color" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="h-10 w-10 p-1 rounded bg-gray-50 border border-gray-200 cursor-pointer" />
              <input type="text" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone WhatsApp</label>
            <input type="text" value={config.phone} onChange={e => updateConfig({ phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none" placeholder="Ex: 5511999999999" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Taxa de Entrega (R$)</label>
            <input type="number" step="0.1" value={config.deliveryFee} onChange={e => updateConfig({ deliveryFee: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texto de Rodapé</label>
            <input type="text" value={config.footerText} onChange={e => updateConfig({ footerText: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Horário de Funcionamento Automático</h2>
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((dayName, index) => {
            const schedule = config.schedule[index];
            return (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 w-40">
                  <input type="checkbox" checked={schedule.isOpen} onChange={e => updateSchedule(index, { isOpen: e.target.checked })} className="w-5 h-5 accent-gray-900" />
                  <span className="font-medium">{dayName}</span>
                </div>
                <div className="flex items-center gap-2 opacity-100 transition-opacity" style={{ opacity: schedule.isOpen ? 1 : 0.5, pointerEvents: schedule.isOpen ? 'auto' : 'none' }}>
                  <input type="time" value={schedule.openTime} onChange={e => updateSchedule(index, { openTime: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  <span className="text-gray-400">até</span>
                  <input type="time" value={schedule.closeTime} onChange={e => updateSchedule(index, { closeTime: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// --- CATEGORIES TAB ---
function CategoriesTab() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategory } = useStore();
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!newCat.trim()) return;
    addCategory(newCat.trim());
    setNewCat('');
  };

  const handleSaveEdit = () => {
    if (editingName.trim()) updateCategory(editingId, editingName.trim());
    setEditingId('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Nova Categoria</h2>
        <div className="flex gap-2">
          <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Nome da Categoria (ex: Bebidas)" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none" />
          <button onClick={handleAdd} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
            <Plus size={18} /> Adicionar
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        {sorted.length === 0 && <p className="text-gray-500 text-center py-4">Nenhuma categoria cadastrada.</p>}
        {sorted.map((cat, index) => (
          <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
            <div className="flex flex-col text-gray-400">
              <button onClick={() => reorderCategory(cat.id, 'up')} disabled={index === 0} className="hover:text-gray-900 disabled:opacity-30"><GripVertical size={16} /></button>
            </div>
            
            {editingId === cat.id ? (
              <div className="flex-1 flex gap-2">
                <input type="text" autoFocus value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900" />
                <button onClick={handleSaveEdit} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={20} /></button>
                <button onClick={() => setEditingId('')} className="text-red-600 p-1 hover:bg-red-50 rounded"><X size={20} /></button>
              </div>
            ) : (
              <>
                <span className="flex-1 font-medium">{cat.name}</span>
                <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PRODUCTS TAB ---
function ProductsTab() {
  const { products, categories, addProduct, updateProduct, deleteProduct, toggleProductActive } = useStore();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all'|'active'|'paused'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Partial<Product> | null>(null);

  const displayProducts = useMemo(() => {
    let res = products;
    if (search) res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.price.toString().includes(search));
    if (filterActive === 'active') res = res.filter(p => p.active);
    if (filterActive === 'paused') res = res.filter(p => !p.active);
    return res;
  }, [products, search, filterActive]);

  const openNew = () => {
    setEditingProd({
      name: '', price: 0, description: '', imageUrl: '', categoryId: categories[0]?.id || '', active: true, isPizza: false, additionals: []
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProd({ ...p });
    setIsModalOpen(true);
  };

  const saveProduct = () => {
    if (!editingProd?.name || !editingProd?.categoryId) return alert('Nome e categoria são obrigatórios');
    if (editingProd.id) {
      updateProduct(editingProd.id, editingProd);
    } else {
      addProduct(editingProd as Omit<Product, 'id'>);
    }
    setIsModalOpen(false);
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Buscar por nome ou preço..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50" />
          </div>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)} className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none">
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="paused">Apenas Pausados</option>
          </select>
        </div>
        <button onClick={openNew} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProducts.map(p => (
          <div key={p.id} className={cn("bg-white rounded-xl shadow-sm border p-4 flex flex-col transition-opacity", !p.active ? "opacity-60 border-gray-200" : "border-gray-200 hover:border-gray-300")}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{p.name}</h3>
              <button 
                onClick={() => toggleProductActive(p.id)}
                title={p.active ? "Pausar Produto" : "Ativar Produto"}
                className={cn("p-1.5 rounded-md transition-colors", p.active ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-green-600 bg-green-50 hover:bg-green-100")}
              >
                {p.active ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
            
            <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px] mb-3">{p.description || 'Sem descrição'}</p>
            
            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-900">{formatMoney(p.price)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
              <h2 className="text-xl font-bold">{editingProd.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Produto *</label>
                  <input type="text" value={editingProd.name} onChange={e => setEditingProd({...editingProd, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Ex: X-Tudo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço Base (R$) *</label>
                  <input type="number" step="0.1" value={editingProd.price} onChange={e => setEditingProd({...editingProd, price: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria *</label>
                <select value={editingProd.categoryId} onChange={e => setEditingProd({...editingProd, categoryId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none bg-white">
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea value={editingProd.description} onChange={e => setEditingProd({...editingProd, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Ingredientes e detalhes..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL da Foto</label>
                <input type="text" value={editingProd.imageUrl} onChange={e => setEditingProd({...editingProd, imageUrl: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none" placeholder="https://..." />
                {editingProd.imageUrl && <img src={editingProd.imageUrl} alt="Preview" className="mt-2 h-20 rounded object-cover border border-gray-200" />}
              </div>

              <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
                <input type="checkbox" id="ispizza" checked={editingProd.isPizza} onChange={e => setEditingProd({...editingProd, isPizza: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                <label htmlFor="ispizza" className="font-medium cursor-pointer">Habilitar "Meio a Meio" para este item (Comportamento de Pizza)</label>
              </div>

              {/* Additionals Management */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Barras de Adicionais</h3>
                  {(editingProd.additionals?.length || 0) < 2 && (
                    <button onClick={() => {
                      const newBar = { id: Math.random().toString(36).substr(2,9), name: 'Nova Barra', limit: 5, items: [] };
                      setEditingProd({...editingProd, additionals: [...(editingProd.additionals || []), newBar]});
                    }} className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                      + Adicionar Barra
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {editingProd.additionals?.map((bar, barIndex) => (
                    <div key={bar.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Nome da Barra</label>
                          <input type="text" value={bar.name} onChange={e => {
                            const newAdds = [...editingProd.additionals!];
                            newAdds[barIndex].name = e.target.value;
                            setEditingProd({...editingProd, additionals: newAdds});
                          }} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 outline-none" />
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Limite máx.</label>
                          <input type="number" min={1} value={bar.limit} onChange={e => {
                            const newAdds = [...editingProd.additionals!];
                            newAdds[barIndex].limit = parseInt(e.target.value) || 1;
                            setEditingProd({...editingProd, additionals: newAdds});
                          }} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 outline-none" />
                        </div>
                        <div className="pt-5">
                          <button onClick={() => {
                            const newAdds = editingProd.additionals!.filter((_, i) => i !== barIndex);
                            setEditingProd({...editingProd, additionals: newAdds});
                          }} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Remover barra"><Trash2 size={18} /></button>
                        </div>
                      </div>

                      {/* Items in the bar */}
                      <div className="space-y-2 mt-4 pl-4 border-l-2 border-gray-200">
                        {bar.items.map((item, itemIndex) => (
                          <div key={item.id} className="flex gap-2">
                            <input type="text" placeholder="Nome do item" value={item.name} onChange={e => {
                              const newAdds = [...editingProd.additionals!];
                              newAdds[barIndex].items[itemIndex].name = e.target.value;
                              setEditingProd({...editingProd, additionals: newAdds});
                            }} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-500" />
                            <input type="number" placeholder="R$ 0,00" value={item.price} onChange={e => {
                              const newAdds = [...editingProd.additionals!];
                              newAdds[barIndex].items[itemIndex].price = parseFloat(e.target.value) || 0;
                              setEditingProd({...editingProd, additionals: newAdds});
                            }} className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-500" />
                            <button onClick={() => {
                              const newAdds = [...editingProd.additionals!];
                              newAdds[barIndex].items = newAdds[barIndex].items.filter((_, i) => i !== itemIndex);
                              setEditingProd({...editingProd, additionals: newAdds});
                            }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><X size={16} /></button>
                          </div>
                        ))}
                        <button onClick={() => {
                          const newAdds = [...editingProd.additionals!];
                          newAdds[barIndex].items.push({ id: Math.random().toString(36).substr(2,9), name: '', price: 0 });
                          setEditingProd({...editingProd, additionals: newAdds});
                        }} className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 mt-2">
                          <Plus size={14} /> Adicionar Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={saveProduct} className="px-5 py-2 font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Salvar Produto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}