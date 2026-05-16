// src/background/service-worker.js
'use strict';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_GAME_NAME') {
    fetch(`https://store.steampowered.com/api/appdetails?appids=${msg.appid}`)
      .then(r => r.json())
      .then(data => {
        const d = data[msg.appid]?.data;
        sendResponse({
          success: !!d,
          name: d?.name || null,
          icon: d ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${msg.appid}/capsule_231x87.jpg` : null,
          header_image: d?.header_image || null,
          developer: d?.developers?.join(', ') || null,
          publisher: d?.publishers?.join(', ') || null,
          release_date: d?.release_date?.date || null,
          short_description: d?.short_description || null
        });
      })
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }

  if (msg.type === 'DOWNLOAD_IMAGES') {
    const images = msg.images || [];
    let index = 0;
    function downloadNext() {
      if (index >= images.length) {
        sendResponse({ success: true, count: images.length });
        return;
      }
      const { url, filename } = images[index++];
      chrome.downloads.download(
        { url, filename: 'achievements/' + filename, saveAs: false },
        () => setTimeout(downloadNext, 50)
      );
    }
    downloadNext();
    return true;
  }

  if (msg.type === 'SGO_CALL_PAGE_FN') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      func: (fnName) => { if (typeof window[fnName] === 'function') window[fnName](); },
      args: [msg.fn]
    });
    return false;
  }
});
