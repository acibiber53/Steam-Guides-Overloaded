// src/feature/guide/staging-buffer-panel.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:StagingBuffer]', msg);

  const BUFFER_KEY = 'sgo_staging_buffer';

  // Module-level state so refresh() can re-render without re-passing args.
  let _textarea = null;
  let _ctx = null;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  function getBuffer() {
    try {
      const raw = localStorage.getItem(BUFFER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveBuffer(data) {
    try { localStorage.setItem(BUFFER_KEY, JSON.stringify(data)); } catch {}
  }

  function clearBuffer() {
    localStorage.removeItem(BUFFER_KEY);
  }

  // Removes selected text from textarea and saves it to buffer.
  // Returns false if nothing is selected.
  function stageSelected(textarea, guideId, sectionId, sectionTitle) {
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return false;

    const text = textarea.value.substring(selectionStart, selectionEnd);
    textarea.value =
      textarea.value.substring(0, selectionStart) +
      textarea.value.substring(selectionEnd);
    textarea.setSelectionRange(selectionStart, selectionStart);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    saveBuffer({
      guideId,
      sourceSectionId: sectionId,
      sourceTitle: sectionTitle || 'Unknown chapter',
      text,
      length: text.length,
      stagedAt: Date.now()
    });

    LOG(`Staged ${text.length} chars from section ${sectionId}`);
    return true;
  }

  function updateToggle(toggleEl) {
    const buf = getBuffer();
    if (buf && buf.text) {
      toggleEl.innerHTML = `<span class="toggle-icon">📋</span><span class="toggle-text">Buffer (${buf.length})</span>`;
      toggleEl.classList.add('sgo-staging-has-content');
    } else {
      toggleEl.innerHTML = '<span class="toggle-icon">📋</span><span class="toggle-text">Buffer</span>';
      toggleEl.classList.remove('sgo-staging-has-content');
    }
  }

  function renderPanel(panel, textarea, ctx) {
    panel.innerHTML = '';
    const buf = getBuffer();

    if (!buf || !buf.text) {
      panel.innerHTML = `
        <div class="sgo-staging-empty">
          <p>No staged content.</p>
          <p>Select text in the chapter body and click <strong>Cut to Buffer</strong> to save it here safely.</p>
        </div>`;
      return;
    }

    const isSameGuide = buf.guideId === ctx?.guideId;
    const warningHtml = !isSameGuide
      ? `<div class="sgo-staging-warning">⚠ Staged from a different guide.</div>`
      : '';

    const header = document.createElement('div');
    header.className = 'sgo-staging-header';
    header.innerHTML = `
      <span class="sgo-staging-source" title="${escapeHtml(buf.sourceTitle)}">${escapeHtml(buf.sourceTitle)}</span>
      <span class="sgo-staging-chars">${buf.length} chars</span>`;
    panel.appendChild(header);

    if (warningHtml) {
      const warn = document.createElement('div');
      warn.innerHTML = warningHtml;
      panel.appendChild(warn.firstElementChild);
    }

    const pre = document.createElement('pre');
    pre.className = 'sgo-staging-preview';
    pre.textContent = buf.text;
    panel.appendChild(pre);

    const actions = document.createElement('div');
    actions.className = 'sgo-staging-actions';

    const pasteBtn = document.createElement('button');
    pasteBtn.type = 'button';
    pasteBtn.className = 'sgo-staging-paste-btn';
    pasteBtn.textContent = 'Paste at cursor';
    pasteBtn.addEventListener('click', () => {
      if (textarea) {
        window.SGO.insertAtCursor(textarea, buf.text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'sgo-staging-copy-btn';
    copyBtn.textContent = 'Copy to clipboard';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(buf.text).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy to clipboard'; }, 2000);
      }).catch(() => {});
    });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'sgo-staging-clear-btn';
    clearBtn.textContent = 'Clear buffer';
    clearBtn.addEventListener('click', () => {
      clearBuffer();
      renderPanel(panel, textarea, ctx);
      refresh();
    });

    actions.appendChild(pasteBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(clearBtn);
    panel.appendChild(actions);
  }

  // Refreshes the toggle label and re-renders the panel if it is currently open.
  // Called after same-tab stageSelected so the storage event (cross-tab only) isn't needed.
  function refresh() {
    const toggle = document.getElementById('sgo-staging-buffer-toggle');
    if (toggle) updateToggle(toggle);
    const panel = document.getElementById('sgo-staging-buffer-panel');
    if (panel && panel.classList.contains('open')) {
      renderPanel(panel, _textarea, _ctx);
    }
  }

  function init(textarea, ctx) {
    if (document.getElementById('sgo-staging-buffer-toggle')) return;

    _textarea = textarea;
    _ctx = ctx;

    const toggle = document.createElement('div');
    toggle.className = 'sgo-sidepanel-toggle';
    toggle.id = 'sgo-staging-buffer-toggle';

    const panel = document.createElement('div');
    panel.className = 'sgo-sidepanel';
    panel.id = 'sgo-staging-buffer-panel';

    toggle.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open');
      window.SGO?.closeAllPanels?.();
      if (!wasOpen) {
        renderPanel(panel, textarea, ctx);
        panel.classList.add('open');
        toggle.classList.add('active');
      }
    });

    (window.SGO?.getToggleBar?.() || document.body).appendChild(toggle);
    (window.SGO?.getPanelArea?.() || document.body).appendChild(panel);

    updateToggle(toggle);

    window.addEventListener('storage', (e) => {
      if (e.key === BUFFER_KEY) {
        updateToggle(toggle);
        if (panel.classList.contains('open')) {
          renderPanel(panel, textarea, ctx);
        }
      }
    });

    LOG('Staging buffer panel initialized');
  }

  window.SGO = window.SGO || {};
  window.SGO.StagingBufferPanel = { init, stageSelected, getBuffer, clearBuffer, refresh };
})();
