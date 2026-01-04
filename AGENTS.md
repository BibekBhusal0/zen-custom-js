# Code Assistant Context

This document provides context for code assistants working on this Zen Browser customization repository.

## Project Overview

Collection of user scripts and CSS modifications for Zen Browser (Firefox-based). Each feature is self-contained in its own directory. Uses Node.js + Rollup to bundle scripts into `.uc.js` files.

**Key Technologies**: JavaScript (ESM), CSS, Rollup.js, Node.js/npm

## Build Commands

```bash
npm run build                  # Build all mods
npm run build:palette          # Build specific mod
npm run build:browsebot
npm run build:reopen
npm run build:sidebar
npm run build:select
npm run build:search
npm run dev                    # Watch mode for all mods
npm run dev:palette            # Watch specific mod
npm run dev:browsebot
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
  "arrowParens": "always"
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
  const pref = UC_API.Prefs.get(key);
  if (!pref.exists()) return defaultValues[key];
  return pref.value;
} catch (e) {
  debugError("Error getting preference:", e);
  return defaultValues[key];
}
```

### Debug Logging

- `debugLog(...)` for debug output (only in debug mode)
- `debugError(...)` for errors
- Prefix logs with mod name: `console.log("Palette:", ...args)`
- Debug mode controlled by preference key (`PREFS.DEBUG_MODE`)

### Firefox Integration

- Use `ChromeUtils.importESModule()` for Firefox modules
- Use `UC_API` for Zen Browser API (prefs, widgets, hotkeys)
- Pre-defined globals (eslint.config.js): `gBrowser`, `Services`, `ChromeUtils`, etc.

### Preferences Pattern

```javascript
export const PREFS = {
  KEYS: { ENABLED: "mod-name.enabled", DEBUG_MODE: "mod-name.debug-mode" },
  getPref(key) { ... },
  setPref(key, value) { ... },
  get enabled() { return this.getPref(this.KEYS.ENABLED); },
  defaultValues: { [PREFS.KEYS.ENABLED]: true },
};
```

### DOM Manipulation

Use `parseElement()` from `utils/parse.js`:

```javascript
import { parseElement } from "../utils/parse.js";
const element = parseElement(`<div class="my-class">Content</div>`);
```

### File Structure

Each mod directory contains: `index.js`, `style.css`, `theme.json`, `preferences.json`, `README.md`, optional `utils/`, optional `release-notes.md`.

### Commits and PRs

Follow Conventional Commits: `feat(mod-name): description`, `fix(mod-name): description`. Run `npm run format && npm run lint` before committing.

### Publishing

Automated via GitHub Actions. Increment `version` in `theme.json` to trigger release. Versions ending with `b` (e.g., `1.0.1b`) go to beta branch.
