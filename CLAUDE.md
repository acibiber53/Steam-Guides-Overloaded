# CLAUDE.md — Steam Guides Overloaded

> This file supersedes the legacy `README.md` work-process section for all Claude Code sessions.

---

## Project Overview

Steam Guides Overloaded is a **Manifest V3 Chrome extension** that enhances the Steam guide authoring experience. There is **no build step, no bundler, no transpiler, and no `node_modules`**. All JavaScript runs as plain browser scripts injected in-order by the browser.

---

## Directory Structure

```
src/
  background/         service-worker.js — cross-origin message broker
  content.js          URL router + window.SGO namespace bootstrap
  content.css         all extension styles
  core/popup/         extension action popup (isolated popup context)
  feature/
    achievements/     achievement-panel.js
    editor/           template-system.js
    guide/            guides-panel, section-cache, cascade-panel,
                      staging-buffer-panel, editguidesubsection-editor,
                      editguide-helpers, manageguide-sections, game-badge
    navigation/       store-button.js
    settings/         settings-panel.js
  utils/              (empty — shared helpers land here when extracted)
manifest.json
```

---

## Code Standards

### Module Pattern

Every **content script feature file** must be a self-contained IIFE:

```js
(function() {
  'use strict';
  const LOG = msg => console.log('[SGO:ModuleName]', msg);

  // ... implementation ...

  window.SGO = window.SGO || {};
  window.SGO.initModuleName = function() { ... };
})();
```

**Exceptions** — these contexts are isolated by the browser and do not use IIFEs:
- `src/background/service-worker.js` — service worker; uses top-level `'use strict'`
- `src/core/popup/` — popup page; isolated HTML context

### Namespace

Expose feature init functions **only on `window.SGO`**. Never add new top-level globals.

### localStorage Keys

Prefix every key with `sgo_`. Define as named constants at the top of the file — never use inline strings.

**Known key registry:**

| Key | Owner |
|-----|-------|
| `sgo_game_appid` | content.js |
| `sgo_guide_{id}_appid` | content.js / guides-panel |
| `sgo_user_guides` | guides-panel |
| `sgo_settings_autosave_delay` | settings-panel |
| `sgo_settings_autosave_enabled` | settings-panel |
| `sgo_settings_warning_pct` | settings-panel |
| `sgo_settings_critical_pct` | settings-panel |

### CSS and Element IDs

All classes and IDs added by the extension must be prefixed with `sgo-`, following `sgo-{component}-{element}` naming.

### HTML Injection Safety

Always escape dynamic values before inserting into `.innerHTML`. Use a local `escapeHtml()` helper in each file that needs it:

```js
function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = String(text || '');
  return d.innerHTML;
}
```

> `escapeHtml()` is currently duplicated across several files — known smell. `src/utils/` is the intended future home for a shared version.

### Comments

Write no comments by default. Add one only when the **why** is non-obvious: a hidden constraint, a subtle invariant, or a workaround for a specific browser bug.

### Anti-Patterns — Never Do These

- Add `node_modules`, a bundler, or any build step
- Add new top-level globals besides `window.SGO`
- Use raw string interpolation into `.innerHTML` with untrusted data
- Add new permissions to `manifest.json` without a security note in the commit message
- Use `chrome.storage` — `localStorage` is the established convention; keep it consistent
- Add a new Chrome message type without updating the message-passing table below
- Chain git commands with `&&` in PowerShell — use `; if ($?) { ... }` guards or the Bash tool

---

## Message-Passing Contract

Content scripts talk to the service worker via `chrome.runtime.sendMessage`. All message types:

| `msg.type` | Purpose | Required fields |
|------------|---------|-----------------|
| `FETCH_GAME_NAME` | Fetch game metadata from the Steam API | `appid` |
| `DOWNLOAD_IMAGES` | Batch-download achievement images | `images: [{url, filename}]` |
| `SGO_CALL_PAGE_FN` | Invoke a named function in the page's MAIN world | `fn` (string) |

When adding a new message type: add its handler in `service-worker.js` **and** add a row to this table in the same commit.

---

## Routing — How to Add a New Feature

Content scripts run on every matching page; `content.js` gates initialisation by URL. Checklist:

1. Create `src/feature/{area}/{feature-name}.js` as an IIFE; register `window.SGO.initFeatureName`
2. Add the file to the `"js"` array in `manifest.json` **before** `src/content.js`, and after any files it depends on (load order is significant)
3. Call `window.SGO?.initFeatureName?.()` from the relevant `case` block in `content.js`
4. Add styles to `src/content.css`

**Known load-order dependencies:**
- `section-cache.js` must precede `cascade-panel.js`
- `settings-panel.js` must precede `editguidesubsection-editor.js` (editor reads settings at init time)

---

## Manifest Rules

- `"matches"` patterns — never broader than needed
- All content scripts live in the single `"content_scripts"` entry — do not add additional entries
- Permissions are locked at `["activeTab", "storage", "downloads", "scripting"]` — any addition requires a security note in the commit

---

## Git & GitHub Workflow — Two-Branch Model

| Branch | Purpose |
|--------|---------|
| `dev` | Working branch — all commits land here, pushed immediately |
| `main` | Stable branch — only promoted from `dev` with explicit user approval |

### Committing

- Commit at **logical units of work** (a complete feature, a named bug fix, a clean refactor) — not after every individual file save
- Format: `<type>: <short description>` — types: `feat`, `fix`, `refactor`, `style`, `docs`
- Push to `origin dev` immediately after every commit (pre-authorized in `.claude/settings.json`)
- Never force-push either branch

### Promoting dev → main

Only when the user explicitly says yes. Run via the Bash tool:

```bash
git checkout main && git merge dev && git push origin main && git checkout dev && git merge main && git push origin dev
```

### End of Session

At the end of every session Claude will ask whether to promote `dev` to `main`. Never act on the promotion without an explicit "yes."

---

## Verification / Manual Testing

No automated test suite exists. After any change:

1. Go to `chrome://extensions` → click **Reload** on Steam Guides Overloaded
2. Navigate to the relevant page (store app page, `manageguide`, `editguidesubsection`, etc.)
3. Open DevTools → Console — confirm `[SGO:*]` log lines appear with no JS errors
4. Exercise the changed feature; verify other panels still open/close correctly
