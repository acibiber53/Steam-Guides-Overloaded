// src/store-button.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:StoreButton]', msg);

  function injectStoreGuideButton() {
    const urlMatch = window.location.href.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!urlMatch) return;
    const appId = urlMatch[1];

    const iconImg = document.querySelector('.apphub_AppIcon img');
    if (iconImg?.src) {
      localStorage.setItem('sgo_game_icon_' + appId, iconImg.src);
    }

    const container = document.querySelector('.apphub_OtherSiteInfo');
    if (!container) return;
    if (document.getElementById('sge-create-guide-btn')) return;

    let targetBtn = container.querySelector('a');
    if (!targetBtn || !targetBtn.textContent.includes('Community Hub')) {
      targetBtn = Array.from(container.querySelectorAll('a')).find(a => a.textContent.trim().includes('Community Hub'));
    }
    if (!targetBtn) return;

    const btn = document.createElement('a');
    btn.href = `https://steamcommunity.com/sharedfiles/editguide/?appid=${appId}`;
    btn.className = 'btnv6_blue_hoverfade btn_medium';
    btn.id = 'sge-create-guide-btn';
    btn.style.marginRight = '8px';
    btn.innerHTML = '<span>Create Guide</span>';
    btn.addEventListener('click', () => {
      sessionStorage.setItem('sgo_pending_appid', appId);
    });

    try {
      container.insertBefore(btn, targetBtn);
      LOG('✅ Injected before Community Hub');
    } catch (err) {
      LOG('❌ Injection failed:', err.message);
    }
  }

  // Expose to global scope for the router to call
  window.SGO = window.SGO || {};
  window.SGO.initStoreButton = function() {
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector('.apphub_OtherSiteInfo')) {
        injectStoreGuideButton();
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(injectStoreGuideButton, 1200);
    LOG('👀 Watching for store page elements...');
  };
})();