// ==UserScript==
// @name            Zen Command Palette
// @description     A powerful, extensible command interface for Zen Browser, seamlessly integrated into the URL bar.
// @author          BibekBhusal
// @loadOrder    99999999999999
// ==/UserScript==


(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  const svgToUrl = (iconSVG, invert = true) => {
    const marker = invert ? "#invert" : "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}${marker}`;
  };

  const textToSvgDataUrl = (text) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="10" fill="currentColor">${text}</text>
  </svg>`;
    return svgToUrl(svg, false);
  };

  const icons = {
    splitVz: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-split-horizontal-icon lucide-square-split-horizontal"><path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"/><path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"/><line x1="12" x2="12" y1="4" y2="20"/></svg>`,
    splitHz: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-split-vertical-icon lucide-square-split-vertical"><path d="M5 8V5c0-1 1-2 2-2h10c1 0 2 1 2 2v3"/><path d="M19 16v3c0 1-1 2-2 2H7c-1 0-2-1-2-2v-3"/><line x1="4" x2="20" y1="12" y2="12"/></svg>`,
    splitGrid: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grid2x2-icon lucide-grid-2x2"><path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    zoomIn: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-in-icon lucide-zoom-in"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`,
    zoomOut: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-out-icon lucide-zoom-out"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`,
    zoomReset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-6-6M3.268 12.043A7.02 7.02 0 0 0 9.902 17a7.01 7.01 0 0 0 7.043-6.131a7 7 0 0 0-5.314-7.672A7.02 7.02 0 0 0 3.39 7.6"/><path d="M3 4v4h4"/></g></svg>`,
    pin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
    unpin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-off-icon lucide-pin-off"><path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>`,
    broom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"><path d="M5.185 31.954C6.529 26.914 10.638 23 15.854 23c4.895 0 8.164 4.425 8.056 9.32l-.057 2.569a7 7 0 0 0 2.097 5.154l1.106 1.086c1.586 1.557.66 4.224-1.555 4.408c-2.866.237-6.41.463-9.501.463c-3.982 0-7.963-.375-10.45-.666c-1.472-.172-2.558-1.428-2.417-2.902c.32-3.363 1.174-7.188 2.052-10.478"/><path d="M20 24.018c1.68-6.23 3.462-12.468 4.853-18.773c.219-.993-.048-2.01-1-2.365a8 8 0 0 0-.717-.226a8 8 0 0 0-.734-.162c-1.002-.17-1.742.578-2.048 1.547c-1.96 6.191-3.542 12.522-5.213 18.792M45 45H35m7-8H32m7-8H29m-18.951 8.75c-.167 1.5 0 5.2 2 8m5-7.75s0 5 2.951 7.5"/></g></svg>`,
    sine: `<svg fill-opacity="context-fill-opacity" fill="currentColor" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 502.688 502.688" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M491.401,12.059c-23.467-23.467-70.4-9.6-145.067,42.667c-30.933-16-65.067-25.6-101.333-25.6 c-57.6,0-112,22.4-152.533,62.933c-68.267,68.267-81.067,170.667-38.4,252.8c-69.333,99.2-57.6,131.2-42.667,145.067 c7.467,7.467,18.133,11.733,29.867,11.733c23.467,0,54.4-13.867,98.133-40.533c7.467-5.333,16-10.667,24.533-17.067 c25.6,10.667,53.333,16,81.067,16c57.6,0,112-22.4,152.533-62.933c62.933-62.933,78.933-155.733,46.933-233.6 c6.4-8.533,11.733-17.067,18.133-25.6C504.201,73.925,512.734,33.392,491.401,12.059z M41.267,458.992 c1.067-8.533,7.467-32,37.333-77.867c4.267,5.333,8.533,10.667,13.867,16c8.533,8.533,18.133,16,27.733,23.467 C81.801,446.192,53.001,458.992,41.267,458.992z M156.467,394.992c-11.733-7.467-23.467-16-34.133-26.667 c-68.267-68.267-68.267-178.133,0-246.4c32-33.067,75.733-51.2,122.667-51.2s90.667,18.133,123.733,50.133 c10.667,10.667,20.267,22.4,26.667,35.2c-27.733,36.267-66.133,80-113.067,126.933 C235.401,329.925,192.734,367.259,156.467,394.992z M368.734,367.259c-33.067,33.067-77.867,52.267-123.733,52.267 c-13.867,0-27.733-2.133-41.6-5.333c36.267-28.8,74.667-62.933,112-100.267c37.333-37.333,70.4-74.667,99.2-110.933 C428.467,260.592,413.534,322.459,368.734,367.259z M422.067,120.858c-7.467-10.667-14.933-20.267-24.533-28.8 c-4.267-4.267-9.6-8.533-13.867-12.8c44.8-29.867,68.267-37.333,76.8-37.333C460.467,53.659,448.734,81.392,422.067,120.858z"></path></g></g></g></svg>`,
  };

  // This file is adapted from the command list in ZBar-Zen by Darsh-A
  // https://github.com/Darsh-A/ZBar-Zen/blob/main/command_bar.uc.js

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

  const commands = [
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
      tags: ["split", "view", "unsplit", "single", "restore"],
    },

    // ----------- Zen Glance -----------
    {
      key: "cmd_zenGlanceClose",
      label: "Close Glance",
      tags: ["glance", "close"],
      icon: "chrome://browser/skin/zen-icons/close.svg",
      condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
    },
    {
      key: "cmd_zenGlanceExpand",
      label: "Expand Glance",
      tags: ["glance", "expand"],
      icon: "chrome://browser/skin/fullscreen.svg",
      condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
    },
    {
      key: "cmd_zenGlanceSplit",
      label: "Split Glance",
      tags: ["glance", "split"],
      icon: svgToUrl(icons["splitVz"]),
      condition: () => gBrowser.selectedTab.hasAttribute("glance-id"),
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
    // {
    //   key: "cmd_zenReplacePinnedUrlWithCurrent",
    //   label: "Replace Pinned URL with Current",
    //   tags: ["pinned", "tab", "url", "replace"],
    // },

    // ----------- Folder Management -----------
    {
      key: "cmd_zenOpenFolderCreation",
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
      key: "cmd_zenReplacePinnedUrlWithCurrent",
      label: "Replace Pinned Tab URL with Current",
      command: () => gZenPinnedTabManager.replacePinnedUrlWithCurrent(gBrowser.selectedTab),
      condition: () => gBrowser?.selectedTab?.pinned && !!window.gZenPinnedTabManager,
      tags: ["pinned", "tab", "url", "replace", "current"],
      icon: "chrome://browser/skin/zen-icons/reload.svg",
    },
    {
      key: "cmd_zenPinnedTabReset",
      label: "Reset Pinned Tab",
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
      condition: () => gBrowser.canGoBack,
      icon: "chrome://browser/skin/back.svg",
      tags: ["back", "navigate", "history", "previous"],
    },
    {
      key: "Browser:Forward",
      label: "Go Forward",
      command: () => gBrowser.goForward(),
      condition: () => gBrowser.canGoForward,
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
    {
      key: "View:PageSource",
      label: "View Page Source",
      command: () => BrowserCommands.viewSource(window.gBrowser.selectedBrowser),
      condition: !!window.BrowserCommands,
      icon: "chrome://browser/skin/zen-icons/source-code.svg",
      tags: ["source", "code", "html", "view"],
    },
    {
      key: "View:PageInfo",
      label: "View Page Info",
      command: () => BrowserCommands.pageInfo(),
      condition: !!window.BrowserCommands,
      icon: "chrome://browser/skin/zen-icons/info.svg",
      tags: ["info", "page", "details", "properties"],
    },

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
  ];

  let _originalMaxResults = null;

  const Prefs = {
    KEYS: {
      PREFIX_REQUIRED: "zen-command-palette.prefix-required",
      DEBUG_MODE: "zen-command-palette.debug-mode",
      MAX_COMMANDS: "zen-command-palette.max-commands",
      MAX_COMMANDS_PREFIX: "zen-command-palette.max-commands-prefix",
      MIN_QUERY_LENGTH: "zen-command-palette.min-query-length",
      MIN_SCORE_THRESHOLD: "zen-command-palette.min-score-threshold",
      DYNAMIC_ABOUT_PAGES: "zen-command-palette.dynamic.about-pages",
      DYNAMIC_SEARCH_ENGINES: "zen-command-palette.dynamic.search-engines",
      DYNAMIC_EXTENSIONS: "zen-command-palette.dynamic.extensions",
      DYNAMIC_WORKSPACES: "zen-command-palette.dynamic.workspaces",
      DYNAMIC_SINE_MODS: "zen-command-palette.dynamic.sine-mods",
      DYNAMIC_FOLDERS: "zen-command-palette.dynamic.folders",
      DYNAMIC_CONTAINER_TABS: "zen-command-palette.dynamic.container-tabs",
      DYNAMIC_ACTIVE_TABS: "zen-command-palette.dynamic.active-tabs",
      COMMAND_SETTINGS_FILE: "zen-command-palette.settings-file-path",
    },

    defaultValues: {},

    getPref(key) {
      try {
        const pref = UC_API.Prefs.get(key);
        if (!pref || !pref.exists()) return this.defaultValues[key];
        return pref.value;
      } catch {
        return this.defaultValues[key];
      }
    },

    setPref(prefKey, value) {
      UC_API.Prefs.set(prefKey, value);
    },

    setInitialPrefs() {
      for (const [key, value] of Object.entries(this.defaultValues)) {
        UC_API.Prefs.setIfUnset(key, value);
      }
    },

    get prefixRequired() {
      return this.getPref(this.KEYS.PREFIX_REQUIRED);
    },
    get debugMode() {
      return this.getPref(this.KEYS.DEBUG_MODE);
    },
    get maxCommands() {
      return this.getPref(this.KEYS.MAX_COMMANDS);
    },
    get maxCommandsPrefix() {
      return this.getPref(this.KEYS.MAX_COMMANDS_PREFIX);
    },
    get minQueryLength() {
      return this.getPref(this.KEYS.MIN_QUERY_LENGTH);
    },
    get minScoreThreshold() {
      return this.getPref(this.KEYS.MIN_SCORE_THRESHOLD);
    },
    get loadAboutPages() {
      return this.getPref(this.KEYS.DYNAMIC_ABOUT_PAGES);
    },
    get loadSearchEngines() {
      return this.getPref(this.KEYS.DYNAMIC_SEARCH_ENGINES);
    },
    get loadExtensions() {
      return this.getPref(this.KEYS.DYNAMIC_EXTENSIONS);
    },
    get loadWorkspaces() {
      return this.getPref(this.KEYS.DYNAMIC_WORKSPACES);
    },
    get loadSineMods() {
      return this.getPref(this.KEYS.DYNAMIC_SINE_MODS);
    },
    get loadFolders() {
      return this.getPref(this.KEYS.DYNAMIC_FOLDERS);
    },
    get loadContainerTabs() {
      return this.getPref(this.KEYS.DYNAMIC_CONTAINER_TABS);
    },
    get loadActiveTabs() {
      return this.getPref(this.KEYS.DYNAMIC_ACTIVE_TABS);
    },
    get commandSettingsFile() {
      return this.getPref(this.KEYS.COMMAND_SETTINGS_FILE);
    },

    setTempMaxRichResults(value) {
      if (_originalMaxResults === null) {
        _originalMaxResults = UC_API.Prefs.get("browser.urlbar.maxRichResults")?.value ?? 10;
      }
      UC_API.Prefs.set("browser.urlbar.maxRichResults", value);
    },

    resetTempMaxRichResults() {
      if (_originalMaxResults !== null) {
        UC_API.Prefs.set("browser.urlbar.maxRichResults", _originalMaxResults);
        _originalMaxResults = null;
      }
    },
  };

  Prefs.defaultValues = {
    [Prefs.KEYS.PREFIX_REQUIRED]: false,
    [Prefs.KEYS.DEBUG_MODE]: false,
    [Prefs.KEYS.MAX_COMMANDS]: 3,
    [Prefs.KEYS.MAX_COMMANDS_PREFIX]: 50,
    [Prefs.KEYS.MIN_QUERY_LENGTH]: 3,
    [Prefs.KEYS.MIN_SCORE_THRESHOLD]: 20,
    [Prefs.KEYS.DYNAMIC_ABOUT_PAGES]: false,
    [Prefs.KEYS.DYNAMIC_SEARCH_ENGINES]: true,
    [Prefs.KEYS.DYNAMIC_EXTENSIONS]: false,
    [Prefs.KEYS.DYNAMIC_WORKSPACES]: true,
    [Prefs.KEYS.DYNAMIC_SINE_MODS]: true,
    [Prefs.KEYS.DYNAMIC_FOLDERS]: true,
    [Prefs.KEYS.DYNAMIC_CONTAINER_TABS]: false,
    [Prefs.KEYS.DYNAMIC_ACTIVE_TABS]: false,
    [Prefs.KEYS.COMMAND_SETTINGS_FILE]: "chrome/zen-commands-settings.json",
  };

  const debugLog = (...args) => {
    if (Prefs.debugMode) console.log("zen-command-palette:", ...args);
  };

  const debugError = (...args) => {
    if (Prefs.debugMode) console.error("zen-command-palette:", ...args);
  };

  /**
   * Gets a favicon for a search engine, with fallbacks.
   * @param {object} engine - The search engine object.
   * @returns {string} The URL of the favicon.
   */
  const getSearchEngineFavicon = (engine) => {
    if (engine.iconURI?.spec) {
      return engine.iconURI.spec;
    }
    try {
      const submissionUrl = engine.getSubmission("test_query").uri.spec;
      const hostName = new URL(submissionUrl).hostname;
      return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${hostName}&sz=32`;
    } catch (e) {
      return "chrome://browser/skin/search-glass.svg"; // Absolute fallback
    }
  };

  /**
   * Generates commands for opening "about:" pages.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of about page commands.
   */
  async function generateAboutPageCommands() {
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

    return aboutPages.map((aboutPage) => ({
      key: `about:${aboutPage.page}`,
      label: `Open about:${aboutPage.page}`,
      command: () => switchToTabHavingURI(`about:${aboutPage.page}`, true),
      condition: !!window.switchToTabHavingURI,
      icon: aboutPage.icon || "chrome://browser/skin/zen-icons/tab.svg",
      tags: ["about", "internal", aboutPage.page],
    }));
  }

  /**
   * Generates commands for changing the current search engine in the URL bar.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of search engine commands.
   */
  async function generateSearchEngineCommands() {
    if (!Services.search) return [];

    const engines = await Services.search.getVisibleEngines();
    return engines.map((engine) => {
      const engineName = engine.name;
      return {
        key: `search:${engineName}`,
        label: `Search with: ${engineName}`,
        command: () => {
          if (window.gURLBar) {
            // Clear the command text from the urlbar before changing mode. This is the key fix.
            window.gURLBar.value = "";
            window.gURLBar.searchMode = {
              engineName,
              // "oneoff" is the entry type used by urlbar one-off buttons.
              entry: "oneoff",
            };
            window.gURLBar.focus();
          }
        },
        condition: () => {
          const currentEngineName =
            window.gURLBar.searchMode?.engineName || Services.search.defaultEngine?.name;
          return currentEngineName !== engineName;
        },
        icon: getSearchEngineFavicon(engine),
        tags: ["search", "engine", engineName.toLowerCase()],
      };
    });
  }

  /**
   * Generates commands for opening extension options pages.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of extension commands.
   */
  async function generateExtensionCommands() {
    const addons = await AddonManager.getAddonsByTypes(["extension"]);
    return addons
      .filter((addon) => addon.isActive && !addon.isSystem && addon.optionsURL)
      .map((addon) => ({
        key: `extension:${addon.id}`,
        label: `Extension Options: ${addon.name}`,
        command: () =>
          BrowserAddonUI.openAddonsMgr(
            "addons://detail/" + encodeURIComponent(addon.id) + "/preferences"
          ),
        icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
        tags: ["extension", "addon", "options", addon.name.toLowerCase()],
      }));
  }

  /**
   * Generates commands for opening the current tab in different containers.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of container commands.
   */
  async function generateContainerTabCommands() {
    if (!window.ContextualIdentityService) {
      return [];
    }

    const commands = [];

    commands.push({
      key: `container-tab:open-default`,
      label: `Open Tab without Container`,
      command: () => {
        const tabToMove = gBrowser.selectedTab;
        if (tabToMove && tabToMove.linkedBrowser) {
          const url = tabToMove.linkedBrowser.currentURI.spec;
          window.openTrustedLinkIn(url, "tab", {
            userContextId: 0,
            relatedToCurrent: true,
            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
          });
          gBrowser.removeTab(tabToMove);
        }
      },
      icon: "chrome://browser/skin/zen-icons/tab.svg",
      tags: ["container", "tab", "open", "default", "no container"],
      condition: () => {
        const currentTab = gBrowser.selectedTab;
        return currentTab && (currentTab.userContextId || 0) !== 0;
      },
      allowIcons: true, // Allow user to change the default tab icon
    });

    const identities = ContextualIdentityService.getPublicIdentities();
    if (!identities || identities.length === 0) {
      return commands;
    }

    identities.forEach((identity) => {
      const name = identity.name || identity.l10nId;
      commands.push({
        key: `container-tab:open:${identity.userContextId}`,
        label: `Open Tab in: ${name}`,
        command: () => {
          const tabToMove = gBrowser.selectedTab;
          if (tabToMove && tabToMove.linkedBrowser) {
            const url = tabToMove.linkedBrowser.currentURI.spec;
            window.openTrustedLinkIn(url, "tab", {
              userContextId: identity.userContextId,
              relatedToCurrent: true,
              triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
            });
            gBrowser.removeTab(tabToMove);
          }
        },
        // TODO: figure out how to get container Icon
        // Generate a colored circle icon dynamically using the container's color.
        icon: svgToUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${identity.color}"><circle r="5" cx="8" cy="8" /></svg>`
        ),
        tags: ["container", "tab", "open", name.toLowerCase()],
        condition: () => {
          const currentTab = gBrowser.selectedTab;
          // Show command only if the tab is not already in this container.
          return currentTab && (currentTab.userContextId || 0) !== identity.userContextId;
        },
      });
    });

    return commands;
  }

  /**
   * Generates commands for switching to active tabs.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of active tab commands.
   */
  async function generateActiveTabCommands() {
    const commands = [];
    // Use gZenWorkspaces.allStoredTabs to get tabs from all workspaces in the current window.
    const tabs = window.gZenWorkspaces?.workspaceEnabled
      ? window.gZenWorkspaces.allStoredTabs
      : Array.from(gBrowser.tabs);

    for (const tab of tabs) {
      // Some tabs might be placeholders or internal, linkedBrowser can be null.
      if (!tab.linkedBrowser) {
        continue;
      }

      // Skip the empty new tab placeholder used by Zen.
      if (tab.hasAttribute("zen-empty-tab")) {
        continue;
      }

      commands.push({
        key: `switch-tab:${tab.linkedBrowser.outerWindowID}-${tab.linkedBrowser.tabId}`,
        label: `Switch to Tab: ${tab.label}`,
        command: () => {
          if (window.gZenWorkspaces?.workspaceEnabled) {
            // This function handles switching workspace if necessary.
            window.gZenWorkspaces.switchTabIfNeeded(tab);
          } else {
            gBrowser.selectedTab = tab;
          }
        },
        condition: () => gBrowser.selectedTab !== tab,
        icon: tab.image || "chrome://browser/skin/zen-icons/tab.svg",
        tags: ["tab", "switch", "active", tab.label.toLowerCase()],
      });
    }
    return commands;
  }

  /**
   * Generates commands for switching between Zen Workspaces.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of workspace commands.
   */
  async function generateWorkspaceCommands() {
    if (!window.gZenWorkspaces?.workspaceEnabled) return [];
    const workspacesData = await window.gZenWorkspaces._workspaces();
    if (!workspacesData || !workspacesData.workspaces) return [];

    return workspacesData.workspaces.map((workspace) => {
      const icon = window.gZenWorkspaces.getWorkspaceIcon(workspace);
      let iconUrl = "chrome://browser/skin/zen-icons/workspace.svg"; // Default icon

      if (icon) {
        if (icon.endsWith(".svg")) {
          iconUrl = icon;
        } else {
          iconUrl = textToSvgDataUrl(icon);
        }
      }
      return {
        key: `workspace:${workspace.uuid}`,
        label: `Switch to workspace: ${workspace.name}`,
        command: () => window.gZenWorkspaces.changeWorkspaceWithID(workspace.uuid),
        condition: () => workspace.uuid !== window.gZenWorkspaces.activeWorkspace,
        icon: iconUrl,
        tags: ["workspace", "switch", workspace.name.toLowerCase()],
      };
    });
  }

  /**
   * Generates commands for installing and uninstalling Sine mods.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of Sine mod commands.
   */
  async function generateSineCommands() {
    // SineAPI is required for both installing and uninstalling.
    if (!window.SineAPI) {
      debugLog("SineAPI not found, skipping Sine command generation.");
      return [];
    }

    const commands = [];
    const installedMods = await SineAPI.utils.getMods();

    // Generate "Install" commands. This requires the main `Sine` object to be available.
    if (window.Sine?.marketplace) {
      const marketplaceMods = window.Sine.marketplace;
      for (const modId in marketplaceMods) {
        if (!installedMods[modId]) {
          const mod = marketplaceMods[modId];
          commands.push({
            key: `sine:install:${modId}`,
            label: `Install Sine Mod: ${mod.name}`,
            command: () => Sine.installMod(mod.homepage),
            icon: svgToUrl(icons.sine),
            tags: ["sine", "install", "mod", mod.name.toLowerCase()],
          });
        }
      }
    } else {
      console.log(
        "zen-command-palette: Global Sine object not found. 'Install' commands will be unavailable."
      );
    }

    // Generate "Uninstall" commands for installed mods.
    for (const modId in installedMods) {
      const mod = installedMods[modId];
      commands.push({
        key: `sine:uninstall:${modId}`,
        label: `Uninstall Sine Mod: ${mod.name}`,
        command: () => {
          if (window.confirm(`Are you sure you want to remove the Sine mod "${mod.name}"?`)) {
            SineAPI.manager.removeMod(mod.id).then(() => {
              SineAPI.manager.rebuildMods();
              if (mod.js) {
                ucAPI.showToast([
                  `"${mod.name}" has been removed.`,
                  "A restart is recommended to fully unload its scripts.",
                ]);
              }
            });
          }
        },
        icon: svgToUrl(icons.sine),
        tags: ["sine", "uninstall", "mod", mod.name.toLowerCase()],
      });
    }

    return commands;
  }

  /**
   * Generates commands related to Zen Folders, like deleting or moving tabs to them.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of folder-related commands.
   */
  async function generateFolderCommands() {
    if (!window.gZenFolders) return [];

    const commands = [];
    const folders = Array.from(gBrowser.tabContainer.querySelectorAll("zen-folder"));
    if (!folders.length) return [];

    // --- Generate "Delete Folder" commands ---
    folders.forEach((folder) => {
      commands.push({
        key: `folder-delete:${folder.id}`,
        label: `Delete Folder: ${folder.label}`,
        command: () => {
          if (
            confirm(
              `Are you sure you want to delete the folder "${folder.label}" and all its tabs? This cannot be undone.`
            )
          ) {
            folder.delete();
          }
        },
        icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
        tags: ["folder", "delete", "remove", folder.label.toLowerCase()],
      });
    });

    // --- Generate "Move Active Tab to Folder" commands ---
    const activeTab = gBrowser.selectedTab;
    // Only generate these commands if there is an active, non-essential tab to move.
    if (activeTab && !activeTab.hasAttribute("zen-essential")) {
      folders.forEach((folder) => {
        // Don't show option to move a tab to its current folder.
        if (activeTab.group === folder) {
          return;
        }

        commands.push({
          key: `folder-move-active-to:${folder.id}`,
          label: `Move Tab to Folder: ${folder.label}`,
          command: () => {
            const tabToMove = gBrowser.selectedTab;
            if (!tabToMove) return;
            const targetFolder = document.getElementById(folder.id);
            if (!targetFolder) return;

            const targetWorkspaceId = targetFolder.getAttribute("zen-workspace-id");
            const currentWorkspaceId =
              tabToMove.getAttribute("zen-workspace-id") || gZenWorkspaces.activeWorkspace;

            if (currentWorkspaceId !== targetWorkspaceId) {
              gZenWorkspaces.moveTabToWorkspace(tabToMove, targetWorkspaceId);
            }

            if (!tabToMove.pinned) {
              gBrowser.pinTab(tabToMove);
            }
            targetFolder.addTabs([tabToMove]);

            if (gZenWorkspaces.activeWorkspace !== targetWorkspaceId) {
              gZenWorkspaces._lastSelectedWorkspaceTabs[targetWorkspaceId] = tabToMove;
              gZenWorkspaces.changeWorkspaceWithID(targetWorkspaceId);
            } else {
              gBrowser.selectedTab = tabToMove;
            }
          },
          condition: () => {
            const currentTab = gBrowser.selectedTab;
            return (
              currentTab && !currentTab.hasAttribute("zen-essential") && currentTab.group !== folder
            );
          },
          icon: "chrome://browser/skin/zen-icons/move-tab.svg",
          tags: ["folder", "move", "tab", folder.label.toLowerCase()],
        });
      });
    }

    return commands;
  }

  /**
   * Generates commands for moving the active tab to a different workspace.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of workspace-move commands.
   */
  async function generateWorkspaceMoveCommands() {
    if (!window.gZenWorkspaces?.workspaceEnabled) return [];

    const commands = [];
    const workspacesData = await window.gZenWorkspaces._workspaces();
    if (!workspacesData || !workspacesData.workspaces) return [];

    const activeTab = gBrowser.selectedTab;
    if (activeTab && !activeTab.hasAttribute("zen-essential")) {
      workspacesData.workspaces.forEach((workspace) => {
        if (activeTab.getAttribute("zen-workspace-id") === workspace.uuid) {
          return;
        }

        commands.push({
          key: `workspace-move-active-to:${workspace.uuid}`,
          label: `Move Tab to Workspace: ${workspace.name}`,
          command: () => {
            const tabToMove = gBrowser.selectedTab;
            if (tabToMove) {
              gZenWorkspaces.moveTabToWorkspace(tabToMove, workspace.uuid);
              gZenWorkspaces._lastSelectedWorkspaceTabs[workspace.uuid] = tabToMove;
              gZenWorkspaces.changeWorkspaceWithID(workspace.uuid);
            }
          },
          condition: () => {
            const currentTab = gBrowser.selectedTab;
            return (
              currentTab &&
              !currentTab.hasAttribute("zen-essential") &&
              currentTab.getAttribute("zen-workspace-id") !== workspace.uuid
            );
          },
          icon: "chrome://browser/skin/zen-icons/move-tab.svg",
          tags: ["workspace", "move", "tab", workspace.name.toLowerCase()],
        });
      });
    }

    return commands;
  }

  const DEFAULTS = {
    hiddenCommands: [],
    customIcons: {},
    customShortcuts: {},
    toolbarButtons: [],
  };

  let _settings = null;

  const Storage = {
    _getFilePath() {
      const relativePath = Prefs.commandSettingsFile;
      if (!relativePath) {
        debugError("Settings file path preference is not set.");
        return null;
      }
      try {
        const profileDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        const file = profileDir.clone();
        // Handle both forward and backslashes in the path
        const pathParts = relativePath.split(/[/\\]/);
        for (const part of pathParts) {
          if (part) file.append(part);
        }
        return file.path;
      } catch (e) {
        debugError("Could not construct file path:", e);
        return null;
      }
    },

    async loadSettings() {
      if (_settings) return _settings;

      const path = this._getFilePath();
      if (!path) {
        _settings = { ...DEFAULTS };
        return _settings;
      }

      try {
        if (await IOUtils.exists(path)) {
          const content = await IOUtils.readJSON(path);
          _settings = { ...DEFAULTS, ...content };
          debugLog("Command palette settings loaded from", path);
        } else {
          debugLog("No settings file found at", path, ". Using defaults.");
          _settings = { ...DEFAULTS };
        }
      } catch (e) {
        debugError("Error loading command palette settings:", e);
        _settings = { ...DEFAULTS };
      }
      return _settings;
    },

    async saveSettings(newSettings) {
      const path = this._getFilePath();
      if (!path) {
        debugError("Settings file path preference is not set. Cannot save.");
        return;
      }

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(newSettings, null, 2));
        await IOUtils.write(path, data, { tmpPath: path + ".tmp" });

        _settings = newSettings;
        debugLog("Command palette settings saved to", path);
      } catch (e) {
        debugError("Error saving command palette settings:", e);
      }
    },

    getSettings() {
      return _settings || DEFAULTS;
    },

    reset() {
      _settings = null;
    },
  };

  const parseElement = (elementString, type = "html") => {
    if (type === "xul") {
      return window.MozXULElement.parseXULToFragment(elementString).firstChild;
    }

    let element = new DOMParser().parseFromString(elementString, "text/html");
    if (element.body.children.length) element = element.body.firstChild;
    else element = element.head.firstChild;
    return element;
  };

  const escapeXmlAttribute = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const SettingsModal = {
    _modalElement: null,
    _mainModule: null,
    _currentSettings: {},
    _initialSettingsState: null,
    _currentShortcutTarget: null,
    _boundHandleShortcutKeyDown: null,
    _boundCloseOnEscape: null,

    init(mainModule) {
      this._mainModule = mainModule;
      this._boundHandleShortcutKeyDown = this._handleShortcutKeyDown.bind(this);
      this._boundCloseOnEscape = this._closeOnEscape.bind(this);
    },

    async show(tabId = "commands") {
      if (this._modalElement) {
        this.hide();
      }

      this._currentSettings = await Storage.loadSettings();
      this._initialSettingsState = JSON.stringify(this._currentSettings);

      this._modalElement = this._generateHtml();
      document.documentElement.appendChild(this._modalElement);

      this._populateCommandsTab();
      this._populateSettingsTab();
      this._attachEventListeners();

      window.addEventListener("keydown", this._boundCloseOnEscape);

      this.switchTab(tabId);
    },

    hide() {
      if (this._modalElement) {
        this._modalElement.remove();
        this._modalElement = null;
      }
      window.removeEventListener("keydown", this._boundHandleShortcutKeyDown, true);
      window.removeEventListener("keydown", this._boundCloseOnEscape);
      this._currentShortcutTarget = null;
    },

    _closeOnEscape(event) {
      if (event.key === "Escape") {
        this.hide();
      }
    },

    _sanitizeForId(str) {
      return str.replace(/[^a-zA-Z0-9-_]/g, "-");
    },

    switchTab(tabId) {
      const modal = this._modalElement;
      modal.querySelectorAll(".cmd-settings-tab-content").forEach((el) => (el.hidden = true));
      modal.querySelectorAll(".cmd-settings-tab").forEach((el) => el.classList.remove("active"));

      modal.querySelector(`#${tabId}-tab-content`).hidden = false;
      modal.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
    },

    async saveSettings() {
      // Collect settings from UI
      const newSettings = {
        hiddenCommands: [],
        customIcons: { ...this._currentSettings.customIcons },
        customShortcuts: { ...this._currentSettings.customShortcuts },
        toolbarButtons: [...(this._currentSettings.toolbarButtons || [])],
      };

      // Commands tab
      this._modalElement.querySelectorAll(".command-item").forEach((item) => {
        const key = item.dataset.key;
        const visibilityToggle = item.querySelector(".visibility-toggle");
        if (visibilityToggle && !visibilityToggle.checked) {
          newSettings.hiddenCommands.push(key);
        }
      });

      // Preferences tab
      this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
        const prefKey = control.dataset.pref;
        let value;
        if (control.type === "checkbox") {
          value = control.checked;
        } else if (control.type === "number") {
          value = Number(control.value);
        } else {
          value = control.value;
        }
        Prefs.setPref(prefKey, value);
      });

      const somethingChanged = JSON.stringify(newSettings) !== this._initialSettingsState;

      if (somethingChanged) {
        await Storage.saveSettings(newSettings);
        await this._mainModule.loadUserConfig();
      }

      this.hide();

      const shortcutsChanged =
        JSON.stringify(JSON.parse(this._initialSettingsState).customShortcuts) !==
        JSON.stringify(newSettings.customShortcuts);
      const toolbarButtonsChanged =
        JSON.stringify(JSON.parse(this._initialSettingsState).toolbarButtons) !==
        JSON.stringify(newSettings.toolbarButtons);

      if (shortcutsChanged || toolbarButtonsChanged) {
        let changedItem = shortcutsChanged
          ? toolbarButtonsChanged
            ? "Shortcuts and Toolbar buttons"
            : "Shortcuts"
          : "Toolbar buttons";

        // TODO: Figure out how to apply changes real time (without restart)
        if (window.ucAPI && typeof window.ucAPI.showToast === "function") {
          window.ucAPI.showToast(
            [`${changedItem} Changed`, "A restart is required for changes to take effect."],
            1 // Restart preset
          );
        } else {
          alert(
            "Settings changed. Please restart Zen for shortcut or toolbar changes to take effect."
          );
        }
      }
    },

    _attachEventListeners() {
      const modal = this._modalElement;
      modal.querySelector("#cmd-settings-close").addEventListener("click", () => this.hide());
      modal.querySelector("#cmd-settings-save").addEventListener("click", () => this.saveSettings());
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hide();
      });

      // Tab switching
      modal.querySelectorAll(".cmd-settings-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab));
      });

      // Commands tab search
      modal
        .querySelector("#command-search-input")
        .addEventListener("input", (e) => this._filterCommands(e.target.value));

      // Help tab links
      modal.querySelectorAll(".link-button").forEach((button) => {
        button.addEventListener("click", (e) => {
          const url = e.currentTarget.dataset.url;
          if (url) {
            openTrustedLinkIn(url, "tab");
            this.hide();
          }
        });
      });
    },

    _filterCommands(query) {
      const lowerQuery = query.toLowerCase().trim();
      const commandList = this._modalElement.querySelector("#commands-list");

      // Filter individual items
      commandList.querySelectorAll(".command-item").forEach((item) => {
        const label = (item.querySelector(".command-label")?.textContent || "").toLowerCase();
        const key = (item.dataset.key || "").toLowerCase();
        item.hidden = !(label.includes(lowerQuery) || key.includes(lowerQuery));
      });

      // Hide/show group headers based on visible children
      commandList.querySelectorAll(".commands-group").forEach((group) => {
        const header = group.querySelector(".commands-group-header");
        if (header) {
          const hasVisibleItems = !!group.querySelector(".command-item:not([hidden])");
          header.hidden = !hasVisibleItems;
        }
      });
    },

    async _populateCommandsTab() {
      const container = this._modalElement.querySelector("#commands-list");
      container.innerHTML = "";

      const allCommands = await this._mainModule.getAllCommandsForConfig();

      const staticCmds = allCommands
        .filter((c) => !c.isDynamic)
        .sort((a, b) => a.label.localeCompare(b.label));

      if (staticCmds.length > 0) {
        const groupWrapper = parseElement('<div class="commands-group static-commands"></div>');
        staticCmds.forEach((cmd) => this._renderCommand(groupWrapper, cmd));
        container.appendChild(groupWrapper);
      }

      const dynamicGroups = {};
      allCommands.forEach((cmd) => {
        if (cmd.isDynamic) {
          if (!dynamicGroups[cmd.providerLabel]) {
            dynamicGroups[cmd.providerLabel] = {
              pref: cmd.providerPref,
              commands: [],
            };
          }
          dynamicGroups[cmd.providerLabel].commands.push(cmd);
        }
      });

      for (const label in dynamicGroups) {
        const group = dynamicGroups[label];
        if (group.pref && !Prefs.getPref(group.pref)) {
          continue;
        }
        const configurableCommands = group.commands.filter(
          (c) => c.allowIcons !== false || c.allowShortcuts !== false
        );

        if (configurableCommands.length > 0) {
          const groupWrapper = parseElement('<div class="commands-group dynamic-commands"></div>');

          const headerHtml = `
          <div class="commands-group-header">
            <h4>${escapeXmlAttribute(label)}</h4>
          </div>
        `;
          groupWrapper.appendChild(parseElement(headerHtml));

          configurableCommands
            .sort((a, b) => a.label.localeCompare(b.label))
            .forEach((cmd) => this._renderCommand(groupWrapper, cmd));
          container.appendChild(groupWrapper);
        }
      }
    },

    _renderCommand(container, cmd) {
      const isHidden = this._currentSettings.hiddenCommands.includes(cmd.key);
      const customIcon = this._currentSettings.customIcons[cmd.key];
      const customShortcut = this._currentSettings.customShortcuts[cmd.key];
      const nativeShortcut = this._mainModule.getShortcutForCommand(cmd.key);
      const allowIcons = cmd.allowIcons !== false;
      const allowShortcuts = cmd.allowShortcuts !== false;
      const isToolbarButton = this._currentSettings.toolbarButtons?.includes(cmd.key);

      const shortcutInputHtml = allowShortcuts
        ? `<input type="text" class="shortcut-input" placeholder="Set Shortcut" value="${escapeXmlAttribute(
          customShortcut || nativeShortcut || ""
        )}" readonly />`
        : "";
      const visibilityToggleHtml = !cmd.isDynamic
        ? `<input type="checkbox" class="visibility-toggle" title="Show/Hide Command" ${
          !isHidden ? "checked" : ""
        } />`
        : "";
      const toolbarButtonHtml = allowShortcuts
        ? `<button class="toolbar-button-toggle ${isToolbarButton ? "active" : ""}" title="${
          isToolbarButton ? "Remove from Toolbar" : "Add to Toolbar"
        }">${icons.pin}</button>`
        : "";

      const itemHtml = `
      <div class="command-item" data-key="${escapeXmlAttribute(cmd.key)}">
        <img src="${escapeXmlAttribute(
          customIcon || cmd.icon || "chrome://browser/skin/trending.svg"
        )}" class="command-icon ${allowIcons ? "editable" : ""}" />
        <span class="command-label">${escapeXmlAttribute(cmd.label)}</span>
        <div class="command-controls">
            ${shortcutInputHtml}
            ${toolbarButtonHtml}
            ${visibilityToggleHtml}
        </div>
      </div>
    `;
      const item = parseElement(itemHtml);
      container.appendChild(item);

      if (allowIcons) {
        item.querySelector(".command-icon").addEventListener("click", (e) => {
          const newIcon = prompt("Enter new icon URL:", e.target.src);
          if (newIcon !== null) {
            e.target.src = newIcon;
            this._currentSettings.customIcons[cmd.key] = newIcon;
          }
        });
      }

      if (allowShortcuts) {
        const shortcutInput = item.querySelector(".shortcut-input");
        shortcutInput.addEventListener("focus", (e) => {
          this._currentShortcutTarget = e.target;
          e.target.value = "Press keys...";
          window.addEventListener("keydown", this._boundHandleShortcutKeyDown, true);
        });
        shortcutInput.addEventListener("blur", () => {
          if (this._currentShortcutTarget) {
            this._currentShortcutTarget.value =
              this._currentSettings.customShortcuts[cmd.key] || nativeShortcut || "";
            this._currentShortcutTarget = null;
          }
          window.removeEventListener("keydown", this._boundHandleShortcutKeyDown, true);
        });

        const toolbarToggle = item.querySelector(".toolbar-button-toggle");
        toolbarToggle.addEventListener("click", (e) => {
          const button = e.currentTarget;
          const commandKey = cmd.key;
          if (!this._currentSettings.toolbarButtons) {
            this._currentSettings.toolbarButtons = [];
          }
          const index = this._currentSettings.toolbarButtons.indexOf(commandKey);
          if (index > -1) {
            this._currentSettings.toolbarButtons.splice(index, 1);
            button.classList.remove("active");
            button.title = "Add to Toolbar";
          } else {
            this._currentSettings.toolbarButtons.push(commandKey);
            button.classList.add("active");
            button.title = "Remove from Toolbar";
          }
        });
      }
    },

    _handleShortcutKeyDown(event) {
      if (!this._currentShortcutTarget) return;

      event.preventDefault();
      event.stopPropagation();

      const key = event.key;
      const targetInput = this._currentShortcutTarget;
      const commandKey = targetInput.closest(".command-item").dataset.key;

      if (key === "Escape") {
        targetInput.blur();
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        targetInput.value = "";
        delete this._currentSettings.customShortcuts[commandKey];
        targetInput.blur();
        return;
      }

      let shortcutString = "";
      if (event.ctrlKey) shortcutString += "Ctrl+";
      if (event.altKey) shortcutString += "Alt+";
      if (event.shiftKey) shortcutString += "Shift+";
      if (event.metaKey) shortcutString += "Meta+";

      // Avoid adding modifier keys themselves as the shortcut
      if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
        shortcutString += key.toUpperCase();
      }

      targetInput.value = shortcutString;
      this._currentSettings.customShortcuts[commandKey] = shortcutString;
    },

    _populateSettingsTab() {
      const container = this._modalElement.querySelector("#settings-tab-content");
      const prefs = [
        {
          section: "General",
          items: [
            {
              key: Prefs.KEYS.PREFIX_REQUIRED,
              label: "Require ':' prefix to activate",
              type: "bool",
            },
            {
              key: Prefs.KEYS.MIN_QUERY_LENGTH,
              label: "Min query length (no prefix)",
              type: "number",
            },
            { key: Prefs.KEYS.MAX_COMMANDS, label: "Max results (no prefix)", type: "number" },
            {
              key: Prefs.KEYS.MAX_COMMANDS_PREFIX,
              label: "Max results (with prefix)",
              type: "number",
            },
            { key: Prefs.KEYS.MIN_SCORE_THRESHOLD, label: "Min relevance score", type: "number" },
            { key: Prefs.KEYS.DEBUG_MODE, label: "Enable debug logging", type: "bool" },
          ],
        },
        {
          section: "Dynamic Commands",
          items: [
            {
              key: Prefs.KEYS.DYNAMIC_ABOUT_PAGES,
              label: "Generate commands for about: pages",
              type: "bool",
            },
            {
              key: Prefs.KEYS.DYNAMIC_SEARCH_ENGINES,
              label: "Generate commands for search engines",
              type: "bool",
            },
            {
              key: Prefs.KEYS.DYNAMIC_EXTENSIONS,
              label: "Generate commands for extension options",
              type: "bool",
            },
            {
              key: Prefs.KEYS.DYNAMIC_WORKSPACES,
              label: "Generate commands for workspaces",
              type: "bool",
            },
            {
              key: Prefs.KEYS.DYNAMIC_SINE_MODS,
              label: "Generate commands for Sine mods",
              type: "bool",
            },
            { key: Prefs.KEYS.DYNAMIC_FOLDERS, label: "Generate commands for folders", type: "bool" },
            {
              key: Prefs.KEYS.DYNAMIC_CONTAINER_TABS,
              label: "Generate commands for container tabs",
              type: "bool",
            },
            {
              key: Prefs.KEYS.DYNAMIC_ACTIVE_TABS,
              label: "Generate commands for active tabs",
              type: "bool",
            },
          ],
        },
      ];

      for (const prefSection of prefs) {
        const sectionEl = document.createElement("section");
        sectionEl.className = "settings-section";
        sectionEl.innerHTML = `<h4>${escapeXmlAttribute(prefSection.section)}</h4>`;
        for (const item of prefSection.items) {
          const currentValue = Prefs.getPref(item.key);
          const safeId = this._sanitizeForId(`pref-${item.key}`);
          let itemHtml;

          if (item.type === "bool") {
            itemHtml = `
            <div class="setting-item">
              <label for="${safeId}">${escapeXmlAttribute(item.label)}</label>
              <input type="checkbox" id="${safeId}" data-pref="${item.key}" ${
                currentValue ? "checked" : ""
              } />
            </div>
          `;
          } else if (item.type === "number") {
            itemHtml = `
            <div class="setting-item">
              <label for="${safeId}">${escapeXmlAttribute(item.label)}</label>
              <input type="number" id="${safeId}" data-pref="${item.key}" value="${escapeXmlAttribute(
                currentValue
              )}" />
            </div>
          `;
          }
          if (itemHtml) {
            sectionEl.appendChild(parseElement(itemHtml));
          }
        }
        container.appendChild(sectionEl);
      }
    },

    _generateHtml() {
      const html = `
      <div id="zen-cmd-settings-modal-overlay">
        <div class="command-palette-settings-modal">
          <div class="cmd-settings-header">
            <h3>Command Palette Settings</h3>
            <div>
              <button id="cmd-settings-close" class="settings-close-btn">Close</button>
              <button id="cmd-settings-save" class="settings-save-btn">Save Settings</button>
            </div>
          </div>
          <div class="cmd-settings-tabs">
            <button class="cmd-settings-tab" data-tab="commands">Commands</button>
            <button class="cmd-settings-tab" data-tab="settings">Settings</button>
            <button class="cmd-settings-tab" data-tab="help">Help</button>
          </div>
          <div class="cmd-settings-content">
            <div id="commands-tab-content" class="cmd-settings-tab-content" hidden>
              <div class="search-bar-wrapper">
                <input type="text" id="command-search-input" placeholder="Search commands..." />
              </div>
              <p class="restart-note">Changes to keyboard shortcuts or toolbar buttons require a browser restart to take effect.</p>
              <div id="commands-list"></div>
            </div>
            <div id="settings-tab-content" class="cmd-settings-tab-content" hidden>
              <!-- Content will be populated by _populateSettingsTab -->
            </div>
            <div id="help-tab-content" class="cmd-settings-tab-content" hidden>
              <section class="settings-section">
                <h4>Under Construction</h4>
                <p>This settings panel is currently under construction. More features and customizations will be added in the future.</p>
              </section>
              <section class="settings-section">
                <h4>Custom Icons</h4>
                <p>To use custom SVG icons, they must be converted to a Base64 data URL first. You can use an online tool for this.</p>
                <button class="link-button" data-url="https://svgencoder.com/">Open SVG Encoder</button>
              </section>
              <section class="settings-section">
                <h4>Documentation</h4>
                <p>For detailed information on how to use and configure the Command Palette, please refer to the official documentation.</p>
                <button class="link-button" data-url="https://github.com/BibekBhusal0/zen-custom-js/tree/main/command-palette">View Documentation on GitHub</button>
              </section>
              <section class="settings-section">
                <h4>Report a Bug</h4>
                <p>If you encounter any issues or have a feature request, please open an issue on our GitHub repository.</p>
                <button class="link-button" data-url="https://github.com/BibekBhusal0/zen-custom-js/issues/new">Open a New Issue</button>
              </section>
            </div>
          </div>
        </div>
      </div>
    `;
      return parseElement(html);
    },
  };

  const ZenCommandPalette$1 = {
    /**
     * An array of dynamic command providers. Each provider is an object
     * containing a function to generate commands and an optional preference for enabling/disabling.
     * If `pref` is null, the commands will always be included.
     * If `pref` is a string, commands will only be included if the corresponding value in `Prefs` is true.
     * @type {Array<{func: Function, pref: string|null}>}
     */
    _dynamicCommandProviders: [
      {
        func: generateAboutPageCommands,
        pref: Prefs.KEYS.DYNAMIC_ABOUT_PAGES,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateSearchEngineCommands,
        pref: Prefs.KEYS.DYNAMIC_SEARCH_ENGINES,
        allowIcons: false,
        allowShortcuts: false,
      },
      {
        func: generateExtensionCommands,
        pref: Prefs.KEYS.DYNAMIC_EXTENSIONS,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateWorkspaceCommands,
        pref: Prefs.KEYS.DYNAMIC_WORKSPACES,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateWorkspaceMoveCommands,
        pref: Prefs.KEYS.DYNAMIC_WORKSPACES,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateSineCommands,
        pref: Prefs.KEYS.DYNAMIC_SINE_MODS,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateFolderCommands,
        pref: Prefs.KEYS.DYNAMIC_FOLDERS,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateContainerTabCommands,
        pref: Prefs.KEYS.DYNAMIC_CONTAINER_TABS,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateActiveTabCommands,
        pref: Prefs.KEYS.DYNAMIC_ACTIVE_TABS,
        allowIcons: false,
        allowShortcuts: false,
      },
    ],
    staticCommands: commands,
    provider: null,
    Settings: null,
    _recentCommands: [],
    MAX_RECENT_COMMANDS: 20,
    _userConfig: {},
    _scrollObserver: null,
    _boundHandleKeysetCommand: null,

    safeStr(x) {
      return (x || "").toString();
    },

    _closeUrlBar() {
      try {
        gURLBar.value = "";
        if (window.gZenUIManager && typeof window.gZenUIManager.handleUrlbarClose === "function") {
          window.gZenUIManager.handleUrlbarClose(false, false);
          return;
        }

        gURLBar.selectionStart = gURLBar.selectionEnd = 0;
        gURLBar.blur();

        if (gURLBar.view.isOpen) {
          gURLBar.view.close();
        }
      } catch (e) {
        debugError("Error in _closeUrlBar", e);
      }
    },

    /**
     * Adds a command to the list of recently used commands.
     * @param {object} cmd - The command object that was executed.
     */
    addRecentCommand(cmd) {
      if (!cmd || !cmd.key) return;

      // Remove if it already exists to move it to the front.
      const existingIndex = this._recentCommands.indexOf(cmd.key);
      if (existingIndex > -1) {
        this._recentCommands.splice(existingIndex, 1);
      }

      // Add to the front of the list.
      this._recentCommands.unshift(cmd.key);

      // Trim the list to the maximum allowed size.
      if (this._recentCommands.length > this.MAX_RECENT_COMMANDS) {
        this._recentCommands.length = this.MAX_RECENT_COMMANDS;
      }
    },

    /**
     * Checks if a command should be visible based on its `condition` property
     * and the state of its corresponding native <command> element.
     * @param {object} cmd - The command object to check.
     * @returns {boolean} True if the command should be visible, otherwise false.
     */
    commandIsVisible(cmd) {
      try {
        if (this._userConfig.hiddenCommands?.includes(cmd.key)) {
          return false;
        }
        let isVisible = true;

        // First, evaluate an explicit `condition` if it exists.
        if (typeof cmd.condition === "function") {
          isVisible = !!cmd.condition();
        } else if (cmd.condition !== undefined) {
          isVisible = cmd.condition !== false;
        }

        // If the command relies on a native <command> element (has no custom function),
        // its visibility is also determined by the element's state.
        if (isVisible && !cmd.command) {
          const commandEl = document.getElementById(cmd.key);
          // The command is only visible if its element exists and is not disabled.
          if (!commandEl || commandEl.disabled) {
            isVisible = false;
          }
        }

        return isVisible;
      } catch (e) {
        debugError("Error evaluating condition for", cmd && cmd.key, e);
        return false;
      }
    },

    /**
     * A VS Code-style fuzzy scoring algorithm.
     * @param {string} target The string to score against.
     * @param {string} query The user's search query.
     * @returns {number} A score representing the match quality.
     */
    calculateFuzzyScore(target, query) {
      if (!target || !query) return 0;

      const targetLower = target.toLowerCase();
      const queryLower = query.toLowerCase();
      const targetLen = target.length;
      const queryLen = query.length;

      if (queryLen > targetLen) return 0;
      if (queryLen === 0) return 0;

      // 1. Exact match gets the highest score.
      if (targetLower === queryLower) {
        return 200;
      }

      // 2. Exact prefix matches are heavily prioritized.
      if (targetLower.startsWith(queryLower)) {
        return 100 + queryLen;
      }

      // 3. Exact abbreviation (e.g., 'tcm' for 'Toggle Compact Mode')
      const initials = targetLower
        .split(/[\s-_]+/)
        .map((word) => word[0])
        .join("");
      if (initials === queryLower) {
        return 90 + queryLen;
      }

      let score = 0;
      let queryIndex = 0;
      let lastMatchIndex = -1;
      let consecutiveMatches = 0;

      for (let targetIndex = 0; targetIndex < targetLen; targetIndex++) {
        if (queryIndex < queryLen && targetLower[targetIndex] === queryLower[queryIndex]) {
          let bonus = 10;

          // Bonus for matching at the beginning of a word
          if (targetIndex === 0 || [" ", "-", "_"].includes(targetLower[targetIndex - 1])) {
            bonus += 15;
          }

          // Bonus for consecutive matches
          if (lastMatchIndex === targetIndex - 1) {
            consecutiveMatches++;
            bonus += 20 * consecutiveMatches;
          } else {
            consecutiveMatches = 0;
          }

          // Penalty for distance from the last match
          if (lastMatchIndex !== -1) {
            const distance = targetIndex - lastMatchIndex;
            bonus -= Math.min(distance - 1, 10); // Cap penalty
          }

          score += bonus;
          lastMatchIndex = targetIndex;
          queryIndex++;
        }
      }

      return queryIndex === queryLen ? score : 0;
    },

    /**
     * Generates a complete, up-to-date list of commands by combining static commands
     * with dynamically generated ones based on current preferences.
     * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
     */
    async generateLiveCommands() {
      let allCommands = [...commands];

      const commandPromises = [];
      for (const provider of this._dynamicCommandProviders) {
        const shouldLoad =
          provider.pref === null ? true : provider.pref ? Prefs.getPref(provider.pref) : false;
        if (shouldLoad) {
          commandPromises.push(provider.func());
        }
      }

      const commandSets = await Promise.all(commandPromises);
      allCommands.push(...commandSets.flat());

      // Apply custom icons from user config
      for (const cmd of allCommands) {
        if (this._userConfig.customIcons?.[cmd.key]) {
          cmd.icon = this._userConfig.customIcons[cmd.key];
        }
      }

      return allCommands;
    },

    _getProviderLabel(funcName) {
      return (
        funcName
          .replace("generate", "")
          .replace("Commands", "")
          .replace(/([A-Z])/g, " $1")
          .trim() + " Commands"
      );
    },

    /**
     * Generates a complete list of commands for configuration purposes,
     * applying user customizations but not visibility conditions.
     * @returns {Promise<Array<object>>} A promise that resolves to the full list of commands.
     */
    async getAllCommandsForConfig() {
      let liveCommands = [...commands.map((c) => ({ ...c, isDynamic: false }))];

      const commandPromises = [];
      for (const provider of this._dynamicCommandProviders) {
        const promise = provider.func().then((commands) => {
          return commands.map((cmd) => ({
            ...cmd,
            isDynamic: true,
            providerPref: provider.pref,
            providerLabel: this._getProviderLabel(provider.func.name),
            allowIcons: cmd.allowIcons ?? provider.allowIcons,
            allowShortcuts: cmd.allowShortcuts ?? provider.allowShortcuts,
          }));
        });
        commandPromises.push(promise);
      }

      const commandSets = await Promise.all(commandPromises);
      liveCommands.push(...commandSets.flat());

      // Apply custom icons
      for (const cmd of liveCommands) {
        if (this._userConfig.customIcons?.[cmd.key]) {
          cmd.icon = this._userConfig.customIcons[cmd.key];
        }
      }

      return liveCommands;
    },

    /**
     * Filters and sorts the command list using a fuzzy-matching algorithm.
     * @param {string} input - The user's search string from the URL bar.
     * @param {Array<object>} allCommands - The full list of commands to filter.
     * @returns {Array<object>} A sorted array of command objects that match the input.
     */
    filterCommandsByInput(input, allCommands) {
      let query = this.safeStr(input).trim();
      const isCommandPrefix = query.startsWith(":");
      if (isCommandPrefix) {
        query = query.substring(1).trim();
      }

      // If the input was just the prefix, show all available commands, unsorted.
      if (isCommandPrefix && !query) {
        const visible = allCommands.filter(this.commandIsVisible.bind(this));
        return visible;
      }

      // For non-prefixed queries, only show results if the query is long enough.
      if (!isCommandPrefix && query.length < Prefs.minQueryLength) {
        return [];
      }

      if (!query) {
        return [];
      }

      const lowerQuery = query.toLowerCase();

      const scoredCommands = allCommands
        .filter(this.commandIsVisible.bind(this))
        .map((cmd) => {
          const label = cmd.label || "";
          const key = cmd.key || "";
          const tags = (cmd.tags || []).join(" ");

          // Calculate scores for different fields
          const labelScore = this.calculateFuzzyScore(label, lowerQuery);
          const keyScore = this.calculateFuzzyScore(key, lowerQuery);
          const tagsScore = this.calculateFuzzyScore(tags, lowerQuery);

          // Add a bonus for recently used commands.
          let recencyBonus = 0;
          const recentIndex = this._recentCommands.indexOf(cmd.key);
          if (recentIndex > -1) {
            // More recent commands (lower index) get a higher bonus.
            recencyBonus = (this.MAX_RECENT_COMMANDS - recentIndex) * 5;
          }

          // Combine scores, giving label the highest weight, and add recency bonus.
          const score =
            Math.max(
              labelScore * 1.5, // Label is most important
              keyScore,
              tagsScore * 0.5 // Tags are least important
            ) + recencyBonus;

          return { cmd, score };
        })
        .filter((item) => item.score >= Prefs.minScoreThreshold);

      // Sort by score, descending
      scoredCommands.sort((a, b) => b.score - a.score);

      const finalCmds = scoredCommands.map((item) => item.cmd);

      // When using the prefix, show all results. Otherwise, cap at maxCommands.
      if (isCommandPrefix) {
        return finalCmds;
      }
      return finalCmds.slice(0, Prefs.maxCommands);
    },

    /**
     * Safely executes a command's action within a try-catch block.
     * @param {object} cmd - The command object to execute.
     */
    executeCommandObject(cmd) {
      if (!cmd) {
        debugError("executeCommandObject: no command");
        return;
      }

      this.addRecentCommand(cmd);

      try {
        // Prioritize explicit command function if it exists.
        if (cmd.command && typeof cmd.command === "function") {
          debugLog("Executing command via function:", cmd.key || cmd.label);
          const ret = cmd.command();
          if (ret && typeof ret.then === "function") {
            ret.catch((e) => debugError("Command promise rejected:", e));
          }
          return; // Execution handled.
        }

        // Fallback for commands that rely on a DOM element.
        const commandEl = document.getElementById(cmd.key);
        if (commandEl && typeof commandEl.doCommand === "function") {
          debugLog("Executing command via doCommand fallback:", cmd.key);
          commandEl.doCommand();
        } else {
          debugError("Command has no executable action:", cmd.key);
        }
      } catch (e) {
        debugError("Command execution error:", e);
      }
    },

    /**
     * Finds a command by its key and executes it.
     * @param {string} key - The key of the command to execute.
     */
    async executeCommandByKey(key) {
      if (!key) return;
      const allCommands = await this.generateLiveCommands();
      const cmd = allCommands.find((c) => c.key === key);
      if (cmd) {
        this.executeCommandObject(cmd);
      } else {
        debugError(`executeCommandByKey: Command with key "${key}" not found.`);
      }
    },

    /**
     * Finds the corresponding command object from a DOM element in the URL bar results.
     * @param {HTMLElement} row - The DOM element representing a result row.
     * @returns {object|null} The matched command object, or null if no match is found.
     */
    findCommandFromDomRow(row) {
      try {
        if (row?.result?._zenCmd) {
          return row.result._zenCmd;
        }
        return null;
      } catch (e) {
        debugError("findCommandFromDomRow error:", e);
        return null;
      }
    },

    /**
     * Retrieves the keyboard shortcut string for a given command key.
     * @param {string} commandKey - The key of the command (matches shortcut action or id).
     * @returns {string|null} The formatted shortcut string or null if not found.
     */
    getShortcutForCommand(commandKey) {
      // First, check for user-defined custom shortcuts
      if (this._userConfig.customShortcuts?.[commandKey]) {
        return this._userConfig.customShortcuts[commandKey];
      }

      // Then, check Zen's native shortcut manager
      if (
        !window.gZenKeyboardShortcutsManager ||
        !window.gZenKeyboardShortcutsManager._currentShortcutList
      ) {
        return null;
      }
      // A command's key can map to a shortcut's action OR its id.
      const shortcut = window.gZenKeyboardShortcutsManager._currentShortcutList.find(
        (s) => (s.getAction() === commandKey || s.getID() === commandKey) && !s.isEmpty()
      );
      return shortcut ? shortcut.toUserString() : null;
    },

    /**
     * Attaches 'click' and 'keydown' event listeners to the URL bar popup.
     * These listeners are responsible for executing commands and preventing default browser actions.
     */
    attachUrlbarSelectionListeners() {
      try {
        const popup =
          (typeof gURLBar !== "undefined" && gURLBar.view?.results) ||
          document.getElementById("urlbar-results");

        if (!popup) {
          debugError("Could not find urlbar popup element. Listeners not attached.");
          return;
        }

        const onPopupClick = (e) => {
          try {
            const row = e.target.closest(".urlbarView-row");
            if (!row) return;
            const cmd = this.findCommandFromDomRow(row);
            if (cmd) {
              debugLog("Executing command from click.");
              this._closeUrlBar();
              setTimeout(() => {
                this.executeCommandObject(cmd);
              }, 0);
              // Stop the browser's default action (e.g., performing a search) for this event.
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          } catch (ee) {
            debugError("onPopupClick error:", ee);
          }
        };

        const onUrlbarKeydown = (e) => {
          try {
            if (e.key !== "Enter" || e.defaultPrevented) return;

            const view = typeof gURLBar !== "undefined" && gURLBar.view;
            if (!view || !view.isOpen || view.selectedElementIndex < 0) return;

            if (!popup || !popup.children) {
              return;
            }
            const selectedRow = popup.children[view.selectedElementIndex];
            const cmd = this.findCommandFromDomRow(selectedRow);
            if (cmd) {
              debugLog("Executing command from Enter key.");
              this._closeUrlBar();
              setTimeout(() => {
                this.executeCommandObject(cmd);
              }, 0);
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          } catch (ee) {
            debugError("onUrlbarKeydown error:", ee);
          }
        };

        if (!popup._zenCmdListenersAttached) {
          popup.addEventListener("click", onPopupClick, true);
          gURLBar.inputField.addEventListener("keydown", onUrlbarKeydown, true);
          popup._zenCmdListenersAttached = true;
          debugLog("URL bar selection listeners attached.");
        }
      } catch (e) {
        debugError("attachUrlbarSelectionListeners setup error:", e);
      }
    },

    initScrollHandling() {
      if (location.href !== "chrome://browser/content/browser.xhtml" || this._scrollObserver) {
        return;
      }
      debugLog("Initializing scroll handling for command palette...");

      const SCROLLABLE_CLASS = "zen-command-scrollable";
      const urlbar = document.getElementById("urlbar");
      const results = document.getElementById("urlbar-results");

      let isHandlingMutations = false;
      const observer = new MutationObserver(() => {
        if (isHandlingMutations) return;
        isHandlingMutations = true;

        // Handle shortcut attributes
        for (const row of results.querySelectorAll(".urlbarView-row")) {
          const shortcut = row.result?._zenShortcut;
          if (shortcut !== (row.dataset.zenShortcut || null)) {
            if (shortcut) {
              row.dataset.zenShortcut = shortcut;
            } else {
              delete row.dataset.zenShortcut;
            }
          }
        }

        // Handle scrolling
        const selectedRow = results.querySelector(".urlbarView-row[selected]");
        if (selectedRow) {
          selectedRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        // Handle container class
        const isPrefixModeActive = this.provider?._isInPrefixMode ?? false;
        results.classList.toggle(SCROLLABLE_CLASS, urlbar.hasAttribute("open") && isPrefixModeActive);

        // Use a microtask to reset the flag after the current mutation processing is complete.
        queueMicrotask(() => {
          isHandlingMutations = false;
        });
      });

      observer.observe(results, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["selected", "open", "data-zen-shortcut"],
      });
      this._scrollObserver = observer;
      debugLog("Unified MutationObserver successfully initialized.");
    },

    attachUrlbarCloseListeners() {
      if (this._closeListenersAttached) {
        return;
      }

      const onUrlbarClose = () => {
        const isPrefixModeActive = ZenCommandPalette$1.provider?._isInPrefixMode ?? false;
        if (this.provider) {
          this.provider.dispose();
        }
        if (isPrefixModeActive) {
          gURLBar.value = "";
        }
      };

      gURLBar.inputField.addEventListener("blur", onUrlbarClose);
      gURLBar.view.panel.addEventListener("popuphiding", onUrlbarClose);
      this._closeListenersAttached = true;
      debugLog("URL bar close listeners attached.");
    },

    /**
     * Loads user customizations from the settings file.
     */
    async loadUserConfig() {
      Storage.reset();
      this._userConfig = await Storage.loadSettings();
      debugLog("User config loaded:", this._userConfig);
    },

    /**
     * Applies user-configured settings, such as custom shortcuts.
     */
    applyUserConfig() {
      this.applyCustomShortcuts();
      this.applyToolbarButtons();
    },

    /**
     * Parses a shortcut string (e.g., "Ctrl+Shift+K") into an object for a <key> element.
     * @param {string} str - The shortcut string.
     * @returns {{key: string|null, keycode: string|null, modifiers: string}}
     */
    _parseShortcutString(str) {
      const parts = str.split("+").map((p) => p.trim().toLowerCase());
      const keyPart = parts.pop();

      const modifiers = {
        accel: false,
        alt: false,
        shift: false,
        meta: false,
      };

      for (const part of parts) {
        switch (part) {
          case "ctrl":
          case "control":
            modifiers.accel = true;
            break;
          case "alt":
          case "option":
            modifiers.alt = true;
            break;
          case "shift":
            modifiers.shift = true;
            break;
          case "cmd":
          case "meta":
          case "win":
            modifiers.meta = true;
            break;
        }
      }

      // A rough mapping for special keys. Zen's `KEYCODE_MAP` is not exported.
      const KEYCODE_MAP = {
        f1: "VK_F1",
        f2: "VK_F2",
        f3: "VK_F3",
        f4: "VK_F4",
        f5: "VK_F5",
        f6: "VK_F6",
        f7: "VK_F7",
        f8: "VK_F8",
        f9: "VK_F9",
        f10: "VK_F10",
        f11: "VK_F11",
        f12: "VK_F12",
        enter: "VK_RETURN",
        escape: "VK_ESCAPE",
        delete: "VK_DELETE",
        backspace: "VK_BACK",
      };

      const keycode = KEYCODE_MAP[keyPart] || null;
      const key = keycode ? null : keyPart;

      return {
        key: key,
        keycode: keycode,
        modifiers: Object.entries(modifiers)
          .filter(([, val]) => val)
          .map(([mod]) => mod)
          .join(","),
      };
    },

    /**
     * Creates <key> elements for custom shortcuts and adds them to the document.
     */
    applyCustomShortcuts() {
      const KEYSET_ID = "zen-command-palette-keyset";
      let keyset = document.getElementById(KEYSET_ID);

      if (keyset && keyset._zenCmdListenerAttached) {
        keyset.removeEventListener("command", this._boundHandleKeysetCommand);
      } else if (!keyset) {
        keyset = document.createXULElement("keyset");
        keyset.id = KEYSET_ID;
        document.getElementById("mainKeyset").after(keyset);
      }

      keyset.replaceChildren();

      if (!this._userConfig.customShortcuts) return;

      for (const [commandKey, shortcutStr] of Object.entries(this._userConfig.customShortcuts)) {
        if (!shortcutStr) continue;

        const { key, keycode, modifiers } = this._parseShortcutString(shortcutStr);
        if (!key && !keycode) continue;

        const keyEl = document.createXULElement("key");
        keyEl.id = `zen-cmd-palette-shortcut-for-${commandKey}`;
        if (key) keyEl.setAttribute("key", key);
        if (keycode) keyEl.setAttribute("keycode", keycode);
        if (modifiers) keyEl.setAttribute("modifiers", modifiers);
        keyEl.setAttribute("data-command-key", commandKey);

        keyset.appendChild(keyEl);
      }

      keyset.addEventListener("command", this._boundHandleKeysetCommand);
      keyset._zenCmdListenerAttached = true;
      debugLog("Applied custom shortcuts.");
    },

    _handleKeysetCommand(event) {
      const commandKey = event.target.getAttribute("data-command-key");
      if (commandKey) {
        this.executeCommandByKey(commandKey);
      }
    },

    async applyToolbarButtons() {
      const WIDGET_PREFIX = "zen-cmd-palette-widget-";
      const allCommands = await this.getAllCommandsForConfig();

      // TODO: this is requiered for realtime changes
      // First, remove all widgets created by this mod to handle removals cleanly.

      if (!this._userConfig?.toolbarButtons) return;

      for (const key of this._userConfig.toolbarButtons) {
        const cmd = allCommands.find((c) => c.key === key);
        if (!cmd) continue;

        // Sanitize the command key to create a valid widget ID.
        const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
        const widgetId = `${WIDGET_PREFIX}${sanitizedKey}`;
        try {
          UC_API.Utils.createWidget({
            id: widgetId,
            type: "toolbarbutton",
            label: cmd.label,
            tooltip: cmd.label,
            class: "toolbarbutton-1 chromeclass-toolbar-additional",
            image: cmd.icon || "chrome://browser/skin/trending.svg",
            callback: () => this.executeCommandByKey(key),
          });
          debugLog(`Created widget for command: ${key}`);
        } catch (e) {
          if (!e.message.includes("widget with same id already exists")) {
            debugError(`Failed to create widget for ${key}:`, e);
          }
        }
      }
    },

    destroy() {
      if (this._scrollObserver) {
        this._scrollObserver.disconnect();
        this._scrollObserver = null;
        debugLog("MutationObserver disconnected for window.");
      }
    },

    /**
     * Initializes the command palette by creating and registering the UrlbarProvider.
     * This is the main entry point for the script.
     */
    async init() {
      this._boundHandleKeysetCommand = this._handleKeysetCommand.bind(this);

      this.Settings = SettingsModal;
      this.Settings.init(this);

      await this.loadUserConfig();
      this.applyUserConfig();

      this.initScrollHandling();
      this.attachUrlbarCloseListeners();

      window.addEventListener("unload", () => this.destroy(), { once: true });

      const { UrlbarUtils, UrlbarProvider } = ChromeUtils.importESModule(
        "resource:///modules/UrlbarUtils.sys.mjs"
      );
      const { UrlbarProvidersManager } = ChromeUtils.importESModule(
        "resource:///modules/UrlbarProvidersManager.sys.mjs"
      );
      const { UrlbarResult } = ChromeUtils.importESModule("resource:///modules/UrlbarResult.sys.mjs");

      if (typeof UrlbarProvider === "undefined" || typeof UrlbarProvidersManager === "undefined") {
        debugError(
          "UrlbarProvider or UrlbarProvidersManager not available; provider not registered."
        );
        return;
      }

      try {
        const self = this;
        class ZenCommandProvider extends UrlbarProvider {
          _isInPrefixMode = false;

          get name() {
            return "TestProvider"; // setting name to "TestProvider" don't cause too many error messages in console due to setting result.heuristic = true;
          }
          get type() {
            return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
          }
          getPriority(context) {
            const input = (context.searchString || "").trim();
            // Returning a high priority ensures this provider's results are shown exclusively
            // when the ':' prefix is used, effectively creating a command-only mode.
            return input.startsWith(":") ? 10000 : 0;
          }

          async isActive(context) {
            try {
              const input = (context.searchString || "").trim();
              const isPrefixSearch = input.startsWith(":");

              if (this._isInPrefixMode && !isPrefixSearch) {
                this._isInPrefixMode = false;
                Prefs.resetTempMaxRichResults();
              }

              // Do not activate if a one-off search engine is already active.
              const inSearchMode =
                !!context.searchMode?.engineName || !!gURLBar.searchMode?.engineName;
              if (inSearchMode) {
                debugLog(
                  `Provider inactivated by search mode: ${
                  context.searchMode?.engineName || gURLBar.searchMode?.engineName
                }`
                );
                return false;
              }

              if (isPrefixSearch) {
                return true;
              }

              if (Prefs.prefixRequired) {
                return false;
              }

              if (input.length >= Prefs.minQueryLength) {
                const liveCommands = await self.generateLiveCommands();
                return self.filterCommandsByInput(input, liveCommands).length > 0;
              }

              return false;
            } catch (e) {
              debugError("isActive error:", e);
              return false;
            }
          }

          async startQuery(context, add) {
            try {
              if (context.canceled) return;
              const input =
                context?.searchString || context?.text || context?.trimmed || gURLBar?.value || "";
              const isPrefixSearch = input.trim().startsWith(":");

              // Set the state flag based on the initial query.
              this._isInPrefixMode = isPrefixSearch;

              if (isPrefixSearch) {
                Prefs.setTempMaxRichResults(Prefs.maxCommandsPrefix);
              } else {
                // Reset if the provider is active but no longer in prefix mode.
                Prefs.resetTempMaxRichResults();
              }
              if (context.canceled) return;

              const liveCommands = await self.generateLiveCommands();
              if (context.canceled) return;
              this._currentCommandList = liveCommands; // Store for use in findCommandFromDomRow
              const matches = self.filterCommandsByInput(input, liveCommands);
              this._lastResults = [];

              if (!matches.length) {
                if (isPrefixSearch) {
                  const noResultsCmd = {
                    key: "no-results",
                    label: "No matching commands found",
                    command: self._closeUrlBar.bind(self),
                    icon: "chrome://browser/skin/zen-icons/info.svg",
                  };

                  const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                    suggestion: noResultsCmd.label,
                    title: noResultsCmd.label,
                    url: "",
                    query: noResultsCmd.key,
                    engine: "zenCommand",
                  });

                  const result = new UrlbarResult(
                    UrlbarUtils.RESULT_TYPE.SEARCH,
                    UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                    payload,
                    payloadHighlights
                  );

                  result.heuristic = true;
                  result._zenCmd = noResultsCmd;
                  result.payload.icon = noResultsCmd.icon;
                  result.providerName = this.name;
                  result.providerType = this.type;
                  this._lastResults.push(result);
                  add(this, result);
                }
                return;
              }

              for (const [index, cmd] of matches.entries()) {
                if (context.canceled) return;
                const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                  suggestion: cmd.label,
                  title: cmd.label,
                  url: "",
                  query: cmd.key,
                  engine: "zenCommand",
                  keywords: cmd?.tags,
                });

                const result = new UrlbarResult(
                  UrlbarUtils.RESULT_TYPE.SEARCH,
                  UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                  payload,
                  payloadHighlights
                );

                if (index === 0) {
                  result.heuristic = true;
                }

                result._zenCmd = cmd;
                const shortcut = self.getShortcutForCommand(cmd.key);
                if (shortcut) {
                  result._zenShortcut = shortcut;
                }
                result.payload.icon = cmd.icon || "chrome://browser/skin/trending.svg";
                result.providerName = this.name;
                result.providerType = this.type;
                this._lastResults.push(result);
                add(this, result);
              }
              // Listeners are attached here to ensure they are active whenever results are shown.
              self.attachUrlbarSelectionListeners();
            } catch (e) {
              debugError("startQuery unexpected error:", e);
            }
          }
          dispose() {
            Prefs.resetTempMaxRichResults();
            this._isInPrefixMode = false;
            setTimeout(() => {
              this._lastResults = [];
              this._currentCommandList = null;
            }, 0);
          }
        }

        this.provider = new ZenCommandProvider();
        UrlbarProvidersManager.registerProvider(this.provider);
        debugLog("Zen Command Palette provider registered.");
      } catch (e) {
        debugError("Failed to create/register Urlbar provider:", e);
      }
    },

    /**
     * Adds a new command to the palette.
     * @param {object} cmd - The command object to add. Must have key, label, and command properties.
     * @returns {object} The command object that was added.
     */
    addCommand(cmd) {
      if (!cmd || !cmd.key || !cmd.label) {
        throw new Error("addCommand: command must have {key, label}");
      }
      this.staticCommands.push(cmd);
      return cmd;
    },

    /**
     * Adds multiple commands to the palette.
     * @param {Array<object>} arr - An array of command objects to add.
     * @returns {Array<object>} The full array of commands after addition.
     */
    addCommands(arr) {
      if (!Array.isArray(arr)) throw new Error("addCommands expects an array");
      let addedCount = 0;
      for (const c of arr) {
        // Avoid adding duplicates
        if (!this.staticCommands.some((existing) => existing.key === c.key)) {
          this.addCommand(c);
          addedCount++;
        }
      }
      debugLog(
        "addCommands: added",
        addedCount,
        "items. total commands:",
        this.staticCommands.length
      );
      return this.staticCommands;
    },

    /**
     * Removes a command from the palette by its key or a predicate function.
     * @param {string|Function} keyOrPredicate - The key of the command to remove, or a function that returns true for the command to be removed.
     * @returns {object|null} The removed command object, or null if not found.
     */
    removeCommand(keyOrPredicate) {
      const idx =
        typeof keyOrPredicate === "function"
          ? this.staticCommands.findIndex(keyOrPredicate)
          : this.staticCommands.findIndex((c) => c.key === keyOrPredicate);
      if (idx >= 0) {
        const [removed] = this.staticCommands.splice(idx, 1);
        debugLog("removeCommand:", removed && removed.key);
        return removed;
      }
      return null;
    },

    /**
     * Adds a new dynamic command provider to the palette.
     * @param {Function} func - A function that returns a promise resolving to an array of command objects.
     * @param {string|null} [pref=null] - The preference key that controls if this provider is active.
     * @param {object} [options] - Additional options.
     * @param {boolean} [options.allowIcons=true] - Whether icons for these commands can be changed.
     * @param {boolean} [options.allowShortcuts=true] - Whether shortcuts for these commands can be changed.
     */
    addDynamicCommandsProvider(func, pref, { allowIcons = true, allowShortcuts = true } = {}) {
      if (typeof func !== "function") {
        debugError("addDynamicCommandsProvider: func must be a function.");
        return;
      }
      this._dynamicCommandProviders.push({
        func,
        pref: pref === undefined ? null : pref,
        allowIcons,
        allowShortcuts,
      });
    },
  };

  // --- Initialization ---
  UC_API.Runtime.startupFinished().then(() => {
    Prefs.setInitialPrefs();
    window.ZenCommandPalette = ZenCommandPalette$1;
    window.ZenCommandPalette.init();

    debugLog(
      "Zen Command Palette initialized. Static commands count:",
      window.ZenCommandPalette.staticCommands.length
    );
  });

}));

