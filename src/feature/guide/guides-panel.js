// src/feature/guide/guides-panel.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:GuidesPanel]', msg);

  const USER_GUIDES_KEY = 'sgo_user_guides';

  function getCurrentAppId() {
    const m = window.location.href.match(/\/app\/(\d+)/);
    return m ? m[1] : null;
  }

  function getGuides() {
    try {
      return JSON.parse(localStorage.getItem(USER_GUIDES_KEY) || '[]');
    } catch { return []; }
  }

  function assignGuide(guideId, appid) {
    localStorage.setItem('sgo_guide_' + guideId + '_appid', appid);
    const guides = getGuides();
    const idx = guides.findIndex(g => g.id === guideId);
    if (idx >= 0) {
      guides[idx].appid = appid;
      guides[idx].updated = Date.now();
      localStorage.setItem(USER_GUIDES_KEY, JSON.stringify(guides));
    }
    LOG(`Assigned guide ${guideId} to AppID ${appid}`);
  }

  function renderGuidesList(listEl, filter, query, currentAppId) {
    const guides = getGuides();
    const q = (query || '').toLowerCase().trim();

    let filtered = guides;
    if (filter === 'this-game') filtered = guides.filter(g => g.appid === currentAppId);
    else if (filter === 'unassigned') filtered = guides.filter(g => !g.appid);

    if (q) {
      filtered = filtered.filter(g => (g.title || '').toLowerCase().includes(q));
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="sgo-gp-empty">No guides found.</div>';
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(guide => {
      const item = document.createElement('div');
      item.className = 'sgo-gp-item';
      const isThisGame = guide.appid === currentAppId;
      item.innerHTML = `
        <div class="sgo-gp-item-title">${escapeHtml(guide.title || 'Untitled')}</div>
        <div class="sgo-gp-item-meta">ID: ${escapeHtml(guide.id)}${guide.appid ? ' · AppID: ' + escapeHtml(guide.appid) : ' · Unassigned'}</div>
        <div class="sgo-gp-item-actions">
          <a class="sgo-gp-edit-btn" href="https://steamcommunity.com/sharedfiles/manageguide/?id=${escapeHtml(guide.id)}" target="_blank">Edit</a>
          ${(!isThisGame && currentAppId) ? `<button type="button" class="sgo-gp-assign-btn" data-guide-id="${escapeHtml(guide.id)}">Assign to this game</button>` : ''}
        </div>
      `;

      const assignBtn = item.querySelector('.sgo-gp-assign-btn');
      if (assignBtn) {
        assignBtn.addEventListener('click', () => {
          assignGuide(guide.id, currentAppId);
          // Update the item in place
          item.querySelector('.sgo-gp-item-meta').textContent = `ID: ${guide.id} · AppID: ${currentAppId}`;
          assignBtn.remove();
        });
      }

      listEl.appendChild(item);
    });
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text || '');
    return d.innerHTML;
  }

  function initGuidesPanel() {
    if (document.getElementById('sgo-guides-wrapper')) return;

    const currentAppId = getCurrentAppId();

    const wrapper = document.createElement('div');
    wrapper.className = 'sgo-sidepanel-wrapper';
    wrapper.id = 'sgo-guides-wrapper';

    const toggle = document.createElement('div');
    toggle.className = 'sgo-sidepanel-toggle';
    toggle.id = 'sgo-guides-toggle';
    toggle.innerHTML = '<span class="toggle-icon">📖</span><span class="toggle-text">My Guides</span>';

    const panel = document.createElement('div');
    panel.className = 'sgo-sidepanel';
    panel.id = 'sgo-guides-sidepanel';
    panel.innerHTML = `
      <div class="sgo-sp-header">
        <h4>📖 My Guides</h4>
        <button type="button" class="sgo-sp-close" title="Close">✕</button>
      </div>
      <div class="sgo-sp-content">
        <input type="text" class="sgo-gp-search" placeholder="Search guides…">
        <div class="sgo-gp-filter">
          <button type="button" class="sgo-gp-filter-btn active" data-filter="all">All</button>
          <button type="button" class="sgo-gp-filter-btn" data-filter="this-game">This Game</button>
          <button type="button" class="sgo-gp-filter-btn" data-filter="unassigned">Unassigned</button>
        </div>
        <div class="sgo-gp-list"></div>
      </div>
    `;

    wrapper.appendChild(toggle);
    wrapper.appendChild(panel);
    (window.SGO?.getPanelStack?.() || document.body).appendChild(wrapper);

    const listEl      = panel.querySelector('.sgo-gp-list');
    const searchInput = panel.querySelector('.sgo-gp-search');
    let activeFilter  = 'all';

    const rerender = () => renderGuidesList(listEl, activeFilter, searchInput.value, currentAppId);

    toggle.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open');
      window.SGO?.closeAllPanels?.();
      if (!wasOpen) {
        panel.classList.add('open');
        toggle.classList.add('active');
        rerender();
      }
    });

    panel.querySelector('.sgo-sp-close').addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.classList.remove('active');
    });

    panel.querySelectorAll('.sgo-gp-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.sgo-gp-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        rerender();
      });
    });

    searchInput.addEventListener('input', rerender);

    LOG('Guides panel initialized (AppID: ' + (currentAppId || 'none') + ')');
  }

  window.SGO = window.SGO || {};
  window.SGO.initGuidesPanel = initGuidesPanel;
})();
