const renoved_commands = [
  // removed because now those commands are native
  {
    key: "cmd_zenCompactModeToggle",
    label: "Toggle Compact Mode",
    icon: "chrome://browser/skin/zen-icons/fullscreen.svg",
    tags: ["compact", "mode", "toggle", "ui", "layout", "hide", "sidebar"],
  },
  {
    key: "Tools:Addons",
    label: "Manage Extensions",
    icon: "chrome://mozapps/skin/extensions/extension.svg",
    tags: ["addons", "extensions", "themes", "manage"],
  },
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
  // {
  //   key: "cmd_zenOpenZenThemePicker",
  //   label: "Open Theme Picker",
  //   icon: "chrome://browser/skin/zen-icons/palette.svg",
  //   tags: ["theme", "picker", "customize", "appearance", "color"],
  // },
  // {
  //   key: "cmd_zenToggleTabsOnRight",
  //   label: "Toggle Tabs on Right",
  //   icon: "chrome://browser/skin/zen-icons/sidebars-right.svg",
  //   tags: ["tabs", "right", "position", "layout"],
  // },
  // {
  //   key: "remove-from-essentials",
  //   label: "Remove from Essentials",
  //   command: () => gZenPinnedTabManager.removeEssentials(gBrowser.selectedTab),
  //   condition: () =>
  //     gBrowser?.selectedTab?.hasAttribute("zen-essential") && !!window.gZenPinnedTabManager,
  //   icon: "chrome://browser/skin/zen-icons/essential-remove.svg",
  //   tags: ["essentials", "remove", "unpin"],
  // },
  // {
  //   key: "cmd_zenSplitViewGrid",
  //   label: "Split Grid",
  //   icon: svgToUrl(icons["splitGrid"]),
  //   condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
  //   tags: ["split", "view", "grid", "layout", "multitask"],
  // },
  // {
  //   key: "cmd_zenSplitViewVertical",
  //   label: "Split Vertical",
  //   icon: svgToUrl(icons["splitVz"]),
  //   condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
  //   tags: ["split", "view", "vertical", "layout", "multitask"],
  // },
  // {
  //   key: "cmd_zenSplitViewHorizontal",
  //   label: "Split Horizontal",
  //   icon: svgToUrl(icons["splitHz"]),
  //   condition: () => gBrowser.visibleTabs.length >= 2 && !gZenViewSplitter?.splitViewActive,
  //   tags: ["split", "view", "horizontal", "layout", "multitask"],
  // },
  // {
  //   key: "cmd_zenCopyCurrentURL",
  //   label: "Copy Current URL",
  //   icon: "chrome://browser/skin/zen-icons/link.svg",
  //   tags: ["copy", "url", "current", "clipboard"],
  // },
  // {
  //   key: "cmd_zenOpenFolderCreation",
  //   label: "Create New Folder",
  //   command: () => gZenFolders.createFolder([], { renameFolder: true }),
  //   condition: () => !!window.gZenFolders,
  //   icon: "chrome://browser/skin/zen-icons/folder.svg",
  //   tags: ["folder", "create", "new", "group", "tabs"],
  // },
  // {
  //   key: "cmd_close",
  //   label: "Close Tab",
  //   icon: "chrome://browser/skin/zen-icons/close.svg",
  //   condition: isNotEmptyTab,
  //   tags: ["tab", "close", "remove"],
  // },
  //{
  //   key: "Browser:PinTab",
  //   label: "Pin Tab",
  //   command: () => gBrowser.pinTab(gBrowser.selectedTab),
  //   condition: () => gBrowser?.selectedTab && !gBrowser.selectedTab.pinned && isNotEmptyTab,
  //   icon: svgToUrl(icons["pin"]), // using lucde icon for pin this looks better than browser's pin icon
  //   tags: ["pin", "tab", "stick", "affix"],
  // },
  // {
  //   key: "Browser:UnpinTab",
  //   label: "Unpin Tab",
  //   command: () => gBrowser.unpinTab(gBrowser.selectedTab),
  //   condition: () => gBrowser?.selectedTab?.pinned && isNotEmptyTab,
  //   icon: svgToUrl(icons["unpin"]),
  //   tags: ["unpin", "tab", "release", "detach"],
  // },
  // {
  //   key: "Browser:NextTab",
  //   label: "Next Tab",
  //   icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
  //   tags: ["next", "tab", "switch", "navigate"],
  // },
  // {
  //   key: "Browser:PrevTab",
  //   label: "Previous Tab",
  //   icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
  //   tags: ["previous", "tab", "switch", "navigate"],
  // },
  // {
  //   key: "add-to-essentials",
  //   label: "Add to Essentials",
  //   command: () => gZenPinnedTabManager.addToEssentials(gBrowser.selectedTab),
  //   condition: () =>
  //     !!window.gZenPinnedTabManager &&
  //     gZenPinnedTabManager.canEssentialBeAdded(gBrowser.selectedTab) &&
  //     !window.gBrowser.selectedTab.hasAttribute("zen-essential"),
  //   icon: "chrome://browser/skin/zen-icons/essential-add.svg",
  //   tags: ["essentials", "add", "bookmark", "save"],
  // },
  // {
  //   key: "cmd_newNavigator",
  //   label: "New Window",
  //   icon: "chrome://browser/skin/zen-icons/window.svg",
  //   tags: ["window", "new", "create", "open"],
  // },
  // {
  //   key: "Browser:Reload",
  //   label: "Reload Page",
  //   icon: "chrome://browser/skin/zen-icons/reload.svg",
  //   condition: isNotEmptyTab,
  //   tags: ["reload", "refresh", "page", "update"],
  // },
  // {
  //   key: "Browser:ReloadSkipCache",
  //   label: "Hard Reload (Skip Cache)",
  //   icon: "chrome://browser/skin/zen-icons/reload.svg",
  //   tags: ["reload", "hard", "cache", "refresh"],
  //   condition: isNotEmptyTab,
  // },
  // {
  //   key: "cmd_find",
  //   label: "Find in Page",
  //   icon: "chrome://browser/skin/zen-icons/search-page.svg",
  //   tags: ["find", "search", "page", "text"],
  //   condition: isNotEmptyTab,
  // },
  // {
  //   key: "Browser:Screenshot",
  //   label: "Take Screenshot",
  //   icon: "chrome://browser/skin/screenshot.svg",
  //   tags: ["screenshot", "capture", "image", "snap"],
  //   condition: isNotEmptyTab,
  // },

  // removed because not working

  // removed because felt useless
  {
    key: "key_jsdebugger",
    label: "Open js debugger",
    condition: isNotEmptyTab,
    tags: ["devtools", "debugger", "js", "javascript"],
    icon: "chrome://devtools/skin/images/tool-debugger.svg",
  },
  {
    key: "key_netmonitor",
    label: "Open network monitor",
    condition: isNotEmptyTab,
    tags: ["devtools", "network", "monitor"],
    icon: "chrome://devtools/skin/images/tool-network.svg",
  },
  {
    key: "key_styleeditor",
    label: "Open style editor",
    condition: isNotEmptyTab,
    tags: ["devtools", "style", "editor", "css"],
    icon: "chrome://devtools/skin/images/tool-styleeditor.svg",
  },
  {
    key: "key_performance",
    label: "Open performance panel",
    condition: isNotEmptyTab,
    tags: ["devtools", "performance", "panel"],
    icon: "chrome://devtools/skin/images/tool-profiler.svg",
  },
  {
    key: "key_storage",
    label: "Open storage panel",
    condition: isNotEmptyTab,
    tags: ["devtools", "storage", "panel"],
    icon: "chrome://devtools/skin/images/tool-storage.svg",
  },
  {
    key: "cmd_toggleOfflineStatus",
    label: "Toggle Work Offline",
    tags: ["offline", "network", "disconnect"],
  },
];
