import React, { useState, useEffect } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, Category, SiteConfig, Order } from "../types";
import { 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Trash2, 
  Save,
  TrendingUp,
  Users,
  Ticket,
  Bike,
  Utensils,
  Package,
  List,
  Edit,
  Search,
  ShoppingCart,
  DollarSign,
  Tags,
  ShoppingBag,
  Pencil,
  ChevronRight,
  Database,
  RefreshCw,
  Download,
  Shield,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "categorias" | "config" | "database">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "MOD">("ADMIN");
  const [dbSource, setDbSource] = useState<"firebase" | "local">("firebase");
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    lojaNome: "MH Lanches",
    logoUrl: "",
    tituloPrincipal: "MH LANCHES",
    slogan: "Seu delivery favorito!",
    taxaEntrega: 5,
    valorMinimo: 15,
    whatsapp: "",
    sobreTexto1: "",
    sobreTexto2: "",
    lojaEndereco: "",
    copyright: "© 2024 MH Lanches. Todos os direitos reservados."
  });
  const [coupons, setCoupons] = useState<any[]>([]);

  const handleBackup = () => {
    const data = { products, categories, siteConfig, coupons, orders };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_mh_lanches_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleReset = async () => {
    if (confirm("ATENÇÃO: Isso limpará todo o histórico de vendas e pedidos. Deseja continuar?")) {
      handleBackup(); // Auto backup before reset
      try {
        await set(ref(db, "pedidos"), null);
        alert("Histórico resetado com sucesso! Backup salvo automaticamente.");
      } catch (error) {
        alert("Erro ao resetar banco.");
      }
    }
  };

  useEffect(() => {
    onValue(ref(db, "config"), (snapshot) => {
      if (snapshot.exists()) setSiteConfig(snapshot.val());
    });

    onValue(ref(db, "cupons"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCoupons(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      }
    });
  }, []);

  const handleSaveConfig = async () => {
    try {
      await set(ref(db, "config"), siteConfig);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar config:", error);
      alert("Erro ao salvar configurações.");
    }
  };

  const handleSaveCoupon = async (coupon: any) => {
    try {
      const id = coupon.id || Date.now().toString();
      await set(ref(db, `cupons/${id}`), coupon);
    } catch (error) {
      console.error("Erro ao salvar cupom:", error);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (confirm("Excluir este cupom?")) {
      await set(ref(db, `cupons/${id}`), null);
    }
  };

  useEffect(() => {
    onValue(ref(db, "produtos"), (snap) => {
      if (snap.exists()) setProducts(Object.values(snap.val()));
    });
    onValue(ref(db, "categorias"), (snap) => {
      if (snap.exists()) setCategories(Object.values(snap.val()));
    });
    onValue(ref(db, "pedidos"), (snap) => {
      if (snap.exists()) setOrders(Object.values(snap.val()));
    });
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.nome) return;

    const id = editingProduct.id || Date.now();
    const productData = { ...editingProduct, id };

    try {
      await set(ref(db, `produtos/${id}`), productData);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const deleteProduct = async (id: string | number) => {
    if (confirm("Deseja realmente excluir este produto?")) {
      await remove(ref(db, `produtos/${id}`));
    }
  };

  const stats = {
    totalVendas: orders.reduce((acc, o) => acc + o.total, 0),
    totalPedidos: orders.length,
    ticketMedio: orders.length > 0 ? orders.reduce((acc, o) => acc + o.total, 0) / orders.length : 0,
    produtosAtivos: products.filter(p => !p.pausado).length
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a1a]">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-neon-pink/20 flex flex-col">
        <div className="p-6">
          <h1 className="font-display text-xl font-bold text-neon-pink">MH ADMIN</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "produtos", label: "Produtos", icon: Plus },
            { id: "categorias", label: "Categorias", icon: Tags },
            { id: "cupons", label: "Cupons", icon: ShoppingBag },
            { id: "config", label: "Configurações", icon: Settings },
            { id: "database", label: "Banco de Dados", icon: Database }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === item.id 
                  ? "bg-neon-pink text-white shadow-lg shadow-neon-pink/20" 
                  : "text-gray-400 hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Vendas Totais", value: `R$ ${stats.totalVendas.toFixed(2)}`, icon: TrendingUp, color: "text-green-400" },
                { label: "Pedidos", value: stats.totalPedidos, icon: ShoppingBag, color: "text-neon-cyan" },
                { label: "Ticket Médio", value: `R$ ${stats.ticketMedio.toFixed(2)}`, icon: Users, color: "text-yellow-400" },
                { label: "Produtos Ativos", value: stats.produtosAtivos, icon: Plus, color: "text-neon-pink" }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "produtos" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Produtos</h2>
              <button 
                onClick={() => {
                  setEditingProduct({ tipo: 'simples', pausado: false });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-neon-pink rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" /> Novo Produto
              </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-gray-400 font-semibold">Produto</th>
                    <th className="px-6 py-4 text-gray-400 font-semibold">Categoria</th>
                    <th className="px-6 py-4 text-gray-400 font-semibold">Preço</th>
                    <th className="px-6 py-4 text-gray-400 font-semibold">Status</th>
                    <th className="px-6 py-4 text-gray-400 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={prod.imagem} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-bold">{prod.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{prod.categoria}</td>
                      <td className="px-6 py-4 font-bold text-neon-cyan">R$ {prod.preco.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold",
                          prod.pausado ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        )}>
                          {prod.pausado ? "PAUSADO" : "ATIVO"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-neon-cyan transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteProduct(prod.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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

        {activeTab === "categorias" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Categorias</h2>
              <button 
                onClick={() => {
                  const nome = prompt("Nome da nova categoria:");
                  if (nome) set(ref(db, "categorias"), [...categories, nome]);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" /> Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-neon-cyan">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold">{cat}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm(`Excluir categoria "${cat}"?`)) {
                        set(ref(db, "categorias"), categories.filter(c => c !== cat));
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cupons" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Cupons de Desconto</h2>
              <button 
                onClick={() => {
                  const codigo = prompt("Código do cupom:");
                  const valor = prompt("Valor do desconto (R$):");
                  if (codigo && valor) handleSaveCoupon({ codigo, valor: parseFloat(valor), ativo: true });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-neon-pink rounded-xl font-bold hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" /> Novo Cupom
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map(cupom => (
                <div key={cupom.id} className="glass-card p-6 rounded-2xl flex justify-between items-center group">
                  <div>
                    <span className="text-2xl font-black text-neon-pink">{cupom.codigo}</span>
                    <p className="text-gray-400 text-sm">Desconto de R$ {cupom.valor.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => deleteCoupon(cupom.id)}
                    className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Configurações do Site</h2>
            <div className="glass-card p-8 rounded-3xl border border-neon-pink/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-neon-cyan flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Identidade Visual
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Nome da Loja</label>
                    <input 
                      type="text"
                      value={siteConfig.lojaNome}
                      onChange={e => setSiteConfig(prev => ({ ...prev, lojaNome: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Título Principal</label>
                    <input 
                      type="text"
                      value={siteConfig.tituloPrincipal}
                      onChange={e => setSiteConfig(prev => ({ ...prev, tituloPrincipal: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Slogan</label>
                    <input 
                      type="text"
                      value={siteConfig.slogan}
                      onChange={e => setSiteConfig(prev => ({ ...prev, slogan: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">URL da Logo</label>
                    <input 
                      type="text"
                      value={siteConfig.logoUrl}
                      onChange={e => setSiteConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-neon-pink flex items-center gap-2">
                    <Bike className="w-5 h-5" /> Delivery & Contato
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">WhatsApp (com DDD)</label>
                    <input 
                      type="text"
                      value={siteConfig.whatsapp}
                      onChange={e => setSiteConfig(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                      placeholder="5511999999999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Taxa de Entrega (R$)</label>
                    <input 
                      type="number"
                      value={siteConfig.taxaEntrega}
                      onChange={e => setSiteConfig(prev => ({ ...prev, taxaEntrega: parseFloat(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Valor Mínimo (R$)</label>
                    <input 
                      type="number"
                      value={siteConfig.valorMinimo}
                      onChange={e => setSiteConfig(prev => ({ ...prev, valorMinimo: parseFloat(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Endereço da Loja</label>
                    <input 
                      type="text"
                      value={siteConfig.lojaEndereco}
                      onChange={e => setSiteConfig(prev => ({ ...prev, lojaEndereco: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-4">
                  <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Sobre a Empresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Texto 1</label>
                      <textarea 
                        rows={3}
                        value={siteConfig.sobreTexto1}
                        onChange={e => setSiteConfig(prev => ({ ...prev, sobreTexto1: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Texto 2</label>
                      <textarea 
                        rows={3}
                        value={siteConfig.sobreTexto2}
                        onChange={e => setSiteConfig(prev => ({ ...prev, sobreTexto2: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5">
                <button 
                  onClick={handleSaveConfig}
                  className="flex items-center gap-2 px-8 py-4 bg-neon-pink rounded-xl font-bold shadow-lg shadow-neon-pink/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save className="w-5 h-5" /> Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "database" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Gerenciamento de Banco de Dados</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Toggle */}
              <div className="glass-card p-8 rounded-3xl border-neon-cyan/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Fonte de Dados</h3>
                    <p className="text-sm text-gray-400">Alterne entre banco local e nuvem</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDbSource("firebase")}
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold transition-all border",
                      dbSource === "firebase" 
                        ? "bg-neon-cyan text-black border-neon-cyan shadow-lg shadow-neon-cyan/20" 
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    )}
                  >
                    FIREBASE (Nuvem)
                  </button>
                  <button 
                    onClick={() => setDbSource("local")}
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold transition-all border",
                      dbSource === "local" 
                        ? "bg-neon-cyan text-black border-neon-cyan shadow-lg shadow-neon-cyan/20" 
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    )}
                  >
                    LOCAL (JSON)
                  </button>
                </div>
              </div>

              {/* Reset/Backup */}
              <div className="glass-card p-8 rounded-3xl border-red-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Manutenção</h3>
                    <p className="text-sm text-gray-400">Limpeza e backup do sistema</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleBackup}
                    className="flex-1 py-4 glass-card border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/5 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> BACKUP
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 py-4 bg-red-500/20 border border-red-500/50 text-red-500 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                  >
                    RESETAR BANCO
                  </button>
                </div>
              </div>

              {/* User Access */}
              <div className="glass-card p-8 rounded-3xl border-neon-pink/20 md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-neon-pink/10 text-neon-pink">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Níveis de Acesso</h3>
                    <p className="text-sm text-gray-400">Defina permissões para usuários</p>
                  </div>
                </div>
                <div className="flex gap-4 max-w-md">
                  <button 
                    onClick={() => setUserRole("ADMIN")}
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold transition-all border flex items-center justify-center gap-2",
                      userRole === "ADMIN" 
                        ? "bg-neon-pink text-white border-neon-pink shadow-lg shadow-neon-pink/20" 
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    )}
                  >
                    🔴 ADMIN (Total)
                  </button>
                  <button 
                    onClick={() => setUserRole("MOD")}
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold transition-all border flex items-center justify-center gap-2",
                      userRole === "MOD" 
                        ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20" 
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    )}
                  >
                    🟢 MOD (PDV/Pedidos)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass rounded-3xl p-8 border border-neon-pink/30"
            >
              <h3 className="text-2xl font-bold text-neon-pink mb-6">
                {editingProduct?.id ? "Editar Produto" : "Novo Produto"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Nome</label>
                    <input 
                      type="text"
                      required
                      value={editingProduct?.nome || ""}
                      onChange={e => setEditingProduct(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Preço (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={editingProduct?.preco || ""}
                      onChange={e => setEditingProduct(prev => ({ ...prev, preco: parseFloat(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Categoria</label>
                    <select 
                      required
                      value={editingProduct?.categoria || ""}
                      onChange={e => setEditingProduct(prev => ({ ...prev, categoria: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    >
                      <option value="">Selecione</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Descrição</label>
                    <textarea 
                      rows={3}
                      value={editingProduct?.descricao || ""}
                      onChange={e => setEditingProduct(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-400 mb-2">URL da Imagem</label>
                    <input 
                      type="text"
                      value={editingProduct?.imagem || ""}
                      onChange={e => setEditingProduct(prev => ({ ...prev, imagem: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-pink outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 glass-card rounded-xl font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-neon-pink rounded-xl font-bold shadow-lg shadow-neon-pink/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
