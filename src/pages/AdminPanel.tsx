import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Package, ListTree, Users, 
  Settings, LogOut, TrendingUp, DollarSign, Clock, X, Plus, 
  ChevronRight, Trash2, Edit3, Image as ImageIcon, Check, Filter
} from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, orderBy, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn, formatCurrency } from '../lib/utils';

export default function AdminPanel({ user, config }: { user: any, config: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('order', 'asc')), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(collection(db, 'orders'), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubHistory = onSnapshot(collection(db, 'history'), (s) => setSalesHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => {
      unsubProducts();
      unsubCats();
      unsubOrders();
      unsubHistory();
    };
  }, []);

  const totalSales = salesHistory.reduce((acc, o) => acc + (o.total || 0), 0);

  const toggleStoreStatus = async () => {
    const configRef = doc(db, 'config', 'main');
    await updateDoc(configRef, { isOpen: !config?.isOpen });
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-main font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-surface border-r border-border-dim flex flex-col shrink-0">
        <div className="h-[70px] flex items-center px-6 border-b border-border-dim">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-black text-xs text-white">MH</div>
              <h1 className="text-sm font-black tracking-widest uppercase italic"><span className="text-brand-primary">ERP</span> ADMIN</h1>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ShoppingBag />} label="Produtos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavItem icon={<ListTree />} label="Categorias" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
          <NavItem icon={<Package />} label="Vendas" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <div className="my-6 border-t border-border-dim pt-4">
             <span className="px-4 text-[10px] font-black uppercase text-text-dim tracking-widest mb-2 block">Sistema</span>
             <NavItem icon={<Settings />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
             <NavItem icon={<Users />} label="Operadores" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          </div>
        </nav>

        <div className="p-4 border-t border-border-dim bg-bg-base/30">
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 text-danger-base hover:bg-danger-base/10 rounded-xl transition-all font-bold uppercase text-xs tracking-wider"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-bg-base">
        <header className="h-[70px] bg-surface border-b border-border-dim flex items-center justify-between px-8 sticky top-0 z-10">
           <div>
              <h2 className="text-xs font-black uppercase text-text-dim tracking-[0.2em]">Caminho: <span className="text-text-main">{activeTab}</span></h2>
           </div>
           <div className="flex gap-4 items-center">
              <div className="text-right">
                <p className="text-xs font-bold">{user?.email}</p>
                <button 
                  onClick={toggleStoreStatus}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all active:scale-95",
                    config?.isOpen ? "bg-success-base/20 text-success-base border border-success-base/30" : "bg-danger-base/20 text-danger-base border border-danger-base/30"
                  )}
                >
                  ● {config?.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
                </button>
              </div>
              <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center border border-brand-primary/30 text-brand-primary">
                 <Users size={18}/>
              </div>
           </div>
        </header>

        <div className="flex-1 p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="dash">
                <header className="mb-10">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Overview <span className="text-brand-secondary">Dashboard</span></h2>
                  <p className="text-text-dim font-bold uppercase text-[10px] tracking-widest mt-1 opacity-60">Resultados da sua operação em tempo real</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  <StatCard icon={<TrendingUp />} label="Faturamento Bruto" value={formatCurrency(totalSales)} trend="+12.5%" />
                  <StatCard icon={<ShoppingBag />} label="Pedidos Conciliados" value={orders.length.toString()} trend="Estável" />
                  <StatCard icon={<DollarSign />} label="Ticket Médio" value={formatCurrency(totalSales / (salesHistory.length || 1))} />
                  <StatCard icon={<Clock />} label="Tempo de Preparo" value="18 min" trend="-2 min" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-card bg-surface border border-border-dim rounded-3xl p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-brand-primary rounded-full"></div>
                      Vendas Recentes
                    </h3>
                    <div className="space-y-3">
                      {salesHistory.slice(-6).map((s) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-bg-base/50 rounded-2xl border border-transparent hover:border-border-dim transition-all group">
                          <div className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center font-black text-text-dim text-sm uppercase tracking-tighter italic shadow-inner">#PDV</div>
                          <div className="flex-1">
                            <div className="font-bold text-sm uppercase tracking-tight">{s.customerName || 'Cliente Balcão'}</div>
                            <p className="text-[10px] text-text-dim font-black uppercase tracking-widest opacity-40">Via {s.type || 'Pdv'}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-sm text-brand-secondary">{formatCurrency(s.total)}</div>
                            <div className="text-[9px] uppercase font-black text-success-base tracking-widest">Finalizada</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-card bg-surface border border-border-dim rounded-3xl p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-brand-secondary rounded-full"></div>
                       Mais Populares
                    </h3>
                    <div className="space-y-6">
                      {products.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center font-black text-[10px] italic text-brand-secondary border border-border-dim">{i + 1}</div>
                          <div className="flex-1">
                            <div className="font-bold text-xs uppercase tracking-tight truncate">{p.name}</div>
                            <div className="w-full bg-bg-base h-1 mt-2 rounded-full overflow-hidden">
                               <div className="h-full bg-brand-primary" style={{ width: `${100 - (i * 15)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key="products">
                <header className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Estoque de <span className="text-brand-primary">Produtos</span></h2>
                    <p className="text-text-dim font-bold uppercase text-[10px] tracking-widest mt-1 opacity-60">Gestão integrada de cardápio e insumos</p>
                  </div>
                  <button 
                    onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                    className="bg-brand-primary hover:bg-brand-primary/80 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest shadow-[0_10px_30px_rgba(124,58,237,0.3)] transition-all flex items-center gap-3 active:scale-95"
                  >
                    <Plus size={20} strokeWidth={3} /> Criar Item
                  </button>
                </header>

                <div className="bg-surface border border-border-dim rounded-3xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-bg-base/50 text-text-dim text-[10px] uppercase font-black tracking-[0.2em] border-b border-border-dim">
                      <tr>
                        <th className="px-8 py-5">Visual / Nome</th>
                        <th className="px-8 py-5">Categoria</th>
                        <th className="px-8 py-5">Preço Unitário</th>
                        <th className="px-8 py-5">Canal</th>
                        <th className="px-8 py-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dim">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-bg-base/30 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center overflow-hidden border border-border-dim group-hover:border-brand-primary transition-all">
                                <img src={p.images?.[0] || 'https://picsum.photos/seed/p/100/100'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
                              </div>
                              <div>
                                <div className="font-bold uppercase text-sm tracking-tight text-white">{p.name}</div>
                                <div className="text-[10px] text-text-dim font-black uppercase mt-1">ID: {p.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-bg-base rounded-full text-[10px] font-black uppercase tracking-widest text-text-dim border border-border-dim">
                                {categories.find(c => c.id === p.categoryId)?.name || 'Sem Categoria'}
                             </span>
                          </td>
                          <td className="px-8 py-5 font-black text-brand-secondary">{formatCurrency(p.price)}</td>
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                              p.isPaused ? "bg-danger-base/10 text-danger-base border border-danger-base/30" : "bg-success-base/10 text-success-base border border-success-base/30"
                            )}>
                              {p.isPaused ? 'Indisponível' : 'Em Venda'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button className="p-2.5 bg-bg-base hover:bg-brand-primary hover:text-white border border-border-dim rounded-xl transition-all"><Edit3 size={16} /></button>
                              <button className="p-2.5 bg-bg-base hover:bg-danger-base hover:text-white border border-border-dim rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && (
                     <div className="py-20 text-center text-text-dim font-black uppercase tracking-widest opacity-20">Nenhum produto cadastrado</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="settings">
                <header className="mb-10">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">System <span className="text-brand-secondary">Settings</span></h2>
                  <p className="text-text-dim font-bold uppercase text-[10px] tracking-widest mt-1 opacity-60">Personalização profunda da sua marca</p>
                </header>

                <div className="max-w-4xl space-y-6">
                  <section className="bg-surface border border-border-dim rounded-3xl p-8 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-brand-primary rounded-full"></div>
                       Identidade Visual & Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest transition-all group-focus-within:text-brand-primary">Nome da Unidade</label>
                        <input type="text" value={config?.name} className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold transition-all" />
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest transition-all group-focus-within:text-brand-primary">WhatsApp Conciliador</label>
                        <input type="text" value={config?.phone} className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold transition-all" />
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest transition-all group-focus-within:text-brand-primary">Endereço de Atendimento</label>
                        <input type="text" value={config?.address} className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold transition-all" />
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest transition-all group-focus-within:text-brand-primary">Taxa Fixa Delivery (R$)</label>
                        <input type="number" step="0.01" value={config?.deliveryFee} className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold transition-all" />
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest transition-all group-focus-within:text-brand-primary">Valor Mínimo p/ Pedido</label>
                        <input type="number" step="0.01" value={config?.minOrder} className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold transition-all" />
                      </div>
                    </div>
                  </section>

                  <section className="bg-surface border border-border-dim rounded-3xl p-8 shadow-xl">
                     <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-warning-base rounded-full"></div>
                        Horários de Funcionamento
                     </h3>
                     <div className="flex flex-col gap-4">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                           <div key={day} className="flex items-center justify-between p-4 bg-bg-base border border-border-dim rounded-2xl">
                              <span className="text-xs font-black uppercase tracking-widest">{day}</span>
                              <div className="flex gap-4 items-center">
                                 <input type="time" className="bg-surface border border-border-dim rounded-lg p-2 text-xs font-bold" defaultValue="18:00" />
                                 <span className="text-text-dim text-[10px] font-black">ATÉ</span>
                                 <input type="time" className="bg-surface border border-border-dim rounded-lg p-2 text-xs font-bold" defaultValue="23:30" />
                                 <div className="w-12 h-6 bg-success-base/20 rounded-full relative p-1 cursor-pointer">
                                    <div className="w-4 h-4 bg-success-base rounded-full translate-x-6 transition-all"></div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  <button className="w-full bg-success-base hover:bg-success-base/80 text-white font-black py-5 rounded-3xl uppercase italic tracking-[0.2em] shadow-2xl transition-all shadow-success-base/20 flex items-center justify-center gap-4">
                    <Check size={24} strokeWidth={3} />
                    Confirmar Configurações
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all group relative",
        active ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20" : "text-text-dim hover:text-text-main hover:bg-bg-base"
      )}
    >
      {active && <motion.div layoutId="nav-pill" className="absolute left-1 w-1.5 h-8 bg-brand-secondary rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]" />}
      {React.cloneElement(icon, { size: 18, strokeWidth: active ? 3 : 2, className: active ? "text-white" : "text-text-dim transition-colors group-hover:text-brand-primary" })}
      <span className={cn("text-[11px] font-black uppercase tracking-widest transition-all", active ? "translate-x-1" : "")}>{label}</span>
      {active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
    </button>
  );
}

function StatCard({ icon, label, value, trend }: { icon: any, label: string, value: string, trend?: string }) {
  return (
    <div className="p-card bg-surface border border-border-dim rounded-[32px] p-8 flex flex-col relative overflow-hidden group hover:border-brand-primary/50 transition-all">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-all"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-dim flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
          {React.cloneElement(icon, { size: 24, strokeWidth: 2 })}
        </div>
        {trend && (
           <span className={cn(
             "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
             trend.startsWith('+') ? "text-success-base bg-success-base/10" : "text-text-dim bg-bg-base"
           )}>
             {trend}
           </span>
        )}
      </div>
      <div>
        <h4 className="text-text-dim text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">{label}</h4>
        <p className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-brand-primary transition-colors">{value}</p>
      </div>
    </div>
  );
}
