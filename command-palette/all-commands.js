// This file is adapted from the command list in ZBar-Zen by Darsh-A
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js
import { svgToUrl, icons } from "../utils/icon.js";
import { getPref, setPref } from "../utils/pref.js";
import { PREFS } from "./utils/prefs.js";
import { ZenCommandPalette } from "./index.js";
import { isNotEmptyTab } from "./utils/notEmptyTab.js";

function restartApplication(clearCache) {
  clearCache && Services.appinfo.invalidateCachesOnRestart();
  let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
  Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
  if (!cancelQuit.data) {
    Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);
    return true;
  }
  return false;
}

const isCompactMode = () => gZenCompactModeManager?.preference;
const inGlance = () => gBrowser.selectedTab.hasAttribute("glance-id");
const togglePref = (prefName) => {
  const pref = getPref(prefName);
  if (typeof pref === "boolean") return;
  setPref(!pref);
};

function isPinnedTabDifferent() {
  if (!window.gZenPinnedTabManager) return false;
  const currentTab = gBrowser.selectedTab;
  if (!currentTab) return false;
  if (!currentTab.pinned) return false;
  const pin = gZenPinnedTabManager._pinsCache.find(
    (pin) => pin.uuid === currentTab.getAttribute("zen-pin-id")
  );
  if (!pin) return false;
  return pin.url !== currentTab.linkedBrowser.currentURI.spec;
}

