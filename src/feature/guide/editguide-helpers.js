// src/features/guide/editguide-helpers.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:EditGuide]', msg);

  // 📦 Template Library (Extend this object to add more)
  const TEMPLATES = {
    'achievement-table': `[table]
[tr][th]Achievement[/th][th]Description[/th][th]Tips[/th][/tr]
[tr][td][b]Name[/b][/td][td]Requirement details[/td][td]• Step 1\n• Step 2[/td][/tr]
[/table]`,
    'walkthrough-spoiler': `[h2]Chapter / Area[/h2]
[b]Objective:[/b] Main goal here.
[list]
[*]Step 1
[*]Step 2
[/list]
[spoiler]Hidden paths, secrets, or boss strategies go here.[/spoiler]`,
    'tips-list': `[h3]💡 Pro Tips[/h3]
[list]
[*]Tip with [b]emphasis[/b]
[*]Use [spoiler]tags[/spoiler] for spoilers
[*]Link: [url=https://store.steampowered.com/]Store[/url]
[/list]`
  };

  // 🔧 Safe DOM Injection
  function injectHelper(selector, config) {
    const field = document.querySelector(selector);
    if (!field || field.dataset.sgoHelperInjected) return;
    field.dataset.sgoHelperInjected = 'true';

    const helper = document.createElement('div');
    helper.className = 'sgo-field-helper';
    helper.innerHTML = config.html || '';

    if (field.parentNode) {
      field.parentNode.insertBefore(helper, field.nextSibling);
    }

    if (config.onMount) config.onMount(field, helper);
  }

  // 📊 Character Counter with Thresholds
  function createCounter(maxLen, warningPct = 0.75, criticalPct = 0.9) {
    return (field, helper) => {
      const countEl = document.createElement('span');
      countEl.className = 'sgo-counter';
      countEl.textContent = `0/${maxLen}`;
      helper.appendChild(countEl);

      const update = () => {
        const len = field.value.length;
        countEl.textContent = `${len}/${maxLen}`;
        const pct = len / maxLen;
        helper.classList.toggle('sgo-warning', pct >= warningPct && pct < criticalPct);
        helper.classList.toggle('sgo-critical', pct >= criticalPct);
      };

      field.addEventListener('input', update);
      update();
    };
  }

  // 🛠️ BBCode Toolbar & Template Dropdown
  function createToolbar() {
    return (field, helper) => {
      const toolbar = document.createElement('div');
      toolbar.className = 'sgo-bbcode-toolbar';
      toolbar.innerHTML = `
        <button type="button" data-tag="b" title="Bold">B</button>
        <button type="button" data-tag="i" title="Italic">I</button>
        <button type="button" data-tag="u" title="Underline">U</button>
        <button type="button" data-tag="strike" title="Strikethrough">S</button>
        <button type="button" data-tag="url" title="Link">🔗</button>
        <button type="button" data-tag="table" title="Table">▦</button>
        <button type="button" data-tag="spoiler" title="Spoiler">👁️</button>
        <select class="sgo-template-select">
          <option value="">📋 Insert Template...</option>
          ${Object.keys(TEMPLATES).map(k => `<option value="${k}">${k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`).join('')}
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
        if (template && TEMPLATES[template]) {
          insertAtCursor(field, TEMPLATES[template]);
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

  // Resolve pending AppID (set by store-button click) when arriving on editguide page
  (function() {
    const params = new URLSearchParams(window.location.search);
    const urlAppid = params.get('appid');
    const pending  = sessionStorage.getItem('sgo_pending_appid');
    const appid    = urlAppid || pending;
    if (appid) {
      localStorage.setItem('sgo_game_appid', appid);
      if (pending) sessionStorage.removeItem('sgo_pending_appid');
      const guideId = params.get('id');
      if (guideId) localStorage.setItem('sgo_guide_' + guideId + '_appid', appid);
      LOG('AppID resolved on editguide: ' + appid);
    }
  })();

  // 🚀 Main Initialization
  function setupEditGuide() {
    LOG('🔍 Initializing editguide helpers (Basic Guide Information)...');
    const form = document.querySelector('#SubmitGuideForm');
    if (!form) return false;

    // Title Counter
    injectHelper('#title', {
      html: '<span class="sgo-helper-label">Guide Title</span>',
      onMount: createCounter(128)
    });

    // Description Counter + BBCode Toolbar + Templates
    injectHelper('#description', {
      html: '<span class="sgo-helper-label">Description / Guide Body</span>',
      onMount: (field, helper) => {
        createCounter(8000)(field, helper);
        createToolbar()(field, helper);
      }
    });

    // Category Tip
    const tagContainer = document.querySelector('#checkboxgroup_0');
    if (tagContainer && !tagContainer.dataset.sgoTipInjected) {
      tagContainer.dataset.sgoTipInjected = 'true';
      const tip = document.createElement('div');
      tip.className = 'sgo-helper-tip';
      tip.innerHTML = '💡 <b>Achievement guides:</b> Check "Achievements" + "Walkthroughs". Avoid "Modding" unless applicable.';
      tagContainer.parentNode.insertBefore(tip, tagContainer.nextSibling);
    }

    LOG('✅ EditGuide helpers active');
    return true;
  }

  // Expose to router
  window.SGO = window.SGO || {};
  window.SGO.initEditGuide = function() {
    const observer = new MutationObserver((mutations, obs) => {
      if (setupEditGuide()) obs.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => setupEditGuide(), 1500); // Fallback if DOM loads fast
  };
})();