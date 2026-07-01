# Code Assistant Context

Collection of user scripts and CSS for Zen Browser (Firefox-based). Each feature is a self-contained directory. Bundled into `.uc.js` files via Bun.

**Key technologies**: JavaScript (ESM), CSS, Bun.

## Hands-off policy

Do NOT run `bun build`, `bun format`, `bun lint`, or any CI-related command unless explicitly asked. Build, formatting, and linting are all automated on push (`update-and-build.yml`). You only need to write correct source code.

## Build & dev

```bash
bun run build              # all mods
bun run build:browsebot    # single: TARGET=browsebot bun build.js
bun run build:palette
bun run build:reopen
bun run build:sidebar
bun run build:select
bun run build:search

bun run dev                # watch mode, only findbar-ai (browse-bot)
bun run dev:browsebot      # watch a specific mod

bun run format             # prettier --write .
bun run lint               # eslint .
```

**No test framework** — manual testing in the browser. Bundled output goes to `dist/`.

## Build system quirks

- Mods are discovered by scanning subdirectories for `theme.json` + `index.js` + the `scripts` key in theme.json.
- **Output filename = `theme.id`**, not the directory name. Example: `findbar-ai/` has `id: "browse-bot"` → produces `browse-bot.uc.mjs`.
- Target matching normalizes both the `TARGET` env var and `theme.id` by removing hyphens, then does a substring check. So `TARGET=browsebot` matches `browse-bot`.
- Most mods → IIFE bundle (`uc.js`). Browse-bot → ESM bundle (`uc.mjs`, 2 files: main + `vercel-ai-sdk.uc.mjs` vendor bundle).
- CSS-only mods (e.g., `compact-settings/`) have no `scripts` key in theme.json and are skipped by the build.
- Scripts in `others/` are not bundled — imported directly in `import.uc.mjs`.
- `search-engine-icon/` has no `theme.json` at all — loaded directly as a raw import.

## Active mods

Loaded via `import.uc.mjs`:
- `command-palette/`, `floating-sidebar/`, `reopen-closed-tabs/`, `search-engine-select/`, `search-engine-icon/index.js`
- `dist/browse-bot.uc.mjs` (built from `findbar-ai/`)
- `others/tab-explode.js`, `others/invert-pdf.js`

Styles loaded via `userChrome.css`:
- `floating-sidebar/style.css`, `search-engine-select/style.css`, `findbar-ai/style.css`, `command-palette/style.css`, `reopen-closed-tabs/style.css`
- `css/userChrome.css` (shared utilities)

## Preferences pattern

Every mod that uses prefs extends a base `PREFS` class from `utils/pref.js`:

```javascript
import { PREFS as BasePREFS, addPrefListener, removePrefListener } from "../../utils/pref.js";
```

- `getPref(key, default)` / `setPref(key, value)` / `resetPref(key)` — all handle errors internally.
- `setInitialPrefs()` — call to initialize defaults at startup.
- `debugLog(...)` / `debugError(...)` — gated behind `PREFS.DEBUG_MODE`.
- Listeners: `addPrefListener(key, callback)` returns `{name, callback}`; remove with `removePrefListener(ref)`.
- Pref keys use dotted convention: `mod-name.property` (e.g., `browse-bot.debug-mode`).

## DOM manipulation

Use `parseElement()` from `utils/parse.js` instead of `createElement`:

```javascript
import { parseElement } from "../utils/parse.js";
const el = parseElement(`<div class="foo">text</div>`);
const xulEl = parseElement(`<toolbarbutton id="btn"/>`, "xul");
```

Also available: `escapeXmlAttribute()` for XUL attributes, `svgToUrl()` for icons.

## Firefox globals (from eslint config)

Available without import: `gBrowser`, `gURLBar`, `gZenCompactModeManager`, `gZenPinnedTabManager`, `gZenViewSplitter`, `gZenFolders`, `gZenWorkspaces`, `gContextMenu`, `SineAPI`, `openTrustedLinkIn`, `switchToTabHavingURI`, `BrowserCommands`, `BrowserAddonUI`, `ContextualIdentityService`, `SessionStore`, `PlacesUtils`, `ChromeUtils`, `Components`, `Cc`, `Ci`, `IOUtils`, `AddonManager`, `Services`, `nsKeyShortcutModifiers`, `content`, `addMessageListener`, `sendAsyncMessage`, `JSWindowActorChild`, `JSWindowActorParent`, `TabContextMenu`, `gZenUIManager`.

Import Firefox modules via `ChromeUtils.importESModule(...)`.

## Publishing

- Version lives in each mod's `theme.json`. Bump it to trigger publishing.
- Versions ending in `b` (e.g., `1.0.1b`) → beta branch. Otherwise → main with a release tag.
- Release notes go in the mod's `release-notes.md`.
- Formatting and linting are auto-applied on push via CI.
- Commits follow conventional commits: `feat(mod-name): description`, `fix(mod-name): description`, `chore: ...`.

## Repository layout

```
mod-name/           # each mod is a directory
  index.js          # entry point (must be named index.js)
  style.css         # chrome/content styles
  theme.json        # metadata + id for build output naming
  preferences.json  # optional, Sine preferences
  release-notes.md  # optional, for publishing
utils/              # shared utilities (pref.js, parse.js, etc.)
css/                # shared CSS (userChrome.css, userContent.css)
others/             # non-bundled scripts, loaded directly
dist/               # build output (gitignored except browse-bot files)
```
