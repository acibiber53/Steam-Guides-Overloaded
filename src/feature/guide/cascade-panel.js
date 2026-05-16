// src/feature/guide/cascade-panel.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:CascadePanel]', msg);

  const MAX_LEN = 8000;
  const WARN_PCT = 0.75;
  const CRIT_PCT = 0.90;
  const LIVE_DEBOUNCE_MS = 500;
  const PREVIEW_MAX_HEIGHT = 300;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  function levelForPct(pct) {
    if (pct >= CRIT_PCT) return 'red';
    if (pct >= WARN_PCT) return 'yellow';
    return 'green';
  }

  function freshnessLabel(level) {
    switch (level) {
      case 'fresh': return 'Updated less than 1 hour ago';
      case 'recent': return 'Updated less than 24 hours ago';
      case 'stale': return 'Cached data is over 24 hours old';
      default: return 'Never cached — click Refresh all chapters';
    }
  }

  function buildPanel({ guideId, currentSectionId, field }) {
    const wrap = document.createElement('div');
    wrap.className = 'sgo-cascade-panel';
    wrap.innerHTML = `
      <div class="sgo-cascade-header">
        <span class="sgo-cascade-title">📚 Chapter Layout</span>
        <div class="sgo-cascade-header-actions">
          <button type="button" class="sgo-cascade-refresh-btn" title="Fetch missing/stale chapters in the background">
            <span class="sgo-cascade-refresh-spinner" hidden></span>
            <span class="sgo-cascade-refresh-label">Refresh all</span>
            <span class="sgo-cascade-refresh-progress" hidden></span>
          </button>
          <button type="button" class="sgo-cascade-toggle" title="Collapse panel">▼</button>
        </div>
      </div>
      <div class="sgo-cascade-status" hidden></div>
      <div class="sgo-cascade-body"></div>
    `;

    const toggleBtn = wrap.querySelector('.sgo-cascade-toggle');
    const body = wrap.querySelector('.sgo-cascade-body');
    const refreshBtn = wrap.querySelector('.sgo-cascade-refresh-btn');
    const refreshSpinner = wrap.querySelector('.sgo-cascade-refresh-spinner');
    const refreshLabel = wrap.querySelector('.sgo-cascade-refresh-label');
    const refreshProgress = wrap.querySelector('.sgo-cascade-refresh-progress');
    const statusBar = wrap.querySelector('.sgo-cascade-status');

    toggleBtn.addEventListener('click', () => {
      const collapsed = wrap.classList.toggle('sgo-cascade-collapsed');
      toggleBtn.textContent = collapsed ? '▶' : '▼';
      toggleBtn.title = collapsed ? 'Expand panel' : 'Collapse panel';
    });

    function showStatus(msg, kind) {
      statusBar.textContent = msg;
      statusBar.className = 'sgo-cascade-status sgo-cascade-status-' + (kind || 'info');
      statusBar.hidden = false;
    }

    function clearStatus() {
      statusBar.hidden = true;
      statusBar.textContent = '';
    }

    function render() {
      const cache = window.SGO?.SectionCache;
      if (!cache) {
        body.innerHTML = '<div class="sgo-cascade-empty">Section cache unavailable.</div>';
        return;
      }
      const sections = cache.getAll(guideId);
      if (sections.length === 0) {
        body.innerHTML = '<div class="sgo-cascade-empty">No chapters found. Open the Manage Guide page first to load the chapter list.</div>';
        return;
      }

      body.innerHTML = '';
      sections.forEach((sec, idx) => {
        const row = renderRow(sec, idx, sections.length, cache);
        body.appendChild(row);
      });
    }

    function renderRow(sec, idx, total, cache) {
      const row = document.createElement('div');
      row.className = 'sgo-cascade-row';
      row.dataset.sectionId = sec.id;
      const isCurrent = sec.id === currentSectionId;
      if (isCurrent) row.classList.add('sgo-cascade-row-current');

      const length = sec.length ?? 0;
      const pct = Math.min(1, length / MAX_LEN);
      const level = sec.cached ? levelForPct(pct) : 'unknown';
      const freshLevel = cache.freshness(sec.cached ? sec : null);
      const editHref = `/sharedfiles/editguidesubsection/?id=${encodeURIComponent(guideId)}&sectionid=${encodeURIComponent(sec.id)}`;

      row.innerHTML = `
        <div class="sgo-cascade-row-head">
          <button type="button" class="sgo-cascade-expand" title="Show body preview" aria-expanded="false">▸</button>
          ${isCurrent
            ? `<span class="sgo-cascade-order">${idx + 1}.</span>
               <span class="sgo-cascade-row-title" title="${escapeHtml(sec.title)}">${escapeHtml(sec.title)}</span>`
            : `<a class="sgo-cascade-row-link" href="${editHref}" title="${escapeHtml(sec.title)}">
                 <span class="sgo-cascade-order">${idx + 1}.</span>
                 <span class="sgo-cascade-row-title">${escapeHtml(sec.title)}</span>
               </a>`}
          ${isCurrent ? '<span class="sgo-cascade-row-badge">editing</span>' : ''}
          <span class="sgo-cascade-freshness sgo-cascade-freshness-${freshLevel}" title="${escapeHtml(freshnessLabel(freshLevel))}"></span>
          <span class="sgo-cascade-count sgo-cascade-count-${level}">
            ${sec.cached ? `${length}/${MAX_LEN}` : '— / ' + MAX_LEN}
          </span>
        </div>
        <div class="sgo-fill-bar sgo-fill-bar-${level}">
          <div class="sgo-fill-bar-inner" style="width: ${sec.cached ? Math.round(pct * 100) : 0}%"></div>
          <div class="sgo-fill-bar-tick sgo-fill-bar-tick-warn"></div>
          <div class="sgo-fill-bar-tick sgo-fill-bar-tick-crit"></div>
        </div>
        <div class="sgo-cascade-row-meta">
          <span class="sgo-cascade-headroom">${sec.cached ? `${MAX_LEN - length} chars left` : 'No data cached'}</span>
          ${sec.cached ? '' : '<button type="button" class="sgo-cascade-row-fetch">Fetch</button>'}
        </div>
        <div class="sgo-cascade-preview" hidden></div>
      `;

      const expandBtn = row.querySelector('.sgo-cascade-expand');
      const preview = row.querySelector('.sgo-cascade-preview');
      expandBtn.addEventListener('click', () => {
        const open = !preview.hidden;
        if (open) {
          preview.hidden = true;
          expandBtn.textContent = '▸';
          expandBtn.setAttribute('aria-expanded', 'false');
          return;
        }
        renderPreview(preview, sec);
        preview.hidden = false;
        expandBtn.textContent = '▾';
        expandBtn.setAttribute('aria-expanded', 'true');
      });

      const fetchBtn = row.querySelector('.sgo-cascade-row-fetch');
      if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
          fetchBtn.disabled = true;
          fetchBtn.textContent = 'Fetching…';
          try {
            await window.SGO.SectionCache.refreshOne(guideId, sec.id);
            render();
          } catch (err) {
            if (err.loggedOut) {
              showStatus('You appear to be logged out of Steam.', 'error');
            } else {
              fetchBtn.disabled = false;
              fetchBtn.textContent = 'Retry';
              showStatus(`Failed to fetch "${sec.title}": ${err.message}`, 'error');
            }
          }
        });
      }

      return row;
    }

    function renderPreview(container, sec) {
      if (!sec.cached) {
        container.innerHTML = '<div class="sgo-cascade-preview-empty">No cached body yet. Click Fetch or Refresh all.</div>';
        return;
      }
      container.innerHTML = `<pre class="sgo-cascade-preview-pre">${escapeHtml(sec.body || '')}</pre>`;
      const pre = container.querySelector('pre');
      if (pre) pre.style.maxHeight = PREVIEW_MAX_HEIGHT + 'px';
    }

    function updateCurrentRowLive() {
      if (!field || !currentSectionId) return;
      const row = body.querySelector(`.sgo-cascade-row[data-section-id="${CSS.escape(currentSectionId)}"]`);
      if (!row) return;
      const length = field.value.length;
      const pct = Math.min(1, length / MAX_LEN);
      const level = levelForPct(pct);

      const count = row.querySelector('.sgo-cascade-count');
      if (count) {
        count.textContent = `${length}/${MAX_LEN}`;
        count.className = `sgo-cascade-count sgo-cascade-count-${level}`;
      }
      const headroom = row.querySelector('.sgo-cascade-headroom');
      if (headroom) headroom.textContent = `${MAX_LEN - length} chars left`;
      const bar = row.querySelector('.sgo-fill-bar');
      if (bar) {
        bar.className = `sgo-fill-bar sgo-fill-bar-${level}`;
        const inner = bar.querySelector('.sgo-fill-bar-inner');
        if (inner) inner.style.width = Math.round(pct * 100) + '%';
      }
      const fresh = row.querySelector('.sgo-cascade-freshness');
      if (fresh) {
        fresh.className = 'sgo-cascade-freshness sgo-cascade-freshness-fresh';
        fresh.title = freshnessLabel('fresh');
      }
      const preview = row.querySelector('.sgo-cascade-preview');
      if (preview && !preview.hidden) {
        preview.innerHTML = `<pre class="sgo-cascade-preview-pre">${escapeHtml(field.value)}</pre>`;
        const pre = preview.querySelector('pre');
        if (pre) pre.style.maxHeight = PREVIEW_MAX_HEIGHT + 'px';
      }
    }

    async function handleRefreshAll() {
      const cache = window.SGO?.SectionCache;
      if (!cache) return;
      refreshBtn.disabled = true;
      refreshSpinner.hidden = false;
      refreshLabel.textContent = 'Refreshing…';
      refreshProgress.hidden = false;
      refreshProgress.textContent = '';
      clearStatus();

      try {
        const result = await cache.prime(guideId, {
          skipSectionId: currentSectionId,
          onProgress: (p) => {
            if (p.phase === 'fetching') {
              refreshProgress.textContent = `(${p.index + 1}/${p.total})`;
            }
          }
        });
        if (result.loggedOut) {
          showStatus('You appear to be logged out of Steam. Sign in and try again.', 'error');
        } else if (result.fetched === 0 && result.failed === 0) {
          showStatus('All chapters are already fresh.', 'info');
        } else {
          const parts = [`Fetched ${result.fetched}`];
          if (result.failed > 0) parts.push(`${result.failed} failed`);
          showStatus(parts.join(' · '), result.failed > 0 ? 'warn' : 'success');
        }
      } catch (err) {
        showStatus('Refresh failed: ' + err.message, 'error');
      } finally {
        refreshBtn.disabled = false;
        refreshSpinner.hidden = true;
        refreshLabel.textContent = 'Refresh all';
        refreshProgress.hidden = true;
        refreshProgress.textContent = '';
        render();
      }
    }

    refreshBtn.addEventListener('click', handleRefreshAll);

    if (field && currentSectionId) {
      let debounceTimer = null;
      field.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const titleEl = document.querySelector('#title, input[name="title"], .editGuideSubSectionTitleField');
          const title = titleEl ? (titleEl.value || titleEl.textContent || '').trim() : undefined;
          window.SGO.SectionCache.updateLive(guideId, currentSectionId, field.value, title);
          updateCurrentRowLive();
        }, LIVE_DEBOUNCE_MS);
      });
    }

    render();

    if (field && currentSectionId) {
      const titleEl = document.querySelector('#title, input[name="title"], .editGuideSubSectionTitleField');
      const title = titleEl ? (titleEl.value || titleEl.textContent || '').trim() : undefined;
      window.SGO.SectionCache.updateLive(guideId, currentSectionId, field.value, title);
      updateCurrentRowLive();
    }

    return wrap;
  }

  function mount(field, helper, options) {
    options = options || {};
    const { guideId, currentSectionId } = options;
    if (!guideId) {
      LOG('Refusing to mount: no guideId in context');
      return null;
    }
    if (!helper) {
      LOG('Refusing to mount: no helper container');
      return null;
    }
    if (helper.querySelector('.sgo-cascade-panel')) {
      LOG('Panel already mounted in this helper');
      return helper.querySelector('.sgo-cascade-panel');
    }
    const panel = buildPanel({ guideId, currentSectionId, field });
    helper.appendChild(panel);
    LOG(`Mounted cascade panel for guide=${guideId} section=${currentSectionId}`);
    return panel;
  }

  window.SGO = window.SGO || {};
  window.SGO.CascadePanel = { mount };
})();
