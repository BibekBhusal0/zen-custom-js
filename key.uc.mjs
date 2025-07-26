// ==UserScript==
// @name           Complete Hotkeys
// @description    Full set of custom hotkeys
// ==/UserScript==

const { Runtime, Hotkeys, Prefs } = UC_API;
import { showToast } from "./utils/toast.mjs";


const pasteAndGo = () => {
  navigator.clipboard.readText().then((text) => {
    if (text) {
      try {
        new URL(text);
        openTrustedLinkIn(text, "tab");
      } catch (error) {
        const searchURL = `https://duckduckgo.com/?q=${encodeURIComponent(text)}`;
        showToast("Searching in DuckDuckGo", "success");
        openTrustedLinkIn(searchURL, "tab");
      }
    }
  });
};

function MinimizeMemoryUse() {
  const observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  for (let i = 0; i < 3; i++) {
    observerService.notifyObservers(null, "memory-pressure", "heap-minimize");
  }
  showToast("Memory use Minimized", "success");
}

const togglePref = (prefName) => {
  const pref = Prefs.get(prefName);
  if (!pref || pref.type !== "boolean") return;
  pref.setTo(!pref.value);
};

// https://github.com/Darsh-A/Ai-TabGroups-ZenBrowser/blob/main/clear.uc.js
const clearTabs = () => {
  try {
    const currentWorkspaceId = window.gZenWorkspaces?.activeWorkspace;
    if (!currentWorkspaceId) return;
    const groupSelector = `tab-group:has(tab[zen-workspace-id="${currentWorkspaceId}"])`;
    const tabsToClose = [];
    for (const tab of gBrowser.tabs) {
      const isSameWorkSpace = tab.getAttribute("zen-workspace-id") === currentWorkspaceId;
      const groupParent = tab.closest("tab-group");
      const isInGroupInCorrectWorkspace = groupParent ? groupParent.matches(groupSelector) : false;
      const isEmptyZenTab = tab.hasAttribute("zen-empty-tab");
      if (
        isSameWorkSpace &&
        !tab.selected &&
        !tab.pinned &&
        !isInGroupInCorrectWorkspace &&
        !isEmptyZenTab &&
        tab.isConnected
      ) {
        tabsToClose.push(tab);
      }
    }
    if (tabsToClose.length === 0) return;

    tabsToClose.forEach((tab) => {
      tab.classList.add("tab-closing");
      setTimeout(() => {
        if (tab && tab.isConnected) {
          try {
            gBrowser.removeTab(tab, {
              animate: false,
              skipSessionStore: false,
              closeWindowWithLastTab: false,
            });
          } catch (removeError) {
            if (tab && tab.isConnected) {
              tab.classList.remove("tab-closing");
            }
          }
        }
      }, 500);
    });
  } catch (error) {
    console.log(error);
  }
};

const hotkeys = [
  {
    id: "duplicateTab",
    modifiers: "alt",
    key: "D",
    command: (window) => {
      const newTab = window.gBrowser.duplicateTab(window.gBrowser.selectedTab);
      window.gBrowser.selectedTab = newTab;
    },
  },

  {
    id: "restartBrowser",
    modifiers: "ctrl shift alt",
    key: "R",
    command: () => Runtime.restart(true),
  },

  {
    id: "testHotkey",
    modifiers: "ctrl shift alt",
    key: "T",
    command: (param) => {
      console.log("Test hotkey pressed! Parameter:", param);
      showToast("Test HotKey", "success");
    },
  },

  {
    id: "previousTab",
    modifiers: "alt",
    key: "J",
    command: (window) => window.gBrowser.tabContainer.advanceSelectedTab(1, true),
  },

  {
    id: "nextTab",
    modifiers: "alt",
    key: "K",
    command: (window) => window.gBrowser.tabContainer.advanceSelectedTab(-1, true),
  },

  {
    id: "moveTabNext",
    modifiers: "ctrl alt",
    key: "j",
    command: (window) => window.gBrowser.moveTabForward(),
  },

  {
    id: "moveTabPrev",
    modifiers: "ctrl alt",
    key: "k",
    command: (window) => window.gBrowser.moveTabBackward(),
  },

  {
    id: "toggletabpin",
    modifiers: "alt",
    key: "o",
    command: (window) => {
      const tab = window.gBrowser.selectedTab;
      if (tab.pinned) {
        window.gBrowser.unpinMultiSelectedTabs();
      } else {
        window.gBrowser.pinMultiSelectedTabs();
      }
    },
  },

  {
    id: "previousTabHistory",
    modifiers: "alt",
    key: "H",
    command: (window) => window.gBrowser.goBack(),
  },

  {
    id: "nextTabHistory",
    modifiers: "alt",
    key: "L",
    command: (window) => window.gBrowser.goForward(),
  },

  {
    id: "toggleToolbar",
    modifiers: "alt ctrl",
    key: "T",
    command: () => togglePref("zen.view.compact.hide-toolbar"),
  },

  {
    id: "toggleTabbar",
    modifiers: "alt ctrl",
    key: "A",
    command: () => togglePref("zen.view.compact.hide-tabbar"),
  },

  {
    id: "togglePDFDarkMode",
    modifiers: "ctrl alt shift",
    key: "D",
    command: () => togglePref("pdf.dark.mode.disabled"),
  },

  {
    id: "openSettings",
    modifiers: "ctrl alt",
    key: "S",
    command: () => openTrustedLinkIn("about:preferences", "tab"),
  },

  {
    id: "openAdvancedSettings",
    modifiers: "ctrl shift alt",
    key: "S",
    command: () => openTrustedLinkIn("about:config", "tab"),
  },

  {
    id: "pasteAndGo",
    modifiers: "alt",
    key: "V",
    command: pasteAndGo,
  },

  {
    id: "MinimizeMemoryUse",
    modifiers: "ctrl alt shift",
    key: "M",
    command: MinimizeMemoryUse,
  },

  {
    id: "ClearTabs",
    modifiers: "alt",
    key: "X",
    command: () => {
      clearTabs();
      showToast("Tabs Closed", "success");
    },
  },

  {
    id: "unloadTab",
    modifiers: "alt",
    key: "U",
    command: (window) => {
      const current = window.gBrowser.selectedTab;

      const tabs = Array.from(window.gBrowser.tabs)
        .filter((t) => t !== current && !t.hasAttribute("pending"))
        .sort((a, b) => b._lastAccessed - a._lastAccessed);

      const target = tabs[0];
      if (target) window.gBrowser.selectedTab = target;
      else openTrustedLinkIn("about:blank", "tab");

      setTimeout(() => {
        window.gBrowser.discardBrowser(current);
      }, 500);
    },
  },

  {
    id: "unloadOtherTab",
    modifiers: "alt ctrl",
    key: "U",
    command: (window) => {
      for (let tab of window.gBrowser.tabs) {
        if (!tab.selected) window.gBrowser.discardBrowser(tab);
      }
    },
  },
];

if (typeof UC_API !== "undefined") {
  Runtime.startupFinished().then(() => {
    hotkeys.forEach((hotkey) => {
      Hotkeys.define(hotkey).autoAttach({ suppressOriginal: false });
    });
  });
}
