// src/feature/settings/settings-panel.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:Settings]', msg);

  const AUTOSAVE_DELAY_KEY = 'sgo_settings_autosave_delay';
  const AUTOSAVE_DELAY_DEFAULT = 5;
  const AUTOSAVE_ENABLED_KEY = 'sgo_settings_autosave_enabled';
  const WARNING_PCT_KEY = 'sgo_settings_warning_pct';
  const CRITICAL_PCT_KEY = 'sgo_settings_critical_pct';
  const WARNING_PCT_DEFAULT = 75;
  const CRITICAL_PCT_DEFAULT = 90;

  function getAutoSaveDelay() {
    return parseInt(localStorage.getItem(AUTOSAVE_DELAY_KEY) || String(AUTOSAVE_DELAY_DEFAULT), 10);
  }

  function isAutoSaveEnabled() {
    return localStorage.getItem(AUTOSAVE_ENABLED_KEY) !== 'false';
  }

  function getWarningPct() {
    return parseInt(localStorage.getItem(WARNING_PCT_KEY) || String(WARNING_PCT_DEFAULT), 10) / 100;
  }

  function getCriticalPct() {
    return parseInt(localStorage.getItem(CRITICAL_PCT_KEY) || String(CRITICAL_PCT_DEFAULT), 10) / 100;
  }

  function renderPanel(panel) {
    const delay = getAutoSaveDelay();
    const enabled = isAutoSaveEnabled();
    panel.innerHTML = `
      <div class="sgo-sp-header"><span>⚙ Settings</span></div>
      <div class="sgo-settings-body">
        <div class="sgo-settings-row">
          <label class="sgo-settings-label" for="sgo-autosave-enabled">Auto-save</label>
          <label class="sgo-settings-toggle-wrap">
            <input type="checkbox" id="sgo-autosave-enabled" ${enabled ? 'checked' : ''}>
            <span class="sgo-settings-toggle-label">${enabled ? 'On' : 'Off'}</span>
          </label>
        </div>
        <div class="sgo-settings-row">
          <label class="sgo-settings-label" for="sgo-autosave-delay">Auto-save delay (seconds)</label>
          <input type="number" id="sgo-autosave-delay" class="sgo-settings-input" min="1" max="60" value="${delay}">
        </div>
        <div class="sgo-settings-row">
          <label class="sgo-settings-label" for="sgo-warning-pct">Yellow warning threshold (%)</label>
          <input type="number" id="sgo-warning-pct" class="sgo-settings-input" min="1" max="99" value="${Math.round(getWarningPct() * 100)}">
        </div>
        <div class="sgo-settings-row">
          <label class="sgo-settings-label" for="sgo-critical-pct">Red critical threshold (%)</label>
          <input type="number" id="sgo-critical-pct" class="sgo-settings-input" min="1" max="100" value="${Math.round(getCriticalPct() * 100)}">
        </div>
        <span class="sgo-settings-saved-notice"></span>
      </div>
    `;

    const notice = panel.querySelector('.sgo-settings-saved-notice');
    let hideTimer = null;
    function showSaved() {
      notice.textContent = 'Saved';
      notice.classList.add('visible');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => notice.classList.remove('visible'), 1500);
      document.dispatchEvent(new CustomEvent('sgo:settings-changed'));
    }

    const checkbox = panel.querySelector('#sgo-autosave-enabled');
    const toggleLabel = panel.querySelector('.sgo-settings-toggle-label');
    checkbox.addEventListener('change', () => {
      localStorage.setItem(AUTOSAVE_ENABLED_KEY, String(checkbox.checked));
      toggleLabel.textContent = checkbox.checked ? 'On' : 'Off';
      showSaved();
    });

    panel.querySelector('#sgo-autosave-delay').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= 1 && val <= 60) { localStorage.setItem(AUTOSAVE_DELAY_KEY, String(val)); showSaved(); }
    });

    panel.querySelector('#sgo-warning-pct').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= 1 && val <= 99) { localStorage.setItem(WARNING_PCT_KEY, String(val)); showSaved(); }
    });

    panel.querySelector('#sgo-critical-pct').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= 1 && val <= 100) { localStorage.setItem(CRITICAL_PCT_KEY, String(val)); showSaved(); }
    });
  }

  function init() {
    if (document.getElementById('sgo-settings-toggle')) return;

    const toggle = document.createElement('div');
    toggle.className = 'sgo-sidepanel-toggle';
    toggle.id = 'sgo-settings-toggle';
    toggle.innerHTML = '<span class="toggle-icon">⚙</span><span class="toggle-text">Settings</span>';

    const panel = document.createElement('div');
    panel.className = 'sgo-sidepanel';
    panel.id = 'sgo-settings-panel';

    toggle.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open');
      window.SGO?.closeAllPanels?.();
      if (!wasOpen) {
        renderPanel(panel);
        panel.classList.add('open');
        toggle.classList.add('active');
      }
    });

    (window.SGO?.getToggleBar?.() || document.body).appendChild(toggle);
    (window.SGO?.getPanelArea?.() || document.body).appendChild(panel);

    LOG('Settings panel initialized');
  }

  window.SGO = window.SGO || {};
  window.SGO.SettingsPanel = { init, getAutoSaveDelay, isAutoSaveEnabled, getWarningPct, getCriticalPct };
})();
