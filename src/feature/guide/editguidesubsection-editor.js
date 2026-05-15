// src/features/guide/editguidesubsection-editor.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:EditSubsection]', msg);

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

  // Cascade Panel - chapter visibility (fill bars + freshness + previews).
  // Delegates to SGO.CascadePanel which lives in cascade-panel.js.
  function createSectionListPanel(ctx) {
    return (_titleField, helper) => {
      const bodyField = document.querySelector('#description, textarea[name="description"], .editGuideSubSectionDescField');
      if (window.SGO?.CascadePanel?.mount) {
        window.SGO.CascadePanel.mount(bodyField, helper, {
          guideId: ctx.guideId,
          currentSectionId: ctx.sectionId
        });
      } else {
        LOG('CascadePanel not loaded; cannot render chapter visibility panel');
      }
    };
  }

  // Main Initialization
  function setupEditSubsection(ctx) {
    LOG('Initializing editguidesubsection helpers (Section Content Editor)...');

    // Resolve guideId/sectionId — prefer router-provided values, fall back to URL.
    const params = new URLSearchParams(window.location.search);
    const guideId = ctx?.guideId || params.get('id');
    const sectionId = ctx?.sectionId || params.get('sectionid');
    LOG(`Context: guideId=${guideId} sectionId=${sectionId}`);

    // No need to find form first - just look for the fields directly
    LOG(`Looking for title field: #title, input[name="title"], .editGuideSubSectionTitleField`);
    LOG(`Looking for content field: #description, textarea[name="description"], .editGuideSubSectionDescField`);

    // Section Title Counter + Cascade Panel
    const titleSelector = '#title, input[name="title"], .editGuideSubSectionTitleField';
    const titleField = document.querySelector(titleSelector);
    if (titleField) {
      LOG(`Found title field: ${titleField.tagName}#${titleField.id || titleField.name || 'unnamed'}`);
      injectHelper(titleSelector, {
        html: '<span class="sgo-helper-label">Section Title</span>',
        onMount: (field, helper) => {
          LOG('Mounting title helpers (counter + cascade panel)');
          createCounter(128)(field, helper);
          createSectionListPanel({ guideId, sectionId })(field, helper);
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
          LOG(`Mounting body helpers (counter + cut-to-buffer + achievement sidepanel)`);
          createCounter(8000)(field, helper);

          const cutBtn = document.createElement('button');
          cutBtn.type = 'button';
          cutBtn.className = 'sgo-cut-to-buffer-btn';
          cutBtn.textContent = '✂ Cut to Buffer';
          cutBtn.title = 'Remove selected text and save it to the staging buffer';
          cutBtn.addEventListener('click', () => {
            const titleEl = document.querySelector('#title, input[name="title"], .editGuideSubSectionTitleField');
            const sectionTitle = titleEl ? (titleEl.value || '').trim() : '';
            const staged = window.SGO?.StagingBufferPanel?.stageSelected(field, guideId, sectionId, sectionTitle);
            if (!staged) {
              const orig = cutBtn.textContent;
              cutBtn.textContent = '✂ Select text first';
              setTimeout(() => { cutBtn.textContent = orig; }, 2000);
            } else {
              window.SGO?.StagingBufferPanel?.refresh?.();
            }
          });
          helper.appendChild(cutBtn);

          if (window.SGO?.AchievementPanel?.initPanel) {
            window.SGO.AchievementPanel.initPanel(field);
          }
          if (window.SGO?.StagingBufferPanel?.init) {
            window.SGO.StagingBufferPanel.init(field, { guideId, sectionId });
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
  window.SGO.initEditSubsection = function(ctx) {
    const observer = new MutationObserver((mutations, obs) => {
      if (setupEditSubsection(ctx)) obs.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => setupEditSubsection(ctx), 1500); // Fallback if DOM loads fast
  };
})();
