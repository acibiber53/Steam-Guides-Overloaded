(function() {
  'use strict';
  const LOG = msg => console.log('[Steam Guides Overloaded]', msg);

  function injectStoreGuideButton() {
    LOG('injectStoreGuideButton() called');

    // 1. Extract AppID
    const urlMatch = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!urlMatch) return LOG('❌ No AppID in URL');
    const appId = urlMatch[1];

    // 2. Find container
    const container = document.querySelector('.apphub_OtherSiteInfo');
    if (!container) return LOG('❌ Container .apphub_OtherSiteInfo not found');
    if (document.getElementById('sge-create-guide-btn')) return LOG('⚠️ Button already injected');

    // 3. Find Community Hub button (robust 2-step fallback)
    let targetBtn = container.querySelector('a'); // Usually the only link in this container
    if (!targetBtn || !targetBtn.textContent.includes('Community Hub')) {
      // Fallback: explicitly search by visible text
      const links = Array.from(container.querySelectorAll('a'));
      targetBtn = links.find(a => a.textContent.trim().includes('Community Hub'));
    }

    if (!targetBtn) {
      LOG('❌ Community Hub button not found. Container HTML:', container.innerHTML.trim());
      return;
    }
    LOG('✓ Target found:', targetBtn.textContent.trim());

    // 4. Create "Create Guide" button
    const btn = document.createElement('a');
    btn.href = `https://steamcommunity.com/sharedfiles/editguide/?appid=${appId}`;
    btn.className = 'btnv6_blue_hoverfade btn_medium';
    btn.id = 'sge-create-guide-btn';
    btn.style.marginRight = '8px'; // Keep spacing consistent
    btn.innerHTML = '<span>Create Guide</span>';

    // 5. Insert BEFORE Community Hub
    try {
      container.insertBefore(btn, targetBtn);
      LOG('✅ Successfully injected before Community Hub');
    } catch (err) {
      LOG('❌ Insertion failed:', err.message);
    }
  }

  // Steam loads elements dynamically → observe DOM
  const observer = new MutationObserver((mutations, obs) => {
    if (document.querySelector('.apphub_OtherSiteInfo')) {
      injectStoreGuideButton();
      obs.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(injectStoreGuideButton, 1200); // Fallback if already loaded

  LOG('Content script initialized. Watching for store page elements...');
})();