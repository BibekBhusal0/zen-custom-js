// This file is adapted from the command list in ZBar-Zen by Darsh-A:
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js

// A helper array of common "about:" pages to be programmatically added to the commands list.
const aboutPages = [
  { page: "preferences", icon: "chrome://browser/skin/zen-icons/settings.svg" },
  { page: "config", icon: "chrome://browser/skin/zen-icons/settings.svg" },
  { page: "newtab", icon: "chrome://browser/skin/zen-icons/home.svg" },
  { page: "addons", icon: "chrome://browser/skin/zen-icons/extension.svg" },
  { page: "downloads", icon: "chrome://browser/skin/zen-icons/downloads.svg" },
  { page: "debugging" },
  { page: "deleteprofile" },
  { page: "logins" },
  { page: "editprofile" },
  { page: "memory" },
  { page: "newprofile" },
  { page: "processes" },
  { page: "profiles" },
  { page: "serviceworkers" },
  { page: "about" },
  { page: "buildconfig" },
  { page: "cache" },
  { page: "certificate" },
  { page: "checkerboard" },
  { page: "compat" },
  { page: "credits" },
  { page: "support", icon: "chrome://browser/skin/zen-icons/info.svg" },
  { page: "home", icon: "chrome://browser/skin/zen-icons/home.svg" },
  { page: "license" },
  { page: "logging" },
  { page: "loginsimportreport" },
  { page: "logo" },
  { page: "mozilla" },
  { page: "networking" },
  { page: "policies" },
  { page: "privatebrowsing", icon: "chrome://browser/skin/zen-icons/private-window.svg" },
  { page: "profiling" },
  { page: "protections" },
  { page: "rights" },
  { page: "robots" },
  { page: "studies" },
  { page: "sync-log" },
  { page: "telemetry" },
  { page: "third-party" },
  { page: "unloads" },
  { page: "url-classifier" },
  { page: "webrtc" },
  { page: "welcome" },
  { page: "windows-messages" },
];

const generatedAboutCommands = aboutPages.map((aboutPage) => ({
  key: `about:${aboutPage.page}`,
  label: `Open about:${aboutPage.page}`,
  command: () => switchToTabHavingURI(`about:${aboutPage.page}`, true),
  condition: !!window.switchToTabHavingURI,
  icon: aboutPage.icon || "chrome://browser/skin/zen-icons/tab.svg",
}));

const svgToUrl = (iconSVG) => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}`;
};
const splitVz = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-split-horizontal-icon lucide-square-split-horizontal"><path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"/><path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"/><line x1="12" x2="12" y1="4" y2="20"/></svg>`;
const splitHz = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-split-vertical-icon lucide-square-split-vertical"><path d="M5 8V5c0-1 1-2 2-2h10c1 0 2 1 2 2v3"/><path d="M19 16v3c0 1-1 2-2 2H7c-1 0-2-1-2-2v-3"/><line x1="4" x2="20" y1="12" y2="12"/></svg>`;
const splitGrid = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grid2x2-icon lucide-grid-2x2"><path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
const zoomIn = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-in-icon lucide-zoom-in"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;
const zoomOut = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-out-icon lucide-zoom-out"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`;
const zoomReset = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-6-6M3.268 12.043A7.02 7.02 0 0 0 9.902 17a7.01 7.01 0 0 0 7.043-6.131a7 7 0 0 0-5.314-7.672A7.02 7.02 0 0 0 3.39 7.6"/><path d="M3 4v4h4"/></g></svg>`;

