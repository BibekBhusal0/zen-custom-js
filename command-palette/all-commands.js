// This file is adapted from the command list in ZBar-Zen by Darsh-A
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js
import { svgToUrl, icons } from "./utils/icon.js";

const isCompactMode = () => gZenCompactModeManager?.preference;
const ucAvailable = () => typeof UC_API !== "undefined";
const togglePref = (prefName) => {
  const pref = UC_API.Prefs.get(prefName);
  if (!pref || pref.type !== "boolean") return;
  pref.setTo(!pref.value);
};

function isNotEmptyTab() {
  return !window.gBrowser.selectedTab.hasAttribute('zen-empty-tab');
}

function isPinnedTabDifferent () {
  if ( !window.gZenPinnedTabManager ) return false
  const currentTab = gBrowser.selectedTab
  if ( !currentTab ) return false
  if ( !currentTab.pinned ) return false
  const pin = gZenPinnedTabManager._pinsCache.find(pin=> pin.uuid === currentTab.getAttribute('zen-pin-id') )
  if (!pin) return false 
  return pin.url == currentTab.linkedBrowser.currentURI.spec
}


export const commands = [
  // ----------- Zen Compact Mode -----------
  {
    key: "cmd_zenCompactModeToggle",
    label: "Toggle Compact Mode",
    icon: "chrome://browser/skin/zen-icons/fullscreen.svg",
    tags: ["compact", "mode", "toggle", "ui", "layout", "hide", "sidebar"],
  },
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
    condition: () => isCompactMode() && ucAvailable(),
    icon: "chrome://browser/skin/zen-icons/expand-sidebar.svg",
    tags: ["compact", "sidebar", "hide", "ui"],
  },
  {
    key: "toggle-toolbar",
    label: "Toggle Toolbar",
    command: () => togglePref("zen.view.compact.hide-toolbar"),
    condition: () => isCompactMode() && ucAvailable(),
    tags: ["compact", "toolbar", "hide", "ui"],
  },

  // ----------- Zen Workspace Management -----------
  {
    key: "cmd_zenWorkspaceForward",
    label: "Next Workspace",
    icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    tags: ["workspace", "next", "forward", "navigate"],
  },
  {
    key: "cmd_zenWorkspaceBackward",
    label: "Previous Workspace",
    icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
    tags: ["workspace", "previous", "backward", "navigate"],
  },
  {
    key: "cmd_zenCtxDeleteWorkspace",
    label: "Delete Workspace",
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["workspace", "delete", "remove", "management", "trash"],
  },
  {
    key: "cmd_zenChangeWorkspaceName",
    label: "Change Workspace Name",
    icon: "chrome://browser/skin/zen-icons/edit.svg",
    tags: ["workspace", "name", "rename", "edit", "management"],
  },
  {
    key: "cmd_zenChangeWorkspaceIcon",
    label: "Change Workspace Icon",
    tags: ["workspace", "icon", "change", "customize", "management"],
  },
  {
    key: "cmd_zenOpenWorkspaceCreation",
    label: "Create New Workspace",
    icon: "chrome://browser/skin/zen-icons/plus.svg",
    tags: ["workspace", "create", "new", "add", "management"],
  },

  // ----------- Zen Split View -----------
  {
    key: "cmd_zenSplitViewGrid",
    label: "Split Grid",
    icon: svgToUrl(icons["splitGrid"]),
    condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
    tags: ["split", "view", "grid", "layout", "multitask"],
  },
  {
    key: "cmd_zenSplitViewVertical",
    label: "Split Vertical",
    icon: svgToUrl(icons["splitVz"]),
    condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
    tags: ["split", "view", "vertical", "layout", "multitask"],
  },
  {
    key: "cmd_zenSplitViewHorizontal",
    label: "Split Horizontal",
    icon: svgToUrl(icons["splitHz"]),
    condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
    tags: ["split", "view", "horizontal", "layout", "multitask"],
  },
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
    condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
  },
  {
    key: "cmd_zenGlanceExpand",
    label: "Expand Glance",
    tags: ["glance", "expand", "peak", "full"],
    icon: "chrome://browser/skin/fullscreen.svg",
    condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
  },
  {
    key: "cmd_zenGlanceSplit",
    label: "Split Glance",
    tags: ["glance", "split", "multitask", "peak", "horizontal", "vertical"],
    icon: svgToUrl(icons["splitVz"]),
    condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
  },

  // ----------- Additional Zen Commands -----------
  {
    key: "cmd_zenOpenZenThemePicker",
    label: "Open Theme Picker",
    icon: "chrome://browser/skin/zen-icons/palette.svg",
    tags: ["theme", "picker", "customize", "appearance", "color"],
  },
  {
    key: "cmd_zenToggleTabsOnRight",
    label: "Toggle Tabs on Right",
    icon: "chrome://browser/skin/zen-icons/sidebars-right.svg",
    tags: ["tabs", "right", "position", "layout"],
  },
  {
    key: "remove-from-essentials",
    label: "Remove from Essentials",
    command: () => gZenPinnedTabManager.removeEssentials(gBrowser.selectedTab),
    condition: () =>
      gBrowser?.selectedTab?.hasAttribute("zen-essential") && !!window.gZenPinnedTabManager,
    icon: "chrome://browser/skin/zen-icons/essential-remove.svg",
    tags: ["essentials", "remove", "unpin"],
  },
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
    key: "cmd_zenCopyCurrentURL",
    label: "Copy Current URL",
    icon: "chrome://browser/skin/zen-icons/link.svg",
    tags: ["copy", "url", "current", "clipboard"],
  },
  {
    key: "cmd_zenCopyCurrentURLMarkdown",
    label: "Copy Current URL as Markdown",
    icon: "chrome://browser/skin/zen-icons/link.svg",
    tags: ["copy", "url", "markdown", "format", "clipboard"],
  },

  // ----------- Folder Management -----------
  {
    key: "cmd_zenOpenFolderCreation",
    label: "Create New Folder",
    command: () => gZenFolders.createFolder([], { renameFolder: true }),
    condition: () => !!window.gZenFolders,
    icon: "chrome://browser/skin/zen-icons/folder.svg",
    tags: ["folder", "create", "new", "group", "tabs"],
  },
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

  // ----------- Tab Management -----------
  {
    key: "rename-tab",
    label: "Rename Tab",
    command: () => {
      const tab = gBrowser.selectedTab;
      const dblClickEvent = new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
      });
      tab.dispatchEvent(dblClickEvent);
    },
    condition: () => gBrowser?.selectedTab?.pinned,
    icon: "chrome://browser/skin/zen-icons/edit.svg",
    tags: ["rename", "tab", "title", "edit", "pinned"],
  },
  {
    key: "duplicate-tab",
    label: "Duplicate Tab",
    command: () => {
      const newTab = window.gBrowser.duplicateTab(window.gBrowser.selectedTab);
      window.gBrowser.selectedTab = newTab;
    },
    condition:() =>!!window.gBrowser?.duplicateTab && isNotEmptyTab() ,
    icon: "chrome://browser/skin/zen-icons/duplicate-tab.svg",
    tags: ["duplicate", "tab", "copy", "clone"],
  },
  {
    key: "new-tab",
    label: "New Tab",
    command: () => BrowserCommands.openTab(),
    condition: !!window.BrowserCommands,
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
    key: "cmd_close",
    label: "Close Tab",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    condition:isNotEmptyTab,
    tags: ["tab", "close", "remove"],
  },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/zen-icons/media-mute.svg",
    tags: ["tab", "mute", "audio", "sound", "toggle"],
    condition:isNotEmptyTab,
  },
  {
    key: "Browser:PinTab",
    label: "Pin Tab",
    command: () => gBrowser.pinTab(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab && !gBrowser.selectedTab.pinned  && isNotEmptyTab,
    icon: svgToUrl(icons["pin"]), // using lucde icon for pin this looks better than browser's pin icon
    tags: ["pin", "tab", "stick", "affix"],
  },
  {
    key: "Browser:UnpinTab",
    label: "Unpin Tab",
    command: () => gBrowser.unpinTab(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab?.pinned&& isNotEmptyTab,
    icon: svgToUrl(icons["unpin"]),
    tags: ["unpin", "tab", "release", "detach"],
  },
  {
    key: "Browser:NextTab",
    label: "Next Tab",
    icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    tags: ["next", "tab", "switch", "navigate"],
  },
  {
    key: "Browser:PrevTab",
    label: "Previous Tab",
    icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
    tags: ["previous", "tab", "switch", "navigate"],
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    tags: ["show", "all", "tabs", "panel", "overview"],
  },
  {
    key: "add-to-essentials",
    label: "Add to Essentials",
    command: () => gZenPinnedTabManager.addToEssentials(gBrowser.selectedTab),
    condition: () =>
      !!window.gZenPinnedTabManager &&
      gZenPinnedTabManager.canEssentialBeAdded(gBrowser.selectedTab) && 
      !window.gBrowser.selectedTab.hasAttribute('zen-essential'),
    icon: "chrome://browser/skin/zen-icons/essential-add.svg",
    tags: ["essentials", "add", "bookmark", "save"],
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
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
    tags: ["undo", "close", "tab", "reopen", "restore"],
  },
  {
    key: "unload-tab",
    label: "Unload Tab",
    condition:isNotEmptyTab,
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
    icon: "chrome://browser/skin/zen-icons/close-all.svg",
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
    icon: "chrome://browser/skin/zen-icons/close-all.svg",
    tags: ["unload", "sleep"],
  },

  // ----------- Window Management -----------
  {
    key: "cmd_newNavigator",
    label: "New Window",
    icon: "chrome://browser/skin/zen-icons/window.svg",
    tags: ["window", "new", "create", "open"],
  },
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
    key: "Tools:PrivateBrowsing",
    label: "Open Private Window",
    icon: svgToUrl(icons["incognito"]),
    tags: ["private", "browsing", "incognito", "window"],
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
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
  {
    key: "Browser:Reload",
    label: "Reload Page",
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    condition:isNotEmptyTab,
    tags: ["reload", "refresh", "page", "update"],
  },
  {
    key: "Browser:ReloadSkipCache",
    label: "Hard Reload (Skip Cache)",
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["reload", "hard", "cache", "refresh"],
    condition:isNotEmptyTab,
  },

  // ----------- Bookmarks & History -----------
  {
    key: "Browser:AddBookmarkAs",
    label: "Bookmark This Page",
    icon: "chrome://browser/skin/bookmark.svg",
    tags: ["bookmark", "save", "favorite", "add", "library"],
    condition:isNotEmptyTab,
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
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "history", "find", "browse"],
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
    key: "cmd_find",
    label: "Find in Page",
    icon: "chrome://browser/skin/zen-icons/search-page.svg",
    tags: ["find", "search", "page", "text"],
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_findAgain",
    label: "Find Next",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "next", "search", "continue"],
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_findPrevious",
    label: "Find Previous",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "previous", "search", "back"],
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_translate",
    label: "Translate Page",
    icon: "chrome://browser/skin/zen-icons/translations.svg",
    tags: ["translate", "language", "page"],
    condition:isNotEmptyTab,
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
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomEnlarge",
    label: "Zoom In",
    icon: svgToUrl(icons["zoomIn"]),
    tags: ["zoom", "in", "enlarge", "bigger"],
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomReduce",
    label: "Zoom Out",
    icon: svgToUrl(icons["zoomOut"]),
    tags: ["zoom", "out", "reduce", "smaller"],
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_fullZoomReset",
    label: "Reset Zoom",
    icon: svgToUrl(icons["zoomReset"]),
    tags: ["zoom", "reset", "normal", "100%"],
    condition:isNotEmptyTab,
  },

  // ----------- Developer Tools -----------
  {
    key: "View:PageSource",
    label: "View Page Source",
    icon: "chrome://browser/skin/zen-icons/source-code.svg",
    tags: ["source", "code", "html", "view"],
    condition:isNotEmptyTab,
  },
  {
    key: "View:PageInfo",
    label: "View Page Info",
    icon: "chrome://browser/skin/zen-icons/info.svg",
    tags: ["info", "page", "details", "properties"],
    condition:isNotEmptyTab,
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
    condition:isNotEmptyTab,
  },
  {
    key: "key_webconsole",
    label: "Open web console",
    tags: ["devtools", "console", "web", "logs"],
    condition:isNotEmptyTab,
    icon: "chrome://devtools/skin/images/tool-webconsole.svg",
  },
  {
    key: "key_jsdebugger",
    label: "Open js debugger",
    condition:isNotEmptyTab,
    tags: ["devtools", "debugger", "js", "javascript"],
    icon: "chrome://devtools/skin/images/tool-debugger.svg",
  },
  {
    key: "key_netmonitor",
    label: "Open network monitor",
    condition:isNotEmptyTab,
    tags: ["devtools", "network", "monitor"],
    icon: "chrome://devtools/skin/images/tool-network.svg",
  },
  {
    key: "key_styleeditor",
    label: "Open style editor",
    condition:isNotEmptyTab,
    tags: ["devtools", "style", "editor", "css"],
    icon: "chrome://devtools/skin/images/tool-styleeditor.svg",
  },
  {
    key: "key_performance",
    label: "Open performance panel",
    condition:isNotEmptyTab,
    tags: ["devtools", "performance", "panel"],
    icon: "chrome://devtools/skin/images/tool-profiler.svg",
  },
  {
    key: "key_storage",
    label: "Open storage panel",
    condition:isNotEmptyTab,
    tags: ["devtools", "storage", "panel"],
    icon: "chrome://devtools/skin/images/tool-storage.svg",
  },

  // ----------- Media & Screenshots -----------
  {
    key: "View:PictureInPicture",
    label: "Toggle Picture-in-Picture",
    icon: "chrome://browser/skin/zen-icons/media-pip.svg",
    tags: ["picture", "pip", "video", "floating"],
  },
  {
    key: "Browser:Screenshot",
    label: "Take Screenshot",
    icon: "chrome://browser/skin/screenshot.svg",
    tags: ["screenshot", "capture", "image", "snap"],
    condition:isNotEmptyTab,
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
    condition:isNotEmptyTab,
  },
  {
    key: "cmd_print",
    label: "Print Page",
    icon: "chrome://browser/skin/zen-icons/print.svg",
    tags: ["print", "page", "printer", "document"],
    condition:isNotEmptyTab,
  },
  {
    key: "Browser:OpenFile",
    label: "Open File",
    icon: "chrome://browser/skin/open.svg",
    tags: ["open", "file", "local", "browse"],
  },

  // ----------- Extensions & Customization -----------
  {
    key: "Tools:Addons",
    label: "Manage Extensions",
    icon: "chrome://mozapps/skin/extensions/extension.svg",
    tags: ["addons", "extensions", "themes", "manage"],
  },
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
    key: "cmd_toggleOfflineStatus",
    label: "Toggle Work Offline",
    tags: ["offline", "network", "disconnect"],
  },
  {
    key: "cmd_quitApplication",
    label: "Quit Browser",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["quit", "exit", "close", "application"],
  },
  {
    key: "app:restart",
    label: "Restart Browser",
    command: () => UC_API.Runtime.restart(),
    condition: ucAvailable,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["restart", "reopen", "close"],
  },
  {
    key: "app:clear-startupCache",
    label: "Clear Startup Cache",
    command: () => UC_API.Runtime.restart(true),
    condition: ucAvailable,
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
    condition: () => !!window.ZenCommandPalette,
    icon: "chrome://browser/skin/zen-icons/settings.svg",
    tags: ["command", "palette", "settings", "configure", "customize"],
  },
  {
    key: "command-palette:settings-preferences",
    label: "Command Palette: Preferences",
    command: () => ZenCommandPalette.Settings.show("settings"),
    condition: () => !!window.ZenCommandPalette,
    icon: "chrome://browser/skin/zen-icons/settings.svg",
    tags: ["command", "palette", "settings", "preferences", "options"],
  },
  {
    key: "command-palette:settings-help",
    label: "Command Palette: Help",
    command: () => ZenCommandPalette.Settings.show("help"),
    condition: () => !!window.ZenCommandPalette,
    icon: "chrome://browser/skin/zen-icons/info.svg",
    tags: ["command", "palette", "help", "documentation", "support"],
  },

  // ----------- Tidy Tabs --------
  {
    key: "cmd_zenClearTabs",
    label: "Clear Other Tabs",
    icon: svgToUrl(icons["broom"]),
    tags: ["clear", "tabs", "close", "other", "workspace", "clean"],
  },
  {
    key: "cmd_zenSortTabs",
    label: "Sort Tabs",
    icon: "chrome://global/skin/icons/highlights.svg",
    tags: ["sort", "manage", "group", "folder", "AI", "auto"],
  },
];
