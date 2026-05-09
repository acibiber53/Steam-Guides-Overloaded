// src/features/guide/editguidesubsection-editor.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:EditSubsection]', msg);

  // 📦 Template Library for Subsections
  const SUBSECTION_TEMPLATES = {
    'step-list': `[b]Step 1:[/b] Description of first step.
[b]Step 2:[/b] Description of second step.`,
    'tips-box': `[h3]💡 Tips[/h3]
[list]
[*]Helpful tip here
[*]Another useful hint
[/list]`,
    'warning-box': `[h3]⚠️ Warning[/h3]
[spoiler]Important warning or spoiler content here.[/spoiler]`
  };

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
    helper.className = 'sgo-field-helper';
    helper.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; background: rgba(255,0,0,0.1); border: 1px solid red;';
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
      countEl.className = 'sgo-counter';
      countEl.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; color: #fff; background: blue; padding: 2px 5px; font-weight: bold;';
      countEl.textContent = `0/${maxLen}`;
      helper.appendChild(countEl);
      LOG(`✅ Counter element created: ${countEl.textContent}`);

      const update = () => {
        const len = field.value.length;
        countEl.textContent = `${len}/${maxLen}`;
        const pct = len / maxLen;
        helper.classList.toggle('sgo-warning', pct >= warningPct && pct < criticalPct);
        helper.classList.toggle('sgo-critical', pct >= criticalPct);
      };

      field.addEventListener('input', update);
      update();
      LOG(`✅ Counter initialized and update() called`);
    };
  }

  // 🛠️ BBCode Toolbar & Template Dropdown
  function createToolbar() {
    return (field, helper) => {
      const toolbar = document.createElement('div');
      toolbar.className = 'sgo-bbcode-toolbar';
      toolbar.innerHTML = `
        <button data-tag="b" title="Bold">B</button>
        <button data-tag="i" title="Italic">I</button>
        <button data-tag="u" title="Underline">U</button>
        <button data-tag="strike" title="Strikethrough">S</button>
        <button data-tag="url" title="Link">🔗</button>
        <button data-tag="table" title="Table">▦</button>
        <button data-tag="spoiler" title="Spoiler">👁️</button>
        <select class="sgo-template-select">
          <option value="">📋 Insert Template...</option>
          ${Object.keys(SUBSECTION_TEMPLATES).map(k => `<option value="${k}">${k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`).join('')}
        </select>
      `;

      helper.appendChild(toolbar);

      toolbar.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.tag) {
          wrapSelection(field, e.target.dataset.tag);
          field.focus();
        }
      });

      const select = toolbar.querySelector('.sgo-template-select');
      select.addEventListener('change', () => {
        const template = select.value;
        if (template && SUBSECTION_TEMPLATES[template]) {
          insertAtCursor(field, SUBSECTION_TEMPLATES[template]);
          field.focus();
          select.value = ''; // Reset after use
        }
      });
    };
  }

  function wrapSelection(textarea, tag) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const wrapped = `[${tag}]${selected}[/${tag}]`;
    textarea.value = textarea.value.substring(0, start) + wrapped + textarea.value.substring(end);
    textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selected.length);
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

    // Section Body Counter + BBCode Toolbar + Templates
    const bodySelector = '#description, textarea[name="description"], .editGuideSubSectionDescField';
    const bodyField = document.querySelector(bodySelector);
    if (bodyField) {
      LOG(`✅ Found body field: ${bodyField.tagName}#${bodyField.id || bodyField.name || 'unnamed'}`);
      injectHelper(bodySelector, {
        html: '<span class="sgo-helper-label">Section Content</span>',
        onMount: (field, helper) => {
          LOG(`🎯 Mounting body helpers (counter + toolbar)`);
          createCounter(8000)(field, helper);
          createToolbar()(field, helper);
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
