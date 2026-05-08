// src/features/guide/manageguide-sections.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:ManageGuide]', msg);

  // 🚀 Main Initialization
  function setupManageGuide() {
    LOG('🔍 Initializing manageguide helpers (Guide Sections Management)...');
    
    // Look for section management UI elements
    const sectionList = document.querySelector('.guide_sections_list, #sectionContainer');
    if (!sectionList) {
      LOG('⚠️ Section list container not found yet, waiting...');
      return false;
    }

    // Add helper UI for section management
    const helper = document.createElement('div');
    helper.className = 'sgo-manage-helper';
    helper.innerHTML = `
      <div class="sgo-manage-tip">
        💡 <b>Tip:</b> Organize your guide with clear sections. Use subsections for detailed steps.
      </div>
    `;
    
    if (sectionList.parentNode) {
      sectionList.parentNode.insertBefore(helper, sectionList);
    }

    LOG('✅ ManageGuide helpers active');
    return true;
  }

  // Expose to router
  window.SGO = window.SGO || {};
  window.SGO.initManageGuide = function() {
    const observer = new MutationObserver((mutations, obs) => {
      if (setupManageGuide()) obs.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => setupManageGuide(), 1500); // Fallback if DOM loads fast
  };
})();
