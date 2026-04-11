(() => {
  const STORAGE_OPEN = 'mh_pdv_open_orders_v2';
  const STORAGE_EVENT = 'mh_pdv_open_orders_event_v2';
  const STORAGE_ONLINE_SHARED = 'brasa_pdv_pedidos_v1';
  const STORAGE_ONLINE_SHARED_EVENT = 'brasa_pdv_pedidos_evento_v1';
  const STORAGE_SALES = 'mh_vendas_historico_v1';
  const STORAGE_FIN = 'brasa_pdv_financeiro_v1';
  const CHANNEL_NAME = 'mh_pedidos';

  const app = document.getElementById('pdv-app');
  if (!app) return;

  const refs = {
    clock: document.getElementById('pdv-clock'),
    alert: document.getElementById('pdv-alert'),
    modeButtons: Array.from(document.querySelectorAll('.pdv-mode-btn')),
    panels: {
      online: document.getElementById('panel-online'),
      mesas: document.getElementById('panel-mesas'),
      balcao: document.getElementById('panel-balcao')
    },
    kpiOpen: document.getElementById('kpi-open'),
    kpiSales: document.getElementById('kpi-sales'),
    kpiOnline: document.getElementById('kpi-online'),
    onlineList: document.getElementById('online-list'),
    mesaButtons: document.getElementById('mesa-buttons'),
    mesaOrders: document.getElementById('mesa-orders'),
    mesaCustomName: document.getElementById('mesa-custom-name'),
    mesaOpenCustom: document.getElementById('mesa-open-custom'),
    balcaoOrders: document.getElementById('balcao-orders'),
    balcaoNew: document.getElementById('balcao-new'),
    orderActiveLabel: document.getElementById('order-active-label'),
    catalogTabs: document.getElementById('catalog-tabs'),
    catalogGrid: document.getElementById('catalog-grid'),
    customItemName: document.getElementById('custom-item-name'),
    customItemPrice: document.getElementById('custom-item-price'),
    customItemAdd: document.getElementById('custom-item-add'),
    paymentOptions: Array.from(document.querySelectorAll('.payment-opt')),
    cashBox: document.getElementById('cash-box'),
    cashNeed: document.getElementById('cash-change-need'),
    cashValue: document.getElementById('cash-change-value'),
    cashText: document.getElementById('cash-change-text'),
    renameCommand: document.getElementById('rename-command'),
    printCommand: document.getElementById('print-command'),
    finishCommand: document.getElementById('finish-command'),
    commandItems: document.getElementById('command-items'),
    commandTotal: document.getElementById('command-total'),
    reportToday: document.getElementById('report-today'),
    reportList: document.getElementById('report-list')
  };

  const state = {
    mode: 'online',
    categoriaAtiva: 'Todos',
    activeOrderId: '',
    produtos: [],
    categorias: ['Todos'],
    config: {
      notaLogoUrl: 'https://i.ibb.co/kgnfg3g3/MH-Logo.png',
      notaTitulo: 'MH LANCHES',
      notaSubtitulo: 'Mais que uma lanchonete',
      notaTipo: 'Comanda / Balcao',
      notaRodape: 'Relatorio Gerencial nao fiscal!'
    },
    openOrders: [],
    sales: [],
    knownOnlineIds: new Set(),
    channel: null
  };

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function orderTotal(order) {
    return (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  }

  function currentDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function toast(message, isError) {
    refs.alert.textContent = message;
    refs.alert.classList.remove('hidden');
    refs.alert.classList.toggle('border-rose-700', Boolean(isError));
    refs.alert.classList.toggle('bg-rose-500/10', Boolean(isError));
    refs.alert.classList.toggle('text-rose-200', Boolean(isError));
    refs.alert.classList.toggle('border-emerald-700', !isError);
    refs.alert.classList.toggle('bg-emerald-500/10', !isError);
    refs.alert.classList.toggle('text-emerald-200', !isError);
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => refs.alert.classList.add('hidden'), 2600);
  }

  function beep() {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 1040;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        context.close();
      }, 160);
    } catch (_) {}
  }

  function normalizeItem(raw) {
    const qty = Math.max(1, Number(raw && (raw.qty || raw.quantidade)) || 1);
    const price = Number(raw && (raw.price || raw.valor || raw.precoFinal || raw.preco)) || 0;
    return {
      name: String(raw && (raw.name || raw.nome) || 'Item').trim() || 'Item',
      qty,
      price
    };
  }

  function normalizeOrder(raw) {
    const items = (Array.isArray(raw && (raw.items || raw.itens)) ? (raw.items || raw.itens) : []).map(normalizeItem);
    const origemBruta = String(raw && raw.origem || '').toLowerCase();
    const origem = ['online', 'mesa', 'balcao'].includes(origemBruta)
      ? origemBruta
      : (origemBruta === 'site' ? 'online' : (origemBruta === 'caixa' ? 'balcao' : 'balcao'));
    const identificacao = String(raw && raw.identificacao || raw && raw.cliente && raw.cliente.nome || (origem === 'mesa' ? 'Mesa' : 'Balcao')).trim() || 'Balcao';
    const status = ['novo', 'preparando', 'pronto'].includes(raw && raw.status) ? raw.status : 'novo';
    const forms = Array.isArray(raw && raw.pagamento && raw.pagamento.formas) ? raw.pagamento.formas.slice(0, 2) : [];
    const createdAt = String(raw && (raw.createdAt || raw.criadoEm) || new Date().toISOString());
    return {
      id: String(raw && raw.id || `pdv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      number: Number(raw && (raw.number || raw.numeroPedido)) || Math.floor(Date.now() / 1000),
      origem,
      identificacao,
      status,
      createdAt,
      updatedAt: String(raw && raw.updatedAt || createdAt),
      paid: Boolean(raw && raw.paid),
      customer: {
        nome: String(raw && raw.cliente && raw.cliente.nome || '').trim(),
        endereco: String(raw && raw.cliente && raw.cliente.endereco || '').trim(),
        referencia: String(raw && raw.cliente && raw.cliente.referencia || '').trim(),
        tipoAtendimento: String(raw && raw.cliente && raw.cliente.tipoAtendimento || '')
      },
      pagamento: {
        formas: forms,
        precisaTroco: String(raw && raw.pagamento && raw.pagamento.precisaTroco || ''),
        trocoPara: Number(raw && raw.pagamento && raw.pagamento.trocoPara) || 0
      },
      items,
      total: Number(raw && (raw.total || raw.totais && raw.totais.total)) || items.reduce((sum, item) => sum + item.qty * item.price, 0)
    };
  }

  function parseOrdersFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.pedidos)) return payload.pedidos;
    return [];
  }

  function readOpenOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_OPEN) || '[]');
      const list = Array.isArray(raw) ? raw : [];
      return list.map(normalizeOrder);
    } catch (_) {
      return [];
    }
  }

  function readSharedOnlineOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_ONLINE_SHARED) || '[]');
      const list = Array.isArray(raw) ? raw : [];
      return list.map((item) => normalizeOrder({ ...item, origem: 'online' }));
    } catch (_) {
      return [];
    }
  }

  function saveOpenOrders() {
    localStorage.setItem(STORAGE_OPEN, JSON.stringify(state.openOrders));
    localStorage.setItem(STORAGE_EVENT, String(Date.now()));
  }

  function readSales() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_SALES) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  }

  function saveSales() {
    localStorage.setItem(STORAGE_SALES, JSON.stringify(state.sales));
  }

  function updateFinanceToday() {
    const today = currentDateKey();
    const total = state.sales
      .filter((sale) => String(sale.finalizadoEm || '').startsWith(today))
      .reduce((sum, sale) => sum + Number(sale.total || sale.totais && sale.totais.total || 0), 0);
    localStorage.setItem(STORAGE_FIN, JSON.stringify({ dia: today, faturadoHoje: total }));
    return total;
  }

  async function loadCatalog() {
    const response = await fetch('produtos.json', { cache: 'no-store' });
    const data = await response.json();
    const produtos = Array.isArray(data && data.produtos) ? data.produtos : [];
    state.config = { ...state.config, ...(data && data.config ? data.config : {}) };
    state.produtos = produtos
      .filter((item) => item && item.ativo !== false)
      .map((item) => ({
        id: String(item.id || `p_${Date.now()}_${Math.random()}`),
        nome: String(item.nome || 'Produto'),
        categoria: String(item.categoria || 'Diversos'),
        preco: Number(item.preco) || 0
      }))
      .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
    const categorias = Array.from(new Set(state.produtos.map((item) => item.categoria)));
    state.categorias = ['Todos', ...categorias];
    if (!state.categorias.includes(state.categoriaAtiva)) state.categoriaAtiva = 'Todos';
  }

  function getActiveOrder() {
    return state.openOrders.find((order) => order.id === state.activeOrderId) || null;
  }

  function setActiveOrder(orderId) {
    state.activeOrderId = String(orderId || '');
    renderAll();
  }

  function createOrder(origem, identificacao, extra) {
    const order = normalizeOrder({
      id: `${origem}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      number: Math.floor(Date.now() / 1000),
      origem,
      identificacao,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'novo',
      customer: extra && extra.customer ? extra.customer : { nome: identificacao },
      items: [],
      pagamento: { formas: [], precisaTroco: '', trocoPara: 0 }
    });
    state.openOrders.unshift(order);
    saveOpenOrders();
    return order;
  }

  function ensureOrderForSale() {
    const current = getActiveOrder();
    if (current) return current;
    const created = createOrder('balcao', 'Balcao', {});
    setActiveOrder(created.id);
    toast('Nova comanda de balcao criada automaticamente.');
    return created;
  }

  function mergeIncomingOnlineOrders(incomingList) {
    let added = 0;
    const existing = new Set(state.openOrders.map((order) => order.id));
    incomingList.forEach((raw) => {
      const normalized = normalizeOrder({ ...raw, origem: 'online' });
      if (!existing.has(normalized.id)) {
        state.openOrders.unshift(normalized);
        existing.add(normalized.id);
        added += 1;
      }
    });
    if (added > 0) {
      saveOpenOrders();
      beep();
      toast(`${added} novo(s) pedido(s) online recebido(s).`);
      renderAll();
    }
  }

  function recalcOrder(order) {
    order.total = orderTotal(order);
    order.updatedAt = new Date().toISOString();
  }

  function addItemToActive(name, price) {
    const order = ensureOrderForSale();
    if (!order) return;
    const existing = order.items.find((item) => item.name === name && Number(item.price) === Number(price));
    if (existing) existing.qty += 1;
    else order.items.push({ name: String(name), qty: 1, price: Number(price) || 0 });
    recalcOrder(order);
    saveOpenOrders();
    renderAll();
  }

  function removeOrderItem(index, op) {
    const order = getActiveOrder();
    if (!order) return;
    const item = order.items[index];
    if (!item) return;
    if (op === 'plus') item.qty += 1;
    if (op === 'minus') item.qty = Math.max(1, item.qty - 1);
    if (op === 'remove') order.items.splice(index, 1);
    recalcOrder(order);
    saveOpenOrders();
    renderAll();
  }

  function selectedPayments() {
    return refs.paymentOptions.filter((input) => input.checked).map((input) => input.value).slice(0, 2);
  }

  function applyPaymentToOrder() {
    const order = getActiveOrder();
    if (!order) return;
    const formas = selectedPayments();
    refs.paymentOptions.forEach((input, index) => {
      input.checked = formas.includes(input.value) && index < 2;
    });
    order.pagamento.formas = formas;
    order.pagamento.precisaTroco = refs.cashNeed.value;
    order.pagamento.trocoPara = Number(refs.cashValue.value) || 0;
    refs.cashBox.classList.toggle('hidden', !formas.includes('Dinheiro'));
    updateTrocoText();
    saveOpenOrders();
  }

  function updateTrocoText() {
    const order = getActiveOrder();
    if (!order) {
      refs.cashText.textContent = '';
      return;
    }
    if (!order.pagamento.formas.includes('Dinheiro')) {
      refs.cashText.textContent = '';
      return;
    }
    if (order.pagamento.precisaTroco === 'sim' && order.pagamento.trocoPara > 0) {
      const troco = Math.max(0, order.pagamento.trocoPara - order.total);
      refs.cashText.textContent = `Troco estimado: ${formatMoney(troco)}`;
      return;
    }
    if (order.pagamento.precisaTroco === 'nao') {
      refs.cashText.textContent = 'Cliente nao precisa de troco.';
      return;
    }
    refs.cashText.textContent = 'Informe se precisa de troco.';
  }

  function validateFinish(order) {
    if (!order) {
      toast('Selecione uma comanda para finalizar.', true);
      return false;
    }
    if (!order.items.length) {
      toast('Adicione ao menos 1 item na comanda.', true);
      return false;
    }
    if (!order.pagamento.formas.length) {
      toast('Selecione ao menos uma forma de pagamento.', true);
      return false;
    }
    if (order.pagamento.formas.length > 2) {
      toast('Use no maximo 2 formas de pagamento.', true);
      return false;
    }
    if (order.pagamento.formas.includes('Dinheiro')) {
      if (!order.pagamento.precisaTroco) {
        toast('Informe se o cliente precisa de troco.', true);
        return false;
      }
      if (order.pagamento.precisaTroco === 'sim' && order.pagamento.trocoPara <= 0) {
        toast('Informe o valor de troco para dinheiro.', true);
        return false;
      }
    }
    return true;
  }

  function persistSale(order) {
    const finalizadoEm = new Date().toISOString();
    const sale = {
      id: order.id,
      origem: order.origem,
      criadoEm: order.createdAt,
      finalizadoEm,
      cliente: {
        nome: order.identificacao,
        endereco: order.customer.endereco || '',
        referencia: order.customer.referencia || ''
      },
      pagamento: { ...order.pagamento },
      itens: order.items.map((item) => ({ nome: item.name, quantidade: item.qty, valor: item.price })),
      totais: {
        subtotal: order.total,
        entrega: 0,
        total: order.total
      },
      total: order.total
    };
    state.sales.push(sale);
    saveSales();
    updateFinanceToday();
  }

  function finishOrder() {
    const order = getActiveOrder();
    if (!validateFinish(order)) return;
    persistSale(order);
    state.openOrders = state.openOrders.filter((item) => item.id !== order.id);
    saveOpenOrders();
    setActiveOrder('');
    toast('Comanda finalizada com sucesso.');
    renderAll();
  }

  function renameOrder() {
    const order = getActiveOrder();
    if (!order) {
      toast('Selecione uma comanda para renomear.', true);
      return;
    }
    const novoNome = prompt('Novo nome da comanda:', order.identificacao);
    if (!novoNome) return;
    order.identificacao = String(novoNome).trim() || order.identificacao;
    order.customer.nome = order.identificacao;
    saveOpenOrders();
    renderAll();
  }

  function setOrderStatus(orderId, status) {
    const order = state.openOrders.find((item) => item.id === orderId);
    if (!order) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveOpenOrders();
    renderAll();
  }

  function printOrder(order) {
    if (!order) {
      toast('Selecione uma comanda para imprimir.', true);
      return;
    }
    if (!order.items.length) {
      toast('Comanda vazia para impressao.', true);
      return;
    }
    const total = order.total;
    const formas = order.pagamento.formas.length ? order.pagamento.formas.join(' + ') : 'Nao informado';
    const trocoLinha = order.pagamento.formas.includes('Dinheiro')
      ? `<p>Troco: ${order.pagamento.precisaTroco === 'sim' ? `sim, para ${formatMoney(order.pagamento.trocoPara)}` : 'nao'}</p>`
      : '';
    const itensHtml = order.items.map((item) => `
      <div class="item-row">
        <div>${item.qty}x ${escapeHtml(item.name)}</div>
        <div>${formatMoney(item.qty * item.price)}</div>
      </div>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Comanda</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:8px;color:#000}
        .logo{text-align:center;margin-bottom:6px}
        .logo img{width:56px;height:56px;object-fit:cover;border-radius:8px}
        h1,h2,p{margin:2px 0;text-align:center}
        h1{font-size:18px} h2{font-size:13px;font-weight:600}
        .line{border-top:1px dashed #111;margin:8px 0}
        .item-row{display:flex;justify-content:space-between;gap:8px;margin:2px 0}
        .meta p{text-align:left}
      </style></head><body>
      <div class="logo"><img src="${escapeHtml(state.config.notaLogoUrl || state.config.appIconeUrl || 'https://i.ibb.co/kgnfg3g3/MH-Logo.png')}" alt="logo"></div>
      <h1>${escapeHtml(state.config.notaTitulo || 'MH LANCHES')}</h1>
      <h2>${escapeHtml(state.config.notaSubtitulo || '')}</h2>
      <p>${escapeHtml(state.config.notaTipo || 'Comanda / Balcao')}</p>
      <div class="line"></div>
      <div class="meta">
        <p>Comanda: ${escapeHtml(order.identificacao)}</p>
        <p>Origem: ${escapeHtml(order.origem)}</p>
        <p>Hora: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      <div class="line"></div>
      ${itensHtml}
      <div class="line"></div>
      <p style="text-align:left"><strong>Total:</strong> ${formatMoney(total)}</p>
      <p style="text-align:left"><strong>Pagamento:</strong> ${escapeHtml(formas)}</p>
      ${trocoLinha}
      <div class="line"></div>
      <p>${escapeHtml(state.config.notaRodape || 'Relatorio Gerencial nao fiscal!')}</p>
      <script>window.print();window.onafterprint=()=>window.close();</script>
      </body></html>`;
    const printWindow = window.open('', '_blank', 'width=360,height=620');
    if (!printWindow) {
      toast('Nao foi possivel abrir janela de impressao.', true);
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function renderModeButtons() {
    refs.modeButtons.forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('border-orange-500', active);
      button.classList.toggle('bg-orange-500/20', active);
      button.classList.toggle('text-orange-200', active);
      button.classList.toggle('border-zinc-700', !active);
    });
    Object.keys(refs.panels).forEach((mode) => {
      refs.panels[mode].classList.toggle('hidden', state.mode !== mode);
    });
  }

  function renderKpis() {
    const totalToday = updateFinanceToday();
    refs.kpiOpen.textContent = String(state.openOrders.length);
    refs.kpiSales.textContent = formatMoney(totalToday);
    refs.kpiOnline.textContent = String(state.openOrders.filter((order) => order.origem === 'online').length);
  }

  function statusClass(status) {
    if (status === 'preparando') return 'border-amber-600/70 bg-amber-500/10 text-amber-200';
    if (status === 'pronto') return 'border-emerald-600/70 bg-emerald-500/10 text-emerald-200';
    return 'border-yellow-600/70 bg-yellow-500/10 text-yellow-200';
  }

  function renderOrderCards(target, list) {
    if (!list.length) {
      target.innerHTML = '<p class="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">Nenhuma comanda nesta fila.</p>';
      return;
    }
    target.innerHTML = list.map((order) => {
      const active = order.id === state.activeOrderId;
      const created = new Date(order.createdAt).toLocaleTimeString('pt-BR');
      return `
        <article class="rounded-xl border ${active ? 'border-orange-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-950'} p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-bold">${escapeHtml(order.identificacao)}</p>
              <p class="text-[11px] text-zinc-400">#${order.number} • ${created}</p>
            </div>
            <span class="rounded-md border px-2 py-1 text-[11px] font-semibold ${statusClass(order.status)}">${escapeHtml(order.status.toUpperCase())}</span>
          </div>
          <p class="mt-2 text-base font-black">${formatMoney(order.total)}</p>
          <div class="mt-2 flex flex-wrap gap-2 text-xs">
            <button data-act="select" data-id="${order.id}" class="rounded-md border border-zinc-600 px-2 py-1 hover:border-zinc-400">Abrir</button>
            <button data-act="status" data-id="${order.id}" data-status="preparando" class="rounded-md border border-amber-700 px-2 py-1 text-amber-200">Preparando</button>
            <button data-act="status" data-id="${order.id}" data-status="pronto" class="rounded-md border border-emerald-700 px-2 py-1 text-emerald-200">Pronto</button>
          </div>
        </article>`;
    }).join('');
  }

  function renderOnline() {
    const online = state.openOrders.filter((order) => order.origem === 'online');
    renderOrderCards(refs.onlineList, online);
  }

  function renderMesas() {
    const mesaNames = Array.from({ length: 12 }, (_, idx) => `Mesa ${idx + 1}`);
    refs.mesaButtons.innerHTML = mesaNames.map((name) => {
      const exists = state.openOrders.find((order) => order.origem === 'mesa' && order.identificacao.toLowerCase() === name.toLowerCase());
      return `<button data-mesa="${name}" class="rounded-lg border ${exists ? 'border-orange-500 bg-orange-500/15 text-orange-200' : 'border-zinc-700 bg-zinc-950'} px-3 py-2 text-sm font-semibold hover:border-zinc-500">${name}</button>`;
    }).join('');
    const mesas = state.openOrders.filter((order) => order.origem === 'mesa');
    renderOrderCards(refs.mesaOrders, mesas);
  }

  function renderBalcao() {
    const balcao = state.openOrders.filter((order) => order.origem === 'balcao');
    renderOrderCards(refs.balcaoOrders, balcao);
  }

  function renderCatalog() {
    refs.catalogTabs.innerHTML = state.categorias.map((cat) => {
      const active = cat === state.categoriaAtiva;
      return `<button data-cat="${escapeHtml(cat)}" class="rounded-lg border px-3 py-2 text-xs font-semibold ${active ? 'border-orange-500 bg-orange-500/20 text-orange-200' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}">${escapeHtml(cat)}</button>`;
    }).join('');
    const products = state.produtos.filter((item) => state.categoriaAtiva === 'Todos' || item.categoria === state.categoriaAtiva);
    refs.catalogGrid.innerHTML = products.map((item) => `
      <button data-product-id="${item.id}" class="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-left hover:border-orange-400">
        <p class="text-sm font-semibold">${escapeHtml(item.nome)}</p>
        <p class="mt-1 text-xs text-zinc-400">${escapeHtml(item.categoria)}</p>
        <p class="mt-2 text-sm font-bold text-orange-300">${formatMoney(item.preco)}</p>
      </button>
    `).join('');
  }

  function renderCommand() {
    const order = getActiveOrder();
    if (!order) {
      refs.orderActiveLabel.textContent = 'Sem comanda selecionada.';
      refs.commandItems.innerHTML = '<p class="text-xs text-zinc-400">Clique em uma comanda ou em produto para iniciar uma venda de balcao.</p>';
      refs.commandTotal.textContent = 'Total: R$ 0,00';
      refs.paymentOptions.forEach((input) => { input.checked = false; });
      refs.cashBox.classList.add('hidden');
      refs.cashNeed.value = '';
      refs.cashValue.value = '';
      refs.cashText.textContent = '';
      return;
    }
    refs.orderActiveLabel.textContent = `${order.identificacao} • ${order.origem.toUpperCase()}`;
    refs.commandItems.innerHTML = order.items.length
      ? order.items.map((item, index) => `
        <div class="mb-2 flex items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-2">
          <div>
            <p class="font-semibold">${item.qty}x ${escapeHtml(item.name)}</p>
            <p class="text-xs text-zinc-400">${formatMoney(item.price)} cada</p>
          </div>
          <div class="flex gap-1 text-xs">
            <button data-item="minus" data-index="${index}" class="rounded border border-zinc-600 px-2 py-1">-</button>
            <button data-item="plus" data-index="${index}" class="rounded border border-zinc-600 px-2 py-1">+</button>
            <button data-item="remove" data-index="${index}" class="rounded border border-rose-700 px-2 py-1 text-rose-200">x</button>
          </div>
        </div>
      `).join('')
      : '<p class="text-xs text-zinc-400">Comanda sem itens.</p>';

    refs.commandTotal.textContent = `Total: ${formatMoney(order.total)}`;
    refs.paymentOptions.forEach((input) => {
      input.checked = order.pagamento.formas.includes(input.value);
    });
    refs.cashBox.classList.toggle('hidden', !order.pagamento.formas.includes('Dinheiro'));
    refs.cashNeed.value = order.pagamento.precisaTroco || '';
    refs.cashValue.value = order.pagamento.trocoPara || '';
    updateTrocoText();
  }

  function renderReport() {
    const today = currentDateKey();
    const todaySales = state.sales.filter((sale) => String(sale.finalizadoEm || '').startsWith(today));
    refs.reportToday.textContent = `${todaySales.length} venda(s) hoje • ${formatMoney(todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0))}`;
    refs.reportList.innerHTML = todaySales.slice(-8).reverse().map((sale) => `
      <div class="rounded-md border border-zinc-700 bg-zinc-900 p-2">
        <p class="font-semibold">${escapeHtml(sale.cliente && sale.cliente.nome || sale.origem || 'Venda')}</p>
        <p class="text-zinc-400">${new Date(sale.finalizadoEm).toLocaleTimeString('pt-BR')} • ${escapeHtml(sale.origem || '')}</p>
        <p class="font-bold text-orange-300">${formatMoney(sale.total || sale.totais && sale.totais.total)}</p>
      </div>
    `).join('') || '<p class="text-zinc-400">Sem vendas registradas hoje.</p>';
  }

  function renderAll() {
    renderModeButtons();
    renderKpis();
    renderOnline();
    renderMesas();
    renderBalcao();
    renderCatalog();
    renderCommand();
    renderReport();
  }

  function bindDynamicActions() {
    app.addEventListener('click', (event) => {
      const modeBtn = event.target.closest('[data-mode]');
      if (modeBtn) {
        state.mode = modeBtn.dataset.mode;
        renderAll();
        return;
      }

      const cardAction = event.target.closest('[data-act]');
      if (cardAction) {
        const id = cardAction.dataset.id;
        const act = cardAction.dataset.act;
        if (act === 'select') setActiveOrder(id);
        if (act === 'status') setOrderStatus(id, cardAction.dataset.status);
        return;
      }

      const mesaBtn = event.target.closest('[data-mesa]');
      if (mesaBtn) {
        const nome = mesaBtn.dataset.mesa;
        let mesa = state.openOrders.find((order) => order.origem === 'mesa' && order.identificacao.toLowerCase() === String(nome).toLowerCase());
        if (!mesa) mesa = createOrder('mesa', nome, {});
        setActiveOrder(mesa.id);
        state.mode = 'mesas';
        renderAll();
        return;
      }

      const catBtn = event.target.closest('[data-cat]');
      if (catBtn) {
        state.categoriaAtiva = catBtn.dataset.cat;
        renderCatalog();
        return;
      }

      const productBtn = event.target.closest('[data-product-id]');
      if (productBtn) {
        const product = state.produtos.find((item) => item.id === productBtn.dataset.productId);
        if (!product) return;
        addItemToActive(product.nome, product.preco);
        return;
      }

      const itemBtn = event.target.closest('[data-item]');
      if (itemBtn) {
        removeOrderItem(Number(itemBtn.dataset.index), itemBtn.dataset.item);
      }
    });

    refs.customItemAdd.addEventListener('click', () => {
      const name = String(refs.customItemName.value || '').trim();
      const price = Number(refs.customItemPrice.value || 0);
      if (!name || price <= 0) {
        toast('Informe nome e valor valido no item DIVERSOS.', true);
        return;
      }
      addItemToActive(name, price);
      refs.customItemName.value = '';
      refs.customItemPrice.value = '';
    });

    refs.mesaOpenCustom.addEventListener('click', () => {
      const label = String(refs.mesaCustomName.value || '').trim();
      if (!label) {
        toast('Informe um nome para abrir a comanda.', true);
        return;
      }
      const exists = state.openOrders.find((item) => item.origem === 'mesa' && item.identificacao.toLowerCase() === label.toLowerCase());
      const order = exists || createOrder('mesa', label, {});
      refs.mesaCustomName.value = '';
      setActiveOrder(order.id);
      state.mode = 'mesas';
      renderAll();
    });

    refs.balcaoNew.addEventListener('click', () => {
      const order = createOrder('balcao', `Balcao ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, {});
      state.mode = 'balcao';
      setActiveOrder(order.id);
      renderAll();
    });

    refs.paymentOptions.forEach((input) => {
      input.addEventListener('change', () => {
        if (selectedPayments().length > 2) {
          input.checked = false;
          toast('Use no maximo 2 formas de pagamento.', true);
          return;
        }
        applyPaymentToOrder();
      });
    });
    refs.cashNeed.addEventListener('change', applyPaymentToOrder);
    refs.cashValue.addEventListener('input', applyPaymentToOrder);
    refs.renameCommand.addEventListener('click', renameOrder);
    refs.printCommand.addEventListener('click', () => printOrder(getActiveOrder()));
    refs.finishCommand.addEventListener('click', finishOrder);
  }

  function syncFromStorage() {
    state.openOrders = readOpenOrders();
    const activeExists = state.openOrders.some((item) => item.id === state.activeOrderId);
    if (!activeExists) state.activeOrderId = '';
    renderAll();
  }

  function syncSharedOnlineIntoPdv() {
    const shared = readSharedOnlineOrders();
    if (!shared.length) return;
    mergeIncomingOnlineOrders(shared);
  }

  // BANCO DE DADOS NA NUVEM: Lê os pedidos de um Cloud JSON/REST API para sincronizar em qualquer PC ou Celular
  async function pollRemoteOrders() {
    try {
      // Endpoint de nuvem (Substituível pelo seu Firebase/Supabase/JSONbin)
      const cloudEndpoint = localStorage.getItem('mh_cloud_db_url') || 'https://65cc0ab0dd51392f.mockapi.io/api/v1/pedidos';
      
      const response = await fetch(`${cloudEndpoint}?ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      
      const data = await response.json();
      if (Array.isArray(data)) {
        const incoming = data.map((raw) => ({ ...raw, origem: 'online' }));
        mergeIncomingOnlineOrders(incoming);
      }
    } catch (_) {}
  }

  function bindRealtime() {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_OPEN || event.key === STORAGE_EVENT) {
        syncFromStorage();
        return;
      }
      if (event.key === STORAGE_ONLINE_SHARED || event.key === STORAGE_ONLINE_SHARED_EVENT) {
        syncSharedOnlineIntoPdv();
      }
    });
    if ('BroadcastChannel' in window) {
      state.channel = new BroadcastChannel(CHANNEL_NAME);
      state.channel.onmessage = (event) => {
        const payload = event && event.data;
        if (!payload) return;
        if (payload.tipo === 'novo_pedido' && payload.pedido) {
          mergeIncomingOnlineOrders([payload.pedido]);
        }
      };
    }
    setInterval(syncFromStorage, 5000);
    setInterval(syncSharedOnlineIntoPdv, 5000);
    setInterval(pollRemoteOrders, 12000);
  }

  function startClock() {
    const renderClock = () => {
      refs.clock.textContent = new Date().toLocaleTimeString('pt-BR');
    };
    renderClock();
    setInterval(renderClock, 1000);
  }

  async function init() {
    startClock();
    state.openOrders = readOpenOrders();
    syncSharedOnlineIntoPdv();
    state.sales = readSales();
    await loadCatalog();
    bindDynamicActions();
    bindRealtime();
    renderAll();
    pollRemoteOrders();
  }

  init().catch((error) => {
    console.error(error);
    toast('Falha ao iniciar o PDV.', true);
  });
})();
