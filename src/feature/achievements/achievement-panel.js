// src/feature/achievements/achievement-panel.js
(function () {
  'use strict';
  const LOG = msg => console.log('[SGO:AchievementPanel]', msg);

  const APPID_KEY        = 'sgo_game_appid';
  const CACHE_PREFIX     = 'sgo_achievements_';
  const CACHE_TTL_MS     = 24 * 60 * 60 * 1000; // 24 hours
  const IMAGE_MAP_KEY    = 'sgo_image_map';
  const SEL_TEMPLATE_KEY = 'sgo_achievement_sel_template';
  const CUSTOM_TPL_KEY   = 'sgo_achievement_custom_template';

  const BUILTIN_TEMPLATES = {
    'simple': {
      label: 'Simple (text only)',
      body: '[b]{title}[/b] — {description}'
    },
    'with-image': {
      label: 'With Image',
      body: '[h1]{title}[/h1]\n[previewimg={image_id};sizeOriginal,floatLeft;{title}.jpg][/previewimg]\n{description}\n'
    },
    'table-row': {
      label: 'Table Row',
      body: '[tr][td][previewimg={image_id};sizeOriginal,floatLeft;{title}.jpg][/previewimg][/td][td][b]{title}[/b]\n{description}[/td][/tr]'
    },
    'heading': {
      label: 'Heading + Description',
      body: '[h1]{title}[/h1]\n{description}'
    },
    'custom': {
      label: 'Custom Template',
      body: null // loaded from CUSTOM_TPL_KEY
    }
  };

  // ── Utility ──────────────────────────────────────────────────────────────

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  function stemKey(title) {
    return (title || '').replace(/\.[^.]+$/, '').toLowerCase().trim();
  }

  // ── AppID Resolution ──────────────────────────────────────────────────────

  function resolveAppId() {
    // 1. Section/guide-specific mapping (most reliable — persists across sessions)
    const pageId = new URLSearchParams(window.location.search).get('id');
    if (pageId) {
      const mapped = localStorage.getItem('sgo_guide_' + pageId + '_appid');
      if (mapped) return mapped;
    }

    // 2. General last-visited game AppID
    const cached = localStorage.getItem(APPID_KEY);
    if (cached) return cached;

    // 3. DOM fallbacks
    for (const name of ['consumer_app_id', 'appid']) {
      const el = document.querySelector(`input[name="${name}"]`);
      if (el && el.value) { localStorage.setItem(APPID_KEY, el.value); return el.value; }
    }
    const storeLink = document.querySelector('a[href*="store.steampowered.com/app/"]');
    if (storeLink) {
      const m = storeLink.href.match(/\/app\/(\d+)/);
      if (m) { localStorage.setItem(APPID_KEY, m[1]); return m[1]; }
    }

    return null;
  }

  function saveAppId(appid) {
    localStorage.setItem(APPID_KEY, appid);
    const pageId = new URLSearchParams(window.location.search).get('id');
    if (pageId) localStorage.setItem('sgo_guide_' + pageId + '_appid', appid);
  }

  // ── Image Map ─────────────────────────────────────────────────────────────

  function getImageMap() {
    try {
      return JSON.parse(localStorage.getItem(IMAGE_MAP_KEY) || '{}');
    } catch { return {}; }
  }

  function getImageId(achievementTitle) {
    const map = getImageMap();
    return (map.titleToId || {})[stemKey(achievementTitle)] || null;
  }

  function seedImageMapFromTextarea(textarea) {
    if (!textarea || !textarea.value) return;
    const re = /\[previewimg=(\d+);[^\]]*?;([^\]]+?)\]\[\/previewimg\]/g;
    let m;
    const map = getImageMap();
    const titleToId = map.titleToId || {};
    const idToTitle = map.idToTitle || {};
    let changed = false;
    while ((m = re.exec(textarea.value)) !== null) {
      const id = m[1], filename = m[2].trim(), key = stemKey(filename);
      if (!titleToId[key]) { titleToId[key] = id; idToTitle[id] = filename; changed = true; }
    }
    if (changed) {
      localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify({ titleToId, idToTitle }));
      LOG('Seeded image map from textarea BBCode');
    }
  }

  // ── Template Helpers ──────────────────────────────────────────────────────

  function getSelectedTemplateKey() {
    return localStorage.getItem(SEL_TEMPLATE_KEY) || 'with-image';
  }

  function getTemplateBody(key) {
    if (key === 'custom') return localStorage.getItem(CUSTOM_TPL_KEY) || BUILTIN_TEMPLATES['with-image'].body;
    return (BUILTIN_TEMPLATES[key] || BUILTIN_TEMPLATES['with-image']).body;
  }

  function buildInsertText(achievement) {
    const key   = getSelectedTemplateKey();
    let body    = getTemplateBody(key);
    const title = achievement.display_name || achievement.name || '';
    const desc  = achievement.description || '';
    const imgId = getImageId(title) || '';

    if (!imgId) {
      body = body.replace(/\[previewimg=\{image_id\}[^\]]*\]\[\/previewimg\]\n?/g, '');
    }
    return body
      .replace(/\{title\}/g, title)
      .replace(/\{description\}/g, desc)
      .replace(/\{image_id\}/g, imgId);
  }

  // ── Fetch Achievements ────────────────────────────────────────────────────

  function fetchAchievements(appid, callback) {
    const cacheKey = CACHE_PREFIX + appid;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        LOG(`Using cached achievements for AppID ${appid}`);
        return callback(null, cached.achievements);
      }
    } catch { /* stale */ }

    const url = `https://steamcommunity.com/stats/${appid}/achievements/?l=english`;
    fetch(url, { credentials: 'omit' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('.achieveRow');
        const achievements = Array.from(rows).map(row => ({
          name: row.querySelector('.achieveTxt h3')?.textContent.trim() || '',
          description: row.querySelector('.achieveTxt h5')?.textContent.trim() || '',
          icon: row.querySelector('.achieveImgHolder img')?.getAttribute('src') || ''
        })).filter(a => a.name);

        if (!achievements.length) {
          return callback('No achievements found on Steam stats page', null);
        }
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), achievements }));
        LOG(`Fetched and cached ${achievements.length} achievements`);
        callback(null, achievements);
      })
      .catch(err => callback(err.message || String(err), null));
  }

  // ── Download Images ───────────────────────────────────────────────────────

  function downloadImages(achievements, statusEl) {
    const images = achievements
      .filter(a => a.icon)
      .map(a => ({ url: a.icon, filename: (a.display_name || a.name || 'achievement') + '.jpg' }));

    if (!images.length) { if (statusEl) statusEl.textContent = 'No images found.'; return; }
    if (statusEl) statusEl.textContent = `Downloading ${images.length} images…`;

    chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGES', images }, response => {
      if (chrome.runtime.lastError) {
        if (statusEl) statusEl.textContent = 'Download failed: ' + chrome.runtime.lastError.message;
        return;
      }
      if (statusEl) statusEl.textContent = `Downloaded ${response?.count || images.length} images to achievements/ folder.`;
    });
  }

  // ── Panel DOM ─────────────────────────────────────────────────────────────

  function buildPanel(textarea) {
    const panel = document.createElement('div');
    panel.id = 'sgo-achievement-sidepanel';
    panel.className = 'sgo-sidepanel';
    panel.innerHTML = `
      <div class="sgo-sp-header">
        <h4>🏆 Achievements</h4>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="sgo-ap-refresh" title="Refresh (clears cache)">↻</button>
          <button type="button" class="sgo-sp-close" title="Close">✕</button>
        </div>
      </div>
      <div class="sgo-sp-content">
        <div class="sgo-ap-controls">
          <button type="button" class="sgo-ap-download-btn">⬇ Download Images</button>
          <input type="text" class="sgo-ap-search" placeholder="Search achievements…">
        </div>
        <div class="sgo-ap-template-row">
          <label class="sgo-ap-tpl-label">Template:</label>
          <select class="sgo-ap-tpl-select"></select>
          <button type="button" class="sgo-ap-tpl-edit-btn">Edit Custom</button>
        </div>
        <div class="sgo-ap-tpl-editor" style="display:none;">
          <textarea class="sgo-ap-tpl-textarea" rows="4" placeholder="Use {title}, {description}, {image_id}"></textarea>
          <div class="sgo-ap-tpl-tokens">Tokens: <code>{title}</code> <code>{description}</code> <code>{image_id}</code></div>
          <button type="button" class="sgo-ap-tpl-save">Save</button>
        </div>
        <div class="sgo-ap-list"></div>
        <div class="sgo-ap-footer">
          <span class="sgo-ap-status">Loading…</span>
        </div>
      </div>
    `;

    // Template selector
    const select = panel.querySelector('.sgo-ap-tpl-select');
    Object.entries(BUILTIN_TEMPLATES).forEach(([key, tpl]) => {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = tpl.label;
      select.appendChild(opt);
    });
    select.value = getSelectedTemplateKey();

    const tplEditor = panel.querySelector('.sgo-ap-tpl-editor');
    const tplTextarea = panel.querySelector('.sgo-ap-tpl-textarea');
    tplTextarea.value = localStorage.getItem(CUSTOM_TPL_KEY) || BUILTIN_TEMPLATES['with-image'].body;
    if (select.value === 'custom') tplEditor.style.display = 'block';

    select.addEventListener('change', () => {
      localStorage.setItem(SEL_TEMPLATE_KEY, select.value);
      tplEditor.style.display = select.value === 'custom' ? 'block' : 'none';
    });

    panel.querySelector('.sgo-ap-tpl-edit-btn').addEventListener('click', () => {
      select.value = 'custom';
      localStorage.setItem(SEL_TEMPLATE_KEY, 'custom');
      tplEditor.style.display = 'block';
    });

    panel.querySelector('.sgo-ap-tpl-save').addEventListener('click', () => {
      localStorage.setItem(CUSTOM_TPL_KEY, tplTextarea.value);
      const btn = panel.querySelector('.sgo-ap-tpl-save');
      btn.textContent = 'Saved!';
      setTimeout(() => { btn.textContent = 'Save'; }, 1500);
    });

    // Close button
    panel.querySelector('.sgo-sp-close').addEventListener('click', () => closePanel());

    return panel;
  }

  function renderNoAppId(panel, textarea) {
    const listEl = panel.querySelector('.sgo-ap-list');
    const statusEl = panel.querySelector('.sgo-ap-status');
    if (statusEl) statusEl.textContent = 'Game not set';
    listEl.innerHTML = `
      <div class="sgo-ap-no-appid">
        <p>Game not set for this guide.<br>
        Click <b>🎮 Set Game</b> in the page header, or enter the AppID manually:</p>
        <div class="sgo-ap-appid-row">
          <input type="text" class="sgo-ap-appid-input" placeholder="e.g. 4197610" maxlength="10">
          <button type="button" class="sgo-ap-appid-save">Load</button>
        </div>
      </div>
    `;
    listEl.querySelector('.sgo-ap-appid-save').addEventListener('click', () => {
      const val = listEl.querySelector('.sgo-ap-appid-input').value.trim();
      if (!/^\d+$/.test(val)) return;
      saveAppId(val);
      // Refresh panel content now that we have an appid
      startLoading(panel, val, textarea);
    });
  }

  function renderList(panel, achievements, textarea, query) {
    const listEl = panel.querySelector('.sgo-ap-list');
    const q = (query || '').toLowerCase().trim();
    const filtered = q
      ? achievements.filter(a =>
          (a.display_name || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
        )
      : achievements;

    if (!filtered.length) {
      listEl.innerHTML = '<div class="sgo-ap-empty">No achievements found.</div>';
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(achievement => {
      const item = document.createElement('div');
      item.className = 'sgo-ap-item';
      const title  = achievement.display_name || achievement.name || '(Unnamed)';
      const desc   = achievement.description || '';
      const icon   = achievement.icon || '';
      const mapped = getImageId(title);

      item.innerHTML = `
        <img class="sgo-ap-icon" src="${escapeHtml(icon)}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="sgo-ap-info">
          <div class="sgo-ap-title-row">
            <span class="sgo-ap-name">${escapeHtml(title)}</span>
            ${mapped ? '<span class="sgo-ap-mapped-badge">🖼</span>' : ''}
          </div>
          <div class="sgo-ap-desc">${escapeHtml(desc)}</div>
        </div>
        <button type="button" class="sgo-ap-insert-btn">Insert</button>
      `;

      item.querySelector('.sgo-ap-insert-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const text = buildInsertText(achievement);
        if (window.SGO?.insertAtCursor && textarea) {
          window.SGO.insertAtCursor(textarea, text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      listEl.appendChild(item);
    });
  }

  function startLoading(panel, appid, textarea) {
    const listEl   = panel.querySelector('.sgo-ap-list');
    const statusEl = panel.querySelector('.sgo-ap-status');
    const searchInput = panel.querySelector('.sgo-ap-search');

    listEl.innerHTML = '<div class="sgo-ap-empty">Loading achievements…</div>';

    let allAchievements = [];

    const doRender = () => renderList(panel, allAchievements, textarea, searchInput.value);

    searchInput.oninput = doRender;

    panel.querySelector('.sgo-ap-download-btn').onclick = () => {
      if (allAchievements.length) downloadImages(allAchievements, statusEl);
    };

    panel.querySelector('.sgo-ap-refresh').onclick = () => {
      localStorage.removeItem(CACHE_PREFIX + appid);
      statusEl.textContent = 'Refreshing…';
      loadAchievements(panel, appid, textarea);
    };

    fetchAchievements(appid, (err, achievements) => {
      if (err || !achievements) {
        listEl.innerHTML = `<div class="sgo-ap-empty sgo-ap-error">Failed to load.<br><small>${escapeHtml(err || 'Unknown error')}</small></div>`;
        statusEl.textContent = 'Error';
        return;
      }
      allAchievements = achievements;
      const mappedCount = Object.keys(getImageMap().titleToId || {}).length;
      statusEl.textContent = `${achievements.length} achievements · AppID: ${appid} · ${mappedCount} mapped`;
      doRender();
    });
  }

  function loadAchievements(panel, appid, textarea) {
    startLoading(panel, appid, textarea);
  }

  // ── Toggle / Init ─────────────────────────────────────────────────────────

  function getWrapper() { return document.getElementById('sgo-achievement-wrapper'); }
  function getSidePanel() { return document.getElementById('sgo-achievement-sidepanel'); }
  function getToggle() { return document.getElementById('sgo-achievement-toggle'); }

  function openPanel() {
    getSidePanel()?.classList.add('open');
    getToggle()?.classList.add('active');
  }

  function closePanel() {
    getSidePanel()?.classList.remove('open');
    getToggle()?.classList.remove('active');
  }

  function initPanel(textarea) {
    if (getToggle()) return;

    seedImageMapFromTextarea(textarea);

    const toggle = document.createElement('div');
    toggle.className = 'sgo-sidepanel-toggle';
    toggle.id = 'sgo-achievement-toggle';
    toggle.innerHTML = '<span class="toggle-icon">🏆</span><span class="toggle-text">Achievements</span>';
    toggle.addEventListener('click', () => {
      const panel = getSidePanel();
      const wasOpen = panel?.classList.contains('open');
      window.SGO?.closeAllPanels?.();
      if (!wasOpen) openPanel();
    });

    const panel = buildPanel(textarea);
    (window.SGO?.getToggleBar?.() || document.body).appendChild(toggle);
    (window.SGO?.getPanelArea?.() || document.body).appendChild(panel);

    const appid = resolveAppId();
    if (!appid) {
      renderNoAppId(panel, textarea);
    } else {
      loadAchievements(panel, appid, textarea);
    }

    LOG('Achievement sidepanel initialized');
  }

  // ── Button Factory (kept for editguidesubsection-editor.js compatibility) ──

  function createButton(textarea) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sgo-open-achievements';
    btn.title = 'Toggle Achievement Panel';
    btn.textContent = '🏆 Achievements';

    btn.addEventListener('click', () => {
      if (!getToggle()) {
        initPanel(textarea);
        // Slight delay so panel is in DOM before we open it
        setTimeout(openPanel, 50);
      } else {
        const panel = getSidePanel();
        if (panel?.classList.contains('open')) closePanel();
        else openPanel();
      }
    });

    return btn;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.SGO = window.SGO || {};
  window.SGO.AchievementPanel = { createButton, initPanel };
})();
