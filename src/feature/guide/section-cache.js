// src/feature/guide/section-cache.js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:SectionCache]', msg);

  const CONTENT_KEY_PREFIX = 'sgo_section_content_';
  const SECTIONS_LIST_KEY = 'sgo_guide_sections';
  const FETCH_DELAY_MS = 300;
  const FRESH_MS = 60 * 60 * 1000;          // < 1 hour
  const RECENT_MS = 24 * 60 * 60 * 1000;    // < 24 hours
  const BODY_SELECTOR = '#description, textarea[name="description"], .editGuideSubSectionDescField';
  const TITLE_SELECTOR = '#title, input[name="title"], .editGuideSubSectionTitleField';

  function storageKey(guideId) {
    return CONTENT_KEY_PREFIX + guideId;
  }

  function readStore(guideId) {
    try {
      const raw = localStorage.getItem(storageKey(guideId));
      if (!raw) return { sections: {}, lastFullSync: null, guideUrl: null };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.sections) {
        return { sections: {}, lastFullSync: null, guideUrl: null };
      }
      return parsed;
    } catch (e) {
      LOG('readStore parse error: ' + e.message);
      return { sections: {}, lastFullSync: null, guideUrl: null };
    }
  }

  function writeStore(guideId, store) {
    try {
      localStorage.setItem(storageKey(guideId), JSON.stringify(store));
    } catch (e) {
      LOG('writeStore failed: ' + e.message);
    }
  }

  function readSectionList() {
    try {
      const raw = localStorage.getItem(SECTIONS_LIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];
      return sections.slice().sort((a, b) => a.order - b.order);
    } catch (e) {
      LOG('readSectionList parse error: ' + e.message);
      return [];
    }
  }

  function getAll(guideId) {
    const list = readSectionList();
    const store = readStore(guideId);
    return list.map(sec => {
      const entry = store.sections[sec.id] || null;
      return {
        id: sec.id,
        title: entry?.title || sec.title,
        order: sec.order,
        body: entry?.body ?? null,
        length: entry?.length ?? null,
        fetchedAt: entry?.fetchedAt ?? null,
        source: entry?.source ?? null,
        cached: !!entry
      };
    });
  }

  function get(guideId, sectionId) {
    const store = readStore(guideId);
    return store.sections[sectionId] || null;
  }

  function freshness(entry) {
    if (!entry || !entry.fetchedAt) return 'never';
    const age = Date.now() - entry.fetchedAt;
    if (age < FRESH_MS) return 'fresh';
    if (age < RECENT_MS) return 'recent';
    return 'stale';
  }

  function setEntry(guideId, sectionId, partial) {
    const store = readStore(guideId);
    const prior = store.sections[sectionId] || {};
    store.sections[sectionId] = { ...prior, ...partial };
    store.guideUrl = window.location.origin;
    writeStore(guideId, store);
  }

  function updateLive(guideId, sectionId, body, title) {
    if (!guideId || !sectionId) return;
    const partial = {
      body: body,
      length: body.length,
      fetchedAt: Date.now(),
      source: 'visit'
    };
    if (typeof title === 'string') partial.title = title;
    setEntry(guideId, sectionId, partial);
  }

  function detectLoggedOut(doc) {
    if (!doc) return true;
    const titleEl = doc.querySelector('title');
    const titleText = (titleEl?.textContent || '').toLowerCase();
    if (titleText.includes('sign in') || titleText.includes('login')) return true;
    return !doc.querySelector(BODY_SELECTOR);
  }

  function parseSectionPage(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (detectLoggedOut(doc)) {
      return { loggedOut: true };
    }
    const bodyEl = doc.querySelector(BODY_SELECTOR);
    const titleEl = doc.querySelector(TITLE_SELECTOR);
    return {
      body: bodyEl ? bodyEl.value || bodyEl.textContent || '' : '',
      title: titleEl ? titleEl.value || titleEl.textContent || '' : null
    };
  }

  async function fetchSection(guideId, sectionId) {
    const url = `/sharedfiles/editguidesubsection/?id=${encodeURIComponent(guideId)}&sectionid=${encodeURIComponent(sectionId)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const html = await res.text();
    const parsed = parseSectionPage(html);
    if (parsed.loggedOut) {
      const err = new Error('Logged out');
      err.loggedOut = true;
      throw err;
    }
    return parsed;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function prime(guideId, options) {
    options = options || {};
    const force = !!options.force;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    const skipSectionId = options.skipSectionId || null;

    const list = readSectionList();
    if (list.length === 0) {
      return { fetched: 0, skipped: 0, failed: 0, loggedOut: false };
    }

    const targets = [];
    for (const sec of list) {
      if (sec.id === skipSectionId) continue;
      const entry = get(guideId, sec.id);
      const isStale = freshness(entry) !== 'fresh';
      if (force || isStale) targets.push(sec);
    }

    let fetched = 0;
    let failed = 0;
    let loggedOut = false;
    const errors = [];

    for (let i = 0; i < targets.length; i++) {
      const sec = targets[i];
      onProgress({ phase: 'fetching', index: i, total: targets.length, sectionId: sec.id, title: sec.title });
      try {
        const parsed = await fetchSection(guideId, sec.id);
        setEntry(guideId, sec.id, {
          title: parsed.title || sec.title,
          order: sec.order,
          body: parsed.body,
          length: parsed.body.length,
          fetchedAt: Date.now(),
          source: 'fetch'
        });
        fetched++;
      } catch (err) {
        if (err.loggedOut) {
          loggedOut = true;
          LOG('Aborting prime: user appears logged out');
          break;
        }
        failed++;
        errors.push({ sectionId: sec.id, message: err.message });
        LOG(`Fetch failed for section ${sec.id}: ${err.message}`);
      }
      if (i < targets.length - 1) await sleep(FETCH_DELAY_MS);
    }

    if (!loggedOut && fetched > 0) {
      const store = readStore(guideId);
      store.lastFullSync = Date.now();
      writeStore(guideId, store);
    }

    onProgress({ phase: 'done', fetched, failed, loggedOut, total: targets.length });
    return { fetched, failed, skipped: list.length - targets.length, loggedOut, errors };
  }

  async function refreshOne(guideId, sectionId) {
    const list = readSectionList();
    const sec = list.find(s => s.id === sectionId);
    if (!sec) throw new Error('Section not in list');
    const parsed = await fetchSection(guideId, sectionId);
    setEntry(guideId, sectionId, {
      title: parsed.title || sec.title,
      order: sec.order,
      body: parsed.body,
      length: parsed.body.length,
      fetchedAt: Date.now(),
      source: 'fetch'
    });
    return parsed;
  }

  window.SGO = window.SGO || {};
  window.SGO.SectionCache = {
    getAll,
    get,
    prime,
    refreshOne,
    updateLive,
    freshness,
    readSectionList
  };
})();
