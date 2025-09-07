
export const commands = [
  // Browser Navigation
  { key: "open:home", label: "Open Home Page", icon: "chrome://browser/skin/home.svg", command: () => gBrowser.loadURI("about:home"), condition: !!window.gBrowser },
  { key: "open:downloads", label: "Open Downloads", icon: "chrome://browser/skin/downloads/downloads.svg", command: () => BrowserDownloadsUI.showUI(), condition: !!window.BrowserDownloadsUI },
  { key: "open:addons", label: "Open Add-ons Manager", icon: "chrome://mozapps/skin/extensions/extension.svg", command: () => gBrowser.loadURI("about:addons"), condition: !!window.gBrowser },
  { key: "open:settings", label: "Open Settings", icon: "chrome://browser/skin/settings.svg", command: () => openPreferences(), condition: !!window.openPreferences },
  { key: "open:bookmarks", label: "Toggle Bookmarks Sidebar", icon: "chrome://browser/skin/bookmark-star-on-tray.svg", command: () => SidebarUI.toggle("viewBookmarksSidebar"), condition: !!window.SidebarUI },
  { key: "open:history", label: "Toggle History Sidebar", icon: "chrome://browser/skin/history.svg", command: () => SidebarUI.toggle("viewHistorySidebar"), condition: !!window.SidebarUI },

  // Tab Management
  { key: "tab:new", label: "Open New Tab", icon: "chrome://browser/skin/tab-add.svg", command: () => BrowserOpenTab(), condition: !!window.BrowserOpenTab },
  { key: "tab:close", label: "Close Current Tab", icon: "chrome://browser/skin/tab-close.svg", command: () => BrowserCloseTabOrWindow(), condition: !!window.BrowserCloseTabOrWindow },
  { key: "tab:duplicate", label: "Duplicate Current Tab", icon: "chrome://browser/skin/duplicate.svg", command: () => { const newTab = gBrowser.duplicateTab(gBrowser.selectedTab); gBrowser.selectedTab = newTab; }, condition: !!gBrowser?.duplicateTab },
  { key: "tab:pin", label: "Pin Current Tab", icon: "chrome://browser/skin/pin.svg", command: () => gBrowser.pinTab(gBrowser.selectedTab), condition: () => !!gBrowser?.pinTab && !gBrowser.selectedTab.pinned },
  { key: "tab:unpin", label: "Unpin Current Tab", icon: "chrome://browser/skin/unpin.svg", command: () => gBrowser.unpinTab(gBrowser.selectedTab), condition: () => !!gBrowser?.unpinTab && gBrowser.selectedTab.pinned },
  { key: "tab:mute", label: "Toggle Mute Tab", icon: "chrome://browser/skin/sound-playing-shared.svg", command: () => gBrowser.selectedTab.toggleMuteAudio(), condition: !!gBrowser?.selectedTab?.toggleMuteAudio },
  { key: "tab:reload", label: "Reload Tab", icon: "chrome://global/skin/icons/refresh.svg", command: () => gBrowser.reload(), condition: !!gBrowser?.reload },
  { key: "tab:reload-force", label: "Reload Tab (Skip Cache)", icon: "chrome://global/skin/icons/refresh.svg", command: () => gBrowser.reloadWithFlags(Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE), condition: !!gBrowser?.reloadWithFlags },
  { key: "tab:reopen-closed", label: "Reopen Closed Tab", icon: "chrome://browser/skin/history-undo.svg", command: () => undoCloseTab(), condition: !!window.undoCloseTab },
  { key: "tab:close-others", label: "Close Other Tabs", icon: "chrome://browser/skin/tab-close-other.svg", command: () => gBrowser.removeTabsOtherThan(gBrowser.selectedTab), condition: !!gBrowser?.removeTabsOtherThan },

  // Window Management
  { key: "window:new", label: "Open New Window", icon: "chrome://browser/skin/window.svg", command: () => OpenBrowserWindow(), condition: !!window.OpenBrowserWindow },
  { key: "window:private", label: "New Private Window", icon: "chrome://browser/skin/private-browsing.svg", command: () => OpenBrowserWindow({ private: true }), condition: !!window.OpenBrowserWindow },

  // Bookmarks & History
  { key: "bookmark:add", label: "Bookmark Current Page", icon: "chrome://browser/skin/bookmark.svg", command: () => PlacesCommandHook.bookmarkCurrentPage(), condition: !!window.PlacesCommandHook?.bookmarkCurrentPage },
  { key: "bookmark:manage", label: "Manage Bookmarks (Library)", icon: "chrome://browser/skin/bookmarks-toolbar.svg", command: () => PlacesCommandHook.showView("AllBookmarks"), condition: !!window.PlacesCommandHook },
  { key: "history:clear", label: "Clear Recent History...", icon: "chrome://global/skin/icons/clear.svg", command: () => gBrowser.ownerGlobal.openDialog("chrome://browser/content/sanitize.xhtml", "SanitizeDialog", "chrome,modal,centerscreen") },

  // Developer Tools
  { key: "dev:tools", label: "Toggle Developer Tools", icon: "chrome://devtools/skin/images/toolbox.svg", command: () => gDevToolsBrowser.toggle(), condition: !!window.gDevToolsBrowser },
  { key: "dev:inspector", label: "Toggle Inspector", icon: "chrome://devtools/skin/images/command-pick.svg", command: () => gDevTools.showToolboxForTab(gBrowser.selectedTab, { toolId: "inspector" }), condition: !!window.gDevTools },
  { key: "dev:console", label: "Toggle Web Console", icon: "chrome://devtools/skin/images/command-console.svg", command: () => gDevTools.showToolboxForTab(gBrowser.selectedTab, { toolId: "webconsole" }), condition: !!window.gDevTools },
  { key: "dev:style-reload", label: "Reload Browser Chrome CSS", icon: "chrome://devtools/skin/images/command-reload.svg", command: () => ChromeUtils.reloadStyleSheets(), condition: !!window.ChromeUtils?.reloadStyleSheets },
  { key: "browser:restart", label: "Restart Browser", icon: "chrome://browser/skin/reload-stop-go.svg", command: () => Services.appUtils.restart(), condition: !!window.Services?.appUtils?.restart },
]
