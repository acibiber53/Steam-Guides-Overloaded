// src/features/guide/manageguide-sections.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:ManageGuide]', msg);

  // Storage key for guide sections
  const SECTIONS_STORAGE_KEY = 'sgo_guide_sections';

  // Main Initialization
  function setupManageGuide() {
    LOG('Initializing manageguide helpers (Guide Sections Management)...');

    // Steam uses an iframe named 'upload_target' for the guide management content
    let sectionList = null;
    let iframeDoc = null;
    
    // Try to find the iframe first
    const iframe = document.querySelector('iframe[name="upload_target"]');
    if (iframe && iframe.contentDocument) {
      try {
        iframeDoc = iframe.contentDocument;
        sectionList = iframeDoc.querySelector('#sortable_sub_sections');
        LOG('Found section list inside iframe: #sortable_sub_sections');
      } catch (e) {
        LOG('Cannot access iframe content (cross-origin or not ready):', e);
        return false;
      }
    }
    
    // Fallback to main document if iframe not found
    if (!sectionList) {
      sectionList = document.querySelector('.guide_sections_list, #sectionContainer, #sortable_sub_sections');
      if (sectionList) {
        LOG('Found section list in main document');
      }
    }

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

    // Insert helper in appropriate location (in iframe doc if available, otherwise main doc)
    const targetDoc = iframeDoc || document;
    const insertTarget = sectionList.parentNode || targetDoc.body;
    if (insertTarget) {
      insertTarget.insertBefore(helper, sectionList);
    }

    // Extract and store section information for use in editguidesubsection page
    extractAndStoreSections(sectionList, iframeDoc);

    LOG('ManageGuide helpers active');
    return true;
  }

  // Extract section names and store them
  function extractAndStoreSections(sectionList, iframeDoc = null) {
    try {
      const sections = [];
      // Steam uses .editGuideTOCSection class for each section item inside #sortable_sub_sections
      const sectionItems = sectionList.querySelectorAll('.editGuideTOCSection');

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
          // Steam uses .editGuideTOCSectionTitle div containing an <a> tag with the section name
          const titleEl = item.querySelector('.editGuideTOCSectionTitle a, .editGuideTOCSectionTitle');
          const title = titleEl ? titleEl.textContent.trim().substring(0, 100) : '';
          
          // Extract section ID from the element's id attribute (e.g., "subSection_8926990")
          const sectionId = item.id.replace('subSection_', '') || `section_${index}`;
          
          if (title && title.length > 0) {
            sections.push({
              id: sectionId,
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
