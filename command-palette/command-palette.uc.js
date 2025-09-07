const ZenCommandPalette = {
  debugMode: true,
  commands: [
    // Browser Navigation
    { key: "open:home", label: "Open Home Page", icon: "chrome://browser/skin/home.svg", command: () => gBrowser.loadURI("about:home"), condition: !!window.gBrowser },
    { key: "open:downloads", label: "Open Downloads", icon: "chrome://browser/skin/downloads/downloads.svg", command: () => BrowserDownloadsUI.showUI(), condition: !!window.BrowserDownloadsUI },
    { key: "open:addons", label: "Open Add-ons Manager", icon: "chrome://mozapps/skin/extensions/extension.svg", command: () => gBrowser.loadURI("about:addons"), condition: !!window.gBrowser },
    { key: "open:settings", label: "Open Settings", icon: "chrome://browser/skin/settings.svg", command: () => openPreferences(), condition: !!window.openPreferences },
    { key: "open:bookmarks", label: "Toggle Bookmarks Sidebar", icon: "chrome://browser/skin/bookmark-star-on-tray.svg", command: () => SidebarUI.toggle("viewBookmarksSidebar"), condition: !!window.SidebarUI },
    { key: "open:history", label: "Toggle History Sidebar", icon: "chrome://browser/skin/history.svg", command: () => SidebarUI.toggle("viewHistorySidebar"), condition: !!window.SidebarUI },

    // Tab Management
    { key: "tab:new", label: "Open New Tab", icon: "chrome://browser/skin/tab-add.svg", command: () => BrowserOpenTab(), condition: !!window.BrowserOpenTab },
    { key: "tab:close", label: "Close Current Tab", icon: "chrome://browser/skin/tab-close.svg", command: () => BrowserCloseTabOrWindow(), condition: !!window.BrowserCloseTabOrWindow },
    { key: "tab:duplicate", label: "Duplicate Current Tab", icon: "chrome://browser/skin/duplicate.svg", command: () => { const newTab = gBrowser.duplicateTab(gBrowser.selectedTab); gBrowser.selectedTab = newTab; }, condition: !!gBrowser?.duplicateTab },
    { key: "tab:pin", label: "Pin Current Tab", icon: "chrome://browser/skin/pin.svg", command: () => gBrowser.pinTab(gBrowser.selectedTab), condition: () => !!gBrowser?.pinTab && !gBrowser.selectedTab.pinned },
    { key: "tab:unpin", label: "Unpin Current Tab", icon: "chrome://browser/skin/unpin.svg", command: () => gBrowser.unpinTab(gBrowser.selectedTab), condition: () => !!gBrowser?.unpinTab && gBrowser.selectedTab.pinned },
    { key: "tab:mute", label: "Toggle Mute Tab", icon: "chrome://browser/skin/sound-playing-shared.svg", command: () => gBrowser.selectedTab.toggleMuteAudio(), condition: !!gBrowser?.selectedTab?.toggleMuteAudio },
    { key: "tab:reload", label: "Reload Tab", icon: "chrome://global/skin/icons/refresh.svg", command: () => gBrowser.reload(), condition: !!gBrowser?.reload },
    { key: "tab:reload-force", label: "Reload Tab (Skip Cache)", icon: "chrome://global/skin/icons/refresh.svg", command: () => gBrowser.reloadWithFlags(Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE), condition: !!gBrowser?.reloadWithFlags },
    { key: "tab:reopen-closed", label: "Reopen Closed Tab", icon: "chrome://browser/skin/history-undo.svg", command: () => undoCloseTab(), condition: !!window.undoCloseTab },
    { key: "tab:close-others", label: "Close Other Tabs", icon: "chrome://browser/skin/tab-close-other.svg", command: () => gBrowser.removeTabsOtherThan(gBrowser.selectedTab), condition: !!gBrowser?.removeTabsOtherThan },

    // Window Management
    { key: "window:new", label: "Open New Window", icon: "chrome://browser/skin/window.svg", command: () => OpenBrowserWindow(), condition: !!window.OpenBrowserWindow },
    { key: "window:private", label: "New Private Window", icon: "chrome://browser/skin/private-browsing.svg", command: () => OpenBrowserWindow({ private: true }), condition: !!window.OpenBrowserWindow },

    // Bookmarks & History
    { key: "bookmark:add", label: "Bookmark Current Page", icon: "chrome://browser/skin/bookmark.svg", command: () => PlacesCommandHook.bookmarkCurrentPage(), condition: !!window.PlacesCommandHook?.bookmarkCurrentPage },
    { key: "bookmark:manage", label: "Manage Bookmarks (Library)", icon: "chrome://browser/skin/bookmarks-toolbar.svg", command: () => PlacesCommandHook.showView("AllBookmarks"), condition: !!window.PlacesCommandHook },
    { key: "history:clear", label: "Clear Recent History...", icon: "chrome://global/skin/icons/clear.svg", command: () => gBrowser.ownerGlobal.openDialog("chrome://browser/content/sanitize.xhtml", "SanitizeDialog", "chrome,modal,centerscreen") },

    // Developer Tools
    { key: "dev:tools", label: "Toggle Developer Tools", icon: "chrome://devtools/skin/images/toolbox.svg", command: () => gDevToolsBrowser.toggle(), condition: !!window.gDevToolsBrowser },
    { key: "dev:inspector", label: "Toggle Inspector", icon: "chrome://devtools/skin/images/command-pick.svg", command: () => gDevTools.showToolboxForTab(gBrowser.selectedTab, { toolId: "inspector" }), condition: !!window.gDevTools },
    { key: "dev:console", label: "Toggle Web Console", icon: "chrome://devtools/skin/images/command-console.svg", command: () => gDevTools.showToolboxForTab(gBrowser.selectedTab, { toolId: "webconsole" }), condition: !!window.gDevTools },
    { key: "dev:style-reload", label: "Reload Browser Chrome CSS", icon: "chrome://devtools/skin/images/command-reload.svg", command: () => ChromeUtils.reloadStyleSheets(), condition: !!window.ChromeUtils?.reloadStyleSheets },
    { key: "browser:restart", label: "Restart Browser", icon: "chrome://browser/skin/reload-stop-go.svg", command: () => Services.appUtils.restart(), condition: !!window.Services?.appUtils?.restart },
  ],
  provider: null,

  debugLog(...args) { if (this.debugMode) console.log("zen-command-palette:", ...args); },
  debugError(...args) { if (this.debugMode) console.error("zen-command-palette:", ...args); },

  safeStr(x) { return (x || "").toString(); },

  /**
   * Checks if a command should be visible based on its `condition` property.
   * @param {object} cmd - The command object to check.
   * @returns {boolean} True if the command should be visible, otherwise false.
   */
  commandIsVisible(cmd) {
    try {
      if (typeof cmd.condition === "function") return !!cmd.condition();
      return cmd.condition !== false;
    } catch (e) {
      this.debugError("Error evaluating condition for", cmd && cmd.key, e);
      return false;
    }
  },

  /**
   * Filters the command list based on user input.
   * Supports a ":" prefix to enter an exclusive command mode.
   * @param {string} input - The user's search string from the URL bar.
   * @returns {Array<object>} An array of command objects that match the input.
   */
  filterCommandsByInput(input) {
    let query = this.safeStr(input).trim();
    const isCommandPrefix = query.startsWith(":");
    if (isCommandPrefix) {
      query = query.substring(1).trim();
    }

    // If the input was just the prefix, show all available commands.
    if (isCommandPrefix && !query) {
      return this.commands.filter(this.commandIsVisible.bind(this));
    }

    if (!query) {
      return [];
    }

    const lower = query.toLowerCase();
    return this.commands.filter(cmd => {
      if (!this.commandIsVisible(cmd)) return false;
      if ((cmd.key || "").toLowerCase().includes(lower)) return true;
      if ((cmd.label || "").toLowerCase().includes(lower)) return true;
      const prefix = (cmd.key || "").split(":")[0];
      return prefix && prefix.toLowerCase().startsWith(lower);
    });
  },

  /**
   * Safely executes a command's action within a try-catch block.
   * @param {object} cmd - The command object to execute.
   */
  executeCommandObject(cmd) {
    if (!cmd) { this.debugError("executeCommandObject: no command"); return; }
    try {
      this.debugLog("Executing command:", cmd.key || cmd.label);
      const ret = cmd.command && cmd.command();
      if (ret && typeof ret.then === "function") {
        ret.catch(e => this.debugError("Command promise rejected:", e));
      }
    } catch (e) {
      this.debugError("Command execution error:", e);
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
        this.debugLog("findCommandFromDomRow: called with null row.");
        return null;
      }
      // The title element is prioritized as it typically contains only the command label,
      // avoiding extra text like "Search with...".
      const titleEl = row.querySelector(".urlbarView-title");
      const title = titleEl?.textContent || row.getAttribute("aria-label") || row.textContent || "";
      const trimmed = this.safeStr(title).trim();

      if (!trimmed) {
        this.debugLog("findCommandFromDomRow: row has no title/text content", row);
        if (this.provider && this.provider._lastResults && this.provider._lastResults.length === 1) {
          this.debugLog("findCommandFromDomRow: falling back to single result.");
          return this.provider._lastResults[0] && this.provider._lastResults[0]._zenCmd;
        }
        return null;
      }
      this.debugLog("findCommandFromDomRow: trying to match row title:", `"${trimmed}"`);

      // Match by checking if the row's text starts with a known command's title.
      // This is more robust than an exact match, as Firefox can append additional text to the row.
      if (this.provider && this.provider._lastResults) {
        for (const r of this.provider._lastResults) {
          if (!r || !r.payload) continue;
          const payloadTitle = (r.payload.title || r.payload.suggestion || "").trim();
          if (payloadTitle && trimmed.startsWith(payloadTitle)) {
            this.debugLog("findCommandFromDomRow: matched by startsWith payload title.", r._zenCmd);
            return r._zenCmd || null;
          }
        }
      }

      // As a fallback, check the full command list directly.
      const found = this.commands.find(c => trimmed.startsWith(c.label));
      if (found) {
        this.debugLog("findCommandFromDomRow: matched command label as fallback.", found);
        return found;
      }

      this.debugLog("findCommandFromDomRow: failed to match row title to any command.");
      return null;
    } catch (e) {
      this.debugError("findCommandFromDomRow error:", e);
    }
  },

  /**
   * Attaches 'click' and 'keydown' event listeners to the URL bar popup.
   * These listeners are responsible for executing commands and preventing default browser actions.
   */
  attachUrlbarSelectionListeners() {
    try {
      this.debugLog("Attempting to attach URL bar listeners...");
      const popup = (typeof gURLBar !== "undefined" && gURLBar.view?.results) || document.getElementById("urlbar-results");

      if (!popup) {
        this.debugError("Could not find urlbar popup element. Listeners not attached.");
        return;
      }

      const onPopupClick = (e) => {
        try {
          this.debugLog("Popup click event triggered.", "Target:", e.target);
          const row = e.target.closest(".urlbarView-row");
          if (!row) return;
          const cmd = this.findCommandFromDomRow(row);
          if (cmd) {
            this.debugLog("Executing command from click, stopping further event propagation.");
            this.executeCommandObject(cmd);
            // Stop the browser's default action (e.g., performing a search) for this event.
            e.stopImmediatePropagation();
            e.preventDefault();
            if (typeof gURLBar !== "undefined" && gURLBar.view) gURLBar.view.close();
          }
        } catch (ee) {
          this.debugError("onPopupClick error:", ee);
        }
      };

      const onUrlbarKeydown = (e) => {
        try {
          if (e.key !== "Enter" || e.defaultPrevented) return;
          this.debugLog("Enter key pressed on urlbar.");

          const view = typeof gURLBar !== "undefined" && gURLBar.view;
          if (!view || !view.isOpen || view.selectedElementIndex < 0) return;
          
          if (!popup || !popup.children) {
            this.debugError("Keydown handler cannot find popup or its children.");
            return;
          }
          const selectedRow = popup.children[view.selectedElementIndex];
          const cmd = this.findCommandFromDomRow(selectedRow);
          if (cmd) {
            this.debugLog("Executing command from Enter key, stopping further event propagation.");
            this.executeCommandObject(cmd);
            e.stopImmediatePropagation();
            e.preventDefault();
            if (typeof gURLBar !== "undefined" && gURLBar.view) gURLBar.view.close();
          }
        } catch (ee) {
          this.debugError("onUrlbarKeydown error:", ee);
        }
      };

      if (!popup._zenCmdListenersAttached) {
        popup.addEventListener("click", onPopupClick, true);
        this.debugLog("Successfully attached 'click' listener to popup:", popup);

        if (typeof gURLBar !== "undefined" && gURLBar.inputField) {
          gURLBar.inputField.addEventListener("keydown", onUrlbarKeydown, true);
          this.debugLog("Successfully attached 'keydown' listener to urlbar input:", gURLBar.inputField);
        } else {
          this.debugError("Could not find gURLBar.inputField to attach keydown listener.");
        }
        popup._zenCmdListenersAttached = true;
        this.debugLog("Finished attaching listeners.");
      } else {
        this.debugLog("Listeners already attached.");
      }
    } catch (e) {
      this.debugError("attachUrlbarSelectionListeners setup error:", e);
    }
  },

  /**
   * Initializes the command palette by creating and registering the UrlbarProvider.
   * This is the main entry point for the script.
   */
  init() {
    const { UrlbarUtils, UrlbarProvider } = ChromeUtils.importESModule("resource:///modules/UrlbarUtils.sys.mjs");
    const { UrlbarProvidersManager } = ChromeUtils.importESModule("resource:///modules/UrlbarProvidersManager.sys.mjs");
    const { UrlbarResult } = ChromeUtils.importESModule("resource:///modules/UrlbarResult.sys.mjs");

    if (typeof UrlbarProvider === "undefined" || typeof UrlbarProvidersManager === "undefined") {
      this.debugError("UrlbarProvider or UrlbarProvidersManager not available; provider not registered.");
      return;
    }

    try {
      const self = this;
      class ZenCommandProvider extends UrlbarProvider {
        get name() { return "ZenCommandPalette"; }
        get type() { return UrlbarUtils.PROVIDER_TYPE.PROFILE; }
        getPriority(context) {
          const input = (context.searchString || "").trim();
          // Returning a high priority ensures this provider's results are shown exclusively
          // when the ':' prefix is used, effectively creating a command-only mode.
          return input.startsWith(":") ? 10000 : 0;
        }

        async isActive(context) {
          try {
            const input = (context?.searchString || context?.text || context?.trimmed) || gURLBar?.value || "";
            const matches = self.filterCommandsByInput(input);
            return matches.length > 0;
          } catch (e) {
            self.debugError("isActive error:", e);
            return false;
          }
        }

        async startQuery(context, add) {
          try {
            const input = (context?.searchString || context?.text || context?.trimmed) || gURLBar?.value || "";
            const matches = self.filterCommandsByInput(input);
            this._lastResults = [];

            if (!matches.length) return;

            for (const cmd of matches) {
              const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                suggestion: cmd.label,
                title: cmd.label,
                url: "",
                query: cmd.key,
              });

              const result = new UrlbarResult(
                UrlbarUtils.RESULT_TYPE.SEARCH,
                UrlbarUtils.RESULT_SOURCE.ACTIONS,
                payload,
                payloadHighlights
              );

              result._zenCmd = cmd;
              if (cmd.icon) result.payload.icon = cmd.icon;
              result.providerName = this.name;
              result.providerType = this.type;
              this._lastResults.push(result);
              add(this, result);
            }
            // Listeners are attached here to ensure they are active whenever results are shown.
            self.attachUrlbarSelectionListeners();
          } catch (e) {
            self.debugError("startQuery unexpected error:", e);
          }
        }
        dispose() { this._lastResults = []; }
      }

      this.provider = new ZenCommandProvider();
      UrlbarProvidersManager.registerProvider(this.provider);
      this.debugLog("Zen Command Palette provider registered.");

    } catch (e) {
      this.debugError("Failed to create/register Urlbar provider:", e);
    }
  },

  /**
   * Adds a new command to the palette.
   * @param {object} cmd - The command object to add. Must have key, label, and command properties.
   * @returns {object} The command object that was added.
   */
  addCommand(cmd) {
    if (!cmd || !cmd.key || !cmd.label || typeof cmd.command !== "function") {
      throw new Error("addCommand: command must have {key, label, command:function}");
    }
    if (typeof cmd.condition === "undefined") cmd.condition = true;
    this.commands.push(cmd);
    this.debugLog("addCommand:", cmd.key);
    return cmd;
  },

  /**
   * Adds multiple commands to the palette.
   * @param {Array<object>} arr - An array of command objects to add.
   * @returns {Array<object>} The full array of commands after addition.
   */
  addCommands(arr) {
    if (!Array.isArray(arr)) throw new Error("addCommands expects an array");
    for (const c of arr) {
      if (!c.key || !c.label || typeof c.command !== "function") {
        this.debugError("addCommands: skipping invalid command", c);
        continue;
      }
      if (typeof c.condition === "undefined") c.condition = true;
      this.commands.push(c);
    }
    this.debugLog("addCommands: added", arr.length, "items. total commands:", this.commands.length);
    return this.commands;
  },

  /**
   * Removes a command from the palette by its key or a predicate function.
   * @param {string|Function} keyOrPredicate - The key of the command to remove, or a function that returns true for the command to be removed.
   * @returns {object|null} The removed command object, or null if not found.
   */
  removeCommand(keyOrPredicate) {
    const idx = typeof keyOrPredicate === "function"
      ? this.commands.findIndex(keyOrPredicate)
      : this.commands.findIndex(c => c.key === keyOrPredicate);
    if (idx >= 0) {
      const [removed] = this.commands.splice(idx, 1);
      this.debugLog("removeCommand:", removed && removed.key);
      return removed;
    }
    return null;
  },
};

// Expose the object to the window and initialize it.
window.ZenCommandPalette = ZenCommandPalette;
window.ZenCommandPalette.init();
window.ZenCommandPalette.debugLog("Zen Command Palette initialized. Commands count:", window.ZenCommandPalette.commands.length);
