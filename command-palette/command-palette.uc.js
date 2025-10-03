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
import { Prefs, debugLog, debugError } from "./utils/prefs.js";
import { Storage } from "./utils/storage.js";
import { SettingsModal } from "./settings.js";
import { parseShortcutString } from "../utils/keyboard.js";

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");

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
      pref: Prefs.KEYS.DYNAMIC_SEARCH_ENGINES,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateSineCommands,
      pref: Prefs.KEYS.DYNAMIC_SINE_MODS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateWorkspaceMoveCommands,
      pref: Prefs.KEYS.DYNAMIC_WORKSPACES,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateFolderCommands,
      pref: Prefs.KEYS.DYNAMIC_FOLDERS,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateActiveTabCommands,
      pref: Prefs.KEYS.DYNAMIC_ACTIVE_TABS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateContainerTabCommands,
      pref: Prefs.KEYS.DYNAMIC_CONTAINER_TABS,
      allowIcons: false,
      allowShortcuts: true,
    },
    {
      func: generateUnloadTabCommands,
      pref: Prefs.KEYS.DYNAMIC_UNLOAD_TABS,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateAboutPageCommands,
      pref: Prefs.KEYS.DYNAMIC_ABOUT_PAGES,
      allowIcons: true,
      allowShortcuts: true,
    },
    {
      func: generateExtensionCommands,
      pref: Prefs.KEYS.DYNAMIC_EXTENSIONS,
      allowIcons: false,
      allowShortcuts: true,
    },
    {
      func: generateExtensionEnableDisableCommands,
      pref: Prefs.KEYS.DYNAMIC_EXTENSION_ENABLE_DISABLE,
      allowIcons: false,
      allowShortcuts: false,
    },
    {
      func: generateExtensionUninstallCommands,
      pref: Prefs.KEYS.DYNAMIC_EXTENSION_UNINSTALL,
      allowIcons: false,
      allowShortcuts: false,
    },
  ],
  staticCommands,
  Settings: null,
  _dynamicCommandsCache: null,
  _commandVisibilityCache: {},
  _userConfig: {},
  _syncTimeout: null,
  _globalActions: null,
  _browserStateListeners: null,
  _addonListener: null,

  safeStr(x) {
    return (x || "").toString();
  },

  clearDynamicCommandsCache() {
    this._dynamicCommandsCache = null;
  },

  _closeUrlBar() {
    try {
      if (gURLBar.view.isOpen) {
        gURLBar.handleRevert();
      }
    } catch (e) {
      debugError("Error in _closeUrlBar", e);
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
      const cacheKey = cmd ? cmd.key : null;
      if (cacheKey && this._commandVisibilityCache[cacheKey] !== undefined) {
        return this._commandVisibilityCache[cacheKey];
      }

      if (this._userConfig.hiddenCommands?.includes(cacheKey)) {
        if (cacheKey) this._commandVisibilityCache[cacheKey] = false;
        return false;
      }
      let isVisible = true;

      // First, evaluate an explicit `condition` if it exists.
      if (typeof cmd.condition === "function") {
        isVisible = !!cmd.condition();
      } else if (cmd.condition !== undefined) {
        isVisible = cmd.condition !== false;
      }

      // If the command relies on a native <command> element (has no custom function),
      // its visibility is also determined by the element's state.
      if (isVisible && !cmd.command) {
        const commandEl = document.getElementById(cmd.key);
        // The command is only visible if its element exists and is not disabled.
        if (!commandEl || commandEl.disabled) {
          isVisible = false;
        }
      }

      if (cacheKey) this._commandVisibilityCache[cacheKey] = isVisible;
      return isVisible;
    } catch (e) {
      debugError("Error evaluating condition for", cmd && cmd.key, e);
      return false;
    }
  },

  /**
   * Generates a complete, up-to-date list of commands by combining static commands
   * with dynamically generated ones based on current preferences.
   * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
   */
  async generateLiveCommands(createCache = true) {
    let dynamicCommands;
    if (this._dynamicCommandsCache) {
      dynamicCommands = this._dynamicCommandsCache;
    } else {
      const commandPromises = [];
      for (const provider of this._dynamicCommandProviders) {
        const shouldLoad =
          provider.pref === null ? true : provider.pref ? Prefs.getPref(provider.pref) : false;
        if (shouldLoad) {
          try {
            commandPromises.push(provider.func());
          } catch {}
        }
      }
      const commandSets = await Promise.all(commandPromises);
      dynamicCommands = commandSets.flat();
      if (createCache) this._dynamicCommandsCache = dynamicCommands;
    }

    let allCommands = [...staticCommands, ...dynamicCommands];

    // Apply custom icons from user config
    for (const cmd of allCommands) {
      if (this._userConfig.customIcons?.[cmd.key]) {
        cmd.icon = this._userConfig.customIcons[cmd.key];
      }
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
    let liveCommands = [...staticCommands.map((c) => ({ ...c, isDynamic: false }))];

    const commandPromises = [];
    for (const provider of this._dynamicCommandProviders) {
      const shouldLoad = provider.pref === null ? true : Prefs.getPref(provider.pref);
      if (shouldLoad) {
        const promise = provider.func().then((commands) => {
          return commands.map((cmd) => ({
            ...cmd,
            isDynamic: true,
            providerPref: provider.pref,
            providerLabel: this._getProviderLabel(provider.func.name),
            allowIcons: cmd.allowIcons ?? provider.allowIcons,
            allowShortcuts: cmd.allowShortcuts ?? provider.allowShortcuts,
          }));
        });
        commandPromises.push(promise);
      }
    }

    const commandSets = await Promise.all(commandPromises);
    liveCommands.push(...commandSets.flat());

    // Apply custom icons
    for (const cmd of liveCommands) {
      if (this._userConfig.customIcons?.[cmd.key]) {
        cmd.icon = this._userConfig.customIcons[cmd.key];
      }
    }

    return liveCommands;
  },

  /**
   * Safely executes a command's action within a try-catch block.
   * @param {object} cmd - The command object to execute.
   */
  executeCommandObject(cmd) {
    if (!cmd) {
      debugError("executeCommandObject: no command");
      return;
    }

    try {
      // Prioritize explicit command function if it exists.
      if (cmd.command && typeof cmd.command === "function") {
        debugLog("Executing command via function:", cmd.key || cmd.label);
        const ret = cmd.command();
        if (ret && typeof ret.then === "function") {
          ret.catch((e) => debugError("Command promise rejected:", e));
        }
        return; // Execution handled.
      }

      // Fallback for commands that rely on a DOM element.
      const commandEl = document.getElementById(cmd.key);
      if (commandEl && typeof commandEl.doCommand === "function") {
        debugLog("Executing command via doCommand fallback:", cmd.key);
        commandEl.doCommand();
      } else {
        debugError("Command has no executable action:", cmd.key);
      }
    } catch (e) {
      debugError("Command execution error:", e);
    }
  },

  /**
   * Finds a command by its key and executes it.
   * @param {string} key - The key of the command to execute.
   */
  async executeCommandByKey(key) {
    if (!key) return;
    const allCommands = await this.generateLiveCommands(false);
    const cmd = allCommands.find((c) => c.key === key);
    if (cmd) {
      this._closeUrlBar();
      this.executeCommandObject(cmd);
    } else {
      debugError(`executeCommandByKey: Command with key "${key}" not found.`);
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

  /**
   * Loads user customizations from the settings file.
   */
  async loadUserConfig() {
    Storage.reset();
    this._userConfig = await Storage.loadSettings();
    this.clearDynamicCommandsCache();
    debugLog("User config loaded:", this._userConfig);
    this.queueSyncWithNativeActions();
  },

  /**
   * Applies user-configured settings, such as custom shortcuts.
   */
  applyUserConfig() {
    this.applyCustomShortcuts();
    this.applyToolbarButtons();
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

  queueSyncWithNativeActions() {
    if (this._syncTimeout) return;
    this._syncTimeout = setTimeout(() => {
      this._syncTimeout = null;
      this._syncWithNativeActions();
    }, 100); // Debounce for 100ms
  },

  async _syncWithNativeActions() {
    if (!this._globalActions) return;
    debugLog("Syncing commands with native command palette...");

    // 1. Clear caches
    this.clearDynamicCommandsCache();
    this._commandVisibilityCache = {};

    // 2. Remove our old commands from the native list
    let i = this._globalActions.length;
    while (i--) {
      if (this._globalActions[i]._isZenModCommand) {
        this._globalActions.splice(i, 1);
      }
    }

    // 3. Generate our fresh list of commands
    const myCommands = await this.generateLiveCommands();

    // 4. Map them to the native format
    const myNativeCommands = myCommands.map((cmd) => {
      const isFunc = typeof cmd.command === "function";
      return {
        label: cmd.label,
        command: isFunc
          ? () => {
              this._closeUrlBar();
              // Use timeout to let the urlbar close before execution
              setTimeout(() => this.executeCommandObject(cmd), 0);
            }
          : cmd.key,
        icon: cmd.icon || "chrome://browser/skin/trending.svg",
        isAvailable: () => this.commandIsVisible(cmd),
        commandId: cmd.key,
        extraPayload: {},
        _isZenModCommand: true, // Custom flag to identify our commands
      };
    });

    // 5. Add them back to the native list
    this._globalActions.push(...myNativeCommands);
    debugLog(`Sync complete. Total native commands: ${this._globalActions.length}`);
  },

  _addBrowserStateListeners() {
    const debouncedSync = () => this.queueSyncWithNativeActions();

    this._browserStateListeners = {
      TabOpen: debouncedSync,
      TabClose: debouncedSync,
      TabSelect: debouncedSync,
      TabAttrModified: debouncedSync,
    };

    for (const [event, listener] of Object.entries(this._browserStateListeners)) {
      gBrowser.tabContainer.addEventListener(event, listener);
    }

    window.addEventListener("ZenWorkspace:changed", debouncedSync);
    window.addEventListener("ZenWorkspace:updated", debouncedSync);

    this._addonListener = {
      onEnabled: debouncedSync,
      onDisabled: debouncedSync,
      onInstalled: debouncedSync,
      onUninstalled: debouncedSync,
    };
    AddonManager.addAddonListener(this._addonListener);
    debugLog("Added browser state listeners for dynamic command updates.");
  },

  _removeBrowserStateListeners() {
    const debouncedSync = () => this.queueSyncWithNativeActions();

    if (this._browserStateListeners) {
      for (const [event, listener] of Object.entries(this._browserStateListeners)) {
        gBrowser.tabContainer.removeEventListener(event, listener);
      }
      this._browserStateListeners = null;
    }

    window.removeEventListener("ZenWorkspace:changed", debouncedSync);
    window.removeEventListener("ZenWorkspace:updated", debouncedSync);

    if (this._addonListener) {
      AddonManager.removeAddonListener(this._addonListener);
      this._addonListener = null;
    }
    debugLog("Removed browser state listeners.");
  },

  destroy() {
    this._removeBrowserStateListeners();
    // On unload, remove our commands from the native array
    if (this._globalActions) {
      let i = this._globalActions.length;
      while (i--) {
        if (this._globalActions[i]._isZenModCommand) {
          this._globalActions.splice(i, 1);
        }
      }
      debugLog("Removed mod commands from native globalActions.");
    }
  },

  /**
   * Initializes the command palette by integrating with the native command system.
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
      debugError("Could not load native globalActions. The mod will not function.", e);
      return;
    }

    this.Settings = SettingsModal;
    this.Settings.init(this);
    debugLog("Settings modal initialized.");

    await this.loadUserConfig();
    this.applyUserConfig();
    debugLog("User config loaded and applied.");

    this._addBrowserStateListeners();
    this.queueSyncWithNativeActions();

    window.addEventListener("unload", () => this.destroy(), { once: true });

    debugLog("Zen Command Palette integration initialized.");
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
    this.queueSyncWithNativeActions();
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
    // Sync is already queued by addCommand
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
      debugLog("removeCommand:", removed && removed.key);
      this.queueSyncWithNativeActions();
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
    this.queueSyncWithNativeActions();
  },
};

// --- Initialization ---
UC_API.Runtime.startupFinished().then(() => {
  Prefs.setInitialPrefs();
  window.ZenCommandPalette = ZenCommandPalette;
  ZenCommandPalette.init();

  debugLog(
    "Zen Command Palette initialized. Static commands count:",
    window.ZenCommandPalette.staticCommands.length
  );
});
