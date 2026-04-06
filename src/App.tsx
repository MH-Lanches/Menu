import { FormEvent, useEffect, useMemo, useState } from "react";

/* ── Tipos ────────────────────────────────────────────────── */
type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
};

type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  address: string;
  paymentMethod: string;
  serviceType: "delivery" | "retirada";
  observation: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: { name: string; qty: number; price: number }[];
};

type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  success: string;
  error: string;
};

type Settings = {
  brandName: string;
  slogan: string;
  whatsappNumber: string;
  deliveryFee: number;
  minOrderValue: number;
  accessPin: string;
  openingHours: string;
  deliveryTime: string;
  pickupTime: string;
  address: string;
  colors: BrandColors;
};

/* ── Constantes ──────────────────────────────────────────── */
const SETTINGS_KEY = "delivery-settings";
const PRODUCTS_KEY = "delivery-products";
const ORDERS_KEY = "delivery-orders";

const defaultColors: BrandColors = {
  primary: "#10b981",
  secondary: "#059669",
  accent: "#34d399",
  background: "#09090b",
  surface: "#18181b",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  success: "#22c55e",
  error: "#ef4444",
};

const defaultSettings: Settings = {
  brandName: "Delivery Pro",
  slogan: "Sabor na sua porta",
  whatsappNumber: "5511999999999",
  deliveryFee: 5,
  minOrderValue: 25,
  accessPin: "1234",
  openingHours: "18:00 - 23:00",
  deliveryTime: "40-60 min",
  pickupTime: "25 min",
  address: "",
  colors: defaultColors,
};

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Hambúrguer Artesanal",
    description: "Pão brioche, blend 180g, queijo, alface, tomate e maionese especial",
    category: "Lanches",
    price: 24.9,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "2",
    name: "Batata Frita Premium",
    description: "Batata crocante com queijo fundido e bacon",
    category: "Acompanhamentos",
    price: 18.9,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd6f877?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "3",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Sprite",
    category: "Bebidas",
    price: 5.9,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop",
    available: true,
  },
];

/* ── Hooks ───────────────────────────────────────────────── */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

