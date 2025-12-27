import { commands as staticCommands } from "./all-commands.js";
import {
  generateAboutPageCommands,
  generateExtensionCommands,
  generateSearchEngineCommands,
  generateSineCommands,
  generateFolderCommands,
  generateWorkspaceMoveCommands,
  generateContainerTabCommands,
  generateActiveTabCommands,
  generateUnloadTabCommands,
  generateExtensionEnableDisableCommands,
  generateExtensionUninstallCommands,
  generateCustomCommands,
} from "./dynamic-commands.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { Storage } from "./utils/storage.js";
import { SettingsModal } from "./settings.js";
import { parseShortcutString } from "../utils/keyboard.js";
import { startupFinish } from "../utils/startup-finish.js";

export const ZenCommandPalette = {
  /**
   * An array of dynamic command providers. Each provider is an object
   * containing a function to generate commands and an optional preference for enabling/disabling.
   * If `pref` is null, the commands will always be included.
   * If `pref` is a string, commands will only be included if the corresponding value in `Prefs` is true.
   * @type {Array<{func: Function, pref: string|null}>}
   */
  _dynamicCommandProviders: [
    {
      func: generateCustomCommands,
      pref: null,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateSearchEngineCommands,
      pref: PREFS.KEYS.DYNAMIC_SEARCH_ENGINES,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateSineCommands,
      pref: PREFS.KEYS.DYNAMIC_SINE_MODS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateWorkspaceMoveCommands,
      pref: PREFS.KEYS.DYNAMIC_WORKSPACES,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateFolderCommands,
      pref: PREFS.KEYS.DYNAMIC_FOLDERS,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateActiveTabCommands,
      pref: PREFS.KEYS.DYNAMIC_ACTIVE_TABS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateContainerTabCommands,
      pref: PREFS.KEYS.DYNAMIC_CONTAINER_TABS,
      allowIcons: false,
      allowShortcuts: true,
    },
    {
      func: generateUnloadTabCommands,
      pref: PREFS.KEYS.DYNAMIC_UNLOAD_TABS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateAboutPageCommands,
      pref: PREFS.KEYS.DYNAMIC_ABOUT_PAGES,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateExtensionCommands,
      pref: PREFS.KEYS.DYNAMIC_EXTENSIONS,
      allowIcons: false,
      allowShortcuts: true,
    },
    {
      func: generateExtensionEnableDisableCommands,
      pref: PREFS.KEYS.DYNAMIC_EXTENSION_ENABLE_DISABLE,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateExtensionUninstallCommands,
      pref: PREFS.KEYS.DYNAMIC_EXTENSION_UNINSTALL,
      allowIcons: false,
      allowShortcuts: false,
    },
  ],
  staticCommands,
  provider: null,
  Settings: null,
  _recentCommands: [],
  MAX_RECENT_COMMANDS: 20,
  _dynamicCommandsCache: null,
  _userConfig: {},
  _closeListenersAttached: false,
  _globalActions: null,

  safeStr(x) {
    return (x || "").toString();
  },

  clearDynamicCommandsCache() {
    this._dynamicCommandsCache = null;
  },

  _closeUrlBar() {
    try {
      gURLBar.value = "";
      if (window.gZenUIManager && typeof window.gZenUIManager.handleUrlbarClose === "function") {
        window.gZenUIManager.handleUrlbarClose(false, false);
        return;
      }

      gURLBar.selectionStart = gURLBar.selectionEnd = 0;
      gURLBar.blur();

      if (gURLBar.view.isOpen) {
        gURLBar.view.close();
      }
    } catch (e) {
      debugError("Error in _closeUrlBar", e);
    }
  },

  /**
   * Adds a command to the list of recently used commands.
   * @param {object} cmd - The command object that was executed.
   */
  addRecentCommand(cmd) {
    if (!cmd || !cmd.key) return;

    const existingIndex = this._recentCommands.indexOf(cmd.key);
    if (existingIndex > -1) {
      this._recentCommands.splice(existingIndex, 1);
    }
    this._recentCommands.unshift(cmd.key);
    if (this._recentCommands.length > this.MAX_RECENT_COMMANDS) {
      this._recentCommands.length = this.MAX_RECENT_COMMANDS;
    }
  },

  /**
   * Checks if a command should be visible based on its `condition` property
   * and the state of its corresponding native <command> element.
   * @param {object} cmd - The command object to check.
   * @returns {boolean} True if the command should be visible, otherwise false.
   */
  commandIsVisible(cmd) {
    try {
      if (this._userConfig.hiddenCommands?.includes(cmd.key)) {
        return false;
      }
      let isVisible = true;

      // First, evaluate an explicit `condition` if it exists.
      if (typeof cmd.condition === "function") {
        isVisible = !!cmd.condition(window);
      } else if (cmd.condition !== undefined) {
        isVisible = cmd.condition !== false;
      }

      // If the command relies on a native <command> element (has no custom function),
      // its visibility is also determined by the element's state.
      if (isVisible && typeof cmd.command !== "function") {
        const commandEl = document.getElementById(cmd.key);
        // The command is only visible if its element exists and is not disabled.
        if (!commandEl || commandEl.disabled) {
          isVisible = false;
        }
      }

      return isVisible;
    } catch (e) {
      debugError("Error evaluating condition for", cmd && cmd.key, e);
      return false;
    }
  },

  /**
   * A VS Code-style fuzzy scoring algorithm.
   * @param {string} target The string to score against.
   * @param {string} query The user's search query.
   * @returns {number} A score representing the match quality.
   */
  calculateFuzzyScore(target, query) {
    if (!target || !query) return 0;

    const targetLower = target.toLowerCase();
    const queryLower = query.toLowerCase();
    const targetLen = target.length;
    const queryLen = query.length;

    if (queryLen > targetLen) return 0;
    if (queryLen === 0) return 0;

    if (targetLower === queryLower) {
      return 200;
    }

    if (targetLower.startsWith(queryLower)) {
      return 100 + queryLen;
    }

    const initials = targetLower
      .split(/[\s-_]+/)
      .map((word) => word[0])
      .join("");
    if (initials === queryLower) {
      return 90 + queryLen;
    }

    let score = 0;
    let queryIndex = 0;
    let lastMatchIndex = -1;
    let consecutiveMatches = 0;

    for (let targetIndex = 0; targetIndex < targetLen; targetIndex++) {
      if (queryIndex < queryLen && targetLower[targetIndex] === queryLower[queryIndex]) {
        let bonus = 10;
        if (targetIndex === 0 || [" ", "-", "_"].includes(targetLower[targetIndex - 1])) {
          bonus += 15;
        }
        if (lastMatchIndex === targetIndex - 1) {
          consecutiveMatches++;
          bonus += 20 * consecutiveMatches;
        } else {
          consecutiveMatches = 0;
        }
        if (lastMatchIndex !== -1) {
          const distance = targetIndex - lastMatchIndex;
          bonus -= Math.min(distance - 1, 10);
        }
        score += bonus;
        lastMatchIndex = targetIndex;
        queryIndex++;
      }
    }
    return queryIndex === queryLen ? score : 0;
  },

  /**
   * Generates a complete, up-to-date list of dynamic commands.
   * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
   */
  async generateDynamicCommands(useCache = true) {
    let dynamicCommands;
    if (useCache && this._dynamicCommandsCache) {
      dynamicCommands = this._dynamicCommandsCache;
    } else {
      const commandSets = await Promise.all(
        this._dynamicCommandProviders.map(async (provider) => {
          const shouldLoad =
            provider.pref === null ? true : provider.pref ? PREFS.getPref(provider.pref) : false;
          if (!shouldLoad) return [];
          try {
            const commands = await provider.func();
            return commands.map((c) => ({ ...c, providerFunc: provider.func }));
          } catch (e) {
            debugError(`Error executing dynamic provider ${provider.func.name}`, e);
            return [];
          }
        })
      );
      dynamicCommands = commandSets.flat();
      if (useCache) {
        this._dynamicCommandsCache = dynamicCommands;
      }
    }
    return dynamicCommands;
  },

  /**
   * Generates a complete, up-to-date list of commands by combining static commands
   * with dynamically generated ones based on current preferences.
   * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
   */
  async generateLiveCommands(useCache = true, isPrefixMode = false) {
    const dynamicCommands = await this.generateDynamicCommands(useCache);
    let allCommands = [...staticCommands, ...dynamicCommands];

    if (isPrefixMode && this._globalActions) {
      const nativeCommands = this._globalActions
        .filter((a) => a.commandId)
        .map((a) => ({
          key: a.commandId,
          label: a.label,
          icon: this._userConfig.customIcons?.[a.commandId] || a.icon,
          isNative: true,
          command: a.command,
          condition: a.isAvailable,
        }));
      allCommands.push(...nativeCommands);
    }

    return allCommands;
  },

  _getProviderLabel(funcName) {
    return (
      funcName
        .replace("generate", "")
        .replace("Commands", "")
        .replace(/([A-Z])/g, " $1")
        .trim() + " Commands"
    );
  },

  /**
   * Generates a complete list of commands for configuration purposes,
   * applying user customizations but not visibility conditions.
   * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
   */
  async getAllCommandsForConfig() {
    // 1. Get all commands from the mod (static and dynamic)
    const modCommands = await this.generateLiveCommands(false); // Force fresh generation
    const liveCommands = modCommands.map((c) => {
      if (c.providerFunc) {
        const provider = this._dynamicCommandProviders.find((p) => p.func === c.providerFunc);
        if (provider) {
          return {
            ...c,
            isDynamic: true,
            providerPref: provider.pref,
            providerLabel: this._getProviderLabel(provider.func.name),
            allowIcons: c.allowIcons ?? provider.allowIcons,
            allowShortcuts: c.allowShortcuts ?? provider.allowShortcuts,
          };
        }
      }
      // It's a static command if it doesn't have a providerFunc
      return { ...c, isDynamic: false, allowIcons: true, allowShortcuts: true };
    });

    // 2. Get all native Zen commands
    if (this._globalActions) {
      const nativeCommands = this._globalActions
        .filter((a) => a.commandId)
        .map((a) => ({
          key: a.commandId,
          label: a.label,
          icon: this._userConfig.customIcons?.[a.commandId] || a.icon,
          isNative: true,
          allowIcons: true,
          allowShortcuts: true,
          command: a.command,
        }));
      liveCommands.push(...nativeCommands);
    }

    // 3. Apply custom icons (for mod commands)
    for (const cmd of liveCommands) {
      if (this._userConfig.customIcons?.[cmd.key]) {
        cmd.icon = this._userConfig.customIcons[cmd.key];
      }
    }
    return liveCommands;
  },

  /**
   * Filters and sorts the command list using a fuzzy-matching algorithm.
   * @param {string} query - The user's search string, without the command prefix.
   * @param {Array<object>} allCommands - The full list of commands to filter.
   * @param {boolean} isPrefixMode - Whether the command palette is in prefix mode.
   * @returns {Array<object>} A sorted array of command objects that match the input.
   */
  filterCommandsByInput(query, allCommands, isPrefixMode) {
    const cleanQuery = this.safeStr(query).trim();

    if (isPrefixMode) {
      if (!cleanQuery) {
        return [];
      }
    } else {
      if (cleanQuery.length < PREFS.minQueryLength) {
        return [];
      }
    }

    const lowerQuery = cleanQuery.toLowerCase();

    const scoredCommands = allCommands
      .map((cmd) => {
        const label = cmd.label || "";
        const key = cmd.key || "";
        const tags = (cmd.tags || []).join(" ");
        const labelScore = this.calculateFuzzyScore(label, lowerQuery);
        const keyScore = this.calculateFuzzyScore(key, lowerQuery);
        const tagsScore = this.calculateFuzzyScore(tags, lowerQuery);
        let recencyBonus = 0;
        const recentIndex = this._recentCommands.indexOf(cmd.key);
        if (recentIndex > -1) {
          recencyBonus = (this.MAX_RECENT_COMMANDS - recentIndex) * 2;
        }
        const score = Math.max(labelScore * 1.5, keyScore, tagsScore * 0.5) + recencyBonus;
        return { cmd, score };
      })
      .filter((item) => item.score >= PREFS.minScoreThreshold)
      .filter((item) => this.commandIsVisible(item.cmd));

    scoredCommands.sort((a, b) => b.score - a.score);
    const finalCmds = scoredCommands.map((item) => item.cmd);

    if (isPrefixMode) {
      return finalCmds.slice(0, PREFS.maxCommandsPrefix);
    }
    return finalCmds.slice(0, PREFS.maxCommands);
  },

  /**
   * Finds a command by its key and executes it.
   * @param {string} key - The key of the command to execute.
   */
  async executeCommandByKey(key) {
    if (!key) return;

    let cmdToExecute;
    const nativeAction = this._globalActions?.find((a) => a.commandId === key);

    const findInCommands = (arr) => arr?.find((c) => c.key === key);
    if (nativeAction) {
      cmdToExecute = { key: nativeAction.commandId, command: nativeAction.command };
    } else {
      cmdToExecute = findInCommands(staticCommands);
    }
    if (!cmdToExecute) {
      const dynamicCommands = await this.generateDynamicCommands(false, false);
      cmdToExecute = findInCommands(dynamicCommands);
    }

    if (cmdToExecute) {
      debugLog("Executing command via key:", key);
      this.addRecentCommand(cmdToExecute);
      if (typeof cmdToExecute.command === "function") {
        cmdToExecute.command(window);
      } else {
        const commandEl = document.getElementById(cmdToExecute.key);
        if (commandEl?.doCommand) {
          commandEl.doCommand();
        } else {
          debugError(`Command element not found for key: ${key}`);
        }
      }
    } else {
      debugError(`executeCommandByKey: Command with key "${key}" could not be found.`);
    }
  },

  async addWidget(key) {
    debugLog(`addWidget called for key: ${key}`);
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
    const widgetId = `zen-cmd-palette-widget-${sanitizedKey}`;

    const existingWidget = document.getElementById(widgetId);
    if (existingWidget) {
      existingWidget.hidden = false;
      debugLog(`Widget "${widgetId}" already exists, un-hiding it.`);
      return;
    }

    const allCommands = await this.getAllCommandsForConfig();
    const cmd = allCommands.find((c) => c.key === key);
    if (!cmd) {
      debugLog(`addWidget: Command with key "${key}" not found.`);
      return;
    }

    try {
      UC_API.Utils.createWidget({
        id: widgetId,
        type: "toolbarbutton",
        label: cmd.label,
        tooltip: cmd.label,
        class: "toolbarbutton-1 chromeclass-toolbar-additional zen-command-widget",
        image: cmd.icon || "chrome://browser/skin/trending.svg",
        callback: () => this.executeCommandByKey(key),
      });
      debugLog(`Successfully created widget "${widgetId}" for command: ${key}`);
    } catch (e) {
      debugError(`Failed to create widget for ${key}:`, e);
    }
  },

  removeWidget(key) {
    debugLog(`removeWidget: Hiding widget for key: ${key}`);
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
    const widgetId = `zen-cmd-palette-widget-${sanitizedKey}`;
    const widget = document.getElementById(widgetId);
    if (widget) {
      widget.hidden = true;
      debugLog(`Successfully hid widget: ${widgetId}`);
    } else {
      debugLog(`removeWidget: Widget "${widgetId}" not found, nothing to hide.`);
    }
  },

  async addHotkey(commandKey, shortcutStr) {
    debugLog(`addHotkey called for command "${commandKey}" with shortcut "${shortcutStr}"`);
    const { key, keycode, modifiers } = parseShortcutString(shortcutStr);
    const useKey = key || keycode;
    if (!useKey) {
      debugError(`addHotkey: Invalid shortcut string "${shortcutStr}" for command "${commandKey}"`);
      return;
    }

    const translatedModifiers = modifiers.replace(/accel/g, "ctrl").replace(/,/g, " ");
    try {
      const hotkey = {
        id: `zen-cmd-palette-shortcut-for-${commandKey}`,
        modifiers: translatedModifiers,
        key: useKey,
        command: () => this.executeCommandByKey(commandKey),
      };
      const registeredHotkey = await UC_API.Hotkeys.define(hotkey);
      if (registeredHotkey) {
        registeredHotkey.autoAttach({ suppressOriginal: true });
        debugLog(`Successfully defined hotkey for command "${commandKey}"`);
      }
    } catch (e) {
      debugError(`Failed to register new shortcut for ${commandKey}:`, e);
    }
  },

  /**
   * Retrieves the keyboard shortcut string for a given command key.
   * @param {string} commandKey - The key of the command (matches shortcut action or id).
   * @returns {string|null} The formatted shortcut string or null if not found.
   */
  getShortcutForCommand(commandKey) {
    // First, check for user-defined custom shortcuts
    if (this._userConfig.customShortcuts?.[commandKey]) {
      return this._userConfig.customShortcuts[commandKey];
    }

    // Then, check Zen's native shortcut manager
    if (
      !window.gZenKeyboardShortcutsManager ||
      !window.gZenKeyboardShortcutsManager._currentShortcutList
    ) {
      return null;
    }
    // A command's key can map to a shortcut's action OR its id.
    const shortcut = window.gZenKeyboardShortcutsManager._currentShortcutList.find(
      (s) => (s.getAction() === commandKey || s.getID() === commandKey) && !s.isEmpty()
    );
    return shortcut ? shortcut.toDisplayString() : null;
  },

  attachUrlbarCloseListeners() {
    if (this._closeListenersAttached) {
      return;
    }

    const onUrlbarClose = () => {
      const isPrefixModeActive = this.provider?._isInPrefixMode ?? false;
      if (this.provider) this.provider.dispose();
      if (isPrefixModeActive) gURLBar.value = "";
    };

    gURLBar.inputField.addEventListener("blur", onUrlbarClose);
    gURLBar.view.panel.addEventListener("popuphiding", onUrlbarClose);
    this._closeListenersAttached = true;
    debugLog("URL bar close listeners attached.");
  },

  /**
   * Loads user customizations from the settings file.
   */
  async loadUserConfig() {
    Storage.reset();
    this._userConfig = await Storage.loadSettings();
    this.clearDynamicCommandsCache();
    debugLog("User config loaded:", this._userConfig);
    this.applyNativeOverrides();
  },

  /**
   * Applies user-configured settings, such as custom shortcuts.
   */
  applyUserConfig() {
    this.applyCustomShortcuts();
    this.applyToolbarButtons();
    this.applyNativeOverrides();
  },

  /**
   * Patches the native global actions array with user customizations like hidden commands and icons.
   */
  applyNativeOverrides() {
    if (!this._globalActions) return;

    for (const action of this._globalActions) {
      if (action.commandId) {
        // Apply custom icon
        if (this._userConfig.customIcons?.[action.commandId]) {
          action.icon = this._userConfig.customIcons[action.commandId];
        }

        // Patch isAvailable to respect hidden commands
        if (!action.isAvailable_patched) {
          const originalIsAvailable = action.isAvailable;
          action.isAvailable = (window) => {
            if (this._userConfig.hiddenCommands?.includes(action.commandId)) {
              return false;
            }
            return originalIsAvailable.call(action, window);
          };
          action.isAvailable_patched = true;
        }
      }
    }
    debugLog("Applied native command overrides (icons and visibility).");
  },

  /**
   * Creates <key> elements for custom shortcuts and adds them to the document.
   */
  async applyCustomShortcuts() {
    if (!this._userConfig.customShortcuts) {
      debugLog("No custom shortcuts to apply on initial load.");
      return;
    }

    for (const [commandKey, shortcutStr] of Object.entries(this._userConfig.customShortcuts)) {
      if (!shortcutStr) continue;
      await this.addHotkey(commandKey, shortcutStr);
    }
    debugLog("Applied initial custom shortcuts.");
  },

  async applyToolbarButtons() {
    if (!this._userConfig?.toolbarButtons) {
      debugLog("No toolbar buttons to apply on initial load.");
      return;
    }

    for (const key of this._userConfig.toolbarButtons) {
      await this.addWidget(key);
    }
    debugLog("Applied initial toolbar buttons.");
  },

  destroy() {
    if (this.provider) {
      const { UrlbarProvidersManager } = ChromeUtils.importESModule(
        "moz-src:///browser/components/urlbar/UrlbarProvidersManager.sys.mjs"
      );
      UrlbarProvidersManager.unregisterProvider(this.provider);
      this.provider = null;
      debugLog("Urlbar provider unregistered.");
    }
  },

  _exitPrefixMode() {
    if (this.provider) this.provider.dispose();
  },

  /**
   * Initializes the command palette by creating and registering the UrlbarProvider.
   * This is the main entry point for the script.
   */
  async init() {
    debugLog("Starting ZenCommandPalette init...");

    try {
      const { globalActions } = ChromeUtils.importESModule(
        "resource:///modules/ZenUBGlobalActions.sys.mjs"
      );
      this._globalActions = globalActions;
    } catch (e) {
      debugError("Could not load native globalActions, native commands will be unavailable.", e);
    }

    this.Settings = SettingsModal;
    this.Settings.init(this);
    debugLog("Settings modal initialized.");

    await this.loadUserConfig();
    this.applyUserConfig();
    debugLog("User config loaded and applied.");

    this.attachUrlbarCloseListeners();

    gURLBar.inputField.addEventListener("keydown", (event) => {
      if (this.provider?._isInPrefixMode && gURLBar.value === "") {
        if (event.key === "Backspace" || event.key === "Escape") {
          event.preventDefault();
          this._exitPrefixMode();
        }
      }
    });

    window.addEventListener("unload", () => this.destroy(), { once: true });

    const { UrlbarUtils, UrlbarProvider } = ChromeUtils.importESModule(
      "moz-src:///browser/components/urlbar/UrlbarUtils.sys.mjs"
    );
    const { UrlbarProvidersManager } = ChromeUtils.importESModule(
      "moz-src:///browser/components/urlbar/UrlbarProvidersManager.sys.mjs"
    );
    const { UrlbarResult } = ChromeUtils.importESModule(
      "moz-src:///browser/components/urlbar/UrlbarResult.sys.mjs"
    );

    if (typeof UrlbarProvider === "undefined" || typeof UrlbarProvidersManager === "undefined") {
      debugError(
        "UrlbarProvider or UrlbarProvidersManager not available; provider not registered."
      );
      return;
    }
    debugLog("Urlbar modules imported.");

    const DYNAMIC_TYPE_NAME = "ZenCommandPalette";
    UrlbarResult.addDynamicResultType(DYNAMIC_TYPE_NAME);
    debugLog(`Dynamic result type "${DYNAMIC_TYPE_NAME}" added.`);

    try {
      const self = this;
      class ZenCommandProvider extends UrlbarProvider {
        _isInPrefixMode = false;

        get name() {
          return "TestProvider";
        }
        get type() {
          return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
        }
        getPriority() {
          return this._isInPrefixMode ? 10000 : 0;
        }

        async isActive(context) {
          try {
            if (this._isInPrefixMode) {
              if (context.searchMode?.engineName) {
                this.dispose();
                return false;
              }
              return true;
            }

            const input = (context.searchString || "").trim();
            const isPrefixSearch = input.startsWith(PREFS.prefix);

            if (context.searchMode?.engineName) {
              return false;
            }

            if (isPrefixSearch) return true;
            if (PREFS.prefixRequired) return false;

            if (input.length >= PREFS.minQueryLength) {
              const liveCommands = await self.generateLiveCommands(true, false);
              return self.filterCommandsByInput(input, liveCommands, false).length > 0;
            }

            return false;
          } catch (e) {
            debugError("isActive error:", e);
            return false;
          }
        }

        async startQuery(context, add) {
          try {
            if (context.canceled) return;
            const input = (context.searchString || "").trim();
            debugLog(`startQuery for: "${input}"`);

            const isEnteringPrefixMode = !this._isInPrefixMode && input.startsWith(PREFS.prefix);
            let query;

            if (isEnteringPrefixMode) {
              this._isInPrefixMode = true;
              gURLBar.setAttribute("zen-cmd-palette-prefix-mode", "true");
              query = input.substring(PREFS.prefix.length).trim();
              gURLBar.value = query;
            } else {
              query = input;
            }

            if (this._isInPrefixMode) PREFS.setTempMaxRichResults(PREFS.maxCommandsPrefix);
            else PREFS.resetTempMaxRichResults();

            if (context.canceled) return;

            const liveCommands = await self.generateLiveCommands(true, this._isInPrefixMode);
            if (context.canceled) return;

            const addResult = (cmd, isHeuristic = false) => {
              if (!cmd) return;
              const shortcut = self.getShortcutForCommand(cmd.key);
              const { payload, payloadHighlights } = UrlbarResult.payloadAndSimpleHighlights([], {
                suggestion: cmd.label,
                title: cmd.label,
                query: input,
                keywords: cmd?.tags,
                icon: cmd.icon || "chrome://browser/skin/trending.svg",
                shortcutContent: shortcut,
                dynamicType: DYNAMIC_TYPE_NAME,
              });
              const result = new UrlbarResult({
                type: UrlbarUtils.RESULT_TYPE.DYNAMIC,
                source: UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                payload,
                payloadHighlights,
              });
              if (isHeuristic) result.heuristic = true;
              result._zenCmd = cmd;
              add(this, result);
              return true;
            };

            if (this._isInPrefixMode && !query) {
              let count = 0;
              const maxResults = PREFS.maxCommandsPrefix;
              const recentCmds = self._recentCommands
                .map((key) => liveCommands.find((c) => c.key === key))
                .filter(Boolean)
                .filter((cmd) => self.commandIsVisible(cmd));

              for (const cmd of recentCmds) {
                if (context.canceled || count >= maxResults) break;
                addResult(cmd, count === 0);
                count++;
              }

              if (count < maxResults) {
                const recentKeys = new Set(self._recentCommands);
                const otherCmds = liveCommands.filter(
                  (c) => !recentKeys.has(c.key) && self.commandIsVisible(c)
                );
                for (const cmd of otherCmds) {
                  if (context.canceled || count >= maxResults) break;
                  addResult(cmd, count === 0);
                  count++;
                }
              }

              if (count === 0 && !context.canceled) {
                addResult({
                  key: "no-results",
                  label: "No available commands",
                  command: () => self._closeUrlBar(),
                  icon: "chrome://browser/skin/zen-icons/info.svg",
                });
              }
              return;
            }

            const matches = self.filterCommandsByInput(query, liveCommands, this._isInPrefixMode);

            if (!matches.length && this._isInPrefixMode) {
              addResult({
                key: "no-results",
                label: "No matching commands found",
                command: () => self._closeUrlBar(),
                icon: "chrome://browser/skin/zen-icons/info.svg",
              });
              return;
            }

            matches.forEach((cmd, index) => addResult(cmd, index === 0));
          } catch (e) {
            debugError("startQuery unexpected error:", e);
          }
        }

        dispose() {
          PREFS.resetTempMaxRichResults();
          gURLBar.removeAttribute("zen-cmd-palette-prefix-mode");
          this._isInPrefixMode = false;
          setTimeout(() => {
            self.clearDynamicCommandsCache();
          }, 0);
        }

        onEngagement(queryContext, controller, details) {
          const cmd = details.result._zenCmd;
          if (cmd) {
            debugLog("Executing command from onEngagement:", cmd.key);
            self._closeUrlBar();
            self.addRecentCommand(cmd);
            setTimeout(() => self.executeCommandByKey(cmd.key), 0);
          }
        }

        getViewUpdate(result) {
          return {
            icon: { attributes: { src: result.payload.icon } },
            titleStrong: { textContent: result.payload.title },
            shortcutContent: { textContent: result.payload.shortcutContent || "" },
          };
        }

        getViewTemplate() {
          return {
            attributes: { selectable: true },
            children: [
              { name: "icon", tag: "img", classList: ["urlbarView-favicon"] },
              {
                name: "title",
                tag: "span",
                classList: ["urlbarView-title"],
                children: [{ name: "titleStrong", tag: "strong" }],
              },
              { name: "shortcutContent", tag: "span", classList: ["urlbarView-shortcutContent"] },
            ],
          };
        }
      }

      this.provider = new ZenCommandProvider();
      UrlbarProvidersManager.registerProvider(this.provider);
      debugLog("Zen Command Palette provider registered.");
    } catch (e) {
      debugError("Failed to create/register Urlbar provider:", e);
    }
  },

  /**
   * Adds a new command to the palette.
   * @param {object} cmd - The command object to add. Must have key, label, and command properties.
   * @returns {object} The command object that was added.
   */
  addCommand(cmd) {
    if (!cmd || !cmd.key || !cmd.label) {
      throw new Error("addCommand: command must have {key, label}");
    }
    this.staticCommands.push(cmd);
    this.clearDynamicCommandsCache();
    return cmd;
  },

  /**
   * Adds multiple commands to the palette.
   * @param {Array<object>} arr - An array of command objects to add.
   * @returns {Array<object>} The full array of commands after addition.
   */
  addCommands(arr) {
    if (!Array.isArray(arr)) throw new Error("addCommands expects an array");
    let addedCount = 0;
    for (const c of arr) {
      // Avoid adding duplicates
      if (!this.staticCommands.some((existing) => existing.key === c.key)) {
        this.addCommand(c);
        addedCount++;
      }
    }
    debugLog(
      "addCommands: added",
      addedCount,
      "items. total static commands:",
      this.staticCommands.length
    );
    return this.staticCommands;
  },

  /**
   * Removes a command from the palette by its key or a predicate function.
   * @param {string|Function} keyOrPredicate - The key of the command to remove, or a function that returns true for the command to be removed.
   * @returns {object|null} The removed command object, or null if not found.
   */
  removeCommand(keyOrPredicate) {
    const idx =
      typeof keyOrPredicate === "function"
        ? this.staticCommands.findIndex(keyOrPredicate)
        : this.staticCommands.findIndex((c) => c.key === keyOrPredicate);
    if (idx >= 0) {
      const [removed] = this.staticCommands.splice(idx, 1);
      this.clearDynamicCommandsCache();
      debugLog("removeCommand:", removed && removed.key);
      return removed;
    }
    return null;
  },

  /**
   * Adds a new dynamic command provider to the palette.
   * @param {Function} func - A function that returns a promise resolving to an array of command objects.
   * @param {string|null} [pref=null] - The preference key that controls if this provider is active.
   * @param {object} [options] - Additional options.
   * @param {boolean} [options.allowIcons=true] - Whether icons for these commands can be changed.
   * @param {boolean} [options.allowShortcuts=true] - Whether shortcuts for these commands can be changed.
   */
  addDynamicCommandsProvider(func, pref, { allowIcons = true, allowShortcuts = true } = {}) {
    if (typeof func !== "function") {
      debugError("addDynamicCommandsProvider: func must be a function.");
      return;
    }
    this._dynamicCommandProviders.push({
      func,
      pref: pref === undefined ? null : pref,
      allowIcons,
      allowShortcuts,
    });
    this.clearDynamicCommandsCache();
  },
};

// Initialization
function init() {
  PREFS.setInitialPrefs();
  window.ZenCommandPalette = ZenCommandPalette;
  ZenCommandPalette.init();

  debugLog(
    "Zen Command Palette initialized. Static commands count:",
    window.ZenCommandPalette.staticCommands.length
  );
}

startupFinish(init);
