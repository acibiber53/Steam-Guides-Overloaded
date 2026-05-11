// src/features/guide/manageguide-sections.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:ManageGuide]', msg);

  // Storage key for guide sections
  const SECTIONS_STORAGE_KEY = 'sgo_guide_sections';

  // Main Initialization
  function setupManageGuide() {
    LOG('Initializing manageguide helpers (Guide Sections Management)...');

    // Look for section management UI elements
    const sectionList = document.querySelector('.guide_sections_list, #sectionContainer');
    if (!sectionList) {
      LOG('Section list container not found yet, waiting...');
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

    // Extract and store section information for use in editguidesubsection page
    extractAndStoreSections(sectionList);

    LOG('ManageGuide helpers active');
    return true;
  }

  // Extract section names and store them
  function extractAndStoreSections(sectionList) {
    try {
      const sections = [];
      // Try different selectors that Steam might use for section items
      const sectionItems = sectionList.querySelectorAll(
        '.guide_section_item, .section_item, [data-section-id], li.section, div.section'
      );

      if (sectionItems.length === 0) {
        // Fallback: look for any clickable/list items within the section list
        const fallbackItems = sectionList.querySelectorAll('li, div[class*="section"]');
        Array.from(fallbackItems).forEach((item, index) => {
          const title = item.textContent.trim().substring(0, 100);
          if (title && title.length > 0) {
            sections.push({
              id: item.dataset?.sectionId || `section_${index}`,
              title: title,
              order: index
            });
          }
        });
      } else {
        sectionItems.forEach((item, index) => {
          const titleEl = item.querySelector('.section_title, .title, h3, h4, span.title') || item;
          const title = titleEl.textContent.trim().substring(0, 100);
          if (title && title.length > 0) {
            sections.push({
              id: item.dataset?.sectionId || `section_${index}`,
              title: title,
              order: index
            });
          }
        });
      }

      if (sections.length > 0) {
        localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify({
          sections: sections,
          lastUpdated: Date.now(),
          url: window.location.href
        }));
        LOG(`Stored ${sections.length} sections: ${sections.map(s => s.title).join(', ')}`);
      } else {
        LOG('No sections found to store');
      }
    } catch (e) {
      LOG('Error extracting sections:', e);
    }
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
