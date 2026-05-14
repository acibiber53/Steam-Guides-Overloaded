// src/feature/guide/game-badge.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:GameProfile]', msg);

  const APPID_KEY        = 'sgo_game_appid';
  const GAME_PROFILE_KEY = 'sgo_game_profile_cache';

  function getPageId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function resolveGuideAppId() {
    const pageId = getPageId();
    if (pageId) {
      const mapped = localStorage.getItem('sgo_guide_' + pageId + '_appid');
      if (mapped) return mapped;
    }
    return localStorage.getItem(APPID_KEY) || null;
  }

  function saveAppId(appid) {
    localStorage.setItem(APPID_KEY, appid);
    const pageId = getPageId();
    if (pageId) localStorage.setItem('sgo_guide_' + pageId + '_appid', appid);
  }

  function getStoredIcon(appid) {
    return localStorage.getItem('sgo_game_icon_' + appid) || null;
  }

  function getCachedProfile(appid) {
    try {
      const cache = JSON.parse(localStorage.getItem(GAME_PROFILE_KEY) || '{}');
      return cache[appid] || null;
    } catch { return null; }
  }

  function setCachedProfile(appid, profile) {
    try {
      const cache = JSON.parse(localStorage.getItem(GAME_PROFILE_KEY) || '{}');
      cache[appid] = profile;
      localStorage.setItem(GAME_PROFILE_KEY, JSON.stringify(cache));
    } catch {}
  }

  function fetchGameProfile(appid, callback) {
    const cached = getCachedProfile(appid);
    if (cached) { callback(cached); return; }
    if (!chrome?.runtime?.sendMessage) { callback(null); return; }
    chrome.runtime.sendMessage({ type: 'FETCH_GAME_NAME', appid }, response => {
      if (chrome.runtime.lastError || !response?.success) { callback(null); return; }
      const profile = {
        name: response.name || null,
        icon: response.icon || null,
        header_image: response.header_image || null,
        developer: response.developer || null,
        publisher: response.publisher || null,
        release_date: response.release_date || null,
        short_description: response.short_description || null
      };
      setCachedProfile(appid, profile);
      callback(profile);
    });
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function renderUnsetPrompt(panel) {
    const content = panel.querySelector('.sgo-sp-content');
    content.innerHTML = `
      <div class="sgo-gp-no-appid">
        <p>Game not set for this guide.<br>Enter the Steam AppID:</p>
      </div>
      <form class="sgo-gp-change">
        <label>AppID</label>
        <input type="text" inputmode="numeric" placeholder="e.g. 4197610" maxlength="10">
        <button type="submit">Save</button>
      </form>
    `;
    const form  = content.querySelector('.sgo-gp-change');
    const input = form.querySelector('input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = input.value.trim();
      if (!/^\d+$/.test(val)) return;
      saveAppId(val);
      renderProfile(panel);
    });
    input.focus();
  }

  function writeProfileHtml(panel, appid, profile) {
    const content = panel.querySelector('.sgo-sp-content');
    const safe = profile || {};
    const headerSrc = safe.header_image
      || getStoredIcon(appid)
      || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;

    const metaRows = [
      ['AppID',        appid],
      ['Developer',    safe.developer],
      ['Publisher',    safe.publisher],
      ['Release date', safe.release_date]
    ].filter(([, v]) => v != null && v !== '');

    content.innerHTML = `
      ${headerSrc ? `<img class="sgo-gp-header-img" src="${escapeHtml(headerSrc)}" alt="" onerror="this.style.display='none'">` : ''}
      <h3 class="sgo-gp-name">${escapeHtml(safe.name || 'Unknown game')}</h3>
      ${metaRows.length ? `<dl class="sgo-gp-meta">
        ${metaRows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}
      </dl>` : ''}
      ${safe.short_description ? `<p class="sgo-gp-desc">${escapeHtml(safe.short_description)}</p>` : ''}
      <div class="sgo-gp-actions">
        <a href="https://store.steampowered.com/app/${escapeHtml(appid)}" target="_blank" rel="noopener">🛒 Store Page</a>
        <a href="https://steamcommunity.com/app/${escapeHtml(appid)}" target="_blank" rel="noopener">💬 Community Hub</a>
      </div>
      <form class="sgo-gp-change">
        <label>Change AppID</label>
        <input type="text" inputmode="numeric" maxlength="10" value="${escapeHtml(appid)}">
        <button type="submit">Save</button>
      </form>
    `;

    const form  = content.querySelector('.sgo-gp-change');
    const input = form.querySelector('input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = input.value.trim();
      if (!/^\d+$/.test(val)) return;
      if (val === appid) return;
      saveAppId(val);
      renderProfile(panel);
    });
  }

  function renderProfile(panel) {
    const appid = resolveGuideAppId();
    if (!appid) { renderUnsetPrompt(panel); return; }

    const content = panel.querySelector('.sgo-sp-content');
    const cached = getCachedProfile(appid);
    if (cached) {
      writeProfileHtml(panel, appid, cached);
    } else {
      content.innerHTML = '<div class="sgo-gp-loading">Loading…</div>';
    }
    fetchGameProfile(appid, profile => writeProfileHtml(panel, appid, profile || {}));
  }

  function initGameProfile() {
    if (document.getElementById('sgo-game-profile-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'sgo-sidepanel-wrapper';
    wrapper.id = 'sgo-game-profile-wrapper';

    const toggle = document.createElement('div');
    toggle.className = 'sgo-sidepanel-toggle';
    toggle.id = 'sgo-game-profile-toggle';
    toggle.innerHTML = '<span class="toggle-icon">🎮</span><span class="toggle-text">Game Profile</span>';

    const panel = document.createElement('div');
    panel.className = 'sgo-sidepanel';
    panel.id = 'sgo-game-profile-sidepanel';
    panel.innerHTML = `
      <div class="sgo-sp-header">
        <div class="sgo-sp-title"><span class="title-icon">🎮</span><h4>Game Profile</h4></div>
        <button type="button" class="sgo-sp-close" title="Close">✕</button>
      </div>
      <div class="sgo-sp-content"></div>
    `;

    toggle.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open');
      window.SGO?.closeAllPanels?.();
      if (!wasOpen) {
        panel.classList.add('open');
        toggle.classList.add('active');
      }
    });
    panel.querySelector('.sgo-sp-close').addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.classList.remove('active');
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(panel);
    (window.SGO?.getPanelStack?.() || document.body).appendChild(wrapper);

    renderProfile(panel);
    LOG('Game Profile panel initialized (appid: ' + (resolveGuideAppId() || 'none') + ')');
  }

  window.SGO = window.SGO || {};
  window.SGO.initGameProfile = initGameProfile;
  window.SGO.initGameBadge   = initGameProfile;
})();
