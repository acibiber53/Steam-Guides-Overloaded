(function() {
  'use strict';
  const EXT_NAME = '[Steam Guides Overloaded]';

  // =====================================================
  // STORE PAGE: Inject "Create Guide" Button (BEFORE Community Hub)
  // =====================================================
  function injectStoreGuideButton() {
    console.log(EXT_NAME, 'injectStoreGuideButton() called');

    // 1. Extract AppID from URL
    const urlMatch = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!urlMatch) {
      console.log(EXT_NAME, '❌ No AppID found in URL:', window.location.href);
      return;
    }
    const appId = urlMatch[1];
    console.log(EXT_NAME, '✓ AppID extracted:', appId);

    // 2. Find the container AND the Community Hub button specifically
    const container = document.querySelector('.apphub_OtherSiteInfo');
    if (!container) {
      console.log(EXT_NAME, '❌ Container .apphub_OtherSiteInfo not found');
      console.log(EXT_NAME, '🔍 Available body children:', Array.from(document.body.children).map(el => el.className || el.tagName).slice(0, 20));
      return;
    }
    console.log(EXT_NAME, '✓ Container found:', container);

    const communityHubBtn = container.querySelector('a[href*="/app/"][href*="/home"]');
    if (!communityHubBtn) {
      console.log(EXT_NAME, '❌ Community Hub button not found inside container');
      console.log(EXT_NAME, '🔍 Container inner HTML (first 500 chars):', container.innerHTML.substring(0, 500));
      console.log(EXT_NAME, '🔍 All links in container:', Array.from(container.querySelectorAll('a')).map(a => ({ href: a.href, text: a.textContent.trim(), className: a.className })));
      return;
    }
    console.log(EXT_NAME, '✓ Community Hub button found:', communityHubBtn);

    // 3. Prevent duplicate injection
    if (document.getElementById('sge-create-guide-btn')) {
      console.log(EXT_NAME, '⚠️ Button already injected, skipping');
      return;
    }

    // 4. Create native-styled button
    const btn = document.createElement('a');
    btn.href = `https://steamcommunity.com/sharedfiles/editguide/?appid=${appId}`;
    btn.className = 'btnv6_blue_hoverfade btn_medium';
    btn.id = 'sge-create-guide-btn';
    btn.style.marginRight = '8px';
    btn.innerHTML = '<span>Create Guide</span>';
    console.log(EXT_NAME, '✓ Button element created');

    // 5. Insert BEFORE Community Hub button
    try {
      container.insertBefore(btn, communityHubBtn);
      console.log(EXT_NAME, '✅ Button successfully injected before Community Hub');
    } catch (err) {
      console.log(EXT_NAME, '❌ Error inserting button:', err);
    }
  }

  // Steam loads elements dynamically → use MutationObserver
  console.log(EXT_NAME, 'Setting up MutationObserver for store page injection...');
  const storeObserver = new MutationObserver((mutations, obs) => {
    console.log(EXT_NAME, 'MutationObserver triggered, checking for container...');
    if (document.querySelector('.apphub_OtherSiteInfo')) {
      console.log(EXT_NAME, 'Container detected, attempting injection...');
      injectStoreGuideButton();
      console.log(EXT_NAME, 'Disconnecting observer after successful detection');
      obs.disconnect();
    }
  });

  // Start observing immediately
  storeObserver.observe(document.body, { childList: true, subtree: true });
  console.log(EXT_NAME, 'MutationObserver started');

  // Fallback in case DOM is already ready before observer attaches
  console.log(EXT_NAME, 'Setting 1500ms fallback timeout');
  setTimeout(() => {
    console.log(EXT_NAME, 'Fallback timeout triggered');
    injectStoreGuideButton();
  }, 1500);

  // =====================================================
  // GUIDE EDITOR: Placeholder for Phase 2 (Char Counter)
  // =====================================================
  console.log(EXT_NAME, 'Content script initialized. Ready for guide editor hooks.');
})();