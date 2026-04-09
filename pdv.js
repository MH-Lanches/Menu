/* PDV/Admin: utilitarios compartilhados para tela operacional */
(function () {
  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function nowLabel() {
    return new Date().toLocaleString('pt-BR');
  }

  function extrairPedidos(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.pedidos)) return payload.pedidos;
    return [];
  }

  function assinaturaPedidos(lista) {
    try {
      return JSON.stringify((Array.isArray(lista) ? lista : []).map((pedido) => ({
        id: pedido && pedido.id,
        criadoEm: pedido && pedido.criadoEm,
        total: pedido && pedido.totais && pedido.totais.total,
        status: pedido && pedido.status
      })));
    } catch (_) {
      return '';
    }
  }

  function startPedidosPolling(options) {
    const cfg = {
      url: String(options && options.url || 'pedidos.json'),
      intervalMs: Math.max(10000, Number(options && options.intervalMs) || 15000),
      onUpdate: typeof (options && options.onUpdate) === 'function' ? options.onUpdate : function () {},
      onError: typeof (options && options.onError) === 'function' ? options.onError : function () {}
    };

    let timer = null;
    let ultimaAssinatura = '';

    const tick = async () => {
      try {
        const separador = cfg.url.includes('?') ? '&' : '?';
        const resposta = await fetch(`${cfg.url}${separador}ts=${Date.now()}`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`Falha ao ler ${cfg.url}: ${resposta.status}`);
        const payload = await resposta.json();
        const pedidos = extrairPedidos(payload);
        const assinatura = assinaturaPedidos(pedidos);
        if (assinatura && assinatura !== ultimaAssinatura) {
          ultimaAssinatura = assinatura;
          cfg.onUpdate(pedidos);
        }
      } catch (erro) {
        cfg.onError(erro);
      }
    };

    tick();
    timer = setInterval(tick, cfg.intervalMs);

    return {
      stop() {
        if (timer) clearInterval(timer);
        timer = null;
      },
      refresh() {
        return tick();
      }
    };
  }

  window.MHPdv = {
    formatMoney,
    nowLabel,
    startPedidosPolling
  };
})();