(function() {
  'use strict';

  // =====================================================
  // STORE PAGE: Inject "Create Guide" Button (BEFORE Community Hub)
  // =====================================================
  function injectStoreGuideButton() {
    // 1. Extract AppID from URL
    const urlMatch = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!urlMatch) return;
    const appId = urlMatch[1];

    // 2. Find the container AND the Community Hub button specifically
    const container = document.querySelector('.apphub_OtherSiteInfo');
    const communityHubBtn = container?.querySelector('a[href*="/app/"][href*="/home"]');
    
    if (!container || !communityHubBtn) return;

    // 3. Prevent duplicate injection
    if (document.getElementById('sge-create-guide-btn')) return;

    // 4. Create native-styled button
    const btn = document.createElement('a');
    btn.href = `https://steamcommunity.com/sharedfiles/editguide/?appid=${appId}`;
    btn.className = 'btnv6_blue_hoverfade btn_medium';
    btn.id = 'sge-create-guide-btn';
    btn.style.marginRight = '8px'; // Space between our button and Community Hub
    btn.innerHTML = '<span>Create Guide</span>';

    // 5. Insert BEFORE Community Hub button (preserves expected layout)
    container.insertBefore(btn, communityHubBtn);
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