// This file is adapted from the command list in ZBar-Zen by Darsh-Aide
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js
import { svgToUrl, icons } from "./utils/icon.js";

const isCompactMode = () => gZenCompactModeManager?.preference;
const ucAvailable = () => typeof UC_API !== "undefined";
const togglePref = (prefName) => {
  const pref = UC_API.Prefs.get(prefName);
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

    gBrowser.removeTabs(tabsToClose, {
      animate: true,
      skipSessionStore: false,
    });
  } catch (error) {
    console.error("zen-command-palette: Error clearing tabs:", error);
  }
};

export const commands = [
  // ----------- Zen Compact Mode -----------
  {
    key: "cmd_zenCompactModeToggle",
    label: "Toggle Compact Mode",
    icon: "chrome://browser/skin/zen-icons/fullscreen.svg",
    tags: ["compact", "mode", "toggle", "ui", "layout"],
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
    tags: ["workspace", "delete", "remove", "management"],
  },
  // {
  //   key: "cmd_zenChangeWorkspaceName",
  //   label: "Change Workspace Name",
  //   icon: "chrome://browser/skin/zen-icons/edit.svg",
  //   tags: ["workspace", "name", "rename", "edit", "management"]
  // },
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
    label: "Split View: Grid",
    icon: svgToUrl(icons["splitGrid"]),
    tags: ["split", "view", "grid", "layout", "multitask"],
  },
  {
    key: "cmd_zenSplitViewVertical",
    label: "Split Vertical",
    icon: svgToUrl(icons["splitVz"]),
    tags: ["split", "view", "vertical", "layout", "multitask"],
  },
  {
    key: "cmd_zenSplitViewHorizontal",
    label: "Split Horizontal",
    icon: svgToUrl(icons["splitHz"]),
    tags: ["split", "view", "horizontal", "layout", "multitask"],
  },
  {
    key: "cmd_zenSplitViewUnsplit",
    label: "Unsplit View",
    tags: ["split", "view", "unsplit", "single", "restore"],
  },

  // ----------- Additional Zen Commands -----------
  {
    key: "cmd_zenOpenZenThemePicker",
    label: "Open Theme Picker",
    icon: "chrome://browser/skin/zen-icons/palette.svg",
    tags: ["theme", "picker", "customize", "appearance"],
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
    tags: ["copy", "url", "markdown", "format"],
  },

  // ----------- Folder Management -----------
  {
    key: "folder-create",
    label: "Create New Folder",
    command: () => gZenFolders.createFolder([], { renameFolder: true }),
    condition: () => !!window.gZenFolders,
    icon: "chrome://browser/skin/zen-icons/folder.svg",
    tags: ["folder", "create", "new"],
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
    icon: svgToUrl(icons["unpin"]),
    tags: ["folder", "remove", "unparent", "tab"],
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
    condition: !!window.gBrowser?.duplicateTab,
    icon: "chrome://browser/skin/zen-icons/duplicate-tab.svg",
    tags: ["duplicate", "tab", "copy", "clone"],
  },
  {
    key: "clear-tabs",
    label: "Clear Other Tabs",
    command: clearTabs,
    condition: () => !!window.gBrowser && !!window.gZenWorkspaces,
    icon: svgToUrl(icons["broom"]),
    tags: ["clear", "tabs", "close", "other", "workspace"],
  },
  {
    key: "move-tab-up",
    label: "Move Tab Up",
    command: () => window.gBrowser.moveTabBackward(),
    condition: !!window.gBrowser?.moveTabBackward,
    icon: "chrome://browser/skin/zen-icons/arrow-up.svg",
    tags: ["move", "tab", "up", "backward", "reorder"],
  },
  {
    key: "move-tab-down",
    label: "Move Tab Down",
    command: () => window.gBrowser.moveTabForward(),
    condition: !!window.gBrowser?.moveTabForward,
    icon: "chrome://browser/skin/zen-icons/arrow-down.svg",
    tags: ["move", "tab", "down", "forward", "reorder"],
  },
  {
    key: "cmd_close",
    label: "Close Tab",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["tab", "close", "remove"],
  },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/zen-icons/media-mute.svg",
    tags: ["tab", "mute", "audio", "sound", "toggle"],
  },
  {
    key: "Browser:PinTab",
    label: "Pin Tab",
    command: () => gBrowser.pinTab(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab && !gBrowser.selectedTab.pinned,
    icon: svgToUrl(icons["pin"]), // using lucde icon for pin this looks better than browser's pin icon
    tags: ["pin", "tab", "stick", "affix"],
  },
  {
    key: "Browser:UnpinTab",
    label: "Unpin Tab",
    command: () => gBrowser.unpinTab(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab?.pinned,
    icon: svgToUrl(icons["unpin"]),
    tags: ["unpin", "tab", "release", "detach"],
  },
  {
    key: "Browser:NextTab",
    label: "Next Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    tags: ["next", "tab", "switch", "navigate"],
  },
  {
    key: "Browser:PrevTab",
    label: "Previous Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(-1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
    tags: ["previous", "tab", "switch", "navigate"],
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    command: () => gTabsPanel.showAllTabsPanel(),
    condition: !!window.gTabsPanel,
    tags: ["show", "all", "tabs", "panel", "overview"],
  },
  // {
  //   key: "Browser:NewUserContextTab",
  //   label: "New Container Tab",
  //   command: () => openNewUserContextTab(),
  //   condition: !!window.openNewUserContextTab,
  //   tags: ["container", "tab", "new", "context"]
  // },
  {
    key: "add-to-essentials",
    label: "Add to Essentials",
    command: () => gZenPinnedTabManager.addToEssentials(gBrowser.selectedTab),
    condition: () =>
      !!window.gZenPinnedTabManager &&
      gZenPinnedTabManager.canEssentialBeAdded(gBrowser.selectedTab),
    icon: "chrome://browser/skin/zen-icons/essential-add.svg",
    tags: ["essentials", "add", "bookmark", "save"],
  },
  {
    key: "replace-pinned-url",
    label: "Replace Pinned Tab URL with Current",
    command: () => gZenPinnedTabManager.replacePinnedUrlWithCurrent(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab?.pinned && !!window.gZenPinnedTabManager,
    tags: ["pinned", "tab", "url", "replace", "current"],
  },
  {
    key: "reset-pinned-tab",
    label: "Reset Pinned Tab",
    command: () => gZenPinnedTabManager.resetPinnedTab(gBrowser.selectedTab),
    condition: () => gBrowser?.selectedTab?.pinned && !!window.gZenPinnedTabManager,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["pinned", "tab", "reset", "restore"],
  },
  {
    key: "History:UndoCloseTab",
    label: "Reopen Closed Tab",
    command: () => SessionStore.undoCloseTab(window, 0),
    condition: !!SessionStore?.undoCloseTab,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
    tags: ["undo", "close", "tab", "reopen", "restore"],
  },
  {
    key: "unload-tab",
    label: "Unload Tab",
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
    tags: ["unload", "sleep"],
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
    tags: ["window", "close", "remove"],
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
    command: () => OpenBrowserWindow({ private: true }),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/zen-icons/private-window.svg",
    tags: ["private", "browsing", "incognito", "window"],
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    command: () => SessionWindowUI.undoCloseWindow(),
    condition: !!window.SessionWindowUI,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
    tags: ["undo", "close", "window", "reopen", "restore"],
  },

  // ----------- Navigation -----------
  {
    key: "Browser:Back",
    label: "Go Back",
    command: () => gBrowser.goBack(),
    condition: !!gBrowser?.goBack,
    icon: "chrome://browser/skin/back.svg",
    tags: ["back", "navigate", "history", "previous"],
  },
  {
    key: "Browser:Forward",
    label: "Go Forward",
    command: () => gBrowser.goForward(),
    condition: !!gBrowser?.goForward,
    icon: "chrome://browser/skin/forward.svg",
    tags: ["forward", "navigate", "history", "next"],
  },
  {
    key: "Browser:Stop",
    label: "Stop Loading",
    command: () => gBrowser.stop(),
    condition: !!gBrowser?.stop,
    tags: ["stop", "loading", "cancel", "halt"],
  },
  {
    key: "Browser:Reload",
    label: "Reload Page",
    command: () => gBrowser.reload(),
    condition: !!gBrowser?.reload,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["reload", "refresh", "page", "update"],
  },
  {
    key: "Browser:ReloadSkipCache",
    label: "Hard Reload (Skip Cache)",
    command: () => BrowserCommands.reloadSkipCache(),
    condition: !!window.BrowserCommands,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["reload", "hard", "cache", "refresh"],
  },

  // ----------- Bookmarks & History -----------
  {
    key: "Browser:AddBookmarkAs",
    label: "Bookmark This Page",
    command: () => PlacesCommandHook.bookmarkPage(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmark.svg",
    tags: ["bookmark", "save", "favorite", "add"],
  },
  {
    key: "Browser:BookmarkAllTabs",
    label: "Bookmark All Tabs",
    command: () => PlacesCommandHook.bookmarkTabs(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
    tags: ["bookmark", "all", "tabs", "save"],
  },
  {
    key: "Browser:SearchBookmarks",
    label: "Search Bookmarks",
    command: () => PlacesCommandHook.searchBookmarks(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "bookmarks", "find", "filter"],
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    command: () => PlacesCommandHook.searchHistory(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "history", "find", "browse"],
  },
  {
    key: "Browser:ShowAllBookmarks",
    label: "Show All Bookmarks (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("AllBookmarks"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/library.svg",
    tags: ["bookmarks", "show", "all", "library"],
  },
  {
    key: "Browser:ShowAllHistory",
    label: "Show All History (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("History"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/history.svg",
    tags: ["history", "show", "all", "library"],
  },

  // ----------- Find & Search -----------
  {
    key: "cmd_find",
    label: "Find in Page",
    icon: "chrome://browser/skin/zen-icons/search-page.svg",
    tags: ["find", "search", "page", "text"],
  },
  {
    key: "cmd_findAgain",
    label: "Find Next",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "next", "search", "continue"],
  },
  {
    key: "cmd_findPrevious",
    label: "Find Previous",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "previous", "search", "back"],
  },
  {
    key: "cmd_translate",
    label: "Translate Page",
    icon: "chrome://browser/skin/zen-icons/translations.svg",
    tags: ["translate", "language", "page"],
  },

  // ----------- View & Display -----------
  {
    key: "View:FullScreen",
    label: "Toggle Fullscreen",
    command: () => BrowserCommands.fullScreen(),
    condition: !!window?.BrowserCommands?.fullScreen,
    icon: "chrome://browser/skin/fullscreen.svg",
    tags: ["fullscreen", "full", "screen", "toggle"],
  },
  {
    key: "cmd_fullZoomEnlarge",
    label: "Zoom In",
    icon: svgToUrl(icons["zoomIn"]),
    tags: ["zoom", "in", "enlarge", "bigger"],
  },
  {
    key: "cmd_fullZoomReduce",
    label: "Zoom Out",
    icon: svgToUrl(icons["zoomOut"]),
    tags: ["zoom", "out", "reduce", "smaller"],
  },
  {
    key: "cmd_fullZoomReset",
    label: "Reset Zoom",
    icon: svgToUrl(icons["zoomReset"]),
    tags: ["zoom", "reset", "normal", "100%"],
  },

  // ----------- Developer Tools -----------
  // {
  //   key: "View:PageSource",
  //   label: "View Page Source",
  //   command: () => BrowserViewSourceOfDocument(gBrowser.selectedBrowser.document),
  //   condition: !!window.BrowserViewSourceOfDocument,
  //   icon: "chrome://devtools/skin/images/command-viewsource.svg",
  //   tags: ["source", "code", "html", "view"]
  // },
  // {
  //   key: "View:PageInfo",
  //   label: "View Page Info",
  //   command: () => BrowserPageInfo(),
  //   condition: !!window.BrowserPageInfo,
  //   icon: "chrome://browser/skin/information.svg",
  //   tags: ["info", "page", "details", "properties"]
  // },

  // ----------- Media & Screenshots -----------
  {
    key: "View:PictureInPicture",
    label: "Toggle Picture-in-Picture",
    command: () => PictureInPicture.onCommand(),
    condition: () => typeof PictureInPicture?.onCommand === "function",
    icon: "chrome://browser/skin/zen-icons/media-pip.svg",
    tags: ["picture", "pip", "video", "floating"],
  },
  {
    key: "Browser:Screenshot",
    label: "Take Screenshot",
    command: () => ScreenshotsUtils.notify(window, "Shortcut"),
    condition: !!window.ScreenshotsUtils,
    icon: "chrome://browser/skin/screenshot.svg",
    tags: ["screenshot", "capture", "image", "snap"],
  },

  // ----------- Files & Downloads -----------
  {
    key: "Tools:Downloads",
    label: "View Downloads",
    command: () => BrowserCommands.downloadsUI(),
    condition: !!window.BrowserCommands,
    icon: "chrome://browser/skin/downloads/downloads.svg",
    tags: ["downloads", "files", "download", "library"],
  },
  {
    key: "Browser:SavePage",
    label: "Save Page As...",
    command: () => saveBrowser(gBrowser.selectedBrowser),
    condition: !!window.saveBrowser,
    icon: "chrome://browser/skin/save.svg",
    tags: ["save", "page", "download", "file"],
  },
  {
    key: "cmd_print",
    label: "Print Page",
    icon: "chrome://browser/skin/zen-icons/print.svg",
    tags: ["print", "page", "printer", "document"],
  },
  {
    key: "Browser:OpenFile",
    label: "Open File",
    command: () => BrowserCommands.openFileWindow(),
    condition: !!window.BrowserCommands,
    icon: "chrome://browser/skin/open.svg",
    tags: ["open", "file", "local", "browse"],
  },

  // ----------- Extensions & Customization -----------
  {
    key: "Tools:Addons",
    label: "Manage Extensions",
    command: () => BrowserAddonUI.openAddonsMgr(),
    condition: !!window.BrowserAddonUI,
    icon: "chrome://mozapps/skin/extensions/extension.svg",
    tags: ["addons", "extensions", "themes", "manage"],
  },
  {
    key: "cmd_CustomizeToolbars",
    label: "Customize Toolbar...",
    icon: "chrome://browser/skin/zen-icons/edit-theme.svg",
    tags: ["customize", "toolbar", "ui", "layout"],
  },

  // ----------- Privacy & Security -----------
  {
    key: "Tools:Sanitize",
    label: "Clear Recent History...",
    command: () => Sanitizer.showUI(window),
    condition: !!window.Sanitizer,
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["clear", "history", "sanitize", "clean", "privacy"],
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
];
