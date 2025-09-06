const debugMode = true;
function debugLog(...args) { if (debugMode) console.log("zen-command-palette:", ...args); }
function debugError(...args) { if (debugMode) console.error("zen-command-palette:", ...args); }

const { UrlbarUtils, UrlbarProvider } =
  ChromeUtils.importESModule("resource:///modules/UrlbarUtils.sys.mjs");
const { UrlbarProvidersManager } =
  ChromeUtils.importESModule("resource:///modules/UrlbarProvidersManager.sys.mjs");
const { UrlbarResult } =
  ChromeUtils.importESModule("resource:///modules/UrlbarResult.sys.mjs");

function safeStr(x) { return (x || "").toString(); }

const commands = [
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
];

// condition defaults to true (if omitted)
function commandIsVisible(cmd) {
  try {
    if (typeof cmd.condition === "function") return !!cmd.condition();
    return cmd.condition !== false;
  } catch (e) {
    debugError("Error evaluating condition for", cmd && cmd.key, e);
    return false;
  }
}

function filterCommandsByInput(input) {
  input = safeStr(input).trim();
  if (!input) return [];
  const lower = input.toLowerCase();
  return commands.filter(cmd => {
    if (!commandIsVisible(cmd)) return false;
    if ((cmd.key || "").toLowerCase().includes(lower)) return true;
    if ((cmd.label || "").toLowerCase().includes(lower)) return true;
    const prefix = (cmd.key || "").split(":")[0];
    return prefix && prefix.toLowerCase().startsWith(lower);
  });
}

// safely execute a command object
function executeCommandObject(cmd) {
  if (!cmd) { debugError("executeCommandObject: no command"); return; }
  try {
    debugLog("Executing command:", cmd.key || cmd.label);
    const ret = cmd.command && cmd.command();
    if (ret && typeof ret.then === "function") {
      ret.catch(e => debugError("Command promise rejected:", e));
    }
  } catch (e) {
    debugError("Command execution error:", e);
  }
}

// Map DOM result element -> our command. Provider stores last results on _lastResults.
function findCommandFromDomRow(row, provider) {
  try {
    if (!row) return null;
    // Many urlbar row elements have an aria-label / textContent containing the suggestion title.
    const title = (row.querySelector && (row.querySelector(".urlbarView-title, .urlbarView-row-inner, .urlbarView-row")?.textContent)) || row.textContent || "";
    const trimmed = safeStr(title).trim();
    if (!trimmed && provider && provider._lastResults) {
      // fallback: if there is a single result selected, return it
      if (provider._lastResults.length === 1) return provider._lastResults[0] && provider._lastResults[0]._zenCmd;
      return null;
    }
    // match by title / suggestion -> our payload.title or payload.suggestion
    if (provider && provider._lastResults) {
      for (const r of provider._lastResults) {
        const payloadTitle = (r && r.payload && (r.payload.title || r.payload.suggestion || r.title)) || "";
        if (payloadTitle && payloadTitle.trim() === trimmed) return r._zenCmd || null;
      }
    }
    // best-effort: attempt to match visible text to command.label
    const found = commands.find(c => c.label === trimmed || c.label === trimmed.replace(/\s*\(dummy\)$/, ""));
    return found || null;
  } catch (e) {
    debugError("findCommandFromDomRow error:", e);
    return null;
  }
}

