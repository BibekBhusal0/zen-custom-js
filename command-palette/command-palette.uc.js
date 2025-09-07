const ZenCommandPalette = {
  debugMode: true,
  commands: [
    { key: "open:home", label: "Open Home Page", icon: "chrome://browser/skin/home.svg", command: () => console.log("cmd: open:home") },
    { key: "open:downloads", label: "Open Downloads", icon: "chrome://browser/skin/downloads/downloads.svg", command: () => console.log("cmd: open:downloads") },
    { key: "open:bookmarks", label: "Open Bookmarks", command: () => console.log("cmd: open:bookmarks") },
    { key: "tab:new", label: "Open New Tab", icon: "chrome://browser/skin/tabbrowser/tab.svg", command: () => console.log("cmd: tab:new") },
    { key: "tab:close", label: "Close Current Tab", icon: "chrome://browser/skin/tabbrowser/tab-close.svg", command: () => console.log("cmd: tab:close") },
    { key: "tab:list", label: "List Tabs", command: () => console.log("cmd: tab:list") },
    { key: "history:clear", label: "Clear History", icon: "chrome://global/skin/icons/clear.svg", command: () => console.log("cmd: history:clear") },
    { key: "bookmark:add", label: "Add Bookmark", icon: "chrome://global/skin/icons/star.svg", command: () => console.log("cmd: bookmark:add") },
    { key: "bookmark:manage", label: "Manage Bookmarks", icon: "chrome://global/skin/icons/bookmarks.svg", command: () => console.log("cmd: bookmark:manage") },
    { key: "window:new", label: "Open New Window", icon: "chrome://browser/skin/window.svg", command: () => console.log("cmd: window:new") },
    { key: "window:private", label: "New Private Window", icon: "chrome://browser/skin/private-browsing.svg", command: () => console.log("cmd: window:private") },
    { key: "zoom:in", label: "Zoom In", icon: "chrome://global/skin/icons/zoom-in.svg", command: () => console.log("cmd: zoom:in") },
    { key: "zoom:out", label: "Zoom Out", icon: "chrome://global/skin/icons/zoom-out.svg", command: () => console.log("cmd: zoom:out") },
    { key: "find:page", label: "Find on Page", icon: "chrome://global/skin/icons/find.svg", command: () => console.log("cmd: find:page") },
    { key: "dev:tools", label: "Toggle DevTools", icon: "chrome://devtools/skin/images/toolbox.svg", command: () => console.log("cmd: dev:tools") },
    { key: "screenshot:full", label: "Take Full Screenshot", icon: "chrome://global/skin/icons/camera.svg", command: () => console.log("cmd: screenshot:full") },
    { key: "screenshot:visible", label: "Take Visible Screenshot", icon: "chrome://global/skin/icons/camera.svg", command: () => console.log("cmd: screenshot:visible") },
    { key: "profile:reload", label: "Reload Profile", icon: "chrome://global/skin/icons/refresh.svg", command: () => console.log("cmd: profile:reload"), condition: false },
    { key: "profile:info", label: "Show Profile Info", command: () => console.log("cmd: profile:info") },
    { key: "net:offline", label: "Toggle Offline", icon: "chrome://global/skin/icons/eye.svg", command: () => console.log("cmd: net:offline"), condition: false },
    { key: "search:history", label: "Search History", icon: "chrome://global/skin/icons/search-glass.svg", command: () => console.log("cmd: search:history") },
    { key: "search:bookmarks", label: "Search Bookmarks", icon: "chrome://global/skin/icons/search-glass.svg", command: () => console.log("cmd: search:bookmarks") },
    { key: "meta:help", label: "Zen Palette Help", icon: "chrome://global/skin/icons/help.svg", command: () => console.log("cmd: meta:help") },
    { key: "meta:about", label: "About Zen Palette", icon: "chrome://global/skin/icons/info.svg", command: () => console.log("cmd: meta:about") },
  ],
  provider: null,

  debugLog(...args) { if (this.debugMode) console.log("zen-command-palette:", ...args); },
  debugError(...args) { if (this.debugMode) console.error("zen-command-palette:", ...args); },

  safeStr(x) { return (x || "").toString(); },

  commandIsVisible(cmd) {
    try {
      if (typeof cmd.condition === "function") return !!cmd.condition();
      return cmd.condition !== false;
    } catch (e) {
      this.debugError("Error evaluating condition for", cmd && cmd.key, e);
      return false;
    }
  },

  filterCommandsByInput(input) {
    let query = this.safeStr(input).trim();
    const isCommandPrefix = query.startsWith(":");
    if (isCommandPrefix) {
      query = query.substring(1).trim();
    }

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

  findCommandFromDomRow(row) {
    try {
      if (!row) {
        this.debugLog("findCommandFromDomRow: called with null row.");
        return null;
      }
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

  addCommand(cmd) {
    if (!cmd || !cmd.key || !cmd.label || typeof cmd.command !== "function") {
      throw new Error("addCommand: command must have {key, label, command:function}");
    }
    if (typeof cmd.condition === "undefined") cmd.condition = true;
    this.commands.push(cmd);
    this.debugLog("addCommand:", cmd.key);
    return cmd;
  },

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

window.ZenCommandPalette = ZenCommandPalette;
window.ZenCommandPalette.init();
window.ZenCommandPalette.debugLog("Zen Command Palette initialized. Commands count:", window.ZenCommandPalette.commands.length);
