// This file is adapted from the command list in ZBar-Zen by Darsh-A:
// https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js

// A helper array of common "about:" pages to be programmatically added to the commands list.
const aboutPages = [
  { page: "about" },
  { page: "addons", icon: "chrome://browser/skin/zen-icons/extension.svg" },
  { page: "buildconfig" },
  { page: "cache" },
  { page: "certificate" },
  { page: "checkerboard" },
  { page: "compat" },
  { page: "config", icon: "chrome://browser/skin/zen-icons/settings.svg" },
  { page: "credits" },
  { page: "debugging" },
  { page: "deleteprofile" },
  { page: "downloads", icon: "chrome://browser/skin/zen-icons/downloads.svg" },
  { page: "editprofile" },
  { page: "home", icon: "chrome://browser/skin/zen-icons/home.svg" },
  { page: "license" },
  { page: "logging" },
  { page: "logins" },
  { page: "loginsimportreport" },
  { page: "logo" },
  { page: "memory" },
  { page: "mozilla" },
  { page: "networking" },
  { page: "newprofile" },
  { page: "newtab", icon: "chrome://browser/skin/zen-icons/home.svg" },
  { page: "policies" },
  { page: "preferences", icon: "chrome://browser/skin/zen-icons/settings.svg" },
  { page: "privatebrowsing", icon: "chrome://browser/skin/zen-icons/private-window.svg" },
  { page: "processes" },
  { page: "profiles" },
  { page: "profiling" },
  { page: "protections" },
  { page: "rights" },
  { page: "robots" },
  { page: "serviceworkers" },
  { page: "studies" },
  { page: "support", icon: "chrome://browser/skin/zen-icons/info.svg" },
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

export const commands = [
  // ----------- Zen Compact Mode -----------
  { key: "cmd_zenCompactModeToggle", label: "Toggle Compact Mode", icon: "chrome://browser/skin/zen-icons/fullscreen.svg" },
  { key: "cmd_zenCompactModeShowSidebar", label: "Show Sidebar", icon: "chrome://browser/skin/zen-icons/sidebar.svg" },
  { key: "cmd_zenCompactModeShowToolbar", label: "Show Toolbar", },
  { key: "cmd_zenCompactModeHideSidebar", label: "Hide Sidebar" },
  { key: "cmd_zenCompactModeHideToolbar", label: "Hide Toolbar" },
  { key: "cmd_zenCompactModeHideBoth", label: "Hide Sidebar and Toolbar", },

  // ----------- Zen Workspace Management -----------
  { key: "cmd_zenWorkspaceForward", label: "Next Workspace", icon: "chrome://browser/skin/zen-icons/arrow-right.svg" },
  { key: "cmd_zenWorkspaceBackward", label: "Previous Workspace", icon: "chrome://browser/skin/zen-icons/arrow-right.svg" },
  { key: "cmd_zenChangeWorkspaceTab", label: "Change Workspace Tab" },
  { key: "cmd_zenCtxDeleteWorkspace", label: "Delete Workspace", icon: "chrome://browser/skin/zen-icons/edit-delete.svg" },
  { key: "cmd_zenChangeWorkspaceName", label: "Change Workspace Name", icon: "chrome://browser/skin/zen-icons/edit.svg" },
  { key: "cmd_zenChangeWorkspaceIcon", label: "Change Workspace Icon" },
  { key: "cmd_zenOpenWorkspaceCreation", label: "Create New Workspace", icon: "chrome://browser/skin/zen-icons/plus.svg" },

  // ----------- Zen Split View -----------
  { key: "cmd_zenSplitViewGrid", label: "Split View: Grid" },
  { key: "cmd_zenSplitViewVertical", label: "Split View: Vertical" },
  { key: "cmd_zenSplitViewHorizontal", label: "Split View: Horizontal", icon: "chrome://browser/skin/zen-icons/split.svg" },
  { key: "cmd_zenSplitViewUnsplit", label: "Unsplit View" },

  // ----------- Tab Management -----------
  { key: "cmd_newNavigatorTab", label: "New Tab", icon: "chrome://browser/skin/zen-icons/plus.svg" },
  { key: "cmd_close", label: "Close Tab", icon: "chrome://browser/skin/zen-icons/close.svg" },
  {
    key: "cmd_toggleMute",
    label: "Toggle Mute Tab",
    icon: "chrome://browser/skin/zen-icons/media-mute.svg",
  },
  {
    key: "Browser:NextTab",
    label: "Next Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(1, true),
    condition: !!gBrowser?.tabContainer,
icon: "chrome://browser/skin/zen-icons/arrow-right.svg" 
  },
  {
    key: "Browser:PrevTab",
    label: "Previous Tab",
    command: () => gBrowser.tabContainer.advanceSelectedTab(-1, true),
    condition: !!gBrowser?.tabContainer,
icon: "chrome://browser/skin/zen-icons/arrow-left.svg" 
  },
  {
    key: "Browser:ShowAllTabs",
    label: "Show All Tabs Panel",
    command: () => gTabsPanel.showAllTabsPanel(),
    condition: !!window.gTabsPanel,
  },
  {
    key: "Browser:NewUserContextTab",
    label: "New Container Tab",
    command: () => openNewUserContextTab(),
    condition: !!window.openNewUserContextTab,
  },
  { key: "cmd_contextZenAddToEssentials", label: "Add to Essentials", icon: "chrome://browser/skin/zen-icons/essential-add.svg", },
  { key: "cmd_zenReplacePinnedUrlWithCurrent", label: "Replace Pinned Tab URL with Current" },
  {
    key: "cmd_zenPinnedTabReset",
    label: "Reset Pinned Tab",
icon: "chrome://browser/skin/zen-icons/reload.svg" 
  },
  {
    key: "History:UndoCloseTab",
    label: "Reopen Closed Tab",
    command: () => undoCloseTab(),
    condition: !!window.undoCloseTab,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
  },

  // ----------- Window Management -----------
  { key: "cmd_newNavigator", label: "New Window", icon: "chrome://browser/skin/zen-icons/window.svg", },
  { key: "cmd_closeWindow", label: "Close Window", icon: "chrome://browser/skin/close.svg" },
  {
    key: "cmd_minimizeWindow",
    label: "Minimize Window",
    icon: "chrome://browser/skin/zen-icons/unpin.svg",
  },
  {
    key: "Tools:PrivateBrowsing",
    label: "Open Private Window",
    command: () => OpenBrowserWindow({ private: true }),
    condition: !!window.OpenBrowserWindow,
    icon: "chrome://browser/skin/zen-icons/private-window.svg",
  },
  {
    key: "History:UndoCloseWindow",
    label: "Reopen Closed Window",
    command: () => SessionWindowUI.undoCloseWindow(),
    condition: !!window.SessionWindowUI,
    icon: "chrome://browser/skin/zen-icons/edit-undo.svg",
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
  },
  {
    key: "Browser:Reload",
    label: "Reload Page",
    command: () => gBrowser.reload(),
    condition: !!gBrowser?.reload,
icon: "chrome://browser/skin/zen-icons/reload.svg" 
  },
  {
    key: "Browser:ReloadSkipCache",
    label: "Hard Reload (Skip Cache)",
    command: () => BrowserReloadSkipCache(),
    condition: !!window.BrowserReloadSkipCache,
icon: "chrome://browser/skin/zen-icons/reload.svg" 
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
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
  },
  {
    key: "History:SearchHistory",
    label: "Search History",
    command: () => PlacesCommandHook.searchHistory(),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/search-glass.svg",
  },
  {
    key: "Browser:ShowAllBookmarks",
    label: "Show All Bookmarks (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("AllBookmarks"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/zen-icons/library.svg",
  },
  {
    key: "Browser:ShowAllHistory",
    label: "Show All History (Library)",
    command: () => PlacesCommandHook.showPlacesOrganizer("History"),
    condition: !!window.PlacesCommandHook,
    icon: "chrome://browser/skin/history.svg",
  },

  // ----------- Find & Search -----------
  { key: "cmd_find", label: "Find in Page", icon: "chrome://browser/skin/zen-icons/search-page.svg" },
  { key: "cmd_findAgain", label: "Find Next", icon: "chrome://browser/skin/zen-icons/search-glass.svg" },
  { key: "cmd_findPrevious", label: "Find Previous", icon: "chrome://browser/skin/zen-icons/search-glass.svg" },
  { key: "cmd_translate", label: "Translate Page" ,icon: "chrome://browser/skin/zen-icons/translations.svg"  },

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
  { key: "cmd_fullZoomEnlarge", label: "Zoom In", icon: "chrome://global/skin/zen-icons/zoom-control.svg" },
  { key: "cmd_fullZoomReduce", label: "Zoom Out", icon: "chrome://global/skin/zen-icons/zoom-out.svg" },
  { key: "cmd_fullZoomReset", label: "Reset Zoom", },

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
  { key: "cmd_print", label: "Print Page", icon: "chrome://browser/skin/zen-icons/print.svg" },
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
  { key: "cmd_CustomizeToolbars", label: "Customize Toolbar..." , icon : "chrome://browser/skin/zen-icons/edit-theme.svg" },

  // ----------- Privacy & Security -----------
  {
    key: "Tools:Sanitize",
    label: "Clear Recent History...",
    command: () => Sanitizer.showUI(window),
    condition: !!window.Sanitizer,
icon: "chrome://browser/skin/zen-icons/edit-delete.svg" 
  },

  // ----------- Edit Commands -----------
  { key: "cmd_undo", label: "Undo", icon: "chrome://browser/skin/zen-icons/edit-undo.svg" },
  { key: "cmd_redo", label: "Redo", icon: "chrome://browser/skin/zen-icons/edit-redo.svg" },
  { key: "cmd_cut", label: "Cut", icon: "chrome://browser/skin/zen-icons/edit-cut.svg" },
  { key: "cmd_copy", label: "Copy", icon: "chrome://browser/skin/zen-icons/edit-copy.svg" },
  { key: "cmd_paste", label: "Paste", icon: "chrome://browser/skin/zen-icons/edit-paste.svg" },
  { key: "cmd_selectAll", label: "Select All",},

  // ----------- System & Application -----------
  {
    key: "cmd_toggleOfflineStatus",
    label: "Toggle Work Offline",
  },
  {
    key: "cmd_quitApplication",
    label: "Quit Browser",
icon: "chrome://browser/skin/zen-icons/close.svg" 
  },
  {
    key: "app:restart",
    label: "Restart Browser",
    command: () => Services.appUtils.restart(),
    condition: !!window.Services?.appUtils?.restart,
icon: "chrome://browser/skin/zen-icons/reload.svg" 
  },

  // ----------- Additional Zen Commands -----------
  { key: "cmd_zenOpenZenThemePicker", label: "Open Theme Picker" , icon: "chrome://browser/skin/zen-icons/palette.svg" },
  { key: "cmd_zenToggleTabsOnRight", label: "Toggle Tabs on Right" , icon: "chrome://browser/skin/zen-icons/sidebars-right.svg" },
  { key: "cmd_contextZenRemoveFromEssentials", label: "Remove from Essentials" , icon: "chrome://browser/skin/zen-icons/essential-remove.svg" },
  { key: "cmd_zenReorderWorkspaces", label: "Reorder Workspaces" ,  },
  { key: "cmd_zenToggleSidebar", label: "Toggle Sidebar",  icon: "chrome://browser/skin/zen-icons/sidebars.svg"  },
  { key: "cmd_zenCopyCurrentURL", label: "Copy Current URL" ,  icon: "chrome://browser/skin/zen-icons/link.svg"  },
  { key: "cmd_zenCopyCurrentURLMarkdown", label: "Copy Current URL as Markdown" ,  icon: "chrome://browser/skin/zen-icons/link.svg"  },

  // ----------- About Pages -----------
  ...generatedAboutCommands,
];
