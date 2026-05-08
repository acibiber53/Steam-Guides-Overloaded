document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const appInfoEl = document.getElementById('app-info');
  const noAppidEl = document.getElementById('no-appid');
  const appidDisplay = document.getElementById('appid-display');

  const btnCreate = document.getElementById('btn-create-guide');
  const btnAchieve = document.getElementById('btn-achievements');
  const btnGuides = document.getElementById('btn-guides-hub');

  let currentAppId = null;

  // Robust AppID extraction from common Steam URL patterns
  function extractAppId(url) {
    if (!url) return null;

    const patterns = [
      /store\.steampowered\.com\/app\/(\d+)/,          // Store page
      /steamcommunity\.com\/app\/(\d+)/,               // Community hub
      /steamcommunity\.com\/stats\/(\d+)/,             // Achievements/Stats
      /[?&]appid=(\d+)/,                               // Query param (sharedfiles, guides, etc.)
      /steamcommunity\.com\/sharedfiles\/filedetails\/\?id=\d+&appid=(\d+)/ // Older shared files
    ];

    for (const regex of patterns) {
      const match = url.match(regex);
      if (match) return match[1];
    }
    return null;
  }

  // Query active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url) {
      statusEl.textContent = 'Unable to read current tab.';
      noAppidEl.classList.remove('hidden');
      return;
    }

    const url = tabs[0].url;
    statusEl.textContent = 'Scanning page...';

    const appId = extractAppId(url);

    if (appId) {
      currentAppId = appId;
      appidDisplay.textContent = appId;
      appInfoEl.classList.remove('hidden');
      noAppidEl.classList.add('hidden');
      statusEl.textContent = 'Game context detected.';
      statusEl.style.color = '#a4d007';
    } else {
      appInfoEl.classList.add('hidden');
      noAppidEl.classList.remove('hidden');
      statusEl.textContent = 'No AppID found in URL.';
      statusEl.style.color = '#ff6b6b';
    }
  });

  // Action handlers
  btnCreate.addEventListener('click', () => {
    if (currentAppId) chrome.tabs.create({ url: `https://steamcommunity.com/app/${currentAppId}/guides/` });
  });

  btnAchieve.addEventListener('click', () => {
    if (currentAppId) chrome.tabs.create({ url: `https://steamcommunity.com/stats/${currentAppId}/achievements/` });
  });

  btnGuides.addEventListener('click', () => {
    if (currentAppId) chrome.tabs.create({ url: `https://steamcommunity.com/app/${currentAppId}/guides/?browsesort=trend&filetype=11` });
  });
});