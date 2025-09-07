// This file is adapted from the command list in ZBar-Zen by Darsh-A:
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js

// A helper array of common "about:" pages to be programmatically added to the commands list.
const aboutPages = [
  "about",
  "addons",
  "buildconfig",
  "cache",
  "certificate",
  "checkerboard",
  "compat",
  "config",
  "credits",
  "debugging",
  "deleteprofile",
  "downloads",
  "editprofile",
  "home",
  "license",
  "logging",
  "logins",
  "loginsimportreport",
  "logo",
  "memory",
  "mozilla",
  "networking",
  "newprofile",
  "newtab",
  "policies",
  "preferences",
  "privatebrowsing",
  "processes",
  "profiles",
  "profiling",
  "protections",
  "rights",
  "robots",
  "serviceworkers",
  "studies",
  "support",
  "sync-log",
  "telemetry",
  "third-party",
  "unloads",
  "url-classifier",
  "webrtc",
  "welcome",
  "windows-messages",
];

const generatedAboutCommands = aboutPages.map((page) => ({
  key: `about:${page}`,
  label: `Open about:${page}`,
  command: () => gBrowser.loadURI(`about:${page}`),
  condition: !!window.gBrowser,
  icon: "chrome://browser/skin/information.svg",
}));

export const commands = [
  // ----------- Zen Compact Mode -----------
  { key: "cmd_zenCompactModeToggle", label: "Toggle Compact Mode" },
  { key: "cmd_zenCompactModeShowSidebar", label: "Show Sidebar" },
  { key: "cmd_zenCompactModeShowToolbar", label: "Show Toolbar" },
  { key: "cmd_zenCompactModeHideSidebar", label: "Hide Sidebar" },
  { key: "cmd_zenCompactModeHideToolbar", label: "Hide Toolbar" },
  { key: "cmd_zenCompactModeHideBoth", label: "Hide Sidebar and Toolbar" },

  // ----------- Zen Workspace Management -----------
  { key: "cmd_zenWorkspaceForward", label: "Next Workspace" },
  { key: "cmd_zenWorkspaceBackward", label: "Previous Workspace" },
  { key: "cmd_zenChangeWorkspaceTab", label: "Change Workspace Tab" },
  { key: "cmd_zenCtxDeleteWorkspace", label: "Delete Workspace" },
  { key: "cmd_zenChangeWorkspaceName", label: "Change Workspace Name" },
  { key: "cmd_zenChangeWorkspaceIcon", label: "Change Workspace Icon" },
  { key: "cmd_zenOpenWorkspaceCreation", label: "Create New Workspace" },
  ...Array.from({ length: 10 }, (_, i) => ({
    key: `cmd_zenWorkspaceSwitch${i + 1}`,
    label: `Switch to Workspace ${i + 1}`,
  })),

  // ----------- Zen Split View -----------
  { key: "cmd_zenSplitViewGrid", label: "Split View: Grid" },
  { key: "cmd_zenSplitViewVertical", label: "Split View: Vertical" },
  { key: "cmd_zenSplitViewHorizontal", label: "Split View: Horizontal" },
  { key: "cmd_zenSplitViewUnsplit", label: "Unsplit View" },

  // ----------- Tab Management -----------
  { key: "cmd_newNavigatorTab", label: "New Tab", icon: "chrome://browser/skin/tab-add.svg" },
  { key: "cmd_close", label: "Close Tab", icon: "chrome://browser/skin/tab-close.svg" },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/sound-playing-shared.svg",
  },
  {
    key: "Browser:NextTab",
    label: "Next Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/arrow-right.svg",
  },
  {
    key: "Browser:PrevTab",
    label: "Previous Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(-1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/arrow-left.svg",
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    command: () => gTabsPanel.showAllTabsPanel(),
    condition: !!window.gTabsPanel,
    icon: "chrome://browser/skin/tabs-arrow-down.svg",
  },
  {
    key: "Browser:NewUserContextTab",
    label: "New Container Tab",
    command: () => openNewUserContextTab(),
    condition: !!window.openNewUserContextTab,
    icon: "chrome://browser/skin/user-context-personal.svg",
  },
  { key: "cmd_contextZenAddToEssentials", label: "Add to Essentials" },
  { key: "cmd_zenReplacePinnedUrlWithCurrent", label: "Replace Pinned Tab URL with Current" },
  { key: "cmd_zenPinnedTabReset", label: "Reset Pinned Tab" },
  {
    key: "History:UndoCloseTab",
    label: "Reopen Closed Tab",
    command: () => undoCloseTab(),
    condition: !!window.undoCloseTab,
    icon: "chrome://browser/skin/history-undo.svg",
  },

  // ----------- Window Management -----------
  { key: "cmd_newNavigator", label: "New Window", icon: "chrome://browser/skin/window.svg" },
  { key: "cmd_closeWindow", label: "Close Window", icon: "chrome://browser/skin/window-close.svg" },
  {
    key: "cmd_minimizeWindow",
    label: "Minimize Window",
    icon: "chrome://browser/skin/window-minimize.svg",
  },
  {
    key: "Tools:PrivateBrowsing",
    label: "Open Private Window",
    command: () => OpenBrowserWindow({ private: true }),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/private-browsing.svg",
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    command: () => SessionWindowUI.undoCloseWindow(),
    condition: !!window.SessionWindowUI,
    icon: "chrome://browser/skin/history-undo-window.svg",
  },

  // ----------- Navigation -----------
  {
    key: "Browser:Back",
    label: "Go Back",
    command: () => gBrowser.goBack(),
    condition: !!gBrowser?.goBack,
    icon: "chrome://browser/skin/back.svg",
  },
  {
    key: "Browser:Forward",
    label: "Go Forward",
    command: () => gBrowser.goForward(),
    condition: !!gBrowser?.goForward,
    icon: "chrome://browser/skin/forward.svg",
  },
  {
    key: "Browser:Stop",
    label: "Stop Loading",
    command: () => gBrowser.stop(),
    condition: !!gBrowser?.stop,
    icon: "chrome://browser/skin/stop.svg",
  },
  {
    key: "Browser:Reload",
    label: "Reload Page",
    command: () => gBrowser.reload(),
    condition: !!gBrowser?.reload,
    icon: "chrome://browser/skin/reload.svg",
  },
  {
    key: "Browser:ReloadSkipCache",
    label: "Hard Reload (Skip Cache)",
    command: () => BrowserReloadSkipCache(),
    condition: !!window.BrowserReloadSkipCache,
    icon: "chrome://browser/skin/reload-stop-go.svg",
  },
  {
    key: "Browser:OpenLocation",
    label: "Focus Address Bar",
    command: () => gURLBar.focus(),
    condition: !!window.gURLBar,
    icon: "chrome://browser/skin/location.svg",
  },

  // ----------- Bookmarks & History -----------
  {
    key: "Browser:AddBookmarkAs",
    label: "Bookmark This Page",
    command: () => PlacesCommandHook.bookmarkCurrentPage(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmark.svg",
  },
  {
    key: "Browser:BookmarkAllTabs",
    label: "Bookmark All Tabs",
    command: () => PlacesCommandHook.bookmarkTabs(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
  },
  {
    key: "Browser:SearchBookmarks",
    label: "Search Bookmarks",
    command: () => PlacesCommandHook.searchBookmarks(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/search-glass.svg",
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    command: () => PlacesCommandHook.searchHistory(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/search-glass.svg",
  },
  {
    key: "Browser:ShowAllBookmarks",
    label: "Show All Bookmarks (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("AllBookmarks"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-library.svg",
  },
  {
    key: "Browser:ShowAllHistory",
    label: "Show All History (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("History"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/history.svg",
  },

  // ----------- Find & Search -----------
  { key: "cmd_find", label: "Find in Page", icon: "chrome://global/skin/icons/find.svg" },
  { key: "cmd_findAgain", label: "Find Next", icon: "chrome://browser/skin/arrow-down.svg" },
  { key: "cmd_findPrevious", label: "Find Previous", icon: "chrome://browser/skin/arrow-up.svg" },
  { key: "cmd_translate", label: "Translate Page" },

  // ----------- View & Display -----------
  {
    key: "View:FullScreen",
    label: "Toggle Fullscreen",
    command: () => BrowserFullScreen(),
    condition: !!window.BrowserFullScreen,
    icon: "chrome://browser/skin/fullscreen.svg",
  },
  {
    key: "View:ReaderView",
    label: "Toggle Reader Mode",
    command: () => ReaderParent.toggleReaderMode(),
    condition: !!window.ReaderParent,
    icon: "chrome://browser/skin/reader-mode.svg",
  },
  { key: "cmd_fullZoomEnlarge", label: "Zoom In", icon: "chrome://global/skin/icons/zoom-in.svg" },
  { key: "cmd_fullZoomReduce", label: "Zoom Out", icon: "chrome://global/skin/icons/zoom-out.svg" },
  { key: "cmd_fullZoomReset", label: "Reset Zoom", icon: "chrome://browser/skin/zoom-reset.svg" },

  // ----------- Developer Tools -----------
  {
    key: "View:PageSource",
    label: "View Page Source",
    command: () => BrowserViewSourceOfDocument(gBrowser.selectedBrowser.document),
    condition: !!window.BrowserViewSourceOfDocument,
    icon: "chrome://devtools/skin/images/command-viewsource.svg",
  },
  {
    key: "View:PageInfo",
    label: "View Page Info",
    command: () => BrowserPageInfo(),
    condition: !!window.BrowserPageInfo,
    icon: "chrome://browser/skin/information.svg",
  },

  // ----------- Media & Screenshots -----------
  {
    key: "View:PictureInPicture",
    label: "Toggle Picture-in-Picture",
    command: () => gBrowser.selectedBrowser.requestPictureInPicture(),
    condition: () => !!gBrowser?.selectedBrowser?.requestPictureInPicture,
    icon: "chrome://browser/skin/picture-in-picture-toggle.svg",
  },
  {
    key: "Browser:Screenshot",
    label: "Take Screenshot",
    command: () => Screenshots.action("copy"),
    condition: !!window.Screenshots,
    icon: "chrome://browser/skin/screenshot.svg",
  },

  // ----------- Files & Downloads -----------
  {
    key: "Tools:Downloads",
    label: "View Downloads",
    command: () => BrowserDownloadsUI.showUI(),
    condition: !!window.BrowserDownloadsUI,
    icon: "chrome://browser/skin/downloads/downloads.svg",
  },
  {
    key: "Browser:SavePage",
    label: "Save Page As...",
    command: () => saveBrowser(gBrowser.selectedBrowser),
    condition: !!window.saveBrowser,
    icon: "chrome://browser/skin/save.svg",
  },
  { key: "cmd_print", label: "Print Page", icon: "chrome://browser/skin/print.svg" },
  {
    key: "Browser:OpenFile",
    label: "Open File",
    command: () => BrowserOpenFileWindow(),
    condition: !!window.BrowserOpenFileWindow,
    icon: "chrome://browser/skin/open.svg",
  },

  // ----------- Extensions & Customization -----------
  {
    key: "Tools:Addons",
    label: "Manage Extensions",
    command: () => BrowserAddonUI.openAddonsMgr(),
    condition: !!window.BrowserAddonUI,
    icon: "chrome://mozapps/skin/extensions/extension.svg",
  },
  { key: "cmd_CustomizeToolbars", label: "Customize Toolbar..." },

  // ----------- Privacy & Security -----------
  {
    key: "Tools:Sanitize",
    label: "Clear Recent History...",
    command: () => Sanitizer.showUI(window),
    condition: !!window.Sanitizer,
    icon: "chrome://global/skin/icons/clear.svg",
  },

  // ----------- Edit Commands -----------
  { key: "cmd_undo", label: "Undo", icon: "chrome://browser/skin/undo.svg" },
  { key: "cmd_redo", label: "Redo", icon: "chrome://browser/skin/redo.svg" },
  { key: "cmd_cut", label: "Cut", icon: "chrome://global/skin/icons/cut.svg" },
  { key: "cmd_copy", label: "Copy", icon: "chrome://global/skin/icons/copy.svg" },
  { key: "cmd_paste", label: "Paste", icon: "chrome://global/skin/icons/paste.svg" },
  { key: "cmd_selectAll", label: "Select All", icon: "chrome://browser/skin/select-all.svg" },

  // ----------- System & Application -----------
  {
    key: "cmd_toggleOfflineStatus",
    label: "Toggle Work Offline",
    icon: "chrome://browser/skin/offline.svg",
  },
  { key: "cmd_quitApplication", label: "Quit Browser", icon: "chrome://browser/skin/quit.svg" },
  {
    key: "app:restart",
    label: "Restart Browser",
    command: () => Services.appUtils.restart(),
    condition: !!window.Services?.appUtils?.restart,
    icon: "chrome://browser/skin/reload-stop-go.svg",
  },

  // ----------- Additional Zen Commands -----------
  { key: "cmd_zenOpenZenThemePicker", label: "Open Theme Picker" },
  { key: "cmd_zenToggleTabsOnRight", label: "Toggle Tabs on Right" },
  { key: "cmd_contextZenRemoveFromEssentials", label: "Remove from Essentials" },
  { key: "cmd_zenReorderWorkspaces", label: "Reorder Workspaces" },
  { key: "cmd_zenToggleSidebar", label: "Toggle Sidebar" },
  { key: "cmd_zenCopyCurrentURL", label: "Copy Current URL" },
  { key: "cmd_zenCopyCurrentURLMarkdown", label: "Copy Current URL as Markdown" },
  { key: "cmd_zenSortTabs", label: "Sort Tabs" },
  { key: "cmd_zenClearTabs", label: "Clear Tabs" },

  // ----------- About Pages -----------
  ...generatedAboutCommands,
];