/* ── Componentes ────────────────────────────────────────── */
function AdminPanel({
  settings,
  setSettings,
  products,
  setProducts,
  orders,
  setOrders,
  onClose,
  colors,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  orders: Order[];
  setOrders: (o: Order[]) => void;
  onClose: () => void;
  colors: BrandColors;
}) {
  const [activeTab, setActiveTab] = useState<"config" | "products" | "orders">("config");
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});

  

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Preencha o nome e preço do produto");
      return;
    }
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      description: newProduct.description || "",
      category: newProduct.category || "Lanches",
      price: Number(newProduct.price),
      image: newProduct.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      available: true,
    };
    setProducts([...products, product]);
    setNewProduct({});
    alert("Produto adicionado com sucesso!");
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleToggleAvailability = (id: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm("Excluir este pedido?")) {
      setOrders(orders.filter((o) => o.id !== id));
    }
  };

  const tabs = [
    { id: "config", label: "Configurações", icon: "⚙️" },
    { id: "products", label: "Produtos", icon: "🍔" },
    { id: "orders", label: "Pedidos", icon: "📋" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: colors.background }}>
      {/* Header */}
      <div className="sticky top-0 p-4 border-b" style={{ borderColor: colors.surface, background: colors.surface }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>
            Painel Admin
          </h1>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium btn-press"
            style={{ background: colors.primary, color: "#fff" }}
          >
            Sair
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors"
              style={{
                background: activeTab === tab.id ? colors.primary : colors.surface,
                color: activeTab === tab.id ? "#fff" : colors.textMuted,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 pb-20">
        {/* ── TAB CONFIGURAÇÕES ── */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Dados da Marca */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                🏪 Dados da Marca
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Slogan
                  </label>
                  <input
                    type="text"
                    value={settings.slogan}
                    onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Endereço da Loja
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                📱 WhatsApp
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Número com DDD (apenas números)
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                    placeholder="5511999999999"
                  />
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                🚚 Entrega
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Taxa de Entrega (R$)
                    </label>
                    <input
                      type="number"
                      value={settings.deliveryFee}
                      onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                      className="w-full p-3 rounded-lg border"
                      style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Pedido Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      value={settings.minOrderValue}
                      onChange={(e) => setSettings({ ...settings, minOrderValue: Number(e.target.value) })}
                      className="w-full p-3 rounded-lg border"
                      style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Tempo de Entrega
                  </label>
                  <input
                    type="text"
                    value={settings.deliveryTime}
                    onChange={(e) => setSettings({ ...settings, deliveryTime: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                    placeholder="40-60 min"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                    Tempo de Retirada
                  </label>
                  <input
                    type="text"
                    value={settings.pickupTime}
                    onChange={(e) => setSettings({ ...settings, pickupTime: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                    placeholder="25 min"
                  />
                </div>
              </div>
            </div>

            {/* Horário */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                ⏰ Horário de Funcionamento
              </h3>
              <div>
                <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                  Horário
                </label>
                <input
                  type="text"
                  value={settings.openingHours}
                  onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  placeholder="18:00 - 23:00"
                />
              </div>
            </div>

            {/* Segurança */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                🔐 Segurança
              </h3>
              <div>
                <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                  PIN de Acesso Admin
                </label>
                <input
                  type="text"
                  value={settings.accessPin}
                  onChange={(e) => setSettings({ ...settings, accessPin: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  maxLength={4}
                  placeholder="1234"
                />
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Este PIN será usado para acessar o painel admin
                </p>
              </div>
            </div>

            {/* Paleta de Cores */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                🎨 Paleta de Cores
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor Primária
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.primary}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, primary: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.primary}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, primary: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor de Fundo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.background}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, background: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.background}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, background: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor da Superfície
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.surface}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, surface: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.surface}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, surface: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor do Texto
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.text}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, text: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.text}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, text: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor de Sucesso
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.success}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, success: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.success}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, success: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: colors.textMuted }}>
                      Cor de Erro
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.colors.error}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, error: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.colors.error}
                        onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, error: e.target.value } })}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, colors: defaultColors })}
                  className="w-full py-2 rounded-lg text-sm font-medium"
                  style={{ background: colors.surface, color: colors.textMuted }}
                >
                  Resetar Cores Padrão
                </button>
              </div>
            </div>

            {/* Pré-visualização */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                👁️ Pré-visualização
              </h3>
              <div
                className="p-4 rounded-lg text-center"
                style={{ background: colors.background, color: colors.text }}
              >
                <div
                  className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-2"
                  style={{ background: colors.primary, color: "#fff" }}
                >
                  Botão Principal
                </div>
                <div className="text-sm" style={{ color: colors.textMuted }}>
                  Texto secundário
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB PRODUTOS ── */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Adicionar Produto */}
            <div className="p-4 rounded-xl" style={{ background: colors.surface }}>
              <h3 className="font-bold mb-4" style={{ color: colors.primary }}>
                ➕ Adicionar Produto
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={newProduct.name || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={newProduct.description || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Categoria"
                    value={newProduct.category || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    value={newProduct.price || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-lg border"
                    style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="URL da imagem"
                  value={newProduct.image || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ background: colors.background, borderColor: colors.surface, color: colors.text }}
                />
                <button
                  onClick={handleSaveProduct}
                  className="w-full py-3 rounded-lg font-bold"
                  style={{ background: colors.primary, color: "#fff" }}
                >
                  Adicionar Produto
                </button>
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: colors.surface, opacity: product.available ? 1 : 0.5 }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate" style={{ color: colors.text }}>
                      {product.name}
                    </h4>
                    <p className="text-sm truncate" style={{ color: colors.textMuted }}>
                      {product.category}
                    </p>
                    <p className="font-bold" style={{ color: colors.primary }}>
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(product.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: product.available ? colors.success : colors.error,
                        color: "#fff",
                      }}
                    >
                      {product.available ? "Ativo" : "Inativo"}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ background: colors.error, color: "#fff" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB PEDIDOS ── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8" style={{ color: colors.textMuted }}>
                Nenhum pedido realizado ainda
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl"
                  style={{ background: colors.surface }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold" style={{ color: colors.text }}>
                        #{order.id.slice(-6)}
                      </span>
                      <span className="ml-2 text-sm" style={{ color: colors.textMuted }}>
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: colors.error, color: "#fff" }}
                    >
                      Excluir
                    </button>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm" style={{ color: colors.text }}>
                      <strong>Cliente:</strong> {order.customerName}
                    </p>
                    {order.serviceType === "delivery" && order.address && (
                      <p className="text-sm" style={{ color: colors.text }}>
                        <strong>Endereço:</strong> {order.address}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: colors.text }}>
                      <strong>Pagamento:</strong> {order.paymentMethod}
                    </p>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      <strong>Tipo:</strong> {order.serviceType === "delivery" ? "🚚 Entrega" : "🏃 Retirada"}
                    </p>
                  </div>
                  <div className="border-t pt-2" style={{ borderColor: colors.background }}>
                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm" style={{ color: colors.textMuted }}>
                        {item.qty}x {item.name}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 font-bold" style={{ color: colors.primary }}>
                    Total: R$ {order.total.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Componentes da Loja ────────────────────────────────── */
function ProductCard({
  product,
  onAdd,
  colors,
}: {
  product: Product;
  onAdd: () => void;
  colors: BrandColors;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: colors.surface }}
    >
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
        {!product.available && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <span className="font-bold text-white">Indisponível</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-base leading-tight mb-1" style={{ color: colors.text }}>
          {product.name}
        </h3>
        <p className="text-sm mb-2 line-clamp-2" style={{ color: colors.textMuted }}>
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg" style={{ color: colors.primary }}>
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          <button
            onClick={onAdd}
            disabled={!product.available}
            className="px-4 py-2 rounded-xl font-bold btn-press"
            style={{
              background: product.available ? colors.primary : colors.surface,
              color: "#fff",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function CartItem({
  item,
  onUpdate,
  onRemove,
  colors,
}: {
  item: { product: Product; quantity: number };
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  colors: BrandColors;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: colors.surface }}
    >
      <img
        src={item.product.image}
        alt={item.product.name}
        className="w-14 h-14 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate" style={{ color: colors.text }}>
          {item.product.name}
        </h4>
        <p className="text-xs" style={{ color: colors.textMuted }}>
          R$ {item.product.price.toFixed(2).replace(".", ",")} cada
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate(item.quantity - 1)}
          className="w-8 h-8 rounded-full font-bold flex items-center justify-center btn-press"
          style={{ background: colors.background, color: colors.text }}
        >
          -
        </button>
        <span className="w-6 text-center font-bold" style={{ color: colors.text }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdate(item.quantity + 1)}
          className="w-8 h-8 rounded-full font-bold flex items-center justify-center btn-press"
          style={{ background: colors.primary, color: "#fff" }}
        >
          +
        </button>
      </div>
      <button
        onClick={onRemove}
        className="text-xs px-2 py-1 rounded"
        style={{ background: colors.error, color: "#fff" }}
      >
        ✕
      </button>
    </div>
  );
}

function CartSheet({
  isOpen,
  onClose,
  items,
  onUpdate,
  onRemove,
  settings,
  colors,
  onCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: { product: Product; quantity: number }[];
  onUpdate: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  settings: Settings;
  colors: BrandColors;
  onCheckout: () => void;
}) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl overflow-y-auto animate-slide-up"
        style={{ background: colors.background }}
      >
        <div className="sticky top-0 p-4 border-b flex items-center justify-between" style={{ borderColor: colors.surface }}>
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            🛒 Seu Carrinho
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: colors.surface, color: colors.text }}
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center py-8" style={{ color: colors.textMuted }}>
              Seu carrinho está vazio
            </p>
          ) : (
            items.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onUpdate={(qty) => onUpdate(index, qty)}
                onRemove={() => onRemove(index)}
                colors={colors}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t space-y-3" style={{ borderColor: colors.surface }}>
            <div className="flex justify-between" style={{ color: colors.textMuted }}>
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between" style={{ color: colors.textMuted }}>
              <span>Taxa de Entrega</span>
              <span>R$ {settings.deliveryFee.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between text-xl font-bold" style={{ color: colors.text }}>
              <span>Total</span>
              <span style={{ color: colors.primary }}>
                R$ {(subtotal + settings.deliveryFee).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 rounded-xl font-bold text-lg btn-press"
              style={{ background: colors.primary, color: "#fff" }}
            >
              Continuar Pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutSheet({
  isOpen,
  items,
  settings,
  colors,
  onSubmit,
  onGoBack,
}: {
  isOpen: boolean;
  items: { product: Product; quantity: number }[];
  settings: Settings;
  colors: BrandColors;
  onSubmit: (data: { name: string; address: string; paymentMethod: string; serviceType: "delivery" | "retirada"; observation: string }) => void;
  onGoBack: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [serviceType, setServiceType] = useState<"delivery" | "retirada">("delivery");
  const [observation, setObservation] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );
  const total = subtotal + (serviceType === "delivery" ? settings.deliveryFee : 0);
  const canCheckout = name.trim().length > 0 && (serviceType === "retirada" || address.trim().length > 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canCheckout) return;
    onSubmit({ name, address, paymentMethod, serviceType, observation });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: colors.background }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.surface }}>
        <button onClick={onGoBack} className="font-medium" style={{ color: colors.text }}>
          ← Voltar
        </button>
        <h2 className="text-lg font-bold" style={{ color: colors.text }}>
          📝 Checkout
        </h2>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        {/* Tipo de Serviço */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setServiceType("delivery")}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: serviceType === "delivery" ? colors.primary : colors.surface,
              color: serviceType === "delivery" ? "#fff" : colors.textMuted,
            }}
          >
            🚚 Entrega
          </button>
          <button
            type="button"
            onClick={() => setServiceType("retirada")}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: serviceType === "retirada" ? colors.primary : colors.surface,
              color: serviceType === "retirada" ? "#fff" : colors.textMuted,
            }}
          >
            🏃 Retirada
          </button>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>
            Seu Nome *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-xl border"
            style={{ background: colors.surface, borderColor: colors.surface, color: colors.text }}
            placeholder="Digite seu nome"
            required
          />
        </div>

        {/* Endereço */}
        {serviceType === "delivery" && (
          <div>
            <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>
              Endereço de Entrega *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 rounded-xl border"
              style={{ background: colors.surface, borderColor: colors.surface, color: colors.text }}
              placeholder="Rua, número, complemento, bairro"
              rows={3}
              required
            />
          </div>
        )}

        {/* Pagamento */}
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["dinheiro", "pix", "card"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className="py-3 rounded-xl font-medium capitalize"
                style={{
                  background: paymentMethod === method ? colors.primary : colors.surface,
                  color: paymentMethod === method ? "#fff" : colors.textMuted,
                }}
              >
                {method === "dinheiro" && "💵 "}
                {method === "pix" && "📱 "}
                {method === "card" && "💳 "}
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Observação */}
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>
            Observação (opcional)
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full p-4 rounded-xl border"
            style={{ background: colors.surface, borderColor: colors.surface, color: colors.text }}
            placeholder="Sem cebola, endereço fácil..."
            rows={2}
          />
        </div>

        {/* Resumo */}
        <div className="p-4 rounded-xl space-y-2" style={{ background: colors.surface }}>
          <div className="flex justify-between text-sm" style={{ color: colors.textMuted }}>
            <span>Itens ({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
            <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
          </div>
          {serviceType === "delivery" && (
            <div className="flex justify-between text-sm" style={{ color: colors.textMuted }}>
              <span>Entrega</span>
              <span>R$ {settings.deliveryFee.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t" style={{ borderColor: colors.background, color: colors.text }}>
            <span>Total</span>
            <span style={{ color: colors.primary }}>R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        {/* Botão Finalizar */}
        <button
          type="submit"
          disabled={!canCheckout}
          className="w-full py-4 rounded-xl font-bold text-lg"
          style={{
            background: canCheckout ? colors.primary : colors.surface,
            color: canCheckout ? "#fff" : colors.textMuted,
          }}
        >
          Finalizar via WhatsApp →
        </button>
      </form>
    </div>
  );
}

/* ── App Principal ───────────────────────────────────────── */
export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(SETTINGS_KEY, defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>(PRODUCTS_KEY, defaultProducts);
  const [orders, setOrders] = useLocalStorage<Order[]>(ORDERS_KEY, []);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  const colors = settings.colors;

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.available;
    });
  }, [products, search, selectedCategory]);

  // Contagem do carrinho
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  // Adicionar ao carrinho
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Atualizar quantidade
  const updateCartItem = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
    }
  };

  // Remover do carrinho
  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Finalizar pedido
  const handleCheckout = (data: { name: string; address: string; paymentMethod: string; serviceType: "delivery" | "retirada"; observation: string }) => {
    setShowCheckout(false);

    // Criar pedido
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryFee = data.serviceType === "delivery" ? settings.deliveryFee : 0;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      customerName: data.name,
      address: data.address,
      paymentMethod: data.paymentMethod,
      serviceType: data.serviceType,
      observation: data.observation,
      subtotal,
      deliveryFee,
      total,
      items: cart.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      })),
    };

    setOrders([newOrder, ...orders]);
    setCart([]);

    // Criar mensagem do WhatsApp
    const itemsText = cart
      .map((item) => `${item.quantity}x ${item.product.name} (R$ ${(item.product.price * item.quantity).toFixed(2).replace(".", ",")})`)
      .join("%0A");
    
    const message = `*Novo Pedido - ${settings.brandName}*%0A%0A*Cliente:* ${data.name}%0A*Tipo:* ${data.serviceType === "delivery" ? "🚀 Entrega" : "🏃 Retirada"}${data.serviceType === "delivery" ? `%0A*Endereço:* ${data.address}` : ""}%0A*Pagamento:* ${data.paymentMethod}${data.observation ? `%0A*Obs:* ${data.observation}` : ""}%0A%0A*Itens:*%0A${itemsText}%0A%0A*Subtotal:* R$ ${subtotal.toFixed(2).replace(".", ",")}%0A*Entrega:* R$ ${deliveryFee.toFixed(2).replace(".", ",")}%0A*Total:* R$ ${total.toFixed(2).replace(".", ",")}`;

    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  // Verificar URL para admin
  useEffect(() => {
    if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
      setShowPinModal(true);
    }
  }, []);

  const handleAdminAccess = () => {
    if (adminPin === settings.accessPin) {
      setShowPinModal(false);
      setShowAdmin(true);
      setAdminPin("");
    } else {
      alert("PIN incorreto!");
    }
  };

  return (
    <div style={{ background: colors.background, minHeight: "100vh" }}>
      {/* Header */}
      <header className="p-4 sticky top-0 z-30" style={{ background: colors.background }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: colors.primary }}>
              {settings.brandName}
            </h1>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {settings.slogan}
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }}>
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 pl-12 rounded-xl border"
            style={{ background: colors.surface, borderColor: colors.surface, color: colors.text }}
            placeholder="Buscar produtos..."
          />
        </div>

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm"
              style={{
                background: selectedCategory === cat ? colors.primary : colors.surface,
                color: selectedCategory === cat ? "#fff" : colors.textMuted,
              }}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </header>

      {/* Info Bar */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-4 text-sm" style={{ color: colors.textMuted }}>
          <span>🚚 {settings.deliveryTime}</span>
          <span>📦 Mín. R$ {settings.minOrderValue.toFixed(2).replace(".", ",")}</span>
          <span>🕐 {settings.openingHours}</span>
        </div>
      </div>

      {/* Produtos */}
      <main className="px-4 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12" style={{ color: colors.textMuted }}>
            <p className="text-4xl mb-4">🔍</p>
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} colors={colors} />
            ))}
          </div>
        )}
      </main>

      {/* Barra Flutuante do Carrinho */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-30 safe-bottom">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-between shadow-lg btn-press animate-pulse-glow"
            style={{ background: colors.primary, color: "#fff" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <span className="font-bold">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
            </div>
            <span className="font-bold text-xl">
              R$ {(cartSubtotal + settings.deliveryFee).toFixed(2).replace(".", ",")}
            </span>
          </button>
        </div>
      )}

      {/* Carrinho */}
      <CartSheet
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cart}
        onUpdate={updateCartItem}
        onRemove={removeCartItem}
        settings={settings}
        colors={colors}
        onCheckout={() => {
          if (cartSubtotal < settings.minOrderValue) {
            alert(`Pedido mínimo: R$ ${settings.minOrderValue.toFixed(2).replace(".", ",")}`);
            return;
          }
          setShowCart(false);
          setShowCheckout(true);
        }}
      />

      {/* Checkout */}
      <CheckoutSheet
        isOpen={showCheckout}

        items={cart}
        settings={settings}
        colors={colors}
        onSubmit={handleCheckout}
        onGoBack={() => {
          setShowCheckout(false);
          setShowCart(true);
        }}
      />

      {/* Modal PIN Admin */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="p-6 rounded-2xl w-full max-w-sm" style={{ background: colors.surface }}>
            <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.text }}>
              🔐 Acesso Admin
            </h2>
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full p-4 rounded-xl text-center text-2xl tracking-widest mb-4"
              style={{ background: colors.background, color: colors.text }}
              placeholder="••••"
              maxLength={4}
              onKeyDown={(e) => e.key === "Enter" && handleAdminAccess()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setAdminPin("");
                }}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ background: colors.background, color: colors.textMuted }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminAccess}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ background: colors.primary, color: "#fff" }}
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel Admin */}
      {showAdmin && (
        <AdminPanel
          settings={settings}
          setSettings={setSettings}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          onClose={() => setShowAdmin(false)}
          colors={colors}
        />
      )}
    </div>
  );
}