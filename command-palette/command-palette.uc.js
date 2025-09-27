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

const ZenCommandPalette = {
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
  provider: null,
  Settings: null,
  _recentCommands: [],
  MAX_RECENT_COMMANDS: 20,
  _dynamicCommandsCache: null,
  _commandVisibilityCache: {},
  _userConfig: {},
  _boundHandleKeysetCommand: null,

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

    // Remove if it already exists to move it to the front.
    const existingIndex = this._recentCommands.indexOf(cmd.key);
    if (existingIndex > -1) {
      this._recentCommands.splice(existingIndex, 1);
    }

    // Add to the front of the list.
    this._recentCommands.unshift(cmd.key);

    // Trim the list to the maximum allowed size.
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
      if (cmd && cmd.key && this._commandVisibilityCache[cmd.key] !== undefined) {
        return this._commandVisibilityCache[cmd.key];
      }

      if (this._userConfig.hiddenCommands?.includes(cmd.key)) {
        if (cmd && cmd.key) this._commandVisibilityCache[cmd.key] = false;
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

      if (cmd && cmd.key) this._commandVisibilityCache[cmd.key] = isVisible;
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

    // 1. Exact match gets the highest score.
    if (targetLower === queryLower) {
      return 200;
    }

    // 2. Exact prefix matches are heavily prioritized.
    if (targetLower.startsWith(queryLower)) {
      return 100 + queryLen;
    }

    // 3. Exact abbreviation (e.g., 'tcm' for 'Toggle Compact Mode')
    const initials = targetLower
      .split(/[\s-_]+/)
      .map((word) => word[0])
      .join("");
    if (initials === queryLower) {
      return 90 + queryLen;
    }

    // 4. Calculate score based on character match
    let score = 0;
    let queryIndex = 0;
    let lastMatchIndex = -1;
    let consecutiveMatches = 0;

    for (let targetIndex = 0; targetIndex < targetLen; targetIndex++) {
      if (queryIndex < queryLen && targetLower[targetIndex] === queryLower[queryIndex]) {
        let bonus = 10;

        // Bonus for matching at the beginning of a word
        if (targetIndex === 0 || [" ", "-", "_"].includes(targetLower[targetIndex - 1])) {
          bonus += 15;
        }

        // Bonus for consecutive matches
        if (lastMatchIndex === targetIndex - 1) {
          consecutiveMatches++;
          bonus += 20 * consecutiveMatches;
        } else {
          consecutiveMatches = 0;
        }

        // Penalty for distance from the last match
        if (lastMatchIndex !== -1) {
          const distance = targetIndex - lastMatchIndex;
          bonus -= Math.min(distance - 1, 10); // Cap penalty
        }

        score += bonus;
        lastMatchIndex = targetIndex;
        queryIndex++;
      }
    }

    return queryIndex === queryLen ? score : 0;
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
   * Filters and sorts the command list using a fuzzy-matching algorithm.
   * @param {string} input - The user's search string from the URL bar.
   * @param {Array<object>} allCommands - The full list of commands to filter.
   * @returns {Array<object>} A sorted array of command objects that match the input.
   */
  filterCommandsByInput(input, allCommands) {
    let query = this.safeStr(input).trim();
    const isCommandPrefix = query.startsWith(Prefs.prefix);
    if (isCommandPrefix) {
      query = query.substring(1).trim();
    }

    // If the input was just the prefix, show a capped number of available commands.
    // now handled asynchronously in startQuery
    if (isCommandPrefix && !query) {
      return [];
    }

    // For non-prefixed queries, only show results if the query is long enough.
    if (!isCommandPrefix && query.length < Prefs.minQueryLength) {
      return [];
    }

    if (!query) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    const scoredCommands = allCommands
      .map((cmd) => {
        const label = cmd.label || "";
        const key = cmd.key || "";
        const tags = (cmd.tags || []).join(" ");

        // Calculate scores for different fields
        const labelScore = this.calculateFuzzyScore(label, lowerQuery);
        const keyScore = this.calculateFuzzyScore(key, lowerQuery);
        const tagsScore = this.calculateFuzzyScore(tags, lowerQuery);

        // Add a bonus for recently used commands.
        let recencyBonus = 0;
        const recentIndex = this._recentCommands.indexOf(cmd.key);
        if (recentIndex > -1) {
          // More recent commands (lower index) get a higher bonus.
          recencyBonus = (this.MAX_RECENT_COMMANDS - recentIndex) * 2;
        }

        // Combine scores, giving label the highest weight, and add recency bonus.
        const score =
          Math.max(
            labelScore * 1.5, // Label is most important
            keyScore,
            tagsScore * 0.5 // Tags are least important
          ) + recencyBonus;

        return { cmd, score };
      })
      .filter((item) => item.score >= Prefs.minScoreThreshold)
      .filter((item) => this.commandIsVisible(item.cmd));

    // Sort by score, descending
    scoredCommands.sort((a, b) => b.score - a.score);

    const finalCmds = scoredCommands.map((item) => item.cmd);

    if (isCommandPrefix) {
      return finalCmds.slice(0, Prefs.maxCommandsPrefix);
    }
    return finalCmds.slice(0, Prefs.maxCommands);
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

    this.addRecentCommand(cmd);

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
      this.executeCommandObject(cmd);
    } else {
      debugError(`executeCommandByKey: Command with key "${key}" not found.`);
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
      const isPrefixModeActive = ZenCommandPalette.provider?._isInPrefixMode ?? false;
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
  applyCustomShortcuts() {
    if (!this._userConfig.customShortcuts) return;
    const KEYSET_ID = "zen-command-palette-keyset";
    let keyset = document.getElementById(KEYSET_ID);

    if (keyset && keyset._zenCmdListenerAttached) {
      keyset.removeEventListener("command", this._boundHandleKeysetCommand);
    } else if (!keyset) {
      keyset = document.createXULElement("keyset");
      keyset.id = KEYSET_ID;
      document.getElementById("mainKeyset").after(keyset);
    }

    keyset.replaceChildren();

    for (const [commandKey, shortcutStr] of Object.entries(this._userConfig.customShortcuts)) {
      if (!shortcutStr) continue;

      const { key, keycode, modifiers } = parseShortcutString(shortcutStr);
      if (!key && !keycode) continue;

      const keyEl = document.createXULElement("key");
      keyEl.id = `zen-cmd-palette-shortcut-for-${commandKey}`;
      if (key) keyEl.setAttribute("key", key);
      if (keycode) keyEl.setAttribute("keycode", keycode);
      if (modifiers) keyEl.setAttribute("modifiers", modifiers);
      keyEl.setAttribute("data-command-key", commandKey);

      keyset.appendChild(keyEl);
    }

    keyset.addEventListener("command", this._boundHandleKeysetCommand);
    keyset._zenCmdListenerAttached = true;
    debugLog("Applied custom shortcuts.");
  },

  _handleKeysetCommand(event) {
    const commandKey = event.target.getAttribute("data-command-key");
    if (commandKey) {
      this.executeCommandByKey(commandKey);
    }
  },

  async applyToolbarButtons() {
    const WIDGET_PREFIX = "zen-cmd-palette-widget-";
    const allCommands = await this.getAllCommandsForConfig();

    // TODO: this is requiered for realtime changes
    // First, remove all widgets created by this mod to handle removals cleanly.

    if (!this._userConfig?.toolbarButtons) return;

    for (const key of this._userConfig.toolbarButtons) {
      const cmd = allCommands.find((c) => c.key === key);
      if (!cmd) continue;

      // Sanitize the command key to create a valid widget ID.
      const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
      const widgetId = `${WIDGET_PREFIX}${sanitizedKey}`;
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
        debugLog(`Created widget for command: ${key}`);
      } catch (e) {
        if (!e.message.includes("widget with same id already exists")) {
          debugError(`Failed to create widget for ${key}:`, e);
        }
      }
    }
  },

  destroy() {
    if (this.provider) {
      const { UrlbarProvidersManager } = ChromeUtils.importESModule(
        "resource:///modules/UrlbarProvidersManager.sys.mjs"
      );
      UrlbarProvidersManager.unregisterProvider(this.provider);
      this.provider = null;
      debugLog("Urlbar provider unregistered.");
    }
  },

  /**
   * Initializes the command palette by creating and registering the UrlbarProvider.
   * This is the main entry point for the script.
   */
  async init() {
    debugLog("Starting ZenCommandPalette init...");
    this._boundHandleKeysetCommand = this._handleKeysetCommand.bind(this);

    this.Settings = SettingsModal;
    this.Settings.init(this);
    debugLog("Settings modal initialized.");

    await this.loadUserConfig();
    this.applyUserConfig();
    debugLog("User config loaded and applied.");

    this.attachUrlbarCloseListeners();

    window.addEventListener("unload", () => this.destroy(), { once: true });

    const { UrlbarUtils, UrlbarProvider } = ChromeUtils.importESModule(
      "resource:///modules/UrlbarUtils.sys.mjs"
    );
    const { UrlbarProvidersManager } = ChromeUtils.importESModule(
      "resource:///modules/UrlbarProvidersManager.sys.mjs"
    );
    const { UrlbarResult } = ChromeUtils.importESModule("resource:///modules/UrlbarResult.sys.mjs");

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
          // HACK: setting name to "TestProvider" don't cause too many error messages in console due to setting result.heuristic = true;
          return "TestProvider";
        }
        get type() {
          return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
        }
        getPriority(context) {
          const input = (context.searchString || "").trim();
          // Returning a high priority ensures this provider's results are shown exclusively
          // when the prefix is used, effectively creating a command-only mode.
          return input.startsWith(Prefs.prefix) ? 10000 : 0;
        }

        async isActive(context) {
          try {
            const input = (context.searchString || "").trim();
            const isPrefixSearch = input.startsWith(Prefs.prefix);

            if (this._isInPrefixMode && !isPrefixSearch) {
              this._isInPrefixMode = false;
              Prefs.resetTempMaxRichResults();
            }

            // Do not activate if a one-off search engine is already active.
            const inSearchMode =
              !!context.searchMode?.engineName || !!gURLBar.searchMode?.engineName;
            if (inSearchMode) {
              return false;
            }

            if (isPrefixSearch) return true;
            if (Prefs.prefixRequired) return false;

            if (input.length >= Prefs.minQueryLength) {
              const liveCommands = await self.generateLiveCommands();
              return self.filterCommandsByInput(input, liveCommands).length > 0;
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

            const isPrefixSearch = input.startsWith(Prefs.prefix);
            const query = isPrefixSearch ? input.substring(1).trim() : input.trim();

            this._isInPrefixMode = isPrefixSearch;

            if (isPrefixSearch) Prefs.setTempMaxRichResults(Prefs.maxCommandsPrefix);
            else Prefs.resetTempMaxRichResults();

            if (context.canceled) return;

            const liveCommands = await self.generateLiveCommands();
            if (context.canceled) return;

            const addResult = (cmd, isHeuristic = false) => {
              if (!cmd) return;
              const shortcut = self.getShortcutForCommand(cmd.key);
              const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                suggestion: cmd.label,
                title: cmd.label,
                query: input,
                keywords: cmd?.tags,
                icon: cmd.icon || "chrome://browser/skin/trending.svg",
                shortcutContent: shortcut,
                dynamicType: DYNAMIC_TYPE_NAME,
              });
              const result = new UrlbarResult(
                UrlbarUtils.RESULT_TYPE.DYNAMIC,
                UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                payload,
                payloadHighlights
              );
              if (isHeuristic) result.heuristic = true;
              result._zenCmd = cmd;
              add(this, result);
              return true;
            };

            if (isPrefixSearch && !query) {
              let count = 0;
              const maxResults = Prefs.maxCommandsPrefix;
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
                  command: self._closeUrlBar.bind(self),
                  icon: "chrome://browser/skin/zen-icons/info.svg",
                });
              }
              return;
            }

            const matches = self.filterCommandsByInput(input, liveCommands);

            if (!matches.length && isPrefixSearch) {
              addResult({
                key: "no-results",
                label: "No matching commands found",
                command: self._closeUrlBar.bind(self),
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
          Prefs.resetTempMaxRichResults();
          this._isInPrefixMode = false;
          setTimeout(() => {
            self.clearDynamicCommandsCache();
            self._commandVisibilityCache = {};
          }, 0);
        }

        onEngagement(queryContext, controller, details) {
          const cmd = details.result._zenCmd;
          if (cmd) {
            debugLog("Executing command from onEngagement:", cmd.key);
            self._closeUrlBar();
            setTimeout(() => self.executeCommandObject(cmd), 0);
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
      "items. total commands:",
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
  },
};

// --- Initialization ---
UC_API.Runtime.startupFinished().then(() => {
  Prefs.setInitialPrefs();
  window.ZenCommandPalette = ZenCommandPalette;
  window.ZenCommandPalette.init();

  debugLog(
    "Zen Command Palette initialized. Static commands count:",
    window.ZenCommandPalette.staticCommands.length
  );
});
