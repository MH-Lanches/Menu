(() => {
  const KEYS = {
    openOrders: 'mh_erp_open_orders_v1',
    sales: 'mh_erp_sales_v1',
    stock: 'mh_erp_stock_v1',
    settings: 'mh_erp_settings_v1',
    importedOnline: 'mh_erp_imported_online_ids_v1',
    legacySales: 'mh_vendas_historico_v1',
    sharedOrders: 'brasa_pdv_pedidos_v1',
    sharedOrdersEvent: 'brasa_pdv_pedidos_evento_v1'
  };

  const CHANNEL_NAME = 'brasa_pdv_channel';
  const DEFAULT_CONFIG = {
    marca: 'MH Lanches',
    heroTitulo: 'Mais que uma lanchonete.',
    notaLogoUrl: 'https://i.ibb.co/kgnfg3g3/MH-Logo.png',
    notaTitulo: 'MH LANCHES',
    notaSubtitulo: 'Mais que uma lanchonete',
    notaTipo: 'Comanda / Balcao',
    notaRodape: 'Relatorio Gerencial nao fiscal!',
    whatsapp: '+5581985770055',
    cores: {
      destaque: '#f97316',
      painel: '#111827',
      fundo: '#05060a',
      texto: '#f5f5f5',
      borda: '#27272a'
    },
    categoriasOrdem: []
  };

  const DEFAULT_SETTINGS = {
    somAtivo: true,
    intervaloSegundos: 12,
    abrirAutomaticamenteOnline: true
  };

  const refs = {
    brandLogo: document.getElementById('brand-logo'),
    brandName: document.getElementById('brand-name'),
    brandSlogan: document.getElementById('brand-slogan'),
    kpiOpen: document.getElementById('kpi-open'),
    kpiOnline: document.getElementById('kpi-online'),
    kpiTables: document.getElementById('kpi-tables'),
    kpiSales: document.getElementById('kpi-sales'),
    alert: document.getElementById('system-alert'),
    leftPane: document.getElementById('left-pane'),
    rightPane: document.getElementById('right-pane'),
    tabButtons: Array.from(document.querySelectorAll('[data-tab]'))
  };

  const state = {
    tab: 'online',
    reportRange: 'hoje',
    activeCategory: 'Todos',
    selectedOrderId: '',
    products: [],
    categories: ['Todos'],
    config: { ...DEFAULT_CONFIG, cores: { ...DEFAULT_CONFIG.cores } },
    settings: { ...DEFAULT_SETTINGS },
    openOrders: [],
    sales: [],
    stockMap: {},
    importedOnlineIds: new Set(),
    channel: null,
    pollTimer: null
  };

  if (!refs.leftPane || !refs.rightPane) return;

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getStoredArray(key) {
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function setStoredJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function normalizeText(text, fallback = '') {
    const value = String(text || '').trim();
    return value || fallback;
  }

  function money(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function shortDate(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function sumItems(items) {
    return (Array.isArray(items) ? items : []).reduce((total, item) => total + Number(item.price || 0) * Number(item.qty || 0), 0);
  }

  function showAlert(message, type = 'success') {
    refs.alert.textContent = message;
    refs.alert.className = 'mt-4 rounded-2xl px-4 py-3 text-sm font-semibold';
    if (type === 'error') {
      refs.alert.classList.add('border', 'border-rose-500/25', 'bg-rose-500/10', 'text-rose-100');
    } else {
      refs.alert.classList.add('border', 'border-emerald-500/25', 'bg-emerald-500/10', 'text-emerald-100');
    }
    clearTimeout(showAlert.timer);
    showAlert.timer = setTimeout(() => refs.alert.classList.add('hidden'), 3200);
    refs.alert.classList.remove('hidden');
  }

  function beep() {
    if (!state.settings.somAtivo) return;
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 980;
      gain.gain.value = 0.045;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        context.close();
      }, 180);
    } catch (_) {}
  }

  function normalizeProduct(item) {
    const id = String(item && item.id || uid('prod'));
    return {
      id,
      name: normalizeText(item && item.nome, 'Produto'),
      description: normalizeText(item && item.descricao),
      category: normalizeText(item && item.categoria, 'Diversos'),
      price: Number(item && item.preco) || 0,
      image: normalizeText(item && item.imagem),
      order: Number(item && item.ordem) || 0,
      active: item && item.ativo !== false && item && item.pausado !== true
    };
  }

  function normalizeItem(item) {
    return {
      key: String(item && item.key || uid('item')),
      productId: item && item.productId != null ? String(item.productId) : '',
      name: normalizeText(item && (item.name || item.nome), 'Item'),
      price: Number(item && (item.price || item.valor || item.precoFinal || item.preco)) || 0,
      qty: Math.max(1, Number(item && (item.qty || item.quantidade)) || 1),
      notes: normalizeText(item && (item.notes || item.resumo))
    };
  }

  function normalizeOrder(order) {
    const modeRaw = normalizeText(order && (order.mode || order.origem), 'balcao').toLowerCase();
    const mode = modeRaw === 'site' ? 'online' : (modeRaw === 'caixa' ? 'balcao' : modeRaw);
    const items = (Array.isArray(order && (order.items || order.itens)) ? (order.items || order.itens) : []).map(normalizeItem);
    const paymentForms = Array.isArray(order && order.payment && order.payment.methods)
      ? order.payment.methods
      : (Array.isArray(order && order.pagamento && order.pagamento.formas) ? order.pagamento.formas : []);
    const serviceType = normalizeText(order && order.customer && order.customer.serviceType || order && order.cliente && order.cliente.tipoAtendimento);
    const customerName = normalizeText(order && order.customer && order.customer.name || order && order.cliente && order.cliente.nome);
    const number = normalizeText(order && (order.number || order.numeroPedido), String(Date.now()).slice(-6));
    const sourceId = normalizeText(order && order.sourceId || order && order.id);
    return {
      id: normalizeText(order && order.id, uid('order')),
      sourceId,
      number,
      mode: ['online', 'mesa', 'balcao'].includes(mode) ? mode : 'balcao',
      name: normalizeText(order && order.name || order && order.identificacao || (mode === 'mesa' ? 'Mesa' : mode === 'online' ? `Pedido #${number}` : 'Balcao')),
      status: ['novo', 'preparando', 'pronto', 'fechada'].includes(order && order.status) ? order.status : 'novo',
      createdAt: order && (order.createdAt || order.criadoEm) || new Date().toISOString(),
      updatedAt: order && order.updatedAt || new Date().toISOString(),
      customer: {
        name: customerName,
        address: normalizeText(order && order.customer && order.customer.address || order && order.cliente && order.cliente.endereco),
        district: normalizeText(order && order.customer && order.customer.district || order && order.cliente && order.cliente.bairro),
        reference: normalizeText(order && order.customer && order.customer.reference || order && order.cliente && order.cliente.referencia),
        serviceType: serviceType || (mode === 'mesa' ? 'mesa' : mode === 'balcao' ? 'balcao' : '')
      },
      payment: {
        methods: paymentForms.slice(0, 2),
        cashNeed: normalizeText(order && order.payment && order.payment.cashNeed || order && order.pagamento && order.pagamento.precisaTroco),
        cashFor: Number(order && order.payment && order.payment.cashFor || order && order.pagamento && (order.pagamento.trocoPara || order.pagamento.trocoValor)) || 0,
        change: Number(order && order.payment && order.payment.change) || 0
      },
      note: normalizeText(order && (order.note || order.observacaoInterna)),
      messageOriginal: normalizeText(order && order.messageOriginal || order && order.mensagemOriginal),
      items,
      total: Number(order && (order.total || order.totais && order.totais.total)) || sumItems(items)
    };
  }

  function persistOpenOrders() {
    state.openOrders = state.openOrders.map((order) => ({ ...order, total: sumItems(order.items) }));
    setStoredJson(KEYS.openOrders, state.openOrders);
  }

  function persistSales() {
    setStoredJson(KEYS.sales, state.sales);
    setStoredJson(KEYS.legacySales, state.sales.map((sale) => ({
      ...sale,
      origem: sale.mode,
      totais: { total: sale.total }
    })));
  }

  function persistStock() {
    setStoredJson(KEYS.stock, state.stockMap);
  }

  function persistSettings() {
    setStoredJson(KEYS.settings, state.settings);
    resetPolling();
  }

  function persistImportedIds() {
    setStoredJson(KEYS.importedOnline, Array.from(state.importedOnlineIds));
  }

  function applyTheme() {
    const colors = state.config.cores || {};
    document.documentElement.style.setProperty('--accent', colors.destaque || '#f97316');
    document.documentElement.style.setProperty('--panel', colors.painel || '#111827');
    document.documentElement.style.setProperty('--text', colors.texto || '#f5f5f5');
    document.documentElement.style.setProperty('--border', colors.borda || 'rgba(255,255,255,0.08)');
    refs.brandLogo.src = state.config.notaLogoUrl || state.config.appIconeUrl || 'https://i.ibb.co/kgnfg3g3/MH-Logo.png';
    refs.brandName.textContent = state.config.marca || 'MH Lanches';
    refs.brandSlogan.textContent = state.config.heroTitulo || 'Mais que uma lanchonete.';
  }

  function loadLocalData() {
    state.openOrders = getStoredArray(KEYS.openOrders).map(normalizeOrder);
    state.sales = getStoredArray(KEYS.sales).map((sale) => ({ ...normalizeOrder(sale), finalizadoEm: sale.finalizadoEm || sale.updatedAt || new Date().toISOString() }));
    state.stockMap = safeParse(localStorage.getItem(KEYS.stock), {}) || {};
    state.settings = { ...DEFAULT_SETTINGS, ...(safeParse(localStorage.getItem(KEYS.settings), {}) || {}) };
    state.importedOnlineIds = new Set(getStoredArray(KEYS.importedOnline).map(String));
    state.openOrders.forEach((order) => {
      if (order.sourceId) state.importedOnlineIds.add(String(order.sourceId));
    });
    state.sales.forEach((sale) => {
      if (sale.sourceId) state.importedOnlineIds.add(String(sale.sourceId));
    });
    persistImportedIds();
  }

  async function loadCatalogAndConfig() {
    let productsData = null;
    let configData = null;
    try {
      const configResponse = await fetch(`config.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (configResponse.ok) configData = await configResponse.json();
    } catch (_) {}
    try {
      const productsResponse = await fetch(`produtos.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (productsResponse.ok) productsData = await productsResponse.json();
    } catch (_) {}

    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...(productsData && productsData.config ? productsData.config : {}),
      ...(configData || {})
    };
    mergedConfig.cores = { ...DEFAULT_CONFIG.cores, ...(productsData && productsData.config && productsData.config.cores ? productsData.config.cores : {}), ...(configData && configData.cores ? configData.cores : {}) };
    state.config = mergedConfig;
    const rawProducts = Array.isArray(productsData && productsData.produtos) ? productsData.produtos : [];
    const orderMap = Array.isArray(mergedConfig.categoriasOrdem) ? mergedConfig.categoriasOrdem : [];
    state.products = rawProducts
      .map(normalizeProduct)
      .filter((item) => item.active)
      .sort((a, b) => {
        const aCat = orderMap.indexOf(a.category);
        const bCat = orderMap.indexOf(b.category);
        const aRank = aCat === -1 ? 999 : aCat;
        const bRank = bCat === -1 ? 999 : bCat;
        return aRank - bRank || a.category.localeCompare(b.category) || a.order - b.order || a.name.localeCompare(b.name);
      });
    const categories = Array.from(new Set(state.products.map((item) => item.category)));
    state.categories = ['Todos', ...categories];
    if (!state.categories.includes(state.activeCategory)) state.activeCategory = 'Todos';
    state.products.forEach((product) => {
      if (!(product.id in state.stockMap)) state.stockMap[product.id] = null;
    });
    persistStock();
    applyTheme();
  }

  function currentOrder() {
    return state.openOrders.find((order) => order.id === state.selectedOrderId) || null;
  }

  function setSelectedOrder(id) {
    state.selectedOrderId = id || '';
    render();
  }

  function createOrder(mode, name) {
    const order = normalizeOrder({
      id: uid('order'),
      mode,
      name,
      number: String(Date.now()).slice(-6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: {
        name: mode === 'mesa' ? name : '',
        serviceType: mode === 'mesa' ? 'mesa' : mode === 'balcao' ? 'balcao' : ''
      },
      items: [],
      payment: { methods: [], cashNeed: '', cashFor: 0, change: 0 }
    });
    state.openOrders.unshift(order);
    persistOpenOrders();
    setSelectedOrder(order.id);
    return order;
  }

  function ensureBalcaoOrder() {
    let order = currentOrder();
    if (order && order.mode === 'balcao') return order;
    const nextNumber = state.openOrders.filter((item) => item.mode === 'balcao').length + 1;
    return createOrder('balcao', `Balcao ${nextNumber}`);
  }

  function createOrGetMesa(name) {
    const existing = state.openOrders.find((order) => order.mode === 'mesa' && order.name === name);
    if (existing) {
      setSelectedOrder(existing.id);
      return existing;
    }
    return createOrder('mesa', name);
  }

  function addProductToOrder(productId) {
    const product = state.products.find((item) => item.id === String(productId));
    if (!product) return;
    let order = currentOrder();
    if (!order) {
      if (state.tab === 'balcao') {
        order = ensureBalcaoOrder();
      } else {
        showAlert('Selecione uma mesa/comanda ou uma venda de balcão antes de lançar itens.', 'error');
        return;
      }
    }
    const stock = state.stockMap[product.id];
    if (typeof stock === 'number' && stock <= 0) {
      showAlert(`Estoque zerado para ${product.name}.`, 'error');
      return;
    }
    const found = order.items.find((item) => item.productId === product.id && !item.notes);
    if (found) {
      found.qty += 1;
    } else {
      order.items.push({
        key: uid('item'),
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        notes: ''
      });
    }
    order.updatedAt = new Date().toISOString();
    order.total = sumItems(order.items);
    persistOpenOrders();
    render();
  }

  function addCustomItem(name, price) {
    const safeName = normalizeText(name);
    const safePrice = Number(price || 0);
    if (!safeName || safePrice <= 0) {
      showAlert('Informe nome e valor valido para DIVERSOS.', 'error');
      return;
    }
    let order = currentOrder();
    if (!order) {
      if (state.tab === 'balcao') {
        order = ensureBalcaoOrder();
      } else {
        showAlert('Selecione uma comanda antes de adicionar DIVERSOS.', 'error');
        return;
      }
    }
    order.items.push({ key: uid('item'), productId: '', name: safeName, price: safePrice, qty: 1, notes: 'Diversos' });
    order.updatedAt = new Date().toISOString();
    order.total = sumItems(order.items);
    persistOpenOrders();
    render();
  }

  function updateItemQty(orderId, itemKey, delta) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    const item = order.items.find((entry) => entry.key === itemKey);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      order.items = order.items.filter((entry) => entry.key !== itemKey);
    }
    order.updatedAt = new Date().toISOString();
    order.total = sumItems(order.items);
    persistOpenOrders();
    render();
  }

  function removeItem(orderId, itemKey) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    order.items = order.items.filter((entry) => entry.key !== itemKey);
    order.updatedAt = new Date().toISOString();
    order.total = sumItems(order.items);
    persistOpenOrders();
    render();
  }

  function renameOrder(orderId) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    const result = window.prompt('Novo nome da comanda:', order.name);
    if (!result) return;
    order.name = normalizeText(result, order.name);
    if (order.mode === 'mesa') order.customer.name = order.name;
    order.updatedAt = new Date().toISOString();
    persistOpenOrders();
    render();
  }

  function updateOrderStatus(orderId, status) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    persistOpenOrders();
    render();
  }

  function updatePayment(orderId, methods, cashNeed, cashFor) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    order.payment.methods = methods.slice(0, 2);
    order.payment.cashNeed = cashNeed || '';
    order.payment.cashFor = Number(cashFor || 0);
    if (order.payment.methods.includes('Dinheiro') && order.payment.cashNeed === 'sim' && order.payment.cashFor > order.total) {
      order.payment.change = order.payment.cashFor - order.total;
    } else {
      order.payment.change = 0;
    }
    persistOpenOrders();
  }

  function validateCheckout(order) {
    if (!order) return 'Selecione uma comanda.';
    if (!order.items.length) return 'Adicione pelo menos um item para finalizar.';
    if (!order.payment.methods.length) return 'Escolha pelo menos uma forma de pagamento.';
    if (order.payment.methods.length > 2) return 'Selecione no maximo 2 formas de pagamento.';
    if (order.payment.methods.includes('Dinheiro')) {
      if (!order.payment.cashNeed) return 'Informe se precisa de troco.';
      if (order.payment.cashNeed === 'sim') {
        if (!order.payment.cashFor || order.payment.cashFor < order.total) return 'Informe um valor valido para troco.';
      }
    }
    return '';
  }

  function applyStockOutput(order) {
    order.items.forEach((item) => {
      if (!item.productId) return;
      const current = state.stockMap[item.productId];
      if (typeof current === 'number') {
        state.stockMap[item.productId] = Math.max(0, current - item.qty);
      }
    });
    persistStock();
  }

  function finalizeOrder(orderId) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    const error = validateCheckout(order);
    if (error) {
      showAlert(error, 'error');
      return;
    }
    order.total = sumItems(order.items);
    if (order.payment.methods.includes('Dinheiro') && order.payment.cashNeed === 'sim') {
      order.payment.change = Math.max(0, Number(order.payment.cashFor || 0) - order.total);
    }
    const sale = {
      ...order,
      status: 'fechada',
      updatedAt: new Date().toISOString(),
      finalizadoEm: new Date().toISOString(),
      total: order.total
    };
    applyStockOutput(order);
    state.sales.unshift(sale);
    state.openOrders = state.openOrders.filter((entry) => entry.id !== orderId);
    if (sale.sourceId) state.importedOnlineIds.add(String(sale.sourceId));
    persistSales();
    persistOpenOrders();
    persistImportedIds();
    state.selectedOrderId = state.openOrders[0] ? state.openOrders[0].id : '';
    printReceipt(sale);
    showAlert(`${sale.name} finalizada com sucesso.`);
    render();
  }

  function cancelOrder(orderId) {
    const order = state.openOrders.find((entry) => entry.id === orderId);
    if (!order) return;
    if (!window.confirm(`Cancelar ${order.name}?`)) return;
    state.openOrders = state.openOrders.filter((entry) => entry.id !== orderId);
    persistOpenOrders();
    state.selectedOrderId = state.openOrders[0] ? state.openOrders[0].id : '';
    render();
  }

  function printReceipt(order) {
    const receipt = window.open('', '_blank', 'width=360,height=720');
    if (!receipt) return;
    const itemsHtml = order.items.map((item) => `
      <div class="line">
        <div>${escapeHtml(item.qty)}x ${escapeHtml(item.name)}</div>
        <div>${money(item.qty * item.price)}</div>
      </div>
      ${item.notes ? `<div class="note">${escapeHtml(item.notes)}</div>` : ''}
    `).join('');
    const payment = order.payment.methods.length ? escapeHtml(order.payment.methods.join(' + ')) : 'Nao informado';
    const troco = order.payment.methods.includes('Dinheiro')
      ? (order.payment.cashNeed === 'sim' ? `Troco para ${money(order.payment.cashFor)} | Troco ${money(order.payment.change)}` : 'Sem troco')
      : 'Troco nao se aplica';
    receipt.document.write(`<!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Comanda ${escapeHtml(order.name)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; color: #000; }
          .wrap { width: 58mm; margin: 0 auto; }
          .center { text-align: center; }
          img { max-width: 70px; max-height: 70px; object-fit: contain; }
          h1 { font-size: 16px; margin: 8px 0 4px; }
          h2 { font-size: 12px; margin: 0 0 4px; font-weight: 600; }
          h3 { font-size: 10px; margin: 0 0 8px; font-weight: 500; }
          .sep { border-top: 1px dashed #000; margin: 10px 0; }
          .line { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; margin-bottom: 4px; }
          .note { font-size: 10px; margin: -2px 0 6px; }
          .small { font-size: 10px; }
          .strong { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="center">
            <img src="${escapeHtml(state.config.notaLogoUrl || state.config.appIconeUrl || '')}" alt="Logo" />
            <h1>${escapeHtml(state.config.notaTitulo || state.config.marca || 'MH LANCHES')}</h1>
            <h2>${escapeHtml(state.config.notaSubtitulo || 'Mais que uma lanchonete')}</h2>
            <h3>${escapeHtml(state.config.notaTipo || 'Comanda / Balcao')}</h3>
          </div>
          <div class="sep"></div>
          <div class="small"><strong>Comanda:</strong> ${escapeHtml(order.name)}</div>
          <div class="small"><strong>Origem:</strong> ${escapeHtml(order.mode)}</div>
          <div class="small"><strong>Data:</strong> ${escapeHtml(shortDate(order.finalizadoEm || order.updatedAt))}</div>
          ${order.customer.name ? `<div class="small"><strong>Cliente:</strong> ${escapeHtml(order.customer.name)}</div>` : ''}
          ${order.customer.address ? `<div class="small"><strong>Endereco:</strong> ${escapeHtml(order.customer.address)}</div>` : ''}
          ${order.customer.district ? `<div class="small"><strong>Bairro:</strong> ${escapeHtml(order.customer.district)}</div>` : ''}
          ${order.customer.reference ? `<div class="small"><strong>Referencia:</strong> ${escapeHtml(order.customer.reference)}</div>` : ''}
          <div class="sep"></div>
          ${itemsHtml}
          <div class="sep"></div>
          <div class="small"><strong>Pagamento:</strong> ${payment}</div>
          <div class="small"><strong>Troco:</strong> ${escapeHtml(troco)}</div>
          <div class="line strong" style="margin-top:8px;"><div>TOTAL</div><div>${money(order.total)}</div></div>
          <div class="sep"></div>
          <div class="center small">${escapeHtml(state.config.notaRodape || 'Relatorio Gerencial nao fiscal!')}</div>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 180); }<\/script>
      </body>
      </html>`);
    receipt.document.close();
  }

  function productStock(productId) {
    return state.stockMap[productId];
  }

  function renderKpis() {
    const onlineCount = state.openOrders.filter((order) => order.mode === 'online').length;
    const mesasCount = state.openOrders.filter((order) => order.mode === 'mesa').length;
    const faturadoHoje = state.sales
      .filter((sale) => String(sale.finalizadoEm || '').startsWith(todayKey()))
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    refs.kpiOpen.textContent = String(state.openOrders.length);
    refs.kpiOnline.textContent = String(onlineCount);
    refs.kpiTables.textContent = String(mesasCount);
    refs.kpiSales.textContent = money(faturadoHoje);
  }

  function tabButtonHtml(tab, label, desc) {
    return `<button class="glass-chip rounded-2xl p-4 text-left ${state.tab === tab ? 'accent-border accent-soft-bg' : ''}" data-tab="${tab}"><span class="block text-base font-black">${label}</span><span class="mt-1 block text-xs text-zinc-400">${desc}</span></button>`;
  }

  function orderCard(order) {
    return `
      <button class="glass-chip w-full rounded-2xl border p-4 text-left ${state.selectedOrderId === order.id ? 'accent-border accent-soft-bg' : ''}" data-action="select-order" data-order-id="${order.id}">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="mode-badge rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" data-mode="${order.mode}">${order.mode}</span>
              <span class="status-pill rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" data-status="${order.status}">${order.status}</span>
            </div>
            <p class="mt-3 text-lg font-black leading-tight">${escapeHtml(order.name)}</p>
            <p class="mt-1 text-xs text-zinc-400">${escapeHtml(shortDate(order.createdAt))}</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-black">${money(order.total)}</p>
            <p class="text-xs text-zinc-400">${order.items.length} itens</p>
          </div>
        </div>
        ${order.customer.name ? `<p class="mt-3 text-sm text-zinc-300">Cliente: ${escapeHtml(order.customer.name)}</p>` : ''}
        ${order.customer.address ? `<p class="mt-1 text-xs text-zinc-400">${escapeHtml(order.customer.address)}${order.customer.district ? ` · ${escapeHtml(order.customer.district)}` : ''}</p>` : ''}
      </button>
    `;
  }

  function renderOnlineLeft() {
    const onlineOrders = state.openOrders.filter((order) => order.mode === 'online');
    refs.leftPane.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Painel de pedidos</p>
          <h2 class="mt-1 text-xl font-black">Pedidos online</h2>
        </div>
        <button data-action="sync-online" class="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:border-white/20">Sincronizar</button>
      </div>
      <p class="mt-2 text-sm text-zinc-400">Pedidos recebidos do site entram aqui automaticamente com alerta sonoro e visual.</p>
      <div class="mt-4 space-y-3 overflow-y-auto max-h-[66vh] pr-1 scroll-ui">
        ${onlineOrders.length ? onlineOrders.map(orderCard).join('') : `<div class="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-400">Nenhum pedido online em aberto no momento.</div>`}
      </div>
    `;
  }

  function renderMesasLeft() {
    const openTables = state.openOrders.filter((order) => order.mode === 'mesa');
    const tableButtons = Array.from({ length: 12 }, (_, index) => {
      const name = `Mesa ${index + 1}`;
      const active = openTables.find((order) => order.name === name);
      return `
        <button data-action="open-mesa" data-mesa-name="${name}" class="glass-chip rounded-2xl border p-4 text-left ${active ? 'accent-border accent-soft-bg' : ''}">
          <span class="block text-base font-black">${name}</span>
          <span class="mt-1 block text-xs ${active ? 'text-orange-200' : 'text-zinc-400'}">${active ? `${active.items.length} itens · ${money(active.total)}` : 'Livre'}</span>
        </button>
      `;
    }).join('');

    refs.leftPane.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Mesas e comandas</p>
          <h2 class="mt-1 text-xl font-black">Operacao de salao</h2>
        </div>
        <button data-action="open-custom-comanda" class="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:border-white/20">+ Nova comanda</button>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">${tableButtons}</div>
      <div class="mt-5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Comandas abertas</p>
        <div class="mt-3 space-y-3 overflow-y-auto max-h-[42vh] pr-1 scroll-ui">
          ${openTables.length ? openTables.map(orderCard).join('') : `<div class="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-400">Nenhuma mesa aberta.</div>`}
        </div>
      </div>
    `;
  }

  function renderBalcaoLeft() {
    const openCounter = state.openOrders.filter((order) => order.mode === 'balcao');
    refs.leftPane.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Caixa rapido</p>
          <h2 class="mt-1 text-xl font-black">Vendas no balcão</h2>
        </div>
        <button data-action="new-balcao" class="rounded-xl accent-bg px-4 py-2 text-sm font-black text-zinc-950">+ Nova venda</button>
      </div>
      <p class="mt-2 text-sm text-zinc-400">Clique em uma venda aberta ou lance itens direto para abrir um novo atendimento no balcão.</p>
      <div class="mt-4 space-y-3 overflow-y-auto max-h-[66vh] pr-1 scroll-ui">
        ${openCounter.length ? openCounter.map(orderCard).join('') : `<div class="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-400">Nenhuma venda de balcão aberta.</div>`}
      </div>
    `;
  }

  function renderStockLeft() {
    refs.leftPane.innerHTML = `
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Controle de estoque</p>
        <h2 class="mt-1 text-xl font-black">Entrada e saída</h2>
        <p class="mt-2 text-sm text-zinc-400">Defina quantidades para controlar saída automática nas vendas. Campo vazio significa estoque livre.</p>
      </div>
      <div class="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
        <p>Produtos sincronizados do mesmo catálogo do site.</p>
        <p class="mt-2">Saída automática acontece ao finalizar uma venda.</p>
        <p class="mt-2">Você pode ajustar entradas e correções diretamente aqui.</p>
      </div>
    `;
  }

  function renderReportsLeft() {
    refs.leftPane.innerHTML = `
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Gestao</p>
        <h2 class="mt-1 text-xl font-black">Relatórios</h2>
        <p class="mt-2 text-sm text-zinc-400">Veja vendas, ticket médio, origens e histórico geral do dia ao ano.</p>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button data-action="report-range" data-range="hoje" class="report-pill rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold ${state.reportRange === 'hoje' ? 'report-pill' : ''}" data-active="${state.reportRange === 'hoje'}">Hoje</button>
        <button data-action="report-range" data-range="7dias" class="report-pill rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold" data-active="${state.reportRange === '7dias'}">7 dias</button>
        <button data-action="report-range" data-range="mes" class="report-pill rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold" data-active="${state.reportRange === 'mes'}">Mês</button>
        <button data-action="report-range" data-range="ano" class="report-pill rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold" data-active="${state.reportRange === 'ano'}">Ano</button>
        <button data-action="report-range" data-range="total" class="report-pill rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold" data-active="${state.reportRange === 'total'}">Total</button>
      </div>
      <button data-action="reset-sales" class="mt-4 w-full rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">Resetar historico</button>
    `;
  }

  function renderSettingsLeft() {
    refs.leftPane.innerHTML = `
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Ajustes locais</p>
        <h2 class="mt-1 text-xl font-black">Configurações do PDV</h2>
        <p class="mt-2 text-sm text-zinc-400">Configurações rápidas para operação do caixa e integração do dia a dia.</p>
      </div>
      <div class="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
        <p><strong class="text-zinc-100">Marca:</strong> ${escapeHtml(state.config.marca || 'MH Lanches')}</p>
        <p class="mt-2"><strong class="text-zinc-100">WhatsApp:</strong> ${escapeHtml(state.config.whatsapp || '+5581985770055')}</p>
        <p class="mt-2"><strong class="text-zinc-100">Integração:</strong> Produtos lidos diretamente do catálogo principal.</p>
      </div>
    `;
  }

  function renderCatalog(order) {
    const tabs = state.categories.map((category) => `
      <button data-action="switch-category" data-category="${escapeHtml(category)}" class="rounded-xl border px-3 py-2 text-sm font-semibold ${state.activeCategory === category ? 'accent-border accent-soft-bg text-orange-100' : 'border-white/10 text-zinc-300'}">${escapeHtml(category)}</button>
    `).join('');

    const visibleProducts = state.products.filter((product) => state.activeCategory === 'Todos' || product.category === state.activeCategory);
    const cards = visibleProducts.map((product) => {
      const stock = productStock(product.id);
      const out = typeof stock === 'number' && stock <= 0;
      return `
        <button ${out ? 'disabled' : ''} data-action="add-product" data-product-id="${product.id}" class="product-card rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition">
          <div class="flex gap-3">
            <img src="${escapeHtml(product.image || state.config.notaLogoUrl || '')}" alt="${escapeHtml(product.name)}" class="h-16 w-16 rounded-xl object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-black">${escapeHtml(product.name)}</p>
              <p class="mt-1 text-[11px] text-zinc-400">${escapeHtml(product.category)}</p>
              <div class="mt-2 flex items-center justify-between gap-3">
                <span class="text-sm font-black">${money(product.price)}</span>
                <span class="text-[11px] ${out ? 'text-rose-300' : 'text-zinc-400'}">${out ? 'Sem estoque' : (typeof stock === 'number' ? `${stock} un.` : 'Livre')}</span>
              </div>
            </div>
          </div>
        </button>
      `;
    }).join('');

    return `
      <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Catálogo integrado</p>
            <h3 class="mt-1 text-lg font-black">Produtos do cardápio</h3>
          </div>
          <button data-action="open-custom-item" class="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:border-white/20">+ DIVERSOS</button>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">${tabs}</div>
        <div class="mt-4 grid gap-3 xl:grid-cols-2 2xl:grid-cols-3 max-h-[38vh] overflow-y-auto pr-1 scroll-ui">
          ${cards || `<div class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-400">Nenhum produto nessa categoria.</div>`}
        </div>
        <form id="custom-item-form" class="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <input id="custom-item-name" placeholder="Nome do item DIVERSOS" class="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/20" />
          <input id="custom-item-price" type="number" min="0" step="0.01" placeholder="Valor" class="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/20" />
          <button class="rounded-xl accent-bg px-4 py-3 text-sm font-black text-zinc-950">Adicionar</button>
        </form>
      </section>
    `;
  }

  function renderOrderDetail(order) {
    if (!order) {
      const message = state.tab === 'online'
        ? 'Selecione um pedido online para visualizar detalhes, imprimir ou finalizar.'
        : state.tab === 'mesas'
          ? 'Abra uma mesa/comanda para lançar itens e fechar conta.'
          : 'Abra uma venda de balcão ou clique em um produto para iniciar atendimento rápido.';
      return `
        <div class="flex h-full min-h-[360px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <div>
            <p class="text-lg font-black">Nenhuma comanda selecionada</p>
            <p class="mt-2 max-w-xl text-sm text-zinc-400">${message}</p>
          </div>
        </div>
      `;
    }

    const paymentMethods = ['Dinheiro', 'Cartao credito', 'Cartao debito', 'Pix'];
    const paymentChips = paymentMethods.map((method) => {
      const active = order.payment.methods.includes(method);
      return `
        <button type="button" data-action="toggle-payment" data-order-id="${order.id}" data-method="${escapeHtml(method)}" class="rounded-xl border px-3 py-2 text-sm font-semibold ${active ? 'accent-border accent-soft-bg text-orange-100' : 'border-white/10 text-zinc-300'}">${escapeHtml(method)}</button>
      `;
    }).join('');
    const itemsRows = order.items.map((item) => `
      <div class="rounded-2xl border border-white/8 bg-black/20 p-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black">${escapeHtml(item.name)}</p>
            <p class="mt-1 text-xs text-zinc-400">${item.notes ? escapeHtml(item.notes) : 'Item do catálogo'}</p>
          </div>
          <p class="text-sm font-black">${money(item.qty * item.price)}</p>
        </div>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button data-action="item-qty" data-order-id="${order.id}" data-item-key="${item.key}" data-delta="-1" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm font-bold hover:border-white/20">-</button>
            <span class="min-w-8 text-center text-sm font-bold">${item.qty}</span>
            <button data-action="item-qty" data-order-id="${order.id}" data-item-key="${item.key}" data-delta="1" class="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm font-bold hover:border-white/20">+</button>
          </div>
          <button data-action="remove-item" data-order-id="${order.id}" data-item-key="${item.key}" class="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 hover:bg-rose-500/10">Remover</button>
        </div>
      </div>
    `).join('');
    const cashEnabled = order.payment.methods.includes('Dinheiro');
    return `
      <div class="space-y-4">
        ${(state.tab === 'online' || order.mode === 'online' || state.tab === 'mesas' || state.tab === 'balcao') ? renderCatalog(order) : ''}

        <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="mode-badge rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" data-mode="${order.mode}">${order.mode}</span>
                <span class="status-pill rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" data-status="${order.status}">${order.status}</span>
              </div>
              <h2 class="mt-3 text-2xl font-black">${escapeHtml(order.name)}</h2>
              <p class="mt-1 text-sm text-zinc-400">Criada em ${escapeHtml(shortDate(order.createdAt))}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button data-action="rename-order" data-order-id="${order.id}" class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:border-white/20">Renomear</button>
              <button data-action="print-order" data-order-id="${order.id}" class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:border-white/20">Imprimir</button>
              <button data-action="cancel-order" data-order-id="${order.id}" class="rounded-xl border border-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/10">Cancelar</button>
              <button data-action="finalize-order" data-order-id="${order.id}" class="rounded-xl accent-bg px-4 py-2 text-sm font-black text-zinc-950">Finalizar</button>
            </div>
          </div>

          <div class="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Dados do cliente / atendimento</p>
              <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div><p class="text-xs text-zinc-500">Cliente</p><p class="mt-1 text-sm font-semibold">${escapeHtml(order.customer.name || '-')}</p></div>
                <div><p class="text-xs text-zinc-500">Tipo</p><p class="mt-1 text-sm font-semibold">${escapeHtml(order.customer.serviceType || order.mode)}</p></div>
                <div><p class="text-xs text-zinc-500">Endereco</p><p class="mt-1 text-sm font-semibold">${escapeHtml(order.customer.address || '-')}</p></div>
                <div><p class="text-xs text-zinc-500">Referencia</p><p class="mt-1 text-sm font-semibold">${escapeHtml([order.customer.district, order.customer.reference].filter(Boolean).join(' · ') || '-')}</p></div>
              </div>
            </div>
            <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Status</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button data-action="set-status" data-order-id="${order.id}" data-status="novo" class="rounded-xl border px-3 py-2 text-sm font-semibold ${order.status === 'novo' ? 'accent-border accent-soft-bg text-orange-100' : 'border-white/10'}">Novo</button>
                <button data-action="set-status" data-order-id="${order.id}" data-status="preparando" class="rounded-xl border px-3 py-2 text-sm font-semibold ${order.status === 'preparando' ? 'accent-border accent-soft-bg text-orange-100' : 'border-white/10'}">Preparando</button>
                <button data-action="set-status" data-order-id="${order.id}" data-status="pronto" class="rounded-xl border px-3 py-2 text-sm font-semibold ${order.status === 'pronto' ? 'accent-border accent-soft-bg text-orange-100' : 'border-white/10'}">Pronto</button>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Itens da comanda</p>
              <h3 class="mt-1 text-lg font-black">Lançamentos</h3>
            </div>
            <p class="text-2xl font-black">${money(order.total)}</p>
          </div>
          <div class="mt-4 space-y-3 max-h-[28vh] overflow-y-auto pr-1 scroll-ui">
            ${itemsRows || `<div class="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-400">Nenhum item lançado ainda.</div>`}
          </div>
        </section>

        <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Pagamento</p>
              <h3 class="mt-1 text-lg font-black">Fechamento da conta</h3>
            </div>
            <p class="text-sm text-zinc-400">Escolha ate 2 formas de pagamento.</p>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">${paymentChips}</div>
          ${cashEnabled ? `
            <div class="mt-4 grid gap-3 lg:grid-cols-[220px_220px_auto]">
              <select id="cash-need-select" data-order-id="${order.id}" class="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/20">
                <option value="">Precisa de troco?</option>
                <option value="nao" ${order.payment.cashNeed === 'nao' ? 'selected' : ''}>Nao</option>
                <option value="sim" ${order.payment.cashNeed === 'sim' ? 'selected' : ''}>Sim</option>
              </select>
              <input id="cash-for-input" data-order-id="${order.id}" type="number" min="0" step="0.01" value="${order.payment.cashFor || ''}" placeholder="Troco para quanto?" class="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/20" ${order.payment.cashNeed === 'sim' ? '' : 'disabled'} />
              <div class="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                ${order.payment.cashNeed === 'sim' && order.payment.cashFor >= order.total ? `Troco calculado: <strong class="text-zinc-100">${money(order.payment.change)}</strong>` : 'Troco calculado automaticamente aqui.'}
              </div>
            </div>
          ` : ''}
        </section>
      </div>
    `;
  }

  function getSalesByRange() {
    const now = new Date();
    return state.sales.filter((sale) => {
      const date = new Date(sale.finalizadoEm || sale.updatedAt || sale.createdAt);
      if (state.reportRange === 'hoje') return date.toISOString().slice(0, 10) === todayKey();
      if (state.reportRange === '7dias') return (now - date) <= 7 * 24 * 60 * 60 * 1000;
      if (state.reportRange === 'mes') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (state.reportRange === 'ano') return date.getFullYear() === now.getFullYear();
      return true;
    });
  }

  function renderReportsRight() {
    const sales = getSalesByRange();
    const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const avg = sales.length ? total / sales.length : 0;
    const online = sales.filter((sale) => sale.mode === 'online').length;
    const mesas = sales.filter((sale) => sale.mode === 'mesa').length;
    const balcao = sales.filter((sale) => sale.mode === 'balcao').length;
    const listHtml = sales.map((sale) => `
      <div class="rounded-2xl border border-white/8 bg-black/20 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-base font-black">${escapeHtml(sale.name)}</p>
            <p class="mt-1 text-xs text-zinc-400">${escapeHtml(shortDate(sale.finalizadoEm))} · ${escapeHtml(sale.mode)}</p>
          </div>
          <p class="text-lg font-black">${money(sale.total)}</p>
        </div>
      </div>
    `).join('');

    refs.rightPane.innerHTML = `
      <section class="space-y-4">
        <div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <div class="rounded-[24px] border border-white/8 bg-black/20 p-4"><p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Vendas</p><p class="mt-2 text-3xl font-black">${sales.length}</p></div>
          <div class="rounded-[24px] border border-white/8 bg-black/20 p-4"><p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Faturamento</p><p class="mt-2 text-3xl font-black">${money(total)}</p></div>
          <div class="rounded-[24px] border border-white/8 bg-black/20 p-4"><p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Ticket medio</p><p class="mt-2 text-3xl font-black">${money(avg)}</p></div>
          <div class="rounded-[24px] border border-white/8 bg-black/20 p-4"><p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Origem</p><p class="mt-2 text-xl font-black">Online ${online} · Mesas ${mesas} · Balcão ${balcao}</p></div>
        </div>
        <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Historico</p>
              <h3 class="mt-1 text-lg font-black">Vendas registradas</h3>
            </div>
          </div>
          <div class="mt-4 max-h-[58vh] space-y-3 overflow-y-auto pr-1 scroll-ui">
            ${listHtml || `<div class="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-400">Nenhuma venda encontrada nesse período.</div>`}
          </div>
        </section>
      </section>
    `;
  }

  function renderStockRight() {
    const rows = state.products.map((product) => {
      const stock = state.stockMap[product.id];
      const display = typeof stock === 'number' ? stock : '';
      return `
        <tr>
          <td>
            <p class="font-bold">${escapeHtml(product.name)}</p>
            <p class="mt-1 text-xs text-zinc-400">${escapeHtml(product.category)}</p>
          </td>
          <td>${money(product.price)}</td>
          <td>
            <input data-action="stock-input" data-product-id="${product.id}" type="number" step="1" value="${display}" placeholder="Livre" class="w-28 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none focus:border-white/20" />
          </td>
          <td>
            <div class="flex flex-wrap gap-2">
              <button data-action="stock-adjust" data-product-id="${product.id}" data-delta="-1" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">-1</button>
              <button data-action="stock-adjust" data-product-id="${product.id}" data-delta="1" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">+1</button>
              <button data-action="stock-adjust" data-product-id="${product.id}" data-delta="5" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">+5</button>
              <button data-action="stock-free" data-product-id="${product.id}" class="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Livre</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    refs.rightPane.innerHTML = `
      <section class="rounded-[24px] border border-white/8 bg-black/20 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Estoque operacional</p>
            <h3 class="mt-1 text-lg font-black">Controle por produto</h3>
          </div>
        </div>
        <div class="mt-4 overflow-auto scroll-ui">
          <table class="data-table min-w-[860px]">
            <thead><tr><th>Produto</th><th>Preço</th><th>Quantidade</th><th>Ações</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderSettingsRight() {
    refs.rightPane.innerHTML = `
      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Operação</p>
          <h3 class="mt-1 text-lg font-black">Preferências do PDV</h3>
          <div class="mt-4 space-y-4">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
              <span>
                <span class="block font-semibold">Som de novo pedido</span>
                <span class="mt-1 block text-xs text-zinc-400">Emite aviso discreto quando pedido online chega.</span>
              </span>
              <input id="setting-sound" data-action="setting-sound" type="checkbox" ${state.settings.somAtivo ? 'checked' : ''} class="h-5 w-5" />
            </label>
            <label class="block rounded-2xl border border-white/8 bg-black/20 p-4">
              <span class="block font-semibold">Intervalo de sincronização</span>
              <span class="mt-1 block text-xs text-zinc-400">Busca novos pedidos online do arquivo e da memória compartilhada.</span>
              <select id="setting-poll" data-action="setting-poll" class="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm">
                <option value="10" ${Number(state.settings.intervaloSegundos) === 10 ? 'selected' : ''}>10 segundos</option>
                <option value="12" ${Number(state.settings.intervaloSegundos) === 12 ? 'selected' : ''}>12 segundos</option>
                <option value="15" ${Number(state.settings.intervaloSegundos) === 15 ? 'selected' : ''}>15 segundos</option>
                <option value="20" ${Number(state.settings.intervaloSegundos) === 20 ? 'selected' : ''}>20 segundos</option>
              </select>
            </label>
          </div>
        </div>
        <div class="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <p class="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Integração</p>
          <h3 class="mt-1 text-lg font-black">Sistema principal</h3>
          <div class="mt-4 space-y-3 text-sm text-zinc-300">
            <p>• Produtos lidos automaticamente do mesmo <strong>produtos.json</strong> do site.</p>
            <p>• Vendas finalizadas também alimentam os relatórios internos do sistema.</p>
            <p>• Pedidos online são capturados do site via sincronização em segundo plano.</p>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <a href="admin.html" class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:border-white/20">Abrir admin</a>
            <button data-action="sync-online" class="rounded-xl accent-bg px-4 py-2 text-sm font-black text-zinc-950">Sincronizar agora</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderRightPane() {
    if (state.tab === 'estoque') return renderStockRight();
    if (state.tab === 'relatorios') return renderReportsRight();
    if (state.tab === 'configuracoes') return renderSettingsRight();
    refs.rightPane.innerHTML = renderOrderDetail(currentOrder());
  }

  function renderLeftPane() {
    if (state.tab === 'online') return renderOnlineLeft();
    if (state.tab === 'mesas') return renderMesasLeft();
    if (state.tab === 'balcao') return renderBalcaoLeft();
    if (state.tab === 'estoque') return renderStockLeft();
    if (state.tab === 'relatorios') return renderReportsLeft();
    renderSettingsLeft();
  }

  function renderTabsState() {
    refs.tabButtons.forEach((button) => {
      button.setAttribute('data-active', String(button.dataset.tab === state.tab));
    });
  }

  function render() {
    renderTabsState();
    renderKpis();
    renderLeftPane();
    renderRightPane();
  }

  function importOnlineOrders(list) {
    const source = Array.isArray(list) ? list : [];
    let imported = 0;
    source.forEach((raw) => {
      const sourceId = normalizeText(raw && (raw.id || raw.numeroPedido || raw.number));
      if (!sourceId) return;
      if (state.importedOnlineIds.has(sourceId)) return;
      const exists = state.openOrders.some((order) => order.sourceId === sourceId) || state.sales.some((sale) => sale.sourceId === sourceId);
      if (exists) {
        state.importedOnlineIds.add(sourceId);
        return;
      }
      const order = normalizeOrder({
        id: uid('online'),
        sourceId,
        number: raw.numeroPedido || sourceId.slice(-6),
        mode: 'online',
        name: `Pedido #${raw.numeroPedido || sourceId.slice(-4)}`,
        status: raw.status || 'novo',
        createdAt: raw.criadoEm || new Date().toISOString(),
        updatedAt: raw.criadoEm || new Date().toISOString(),
        customer: {
          name: raw.cliente && raw.cliente.nome,
          address: raw.cliente && raw.cliente.endereco,
          district: raw.cliente && raw.cliente.bairro,
          reference: raw.cliente && raw.cliente.referencia,
          serviceType: raw.cliente && raw.cliente.tipoAtendimento
        },
        payment: {
          methods: raw.pagamento && raw.pagamento.formas,
          cashNeed: raw.pagamento && raw.pagamento.precisaTroco,
          cashFor: raw.pagamento && (raw.pagamento.trocoValor || raw.pagamento.trocoPara)
        },
        items: Array.isArray(raw.itens) ? raw.itens.map((item) => ({
          productId: item.produtoId,
          name: item.nome,
          qty: item.quantidade,
          price: item.precoFinal,
          notes: item.resumo
        })) : [],
        total: raw.totais && raw.totais.total,
        messageOriginal: raw.mensagemOriginal,
        note: raw.observacaoInterna
      });
      state.openOrders.unshift(order);
      state.importedOnlineIds.add(sourceId);
      imported += 1;
    });
    if (imported) {
      persistOpenOrders();
      persistImportedIds();
      if (!currentOrder() && state.settings.abrirAutomaticamenteOnline) {
        const firstOnline = state.openOrders.find((order) => order.mode === 'online');
        if (firstOnline) state.selectedOrderId = firstOnline.id;
      }
      beep();
      showAlert(`${imported} novo(s) pedido(s) online recebido(s).`);
      render();
    }
  }

  function parseRemoteOrdersPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.pedidos)) return payload.pedidos;
    return [];
  }

  async function syncOnlineOrders() {
    importOnlineOrders(getStoredArray(KEYS.sharedOrders));
    try {
      const response = await fetch(`pedidos.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        importOnlineOrders(parseRemoteOrdersPayload(payload));
      }
    } catch (_) {}
  }

  function resetPolling() {
    clearInterval(state.pollTimer);
    state.pollTimer = setInterval(syncOnlineOrders, Math.max(10, Number(state.settings.intervaloSegundos) || 12) * 1000);
  }

  function handleTabChange(tab) {
    state.tab = tab;
    if (['online', 'mesas', 'balcao'].includes(tab)) {
      const expectedMode = tab === 'mesas' ? 'mesa' : tab;
      const selected = currentOrder();
      if (!selected || selected.mode !== expectedMode) {
        const next = state.openOrders.find((order) => order.mode === expectedMode);
        state.selectedOrderId = next ? next.id : '';
      }
    }
    render();
  }

  function resetSalesHistory() {
    if (!window.confirm('Deseja realmente apagar o historico de vendas?')) return;
    state.sales = [];
    persistSales();
    render();
    showAlert('Historico de vendas zerado.');
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action], [data-tab]');
    if (!trigger) return;
    if (trigger.dataset.tab) {
      handleTabChange(trigger.dataset.tab);
      return;
    }
    const { action } = trigger.dataset;
    if (action === 'select-order') {
      setSelectedOrder(trigger.dataset.orderId);
      return;
    }
    if (action === 'open-mesa') {
      createOrGetMesa(trigger.dataset.mesaName);
      return;
    }
    if (action === 'open-custom-comanda') {
      const custom = window.prompt('Nome da nova comanda:', 'Comanda 1');
      if (!custom) return;
      createOrder('mesa', normalizeText(custom, 'Comanda'));
      return;
    }
    if (action === 'new-balcao') {
      ensureBalcaoOrder();
      return;
    }
    if (action === 'add-product') {
      addProductToOrder(trigger.dataset.productId);
      return;
    }
    if (action === 'open-custom-item') {
      const field = document.getElementById('custom-item-name');
      if (field) field.focus();
      return;
    }
    if (action === 'item-qty') {
      updateItemQty(trigger.dataset.orderId, trigger.dataset.itemKey, Number(trigger.dataset.delta || 0));
      return;
    }
    if (action === 'remove-item') {
      removeItem(trigger.dataset.orderId, trigger.dataset.itemKey);
      return;
    }
    if (action === 'rename-order') {
      renameOrder(trigger.dataset.orderId);
      return;
    }
    if (action === 'set-status') {
      updateOrderStatus(trigger.dataset.orderId, trigger.dataset.status);
      return;
    }
    if (action === 'toggle-payment') {
      const order = state.openOrders.find((entry) => entry.id === trigger.dataset.orderId);
      if (!order) return;
      const method = trigger.dataset.method;
      const methods = new Set(order.payment.methods);
      if (methods.has(method)) {
        methods.delete(method);
      } else {
        if (methods.size >= 2) {
          showAlert('Escolha no maximo 2 formas de pagamento.', 'error');
          return;
        }
        methods.add(method);
      }
      updatePayment(order.id, Array.from(methods), order.payment.cashNeed, order.payment.cashFor);
      render();
      return;
    }
    if (action === 'print-order') {
      const order = state.openOrders.find((entry) => entry.id === trigger.dataset.orderId);
      if (order) printReceipt(order);
      return;
    }
    if (action === 'finalize-order') {
      finalizeOrder(trigger.dataset.orderId);
      return;
    }
    if (action === 'cancel-order') {
      cancelOrder(trigger.dataset.orderId);
      return;
    }
    if (action === 'switch-category') {
      state.activeCategory = trigger.dataset.category;
      renderRightPane();
      return;
    }
    if (action === 'sync-online') {
      syncOnlineOrders().then(() => showAlert('Sincronizacao concluida.')).catch(() => showAlert('Falha ao sincronizar pedidos.', 'error'));
      return;
    }
    if (action === 'stock-adjust') {
      const productId = trigger.dataset.productId;
      const delta = Number(trigger.dataset.delta || 0);
      const current = state.stockMap[productId];
      const next = typeof current === 'number' ? Math.max(0, current + delta) : Math.max(0, delta);
      state.stockMap[productId] = next;
      persistStock();
      renderRightPane();
      return;
    }
    if (action === 'stock-free') {
      state.stockMap[trigger.dataset.productId] = null;
      persistStock();
      renderRightPane();
      return;
    }
    if (action === 'report-range') {
      state.reportRange = trigger.dataset.range;
      render();
      return;
    }
    if (action === 'reset-sales') {
      resetSalesHistory();
      return;
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target && event.target.id === 'custom-item-form') {
      event.preventDefault();
      const name = document.getElementById('custom-item-name');
      const price = document.getElementById('custom-item-price');
      addCustomItem(name && name.value, price && price.value);
      if (name) name.value = '';
      if (price) price.value = '';
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'cash-need-select') {
      const order = state.openOrders.find((entry) => entry.id === target.dataset.orderId);
      if (!order) return;
      updatePayment(order.id, order.payment.methods, target.value, order.payment.cashFor);
      renderRightPane();
      return;
    }
    if (target.id === 'cash-for-input') {
      const order = state.openOrders.find((entry) => entry.id === target.dataset.orderId);
      if (!order) return;
      updatePayment(order.id, order.payment.methods, order.payment.cashNeed, target.value);
      renderRightPane();
      return;
    }
    if (target.dataset.action === 'stock-input') {
      const value = target.value === '' ? null : Math.max(0, Number(target.value || 0));
      state.stockMap[target.dataset.productId] = value;
      persistStock();
      return;
    }
    if (target.dataset.action === 'setting-sound') {
      state.settings.somAtivo = Boolean(target.checked);
      persistSettings();
      showAlert('Configuracao de som atualizada.');
      return;
    }
    if (target.dataset.action === 'setting-poll') {
      state.settings.intervaloSegundos = Math.max(10, Number(target.value || 12));
      persistSettings();
      showAlert('Intervalo de sincronizacao atualizado.');
      return;
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'cash-for-input') {
      const order = state.openOrders.find((entry) => entry.id === target.dataset.orderId);
      if (!order) return;
      updatePayment(order.id, order.payment.methods, order.payment.cashNeed, target.value);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === KEYS.sharedOrders || event.key === KEYS.sharedOrdersEvent) {
      syncOnlineOrders();
    }
    if (event.key === KEYS.openOrders) {
      state.openOrders = getStoredArray(KEYS.openOrders).map(normalizeOrder);
      render();
    }
    if (event.key === KEYS.sales) {
      state.sales = getStoredArray(KEYS.sales).map((sale) => ({ ...normalizeOrder(sale), finalizadoEm: sale.finalizadoEm || sale.updatedAt || new Date().toISOString() }));
      render();
    }
  });

  async function initChannel() {
    if ('BroadcastChannel' in window) {
      state.channel = new BroadcastChannel(CHANNEL_NAME);
      state.channel.onmessage = (event) => {
        if (event && event.data && event.data.tipo === 'novo-pedido') syncOnlineOrders();
      };
    }
  }

  async function init() {
    loadLocalData();
    await loadCatalogAndConfig();
    await initChannel();
    if (!state.selectedOrderId && state.openOrders[0]) state.selectedOrderId = state.openOrders[0].id;
    render();
    await syncOnlineOrders();
    resetPolling();
  }

  init().catch((error) => {
    console.error(error);
    showAlert('Falha ao iniciar o novo PDV.', 'error');
  });
})();