// Try to attach event listeners to URL-bar popup to detect clicks and selection via keyboard.
function attachUrlbarSelectionListeners(provider) {
  try {
    // try common popup access points
    const possiblePopups = [
      (typeof gURLBar !== "undefined" && gURLBar.popup) || null,
      document.getElementById("urlbar-results"),
      document.getElementById("PopupAutoComplete"),
      document.getElementById("urlbar-popup"),
    ].filter(Boolean);

    if (!possiblePopups.length) {
      debugLog("No urlbar popup element found for attaching selection listeners.");
      return;
    }

    // pick the first workable popup element
    const popup = possiblePopups[0];

    // click handler on popup (delegate)
    function onPopupClick(e) {
      try {
        // find nearest row element
        let node = e.target;
        while (node && node !== popup && !node.classList?.contains?.("urlbarView-row") && node.getAttribute && !node.getAttribute("role")) {
          node = node.parentNode;
        }
        // fallback: walk up until we hit something with 'urlbarView-row' in class or role=row
        if (node === popup) node = null;
        const cmd = findCommandFromDomRow(node, provider);
        if (cmd) {
          executeCommandObject(cmd);
          // stop propagation so default Urlbar open may not attempt normal navigation
          e.stopPropagation();
          e.preventDefault();
        }
      } catch (ee) {
        debugError("onPopupClick error:", ee);
      }
    }

    // key handler for Enter on urlbar (executes selected suggestion)
    function onUrlbarKeydown(e) {
      try {
        if (e.key !== "Enter") return;
        // attempt to find selected row from popup APIs
        let selectedRow = null;
        if (popup && typeof popup.getSelectedIndex === "function") {
          const idx = popup.getSelectedIndex();
          selectedRow = idx >= 0 && popup.getRowAt && popup.getRowAt(idx);
        }
        // various implementations expose selectedIndex / selectedItem
        if (!selectedRow) {
          selectedRow = popup && (popup.selectedItem || popup.selected || popup.selectedRow || popup.querySelector && popup.querySelector(".urlbarView-row[selected]"));
        }
        // fallback: use focused element in popup
        if (!selectedRow) {
          const focused = document.activeElement;
          if (popup && popup.contains && popup.contains(focused)) selectedRow = focused;
        }

        const cmd = findCommandFromDomRow(selectedRow, provider);
        if (cmd) {
          executeCommandObject(cmd);
          e.stopPropagation();
          e.preventDefault();
        }
      } catch (ee) {
        debugError("onUrlbarKeydown error:", ee);
      }
    }

    // Avoid attaching multiple times
    if (!popup._zenCmdListenersAttached) {
      // attach click for mouse selection
      popup.addEventListener("click", onPopupClick, true);
      // attach keydown on the URL bar input itself to catch Enter
      if (typeof gURLBar !== "undefined" && gURLBar.inputField) {
        gURLBar.inputField.addEventListener("keydown", onUrlbarKeydown, true);
      } else if (typeof gURLBar !== "undefined") {
        gURLBar.addEventListener("keydown", onUrlbarKeydown, true);
      } else {
        // fallback: attach keydown at document-level when popup is present
        document.addEventListener("keydown", onUrlbarKeydown, true);
      }
      popup._zenCmdListenersAttached = true;
      debugLog("Attached urlbar popup selection listeners (click + Enter).");
    }
  } catch (e) {
    debugError("attachUrlbarSelectionListeners error:", e);
  }
}

