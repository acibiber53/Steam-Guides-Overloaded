# ??? Development Roadmap: Steam Guides Overloaded

## ?? Project Overview
A Manifest V3 Chrome Extension designed to eliminate friction points in Steam Achievement Guide creation. Focuses on navigation, real-time validation, achievement data handling, and draft safety without replacing Steam's native editor.

---

## ?? Phase 1: Navigation & Quick Access
**Status:** ? Implemented  
**Objective:** Remove web client friction when starting a new guide.

| Feature | Implementation Detail |
|---------|----------------------|
| **AppID Auto-Detect** | Regex extraction from `store.steampowered.com/app/` and `steamcommunity.com/` URLs. Fallback to query params. |
| **Extension Popup** | One-click shortcuts: `Create Guide`, `View Achievements`, `All Guides`. Uses `chrome.tabs.create()`. |
| **Store Page Button** | Injects `[Create Guide]` **before** the native `Community Hub` button on `/app/` pages. Uses `MutationObserver` + `insertBefore()` to preserve layout muscle memory. |
| **Direct Editor Link** | Routes to `https://steamcommunity.com/sharedfiles/editguide/?appid={APPID}` to skip intermediate hub pages. |

**Deliverables:** `manifest.json`, `popup.html/css/js`, `content.js` (store injection hooks)

---

## ?? Phase 2: Editor Enhancement & Validation
**Status:** ?? Next  
**Objective:** Provide real-time guidance inside Steam's dynamic guide editor.

| Feature | Implementation Detail |
|---------|----------------------|
| **Live Character Counters** | Section titles: `0/128` \| Section bodies: `0/8000`. Color thresholds at 75%, 90%, 98%. Auto-trims/paste warnings. |
| **Context-Aware BBCode Validator** | Flags disallowed tags per context (`[h1]` in comments, `[color]` deprecated, broken nesting). Validates `[table]`, `[url]`, `[img]` quirks. |
| **Heading Tag Customization** | Allows users to remap `[h2]`/`[h3]` in settings (reflects `Settings.html` structure). |
| **Steam-Safe DOM Injection** | `MutationObserver` tracks dynamically rendered `<textarea>` containers. Counters/validators render below native toolbar without overlapping. |

**Reference Integration:**  
- `Steam Community __ Guide __ Comprehensive Formatting Help.html` ? Defines exact character limits, allowed tags per section, parser inconsistencies, and deprecated syntax.  
- `Settings.html` ? Foundation for heading tag remapping UI.

**Deliverables:** `content.js` (editor hooks), `validator.js`, `options.html/js`, `content.css`

---

## ?? Phase 3: Achievement Workflow Automation
**Status:** ?? Planned  
**Objective:** Replace manual CSV/image handling with zero-dependency browser tooling.

| Feature | Implementation Detail |
|---------|----------------------|
| **CSV Importer** | Parses `Name|Description|URL` format via `FileReader` API. Matches legacy batch script structure. |
| **In-Browser Image Resizer** | `fetch()` ? `Canvas` ? resize to `64x64` ? export as Data URI or host-ready URL. Replaces `curl` + `magick` workflow. |
| **BBCode Table Generator** | Auto-generates ready-to-paste `[table]` blocks with `[previewicon]` or `[img]` tags. Supports custom column headers. |
| **Multi-Run Heuristic Flagging** | Scans descriptions for keywords (`collect`, `all`, `every`, `X times`, hidden achievements). Tags as `?? Multi-Run` for quick reference. |

**Reference Integration:**  
- `achievement_image_downloader.bat` ? Provides exact CSV delimiter logic, resize condition (`width == height == 64`), and logging structure.

**Deliverables:** `achievement-panel.html/js`, `image-resizer.js`, `bbcode-generator.js`, clipboard export utilities

---

## ?? Phase 4: Preview, Drafts & Polish
**Status:** ?? Planned  
**Objective:** Prevent data loss, improve formatting confidence, and streamline long editing sessions.

| Feature | Implementation Detail |
|---------|----------------------|
| **Live BBCode ? HTML Preview** | Lightweight parser that mimics Steam's quirks (`[hr]` break behavior, `[url]` link filtering, `[spoiler]` text-only rendering). |
| **Autosave Drafts** | Saves to `chrome.storage.local` every 30s. Restores on page reload. Version history (last 5 drafts). |
| **Template System** | Pre-built structures: achievement tables, spoiler-wrapped walkthroughs, heading hierarchies. |
| **Export/Import** | JSON draft backup, clipboard sync, optional cloud sync (future). |

**Deliverables:** `preview-pane.js`, `draft-manager.js`, `templates.json`, `storage-utils.js`

---

## ?? Technical Constraints & Steam Quirks
| Constraint | Mitigation Strategy |
|------------|---------------------|
| **Dynamic DOM Rendering** | Steam injects editor fields asynchronously. All hooks use `MutationObserver` + debounce to avoid race conditions. |
| **Strict Character Limits** | 128 (titles), 8,000 (sections). Counters exclude whitespace/line breaks where possible, but match Steam's raw string length. |
| **BBCode Parser Inconsistencies** | Validator blocks `[color]`, warns on `[h1]` in comments, enforces explicit `[/table]`, strips third-party domains in `[url]`. |
| **Manifest V3 Permissions** | Uses `activeTab`, `storage`, `host_permissions`. No `background` page; service worker only if needed for draft sync later. |
| **CORS & Image Hosting** | Steam blocks cross-origin image fetches in extensions. Canvas resizing runs client-side; external images require manual upload to Steam CDN. |

---

## ?? Reference File Mapping
| File | Used In | Purpose |
|------|---------|---------|
| `achievement_image_downloader.bat` | Phase 3 | Defines CSV format, resize logic, logging structure |
| `Steam Community __ Guide __ Comprehensive Formatting Help.html` | Phase 2 | Authoritative source for tag limits, context rules, parser quirks |
| `Settings.html` | Phase 2 | Foundation for heading tag remapping UI |
| `Sidebar.html` | Phase 3/4 | Layout reference for side panels & reference widgets |

---

## ??? Development Workflow
1. **Branching:** `main` ? `phase-2-validator` ? `phase-3-achievements` ? `phase-4-preview`
2. **Testing:** Load unpacked in `chrome://extensions`, verify on live Steam store/guide pages. Use `console.log` debugging until stable.
3. **Code Standards:** ES6+, Manifest V3 compliant, zero external dependencies, inline comments for DOM hooks.
4. **Next Action:** Implement Phase 2 (`Live Character Counter + Context-Aware BBCode Validator`).

---
*Last Updated: 2026-05-09*  
*Maintainer: [Your Name/GitHub Handle]*