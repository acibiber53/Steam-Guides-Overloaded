(function() {
  'use strict';

  // =====================================================
  // STORE PAGE: Inject "Create Guide" Button
  // =====================================================
  function injectStoreGuideButton() {
    // 1. Extract AppID from URL
    const urlMatch = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!urlMatch) return;
    const appId = urlMatch[1];

    // 2. Find the right-panel container holding "Community Hub"
    const container = document.querySelector('.apphub_OtherSiteInfo');
    if (!container) return;

    // 3. Prevent duplicate injection
    if (document.getElementById('sge-create-guide-btn')) return;

    // 4. Create native-styled button
    const btn = document.createElement('a');
    btn.href = `https://steamcommunity.com/app/${appId}/guides/`;
    btn.className = 'btnv6_blue_hoverfade btn_medium';
    btn.id = 'sge-create-guide-btn';
    btn.style.marginLeft = '8px';
    btn.innerHTML = '<span>Create Guide</span>';

    // 5. Insert next to Community Hub
    container.appendChild(btn);
  }

  // Steam loads elements dynamically → use MutationObserver
  const storeObserver = new MutationObserver((mutations, obs) => {
    if (document.querySelector('.apphub_OtherSiteInfo')) {
      injectStoreGuideButton();
      obs.disconnect(); // Stop observing once injected
    }
  });

  // Start observing immediately
  storeObserver.observe(document.body, { childList: true, subtree: true });

  // Fallback in case DOM is already ready before observer attaches
  setTimeout(injectStoreGuideButton, 1500);

  // =====================================================
  // GUIDE EDITOR: Placeholder for Phase 2 (Char Counter)
  // =====================================================
  console.log('[Steam Guides Overloaded] Content script active.');
})();