if (typeof UrlbarProvider !== "undefined" && typeof UrlbarProvidersManager !== "undefined") {
  try {
    class ZenCommandProvider extends UrlbarProvider {
      get name() { return "ZenCommandPalette"; }
      get type() { return UrlbarUtils.PROVIDER_TYPE.PROFILE; }
      getPriority(context) { return 900; } // high priority to appear on top

      // active only when matches exist to avoid interfering when no commands match
      async isActive(context) {
        try {
          const input = (context && (context.searchString || context.text || context.trimmed)) || (typeof gURLBar !== "undefined" ? gURLBar.value : "");
          const matches = filterCommandsByInput(input || "");
          const active = (matches && matches.length > 0);
          debugLog("isActive ->", active, "text:", input);
          return active;
        } catch (e) {
          debugError("isActive error:", e);
          return false;
        }
      }

      async startQuery(context, add) {
        try {
          const input = (context && (context.searchString || context.text || context.trimmed)) || (typeof gURLBar !== "undefined" ? gURLBar.value : "");
          const matches = filterCommandsByInput(input || "");
          debugLog("startQuery input:", input, "matches:", matches.length);

          if (!matches.length) {
            this._lastResults = [];
            return;
          }

          // Build results and add them. Use allowed payload fields only.
          this._lastResults = [];
          for (const cmd of matches) {
            const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
              suggestion: cmd.label,
              title: cmd.label,
              url: "",
              query: cmd.key,
            });

            // valid source/type
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

            try {
              if (typeof add === "function") {
                try { add(this, result); } catch (_) { add(result); }
              } else if (add && typeof add.addResult === "function") {
                add.addResult(this, result);
              } else if (add && typeof add.add === "function") {
                add.add(this, result);
              }
            } catch (e) {
              debugError("Error calling add for result", e);
            }
          }

          // After results are prepared, attach DOM listeners so selection triggers execution.
          // This is defensive: UI internals differ between Fx versions, so we attach generic listeners.
          try {
            attachUrlbarSelectionListeners(this);
          } catch (e) {
            debugError("Failed to attachUrlbarSelectionListeners:", e);
          }
        } catch (e) {
          debugError("startQuery unexpected error:", e);
        }
      }

      getResultCount() { return (this._lastResults && this._lastResults.length) || 0; }
      getResultAt(i) { return (this._lastResults && this._lastResults[i]) || null; }

      // support multiple possible pick handler names
      pickResult(result, event) { return this._handlePick(result, event); }
      pick(result, event) { return this._handlePick(result, event); }
      onResultAction(result, event) { return this._handlePick(result, event); }

      _handlePick(result, event) {
        try {
          let cmd = result && (result._zenCmd || (result.payload && result.payload.query));
          if (typeof cmd === "string") cmd = commands.find(c => c.key === cmd);
          if (cmd && typeof cmd.command === "function") {
            executeCommandObject(cmd);
            return true;
          }
          debugError("pick: no runnable command found", result);
          return false;
        } catch (e) {
          debugError("pick unexpected error:", e);
          return false;
        }
      }

      dispose() { this._lastResults = []; }
    } // class

    const provider = new ZenCommandProvider();
    UrlbarProvidersManager.registerProvider(provider);
    debugLog("Zen Command Palette provider registered.");

    // Expose runtime helpers and mutation helpers
    window.ZenCommandPalette = window.ZenCommandPalette || {};
    window.ZenCommandPalette.provider = provider;
    window.ZenCommandPalette.commands = commands;
    window.ZenCommandPalette.filterCommandsByInput = filterCommandsByInput;
    window.ZenCommandPalette.executeCommandObject = executeCommandObject;
    window.ZenCommandPalette.findCommandFromDomRow = (row) => findCommandFromDomRow(row, provider);

    window.ZenCommandPalette.addCommand = function(cmd) {
      if (!cmd || !cmd.key || !cmd.label || typeof cmd.command !== "function") {
        throw new Error("addCommand: command must have {key, label, command:function}");
      }
      // default condition to true if omitted
      if (typeof cmd.condition === "undefined") cmd.condition = true;
      commands.push(cmd);
      debugLog("addCommand:", cmd.key);
      return cmd;
    };

    window.ZenCommandPalette.addCommands = function(arr) {
      if (!Array.isArray(arr)) throw new Error("addCommands expects an array");
      for (const c of arr) {
        if (!c.key || !c.label || typeof c.command !== "function") {
          debugError("addCommands: skipping invalid command", c);
          continue;
        }
        if (typeof c.condition === "undefined") c.condition = true;
        commands.push(c);
      }
      debugLog("addCommands: added", arr.length, "items. total commands:", commands.length);
      return commands;
    };

    window.ZenCommandPalette.removeCommand = function(keyOrPredicate) {
      const idx = typeof keyOrPredicate === "function"
        ? commands.findIndex(keyOrPredicate)
        : commands.findIndex(c => c.key === keyOrPredicate);
      if (idx >= 0) {
        const [removed] = commands.splice(idx, 1);
        debugLog("removeCommand:", removed && removed.key);
        return removed;
      }
      return null;
    };

  } catch (e) {
    debugError("Failed to create/register Urlbar provider:", e);
  }
} else {
  debugError("UrlbarProvider or UrlbarProvidersManager not available; provider not registered.");
}

debugLog("Zen Command Palette initialized. Commands count:", commands.length);
