// src/features/guide/editguidesubsection-editor.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:EditSubsection]', msg);


  // 🔧 Safe DOM Injection
  function injectHelper(selector, config) {
    const field = document.querySelector(selector);
    LOG(`💉 Injecting helper for ${selector}`);
    if (!field) {
      LOG(`❌ Field not found for selector: ${selector}`);
      return;
    }
    if (field.dataset.sgoHelperInjected) {
      LOG(`⚠️ Helper already injected for ${selector}`);
      return;
    }
    field.dataset.sgoHelperInjected = 'true';
    LOG(`📍 Found field: ${field.tagName}#${field.id || field.name || 'unnamed'}`);

    const helper = document.createElement('div');
    helper.className = 'sgo-field-helper sgo-counter-ok'; // Default to green
    helper.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; background: rgba(40,167,69,0.1); border: 1px solid #28a745;';
    helper.innerHTML = config.html || '';
    LOG(`🔨 Created helper element with content: ${config.html}`);

    if (field.parentNode) {
      field.parentNode.insertBefore(helper, field.nextSibling);
      LOG(`✅ Helper inserted after field in DOM`);
    } else {
      LOG(`❌ Field has no parent node`);
    }

    if (config.onMount) {
      LOG(`🔧 Calling onMount callback`);
      config.onMount(field, helper);
    }
    
    LOG(`✅ Helper injected for ${selector}`);
  }

  // 📊 Character Counter with Thresholds
  function createCounter(maxLen, warningPct = 0.75, criticalPct = 0.9) {
    return (field, helper) => {
      LOG(`🔢 Creating counter for ${maxLen} chars`);
      const countEl = document.createElement('span');
      countEl.className = 'sgo-counter sgo-counter-ok';
      countEl.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; color: #fff; background: #28a745; padding: 2px 5px; font-weight: bold; border-radius: 3px; margin-left: 8px;';
      countEl.textContent = `0/${maxLen}`;
      helper.appendChild(countEl);
      LOG(`✅ Counter element created: ${countEl.textContent}`);

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
      LOG(`✅ Counter initialized and update() called`);
    };
  }

  // 🛠️ Template Dropdown using template-system.js
  function createTemplateDropdown() {
    return async (field, helper) => {
      const toolbar = document.createElement('div');
      toolbar.className = 'sgo-template-dropdown';
      
      // Create initial dropdown with loading state
      toolbar.innerHTML = `
        <select class="sgo-template-select">
          <option value="">📋 Insert Template...</option>
          <option value="" disabled>Loading templates...</option>
        </select>
      `;

      helper.appendChild(toolbar);

      const select = toolbar.querySelector('.sgo-template-select');
      
      // Load templates from template-system.js
      try {
        const allTemplates = await window.SGO.Templates.getAll();
        
        // Populate dropdown with templates
        select.innerHTML = '<option value="">📋 Insert Template...</option>';
        
        Object.keys(allTemplates).forEach(key => {
          const template = allTemplates[key];
          const option = document.createElement('option');
          option.value = key;
          option.textContent = `${template.name}${template.isCustom ? ' (Custom)' : ''}`;
          select.appendChild(option);
        });
        
        LOG(`✅ Loaded ${Object.keys(allTemplates).length} templates into dropdown`);
      } catch (e) {
        LOG('❌ Error loading templates:', e);
        select.innerHTML = '<option value="">📋 Insert Template...</option><option value="" disabled>Error loading templates</option>';
      }

      select.addEventListener('change', () => {
        const templateKey = select.value;
        if (templateKey) {
          window.SGO.Templates.getAll().then(templates => {
            if (templates[templateKey]) {
              insertAtCursor(field, templates[templateKey].content);
              field.focus();
              select.value = ''; // Reset after use
            }
          });
        }
      });
    };
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);
  }

  // 🚀 Main Initialization
  function setupEditSubsection() {
    LOG('🔍 Initializing editguidesubsection helpers (Section Content Editor)...');
    
    // No need to find form first - just look for the fields directly
    LOG(`🔍 Looking for title field: #title, input[name="title"], .editGuideSubSectionTitleField`);
    LOG(`🔍 Looking for content field: #description, textarea[name="description"], .editGuideSubSectionDescField`);

    // Section Title Counter
    const titleSelector = '#title, input[name="title"], .editGuideSubSectionTitleField';
    const titleField = document.querySelector(titleSelector);
    if (titleField) {
      LOG(`✅ Found title field: ${titleField.tagName}#${titleField.id || titleField.name || 'unnamed'}`);
      injectHelper(titleSelector, {
        html: '<span class="sgo-helper-label">Section Title</span>',
        onMount: createCounter(128)
      });
    } else {
      LOG(`❌ Title field not found`);
    }

    // Section Body Counter + Template Dropdown (BBCode Toolbar provided by Steam)
    const bodySelector = '#description, textarea[name="description"], .editGuideSubSectionDescField';
    const bodyField = document.querySelector(bodySelector);
    if (bodyField) {
      LOG(`✅ Found body field: ${bodyField.tagName}#${bodyField.id || bodyField.name || 'unnamed'}`);
      injectHelper(bodySelector, {
        html: '<span class="sgo-helper-label">Section Content</span>',
        onMount: (field, helper) => {
          LOG(`🎯 Mounting body helpers (counter + template dropdown)`);
          createCounter(8000)(field, helper);
          createTemplateDropdown()(field, helper);
        }
      });
    } else {
      LOG(`❌ Body field not found`);
    }

    LOG('✅ EditSubsection helpers active');
    return true;
  }

  // Expose to router
  window.SGO = window.SGO || {};
  window.SGO.initEditSubsection = function() {
    const observer = new MutationObserver((mutations, obs) => {
      if (setupEditSubsection()) obs.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => setupEditSubsection(), 1500); // Fallback if DOM loads fast
  };
})();
