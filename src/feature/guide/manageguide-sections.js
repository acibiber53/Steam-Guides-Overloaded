// src/features/guide/manageguide-sections.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:ManageGuide]', msg);

  // Storage key for guide sections
  const SECTIONS_STORAGE_KEY = 'sgo_guide_sections';
  const IMAGE_MAP_KEY        = 'sgo_image_map';
  const USER_GUIDES_KEY      = 'sgo_user_guides';

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
    extractAndStoreImageMap();
    saveGuideToList();

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

  // Save current guide info to the user's guide list in localStorage
  function saveGuideToList() {
    try {
      const guideId = new URLSearchParams(window.location.search).get('id');
      if (!guideId) return;
      const titleEl = document.querySelector('.editGuideTitle, h2.title, #title');
      const title   = titleEl ? titleEl.textContent.trim() : 'Guide ' + guideId;
      const appid   = localStorage.getItem('sgo_guide_' + guideId + '_appid') || localStorage.getItem('sgo_game_appid') || null;
      const guides  = JSON.parse(localStorage.getItem(USER_GUIDES_KEY) || '[]');
      const idx     = guides.findIndex(g => g.id === guideId);
      const entry   = { id: guideId, title, appid, updated: Date.now() };
      if (idx >= 0) guides[idx] = { ...guides[idx], ...entry };
      else guides.push(entry);
      localStorage.setItem(USER_GUIDES_KEY, JSON.stringify(guides));
      LOG(`Saved guide to list: ${title} (${guideId})`);
    } catch (e) {
      LOG('Error saving guide to list: ' + e.message);
    }
  }

  // Extract uploaded guide image IDs and build a title→id map
  function extractAndStoreImageMap() {
    try {
      const existing = JSON.parse(localStorage.getItem(IMAGE_MAP_KEY) || '{}');
      const titleToId = existing.titleToId || {};
      const idToTitle = existing.idToTitle || {};
      let found = 0;

      function stemKey(name) {
        return (name || '').replace(/\.[^.]+$/, '').toLowerCase().trim();
      }

      function addMapping(id, filename) {
        const key = stemKey(filename);
        if (key && id && !titleToId[key]) {
          titleToId[key] = id;
          idToTitle[id]  = filename;
          found++;
        }
      }

      // Pattern 1: elements with data-publishedfileid / data-workshopid
      document.querySelectorAll('[data-publishedfileid], [data-workshopid]').forEach(el => {
        const id = el.dataset.publishedfileid || el.dataset.workshopid;
        const filename = el.dataset.filename || el.getAttribute('title') || el.textContent.trim();
        if (id && filename) addMapping(id, filename);
      });

      // Pattern 2: anchor tags to sharedfiles/filedetails with title/text that looks like a filename
      document.querySelectorAll('a[href*="sharedfiles/filedetails"]').forEach(a => {
        const m = a.href.match(/[?&]id=(\d+)/);
        if (!m) return;
        const id = m[1];
        const filename = (a.getAttribute('title') || a.textContent || '').trim();
        if (filename) addMapping(id, filename);
      });

      // Pattern 3: parse any existing [previewimg=...] BBCode in textareas on the page
      document.querySelectorAll('textarea').forEach(ta => {
        const re = /\[previewimg=(\d+);[^\]]*?;([^\]]+?)\]\[\/previewimg\]/g;
        let hit;
        while ((hit = re.exec(ta.value)) !== null) {
          addMapping(hit[1], hit[2].trim());
        }
      });

      if (found > 0) {
        localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify({ titleToId, idToTitle }));
        LOG(`Image map updated: added ${found} mapping(s)`);
      } else {
        LOG('No new image mappings found on manageguide page');
      }
    } catch (e) {
      LOG('Error extracting image map: ' + e.message);
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
