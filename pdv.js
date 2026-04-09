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

  window.MHPdv = {
    formatMoney,
    nowLabel
  };
})();