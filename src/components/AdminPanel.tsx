import React, { useState, useEffect, useRef } from 'react';
import {
  FirebaseConfig,
  getStoredConfig,
  saveConfig,
  removeConfig,
  isFirebaseConfigured,
  reinitFirebase,
  testFirebaseConnection,
} from '../firebase/config';
import {
  Product,
  Order,
  Customer,
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getCustomers,
  uploadImage,
  getDashboardStats,
} from '../firebase/services';

// ============================================
// 🔑 PAINEL DE CONFIGURAÇÃO DO FIREBASE
// ============================================

function FirebaseConfigPanel() {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) {
      setConfig(stored);
      setIsConfigured(true);
    }
  }, []);

  const handleChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!config.apiKey || !config.projectId) {
      setStatus('error');
      setErrorMsg('API Key e Project ID são obrigatórios!');
      return;
    }
    setStatus('saving');
    try {
      saveConfig(config);
      reinitFirebase();
      setIsConfigured(true);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      setErrorMsg('Erro ao salvar configuração.');
    }
  };

  const handleRemove = () => {
    removeConfig();
    setIsConfigured(false);
    setConfig({
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
    });
    setStatus('idle');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      saveConfig(config);
      const result = await testFirebaseConnection();
      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const fields: { key: keyof FirebaseConfig; label: string; placeholder: string; required: boolean }[] = [
    { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', required: true },
    { key: 'authDomain', label: 'Auth Domain', placeholder: 'seu-projeto.firebaseapp.com', required: false },
    { key: 'databaseURL', label: 'Database URL', placeholder: 'https://seu-projeto-default-rtdb.firebaseio.com', required: false },
    { key: 'projectId', label: 'Project ID', placeholder: 'seu-projeto', required: true },
    { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'seu-projeto.appspot.com', required: false },
    { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789', required: false },
    { key: 'appId', label: 'App ID', placeholder: '1:123456789:web:abcdef', required: false },
    { key: 'measurementId', label: 'Measurement ID (opcional)', placeholder: 'G-XXXXXXXXXX', required: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">🔑 Configuração do Firebase</h3>
          <p className="text-sm text-gray-400 mt-1">Insira suas chaves do Firebase Console</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConfigured ? '✅ Conectado' : '❌ Desconectado'}
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-400 mb-2">📋 Como obter as chaves:</h4>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Acesse <span className="text-blue-400">console.firebase.google.com</span></li>
          <li>Crie um novo projeto ou selecione um existente</li>
          <li>Vá em <span className="text-orange-400">⚙️ Configurações do projeto</span></li>
          <li>Em "Seus aplicativos", adicione um app <span className="text-orange-400">Web (ícone &lt;/&gt;)</span></li>
          <li>Copie as configurações do objeto <span className="text-orange-400">firebaseConfig</span></li>
          <li>Cole os valores nos campos abaixo</li>
        </ol>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              value={config[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
            />
          </div>
        ))}
      </div>

      {/* Status */}
      {status === 'success' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
          ✅ Configuração salva com sucesso!
        </div>
      )}
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          ❌ {errorMsg}
        </div>
      )}
      {testStatus === 'testing' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-400">
          ⏳ Testando conexão...
        </div>
      )}
      {testStatus === 'success' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
          ✅ Conexão com Firebase funcionando!
        </div>
      )}
      {testStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          ❌ Falha na conexão. Verifique as chaves.
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
        >
          {status === 'saving' ? '⏳ Salvando...' : '💾 Salvar Configuração'}
        </button>
        <button
          onClick={handleTest}
          disabled={!isConfigured || testStatus === 'testing'}
          className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/20 transition-all disabled:opacity-50"
        >
          🧪 Testar Conexão
        </button>
        {isConfigured && (
          <button
            onClick={handleRemove}
            className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
          >
            🗑️ Remover Config
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 📦 GERENCIADOR DE PRODUTOS
// ============================================

function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: 'Burgers',
    image: '',
    rating: 4.5,
    prepTime: '20min',
    available: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Burgers', 'Hot Dogs', 'Bebidas', 'Porções', 'Sobremesas', 'Combos', 'Pizzas'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!isFirebaseConfigured()) return;
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImage(file, 'products');
    if (url) {
      setForm((prev) => ({ ...prev, image: url }));
    }
    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    if (editingProduct?.id) {
      await updateProduct(editingProduct.id, form);
    } else {
      await addProduct(form);
    }
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      category: product.category,
      image: product.image,
      rating: product.rating,
      prepTime: product.prepTime,
      available: product.available,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      category: 'Burgers',
      image: '',
      rating: 4.5,
      prepTime: '20min',
      available: true,
    });
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-400">Configure o Firebase primeiro para gerenciar produtos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">📦 Produtos</h3>
          <p className="text-sm text-gray-400 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
        >
          + Novo Produto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h4 className="text-lg font-bold text-white">
            {editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Ex: Smash Burger Duplo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="29.90"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Preço Original (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.originalPrice || ''}
                onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="35.90"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Tempo de Preparo</label>
              <input
                type="text"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="20min"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Avaliação (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                placeholder="4.9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 resize-none"
              rows={2}
              placeholder="Descrição do produto..."
            />
          </div>

          {/* Upload de Imagem */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Imagem do Produto</label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-all disabled:opacity-50"
              >
                {uploadingImage ? '⏳ Upload...' : '📷 Upload Imagem'}
              </button>
              {form.image && (
                <div className="flex items-center gap-2">
                  <img src={form.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                  <span className="text-xs text-green-400">✅ Imagem carregada</span>
                </div>
              )}
            </div>
          </div>

          {/* URL da imagem alternativa */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Ou cole URL da imagem</label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
              placeholder="https://..."
            />
          </div>

          {/* Disponível */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </label>
            <span className="text-sm text-gray-400">Produto disponível</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              💾 Salvar
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingProduct(null); }}
              className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-gray-400">Nenhum produto cadastrado ainda.</p>
          <p className="text-sm text-gray-500 mt-1">Clique em "+ Novo Produto" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all"
            >
              <img
                src={product.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100'}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white truncate">{product.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {product.available ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{product.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-orange-400">R$ {product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{product.category}</span>
                  <span className="text-xs text-gray-500">⭐ {product.rating}</span>
                  <span className="text-xs text-gray-500">⏰ {product.prepTime}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => product.id && handleDelete(product.id)}
                  className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 🛒 PAINEL DE PEDIDOS
// ============================================

function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!isFirebaseConfigured()) return;
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
    loadOrders();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    delivering: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    delivering: 'Entregando',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  if (!isFirebaseConfigured()) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-400">Configure o Firebase primeiro para ver os pedidos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">🛒 Pedidos</h3>
          <p className="text-sm text-gray-400 mt-1">{orders.length} pedidos no total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'preparing', 'delivering', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'Todos' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-gray-400">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-white">#{order.id?.slice(0, 8)}</h4>
                  <p className="text-xs text-gray-400">{order.customerName} • {order.customerPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => order.id && handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="pending" className="bg-gray-900">Pendente</option>
                    <option value="preparing" className="bg-gray-900">Preparando</option>
                    <option value="delivering" className="bg-gray-900">Entregando</option>
                    <option value="delivered" className="bg-gray-900">Entregue</option>
                    <option value="cancelled" className="bg-gray-900">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {order.items.map((item, i) => (
                  <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded-lg text-gray-300">
                    {item.quantity}x {item.productName}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">📍 {order.customerAddress}</p>
                <p className="text-sm font-bold text-orange-400">R$ {order.total.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 👤 PAINEL DE CLIENTES
// ============================================

function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!isFirebaseConfigured()) return;
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-400">Configure o Firebase primeiro para ver os clientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">👤 Clientes</h3>
        <p className="text-sm text-gray-400 mt-1">{customers.length} clientes cadastrados</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">👤</p>
          <p className="text-gray-400">Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{customer.name}</h4>
                <p className="text-xs text-gray-400">{customer.phone} • {customer.address}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-orange-400">{customer.totalOrders} pedidos</p>
                <p className="text-xs text-gray-400">R$ {customer.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 📊 DASHBOARD
// ============================================

function DashboardPanel() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!isFirebaseConfigured()) return;
    setLoading(true);
    const data = await getDashboardStats();
    setStats(data);
    setLoading(false);
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-400">Configure o Firebase primeiro para ver o dashboard.</p>
      </div>
    );
  }

  const cards = [
    { icon: '📦', label: 'Produtos', value: stats.totalProducts, color: 'from-blue-500 to-cyan-500' },
    { icon: '🛒', label: 'Pedidos', value: stats.totalOrders, color: 'from-orange-500 to-red-500' },
    { icon: '👤', label: 'Clientes', value: stats.totalCustomers, color: 'from-purple-500 to-pink-500' },
    { icon: '💰', label: 'Receita Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, color: 'from-green-500 to-emerald-500' },
    { icon: '⏳', label: 'Pedidos Pendentes', value: stats.pendingOrders, color: 'from-yellow-500 to-orange-500' },
    { icon: '📅', label: 'Pedidos Hoje', value: stats.todayOrders, color: 'from-indigo-500 to-blue-500' },
    { icon: '🎯', label: 'Receita Hoje', value: `R$ ${stats.todayRevenue.toFixed(2)}`, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">📊 Dashboard</h3>
          <p className="text-sm text-gray-400 mt-1">Visão geral do seu negócio</p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-bold text-white hover:bg-white/20 transition-all"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando estatísticas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 🖼️ GERENCIADOR DE IMAGENS
// ============================================

function ImagesPanel() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<'logos' | 'products' | 'banners'>('products');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, selectedFolder);
    if (url) {
      setUploadedUrl(url);
    }
    setUploading(false);
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-400">Configure o Firebase primeiro para gerenciar imagens.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">🖼️ Gerenciador de Imagens</h3>
        <p className="text-sm text-gray-400 mt-1">Faça upload de imagens para o Firebase Storage</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-400">Pasta:</label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value as typeof selectedFolder)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="logos" className="bg-gray-900">🏷️ Logos</option>
            <option value="products" className="bg-gray-900">📦 Produtos</option>
            <option value="banners" className="bg-gray-900">🎨 Banners</option>
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
        >
          {uploading ? '⏳ Fazendo upload...' : '📤 Escolher e Enviar Imagem'}
        </button>

        {uploadedUrl && (
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-400 mb-2">✅ Upload realizado com sucesso!</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(uploadedUrl); }}
                  className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white hover:bg-white/20 transition-all"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
            <img
              src={uploadedUrl}
              alt="Uploaded"
              className="w-48 h-32 object-cover rounded-lg border border-white/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 🏠 COMPONENTE PRINCIPAL DO ADMIN
// ============================================

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'config' | 'dashboard' | 'products' | 'orders' | 'customers' | 'images'>('config');

  const tabs = [
    { id: 'config' as const, icon: '🔑', label: 'Configuração' },
    { id: 'dashboard' as const, icon: '📊', label: 'Dashboard' },
    { id: 'products' as const, icon: '📦', label: 'Produtos' },
    { id: 'orders' as const, icon: '🛒', label: 'Pedidos' },
    { id: 'customers' as const, icon: '👤', label: 'Clientes' },
    { id: 'images' as const, icon: '🖼️', label: 'Imagens' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-orange-500/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                Painel Admin — MH Lanches
              </h2>
              <p className="text-xs text-gray-500">Gerencie seu delivery completo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-white/10 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'config' && <FirebaseConfigPanel />}
          {activeTab === 'dashboard' && <DashboardPanel />}
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'customers' && <CustomersPanel />}
          {activeTab === 'images' && <ImagesPanel />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {isFirebaseConfigured() ? '🟢 Firebase conectado' : '🔴 Firebase não configurado'}
          </p>
          <p className="text-xs text-gray-600">MH Lanches Admin v1.0</p>
        </div>
      </div>
    </div>
  );
}
