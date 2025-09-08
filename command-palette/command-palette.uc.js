import { commands as staticCommands } from "./all-commands.js";
import {
  generateAboutPageCommands,
  generateExtensionCommands,
  generateSearchEngineCommands,
  generateSineCommands,
  generateWorkspaceCommands,
} from "./dynamic-commands.js";
import { Prefs, debugLog, debugError } from "./utils/prefs.js";

const ZenCommandPalette = {
  staticCommands,
  provider: null,

  safeStr(x) {
    return (x || "").toString();
  },

  /**
   * Checks if a command should be visible based on its `condition` property.
   * @param {object} cmd - The command object to check.
   * @returns {boolean} True if the command should be visible, otherwise false.
   */
  commandIsVisible(cmd) {
    try {
      let conditionPresent = false;
      let conditionResult = true;

      // Evaluate the primary condition (cmd.condition) if it exists.
      if (typeof cmd.condition === "function") {
        conditionPresent = true;
        conditionResult = !!cmd.condition();
      } else if (cmd.condition !== undefined) {
        conditionPresent = true;
        conditionResult = cmd.condition !== false;
      }

      // Check if it's a cmd_ fallback command (e.g., "cmd_newTab") and if its element exists.
      const isCmdFallback = cmd.key.startsWith("cmd_") && !cmd.command;
      const cmdFallbackElementExists = isCmdFallback ? !!document.getElementById(cmd.key) : false;

      // If both a `condition` and a `cmd_` fallback are present, join them with AND.
      if (conditionPresent && isCmdFallback) {
        return conditionResult && cmdFallbackElementExists;
      }
      // If only a `condition` is present, return its result.
      else if (conditionPresent) {
        return conditionResult;
      }
      // If only a `cmd_` fallback is present, return its element existence check.
      else if (isCmdFallback) {
        return cmdFallbackElementExists;
      }

      return true; // Default to visible if no condition is set.
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
  async generateLiveCommands() {
    let liveCommands = [...staticCommands];

    const commandPromises = [];
    if (Prefs.loadAboutPages) commandPromises.push(generateAboutPageCommands());
    if (Prefs.loadSearchEngines) commandPromises.push(generateSearchEngineCommands());
    if (Prefs.loadExtensions) commandPromises.push(generateExtensionCommands());
    if (Prefs.loadWorkspaces) commandPromises.push(generateWorkspaceCommands());
    if (Prefs.loadSineMods) commandPromises.push(generateSineCommands());

    const commandSets = await Promise.all(commandPromises);
    liveCommands.push(...commandSets.flat());

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
    const isCommandPrefix = query.startsWith(":");
    if (isCommandPrefix) {
      query = query.substring(1).trim();
    }

    // If the input was just the prefix, show all available commands, unsorted.
    if (isCommandPrefix && !query) {
      const visible = allCommands.filter(this.commandIsVisible.bind(this));
      return visible.slice(0, Prefs.maxCommands);
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
      .filter(this.commandIsVisible.bind(this))
      .map((cmd) => {
        const label = (cmd.label || "").toLowerCase();
        const key = (cmd.key || "").toLowerCase();
        const tags = (cmd.tags || []).join(" ").toLowerCase();

        let score = 0;

        // Score based on match quality, with label/key being most important.
        if (label.startsWith(lowerQuery)) {
          score = Math.max(score, 100);
        } else if (key.startsWith(lowerQuery)) {
          score = Math.max(score, 90);
        } else if (label.includes(lowerQuery)) {
          score = Math.max(score, 80);
        } else if (key.includes(lowerQuery)) {
          score = Math.max(score, 70);
        } else if (tags.includes(lowerQuery)) {
          score = Math.max(score, 60);
        }

        // Simple fuzzy match as a fallback if no other score was found.
        if (score === 0) {
          const fuzzyTarget = `${label} ${key} ${tags}`;
          let queryIndex = 0;
          let fuzzyScore = 0;
          for (let i = 0; i < fuzzyTarget.length && queryIndex < lowerQuery.length; i++) {
            if (fuzzyTarget[i] === lowerQuery[queryIndex]) {
              fuzzyScore++;
              queryIndex++;
            }
          }
          if (queryIndex === lowerQuery.length) {
            score = fuzzyScore;
          }
        }

        return { cmd, score };
      })
      .filter((item) => item.score > 0);

    // Sort by score, descending
    scoredCommands.sort((a, b) => b.score - a.score);

    const finalCmds = scoredCommands.map((item) => item.cmd);
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

    try {
      // Prioritize explicit command function if it exists.
      if (cmd.command && typeof cmd.command === "function") {
        debugLog("Executing command via function:", cmd.key || cmd.label);
        const ret = cmd.command();
        if (ret && typeof ret.then === "function") {
          ret.catch((e) => debugError("Command promise rejected:", e));
        }
        // Fallback for commands that rely on a DOM element with a doCommand method.
      } else if (cmd.key.startsWith("cmd_")) {
        const commandEl = document.getElementById(cmd.key);
        if (commandEl && typeof commandEl.doCommand === "function") {
          debugLog("Executing command via doCommand fallback:", cmd.key);
          commandEl.doCommand();
        } else {
          debugError("Fallback command element not found or has no doCommand:", cmd.key);
        }
      } else {
        debugError("Command has no executable action:", cmd.key);
      }
    } catch (e) {
      debugError("Command execution error:", e);
    }
  },

  /**
   * Finds the corresponding command object from a DOM element in the URL bar results.
   * @param {HTMLElement} row - The DOM element representing a result row.
   * @returns {object|null} The matched command object, or null if no match is found.
   */
  findCommandFromDomRow(row) {
    try {
      if (!row) {
        debugLog("findCommandFromDomRow: called with null row.");
        return null;
      }
      // The title element is prioritized as it typically contains only the command label,
      // avoiding extra text like "Search with...".
      const titleEl = row.querySelector(".urlbarView-title");
      const title = titleEl?.textContent || row.getAttribute("aria-label") || row.textContent || "";
      const trimmed = this.safeStr(title).trim();

      if (!trimmed) {
        debugLog("findCommandFromDomRow: row has no title/text content", row);
        if (
          this.provider &&
          this.provider._lastResults &&
          this.provider._lastResults.length === 1
        ) {
          debugLog("findCommandFromDomRow: falling back to single result.");
          return this.provider._lastResults[0] && this.provider._lastResults[0]._zenCmd;
        }
        return null;
      }
      debugLog("findCommandFromDomRow: trying to match row title:", `"${trimmed}"`);

      // Match by checking if the row's text starts with a known command's title.
      // This is more robust than an exact match, as Firefox can append additional text to the row.
      if (this.provider && this.provider._lastResults) {
        for (const r of this.provider._lastResults) {
          if (!r || !r.payload) continue;
          const payloadTitle = (r.payload.title || r.payload.suggestion || "").trim();
          if (payloadTitle && trimmed.startsWith(payloadTitle)) {
            debugLog("findCommandFromDomRow: matched by startsWith payload title.", r._zenCmd);
            return r._zenCmd || null;
          }
        }
      }

      // As a fallback, check the full command list directly.
      const commandList = this.provider?._currentCommandList || this.staticCommands;
      const found = commandList.find((c) => trimmed.startsWith(c.label));
      if (found) {
        debugLog("findCommandFromDomRow: matched command label as fallback.", found);
        return found;
      }

      debugLog("findCommandFromDomRow: failed to match row title to any command.");
      return null;
    } catch (e) {
      debugError("findCommandFromDomRow error:", e);
    }
  },

  /**
   * Attaches 'click' and 'keydown' event listeners to the URL bar popup.
   * These listeners are responsible for executing commands and preventing default browser actions.
   */
  attachUrlbarSelectionListeners() {
    try {
      debugLog("Attempting to attach URL bar listeners...");
      const popup =
        (typeof gURLBar !== "undefined" && gURLBar.view?.results) ||
        document.getElementById("urlbar-results");

      if (!popup) {
        debugError("Could not find urlbar popup element. Listeners not attached.");
        return;
      }

      const onPopupClick = (e) => {
        try {
          debugLog("Popup click event triggered.", "Target:", e.target);
          const row = e.target.closest(".urlbarView-row");
          if (!row) return;
          const cmd = this.findCommandFromDomRow(row);
          if (cmd) {
            debugLog("Executing command from click, stopping further event propagation.");
            window?.gZenUIManager?.handleUrlbarClose(false, false);
            window?.gURLBar?.view?.close();
            this.executeCommandObject(cmd);
            // Stop the browser's default action (e.g., performing a search) for this event.
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        } catch (ee) {
          debugError("onPopupClick error:", ee);
        }
      };

      const onUrlbarKeydown = (e) => {
        try {
          if (e.key !== "Enter" || e.defaultPrevented) return;
          debugLog("Enter key pressed on urlbar.");

          const view = typeof gURLBar !== "undefined" && gURLBar.view;
          if (!view || !view.isOpen || view.selectedElementIndex < 0) return;

          if (!popup || !popup.children) {
            debugError("Keydown handler cannot find popup or its children.");
            return;
          }
          const selectedRow = popup.children[view.selectedElementIndex];
          const cmd = this.findCommandFromDomRow(selectedRow);
          if (cmd) {
            debugLog("Executing command from Enter key, stopping further event propagation.");
            window?.gZenUIManager?.handleUrlbarClose(false, false);
            gURLBar?.view?.close();
            this.executeCommandObject(cmd);
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        } catch (ee) {
          debugError("onUrlbarKeydown error:", ee);
        }
      };

      if (!popup._zenCmdListenersAttached) {
        popup.addEventListener("click", onPopupClick, true);
        debugLog("Successfully attached 'click' listener to popup:", popup);

        if (typeof gURLBar !== "undefined" && gURLBar.inputField) {
          gURLBar.inputField.addEventListener("keydown", onUrlbarKeydown, true);
          debugLog("Successfully attached 'keydown' listener to urlbar input:", gURLBar.inputField);
        } else {
          debugError("Could not find gURLBar.inputField to attach keydown listener.");
        }
        popup._zenCmdListenersAttached = true;
        debugLog("Finished attaching listeners.");
      } else {
        debugLog("Listeners already attached.");
      }
    } catch (e) {
      debugError("attachUrlbarSelectionListeners setup error:", e);
    }
  },

  /**
   * Initializes the command palette by creating and registering the UrlbarProvider.
   * This is the main entry point for the script.
   */
  init() {
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

    try {
      const self = this;
      class ZenCommandProvider extends UrlbarProvider {
        get name() {
          return "TestProvider"; // setting name to "TestProvider" don't cause too many error messages in console due to setting result.heuristic = true;
        }
        get type() {
          return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
        }
        getPriority(context) {
          const input = (context.searchString || "").trim();
          // Returning a high priority ensures this provider's results are shown exclusively
          // when the ':' prefix is used, effectively creating a command-only mode.
          return input.startsWith(":") ? 10000 : 0;
        }

        async isActive(context) {
          try {
            const input = (context.searchString || "").trim();
            const inSearchMode = !!context.searchMode?.engineName;
            const liveCommands = await self.generateLiveCommands();

            // Always check for matches if ":" prefix is used.
            if (input.startsWith(":")) {
              return self.filterCommandsByInput(input, liveCommands).length > 0;
            }

            // Otherwise, only activate if not in search mode and query is long enough.
            if (!inSearchMode && input.length >= Prefs.minQueryLength) {
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
            const input =
              context?.searchString || context?.text || context?.trimmed || gURLBar?.value || "";
            const liveCommands = await self.generateLiveCommands();
            this._currentCommandList = liveCommands; // Store for use in findCommandFromDomRow
            const matches = self.filterCommandsByInput(input, liveCommands);
            this._lastResults = [];

            if (!matches.length) return;

            for (const [index, cmd] of matches.entries()) {
              const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                suggestion: cmd.label,
                title: cmd.label,
                url: "",
                query: cmd.key,
                engine: "zenCommand",
                keywords: cmd?.tags,
              });

              const result = new UrlbarResult(
                UrlbarUtils.RESULT_TYPE.SEARCH,
                UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                payload,
                payloadHighlights
              );

              if (index === 0) {
                result.heuristic = true;
              }

              result._zenCmd = cmd;
              result.payload.icon = cmd.icon || "chrome://browser/skin/trending.svg";
              result.providerName = this.name;
              result.providerType = this.type;
              this._lastResults.push(result);
              add(this, result);
            }
            // Listeners are attached here to ensure they are active whenever results are shown.
            self.attachUrlbarSelectionListeners();
          } catch (e) {
            debugError("startQuery unexpected error:", e);
          }
        }
        dispose() {
          this._lastResults = [];
          this._currentCommandList = null;
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
};

// --- Initialization ---
Prefs.setInitialPrefs();
window.ZenCommandPalette = ZenCommandPalette;
window.ZenCommandPalette.init();

debugLog(
  "Zen Command Palette initialized. Static commands count:",
  window.ZenCommandPalette.staticCommands.length
);
