// src/content.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:Router]', msg);

  function getRoute() {
    const url = window.location.href;
    if (/store\.steampowered\.com\/app\//.test(url)) return 'store';
    if (/steamcommunity\.com\/sharedfiles\/editguide/.test(url)) return 'guide-editor';
    return 'unknown';
  }

  function init() {
    const route = getRoute();
    LOG(`🗺️ Route detected: ${route}`);

    switch (route) {
      case 'store':
        if (window.SGO?.initStoreButton) window.SGO.initStoreButton();
        break;
      case 'guide-editor':
        if (window.SGO?.initGuideEditor) window.SGO.initGuideEditor();
        break;
      default:
        break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();