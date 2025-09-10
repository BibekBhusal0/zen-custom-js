import { commands as staticCommands } from "./all-commands.js";
import {
  generateAboutPageCommands,
  generateExtensionCommands,
  generateSearchEngineCommands,
  generateSineCommands,
  generateWorkspaceCommands,
  generateFolderCommands,
  generateWorkspaceMoveCommands,
} from "./dynamic-commands.js";
import { Prefs, debugLog, debugError } from "./utils/prefs.js";

const ZenCommandPalette = {
  staticCommands,
  provider: null,

  safeStr(x) {
    return (x || "").toString();
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
      debugError("urlbarAI: Error in _closeUrlBar", e);
    }
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

    // Heavily prioritize exact prefix matches
    if (targetLower.startsWith(queryLower)) {
      return 100 + queryLen;
    }

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
          bonus -= Math.min(distance - 1, 10); // Cap penalty to avoid negative scores for valid matches
        }

        score += bonus;
        lastMatchIndex = targetIndex;
        queryIndex++;
      }
    }

    // If not all characters of the query were found, it's not a match.
    return queryIndex === queryLen ? score : 0;
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
    if (Prefs.loadWorkspaces) {
      commandPromises.push(generateWorkspaceCommands());
      commandPromises.push(generateWorkspaceMoveCommands());
    }
    if (Prefs.loadSineMods) commandPromises.push(generateSineCommands());
    if (Prefs.loadFolders) commandPromises.push(generateFolderCommands());

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
      return visible;
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
        const label = cmd.label || "";
        const key = cmd.key || "";
        const tags = (cmd.tags || []).join(" ");

        // Calculate scores for different fields
        const labelScore = this.calculateFuzzyScore(label, lowerQuery);
        const keyScore = this.calculateFuzzyScore(key, lowerQuery);
        const tagsScore = this.calculateFuzzyScore(tags, lowerQuery);

        // Combine scores, giving label the highest weight
        const score = Math.max(
          labelScore * 1.5, // Label is most important
          keyScore,
          tagsScore * 0.5 // Tags are least important
        );

        return { cmd, score };
      })
      .filter((item) => item.score >= Prefs.minScoreThreshold);

    // Sort by score, descending
    scoredCommands.sort((a, b) => b.score - a.score);

    const finalCmds = scoredCommands.map((item) => item.cmd);

    // When using the prefix, show all results. Otherwise, cap at maxCommands.
    if (isCommandPrefix) {
      return finalCmds;
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
        return null;
      }
      // The title element is prioritized as it typically contains only the command label,
      // avoiding extra text like "Search with...".
      const titleEl = row.querySelector(".urlbarView-title");
      const title = titleEl?.textContent || row.getAttribute("aria-label") || row.textContent || "";
      const trimmed = this.safeStr(title).trim();

      if (!trimmed) {
        if (
          this.provider &&
          this.provider._lastResults &&
          this.provider._lastResults.length === 1
        ) {
          return this.provider._lastResults[0] && this.provider._lastResults[0]._zenCmd;
        }
        return null;
      }

      // Match by checking if the row's text starts with a known command's title.
      // This is more robust than an exact match, as Firefox can append additional text to the row.
      if (this.provider && this.provider._lastResults) {
        for (const r of this.provider._lastResults) {
          if (!r || !r.payload) continue;
          const payloadTitle = (r.payload.title || r.payload.suggestion || "").trim();
          if (payloadTitle && trimmed.startsWith(payloadTitle)) {
            return r._zenCmd || null;
          }
        }
      }

      // As a fallback, check the full command list directly.
      const commandList = this.provider?._currentCommandList || this.staticCommands;
      const found = commandList.find((c) => trimmed.startsWith(c.label));
      if (found) {
        return found;
      }

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
      const popup =
        (typeof gURLBar !== "undefined" && gURLBar.view?.results) ||
        document.getElementById("urlbar-results");

      if (!popup) {
        debugError("Could not find urlbar popup element. Listeners not attached.");
        return;
      }

      const onPopupClick = (e) => {
        try {
          const row = e.target.closest(".urlbarView-row");
          if (!row) return;
          const cmd = this.findCommandFromDomRow(row);
          if (cmd) {
            debugLog("Executing command from click.");
            this._closeUrlBar();
            setTimeout(() => {
              this.executeCommandObject(cmd);
            }, 0);
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

          const view = typeof gURLBar !== "undefined" && gURLBar.view;
          if (!view || !view.isOpen || view.selectedElementIndex < 0) return;

          if (!popup || !popup.children) {
            return;
          }
          const selectedRow = popup.children[view.selectedElementIndex];
          const cmd = this.findCommandFromDomRow(selectedRow);
          if (cmd) {
            debugLog("Executing command from Enter key.");
            this._closeUrlBar();
            setTimeout(() => {
              this.executeCommandObject(cmd);
            }, 0);
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        } catch (ee) {
          debugError("onUrlbarKeydown error:", ee);
        }
      };

      if (!popup._zenCmdListenersAttached) {
        popup.addEventListener("click", onPopupClick, true);
        gURLBar.inputField.addEventListener("keydown", onUrlbarKeydown, true);
        popup._zenCmdListenersAttached = true;
        debugLog("URL bar selection listeners attached.");
      }
    } catch (e) {
      debugError("attachUrlbarSelectionListeners setup error:", e);
    }
  },

  initScrollHandling() {
    if (location.href !== "chrome://browser/content/browser.xhtml") {
      return;
    }
    debugLog("Initializing scroll handling for command palette...");

    const SCROLLABLE_CLASS = "zen-command-scrollable";
    const urlbar = document.getElementById("urlbar");
    const input = document.getElementById("urlbar-input");
    const results = document.getElementById("urlbar-results");

    if (!urlbar || !input || !results) {
      debugError("Scroll handling init failed: one or more urlbar elements not found.");
      return;
    }

    results.addEventListener(
      "wheel",
      () => {
        if (gURLBar.view.selectedIndex !== -1) {
          gURLBar.view.selectedIndex = -1;
        }
      },
      { passive: true }
    );

    input.addEventListener(
      "keydown",
      (event) => {
        // This logic should only apply when the command palette's provider is active in prefix mode.
        if (!ZenCommandPalette.provider?._isInPrefixMode) {
          return;
        }

        const isSelectionEmpty =
          gURLBar.view.selectedIndex === -1 || typeof gURLBar.view.selectedIndex === "undefined";

        // This intervention is ONLY needed if nothing is currently selected.
        if (!isSelectionEmpty || !["ArrowUp", "ArrowDown"].includes(event.key)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const allRows = Array.from(results.querySelectorAll(".urlbarView-row"));
        if (!allRows.length) return;

        const containerRect = results.getBoundingClientRect();
        let targetRow = null;

        if (event.key === "ArrowDown") {
          targetRow = allRows.find((row) => row.getBoundingClientRect().top >= containerRect.top);
        } else if (event.key === "ArrowUp") {
          targetRow = [...allRows]
            .reverse()
            .find((row) => row.getBoundingClientRect().bottom <= containerRect.bottom);
        }

        if (targetRow) {
          const targetIndex = allRows.indexOf(targetRow);
          gURLBar.view.selectedIndex = targetIndex;
        } else {
          gURLBar.view.selectedIndex = event.key === "ArrowDown" ? 0 : allRows.length - 1;
        }
      },
      true
    );

    const observer = new MutationObserver((mutations) => {
      // Use the provider's state flag instead of gURLBar.value
      const isPrefixModeActive = ZenCommandPalette.provider?._isInPrefixMode ?? false;

      if (urlbar.hasAttribute("open")) {
        results.classList.toggle(SCROLLABLE_CLASS, isPrefixModeActive);
      } else {
        results.classList.remove(SCROLLABLE_CLASS);
      }

      for (const mutation of mutations) {
        if (mutation.attributeName === "selected" && mutation.target.hasAttribute("selected")) {
          mutation.target.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    });

    observer.observe(results, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["selected"],
    });
    observer.observe(urlbar, { attributes: true, attributeFilter: ["open"] });
    debugLog("Scroll handling and MutationObserver successfully initialized.");
  },

  attachUrlbarCloseListeners() {
    if (this._closeListenersAttached) {
      return;
    }

    const onUrlbarClose = () => {
      if (this.provider) {
        this.provider.dispose();
      }
      if (gURLBar.value.trim().startsWith(":")) {
        gURLBar.value = "";
      }
    };

    gURLBar.inputField.addEventListener("blur", onUrlbarClose);
    gURLBar.view.panel.addEventListener("popuphiding", onUrlbarClose);
    this._closeListenersAttached = true;
    debugLog("URL bar close listeners attached.");
  },

  /**
   * Initializes the command palette by creating and registering the UrlbarProvider.
   * This is the main entry point for the script.
   */
  init() {
    this.initScrollHandling();
    this.attachUrlbarCloseListeners();
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
        _isInPrefixMode = false;

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
            // Do not activate if a one-off search engine is already active.
            const inSearchMode =
              !!context.searchMode?.engineName || !!gURLBar.searchMode?.engineName;
            if (inSearchMode) {
              debugLog(
                `Provider inactivated by search mode: ${
                  context.searchMode?.engineName || gURLBar.searchMode?.engineName
                }`
              );
              return false;
            }

            const input = (context.searchString || "").trim();
            const isPrefixSearch = input.startsWith(":");

            if (isPrefixSearch) {
              return true;
            }

            if (Prefs.prefixRequired) {
              return false;
            }

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
            const input =
              context?.searchString || context?.text || context?.trimmed || gURLBar?.value || "";
            const isPrefixSearch = input.trim().startsWith(":");

            // Set the state flag based on the initial query.
            this._isInPrefixMode = isPrefixSearch;

            if (isPrefixSearch) {
              Prefs.setTempMaxRichResults(Prefs.maxCommandsPrefix);
            } else {
              // Reset if the provider is active but no longer in prefix mode.
              Prefs.resetTempMaxRichResults();
            }

            const liveCommands = await self.generateLiveCommands();
            this._currentCommandList = liveCommands; // Store for use in findCommandFromDomRow
            const matches = self.filterCommandsByInput(input, liveCommands);
            this._lastResults = [];

            if (!matches.length) {
              if (isPrefixSearch) {
                const noResultsCmd = {
                  key: "no-results",
                  label: "No matching commands found",
                  command: self._closeUrlBar.bind(self),
                  icon: "chrome://browser/skin/zen-icons/info.svg",
                };

                const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                  suggestion: noResultsCmd.label,
                  title: noResultsCmd.label,
                  url: "",
                  query: noResultsCmd.key,
                  engine: "zenCommand",
                });

                const result = new UrlbarResult(
                  UrlbarUtils.RESULT_TYPE.SEARCH,
                  UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                  payload,
                  payloadHighlights
                );

                result.heuristic = true;
                result._zenCmd = noResultsCmd;
                result.payload.icon = noResultsCmd.icon;
                result.providerName = this.name;
                result.providerType = this.type;
                this._lastResults.push(result);
                add(this, result);
              }
              return;
            }

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
          Prefs.resetTempMaxRichResults();
          this._lastResults = [];
          this._currentCommandList = null;
          this._isInPrefixMode = false; // Reset the state flag.
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