export const commands = [
  // ----------- Zen Compact Mode -----------
  {
    key: "cmd_zenCompactModeToggle",
    label: "Toggle Compact Mode",
    icon: "chrome://browser/skin/zen-icons/fullscreen.svg",
    tags: ["compact", "mode", "toggle", "ui", "layout"]
  },
  {
    key: "cmd_zenCompactModeShowSidebar",
    label: "Show Sidebar",
    icon: "chrome://browser/skin/zen-icons/sidebar.svg",
    tags: ["compact", "sidebar", "show", "ui"]
  },
  {
    key: "cmd_zenCompactModeShowToolbar",
    label: "Show Toolbar",
    tags: ["compact", "toolbar", "show", "ui"]
  },
  {
    key: "cmd_zenCompactModeHideSidebar",
    label: "Hide Sidebar",
    icon: "chrome://browser/skin/zen-icons/expand-sidebar.svg",
    tags: ["compact", "sidebar", "hide", "ui"]
  },
  {
    key: "cmd_zenCompactModeHideToolbar",
    label: "Hide Toolbar",
    tags: ["compact", "toolbar", "hide", "ui"]
  },
  {
    key: "cmd_zenCompactModeHideBoth",
    label: "Hide Sidebar and Toolbar",
    tags: ["compact", "sidebar", "toolbar", "hide", "ui", "minimal"]
  },

  // ----------- Zen Workspace Management -----------
  {
    key: "cmd_zenWorkspaceForward",
    label: "Next Workspace",
    icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    tags: ["workspace", "next", "forward", "navigate"]
  },
  // {
  //   key: "cmd_zenWorkspaceBackward",
  //   label: "Previous Workspace",
  //   icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
  //   tags: ["workspace", "previous", "backward", "navigate"]
  // },
  {
    key: "cmd_zenChangeWorkspaceTab",
    label: "Change Workspace Tab",
    tags: ["workspace", "tab", "change", "switch"]
  },
  {
    key: "cmd_zenCtxDeleteWorkspace",
    label: "Delete Workspace",
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["workspace", "delete", "remove", "management"]
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
    tags: ["workspace", "icon", "change", "customize", "management"]
  },
  {
    key: "cmd_zenOpenWorkspaceCreation",
    label: "Create New Workspace",
    icon: "chrome://browser/skin/zen-icons/plus.svg",
    tags: ["workspace", "create", "new", "add", "management"]
  },

  // ----------- Zen Split View -----------
  {
    key: "cmd_zenSplitViewGrid",
    label: "Split View: Grid",
    icon: svgToUrl(splitGrid),
    tags: ["split", "view", "grid", "layout", "multitask"]
  },
  {
    key: "cmd_zenSplitViewVertical",
    label: "Split View: Vertical",
    icon: svgToUrl(splitVz),
    tags: ["split", "view", "vertical", "layout", "multitask"]
  },
  {
    key: "cmd_zenSplitViewHorizontal",
    label: "Split View: Horizontal",
    icon: svgToUrl(splitHz),
    tags: ["split", "view", "horizontal", "layout", "multitask"]
  },
  {
    key: "cmd_zenSplitViewUnsplit",
    label: "Unsplit View",
    tags: ["split", "view", "unsplit", "single", "restore"]
  },


  // ----------- Additional Zen Commands -----------
  {
    key: "cmd_zenOpenZenThemePicker",
    label: "Open Theme Picker",
    icon: "chrome://browser/skin/zen-icons/palette.svg",
    tags: ["theme", "picker", "customize", "appearance"]
  },
  {
    key: "cmd_zenToggleTabsOnRight",
    label: "Toggle Tabs on Right",
    icon: "chrome://browser/skin/zen-icons/sidebars-right.svg",
    tags: ["tabs", "right", "position", "layout"]
  },
  // {
  //   key: "cmd_contextZenRemoveFromEssentials",
  //   label: "Remove from Essentials",
  //   icon: "chrome://browser/skin/zen-icons/essential-remove.svg",
  //   tags: ["essentials", "remove", "unpin"]
  // },
  {
    key: "cmd_zenReorderWorkspaces",
    label: "Reorder Workspaces",
    tags: ["workspace", "reorder", "organize", "sort"]
  },
  {
    key: "cmd_zenToggleSidebar",
    label: "Toggle Sidebar",
    icon: "chrome://browser/skin/zen-icons/sidebars.svg",
    tags: ["sidebar", "toggle", "show", "hide"]
  },
  {
    key: "cmd_zenCopyCurrentURL",
    label: "Copy Current URL",
    icon: "chrome://browser/skin/zen-icons/link.svg",
    tags: ["copy", "url", "current", "clipboard"]
  },
  {
    key: "cmd_zenCopyCurrentURLMarkdown",
    label: "Copy Current URL as Markdown",
    icon: "chrome://browser/skin/zen-icons/link.svg",
    tags: ["copy", "url", "markdown", "format"]
  },

  // ----------- Tab Management -----------
  // {
  //   key: "cmd_newNavigatorTab",
  //   label: "New Tab",
  //   icon: "chrome://browser/skin/zen-icons/plus.svg",
  //   tags: ["tab", "new", "create", "open"]
  // },
  {
    key: "cmd_close",
    label: "Close Tab",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["tab", "close", "remove"]
  },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/zen-icons/media-mute.svg",
    tags: ["tab", "mute", "audio", "sound", "toggle"]
  },
  {
    key: "Browser:NextTab",
    label: "Next Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    tags: ["next", "tab", "switch", "navigate"]
  },
  {
    key: "Browser:PrevTab",
    label: "Previous Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(-1, true),
    condition: !!gBrowser?.tabContainer,
    icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
    tags: ["previous", "tab", "switch", "navigate"]
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    command: () => gTabsPanel.showAllTabsPanel(),
    condition: !!window.gTabsPanel,
    tags: ["show", "all", "tabs", "panel", "overview"]
  },
  // {
  //   key: "Browser:NewUserContextTab",
  //   label: "New Container Tab",
  //   command: () => openNewUserContextTab(),
  //   condition: !!window.openNewUserContextTab,
  //   tags: ["container", "tab", "new", "context"]
  // },
  // {
  //   key: "cmd_contextZenAddToEssentials",
  //   label: "Add to Essentials",
  //   icon: "chrome://browser/skin/zen-icons/essential-add.svg",
  //   tags: ["essentials", "add", "bookmark", "save"]
  // },
  // {
  //   key: "cmd_zenReplacePinnedUrlWithCurrent",
  //   label: "Replace Pinned Tab URL with Current",
  //   tags: ["pinned", "tab", "url", "replace", "current"]
  // },
  // {
  //   key: "cmd_zenPinnedTabReset",
  //   label: "Reset Pinned Tab",
  //   icon: "chrome://browser/skin/zen-icons/reload.svg",
  //   tags: ["pinned", "tab", "reset", "restore"]
  // },
  {
    key: "History:UndoCloseTab",
    label: "Reopen Closed Tab",
    command: () => undoCloseTab(),
    condition: !!window.undoCloseTab,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
    tags: ["undo", "close", "tab", "reopen", "restore"]
  },

  // ----------- Window Management -----------
  {
    key: "cmd_newNavigator",
    label: "New Window",
    icon: "chrome://browser/skin/zen-icons/window.svg",
    tags: ["window", "new", "create", "open"]
  },
  // {
  //   key: "cmd_closeWindow",
  //   label: "Close Window",
  //   icon: "chrome://browser/skin/close.svg",
  //   tags: ["window", "close", "remove"]
  // },
  {
    key: "cmd_minimizeWindow",
    label: "Minimize Window",
    icon: "chrome://browser/skin/zen-icons/unpin.svg",
    tags: ["window", "minimize", "hide"]
  },
  {
    key: "Tools:PrivateBrowsing",
    label: "Open Private Window",
    command: () => OpenBrowserWindow({ private: true }),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/zen-icons/private-window.svg",
    tags: ["private", "browsing", "incognito", "window"]
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    command: () => SessionWindowUI.undoCloseWindow(),
    condition: !!window.SessionWindowUI,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
    tags: ["undo", "close", "window", "reopen", "restore"]
  },

  // ----------- Navigation -----------
  {
    key: "Browser:Back",
    label: "Go Back",
    command: () => gBrowser.goBack(),
    condition: !!gBrowser?.goBack,
    icon: "chrome://browser/skin/back.svg",
    tags: ["back", "navigate", "history", "previous"]
  },
  {
    key: "Browser:Forward",
    label: "Go Forward",
    command: () => gBrowser.goForward(),
    condition: !!gBrowser?.goForward,
    icon: "chrome://browser/skin/forward.svg",
    tags: ["forward", "navigate", "history", "next"]
  },
  {
    key: "Browser:Stop",
    label: "Stop Loading",
    command: () => gBrowser.stop(),
    condition: !!gBrowser?.stop,
    tags: ["stop", "loading", "cancel", "halt"]
  },
  {
    key: "Browser:Reload",
    label: "Reload Page",
    command: () => gBrowser.reload(),
    condition: !!gBrowser?.reload,
    icon: "chrome://browser/skin/zen-icons/reload.svg",
    tags: ["reload", "refresh", "page", "update"]
  },
  // {
  //   key: "Browser:ReloadSkipCache",
  //   label: "Hard Reload (Skip Cache)",
  //   command: () => BrowserReloadSkipCache(),
  //   condition: !!window.BrowserReloadSkipCache,
  //   icon: "chrome://browser/skin/zen-icons/reload.svg",
  //   tags: ["reload", "hard", "cache", "refresh"]
  // },

  // ----------- Bookmarks & History -----------
  // {
  //   key: "Browser:AddBookmarkAs",
  //   label: "Bookmark This Page",
  //   command: () => PlacesCommandHook.bookmarkCurrentPage(),
  //   condition: !!window.PlacesCommandHook,
  //   icon: "chrome://browser/skin/bookmark.svg",
  //   tags: ["bookmark", "save", "favorite", "add"]
  // },
  {
    key: "Browser:BookmarkAllTabs",
    label: "Bookmark All Tabs",
    command: () => PlacesCommandHook.bookmarkTabs(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/bookmarks-toolbar.svg",
    tags: ["bookmark", "all", "tabs", "save"]
  },
  {
    key: "Browser:SearchBookmarks",
    label: "Search Bookmarks",
    command: () => PlacesCommandHook.searchBookmarks(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "bookmarks", "find", "filter"]
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    command: () => PlacesCommandHook.searchHistory(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["search", "history", "find", "browse"]
  },
  {
    key: "Browser:ShowAllBookmarks",
    label: "Show All Bookmarks (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("AllBookmarks"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/library.svg",
    tags: ["bookmarks", "show", "all", "library"]
  },
  {
    key: "Browser:ShowAllHistory",
    label: "Show All History (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("History"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/history.svg",
    tags: ["history", "show", "all", "library"]
  },

  // ----------- Find & Search -----------
  {
    key: "cmd_find",
    label: "Find in Page",
    icon: "chrome://browser/skin/zen-icons/search-page.svg",
    tags: ["find", "search", "page", "text"]
  },
  {
    key: "cmd_findAgain",
    label: "Find Next",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "next", "search", "continue"]
  },
  {
    key: "cmd_findPrevious",
    label: "Find Previous",
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
    tags: ["find", "previous", "search", "back"]
  },
  {
    key: "cmd_translate",
    label: "Translate Page",
    icon: "chrome://browser/skin/zen-icons/translations.svg",
    tags: ["translate", "language", "page"]
  },

  // ----------- View & Display -----------
  // {
  //   key: "View:FullScreen",
  //   label: "Toggle Fullscreen",
  //   command: () => BrowserFullScreen(),
  //   condition: !!window.BrowserFullScreen,
  //   icon: "chrome://browser/skin/fullscreen.svg",
  //   tags: ["fullscreen", "full", "screen", "toggle"]
  // },
  // {
  //   key: "View:ReaderView",
  //   label: "Toggle Reader Mode",
  //   command: () => ReaderParent.toggleReaderMode(),
  //   condition: !!window.ReaderParent,
  //   icon: "chrome://browser/skin/reader-mode.svg",
  //   tags: ["reader", "mode", "reading", "clean"]
  // },
  {
    key: "cmd_fullZoomEnlarge",
    label: "Zoom In",
    icon: svgToUrl(zoomIn),
    tags: ["zoom", "in", "enlarge", "bigger"]
  },
  {
    key: "cmd_fullZoomReduce",
    label: "Zoom Out",
    icon: svgToUrl(zoomOut),
    tags: ["zoom", "out", "reduce", "smaller"]
  },
  {
    key: "cmd_fullZoomReset",
    label: "Reset Zoom",
    icon: svgToUrl(zoomReset),
    tags: ["zoom", "reset", "normal", "100%"]
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
  // {
  //   key: "View:PictureInPicture",
  //   label: "Toggle Picture-in-Picture",
  //   command: () => gBrowser.selectedBrowser.requestPictureInPicture(),
  //   condition: () => !!gBrowser?.selectedBrowser?.requestPictureInPicture,
  //   icon: "chrome://browser/skin/picture-in-picture-toggle.svg",
  //   tags: ["picture", "pip", "video", "floating"]
  // },
  // {
  //   key: "Browser:Screenshot",
  //   label: "Take Screenshot",
  //   command: () => Screenshots.action("copy"),
  //   condition: !!window.Screenshots,
  //   icon: "chrome://browser/skin/screenshot.svg",
  //   tags: ["screenshot", "capture", "image", "snap"]
  // },

  // ----------- Files & Downloads -----------
  // {
  //   key: "Tools:Downloads",
  //   label: "View Downloads",
  //   command: () => BrowserDownloadsUI.showUI(),
  //   condition: !!window.BrowserDownloadsUI,
  //   icon: "chrome://browser/skin/downloads/downloads.svg",
  //   tags: ["downloads", "files", "download", "library"]
  // },
  {
    key: "Browser:SavePage",
    label: "Save Page As...",
    command: () => saveBrowser(gBrowser.selectedBrowser),
    condition: !!window.saveBrowser,
    icon: "chrome://browser/skin/save.svg",
    tags: ["save", "page", "download", "file"]
  },
  {
    key: "cmd_print",
    label: "Print Page",
    icon: "chrome://browser/skin/zen-icons/print.svg",
    tags: ["print", "page", "printer", "document"]
  },
  // {
  //   key: "Browser:OpenFile",
  //   label: "Open File",
  //   command: () => BrowserOpenFileWindow(),
  //   condition: !!window.BrowserOpenFileWindow,
  //   icon: "chrome://browser/skin/open.svg",
  //   tags: ["open", "file", "local", "browse"]
  // },

  // ----------- Extensions & Customization -----------
  {
    key: "Tools:Addons",
    label: "Manage Extensions",
    command: () => BrowserAddonUI.openAddonsMgr(),
    condition: !!window.BrowserAddonUI,
    icon: "chrome://mozapps/skin/extensions/extension.svg",
    tags: ["addons", "extensions", "themes", "manage"]
  },
  {
    key: "cmd_CustomizeToolbars",
    label: "Customize Toolbar...",
    icon: "chrome://browser/skin/zen-icons/edit-theme.svg",
    tags: ["customize", "toolbar", "ui", "layout"]
  },

  // ----------- Privacy & Security -----------
  {
    key: "Tools:Sanitize",
    label: "Clear Recent History...",
    command: () => Sanitizer.showUI(window),
    condition: !!window.Sanitizer,
    icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
    tags: ["clear", "history", "sanitize", "clean", "privacy"]
  },

  // ----------- System & Application -----------
  {
    key: "cmd_toggleOfflineStatus",
    label: "Toggle Work Offline",
    tags: ["offline", "network", "disconnect"]
  },
  {
    key: "cmd_quitApplication",
    label: "Quit Browser",
    icon: "chrome://browser/skin/zen-icons/close.svg",
    tags: ["quit", "exit", "close", "application"]
  },
  // {
  //   key: "app:restart",
  //   label: "Restart Browser",
  //   command: () => Services.appUtils.restart(),
  //   condition: !!window.Services?.appUtils?.restart,
  //   icon: "chrome://browser/skin/zen-icons/reload.svg",
  // },
  // ----------- About Pages -----------
  ...generatedAboutCommands,
];

