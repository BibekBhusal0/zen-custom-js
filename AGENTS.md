# Code Assistant Context

This document provides context for code assistants working on this Zen Browser customization repository.

## Project Overview

Collection of user scripts and CSS modifications for Zen Browser (Firefox-based). Each feature is self-contained in its own directory. Uses Node.js + Rollup to bundle scripts into `.uc.js` files.

**Key Technologies**: JavaScript (ESM), CSS, Rollup.js, Node.js/npm

## Build Commands

```bash
npm run build                  # Build all mods
npm run build:palette          # Build specific mod (zen-command-palette)
npm run build:browsebot        # Build browse-bot mod
npm run build:reopen           # Build reopen-closed-tabs mod
npm run build:sidebar          # Build floating-sidebar mod
npm run build:select           # Build search-engine-select mod
npm run build:search            # Build settings-shortcuts-search mod
npm run dev                    # Watch mode for all mods
npm run dev:palette            # Watch specific mod
npm run dev:browsebot          # Watch browse-bot mod
npm run dev:reopen             # Watch reopen-closed-tabs mod
npm run dev:sidebar            # Watch floating-sidebar mod
npm run dev:select             # Watch search-engine-select mod
npm run dev:search             # Watch settings-shortcuts-search mod
npm run combine-preferences   # Combine all preferences into root file
npm run format                 # Format code with Prettier
npm run lint                   # Run ESLint
```

**No test framework exists** - manual testing in browser required. Bundled files go to `dist/`.

## Code Style Guidelines

### Imports and Modules

- Use ES6 modules (`import`/`export`)
- Import Firefox globals via `ChromeUtils.importESModule`
- Shared utilities from `utils/` directory
- Relative imports: `../utils/` for shared, `./utils/` for mod-specific

### Formatting (Prettier)

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "arrowParens": "always",
  "bracketSameLine": true,
  "bracketSpacing": true,
  "quoteProps": "as-needed"
}
```

Run `npm run format` before committing. Formatting is also automated on push.

### Naming Conventions

- **Variables/functions**: `camelCase` (`getPreference`, `userConfig`)
- **Classes**: `PascalCase` (`ZenCommandProvider`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RECENT_COMMANDS`, `PREFS`)
- **Private methods**: underscore prefix (`_closeUrlBar`, `_validateInput`)
- **Event handlers**: descriptive (`handleUrlbarClose`, `onUrlbarClose`)
- **DOM elements**: descriptive (`inputField`, `resultElement`)

### Types and Documentation

No TypeScript - use JSDoc comments:

```javascript
/**
 * Executes a command by its key.
 * @param {string} key - The command identifier.
 * @returns {Promise<void>}
 */
async executeCommandByKey(key) { ... }
```

### Error Handling

Wrap potentially failing code in try-catch. Use `debugError(...)` for logging. Return fallback values on errors.

```javascript
try {
  const pref = getPref(key);
  if (!pref.exists()) return defaultValues[key];
  return pref.value;
} catch (e) {
  debugError("Error getting preference:", e);
  return defaultValues[key];
}
```

For simpler operations, the utility functions handle errors internally:

- `getPref(key, defaultValue)` returns defaultValue on error
- `setPref(key, value)` silently fails if pref doesn't exist
- `resetPref(key)` checks if pref exists before clearing

### Debug Logging

- `debugLog(...)` for debug output (only in debug mode)
- `debugError(...)` for errors
- Prefix logs with mod name: `console.log("Palette:", ...args)`
- Debug mode controlled by preference key (`PREFS.DEBUG_MODE`)

### Firefox Integration

- Use `ChromeUtils.importESModule()` for Firefox modules
- Use utility functions from `utils/` for prefs, widgets, and other browser integration
- Pre-defined globals (eslint.config.js): `gBrowser`, `Services`, `ChromeUtils`, etc.

### Preferences Pattern

Use the base `PREFS` class from `utils/pref.js` and extend it for each mod:

```javascript
import { PREFS as BasePREFS, addPrefListener, removePrefListener } from "../../utils/pref.js";

class ModNamePREFS extends BasePREFS {
  static MOD_NAME = "ModName";
  static DEBUG_MODE = "mod-name.debug-mode";
  static ENABLED = "mod-name.enabled";

  static defaultValues = {
    [ModNamePREFS.DEBUG_MODE]: false,
    [ModNamePREFS.ENABLED]: true,
  };

  static get enabled() {
    return this.getPref(this.ENABLED);
  }

  static set enabled(value) {
    this.setPref(this.ENABLED, value);
  }
}

export const PREFS = ModNamePREFS;
```

The base class provides:

- `getPref(key, defaultValue)` - Get a preference value
- `setPref(key, value)` - Set a preference value
- `setInitialPrefs()` - Initialize default preferences
- `debugMode` getter/setter - Access debug mode preference
- `debugLog(...args)` - Log debug messages (only when debugMode is true)
- `debugError(...args)` - Log error messages (only when debugMode is true)

For preference listeners, use the standalone functions:

```javascript
// Add a listener - returns an object with name and callback
const listener = addPrefListener(PREFS.ENABLED, (pref) => {
  console.log("Enabled changed:", pref.value);
});

// Remove the listener later
removePrefListener(listener);
```

### DOM Manipulation

Use `parseElement()` from `utils/parse.js`:

```javascript
import { parseElement } from "../utils/parse.js";
const element = parseElement(`<div class="my-class">Content</div>`);
```

For XUL elements (Firefox UI), specify type:

```javascript
const xulElement = parseElement(`<toolbarbutton id="my-btn"/>`, "xul");
```

Use `escapeXmlAttribute()` for XUL attribute values and `svgToUrl()` for icon handling.

### File Structure

Each mod directory contains: `index.js`, `style.css`, `theme.json`, `preferences.json`, `README.md`, optional `utils/`, optional `release-notes.md`.

### Build Configuration

The Rollup build automatically discovers mods by:

1. Looking for directories with `theme.json` files
2. Checking for `index.js` entry points
3. Generating `.uc.js` bundles using the `theme.json` metadata
4. Special handling for `browse-bot` mod (splits vendor dependencies)

### Commits and PRs

Follow Conventional Commits: `feat(mod-name): description`, `fix(mod-name): description`. Run `npm run format && npm run lint` before committing.

### Publishing

Automated via GitHub Actions. Increment `version` in `theme.json` to trigger release. Versions ending with `b` (e.g., `1.0.1b`) go to beta branch.
