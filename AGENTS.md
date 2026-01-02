# Code Assistant Context

This document provides context for the code assistant to understand the project structure, conventions, and goals.

## Project Overview

This is a collection of user scripts and CSS modifications for the [Zen Browser](https://zen-browser.app/), a Firefox-based browser. The project enhances the browsing experience with features like a command palette, AI integration in the findbar, and UI tweaks.

The project is structured as a monorepo, with each feature residing in its own directory. It uses Node.js and Rollup to bundle and manage the scripts.

### Key Technologies

- **JavaScript (ESM)**: The core language for the user scripts.
- **CSS**: For styling the custom UI elements.
- **Rollup.js**: To bundle multiple script files into a single `.uc.js` file for each mod.
- **Node.js/npm**: For managing dependencies and running build scripts.
- **GitHub Actions**: For automating builds, formatting, and publishing.

## Build and Development Commands

```bash
# Build all mods
npm run build

# Build a specific mod (palette, browsebot, reopen, sidebar, select, search)
npm run build:palette

# Development mode with auto-rebuild for all mods
npm run dev

# Development mode for a specific mod
npm run dev:palette

# Format code
npm run format

# Lint code
npm run lint
```

The bundled files are placed in the `dist/` directory.

## Code Style Guidelines

### Imports and Modules

- Use ES6 modules (`import`/`export`)
- Import Firefox browser globals from ChromeUtils (e.g., `ChromeUtils.importESModule`)
- Import utility functions from `utils/` directory
- Relative imports use `../utils/` for shared utilities, `./utils/` for mod-specific utilities

### Formatting

The project uses Prettier with these settings:

- Print width: 100 characters
- Tab width: 2 spaces (no tabs)
- Semicolons: required
- Quotes: double quotes (single quotes: false)
- Trailing commas: ES5
- Arrow function parentheses: always

Run `npm run format` before committing.

### Types and Documentation

- No TypeScript - use JSDoc comments for type documentation
- Document functions with `@param` and `@returns` tags
- Include `@type {Type}` comments for complex types
- Example:
  ```javascript
  /**
   * Executes a command by its key.
   * @param {string} key - The command identifier.
   * @returns {Promise<void>}
   */
  async executeCommandByKey(key) { ... }
  ```

### Naming Conventions

- **Variables and functions**: `camelCase` (e.g., `getPreference`, `userConfig`)
- **Classes**: `PascalCase` (e.g., `ZenCommandProvider`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RECENT_COMMANDS`, `PREFS`)
- **Private methods**: prefix with underscore (e.g., `_closeUrlBar`, `_validateInput`)
- **Event handlers**: descriptive names like `handleUrlbarClose`, `onUrlbarClose`
- **DOM elements**: descriptive names like `inputField`, `resultElement`

### Error Handling

- Wrap potentially failing code in try-catch blocks
- Use `debugError(...)` for logging errors (only logs in debug mode)
- Return fallback values on errors (e.g., return default config, null, or empty array)
- Example pattern:
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

- Use `debugLog(...)` for debug output (only logs in debug mode)
- Use `debugError(...)` for errors
- Prefix logs with mod name for clarity (e.g., `console.log("BrowseBot:", ...args)`)
- Debug mode is controlled by a preference key (e.g., `PREFS.DEBUG_MODE`)

### Utility Functions

The `utils/` directory contains reusable utilities:

- `parseElement()` from `utils/parse.js` - creates DOM elements from HTML/XUL strings
- `startupFinish()` from `utils/startup-finish.js` - ensures browser is ready before init
- `parseShortcutString()` from `utils/keyboard.js` - parses keyboard shortcuts

### Preferences Pattern

Each mod uses a `PREFS` object to manage settings:

- Define preference keys as constants (e.g., `KEYS.ENABLED`, `KEYS.DEBUG_MODE`)
- Implement getter/setter pairs for commonly accessed prefs
- Store default values in `defaultValues` object
- Use `getPref(key)` and `setPref(key, value)` methods
- Example:
  ```javascript
  export const PREFS = {
    KEYS: {
      ENABLED: "mod-name.enabled",
      DEBUG_MODE: "mod-name.debug-mode",
    },
    getPref(key) { ... },
    setPref(key, value) { ... },
    get enabled() { return this.getPref(this.KEYS.ENABLED); },
    defaultValues: { [PREFS.KEYS.ENABLED]: true },
  };
  ```

### File Structure

Each mod is self-contained in its directory:

- `index.js` - Main entry point and initialization
- `style.css` - Mod-specific styles
- `theme.json` - Metadata (name, version, description) for UserScript header
- `preferences.json` - Optional default settings
- `utils/` - Mod-specific utilities (optional)
- `README.md` - Documentation
- `release-notes.md` - Version history

### Command Pattern

For command palette integration, commands follow this structure:

```javascript
{
  key: "mod:action",           // Unique identifier
  label: "Display Name",      // User-visible text
  icon: "path/to/icon.svg",   // Optional icon
  command: () => {},          // Function to execute
  condition: () => true,     // Optional visibility condition
  tags: ["tag1", "tag2"],     // Optional search tags
}
```

### DOM Manipulation

- Use `parseElement()` from `utils/parse.js` for creating elements from HTML strings
- Use `MozXULElement.parseXULToFragment()` for Firefox XUL elements
- Avoid direct string concatenation for HTML - use template literals or parseElement
- Example:
  ```javascript
  const element = parseElement(`<div class="my-class">Content</div>`);
  container.appendChild(element);
  ```

### Asynchronous Patterns

- Use `async/await` for asynchronous operations
- Handle promises properly with try-catch
- Use `Promise.all()` for parallel operations
- Clean up listeners and resources in destroy/teardown methods

### Firefox Integration

- Use `ChromeUtils.importESModule()` for loading Firefox modules
- Use `UC_API` for accessing Zen Browser API (prefs, widgets, hotkeys)
- Firefox globals are pre-defined in eslint.config.js (gBrowser, Services, etc.)
- Common modules:
  - `browser/components/urlbar/UrlbarUtils.sys.mjs`
  - `browser/components/urlbar/UrlbarProvidersManager.sys.mjs`

### Linting

Run `npm run lint` before committing. The project uses ESLint with these rules:

- `no-unused-vars`: warn
- `no-undef`: warn
- `no-empty`: off

### Commits and Pull Requests

- Commit messages follow Conventional Commits: `feat(mod-name): description`
- Run `npm run format` and `npm run lint` before committing
- Ensure changes are tested before submitting PRs

### Publishing

Publishing is automated via GitHub Actions. To trigger a release, increment the `version` field in a mod's `theme.json` file.
