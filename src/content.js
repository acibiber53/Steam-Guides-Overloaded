// src/content.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:Router]', msg);

  function getRoute() {
    const url = window.location.href;
    if (/store\.steampowered\.com\/app\//.test(url)) return 'store';
    if (/steamcommunity\.com\/sharedfiles\/editguidesubsection/.test(url)) return 'editguidesubsection';
    if (/steamcommunity\.com\/sharedfiles\/editguide/.test(url)) return 'editguide';
    if (/steamcommunity\.com\/sharedfiles\/manageguide/.test(url)) return 'manageguide';
    return 'unknown';
  }

  function init() {
    const route = getRoute();
    LOG(`🗺️ Route detected: ${route}`);

    switch (route) {
      case 'store':
        if (window.SGO?.initStoreButton) window.SGO.initStoreButton();
        break;
      case 'editguide':
        if (window.SGO?.initEditGuide) window.SGO.initEditGuide();
        break;
      case 'manageguide':
        if (window.SGO?.initManageGuide) window.SGO.initManageGuide();
        break;
      case 'editguidesubsection':
        if (window.SGO?.initEditSubsection) window.SGO.initEditSubsection();
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