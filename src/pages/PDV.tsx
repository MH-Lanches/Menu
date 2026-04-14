import { useState, useEffect } from "react";
import { ref, onValue, update, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Order, Product } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  Package, 
  CheckCircle2, 
  Bike, 
  CheckCheck, 
  DollarSign,
  Bell,
  RefreshCw,
  Printer,
  Settings,
  LogOut,
  Plus,
  Utensils,
  Search,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import QuickSaleModal from "../components/QuickSaleModal";

const STATUS_CONFIG = {
  novo: { label: "Novo", icon: Bell, color: "bg-neon-pink" },
  producao: { label: "Produção", icon: Package, color: "bg-yellow-500" },
  pronto: { label: "Pronto", icon: CheckCircle2, color: "bg-green-500" },
  "saiu-entrega": { label: "Saiu p/ Entrega", icon: Bike, color: "bg-purple-500" },
  entregue: { label: "Entregue", icon: CheckCheck, color: "bg-emerald-600" },
  pago: { label: "Pago", icon: DollarSign, color: "bg-neon-cyan" },
  finalizado: { label: "Finalizado", icon: CheckCheck, color: "bg-gray-600" }
};

export default function PDV() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"delivery" | "mesa" | "balcao">("delivery");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const ordersRef = ref(db, "pedidos");
    onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: value.id || key
        }));
        
        const sortedList = list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        
        // Sound alert for new orders
        if (list.length > prevOrdersCount && prevOrdersCount !== 0) {
          const audio = new Audio("https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/music%2Falert.mp3?alt=media");
          audio.play().catch(e => console.log("Erro ao tocar som:", e));
        }
        
        setOrders(sortedList);
        setPrevOrdersCount(list.length);
      }
    });

    return () => clearInterval(timer);
  }, [prevOrdersCount]);

  const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await update(ref(db, `pedidos/${orderId}`), { status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (confirm("Deseja realmente excluir este pedido?")) {
      try {
        await set(ref(db, `pedidos/${orderId}`), null);
      } catch (error) {
        console.error("Erro ao excluir pedido:", error);
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === "delivery" ? (o.tipo === "delivery" || !o.tipo) : o.tipo === activeTab;
    const matchesSearch = o.cliente.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch && o.status !== "finalizado";
  });

  const stats = {
    novos: orders.filter(o => o.status === "novo").length,
    producao: orders.filter(o => o.status === "producao").length,
    prontos: orders.filter(o => o.status === "pronto").length,
    totalHoje: orders
      .filter(o => {
        const orderDate = new Date(o.data);
        return orderDate.toDateString() === new Date().toDateString();
      })
      .reduce((acc, o) => acc + o.total, 0)
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <QuickSaleModal 
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSuccess={() => {}}
      />

      {/* Header */}
      <header className="glass py-3 px-6 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl font-bold text-neon-cyan">PDV - MH LANCHES</h1>
          <span className="text-lg font-mono text-neon-pink">
            {currentTime.toLocaleTimeString("pt-BR")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsQuickSaleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black rounded-lg font-bold hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" /> NOVA VENDA
          </button>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <button className="p-2 glass-card rounded-lg hover:border-neon-cyan transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2 glass-card rounded-lg hover:border-neon-cyan transition-colors">
            <Printer className="w-5 h-5" />
          </button>
          <button className="p-2 glass-card rounded-lg hover:border-neon-cyan transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-red-500 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Novos", value: stats.novos, color: "bg-neon-pink", icon: Bell },
          { label: "Produção", value: stats.producao, color: "bg-yellow-500", icon: Package },
          { label: "Prontos", value: stats.prontos, color: "bg-green-500", icon: CheckCircle2 },
          { label: "Total Hoje", value: `R$ ${stats.totalHoje.toFixed(2)}`, color: "bg-neon-cyan", icon: DollarSign }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-xl flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            {(["delivery", "mesa", "balcao"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2",
                  activeTab === tab 
                    ? "bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20" 
                    : "glass-card hover:border-neon-cyan text-gray-400"
                )}
              >
                {tab === "delivery" && <Bike className="w-5 h-5" />}
                {tab === "mesa" && <Utensils className="w-5 h-5" />}
                {tab === "balcao" && <Package className="w-5 h-5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-neon-cyan outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map(order => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "glass-card rounded-2xl p-5 border-l-4 flex flex-col",
                  order.status === "novo" ? "border-l-neon-pink pulse-alert" : "border-l-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-gray-500">#{order.id.slice(-6)}</span>
                      {order.tipo === 'mesa' && <span className="text-[10px] bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full font-bold">MESA {order.mesa}</span>}
                    </div>
                    <h3 className="font-bold text-lg line-clamp-1">{order.cliente.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="p-1.5 glass hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white no-print"
                      title="Imprimir"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap",
                      STATUS_CONFIG[order.status].color
                    )}>
                      {STATUS_CONFIG[order.status].label.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Print Section (Hidden in UI, visible in Print) */}
                <div className="hidden print-section">
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>MH LANCHES</h2>
                    <p style={{ fontSize: '12px' }}>{new Date(order.data).toLocaleString()}</p>
                    <p style={{ fontWeight: 'bold' }}>PEDIDO: {order.id}</p>
                  </div>
                  <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                    <p><strong>CLIENTE:</strong> {order.cliente.nome}</p>
                    <p><strong>TEL:</strong> {order.cliente.telefone}</p>
                    {order.tipo === 'delivery' && (
                      <p><strong>END:</strong> {order.cliente.endereco}</p>
                    )}
                  </div>
                  <div style={{ borderBottom: '1px dashed black', marginBottom: '10px', paddingBottom: '10px' }}>
                    <p style={{ fontWeight: 'bold' }}>ITENS:</p>
                    {order.itens.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{item.qtd}x {item.nome}</span>
                        <span>R$ {(item.preco * item.qtd).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <p>SUBTOTAL: R$ {order.subtotal.toFixed(2)}</p>
                    <p>TAXA: R$ {order.taxa.toFixed(2)}</p>
                    <p style={{ fontSize: '16px' }}>TOTAL: R$ {order.total.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
                    <p>Obrigado pela preferência!</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-4 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {order.itens.map((item, i) => (
                    <div key={i} className="flex flex-col gap-0.5 pb-2 border-b border-white/5 last:border-0">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-semibold">{item.qtd}x {item.nome}</span>
                        <span className="text-gray-500">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                      </div>
                      {item.adicionais?.map((a, idx) => (
                        <span key={idx} className="text-[10px] text-neon-pink ml-4">+ {a.nome}</span>
                      ))}
                      {item.observacao && (
                        <span className="text-[10px] text-yellow-500 italic ml-4">Obs: {item.observacao}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">{order.pagamento}</span>
                    <span className="text-[10px] text-gray-400">{new Date(order.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="font-black text-neon-cyan text-xl">R$ {order.total.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {order.status === "novo" && (
                    <button 
                      onClick={() => updateStatus(order.id, "producao")}
                      className="col-span-2 py-3 bg-neon-pink text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-pink/20"
                    >
                      INICIAR PRODUÇÃO
                    </button>
                  )}
                  {order.status === "producao" && (
                    <button 
                      onClick={() => updateStatus(order.id, "pronto")}
                      className="col-span-2 py-3 bg-yellow-500 text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
                    >
                      MARCAR COMO PRONTO
                    </button>
                  )}
                  {order.status === "pronto" && (
                    <button 
                      onClick={() => updateStatus(order.id, order.tipo === 'delivery' ? "saiu-entrega" : "finalizado")}
                      className="col-span-2 py-3 bg-green-500 text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/20"
                    >
                      {order.tipo === 'delivery' ? "SAIU P/ ENTREGA" : "FINALIZAR"}
                    </button>
                  )}
                  {order.status === "saiu-entrega" && (
                    <button 
                      onClick={() => updateStatus(order.id, "entregue")}
                      className="col-span-2 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                    >
                      ENTREGUE
                    </button>
                  )}
                  {order.status === "entregue" && (
                    <button 
                      onClick={() => updateStatus(order.id, "pago")}
                      className="col-span-2 py-3 bg-neon-cyan text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-cyan/20"
                    >
                      RECEBER PAGAMENTO
                    </button>
                  )}
                  {order.status === "pago" && (
                    <button 
                      onClick={() => updateStatus(order.id, "finalizado")}
                      className="col-span-2 py-3 bg-gray-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-600/20"
                    >
                      FINALIZAR
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteOrder(order.id)}
                    className="col-span-2 py-2 text-gray-600 hover:text-red-500 text-xs font-bold transition-colors"
                  >
                    EXCLUIR PEDIDO
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Package className="w-20 h-20 mb-4 opacity-10" />
            <p className="text-xl font-bold">Nenhum pedido pendente</p>
            <p className="text-sm">Tudo em dia por aqui!</p>
          </div>
        )}
      </main>
    </div>
  );
}