export const commands = [
  // ----------- Zen Compact Mode -----------
  {
    key: "cmd_zenCompactModeShowSidebar",
    label: "Toggle Floating Sidebar",
    icon: "chrome://browser/skin/zen-icons/sidebar.svg",
    condition: isCompactMode,
    tags: ["compact", "sidebar", "show", "ui"],
  },
  {
    key: "cmd_zenCompactModeShowToolbar",
    label: "Toggle Floating Toolbar",
    condition: isCompactMode,
    tags: ["compact", "toolbar", "show", "ui"],
  },
  {
    key: "toggle-sidebar",
    label: "Toggle Sidebar",
    command: () => togglePref("zen.view.compact.hide-tabbar"),
    condition: () => isCompactMode(),
    icon: "chrome://browser/skin/zen-icons/expand-sidebar.svg",
    tags: ["compact", "sidebar", "hide", "ui"],
  },
  {
    key: "toggle-toolbar",
    label: "Toggle Toolbar",
    command: () => togglePref("zen.view.compact.hide-toolbar"),
    condition: () => isCompactMode(),
    tags: ["compact", "toolbar", "hide", "ui"],
  },

  // ----------- Zen Workspace Management -----------
  {
    key: "cmd_zenCtxDeleteWorkspace",
    label: "Delete Workspace",
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["workspace", "delete", "remove", "management", "trash"],
  },
  {
    key: "cmd_zenChangeWorkspaceIcon",
    label: "Change Workspace Icon",
    icon: "chrome://browser/skin/zen-icons/selectable/image.svg",
    tags: ["workspace", "icon", "change", "customize", "management"],
  },
  {
    key: "cmd_zenOpenWorkspaceCreation",
    label: "Create New Workspace",
    icon: "chrome://browser/skin/zen-icons/plus.svg",
    tags: ["workspace", "create", "new", "add", "management"],
  },
  {
    key: "cmd_zenChangeWorkspaceName",
    label: "Change Workspace Name",
    icon: "chrome://global/skin/icons/edit.svg",
    tags: ["workspace", "name", "rename", "edit", "management"],
  },

  // ----------- Zen Split View -----------
  {
    key: "cmd_zenSplitViewUnsplit",
    label: "Unsplit View",
    condition: () => gZenViewSplitter?.splitViewActive,
    tags: ["split", "view", "unsplit", "single", "restore", "remove"],
  },
  {
    key: "cmd_zenSplitViewSwap",
    label: "Swap Split Tabs",
    icon: svgToUrl(icons["swap"]),
    command: () => {
      if (
        !gZenViewSplitter.splitViewActive ||
        gZenViewSplitter._data[gZenViewSplitter.currentView]?.tabs.length !== 2
      )
        return;

      const viewData = gZenViewSplitter._data[gZenViewSplitter.currentView];
      const node1 = gZenViewSplitter.getSplitNodeFromTab(viewData.tabs[0]);
      const node2 = gZenViewSplitter.getSplitNodeFromTab(viewData.tabs[1]);

      gZenViewSplitter.swapNodes(node1, node2);
      gZenViewSplitter.applyGridLayout(viewData.layoutTree);
    },
    condition: () =>
      gZenViewSplitter?.splitViewActive &&
      gZenViewSplitter._data[gZenViewSplitter.currentView]?.tabs.length === 2,
    tags: ["split", "view", "swap", "panes", "tabs", "rotate"],
  },
  {
    key: "cmd_zenSplitViewRotate",
    label: "Rotate Split Orientation",
    command: () => {
      if (
        !gZenViewSplitter.splitViewActive ||
        gZenViewSplitter._data[gZenViewSplitter.currentView]?.tabs.length !== 2
      )
        return;

      const viewData = gZenViewSplitter._data[gZenViewSplitter.currentView];
      const layoutTree = viewData.layoutTree;

      layoutTree.direction = layoutTree.direction === "row" ? "column" : "row";
      gZenViewSplitter.activateSplitView(viewData, true);
    },
    condition: () =>
      gZenViewSplitter?.splitViewActive &&
      gZenViewSplitter._data[gZenViewSplitter.currentView]?.tabs.length === 2,
    tags: ["split", "view", "rotate", "orientation", "layout"],
  },

  // ----------- Zen Glance -----------
  {
    key: "cmd_zenGlanceClose",
    label: "Close Glance",
    tags: ["glance", "close", "peak"],
    icon: "chrome://browser/skin/zen-icons/close.svg",
    condition: inGlance,
  },
  {
    key: "cmd_zenGlanceExpand",
    label: "Expand Glance",
    tags: ["glance", "expand", "peak", "full"],
    icon: "chrome://browser/skin/fullscreen.svg",
    condition: inGlance,
  },
  {
    key: "cmd_zenGlanceSplit",
    label: "Split Glance",
    tags: ["glance", "split", "multitask", "peak", "horizontal", "vertical"],
    icon: svgToUrl(icons["splitVz"]),
    condition: inGlance,
  },

  // ----------- Additional Zen Commands -----------
  {
    key: "cmd_zenReorderWorkspaces",
    label: "Reorder Workspaces",
    tags: ["workspace", "reorder", "organize", "sort"],
  },
  {
    key: "cmd_zenToggleSidebar",
    label: "Toggle Sidebar Width",
    icon: "chrome://browser/skin/zen-icons/sidebar.svg",
    tags: ["sidebar", "toggle", "show", "hide"],
  },
  {
    key: "cmd_zenCopyCurrentURLMarkdown",
    label: "Copy Current URL as Markdown",
    icon: "chrome://browser/skin/zen-icons/link.svg",
    tags: ["copy", "url", "markdown", "format", "clipboard"],
  },
  {
    key: "toggle-single-toolbar-mode",
    label: "Toggle Single toolbar mode",
    icon: "chrome://browser/skin/zen-icons/sidebar.svg",
    tags: ["toggle", "toolbar", "single", "double", "sidebar"],
    command: () => togglePref("zen.view.use-single-toolbar"),
  },
  {
    key: "toggle-collapsed-pins",
    label: "Toggle Collapsed Pins",
    tags: ["toggle", "collapse", "expand"],
    command: () => {
      const wsID = gZenWorkspaces.getActiveWorkspace().uuid;
      if (!wsID) return;
      const wsElem = document.querySelector(`[id="${wsID}"]`);
      if (!wsElem) return;
      const cp = wsElem.querySelector("zen-workspace-collapsible-pins");
      if (!cp) return;
      cp.collapsed = !cp.collapsed;
    },
  },

  // ----------- Folder Management -----------
  {
    key: "folder-remove-active-tab",
    label: "Remove Tab from Folder",
    command: () => {
      const tab = gBrowser.selectedTab;
      if (tab?.group?.isZenFolder) {
        gBrowser.ungroupTab(tab);
      }
    },
    condition: () => gBrowser.selectedTab?.group?.isZenFolder,
    icon: svgToUrl(icons["folderOut"]),
    tags: ["folder", "remove", "unparent", "tab", "group"],
  },
  {
    key: "folder-rename",
    label: "Rename Current Folder",
    command: () => {
      const tab = gBrowser.selectedTab;
      if (tab?.group?.isZenFolder) {
        gBrowser.selectedTab.group.rename();
        gBrowser.selectedTab.group.focus();
      }
    },
    condition: () => gBrowser.selectedTab?.group?.isZenFolder,
    icon: "chrome://global/skin/icons/edit.svg",
    tags: ["folder", "rename", "change", "tab", "group"],
  },

  // ----------- Tab Management -----------
  {
    key: "rename-tab",
    label: "Rename Tab",
    command: () => {
      TabContextMenu.contextTab = gBrowser.selectedTab;
      document.getElementById("context_zen-edit-tab-title")?.click();
    },
    condition: () => gBrowser?.selectedTab,
    icon: "chrome://global/skin/icons/edit.svg",
    tags: ["rename", "tab", "title", "edit"],
  },
  {
    key: "change-tab-icon",
    label: "Change Tab Icon",
    command: () => {
      TabContextMenu.contextTab = gBrowser.selectedTab;
      document.getElementById("context_zen-edit-tab-icon")?.click();
    },
    condition: () => gBrowser?.selectedTab,
    icon: "chrome://browser/skin/zen-icons/selectable/image.svg",
    tags: ["tab", "icon", "edit", "change"],
  },
  {
    key: "duplicate-tab",
    label: "Duplicate Tab",
    command: () => {
      const newTab = window.gBrowser.duplicateTab(window.gBrowser.selectedTab);
      window.gBrowser.selectedTab = newTab;
    },
    condition: () => !!window.gBrowser?.duplicateTab && isNotEmptyTab(),
    icon: "chrome://browser/skin/zen-icons/duplicate-tab.svg",
    tags: ["duplicate", "tab", "copy", "clone"],
  },
  {
    key: "cmd_newNavigatorTab",
    label: "New Tab",
    icon: "chrome://browser/skin/zen-icons/plus.svg",
    tags: ["new", "home", "black", "tab"],
  },
  {
    key: "home",
    label: "Home",
    command: () => BrowserCommands.home(),
    condition: !!window.BrowserCommands,
    icon: "chrome://browser/skin/zen-icons/home.svg",
    tags: ["new", "home", "black", "tab"],
  },
  {
    key: "move-tab-up",
    label: "Move Tab Up",
    command: () => window.gBrowser.moveTabBackward(),
    condition: !!window.gBrowser?.moveTabBackward,
    icon: "chrome://browser/skin/zen-icons/arrow-up.svg",
    tags: ["move", "tab", "up", "backward", "reorder", "next"],
  },
  {
    key: "move-tab-down",
    label: "Move Tab Down",
    command: () => window.gBrowser.moveTabForward(),
    condition: !!window.gBrowser?.moveTabForward,
    icon: "chrome://browser/skin/zen-icons/arrow-down.svg",
    tags: ["move", "tab", "down", "forward", "reorder", "next"],
  },
  {
    key: "move-tab-to-new-window",
    label: "Move Tab to New Window",
    command: () => window.gBrowser.replaceTabWithWindow(window.gBrowser.selectedTab),
    condition: isNotEmptyTab,
    icon: "chrome://browser/skin/window.svg",
    tags: ["move", "tab", "new", "window", "detach", "popout"],
  },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/zen-icons/media-mute.svg",
    tags: ["tab", "mute", "audio", "sound", "toggle"],
    condition: isNotEmptyTab,
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    tags: ["show", "all", "tabs", "panel", "overview"],
  },
  {
    key: "cmd_zenReplacePinnedUrlWithCurrent",
    label: "Replace Pinned Tab URL with Current",
    command: () => gZenPinnedTabManager.replacePinnedUrlWithCurrent(gBrowser.selectedTab),
    condition: isPinnedTabDifferent,
    tags: ["pinned", "tab", "url", "replace", "current"],
    icon: "chrome://browser/skin/zen-icons/reload.svg",
  },
  {
    key: "cmd_zenPinnedTabReset",
    label: "Reset Pinned Tab",
    condition: isPinnedTabDifferent,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["pinned", "tab", "reset", "restore"],
  },
  {
    key: "History:UndoCloseTab",
    label: "Reopen Closed Tab",
    icon: "chrome://browser/skin/zen-icons/history.svg",
    tags: ["undo", "close", "tab", "reopen", "restore"],
  },
  {
    key: "unload-tab",
    label: "Unload Tab",
    condition: isNotEmptyTab,
    command: () => {
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
    icon: "chrome://browser/skin/zen-icons/close.svg",
    // HACK:  include multiple tags so that this appears on top when typed `unload`
    tags: ["unload", "sleep", "unload", "unload"],
  },
  {
    key: "unload-other-tabs",
    label: "Unload other tabs",
    command: () => {
      for (let tab of window.gBrowser.tabs) {
        if (!tab.selected) window.gBrowser.discardBrowser(tab);
      }
    },
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["unload", "sleep"],
  },
  {
    key: "cmd_zenCloseUnpinnedTabs",
    label: "Clear Other Tabs",
    icon: svgToUrl(icons["broom"]),
    tags: ["clear", "tabs", "close", "other", "workspace", "clean", "unpinned"],
  },

  // ----------- Window Management -----------
  {
    key: "cmd_closeWindow",
    label: "Close Window",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["window", "close", "remove", "exit", "quit"],
  },
  {
    key: "cmd_minimizeWindow",
    label: "Minimize Window",
    icon: "chrome://browser/skin/zen-icons/unpin.svg",
    tags: ["window", "minimize", "hide"],
  },
  {
    key: "cmd_maximizeWindow",
    label: "Maximize Window",
    icon: "chrome://browser/skin/zen-icons/window.svg",
    tags: ["window", "Maximize", "fullscreen"],
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    icon: "chrome://browser/skin/zen-icons/history.svg",
    tags: ["undo", "close", "window", "reopen", "restore"],
  },

  // ----------- Navigation -----------
  {
    key: "Browser:Back",
    label: "Go Back",
    condition: () => gBrowser.canGoBack,
    icon: "chrome://browser/skin/back.svg",
    tags: ["back", "navigate", "history", "previous"],
  },
  {
    key: "Browser:Forward",
    label: "Go Forward",
    condition: () => gBrowser.canGoForward,
    icon: "chrome://browser/skin/forward.svg",
    tags: ["forward", "navigate", "history", "next"],
  },

  // ----------- Bookmarks & History -----------
  {
    key: "Browser:AddBookmarkAs",
    label: "Bookmark This Page",
    icon: "chrome://browser/skin/bookmark.svg",
    tags: ["bookmark", "save", "favorite", "add", "library"],
    condition: isNotEmptyTab,
  },
  {
    key: "Browser:BookmarkAllTabs",
    label: "Bookmark All Tabs",
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
    tags: ["bookmark", "all", "tabs", "save", "favorite", "library"],
  },
  {
    key: "viewBookmarksToolbarKb",
    label: "Toggle Bookmark Bar",
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
    tags: ["bookmark", "favorite", "library", "toolbar"],
  },
  {
    key: "Browser:SearchBookmarks",
    label: "Search Bookmarks",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "bookmarks", "find", "filter"],
    openUrl: true,
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "history", "find", "browse"],
    openUrl: true,
  },
  {
    key: "Browser:ShowAllBookmarks",
    label: "Show All Bookmarks (Library)",
    icon: "chrome://browser/skin/zen-icons/library.svg",
    tags: ["bookmarks", "show", "all", "library", "folders"],
  },
  {
    key: "Browser:ShowAllHistory",
    label: "Show All History (Library)",
    icon: "chrome://browser/skin/history.svg",
    tags: ["history", "show", "all", "library", "folders"],
  },

  // ----------- Find & Search -----------
  {
    key: "cmd_findAgain",
    label: "Find Next",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "next", "search", "continue"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_findPrevious",
    label: "Find Previous",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "previous", "search", "back"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_translate",
    label: "Translate Page",
    icon: "chrome://browser/skin/zen-icons/translations.svg",
    tags: ["translate", "language", "page"],
    condition: isNotEmptyTab,
  },

  // ----------- View & Display -----------
  {
    key: "View:FullScreen",
    label: "Toggle Fullscreen",
    icon: "chrome://browser/skin/fullscreen.svg",
    tags: ["fullscreen", "full", "screen", "toggle"],
  },
  {
    key: "View:ReaderView",
    label: "Toggle Reader Mode",
    icon: svgToUrl(icons["glass"]),
    tags: ["Read", "Glass", "Mode", "Focus"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomEnlarge",
    label: "Zoom In",
    icon: svgToUrl(icons["zoomIn"]),
    tags: ["zoom", "in", "enlarge", "bigger"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomReduce",
    label: "Zoom Out",
    icon: svgToUrl(icons["zoomOut"]),
    tags: ["zoom", "out", "reduce", "smaller"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomReset",
    label: "Reset Zoom",
    icon: svgToUrl(icons["zoomReset"]),
    tags: ["zoom", "reset", "normal", "100%"],
    condition: isNotEmptyTab,
  },

  // ----------- Developer Tools -----------
  {
    key: "View:PageSource",
    label: "View Page Source",
    icon: svgToUrl(icons["code"]),
    tags: ["source", "code", "html", "view"],
    condition: isNotEmptyTab,
  },
  {
    key: "View:PageInfo",
    label: "View Page Info",
    icon: "chrome://browser/skin/zen-icons/info.svg",
    tags: ["info", "page", "details", "properties"],
    condition: isNotEmptyTab,
  },

  {
    key: "key_toggleToolboxF12",
    label: "Toggle web toolbox",
    tags: ["devtools", "toolbox"],
    icon: "chrome://devtools/skin/images/tool-webconsole.svg",
  },
  {
    key: "key_browserToolbox",
    label: "Open Browser Toolbox",
    tags: ["devtools", "toolbox"],
    icon: "chrome://devtools/skin/images/tool-webconsole.svg",
  },
  {
    key: "key_browserConsole",
    label: "Open Browser Console",
    tags: ["devtools", "console"],
    icon: "chrome://devtools/skin/images/tool-webconsole.svg",
  },
  {
    key: "key_responsiveDesignMode",
    label: "Toggle Responsive Design Mode",
    tags: ["devtools", "responsive", "design", "mobile"],
    icon: "chrome://devtools/skin/images/command-responsivemode.svg",
  },
  {
    key: "key_inspector",
    label: "Open web inspector",
    tags: ["devtools", "inspector", "elements", "html"],
    icon: "chrome://devtools/skin/images/tool-inspector.svg",
    condition: isNotEmptyTab,
  },
  {
    key: "key_webconsole",
    label: "Open web console",
    tags: ["devtools", "console", "web", "logs"],
    condition: isNotEmptyTab,
    icon: "chrome://devtools/skin/images/tool-webconsole.svg",
  },

  // ----------- Media & Screenshots -----------
  {
    key: "View:PictureInPicture",
    label: "Toggle Picture-in-Picture",
    icon: "chrome://global/skin/media/picture-in-picture-open.svg",
    tags: ["picture", "pip", "video", "floating"],
  },

  // ----------- Files & Downloads -----------
  {
    key: "Tools:Downloads",
    label: "View Downloads",
    icon: "chrome://browser/skin/downloads/downloads.svg",
    tags: ["downloads", "files", "download", "library"],
  },
  {
    key: "Browser:SavePage",
    label: "Save Page As...",
    icon: "chrome://browser/skin/save.svg",
    tags: ["save", "page", "download", "file"],
    condition: isNotEmptyTab,
  },
  {
    key: "cmd_print",
    label: "Print Page",
    icon: "chrome://browser/skin/zen-icons/print.svg",
    tags: ["print", "page", "printer", "document"],
    condition: isNotEmptyTab,
  },
  {
    key: "Browser:OpenFile",
    label: "Open File",
    icon: "chrome://browser/skin/open.svg",
    tags: ["open", "file", "local", "browse"],
  },

  // ----------- Extensions & Customization -----------
  {
    key: "cmd_CustomizeToolbars",
    label: "Customize Toolbar...",
    icon: "chrome://browser/skin/zen-icons/edit-theme.svg",
    tags: ["customize", "toolbar", "ui", "layout", "icon", "configure"],
  },

  // ----------- Privacy & Security -----------
  {
    key: "Tools:Sanitize",
    label: "Clear Recent History...",
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["clear", "history", "sanitize", "clean", "privacy", "delete", "browsing", "data"],
  },

  // ----------- System & Application -----------
  {
    key: "cmd_quitApplication",
    label: "Quit Browser",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["quit", "exit", "close", "application"],
  },
  {
    key: "app:restart",
    label: "Restart Browser",
    command: () => restartApplication(),
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["restart", "reopen", "close"],
  },
  {
    key: "app:clear-startupCache",
    label: "Clear Startup Cache",
    command: () => restartApplication(true),
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["restart", "reopen", "close", "clear", "cache"],
  },
  {
    key: "app:minimize-memory",
    label: "Minimize Memory Usage",
    command: () => {
      const observerService = Cc["@mozilla.org/observer-service;1"].getService(
        Ci.nsIObserverService
      );
      for (let i = 0; i < 3; i++) {
        observerService.notifyObservers(null, "memory-pressure", "heap-minimize");
      }
    },
    tags: ["memory", "free", "ram", "minimize", "space", "fast", "slow"],
  },

  // ----------- Profiles -----------
  {
    key: "Profiles:CreateProfile",
    label: "Create New Profile",
    icon: "chrome://browser/skin/zen-icons/container-tab.svg",
    tags: ["profile", "new", "create"],
  },

  // ----------- Command Palette Settings -----------
  {
    key: "command-palette:settings-commands",
    label: "Command Palette: Configure Commands",
    command: () => ZenCommandPalette.Settings.show("commands"),
    icon: "chrome://browser/skin/zen-icons/settings.svg",
    tags: ["command", "palette", "settings", "configure", "customize"],
  },
  {
    key: "command-palette:settings-preferences",
    label: "Command Palette: Preferences",
    command: () => ZenCommandPalette.Settings.show("settings"),
    icon: "chrome://browser/skin/zen-icons/settings.svg",
    tags: ["command", "palette", "settings", "preferences", "options"],
  },
  {
    key: "command-palette:settings-help",
    label: "Command Palette: Help",
    command: () => ZenCommandPalette.Settings.show("help"),
    icon: "chrome://browser/skin/zen-icons/info.svg",
    tags: ["command", "palette", "help", "documentation", "support"],
  },
  {
    key: "command-palette:custom-command",
    label: "Command Palette: Custom Commands",
    command: () => ZenCommandPalette.Settings.show("custom-commands"),
    tags: ["command", "palette", "custom", "more"],
  },
  {
    key: "command-palette:show",
    label: "Search Commands",
    command: () => {
      gURLBar.value = PREFS.prefix;
      gURLBar.focus();
      gZenUIManager.onUrlbarOpen();
      gZenUIManager.onFloatingURLBarOpen();
    },
    tags: ["commands", "palette", "all", "shortcuts"],
    openUrl: true,
  },

  // ----------- Tidy Tabs --------
  {
    key: "cmd_zenSortTabs",
    label: "Sort Tabs",
    icon: "chrome://global/skin/icons/highlights.svg",
    tags: ["sort", "manage", "group", "folder", "AI", "auto"],
  },

  // ----------- Advanced tab Group management ------------
  {
    key: "cmd_zenCollapseGroups",
    label: "Collapse All Groups",
    command: () => {
      const labels = gBrowser.tabContainer.querySelectorAll(".tab-group-label");
      labels.forEach((label) => {
        const expanded = label.getAttribute("aria-expanded");
        const ariaLabel = label.getAttribute("aria-label");
        if (expanded === "true" && ariaLabel !== "Unnamed Group") {
          label.focus();
          label.click();
        }
      });
    },
    icon: "chrome://browser/skin/zen-icons/folder.svg",
    tags: ["folder", "collapse", "group", "tabs", "all"],
  },
  {
    key: "cmd_zenExpandGroups",
    label: "Expand All Groups",
    command: () => {
      const labels = gBrowser.tabContainer.querySelectorAll(".tab-group-label");
      labels.forEach((label) => {
        const expanded = label.getAttribute("aria-expanded");
        const ariaLabel = label.getAttribute("aria-label");
        if (expanded === "false" && ariaLabel !== "Unnamed Group") {
          label.focus();
          label.click();
        }
      });
    },
    icon: "chrome://browser/skin/zen-icons/folder.svg",
    tags: ["folder", "expand", "group", "tabs", "all"],
  },
];
