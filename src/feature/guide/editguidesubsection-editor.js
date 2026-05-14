// src/features/guide/editguidesubsection-editor.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:EditSubsection]', msg);

  // Storage key for guide sections
  const SECTIONS_STORAGE_KEY = 'sgo_guide_sections';

  // Safe DOM Injection
  function injectHelper(selector, config) {
    const field = document.querySelector(selector);
    LOG(`Injecting helper for ${selector}`);
    if (!field) {
      LOG(`Field not found for selector: ${selector}`);
      return;
    }
    if (field.dataset.sgoHelperInjected) {
      LOG(`Helper already injected for ${selector}`);
      return;
    }
    field.dataset.sgoHelperInjected = 'true';
    LOG(`Found field: ${field.tagName}#${field.id || field.name || 'unnamed'}`);

    const helper = document.createElement('div');
    helper.className = 'sgo-field-helper sgo-counter-ok'; // Default to green
    helper.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; background: rgba(40,167,69,0.1); border: 1px solid #28a745;';
    helper.innerHTML = config.html || '';
    LOG(`Created helper element with content: ${config.html}`);

    if (field.parentNode) {
      field.parentNode.insertBefore(helper, field.nextSibling);
      LOG(`Helper inserted after field in DOM`);
    } else {
      LOG(`Field has no parent node`);
    }

    if (config.onMount) {
      LOG(`Calling onMount callback`);
      config.onMount(field, helper);
    }
    
    LOG(`Helper injected for ${selector}`);
  }

  // Character Counter with Thresholds
  function createCounter(maxLen, warningPct = 0.75, criticalPct = 0.9) {
    return (field, helper) => {
      LOG(`Creating counter for ${maxLen} chars`);
      const countEl = document.createElement('span');
      countEl.className = 'sgo-counter sgo-counter-ok';
      countEl.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; color: #fff; background: #28a745; padding: 2px 5px; font-weight: bold; border-radius: 3px; margin-left: 8px;';
      countEl.textContent = `0/${maxLen}`;
      helper.appendChild(countEl);
      LOG(`Counter element created: ${countEl.textContent}`);

      const update = () => {
        const len = field.value.length;
        countEl.textContent = `${len}/${maxLen}`;
        const pct = len / maxLen;
        
        // Determine status class and colors based on percentage
        let statusClass = 'sgo-counter-ok';
        let bgColor = '#28a745'; // Green
        let textColor = '#fff';
        
        if (pct >= criticalPct) {
          statusClass = 'sgo-counter-critical';
          bgColor = '#dc3545'; // Red for critical (>90%)
        } else if (pct >= warningPct) {
          statusClass = 'sgo-counter-warning';
          bgColor = '#ffc107'; // Yellow for warning (75-90%)
          textColor = '#000'; // Black text for better contrast on yellow
        }
        
        // Update counter styles
        countEl.style.background = bgColor;
        countEl.style.color = textColor;
        countEl.className = `sgo-counter ${statusClass}`;
        
        // Update helper container styles to match
        if (helper) {
          helper.className = `sgo-field-helper ${statusClass}`;
          helper.style.background = `rgba(${pct >= criticalPct ? '220,53,69' : pct >= warningPct ? '255,193,7' : '40,167,69'},0.1)`;
          helper.style.borderColor = bgColor;
        }
      };

      field.addEventListener('input', update);
      update();
      LOG(`Counter initialized and update() called`);
    };
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);
  }

  // Section List Panel - Shows chapters/sections from manageguide page
  function createSectionListPanel() {
    return (field, helper) => {
      LOG('Creating section list panel');
      
      const sectionListContainer = document.createElement('div');
      sectionListContainer.className = 'sgo-section-list-panel';
      sectionListContainer.innerHTML = `
        <div class="sgo-section-list-header">
          <span class="sgo-section-list-title">📑 Guide Sections</span>
          <button type="button" class="sgo-section-list-toggle" title="Toggle section list">▼</button>
        </div>
        <div class="sgo-section-list-content">
          <div class="sgo-section-list-loading">Loading sections...</div>
        </div>
      `;

      helper.appendChild(sectionListContainer);

      // Toggle functionality
      const toggleBtn = sectionListContainer.querySelector('.sgo-section-list-toggle');
      const contentDiv = sectionListContainer.querySelector('.sgo-section-list-content');
      
      toggleBtn.addEventListener('click', () => {
        contentDiv.classList.toggle('collapsed');
        toggleBtn.textContent = contentDiv.classList.contains('collapsed') ? '▶' : '▼';
      });

      // Load sections from localStorage
      loadSections(contentDiv);

      LOG('Section list panel created');
    };
  }

  // Load sections from localStorage and display them
  function loadSections(container) {
    try {
      const stored = localStorage.getItem(SECTIONS_STORAGE_KEY);
      if (!stored) {
        container.innerHTML = '<div class="sgo-section-list-empty">No sections found. Visit the manage guide page first.</div>';
        return;
      }

      const data = JSON.parse(stored);
      const sections = data.sections || [];

      if (sections.length === 0) {
        container.innerHTML = '<div class="sgo-section-list-empty">No sections available.</div>';
        return;
      }

      // Sort by order
      sections.sort((a, b) => a.order - b.order);

      const listHtml = sections.map((section, index) => `
        <div class="sgo-section-list-item" data-section-id="${section.id}" title="${section.title}">
          <span class="sgo-section-number">${index + 1}.</span>
          <span class="sgo-section-title">${escapeHtml(section.title)}</span>
        </div>
      `).join('');

      container.innerHTML = `<div class="sgo-section-list">${listHtml}</div>`;

      // Add click handlers to navigate to sections (if possible)
      container.querySelectorAll('.sgo-section-list-item').forEach(item => {
        item.addEventListener('click', () => {
          const sectionId = item.dataset.sectionId;
          LOG(`Section clicked: ${sectionId}`);
          // In the future, this could navigate to the section or highlight it
          // For now, just copy the section title to clipboard or show info
          const title = item.querySelector('.sgo-section-title').textContent;
          navigator.clipboard.writeText(title).then(() => {
            LOG(`Copied section title to clipboard: ${title}`);
            // Show temporary feedback
            item.classList.add('sgo-section-copied');
            setTimeout(() => item.classList.remove('sgo-section-copied'), 1000);
          }).catch(err => {
            LOG('Failed to copy to clipboard:', err);
          });
        });
      });

      LOG(`Loaded ${sections.length} sections`);
    } catch (e) {
      LOG('Error loading sections:', e);
      container.innerHTML = '<div class="sgo-section-list-error">Error loading sections.</div>';
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Main Initialization
  function setupEditSubsection() {
    LOG('Initializing editguidesubsection helpers (Section Content Editor)...');
    
    // No need to find form first - just look for the fields directly
    LOG(`Looking for title field: #title, input[name="title"], .editGuideSubSectionTitleField`);
    LOG(`Looking for content field: #description, textarea[name="description"], .editGuideSubSectionDescField`);

    // Section Title Counter + Section List Panel
    const titleSelector = '#title, input[name="title"], .editGuideSubSectionTitleField';
    const titleField = document.querySelector(titleSelector);
    if (titleField) {
      LOG(`Found title field: ${titleField.tagName}#${titleField.id || titleField.name || 'unnamed'}`);
      injectHelper(titleSelector, {
        html: '<span class="sgo-helper-label">Section Title</span>',
        onMount: (field, helper) => {
          LOG('Mounting title helpers (counter + section list)');
          createCounter(128)(field, helper);
          createSectionListPanel()(field, helper);
        }
      });
    } else {
      LOG(`Title field not found`);
    }

    // Section Body Counter + Template Button (BBCode Toolbar provided by Steam)
    const bodySelector = '#description, textarea[name="description"], .editGuideSubSectionDescField';
    const bodyField = document.querySelector(bodySelector);
    if (bodyField) {
      LOG(`Found body field: ${bodyField.tagName}#${bodyField.id || bodyField.name || 'unnamed'}`);
      injectHelper(bodySelector, {
        html: '<span class="sgo-helper-label">Section Content</span>',
        onMount: (field, helper) => {
          LOG(`Mounting body helpers (counter + achievement sidepanel)`);
          createCounter(8000)(field, helper);
          if (window.SGO?.AchievementPanel?.initPanel) {
            window.SGO.AchievementPanel.initPanel(field);
          }
        }
      });
    } else {
      LOG(`Body field not found`);
    }

    LOG('EditSubsection helpers active');
    return true;
  }

  // Expose to router
  window.SGO = window.SGO || {};
  window.SGO.insertAtCursor = insertAtCursor;
  window.SGO.initEditSubsection = function() {
    const observer = new MutationObserver((mutations, obs) => {
      if (setupEditSubsection()) obs.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => setupEditSubsection(), 1500); // Fallback if DOM loads fast
  };
})();
