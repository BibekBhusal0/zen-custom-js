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

bun run dev                # watch mode, all mods
bun run dev:browsebot      # watch a specific mod

bun run format             # prettier --write .
bun run lint               # eslint .
```

**No test framework** — manual testing in the browser. Bundled output goes to `dist/`.

## Build system quirks

- Mods are discovered by scanning subdirectories for `theme.json` + `index.js` + the `scripts` key in theme.json.
- **Output filename = `theme.id`**, not the directory name. Example: `findbar-ai/` has `id: "browse-bot"` → produces `browse-bot.uc.mjs`.
- Target matching normalizes both the `TARGET` env var and `theme.id` by removing hyphens, then does a substring check. So `TARGET=browsebot` matches `browse-bot`.
- Most mods → IIFE bundle (`uc.js`). Browse-bot → ESM bundle (`browse-bot.uc.mjs`, single file, zero npm dependencies).
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

## Shared design system

Single source of truth: `shared/zen-design.css`. It defines `zenux-*` tokens (colors sourced from `--zen-primary-color`, radii, shadows, easing) and reusable classes, all written with nesting.

Available classes: `zenux-input`, `zenux-btn-primary/ghost/danger/success/warning`, `zenux-icon-btn` with `zenux-icon-btn-danger` and `zenux-icon-btn-accent` (toggle with `is-active`, uses `outline` so enabling never shifts layout), `zenux-section` + `zenux-section-title`, `zenux-count` (+ `zenux-count-accent`, requires both classes), `zenux-empty`, `zenux-combobox` (searchable dropdown, popup uses `zenux-combobox-popup`/`zenux-combobox-item`).

Settings modals share a second source of truth: `shared/settings-modal.js` (`ZenuxSettings` base class plus `attachStandaloneShortcutRecorder`) with visuals in `shared/settings-modal.css`. It provides the overlay shell, tabs, accordion sections with hover-reveal reset buttons, pref rows (checkbox/number/text/textarea/select/shortcut), `data-pref` binding, and shortcut recording. Descriptor-driven `prefRow()`/`prefAccordion()` bake current values into rows/sections so callers never touch controls afterwards. Visibility uses `hidden`, `data-expanded`, and state classes (`is-recording`, `is-conflict`, `is-active`); never set inline styles from settings JS. Mods import the CSS relatively (`@import "../shared/settings-modal.css";`) and build rows/shell via the base class, adding only mod-specific sections on top. `ZenuxSettings.shell()` accepts `overlayId`/`modalClass` so mods can keep scoped overrides (e.g. `.browse-bot-settings-modal` acrylic background).

Rules:

- Mods import it relatively: `@import "../shared/zen-design.css";` as the first line of `style.css`.
- Publishing (`wireSharedCss` in `.github/scripts/publish.js`) copies every referenced `shared/*.css` file into each child repo as `shared-<name>.css` (e.g. `shared-zen-design.css`, `shared-settings-modal.css`) and rewrites the import. Never duplicate shared files per mod.
- Use classes for anything repeated. Prefer a variant over per-action styles.
- Never alias variables (`--x: var(--zenux-y)`). Reference `zenux-*` directly. The only exception is behavioral variables like the browse-bot background-style switcher.
- Interactive classes (`zenux-input`, `zenux-btn-*`, `zenux-icon-btn`) use `!important` throughout because Firefox native and XUL controls need it to lose. Structural classes do not.
- Browser-made elements (XUL `image`, `toolbarbutton`, `menulist`, findbar/URL bar internals) cannot take classes reliably, or shared selectors do not match them (shared icon rules target HTML `img`/`svg`, never XUL `image`). Style those with local CSS mirroring shared values.
- `display` toggles for show-on-hover elements stay local (e.g. reopen tab close button), since shared classes force their own display.
- Icons that can be `jar:`/extension URLs must be XUL `image` via `xulImage()` from `utils/parse.js`. HTML `img` throws a Security Error on those in chrome UI. Recolor context icons with `-moz-context-properties: fill, stroke` plus `fill`/`stroke`.
- Dropdowns use `createCombobox()` from `utils/combobox.js`, never XUL `menulist`. It exposes `.value`, fires `command`, and works with the `data-pref` flow.

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
dist/               # build output (gitignored, rebuilt by CI/publish)
```
