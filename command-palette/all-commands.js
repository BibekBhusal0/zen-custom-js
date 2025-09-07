// This file is adapted from the command list in ZBar-Zen by Darsh-A:
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js

// A helper array of common "about:" pages to be programmatically added to the commands list.
const aboutPages = [
  "about",
  "addons",
  "buildconfig",
  "cache",
  "certificate",
  "compat",
  "config",
  "credits",
  "debugging",
  "downloads",
  "home",
  "license",
  "logins",
  "memory",
  "mozilla",
  "networking",
  "newtab",
  "policies",
  "preferences",
  "privatebrowsing",
  "processes",
  "profiles",
  "protections",
  "rights",
  "robots",
  "serviceworkers",
  "studies",
  "support",
  "sync-log",
  "telemetry",
  "url-classifier",
  "webrtc",
  "welcome",
];

const generatedAboutCommands = aboutPages.map((page) => ({
  key: `about:${page}`,
  label: `Go to about:${page}`,
  command: () => gBrowser.loadURI(`about:${page}`),
  condition: !!gBrowser,
  icon: "chrome://browser/skin/information.svg",
}));

export const commands = [
  // ----------- Tab Management -----------
  {
    key: "tab:new",
    label: "New Tab",
    command: () => BrowserOpenTab(),
    condition: !!window.BrowserOpenTab,
    icon: "chrome://browser/skin/tab-add.svg",
  },
  {
    key: "tab:close",
    label: "Close Tab",
    command: () => BrowserCloseTabOrWindow(),
    condition: !!window.BrowserCloseTabOrWindow,
    icon: "chrome://browser/skin/tab-close.svg",
  },
  {
    key: "tab:mute-toggle",
    label: "Toggle Mute Tab",
    command: () => gBrowser.selectedTab.toggleMuteAudio(),
    condition: !!gBrowser?.selectedTab?.toggleMuteAudio,
    icon: "chrome://browser/skin/sound-playing-shared.svg",
  },
  {
    key: "tab:next",
    label: "Next Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/arrow-right.svg",
  },
  {
    key: "tab:prev",
    label: "Previous Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(-1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/arrow-left.svg",
  },
  {
    key: "tab:show-all",
    label: "Show All Tabs Panel",
    command: () => gTabsPanel.showAllTabsPanel(),
    condition: !!window.gTabsPanel,
    icon: "chrome://browser/skin/tabs-arrow-down.svg",
  },
  {
    key: "tab:new-container",
    label: "New Container Tab",
    command: () => openNewUserContextTab(),
    condition: !!window.openNewUserContextTab,
    icon: "chrome://browser/skin/user-context-personal.svg",
  },
  {
    key: "tab:reopen-closed",
    label: "Reopen Closed Tab",
    command: () => undoCloseTab(),
    condition: !!window.undoCloseTab,
    icon: "chrome://browser/skin/history-undo.svg",
  },
  {
    key: "tab:rename",
    label: "Rename Tab",
    command: () => gBrowser.selectedTab.ownerGlobal.TabTitleEdit.init(gBrowser.selectedTab),
    condition: !!window.TabTitleEdit,
    icon: "chrome://browser/skin/edit.svg",
  },

  // ----------- Window Management -----------
  {
    key: "window:new",
    label: "New Window",
    command: () => OpenBrowserWindow(),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/window.svg",
  },
  {
    key: "window:close",
    label: "Close Window",
    command: () => window.close(),
    condition: true,
    icon: "chrome://browser/skin/window-close.svg",
  },
  {
    key: "window:minimize",
    label: "Minimize Window",
    command: () => window.minimize(),
    condition: true,
    icon: "chrome://browser/skin/window-minimize.svg",
  },
  {
    key: "window:private",
    label: "New Private Window",
    command: () => OpenBrowserWindow({ private: true }),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/private-browsing.svg",
  },
  {
    key: "window:reopen-closed",
    label: "Reopen Closed Window",
    command: () => SessionWindowUI.undoCloseWindow(),
    condition: !!window.SessionWindowUI,
    icon: "chrome://browser/skin/history-undo-window.svg",
  },

  // ----------- Navigation -----------
  {
    key: "nav:back",
    label: "Go Back",
    command: () => gBrowser.goBack(),
    condition: !!gBrowser?.goBack,
    icon: "chrome://browser/skin/back.svg",
  },
  {
    key: "nav:forward",
    label: "Go Forward",
    command: () => gBrowser.goForward(),
    condition: !!gBrowser?.goForward,
    icon: "chrome://browser/skin/forward.svg",
  },
  {
    key: "nav:stop",
    label: "Stop Loading",
    command: () => gBrowser.stop(),
    condition: !!gBrowser?.stop,
    icon: "chrome://browser/skin/stop.svg",
  },
  {
    key: "nav:reload",
    label: "Reload Page",
    command: () => gBrowser.reload(),
    condition: !!gBrowser?.reload,
    icon: "chrome://browser/skin/reload.svg",
  },
  {
    key: "nav:reload-force",
    label: "Hard Reload (Skip Cache)",
    command: () => BrowserReloadSkipCache(),
    condition: !!window.BrowserReloadSkipCache,
    icon: "chrome://browser/skin/reload-stop-go.svg",
  },
  {
    key: "nav:focus-urlbar",
    label: "Focus Address Bar",
    command: () => gURLBar.focus(),
    condition: !!window.gURLBar,
    icon: "chrome://browser/skin/location.svg",
  },

  // ----------- Bookmarks & History -----------
  {
    key: "bookmark:add",
    label: "Bookmark This Page",
    command: () => PlacesCommandHook.bookmarkCurrentPage(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmark.svg",
  },
  {
    key: "bookmark:all-tabs",
    label: "Bookmark All Tabs",
    command: () => PlacesCommandHook.bookmarkTabs(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
  },
  {
    key: "bookmark:show-all",
    label: "Show All Bookmarks (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("AllBookmarks"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-library.svg",
  },
  {
    key: "history:show-all",
    label: "Show All History (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("History"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/history.svg",
  },
  {
    key: "search:bookmarks",
    label: "Search Bookmarks",
    command: () => PlacesCommandHook.searchBookmarks(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/search-glass.svg",
  },
  {
    key: "search:history",
    label: "Search History",
    command: () => PlacesCommandHook.searchHistory(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/search-glass.svg",
  },

  // ----------- Find & Search -----------
  {
    key: "find:page",
    label: "Find in Page",
    command: () => gFindBar.startFinding(),
    condition: !!window.gFindBar,
    icon: "chrome://global/skin/icons/find.svg",
  },
  {
    key: "find:next",
    label: "Find Next",
    command: () => gFindBar.onFindAgainCommand(false),
    condition: !!window.gFindBar,
    icon: "chrome://browser/skin/arrow-down.svg",
  },
  {
    key: "find:prev",
    label: "Find Previous",
    command: () => gFindBar.onFindAgainCommand(true),
    condition: !!window.gFindBar,
    icon: "chrome://browser/skin/arrow-up.svg",
  },

  // ----------- View & Display -----------
  {
    key: "view:fullscreen",
    label: "Toggle Fullscreen",
    command: () => BrowserFullScreen(),
    condition: !!window.BrowserFullScreen,
    icon: "chrome://browser/skin/fullscreen.svg",
  },
  {
    key: "view:reader",
    label: "Toggle Reader Mode",
    command: () => ReaderParent.toggleReaderMode(),
    condition: !!window.ReaderParent,
    icon: "chrome://browser/skin/reader-mode.svg",
  },
  {
    key: "zoom:in",
    label: "Zoom In",
    command: () => FullZoom.enlarge(),
    condition: !!window.FullZoom,
    icon: "chrome://global/skin/icons/zoom-in.svg",
  },
  {
    key: "zoom:out",
    label: "Zoom Out",
    command: () => FullZoom.reduce(),
    condition: !!window.FullZoom,
    icon: "chrome://global/skin/icons/zoom-out.svg",
  },
  {
    key: "zoom:reset",
    label: "Reset Zoom",
    command: () => FullZoom.reset(),
    condition: !!window.FullZoom,
    icon: "chrome://browser/skin/zoom-reset.svg",
  },

  // ----------- Developer Tools -----------
  {
    key: "dev:source",
    label: "View Page Source",
    command: () => BrowserViewSourceOfDocument(gBrowser.selectedBrowser.document),
    condition: !!window.BrowserViewSourceOfDocument,
    icon: "chrome://devtools/skin/images/command-viewsource.svg",
  },
  {
    key: "dev:page-info",
    label: "View Page Info",
    command: () => BrowserPageInfo(),
    condition: !!window.BrowserPageInfo,
    icon: "chrome://browser/skin/information.svg",
  },
  {
    key: "dev:task-manager",
    label: "Task Manager",
    command: () => gBrowser.loadURI("about:processes"),
    condition: !!window.gBrowser,
    icon: "chrome://browser/skin/task-manager.svg",
  },
  {
    key: "dev:tools",
    label: "Toggle Developer Tools",
    command: () => gDevToolsBrowser.toggle(),
    condition: !!window.gDevToolsBrowser,
    icon: "chrome://devtools/skin/images/toolbox.svg",
  },

  // ----------- Media & Screenshots -----------
  {
    key: "media:pip",
    label: "Toggle Picture-in-Picture",
    command: () => gBrowser.selectedBrowser.requestPictureInPicture(),
    condition: () => !!gBrowser?.selectedBrowser?.requestPictureInPicture,
    icon: "chrome://browser/skin/picture-in-picture-toggle.svg",
  },
  {
    key: "media:screenshot",
    label: "Take Screenshot",
    command: () => Screenshots.action("copy"),
    condition: !!window.Screenshots,
    icon: "chrome://browser/skin/screenshot.svg",
  },

  // ----------- Files & Downloads -----------
  {
    key: "open:downloads",
    label: "View Downloads",
    command: () => BrowserDownloadsUI.showUI(),
    condition: !!window.BrowserDownloadsUI,
    icon: "chrome://browser/skin/downloads/downloads.svg",
  },
  {
    key: "file:save-page",
    label: "Save Page As...",
    command: () => saveBrowser(gBrowser.selectedBrowser),
    condition: !!window.saveBrowser,
    icon: "chrome://browser/skin/save.svg",
  },
  {
    key: "file:print",
    label: "Print Page",
    command: () => PrintUtils.print(),
    condition: !!window.PrintUtils,
    icon: "chrome://browser/skin/print.svg",
  },
  {
    key: "file:open",
    label: "Open File",
    command: () => BrowserOpenFileWindow(),
    condition: !!window.BrowserOpenFileWindow,
    icon: "chrome://browser/skin/open.svg",
  },

  // ----------- Extensions & Customization -----------
  {
    key: "open:addons",
    label: "Manage Extensions and Themes",
    command: () => BrowserAddonUI.openAddonsMgr(),
    condition: !!window.BrowserAddonUI,
    icon: "chrome://mozapps/skin/extensions/extension.svg",
  },
  {
    key: "ui:customize",
    label: "Customize Toolbar...",
    command: () => gCustomizeMode.enter(),
    condition: !!window.gCustomizeMode,
    icon: "chrome://browser/skin/customize.svg",
  },

  // ----------- Privacy & Security -----------
  {
    key: "history:clear",
    label: "Clear Recent History...",
    command: () => Sanitizer.showUI(window),
    condition: !!window.Sanitizer,
    icon: "chrome://global/skin/icons/clear.svg",
  },

  // ----------- Edit Commands -----------
  {
    key: "edit:undo",
    label: "Undo",
    command: () => goDoCommand("cmd_undo"),
    condition: !!window.goDoCommand,
    icon: "chrome://browser/skin/undo.svg",
  },
  {
    key: "edit:redo",
    label: "Redo",
    command: () => goDoCommand("cmd_redo"),
    condition: !!window.goDoCommand,
    icon: "chrome://browser/skin/redo.svg",
  },
  {
    key: "edit:cut",
    label: "Cut",
    command: () => goDoCommand("cmd_cut"),
    condition: !!window.goDoCommand,
    icon: "chrome://global/skin/icons/cut.svg",
  },
  {
    key: "edit:copy",
    label: "Copy",
    command: () => goDoCommand("cmd_copy"),
    condition: !!window.goDoCommand,
    icon: "chrome://global/skin/icons/copy.svg",
  },
  {
    key: "edit:paste",
    label: "Paste",
    command: () => goDoCommand("cmd_paste"),
    condition: !!window.goDoCommand,
    icon: "chrome://global/skin/icons/paste.svg",
  },
  {
    key: "edit:select-all",
    label: "Select All",
    command: () => goDoCommand("cmd_selectAll"),
    condition: !!window.goDoCommand,
    icon: "chrome://browser/skin/select-all.svg",
  },

  // ----------- System & Application -----------
  {
    key: "app:offline-toggle",
    label: "Toggle Work Offline",
    command: () => BrowserOffline.toggleOfflineStatus(),
    condition: !!window.BrowserOffline,
    icon: "chrome://browser/skin/offline.svg",
  },
  {
    key: "app:quit",
    label: "Quit Browser",
    command: () => goQuitApplication(),
    condition: !!window.goQuitApplication,
    icon: "chrome://browser/skin/quit.svg",
  },
  {
    key: "app:restart",
    label: "Restart Browser",
    command: () => Services.appUtils.restart(),
    condition: !!window.Services?.appUtils?.restart,
    icon: "chrome://browser/skin/reload-stop-go.svg",
  },

  // ----------- About Pages -----------
  ...generatedAboutCommands,
];
