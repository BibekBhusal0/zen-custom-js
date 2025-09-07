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
  let query = safeStr(input).trim();
  const isCommandPrefix = query.startsWith(":");
  if (isCommandPrefix) {
    query = query.substring(1).trim()
  }

  // If the input was just the prefix, show all commands.
  if (isCommandPrefix && !query) {
    return commands.filter(commandIsVisible);
  }

  // If there's no query (e.g. empty input), return no results.
  if (!query) {
    return [];
  }

  const lower = query.toLowerCase();
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
    if (!row) {
      debugLog("findCommandFromDomRow: called with null row.");
      return null;
    }
    // Prioritize the specific title element, which contains only our command label.
    const titleEl = row.querySelector(".urlbarView-title");
    const title = titleEl?.textContent || row.getAttribute("aria-label") || row.textContent || "";
    const trimmed = safeStr(title).trim();

    if (!trimmed) {
      debugLog("findCommandFromDomRow: row has no title/text content", row);
      if (provider && provider._lastResults && provider._lastResults.length === 1) {
        debugLog("findCommandFromDomRow: falling back to single result.");
        return provider._lastResults[0] && provider._lastResults[0]._zenCmd;
      }
      return null;
    }
    debugLog("findCommandFromDomRow: trying to match row title:", `"${trimmed}"`);

    // Match the extracted text against the last known results to the provider.
    if (provider && provider._lastResults) {
      for (const r of provider._lastResults) {
        if (!r || !r.payload) continue;
        const payloadTitle = (r.payload.title || r.payload.suggestion || "").trim();
        if (payloadTitle && trimmed.startsWith(payloadTitle)) {
          debugLog("findCommandFromDomRow: matched by startsWith payload title.", r._zenCmd);
          return r._zenCmd || null;
        }
      }
    }

    // Best-effort fallback: if the above failed, try matching against the full commands list.
    const found = commands.find(c => trimmed.startsWith(c.label));
    if (found) {
      debugLog("findCommandFromDomRow: matched command label as fallback.", found);
      return found;
    }

    debugLog("findCommandFromDomRow: failed to match row title to any command.");
    return null;
  } catch (e) {
    debugError("findCommandFromDomRow error:", e);
    return null;
  }
}

// Try to attach event listeners to URL-bar popup to detect clicks and selection via keyboard.
function attachUrlbarSelectionListeners(provider) {
  try {
    debugLog("Attempting to attach URL bar listeners...");
    const popup = (typeof gURLBar !== "undefined" && gURLBar.view?.results) || document.getElementById("urlbar-results");

    if (!popup) {
      debugError("Could not find urlbar popup element (gURLBar.view.results). Listeners not attached.");
      return;
    }

    // click handler on popup (delegate)
    function onPopupClick(e) {
      try {
        debugLog("Popup click event triggered.", "Target:", e.target);
        const row = e.target.closest(".urlbarView-row");
        if (!row) {
          debugLog("Click was not inside a urlbarView-row.");
          return;
        }
        debugLog("Found row node from click:", row);
        const cmd = findCommandFromDomRow(row, provider);
        debugLog("Command from clicked row:", cmd);
        if (cmd) {
          debugLog("Executing command from click, stopping further event propagation.");
          executeCommandObject(cmd);
          e.stopImmediatePropagation();
          e.preventDefault();
          if (typeof gURLBar !== "undefined" && gURLBar.view) gURLBar.view.close();
        }
      } catch (ee) {
        debugError("onPopupClick error:", ee);
      }
    }

    // key handler for Enter on urlbar (executes selected suggestion)
    function onUrlbarKeydown(e) {
      try {
        if (e.key !== "Enter" || e.defaultPrevented) return;
        debugLog("Enter key pressed on urlbar.");

        const view = typeof gURLBar !== "undefined" && gURLBar.view;
        if (!view || !view.isOpen || view.selectedElementIndex < 0) {
            debugLog("Enter pressed, but view is not open or no element is selected.");
            return;
        }
        
        if (!popup || !popup.children) {
            debugError("Keydown handler cannot find popup or its children.");
            return;
        }
        const selectedRow = popup.children[view.selectedElementIndex];
        debugLog("Found selected row using index:", view.selectedElementIndex, selectedRow);

        const cmd = findCommandFromDomRow(selectedRow, provider);
        debugLog("Found command from selected row:", cmd);
        if (cmd) {
          debugLog("Executing command from Enter key, stopping further event propagation.");
          executeCommandObject(cmd);
          e.stopImmediatePropagation();
          e.preventDefault();
          if (typeof gURLBar !== "undefined" && gURLBar.view) gURLBar.view.close();
        } else {
          debugLog("No command found for selected row on Enter, allowing default action.");
        }
      } catch (ee) {
        debugError("onUrlbarKeydown error:", ee);
      }
    }

    // Avoid attaching multiple times by checking for our custom flag.
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
}

if (typeof UrlbarProvider !== "undefined" && typeof UrlbarProvidersManager !== "undefined") {
  try {
    class ZenCommandProvider extends UrlbarProvider {
      get name() { return "ZenCommandPalette"; }
      get type() { return UrlbarUtils.PROVIDER_TYPE.PROFILE; }
      getPriority(context) {
        const input = (context.searchString || "").trim();
        if (input.startsWith(":")) {
          return 10000;
        }
        return 0;
      }

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
