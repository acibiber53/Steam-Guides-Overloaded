// src/content.js

// Global: bridge pending AppID from sessionStorage to guide/section ID mappings.
// Also extracts AppID from any /app/{id}/ URL (store pages, community hub).
(function() {
  const url    = window.location.href;
  const params = new URLSearchParams(window.location.search);

  // Extract AppID from URL path segment (/app/4197610/) or query param (?appid=4197610)
  const urlAppIdMatch = url.match(/\/app\/(\d+)/) || url.match(/[?&]appid=(\d+)/);
  if (urlAppIdMatch) {
    localStorage.setItem('sgo_game_appid', urlAppIdMatch[1]);
  }

  // On guide pages: bridge sgo_game_appid → sgo_guide_{pageId}_appid
  if (/sharedfiles\/(manageguide|editguidesubsection)/.test(url)) {
    const pageId      = params.get('id');
    const cachedAppId = localStorage.getItem('sgo_game_appid');
    if (pageId && cachedAppId) {
      localStorage.setItem('sgo_guide_' + pageId + '_appid', cachedAppId);
    }
  }

  // Also consume sessionStorage pending (belt-and-suspenders for non-URL entry points)
  const pending = sessionStorage.getItem('sgo_pending_appid');
  if (pending && /sharedfiles\/(editguide|manageguide|editguidesubsection)/.test(url)) {
    const pageId = params.get('id');
    if (pageId) localStorage.setItem('sgo_guide_' + pageId + '_appid', pending);
    localStorage.setItem('sgo_game_appid', pending);
    sessionStorage.removeItem('sgo_pending_appid');
  }
})();

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

  function ensurePanelStack() {
    let stack = document.getElementById('sgo-right-panel-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.id = 'sgo-right-panel-stack';
    document.body.appendChild(stack);
    return stack;
  }

  function closeAllPanels() {
    document.querySelectorAll('.sgo-sidepanel.open').forEach(panel => {
      panel.classList.remove('open');
      const toggle = panel.parentElement?.querySelector('.sgo-sidepanel-toggle');
      toggle?.classList.remove('active');
    });
  }

  window.SGO = window.SGO || {};
  window.SGO.getPanelStack = ensurePanelStack;
  window.SGO.closeAllPanels = closeAllPanels;

  function init() {
    const route = getRoute();
    LOG(`🗺️ Route detected: ${route}`);

    switch (route) {
      case 'store':
        ensurePanelStack();
        window.SGO?.initStoreButton?.();
        window.SGO?.initGuidesPanel?.();
        break;
      case 'editguide':
        ensurePanelStack();
        window.SGO?.initGameProfile?.();
        window.SGO?.initEditGuide?.();
        break;
      case 'manageguide':
        ensurePanelStack();
        window.SGO?.initGameProfile?.();
        window.SGO?.initManageGuide?.();
        break;
      case 'editguidesubsection':
        ensurePanelStack();
        window.SGO?.initGameProfile?.();
        window.SGO?.initEditSubsection?.();
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
