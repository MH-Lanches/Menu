/* Cliente: utilitarios leves desacoplados do index.html */
(function () {
  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function announceReady() {
    document.documentElement.setAttribute('data-mh-client-ready', 'true');
  }

  window.MHClient = {
    isMobile,
    announceReady
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', announceReady, { once: true });
  } else {
    announceReady();
  }
})();