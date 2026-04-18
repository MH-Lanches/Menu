import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Trash2, Printer, CheckCircle, XCircle, 
  Clock, Plus, Minus, Search, Layers, User, CreditCard, Banknote
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { cn, formatCurrency } from '../lib/utils';

export default function PDVPanel({ user, config }: { user: any, config: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('delivery');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('order', 'asc')), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      unsubOrders();
      unsubCats();
      unsubProducts();
      clearInterval(timer);
    };
  }, []);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const orderRef = doc(db, 'orders', id);
    if (newStatus === 'entregue') {
      const order = orders.find(o => o.id === id);
      await addDoc(collection(db, 'history'), { ...order, status: 'entregue', finishedAt: serverTimestamp() });
      await deleteDoc(orderRef);
      setSelectedOrder(null);
    } else if (newStatus === 'cancelado') {
      const order = orders.find(o => o.id === id);
      await addDoc(collection(db, 'canceled'), { ...order, status: 'cancelado', canceledAt: serverTimestamp() });
      await deleteDoc(orderRef);
      setSelectedOrder(null);
    } else {
      await updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() });
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const toggleStoreStatus = async () => {
    const configRef = doc(db, 'config', 'main');
    await updateDoc(configRef, { isOpen: !config?.isOpen });
  };

  return (
    <div className="flex flex-col h-screen bg-bg-base text-text-main font-sans overflow-hidden">
      {/* Header Area */}
      <header className="h-[70px] bg-surface border-b border-border-dim flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-[45px] h-[45px] bg-brand-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)] border-2 border-brand-secondary font-bold text-xs text-white">MH</div>
          <div>
            <h1 className="text-lg font-bold">MH LANCHES <span className="font-light opacity-70">ERP</span></h1>
            <button 
              onClick={toggleStoreStatus}
              className={cn(
                "mt-0.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all active:scale-95 block w-fit",
                config?.isOpen ? "bg-success-base/20 text-success-base border border-success-base/30" : "bg-danger-base/20 text-danger-base border border-danger-base/30"
              )}
            >
              ● {config?.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}
            </button>
          </div>
        </div>
        <div className="flex gap-5 items-center">
          <div className="text-right">
            <div className="text-xs text-text-dim">Operador: {user?.email?.split('@')[0]}</div>
            <div className="font-bold text-sm tracking-tight">{currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} | {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="w-10 h-10 bg-brand-primary/20 rounded-full border border-brand-primary/30 flex items-center justify-center text-brand-primary">
            <User size={20} />
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[280px_1fr_320px] gap-[1px] bg-border-dim overflow-hidden">
        {/* LEFT: ORDERS LIST */}
        <section className="bg-bg-base flex flex-col overflow-hidden">
          <div className="p-4 bg-surface border-b border-border-dim flex justify-between items-center h-[54px] shrink-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-text-dim">Pedidos Ativos</h2>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-text-dim font-mono">F2</span>
          </div>
          <div className="p-2 border-b border-border-dim bg-bg-base">
            <div className="flex gap-1 p-1 bg-surface/50 rounded-xl border border-border-dim/50">
              <button onClick={() => setActiveTab('delivery')} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", activeTab === 'delivery' ? "bg-brand-primary text-white shadow-lg" : "text-text-dim hover:bg-surface")}>Delivery</button>
              <button onClick={() => setActiveTab('tables')} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", activeTab === 'tables' ? "bg-brand-primary text-white shadow-lg" : "text-text-dim hover:bg-surface")}>Mesas</button>
              <button onClick={() => setActiveTab('counter')} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", activeTab === 'counter' ? "bg-brand-primary text-white shadow-lg" : "text-text-dim hover:bg-surface")}>Balcão</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {orders.filter(o => activeTab === 'delivery' ? (o.type === 'delivery' || o.type === 'pickup') : o.type === activeTab).map(order => (
              <button 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  "w-full p-3 rounded-xl border-l-[4px] transition-all text-left group bg-surface shadow-sm",
                  selectedOrder?.id === order.id ? "border-l-brand-secondary bg-brand-primary/10" : "border-l-brand-primary",
                  order.status === 'new' && "border-l-danger-base animate-pulse"
                )}
              >
                <div className="flex justify-between items-start mb-1 text-[10px]">
                  <span className="font-black text-text-dim">#{order.id.slice(-4)} - {order.type?.toUpperCase()}</span>
                  <span className="flex items-center gap-1 font-bold text-warning-base"><Clock size={10} /> 12:45</span>
                </div>
                <div className="font-bold text-sm mb-1 truncate">{order.customerName || 'Cliente Balcão'}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1 overflow-hidden h-1 flex-1 bg-black/30 rounded-full mr-4">
                    <div className={cn("h-full", order.status === 'new' ? "w-1/4 bg-danger-base" : order.status === 'delivered' ? "w-full bg-success-base" : "w-1/2 bg-brand-primary")}></div>
                  </div>
                  <span className="font-black text-sm text-brand-secondary">{formatCurrency(order.total || 0)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* CENTER: PRODUCT SELECTOR / ORDER DETAIL */}
        <section className="bg-bg-base flex flex-col overflow-hidden">
          {selectedOrder ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 bg-surface border-b border-border-dim flex justify-between items-center h-[54px] shrink-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-dim">Detalhes do Pedido</h2>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-bg-base border border-border-dim rounded hover:bg-surface transition-colors"><Printer size={14} /></button>
                  <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-bg-base border border-border-dim rounded hover:bg-danger-base/20 transition-colors text-danger-base"><XCircle size={14} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">#{selectedOrder.id.slice(-4)}</h3>
                    <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-1">{selectedOrder.customerName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-text-dim uppercase mb-1">Status Atual</div>
                    <div className="px-3 py-1 bg-brand-primary/20 border border-brand-primary/50 rounded-lg text-brand-primary text-[10px] font-black uppercase tracking-widest">{selectedOrder.status}</div>
                  </div>
                </div>

                <div className="bg-surface border border-border-dim rounded-2xl p-4 mb-8">
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-border-dim last:border-0 border-dashed">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight"><strong>{item.quantity}x</strong> {item.name}</p>
                          {item.observations && <p className="text-[10px] text-text-dim mt-1 italic opacity-60">Obs: {item.observations}</p>}
                        </div>
                        <p className="font-black text-[13px] text-brand-secondary">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <StatusBtn label="Novo Pedido" active={selectedOrder.status === 'novo'} onClick={() => updateOrderStatus(selectedOrder.id, 'novo')} />
                  <StatusBtn label="Em Produção" active={selectedOrder.status === 'producao'} onClick={() => updateOrderStatus(selectedOrder.id, 'producao')} />
                  <StatusBtn label="Pronto" active={selectedOrder.status === 'pronto'} onClick={() => updateOrderStatus(selectedOrder.id, 'pronto')} />
                  <StatusBtn label="Saiu p/ Entrega" active={selectedOrder.status === 'entrega'} onClick={() => updateOrderStatus(selectedOrder.id, 'entrega')} />
                </div>
              </div>
              <div className="p-4 bg-surface border-t border-border-dim grid grid-cols-2 gap-3">
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelado')} className="w-full py-3 bg-danger-base/10 border border-danger-base/30 text-danger-base rounded-xl font-black uppercase text-xs hover:bg-danger-base hover:text-white transition-all">Cancelar Pedido</button>
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'entregue')} className="w-full py-3 bg-success-base text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-success-base/20 hover:scale-[1.02] transition-all">Finalizar & Imprimir</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="category-bar h-[54px] bg-surface border-b border-border-dim flex items-center gap-2 px-3 overflow-x-auto no-scrollbar shrink-0">
                  <div className="cat-pill active">Populares</div>
                  {categories.map(c => <div key={c.id} className="cat-pill">{c.name}</div>)}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3">
                  {products.filter(p => !p.isPaused).map(product => (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-card bg-surface border border-border-dim rounded-xl overflow-hidden group hover:border-brand-primary transition-all text-left"
                    >
                      {product.isFeatured && <span className="absolute top-2 right-2 bg-brand-secondary text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">Destaque</span>}
                      <div className="h-24 bg-bg-base/50 flex items-center justify-center overflow-hidden">
                        <img 
                          src={product.images?.[0] || 'https://picsum.photos/seed/p/150/150'} 
                          className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-bold uppercase truncate tracking-tight">{product.name}</h4>
                        <p className="text-brand-secondary font-black text-sm mt-1">{formatCurrency(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: CART & PAYMENT */}
        <section className="bg-bg-base flex flex-col overflow-hidden">
          <div className="p-4 bg-surface border-b border-border-dim flex justify-between items-center h-[54px] shrink-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-text-dim">Carrinho Atual</h2>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-text-dim font-mono">F8</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-8 grayscale">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-tighter">Caixa Disponível</p>
                  <p className="text-[10px] uppercase mt-1">Aguardando produtos...</p>
               </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-border-dim border-dashed">
                  <div className="flex-1 mr-4">
                    <p className="text-xs font-bold uppercase truncate">{item.quantity}x {item.name}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-surface rounded border border-border-dim"><Minus size={10}/></button>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-surface rounded border border-border-dim"><Plus size={10}/></button>
                      <button onClick={() => removeFromCart(item.id)} className="p-1 text-danger-base hover:bg-danger-base/10 rounded"><Trash2 size={10}/></button>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-secondary">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-surface border-t border-border-dim">
            <div className="flex justify-between text-xs text-text-dim mb-2 uppercase tracking-widest font-bold">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-6 pt-2 border-t border-border-dim">
              <span className="text-xs font-black uppercase italic tracking-tighter">Total Geral</span>
              <span className="text-2xl font-black text-brand-secondary">{formatCurrency(cartTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button className="py-2.5 bg-bg-base border border-border-dim rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-brand-primary transition-all"><Banknote size={14} className="text-text-dim"/> Dinheiro</button>
              <button className="py-2.5 bg-bg-base border border-border-dim rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-brand-primary transition-all"><CreditCard size={14} className="text-text-dim"/> Cartão</button>
            </div>
            
            <button 
              disabled={cart.length === 0}
              className="w-full py-4 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-30 text-white rounded-xl font-black uppercase tracking-[0.2em] italic shadow-xl shadow-brand-primary/20 transition-all text-sm"
            >
              Finalizar Venda
            </button>
            <div className="text-center mt-4 text-[9px] text-text-dim uppercase tracking-widest">
              ESC p/ Limpar | F4 Balcão
            </div>
          </div>
        </section>
      </main>

      <footer className="h-[30px] bg-surface border-t border-border-dim flex items-center justify-between px-4 text-[10px] text-text-dim shrink-0">
        <div>Terminal: 01 | Versão 2.4.0</div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-success-base font-bold uppercase"><div className="w-1.5 h-1.5 bg-success-base rounded-full animate-pulse"></div> Firebase Conectado</span>
          <span className="uppercase">Sincronizado: Agora mesmo</span>
        </div>
      </footer>
    </div>
  );

  function updateCartQuantity(id: string, delta: number) {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }
}

function StatusBtn({ label, active, onClick }: { label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-3 px-2 rounded-lg border text-[9px] font-black uppercase tracking-widest text-center transition-all",
        active ? "bg-brand-secondary text-black inset-shadow-sm border-brand-secondary scale-95" : "bg-bg-base border-border-dim text-text-dim opacity-50"
      )}
    >
      {label}
    </button>
  );
}
