// ==UserScript==
// @name            Zen Command Palette
// @description     A powerful, extensible command interface for Zen Browser, seamlessly integrated into the URL bar.
// @author          BibekBhusal
// @onlyonce
// ==/UserScript==


(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ZenCommandPalette = {}));
})(this, (function (exports) { 'use strict';

  const svgToUrl = (iconSVG) => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}`;
  };

  const icons = {
    // ICON CREDITS: Lucide Icons[ISC License]
    splitVz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3m8 0h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3M12 4v16"/></svg>`,
    zoomIn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M11 8v6m-3-3h6"/></g></svg>`,
    zoomOut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M8 11h6"/></g></svg>`,
    pin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4a1 1 0 0 1 1 1z"/></svg>`,
    swap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="context-fill light-dark(black, white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-repeat-icon lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
    bug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20v-9m2-4a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zm.12-3.12L16 2"/><path d="M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13"/></g></svg>`,
    book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7v14m-9-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3a3 3 0 0 0-3-3z"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/></svg>`,
    folderOut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5M2 13h10"/><path d="m5 10l-3 3l3 3"/></g></svg>`,
    glass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2a2 2 0 0 0-2 2m-7.5-2L5 7c.7-1.3 1.4-2 3-2m13.5 8L19 7c-.7-1.3-1.5-2-3-2"/></g></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/></svg>`,

    // ICON CREDITS: Lucide Labs[ISC License]
    broom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m13 11l9-9m-7.4 10.6c.8.8.9 2.1.2 3L10 22l-8-8l6.4-4.8c.9-.7 2.2-.6 3 .2Zm-7.8-2.2l6.8 6.8M5 17l1.4-1.4"/></svg>`,

    // ICON CREDITS: Tabler Icons[MIT License]
    zoomReset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-6-6M3.268 12.043A7.02 7.02 0 0 0 9.902 17a7.01 7.01 0 0 0 7.043-6.131a7 7 0 0 0-5.314-7.672A7.02 7.02 0 0 0 3.39 7.6"/><path d="M3 4v4h4"/></g></svg>`,

    // ICON CREDITS: Sine Github repo [GNU General Public License v3.0.]
    // https://github.com/CosmoCreeper/Sine/blob/main/engine/assets/images/saturn.svg
    sine: `<svg fill-opacity="context-fill-opacity" fill="context-fill light-dark(black, white)" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 502.688 502.688" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M491.401,12.059c-23.467-23.467-70.4-9.6-145.067,42.667c-30.933-16-65.067-25.6-101.333-25.6 c-57.6,0-112,22.4-152.533,62.933c-68.267,68.267-81.067,170.667-38.4,252.8c-69.333,99.2-57.6,131.2-42.667,145.067 c7.467,7.467,18.133,11.733,29.867,11.733c23.467,0,54.4-13.867,98.133-40.533c7.467-5.333,16-10.667,24.533-17.067 c25.6,10.667,53.333,16,81.067,16c57.6,0,112-22.4,152.533-62.933c62.933-62.933,78.933-155.733,46.933-233.6 c6.4-8.533,11.733-17.067,18.133-25.6C504.201,73.925,512.734,33.392,491.401,12.059z M41.267,458.992 c1.067-8.533,7.467-32,37.333-77.867c4.267,5.333,8.533,10.667,13.867,16c8.533,8.533,18.133,16,27.733,23.467 C81.801,446.192,53.001,458.992,41.267,458.992z M156.467,394.992c-11.733-7.467-23.467-16-34.133-26.667 c-68.267-68.267-68.267-178.133,0-246.4c32-33.067,75.733-51.2,122.667-51.2s90.667,18.133,123.733,50.133 c10.667,10.667,20.267,22.4,26.667,35.2c-27.733,36.267-66.133,80-113.067,126.933 C235.401,329.925,192.734,367.259,156.467,394.992z M368.734,367.259c-33.067,33.067-77.867,52.267-123.733,52.267 c-13.867,0-27.733-2.133-41.6-5.333c36.267-28.8,74.667-62.933,112-100.267c37.333-37.333,70.4-74.667,99.2-110.933 C428.467,260.592,413.534,322.459,368.734,367.259z M422.067,120.858c-7.467-10.667-14.933-20.267-24.533-28.8 c-4.267-4.267-9.6-8.533-13.867-12.8c44.8-29.867,68.267-37.333,76.8-37.333C460.467,53.659,448.734,81.392,422.067,120.858z"></path></g></g></g></svg>`,
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

  function isNotEmptyTab() {
    return !window.gBrowser.selectedTab.hasAttribute("zen-empty-tab");
  }

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

  const commands = [
    // ----------- Zen Compact Mode -----------
    // {
    //   key: "cmd_zenCompactModeToggle",
    //   label: "Toggle Compact Mode",
    //   icon: "chrome://browser/skin/zen-icons/fullscreen.svg",
    //   tags: ["compact", "mode", "toggle", "ui", "layout", "hide", "sidebar"],
    // },
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
    // {
    //   key: "cmd_zenWorkspaceForward",
    //   label: "Next Workspace",
    //   icon: "chrome://browser/skin/zen-icons/arrow-right.svg",
    //   tags: ["workspace", "next", "forward", "navigate"],
    // },
    // {
    //   key: "cmd_zenWorkspaceBackward",
    //   label: "Previous Workspace",
    //   icon: "chrome://browser/skin/zen-icons/arrow-left.svg",
    //   tags: ["workspace", "previous", "backward", "navigate"],
    // },
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
    // {
    //   key: "cmd_zenCopyCurrentURL",
    //   label: "Copy Current URL",
    //   icon: "chrome://browser/skin/zen-icons/link.svg",
    //   tags: ["copy", "url", "current", "clipboard"],
    // },
    {
      key: "cmd_zenCopyCurrentURLMarkdown",
      label: "Copy Current URL as Markdown",
      icon: "chrome://browser/skin/zen-icons/link.svg",
      tags: ["copy", "url", "markdown", "format", "clipboard"],
    },

    // ----------- Folder Management -----------
    // {
    //   key: "cmd_zenOpenFolderCreation",
    //   label: "Create New Folder",
    //   command: () => gZenFolders.createFolder([], { renameFolder: true }),
    //   condition: () => !!window.gZenFolders,
    //   icon: "chrome://browser/skin/zen-icons/folder.svg",
    //   tags: ["folder", "create", "new", "group", "tabs"],
    // },
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
      icon: "chrome://browser/skin/zen-icons/edit.svg",
      tags: ["folder", "rename", "change", "tab", "group"],
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
      condition: () => !!window.gBrowser?.duplicateTab && isNotEmptyTab(),
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
    // {
    //   key: "cmd_close",
    //   label: "Close Tab",
    //   icon: "chrome://browser/skin/zen-icons/close.svg",
    //   condition: isNotEmptyTab,
    //   tags: ["tab", "close", "remove"],
    // },
    {
      key: "cmd_toggleMute",
      label: "Toggle Mute Tab",
      icon: "chrome://browser/skin/zen-icons/media-mute.svg",
      tags: ["tab", "mute", "audio", "sound", "toggle"],
      condition: isNotEmptyTab,
    },
    // {
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
    {
      key: "Browser:ShowAllTabs",
      label: "Show All Tabs Panel",
      tags: ["show", "all", "tabs", "panel", "overview"],
    },
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
    // {
    //   key: "cmd_newNavigator",
    //   label: "New Window",
    //   icon: "chrome://browser/skin/zen-icons/window.svg",
    //   tags: ["window", "new", "create", "open"],
    // },
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
    // {
    //   key: "Tools:PrivateBrowsing",
    //   label: "Open Private Window",
    //   icon: svgToUrl(icons["incognito"]),
    //   tags: ["private", "browsing", "incognito", "window"],
    // },
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
    // {
    //   key: "cmd_find",
    //   label: "Find in Page",
    //   icon: "chrome://browser/skin/zen-icons/search-page.svg",
    //   tags: ["find", "search", "page", "text"],
    //   condition: isNotEmptyTab,
    // },
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
      icon: "chrome://browser/skin/zen-icons/source-code.svg",
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

    // ----------- Media & Screenshots -----------
    {
      key: "View:PictureInPicture",
      label: "Toggle Picture-in-Picture",
      icon: "chrome://browser/skin/zen-icons/media-pip.svg",
      tags: ["picture", "pip", "video", "floating"],
    },
    // {
    //   key: "Browser:Screenshot",
    //   label: "Take Screenshot",
    //   icon: "chrome://browser/skin/screenshot.svg",
    //   tags: ["screenshot", "capture", "image", "snap"],
    //   condition: isNotEmptyTab,
    // },

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
    // {
    //   key: "Tools:Addons",
    //   label: "Manage Extensions",
    //   icon: "chrome://mozapps/skin/extensions/extension.svg",
    //   tags: ["addons", "extensions", "themes", "manage"],
    // },
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

    // ----------- Advanced tab Group management ------------
    {
      key: "cmd_zenCollapseGroups",
      label: "Collapse All Groups",
      command: () => {
        const labels = gBrowser.tabContainer.querySelectorAll(".tab-group-label");
        labels.forEach((label) => {
          const expanded = label.getAttribute("aria-expanded");
          if (expanded === "true") {
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
          if (expanded === "false") {
            label.focus();
            label.click();
          }
        });
      },
      icon: "chrome://browser/skin/zen-icons/folder.svg",
      tags: ["folder", "expand", "group", "tabs", "all"],
    },
  ];

  let _originalMaxResults = null;

  const Prefs = {
    KEYS: {
      PREFIX: "zen-command-palette.prefix",
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
      DYNAMIC_UNLOAD_TABS: "zen-command-palette.dynamic.unload-tab",
      DYNAMIC_EXTENSION_ENABLE_DISABLE: "zen-command-palette.dynamic.extension-enable-disable",
      DYNAMIC_EXTENSION_UNINSTALL: "zen-command-palette.dynamic.extension-uninstall",
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

    get prefix() {
      return this.getPref(this.KEYS.PREFIX);
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
    [Prefs.KEYS.PREFIX]: ":",
    [Prefs.KEYS.DEBUG_MODE]: false,
    [Prefs.KEYS.MAX_COMMANDS]: 3,
    [Prefs.KEYS.MAX_COMMANDS_PREFIX]: 50,
    [Prefs.KEYS.MIN_QUERY_LENGTH]: 3,
    [Prefs.KEYS.MIN_SCORE_THRESHOLD]: 150,
    [Prefs.KEYS.DYNAMIC_ABOUT_PAGES]: false,
    [Prefs.KEYS.DYNAMIC_SEARCH_ENGINES]: true,
    [Prefs.KEYS.DYNAMIC_EXTENSIONS]: false,
    [Prefs.KEYS.DYNAMIC_WORKSPACES]: false,
    [Prefs.KEYS.DYNAMIC_SINE_MODS]: true,
    [Prefs.KEYS.DYNAMIC_FOLDERS]: true,
    [Prefs.KEYS.DYNAMIC_CONTAINER_TABS]: false,
    [Prefs.KEYS.DYNAMIC_ACTIVE_TABS]: false,
    [Prefs.KEYS.DYNAMIC_UNLOAD_TABS]: false,
    [Prefs.KEYS.DYNAMIC_EXTENSION_ENABLE_DISABLE]: false,
    [Prefs.KEYS.DYNAMIC_EXTENSION_UNINSTALL]: false,
    [Prefs.KEYS.COMMAND_SETTINGS_FILE]: "chrome/zen-commands-settings.json",
  };

  const debugLog = (...args) => {
    if (Prefs.debugMode) console.log("zen-command-palette:", ...args);
  };

  const debugError = (...args) => {
    if (Prefs.debugMode) console.error("zen-command-palette:", ...args);
  };

  const DEFAULTS = {
    hiddenCommands: [],
    customIcons: {},
    customShortcuts: {},
    toolbarButtons: [],
    customCommands: [],
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

  const commandChainUtils = {
    async openLink(params) {
      const { link, where = "new tab" } = params;
      if (!link) return;
      const whereNormalized = where?.toLowerCase()?.trim();
      try {
        switch (whereNormalized) {
          case "current tab":
            openTrustedLinkIn(link, "current");
            break;
          case "new tab":
            openTrustedLinkIn(link, "tab");
            break;
          case "new window":
            openTrustedLinkIn(link, "window");
            break;
          case "incognito":
          case "private":
            window.openTrustedLinkIn(link, "window", { private: true });
            break;
          case "glance":
            if (window.gZenGlanceManager) {
              const rect = gBrowser.selectedBrowser.getBoundingClientRect();
              window.gZenGlanceManager.openGlance({
                url: link,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: 10,
                height: 10,
              });
            } else {
              openTrustedLinkIn(link, "tab");
            }
            break;
          case "vsplit":
          case "hsplit":
            if (window.gZenViewSplitter) {
              const sep = whereNormalized === "vsplit" ? "vsep" : "hsep";
              const tab1 = gBrowser.selectedTab;
              await openTrustedLinkIn(link, "tab");
              const tab2 = gBrowser.selectedTab;
              gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
            } else {
              openTrustedLinkIn(link, "tab");
            }
            break;
          default:
            openTrustedLinkIn(link, "tab");
        }
      } catch (e) {
        debugError(`Command Chain: Failed to open link "${link}" in "${where}".`, e);
      }
    },
    async delay(params) {
      const { time = 50 } = params;
      if (!time) return;
      await new Promise((resolve) => setTimeout(resolve, time));
    },
    async showToast(params) {
      const { title, description } = params;
      if (!title || !description) return;
      if (window.ucAPI?.showToast) {
        window.ucAPI.showToast([title || "", description || ""], 0);
      } else {
        debugError("ucAPI.showToast is not available.");
        alert([title, description], 0);
      }
    },
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
   * Generates commands for enabling or disabling extensions.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of addon state commands.
   */
  async function generateExtensionEnableDisableCommands() {
    const addons = await AddonManager.getAddonsByTypes(["extension"]);
    const commands = [];
    for (const addon of addons) {
      if (addon.isSystem) continue;

      if (addon.isActive) {
        commands.push({
          key: `addon:disable:${addon.id}`,
          label: `Disable Extension: ${addon.name}`,
          command: () => addon.disable(),
          icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
          tags: ["extension", "addon", "disable", addon.name.toLowerCase()],
        });
      } else {
        commands.push({
          key: `addon:enable:${addon.id}`,
          label: `Enable Extension: ${addon.name}`,
          command: () => addon.enable(),
          icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
          tags: ["extension", "addon", "enable", addon.name.toLowerCase()],
        });
      }
    }
    return commands;
  }

  /**
   * Generates commands for uninstalling extensions.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of addon uninstall commands.
   */
  async function generateExtensionUninstallCommands() {
    const addons = await AddonManager.getAddonsByTypes(["extension"]);
    const commands = [];
    for (const addon of addons) {
      if (addon.isSystem) continue;

      commands.push({
        key: `addon:uninstall:${addon.id}`,
        label: `Uninstall Extension: ${addon.name}`,
        command: () => {
          if (confirm(`Are you sure you want to uninstall "${addon.name}"?`)) {
            addon.uninstall();
          }
        },
        icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
        tags: ["extension", "addon", "uninstall", "remove", addon.name.toLowerCase()],
      });
    }
    return commands;
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
        // HACK: adding tags 3 times so that this appears in top
        tags: [
          "extension",
          "addon",
          "options",
          addon.name.toLowerCase(),
          addon.name.toLowerCase(),
          addon.name.toLowerCase(),
        ],
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
   * Generates commands for unloading to tabs.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of active tab commands.
   */
  async function generateUnloadTabCommands() {
    const commands = [];
    // Use gZenWorkspaces.allStoredTabs to get tabs from all workspaces in the current window.
    const tabs = window.gZenWorkspaces?.workspaceEnabled
      ? window.gZenWorkspaces.allStoredTabs
      : Array.from(gBrowser.tabs);

    for (const tab of tabs) {
      // Skip already unloaded tabs
      if (tab.hasAttribute("pending")) {
        continue;
      }

      // Skip the empty new tab placeholder used by Zen.
      if (tab.hasAttribute("zen-empty-tab") || !tab.linkedBrowser) {
        continue;
      }

      commands.push({
        key: `unload-tab:${tab.linkedBrowser.outerWindowID}-${tab.linkedBrowser.tabId}`,
        label: `Unload tab: ${tab.label}`,
        command: () => gBrowser.discardBrowser(tab),
        condition: () => gBrowser.selectedTab !== tab,
        icon: tab.image || "chrome://browser/skin/zen-icons/close-all.svg",
        tags: ["unload", "sleep", tab.label.toLowerCase()],
      });
    }
    return commands;
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

    // TODO: complete this when Sine api will be globally available
    // Generate "Install" commands. This requires the main `Sine` object to be available.
    /* if (window.Sine?.marketplace) {
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
      debugLog(
        "zen-command-palette: Global Sine object not found. 'Install' commands will be unavailable."
      );
    } */

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

  async function generateCustomCommands() {
    const { customCommands } = await Storage.loadSettings();
    if (!customCommands || customCommands.length === 0) {
      return [];
    }

    return customCommands.map((cmd) => {
      let commandFunc;
      if (cmd.type === "js") {
        commandFunc = () => {
          try {
            const Cu = Components.utils;
            const sandbox = Cu.Sandbox(window, {
              sandboxPrototype: window,
              wantXrays: false,
            });
            Cu.evalInSandbox(cmd.code, sandbox);
          } catch (e) {
            debugError(`Error executing custom JS command "${cmd.name}":`, e);
            if (window.ucAPI?.showToast) {
              window.ucAPI.showToast(`Custom command error: ${e.message}`);
            }
          }
        };
      } else if (cmd.type === "chain") {
        commandFunc = async () => {
          for (const step of cmd.commands) {
            if (typeof step === "string") {
              // It's a regular command key
              await new Promise((resolve) => setTimeout(resolve, 50));
              ZenCommandPalette.executeCommandByKey(step);
            } else if (typeof step === "object" && step.action && commandChainUtils[step.action]) {
              // It's a utility function call
              await commandChainUtils[step.action](step.params || {});
            }
          }
        };
      }

      return {
        key: `custom:${cmd.id}`,
        label: cmd.name,
        command: commandFunc,
        icon:
          cmd.icon ||
          (cmd.type === "js"
            ? "chrome://browser/skin/zen-icons/source-code.svg"
            : "chrome://browser/skin/zen-icons/settings.svg"),
        tags: ["custom", cmd.name.toLowerCase()],
        allowIcons: true,
        allowShortcuts: true,
      };
    });
  }

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

  const commandChainFunctions = {
    delay: {
      label: "Delay",
      params: [{ name: "time", type: "number", label: "Time (ms)", defaultValue: 500 }],
    },
    showToast: {
      label: "Show Toast",
      params: [
        { name: "title", type: "text", label: "Title", defaultValue: "Hello!" },
        { name: "description", type: "text", label: "Description", defaultValue: "" },
      ],
    },
    openLink: {
      label: "Open Link",
      params: [
        { name: "link", type: "text", label: "URL", defaultValue: "https://" },
        {
          name: "where",
          type: "select",
          label: "Where",
          defaultValue: "new tab",
          options: [
            { value: "new tab", label: "New Tab" },
            { value: "current tab", label: "Current Tab" },
            { value: "new window", label: "New Window" },
            { value: "private", label: "Private Window" },
            { value: "vsplit", label: "Vertical Split" },
            { value: "hsplit", label: "Horizontal Split" },
            { value: "glance", label: "Glance" },
          ],
        },
      ],
    },
  };

  const SettingsModal = {
    _modalElement: null,
    _mainModule: null,
    _currentSettings: {},
    _initialSettingsState: null,
    _currentShortcutTarget: null,
    _boundHandleShortcutKeyDown: null,
    _boundCloseOnEscape: null,
    _boundEditorClickHandler: null,
    // BUG: I can't figure out way to control size of icon for menulist, not including icon till fixed, turn this variable to true when fixed
    _showCommandIconsInSelect: true,

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
      this._populateCustomCommandsTab();
      this._populateHelpTab();
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
        customCommands: [...(this._currentSettings.customCommands || [])],
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

      const oldSettings = JSON.parse(this._initialSettingsState);
      const somethingChanged = JSON.stringify(newSettings) !== this._initialSettingsState;

      if (somethingChanged) {
        await Storage.saveSettings(newSettings);
        await this._mainModule.loadUserConfig();
      }

      this.hide();

      // Handle Dynamic Widget Changes
      const oldButtons = oldSettings.toolbarButtons || [];
      const newButtons = newSettings.toolbarButtons || [];
      const addedButtons = newButtons.filter((b) => !oldButtons.includes(b));
      const removedButtons = oldButtons.filter((b) => !newButtons.includes(b));

      for (const key of addedButtons) {
        this._mainModule.addWidget(key);
      }
      for (const key of removedButtons) {
        this._mainModule.removeWidget(key);
      }

      // Check if Shortcuts Changed
      const oldShortcutsJSON = JSON.stringify(oldSettings.customShortcuts || {});
      const newShortcutsJSON = JSON.stringify(newSettings.customShortcuts || {});

      if (oldShortcutsJSON !== newShortcutsJSON) {
        if (window.ucAPI && typeof window.ucAPI.showToast === "function") {
          window.ucAPI.showToast(
            ["Shortcut Changed", "A restart is required for shortcut changes to take effect."],
            1 // Restart preset
          );
        } else {
          alert("Please restart Zen for shortcut changes to take effect.");
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
      modal.querySelectorAll(".help-button").forEach((button) => {
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

      const renderGroup = (title, commands) => {
        if (commands.length === 0) return;
        const groupWrapper = parseElement('<div class="commands-group"></div>');
        const headerHtml = `
        <div class="commands-group-header">
          <h4>${escapeXmlAttribute(title)}</h4>
        </div>
      `;
        groupWrapper.appendChild(parseElement(headerHtml));
        commands
          .sort((a, b) => a.label.localeCompare(b.label))
          .forEach((cmd) => this._renderCommand(groupWrapper, cmd));
        container.appendChild(groupWrapper);
      };

      const nativeCmds = allCommands.filter((c) => c.isNative);
      const staticCmds = allCommands.filter((c) => !c.isDynamic && !c.isNative);

      renderGroup("Native Commands", nativeCmds);
      renderGroup("Customizable Commands", staticCmds);

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
        renderGroup(label, group.commands);
      }
    },

    _renderCommand(container, cmd) {
      const isHidden = this._currentSettings.hiddenCommands.includes(cmd.key);
      const customIcon = this._currentSettings.customIcons[cmd.key];
      const customShortcut = this._currentSettings.customShortcuts[cmd.key];
      const nativeShortcut = this._mainModule.getShortcutForCommand(cmd.key);

      const allowIconChange = cmd.allowIcons !== false;
      const allowShortcutChange = cmd.allowShortcuts !== false;
      const allowToolbarButton = cmd.allowShortcuts !== false;

      const shortcutValue = customShortcut || nativeShortcut || "";
      const shortcutInputHtml = `<div class="shortcut-input-wrapper">
      <input type="text" class="shortcut-input" placeholder="Set Shortcut" value="${escapeXmlAttribute(
        shortcutValue
      )}" ${!allowShortcutChange ? "readonly" : ""} />
      <span class="shortcut-conflict-warning" hidden>Conflict!</span>
    </div>`;

      const visibilityToggleHtml = `<input type="checkbox" class="visibility-toggle" title="Show/Hide Command" ${
      !isHidden ? "checked" : ""
    } />`;

      const isToolbarButton = this._currentSettings.toolbarButtons?.includes(cmd.key);
      const toolbarButtonHtml = allowToolbarButton
        ? `<button class="toolbar-button-toggle ${isToolbarButton ? "active" : ""}" title="${
          isToolbarButton ? "Remove from Toolbar" : "Add to Toolbar"
        }">${icons.pin}</button>`
        : "";

      const itemHtml = `
      <div class="command-item" data-key="${escapeXmlAttribute(cmd.key)}">
        <img src="${escapeXmlAttribute(
          customIcon || cmd.icon || "chrome://browser/skin/trending.svg"
        )}" class="command-icon ${allowIconChange ? "editable" : ""}" />
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

      // Fallback for failed icon loads
      item.querySelector(".command-icon").onerror = function () {
        this.src = "chrome://browser/skin/trending.svg";
        this.onerror = null;
      };

      if (allowIconChange) {
        item.querySelector(".command-icon").addEventListener("click", (e) => {
          const newIconInput = prompt("Enter new icon URL or paste SVG code:", e.target.src);
          if (newIconInput !== null) {
            let finalIconSrc = newIconInput.trim();
            // Check if the input is likely SVG code
            if (finalIconSrc.startsWith("<svg") && finalIconSrc.endsWith("</svg>")) {
              finalIconSrc = svgToUrl(finalIconSrc);
            }
            e.target.src = finalIconSrc;
            this._currentSettings.customIcons[cmd.key] = finalIconSrc;
          }
        });
      }

      if (allowShortcutChange) {
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
      }

      if (allowToolbarButton) {
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

    async _handleShortcutKeyDown(event) {
      if (!this._currentShortcutTarget) return;

      event.preventDefault();
      event.stopPropagation();

      const key = event.key;
      const targetInput = this._currentShortcutTarget;
      const commandItem = targetInput.closest(".command-item");
      const commandKey = commandItem.dataset.key;
      const conflictWarning = commandItem.querySelector(".shortcut-conflict-warning");

      const clearConflict = () => {
        targetInput.classList.remove("conflict");
        conflictWarning.hidden = true;
      };

      if (key === "Escape") {
        clearConflict();
        targetInput.blur();
        return;
      }

      if (key === "Backspace" || key === "Delete") {
        targetInput.value = "";
        delete this._currentSettings.customShortcuts[commandKey];
        clearConflict();
        window.removeEventListener("keydown", this._boundHandleShortcutKeyDown, true);
        this._currentShortcutTarget = null;
        targetInput.blur();
        return;
      }

      // Ignore modifier-only key presses
      if (["Control", "Alt", "Shift", "Meta"].includes(key)) {
        return;
      }

      let shortcutString = "";
      if (event.ctrlKey) shortcutString += "Ctrl+";
      if (event.altKey) shortcutString += "Alt+";
      if (event.shiftKey) shortcutString += "Shift+";
      if (event.metaKey) shortcutString += "Meta+";
      shortcutString += key.toUpperCase();

      const modifiers = new nsKeyShortcutModifiers(
        event.ctrlKey,
        event.altKey,
        event.shiftKey,
        event.metaKey,
        false
      );

      let hasConflict = window.gZenKeyboardShortcutsManager.checkForConflicts(
        key,
        modifiers,
        commandKey
      );

      if (!hasConflict) {
        for (const [otherCmdKey, otherShortcutStr] of Object.entries(
          this._currentSettings.customShortcuts
        )) {
          if (otherCmdKey !== commandKey && otherShortcutStr === shortcutString) {
            hasConflict = true;
            break;
          }
        }
      }

      targetInput.value = shortcutString;

      if (hasConflict) {
        targetInput.classList.add("conflict");
        conflictWarning.hidden = false;
        debugLog(`Shortcut conflict detected for "${commandKey}" with shortcut "${shortcutString}".`);
        delete this._currentSettings.customShortcuts[commandKey];
      } else {
        clearConflict();
        this._currentSettings.customShortcuts[commandKey] = shortcutString;
      }
    },

    _populateCustomCommandsTab() {
      const container = this._modalElement.querySelector("#custom-commands-tab-content");
      const content = parseElement(`
      <div>
        <div id="custom-commands-view">
          <div class="custom-commands-toolbar">
            <p>Define your own commands. They will be available in the command palette immediately after saving.</p>
            <div class="custom-commands-actions">
              <button id="add-js-command">Add JS Command</button>
              <button id="add-chain-command">Add Command Chain</button>
            </div>
          </div>
          <div id="custom-commands-list"></div>
        </div>
        <div id="custom-command-editor" hidden="true"></div>
      </div>
    `);
      container.replaceChildren(content);

      this._renderCustomCommands();

      container.querySelector("#add-js-command").addEventListener("click", () => {
        this._showCustomCommandEditor({
          type: "js",
          id: `custom-js-${Date.now()}`,
          name: "",
          code: "",
        });
      });

      container.querySelector("#add-chain-command").addEventListener("click", () => {
        this._showCustomCommandEditor({
          type: "chain",
          id: `custom-chain-${Date.now()}`,
          name: "",
          commands: [],
        });
      });
    },

    _renderCustomCommands() {
      const listContainer = this._modalElement.querySelector("#custom-commands-list");
      listContainer.innerHTML = "";
      const customCommands = this._currentSettings.customCommands || [];

      if (customCommands.length === 0) {
        listContainer.innerHTML = `<p class="no-custom-commands">No custom commands yet. Add one to get started!</p>`;
        return;
      }

      customCommands.forEach((cmd) => {
        const defaultIcon =
          cmd.type === "js"
            ? "chrome://browser/skin/zen-icons/source-code.svg"
            : "chrome://browser/skin/zen-icons/settings.svg";
        const icon = cmd.icon || defaultIcon;

        const item = parseElement(`
        <div class="custom-command-item" data-id="${cmd.id}">
          <img src="${escapeXmlAttribute(icon)}" class="custom-command-icon" />
          <span class="custom-command-name">${escapeXmlAttribute(cmd.name)}</span>
          <span class="custom-command-type">${cmd.type === "js" ? "JS" : "Chain"}</span>
          <div class="custom-command-controls">
            <button class="edit-custom-cmd icon-button" title="Edit Command"><img src="chrome://browser/skin/zen-icons/edit.svg" /></button>
            <button class="delete-custom-cmd delete-button icon-button" title="Delete Command"><img src="chrome://browser/skin/zen-icons/edit-delete.svg" /></button>
          </div>
        </div>
      `);
        item.querySelector(".edit-custom-cmd").addEventListener("click", () => {
          const commandData = (this._currentSettings.customCommands || []).find(
            (c) => c.id === cmd.id
          );
          this._showCustomCommandEditor(commandData);
        });
        item
          .querySelector(".delete-custom-cmd")
          .addEventListener("click", () => this._deleteCustomCommand(cmd.id));
        listContainer.appendChild(item);
      });
    },

    _deleteCustomCommand(id) {
      if (!confirm("Are you sure you want to delete this custom command?")) return;
      this._currentSettings.customCommands = (this._currentSettings.customCommands || []).filter(
        (c) => c.id !== id
      );
      this._renderCustomCommands();
    },

    _createCommandMenuItems(allCommands) {
      const sortedCommands = allCommands.sort((a, b) => a.label.localeCompare(b.label));
      return sortedCommands
        .map((c) => {
          const iconAttr = this._showCommandIconsInSelect
            ? `image="${escapeXmlAttribute(c.icon || "chrome://browser/skin/trending.svg")}"`
            : "";
          return `<menuitem value="${escapeXmlAttribute(c.key)}"
                         label="${escapeXmlAttribute(c.label)}"
                         ${iconAttr}
                         />`;
        })
        .join("");
    },

    _renderFunctionStep(step, index, chain) {
      const functionSchema = commandChainFunctions[step.action];
      if (!functionSchema) return parseElement(`<div>Unknown function: ${step.action}</div>`);

      const wrapper = parseElement(`<div class="function-step" data-index="${index}"></div>`);
      const label = parseElement(`<label>${escapeXmlAttribute(functionSchema.label)}</label>`);
      wrapper.appendChild(label);

      for (const param of functionSchema.params) {
        const paramWrapper = parseElement(`<div class="param-item"></div>`);
        const currentValue = step.params[param.name];
        let inputHtml = "";

        switch (param.type) {
          case "number":
          case "text":
            inputHtml = `<input
            type="${param.type}"
            class="param-input"
            data-param="${param.name}"
            placeholder="${param.label || ""}"
            value="${escapeXmlAttribute(currentValue)}"
          />`;
            break;
          case "select":
            const optionsHtml = param.options
              .map(
                (opt) =>
                  `<option value=" ${escapeXmlAttribute(opt.value)} " ${currentValue === opt.value ? "selected" : ""} > ${escapeXmlAttribute(opt.label)} </option>`
              )
              .join("");
            inputHtml = `<select class="param-input" data-param="${param.name}">${optionsHtml}</select>`;
            break;
        }
        paramWrapper.appendChild(parseElement(inputHtml));
        wrapper.appendChild(paramWrapper);
      }

      wrapper.addEventListener("input", (e) => {
        const inputElement = e.target;
        if (inputElement.classList.contains("param-input")) {
          const paramName = inputElement.dataset.param;
          const value =
            inputElement.type === "number" ? Number(inputElement.value) : inputElement.value;
          chain[index].params[paramName] = value;
        }
      });

      return wrapper;
    },

    _showCustomCommandEditor(cmd) {
      const self = this;
      this._modalElement.querySelector("#custom-commands-view").hidden = true;
      const editorContainer = this._modalElement.querySelector("#custom-command-editor");
      editorContainer.hidden = false;

      // Cleanup previous listener before adding a new one
      if (this._boundEditorClickHandler) {
        editorContainer.removeEventListener("click", this._boundEditorClickHandler);
      }

      const isEditing = !!cmd.name;
      let currentChain = [...(cmd.commands || [])];

      const baseEditorHtml = `
      <h3>${isEditing ? "Edit" : "Add"} ${cmd.type === "js" ? "JS Command" : "Command Chain"}</h3>
      <div class="setting-item">
        <label for="custom-cmd-name">Name</label>
        <input type="text" id="custom-cmd-name" value="${escapeXmlAttribute(cmd.name)}"/>
      </div>
      <div class="setting-item">
        <label for="custom-cmd-icon">Icon URL</label>
        <input type="text" id="custom-cmd-icon" placeholder="Leave empty for default" value="${escapeXmlAttribute(
          cmd.icon || ""
        )}"/>
      </div>
    `;

      let typeSpecificHtml = "";
      if (cmd.type === "js") {
        typeSpecificHtml = `
        <div class="setting-item-vertical">
          <label for="custom-cmd-code">JavaScript Code</label>
          <div class="js-warning">
            ${icons.warning}
            Only run code from sources you trust. Malicious code can compromise your browser.
          </div>
          <textarea id="custom-cmd-code">${escapeXmlAttribute(cmd.code)}</textarea>
        </div>
      `;
      } else {
        const functionButtons = Object.entries(commandChainFunctions)
          .map(([action, schema]) => `<button data-action="${action}">${schema.label}</button>`)
          .join("");

        typeSpecificHtml = `
        <div class="setting-item-vertical">
          <label>Commands</label>
          <div id="chain-builder">
            <div id="chain-command-selector-container">
              <div id="chain-command-selector-placeholder">Loading...</div>
              <button id="add-command-to-chain">Add Command</button>
            </div>
            <div class="function-actions">
                <label>Add Function:</label>
                ${functionButtons}
            </div>
            <div id="current-chain-list"></div>
          </div>
        </div>
      `;
      }

      const actionsHtml = `
      <div class="custom-command-editor-actions">
        <button id="cancel-custom-cmd">Cancel</button>
        <button id="save-custom-cmd">Save Command</button>
      </div>
    `;

      const fullEditorHtml = `<div>${baseEditorHtml}${typeSpecificHtml}${actionsHtml}</div>`;
      editorContainer.replaceChildren(parseElement(fullEditorHtml));

      const renderChainList = async () => {
        debugLog("renderChainList called");
        const listContainer = editorContainer.querySelector("#current-chain-list");
        if (!listContainer) {
          debugLog("renderChainList: listContainer not found");
          return;
        }
        listContainer.innerHTML = "";

        if (currentChain.length === 0) {
          listContainer.innerHTML = `<p class="no-custom-commands">No commands in chain. Use the dropdown above to add one.</p>`;
          return;
        }

        const allCommands = await this._mainModule.getAllCommandsForConfig();
        debugLog(`renderChainList: building list with ${currentChain.length} items`);

        const menuitemsXUL = this._createCommandMenuItems(allCommands);

        currentChain.forEach((step, index) => {
          const itemContainer = parseElement(`<div class="chain-item-container"></div>`);

          if (typeof step === "string") {
            const menulistXUL = `
              <menulist class="chain-item-selector" value="${escapeXmlAttribute(step)}">
                <menupopup>${menuitemsXUL}</menupopup>
              </menulist>`;
            const menulistElement = parseElement(menulistXUL, "xul");
            menulistElement.addEventListener("command", (e) => {
              currentChain[index] = e.target.value;
            });
            itemContainer.appendChild(menulistElement);
          } else if (typeof step === "object" && step.action) {
            debugLog(`Rendering function step: ${step.action}`);
            const functionStepEl = self._renderFunctionStep(step, index, currentChain);
            itemContainer.appendChild(functionStepEl);
          }

          const deleteButton = parseElement(
            `<button class="delete-button icon-button" title="Remove Command">
             <img src="chrome://browser/skin/zen-icons/edit-delete.svg" />
           </button>`
          );
          deleteButton.addEventListener("click", () => {
            currentChain.splice(index, 1);
            renderChainList();
          });
          itemContainer.appendChild(deleteButton);

          listContainer.appendChild(itemContainer);
        });
      };

      // Define and bind the new delegated event listener
      this._boundEditorClickHandler = (e) => {
        const target = e.target;

        // Handle "Add Function" buttons
        if (target.matches(".function-actions button[data-action]")) {
          const action = target.dataset.action;
          const functionSchema = commandChainFunctions[action];
          if (!functionSchema) return;

          debugLog(`Function button clicked: ${action}`);

          const newStep = { action, params: {} };
          functionSchema.params.forEach((p) => {
            newStep.params[p.name] = p.defaultValue;
          });

          currentChain.push(newStep);
          renderChainList();
          return;
        }

        // Handle "Add Command" button
        if (target.id === "add-command-to-chain") {
          const selector = editorContainer.querySelector("#chain-command-selector");
          if (selector && selector.value) {
            currentChain.push(selector.value);
            renderChainList();
          }
          return;
        }

        // Handle "Save" button
        if (target.id === "save-custom-cmd") {
          self._saveCustomCommand(cmd, currentChain);
          return;
        }

        // Handle "Cancel" button
        if (target.id === "cancel-custom-cmd") {
          self._hideCustomCommandEditor();
          return;
        }
      };

      editorContainer.addEventListener("click", this._boundEditorClickHandler);

      if (cmd.type === "chain") {
        // Initial population of the command selector dropdown
        debugLog("Chain editor: getting all commands...");
        this._mainModule
          .getAllCommandsForConfig()
          .then((allCommands) => {
            debugLog(`Chain editor: received ${allCommands.length} commands.`);
            const placeholder = editorContainer.querySelector("#chain-command-selector-placeholder");
            if (!placeholder) {
              debugLog("Chain editor: placeholder DIV not found!");
              return;
            }

            const menuitemsXUL = this._createCommandMenuItems(allCommands);

            const menulistXUL = `
            <menulist id="chain-command-selector">
              <menupopup>${menuitemsXUL}</menupopup>
            </menulist>`;

            try {
              const menulistElement = parseElement(menulistXUL, "xul");
              placeholder.replaceWith(menulistElement);
              debugLog("Chain editor: XUL menulist successfully created and inserted.");
            } catch (e) {
              debugLog("Chain editor: Failed to parse or insert XUL menulist.", e);
              placeholder.textContent = "Error creating command list.";
            }
          })
          .catch((err) => {
            debugLog("Chain editor: getAllCommandsForConfig promise rejected.", err);
            const placeholder = editorContainer.querySelector("#chain-command-selector-placeholder");
            if (placeholder) {
              placeholder.textContent = "Error loading commands.";
            }
          });

        // Initial render of the chain list
        renderChainList();
      }
    },

    _hideCustomCommandEditor() {
      const editorContainer = this._modalElement?.querySelector("#custom-command-editor");
      if (editorContainer && this._boundEditorClickHandler) {
        editorContainer.removeEventListener("click", this._boundEditorClickHandler);
        this._boundEditorClickHandler = null;
      }

      this._modalElement.querySelector("#custom-commands-view").hidden = false;
      this._modalElement.querySelector("#custom-command-editor").hidden = true;
      this._renderCustomCommands();
    },

    _saveCustomCommand(cmd, currentChain) {
      const editor = this._modalElement.querySelector("#custom-command-editor");
      const name = editor.querySelector("#custom-cmd-name").value.trim();
      let icon = editor.querySelector("#custom-cmd-icon").value.trim();

      if (!name) {
        alert("Command name cannot be empty.");
        return;
      }

      if (icon.startsWith("<svg") && icon.endsWith("</svg>")) {
        icon = svgToUrl(icon);
      }

      const newCmd = { ...cmd, name, icon: icon || undefined };

      if (cmd.type === "js") {
        const code = editor.querySelector("#custom-cmd-code").value;
        newCmd.code = code;
      } else {
        newCmd.commands = currentChain;
      }

      const commands = this._currentSettings.customCommands || [];
      const existingIndex = commands.findIndex((c) => c.id === cmd.id);

      if (existingIndex > -1) {
        commands[existingIndex] = newCmd;
      } else {
        commands.push(newCmd);
      }
      this._currentSettings.customCommands = commands;
      this._hideCustomCommandEditor();
    },

    _populateHelpTab() {
      const container = this._modalElement.querySelector("#help-tab-content");
      container.innerHTML = "";

      const helpItems = [
        {
          url: "https://github.com/BibekBhusal0/zen-custom-js/tree/main/command-palette",
          icon: svgToUrl(icons["book"]),
          title: "View Documentation",
          description: "Read the full guide on GitHub.",
        },
        {
          url: "https://github.com/BibekBhusal0/zen-custom-js",
          icon: svgToUrl(icons["star"]),
          title: "Star on GitHub",
          description: "Enjoying the mod? Leave a star!",
        },
        {
          url: "https://github.com/BibekBhusal0/zen-custom-js/issues/new",
          icon: svgToUrl(icons["bug"]),
          title: "Report a Bug",
          description: "Found an issue? Let us know.",
        },
        {
          url: "https://github.com/BibekBhusal0/zen-custom-js/issues/22",
          icon: "chrome://browser/skin/trending.svg",
          title: "More Commands",
          description: "Want more commands? Share your ideas here.",
        },
      ];

      const buttonsContainer = parseElement(`<div class="help-buttons-container"></div>`);

      for (const item of helpItems) {
        const buttonHtml = `
        <button class="help-button" data-url="${escapeXmlAttribute(item.url)}">
          <img src="${escapeXmlAttribute(item.icon)}" />
          <span>${escapeXmlAttribute(item.title)}</span>
          <p>${escapeXmlAttribute(item.description)}</p>
        </button>
      `;
        buttonsContainer.appendChild(parseElement(buttonHtml));
      }

      container.appendChild(buttonsContainer);
    },

    _populateSettingsTab() {
      const container = this._modalElement.querySelector("#settings-tab-content");
      container.innerHTML = "";

      const dynamicCommandItems = this._mainModule._dynamicCommandProviders
        .filter((provider) => provider.pref)
        .map((provider) => ({
          key: provider.pref,
          label: this._mainModule._getProviderLabel(provider.func.name),
          type: "bool",
        }));

      const prefs = [
        {
          section: "General",
          items: [
            {
              key: Prefs.KEYS.PREFIX,
              label: "Command Prefix",
              type: "char",
            },
            {
              key: Prefs.KEYS.PREFIX_REQUIRED,
              label: "Require prefix to activate",
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
          items: dynamicCommandItems,
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
          } else if (item.type === "char") {
            itemHtml = `
            <div class="setting-item">
              <label for="${safeId}">${escapeXmlAttribute(item.label)}</label>
              <input type="text" id="${safeId}" data-pref="${item.key}" value="${escapeXmlAttribute(
                currentValue
              )}" maxlength="1" />
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
            <button class="cmd-settings-tab" data-tab="custom-commands">Custom Commands</button>
            <button class="cmd-settings-tab" data-tab="help">Help</button>
          </div>
          <div class="cmd-settings-content">
            <div id="commands-tab-content" class="cmd-settings-tab-content" hidden>
              <div class="search-bar-wrapper">
                <input type="text" id="command-search-input" placeholder="Search commands..." />
              </div>
              <div id="commands-list"></div>
            </div>
            <div id="settings-tab-content" class="cmd-settings-tab-content" hidden>
              <!-- Content will be populated by _populateSettingsTab -->
            </div>
            <div id="custom-commands-tab-content" class="cmd-settings-tab-content" hidden>
              <!-- Content will be populated by _populateCustomCommandsTab -->
            </div>
            <div id="help-tab-content" class="cmd-settings-tab-content" hidden>
              <!-- Content will be populated by _populateHelpTab -->
            </div>
          </div>
        </div>
      </div>
    `;
      return parseElement(html);
    },
  };

  const KEY_MAP = {
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
    f13: "VK_F13",
    f14: "VK_F14",
    f15: "VK_F15",
    f16: "VK_F16",
    f17: "VK_F17",
    f18: "VK_F18",
    f19: "VK_F19",
    f20: "VK_F20",
    f21: "VK_F21",
    f22: "VK_F22",
    f23: "VK_F23",
    f24: "VK_F24",
    tab: "VK_TAB",
    enter: "VK_RETURN",
    escape: "VK_ESCAPE",
    space: "VK_SPACE",
    arrowleft: "VK_LEFT",
    arrowright: "VK_RIGHT",
    arrowup: "VK_UP",
    arrowdown: "VK_DOWN",
    delete: "VK_DELETE",
    backspace: "VK_BACK",
    home: "VK_HOME",
    num_lock: "VK_NUMLOCK",
    scroll_lock: "VK_SCROLL",
  };

  Object.fromEntries(
    Object.entries(KEY_MAP).map(([key, value]) => [value, key])
  );

  /**
   * Parses a shortcut string (e.g., "Ctrl+Shift+K") into an object for a <key> element.
   * @param {string} str - The shortcut string.
   * @returns {{key: string|null, keycode: string|null, modifiers: string}}
   */
  function parseShortcutString(str) {
    if (!str) return {};
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

    const keycode = KEY_MAP[keyPart] || null;
    const key = keycode ? null : keyPart;

    return {
      key: key,
      keycode: keycode,
      modifiers: Object.entries(modifiers)
        .filter(([, val]) => val)
        .map(([mod]) => mod)
        .join(","),
    };
  }

  const ZenCommandPalette = {
    /**
     * An array of dynamic command providers. Each provider is an object
     * containing a function to generate commands and an optional preference for enabling/disabling.
     * If `pref` is null, the commands will always be included.
     * If `pref` is a string, commands will only be included if the corresponding value in `Prefs` is true.
     * @type {Array<{func: Function, pref: string|null}>}
     */
    _dynamicCommandProviders: [
      {
        func: generateCustomCommands,
        pref: null,
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
        func: generateSineCommands,
        pref: Prefs.KEYS.DYNAMIC_SINE_MODS,
        allowIcons: false,
        allowShortcuts: false,
      },
      {
        func: generateWorkspaceMoveCommands,
        pref: Prefs.KEYS.DYNAMIC_WORKSPACES,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateFolderCommands,
        pref: Prefs.KEYS.DYNAMIC_FOLDERS,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateActiveTabCommands,
        pref: Prefs.KEYS.DYNAMIC_ACTIVE_TABS,
        allowIcons: false,
        allowShortcuts: false,
      },
      {
        func: generateContainerTabCommands,
        pref: Prefs.KEYS.DYNAMIC_CONTAINER_TABS,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateUnloadTabCommands,
        pref: Prefs.KEYS.DYNAMIC_UNLOAD_TABS,
        allowIcons: false,
        allowShortcuts: false,
      },
      {
        func: generateAboutPageCommands,
        pref: Prefs.KEYS.DYNAMIC_ABOUT_PAGES,
        allowIcons: true,
        allowShortcuts: true,
      },
      {
        func: generateExtensionCommands,
        pref: Prefs.KEYS.DYNAMIC_EXTENSIONS,
        allowIcons: false,
        allowShortcuts: true,
      },
      {
        func: generateExtensionEnableDisableCommands,
        pref: Prefs.KEYS.DYNAMIC_EXTENSION_ENABLE_DISABLE,
        allowIcons: false,
        allowShortcuts: false,
      },
      {
        func: generateExtensionUninstallCommands,
        pref: Prefs.KEYS.DYNAMIC_EXTENSION_UNINSTALL,
        allowIcons: false,
        allowShortcuts: false,
      },
    ],
    staticCommands: commands,
    provider: null,
    Settings: null,
    _recentCommands: [],
    MAX_RECENT_COMMANDS: 20,
    _dynamicCommandsCache: null,
    _userConfig: {},
    _closeListenersAttached: false,
    _globalActions: null,

    safeStr(x) {
      return (x || "").toString();
    },

    clearDynamicCommandsCache() {
      this._dynamicCommandsCache = null;
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

      const existingIndex = this._recentCommands.indexOf(cmd.key);
      if (existingIndex > -1) {
        this._recentCommands.splice(existingIndex, 1);
      }
      this._recentCommands.unshift(cmd.key);
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
          isVisible = !!cmd.condition(window);
        } else if (cmd.condition !== undefined) {
          isVisible = cmd.condition !== false;
        }

        // If the command relies on a native <command> element (has no custom function),
        // its visibility is also determined by the element's state.
        if (isVisible && typeof cmd.command !== "function") {
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

      if (targetLower === queryLower) {
        return 200;
      }

      if (targetLower.startsWith(queryLower)) {
        return 100 + queryLen;
      }

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
          if (targetIndex === 0 || [" ", "-", "_"].includes(targetLower[targetIndex - 1])) {
            bonus += 15;
          }
          if (lastMatchIndex === targetIndex - 1) {
            consecutiveMatches++;
            bonus += 20 * consecutiveMatches;
          } else {
            consecutiveMatches = 0;
          }
          if (lastMatchIndex !== -1) {
            const distance = targetIndex - lastMatchIndex;
            bonus -= Math.min(distance - 1, 10);
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
    async generateLiveCommands(useCache = true, isPrefixMode = false) {
      let dynamicCommands;
      if (useCache && this._dynamicCommandsCache) {
        dynamicCommands = this._dynamicCommandsCache;
      } else {
        const commandSets = await Promise.all(
          this._dynamicCommandProviders.map(async (provider) => {
            const shouldLoad =
              provider.pref === null ? true : provider.pref ? Prefs.getPref(provider.pref) : false;
            if (!shouldLoad) return [];
            try {
              const commands = await provider.func();
              return commands.map((c) => ({ ...c, providerFunc: provider.func }));
            } catch (e) {
              debugError(`Error executing dynamic provider ${provider.func.name}`, e);
              return [];
            }
          })
        );
        dynamicCommands = commandSets.flat();
        if (useCache) {
          this._dynamicCommandsCache = dynamicCommands;
        }
      }

      let allCommands = [...commands, ...dynamicCommands];

      if (isPrefixMode && this._globalActions) {
        const nativeCommands = this._globalActions
          .filter((a) => a.commandId)
          .map((a) => ({
            key: a.commandId,
            label: a.label,
            icon: this._userConfig.customIcons?.[a.commandId] || a.icon,
            isNative: true,
            command: a.command,
            condition: a.isAvailable,
          }));
        allCommands.push(...nativeCommands);
      }

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
      // 1. Get all commands from the mod (static and dynamic)
      const modCommands = await this.generateLiveCommands(false); // Force fresh generation
      const liveCommands = modCommands.map((c) => {
        if (c.providerFunc) {
          const provider = this._dynamicCommandProviders.find((p) => p.func === c.providerFunc);
          if (provider) {
            return {
              ...c,
              isDynamic: true,
              providerPref: provider.pref,
              providerLabel: this._getProviderLabel(provider.func.name),
              allowIcons: c.allowIcons ?? provider.allowIcons,
              allowShortcuts: c.allowShortcuts ?? provider.allowShortcuts,
            };
          }
        }
        // It's a static command if it doesn't have a providerFunc
        return { ...c, isDynamic: false, allowIcons: true, allowShortcuts: true };
      });

      // 2. Get all native Zen commands
      if (this._globalActions) {
        const nativeCommands = this._globalActions
          .filter((a) => a.commandId)
          .map((a) => ({
            key: a.commandId,
            label: a.label,
            icon: this._userConfig.customIcons?.[a.commandId] || a.icon,
            isNative: true,
            allowIcons: true,
            allowShortcuts: true,
            command: a.command,
          }));
        liveCommands.push(...nativeCommands);
      }

      // 3. Apply custom icons (for mod commands)
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
      const isCommandPrefix = query.startsWith(Prefs.prefix);
      if (isCommandPrefix) {
        query = query.substring(1).trim();
      }
      if (isCommandPrefix && !query) {
        return [];
      }
      if (!isCommandPrefix && query.length < Prefs.minQueryLength) {
        return [];
      }
      if (!query) {
        return [];
      }
      const lowerQuery = query.toLowerCase();

      const scoredCommands = allCommands
        .map((cmd) => {
          const label = cmd.label || "";
          const key = cmd.key || "";
          const tags = (cmd.tags || []).join(" ");
          const labelScore = this.calculateFuzzyScore(label, lowerQuery);
          const keyScore = this.calculateFuzzyScore(key, lowerQuery);
          const tagsScore = this.calculateFuzzyScore(tags, lowerQuery);
          let recencyBonus = 0;
          const recentIndex = this._recentCommands.indexOf(cmd.key);
          if (recentIndex > -1) {
            recencyBonus = (this.MAX_RECENT_COMMANDS - recentIndex) * 2;
          }
          const score = Math.max(labelScore * 1.5, keyScore, tagsScore * 0.5) + recencyBonus;
          return { cmd, score };
        })
        .filter((item) => item.score >= Prefs.minScoreThreshold)
        .filter((item) => this.commandIsVisible(item.cmd));

      scoredCommands.sort((a, b) => b.score - a.score);
      const finalCmds = scoredCommands.map((item) => item.cmd);

      if (isCommandPrefix) {
        return finalCmds.slice(0, Prefs.maxCommandsPrefix);
      }
      return finalCmds.slice(0, Prefs.maxCommands);
    },

    /**
     * Finds a command by its key and executes it.
     * @param {string} key - The key of the command to execute.
     */
    executeCommandByKey(key) {
      if (!key) return;

      let cmdToExecute;
      const nativeAction = this._globalActions?.find((a) => a.commandId === key);

      if (nativeAction) {
        cmdToExecute = { key: nativeAction.commandId, command: nativeAction.command };
      } else {
        const findInCommands = (arr) => arr?.find((c) => c.key === key);
        cmdToExecute = findInCommands(commands) || findInCommands(this._dynamicCommandsCache);
      }

      if (cmdToExecute) {
        debugLog("Executing command via key:", key);
        this.addRecentCommand(cmdToExecute);
        if (typeof cmdToExecute.command === "function") {
          cmdToExecute.command(window);
        } else {
          const commandEl = document.getElementById(cmdToExecute.key);
          if (commandEl?.doCommand) {
            commandEl.doCommand();
          } else {
            debugError(`Command element not found for key: ${key}`);
          }
        }
      } else {
        debugError(`executeCommandByKey: Command with key "${key}" could not be found.`);
      }
    },

    async addWidget(key) {
      debugLog(`addWidget called for key: ${key}`);
      const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
      const widgetId = `zen-cmd-palette-widget-${sanitizedKey}`;

      const existingWidget = document.getElementById(widgetId);
      if (existingWidget) {
        existingWidget.hidden = false;
        debugLog(`Widget "${widgetId}" already exists, un-hiding it.`);
        return;
      }

      const allCommands = await this.getAllCommandsForConfig();
      const cmd = allCommands.find((c) => c.key === key);
      if (!cmd) {
        debugLog(`addWidget: Command with key "${key}" not found.`);
        return;
      }

      try {
        UC_API.Utils.createWidget({
          id: widgetId,
          type: "toolbarbutton",
          label: cmd.label,
          tooltip: cmd.label,
          class: "toolbarbutton-1 chromeclass-toolbar-additional zen-command-widget",
          image: cmd.icon || "chrome://browser/skin/trending.svg",
          callback: () => this.executeCommandByKey(key),
        });
        debugLog(`Successfully created widget "${widgetId}" for command: ${key}`);
      } catch (e) {
        debugError(`Failed to create widget for ${key}:`, e);
      }
    },

    removeWidget(key) {
      debugLog(`removeWidget: Hiding widget for key: ${key}`);
      const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
      const widgetId = `zen-cmd-palette-widget-${sanitizedKey}`;
      const widget = document.getElementById(widgetId);
      if (widget) {
        widget.hidden = true;
        debugLog(`Successfully hid widget: ${widgetId}`);
      } else {
        debugLog(`removeWidget: Widget "${widgetId}" not found, nothing to hide.`);
      }
    },

    async addHotkey(commandKey, shortcutStr) {
      debugLog(`addHotkey called for command "${commandKey}" with shortcut "${shortcutStr}"`);
      const { key, keycode, modifiers } = parseShortcutString(shortcutStr);
      const useKey = key || keycode;
      if (!useKey) {
        debugError(`addHotkey: Invalid shortcut string "${shortcutStr}" for command "${commandKey}"`);
        return;
      }

      const translatedModifiers = modifiers.replace(/accel/g, "ctrl").replace(/,/g, " ");
      try {
        const hotkey = {
          id: `zen-cmd-palette-shortcut-for-${commandKey}`,
          modifiers: translatedModifiers,
          key: useKey,
          command: () => this.executeCommandByKey(commandKey),
        };
        const registeredHotkey = await UC_API.Hotkeys.define(hotkey);
        if (registeredHotkey) {
          registeredHotkey.autoAttach({ suppressOriginal: true });
          debugLog(`Successfully defined hotkey for command "${commandKey}"`);
        }
      } catch (e) {
        debugError(`Failed to register new shortcut for ${commandKey}:`, e);
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
      return shortcut ? shortcut.toDisplayString() : null;
    },

    attachUrlbarCloseListeners() {
      if (this._closeListenersAttached) {
        return;
      }

      const onUrlbarClose = () => {
        const isPrefixModeActive = this.provider?._isInPrefixMode ?? false;
        if (this.provider) this.provider.dispose();
        if (isPrefixModeActive) gURLBar.value = "";
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
      this.clearDynamicCommandsCache();
      debugLog("User config loaded:", this._userConfig);
      this.applyNativeIconOverrides();
    },

    /**
     * Applies user-configured settings, such as custom shortcuts.
     */
    applyUserConfig() {
      this.applyCustomShortcuts();
      this.applyToolbarButtons();
      this.applyNativeIconOverrides();
    },

    applyNativeIconOverrides() {
      if (this._globalActions && this._userConfig.customIcons) {
        for (const action of this._globalActions) {
          if (action.commandId && this._userConfig.customIcons[action.commandId]) {
            action.icon = this._userConfig.customIcons[action.commandId];
          }
        }
        debugLog("Applied native icon overrides.");
      }
    },

    /**
     * Creates <key> elements for custom shortcuts and adds them to the document.
     */
    async applyCustomShortcuts() {
      if (!this._userConfig.customShortcuts) {
        debugLog("No custom shortcuts to apply on initial load.");
        return;
      }

      for (const [commandKey, shortcutStr] of Object.entries(this._userConfig.customShortcuts)) {
        if (!shortcutStr) continue;
        await this.addHotkey(commandKey, shortcutStr);
      }
      debugLog("Applied initial custom shortcuts.");
    },

    async applyToolbarButtons() {
      if (!this._userConfig?.toolbarButtons) {
        debugLog("No toolbar buttons to apply on initial load.");
        return;
      }

      for (const key of this._userConfig.toolbarButtons) {
        await this.addWidget(key);
      }
      debugLog("Applied initial toolbar buttons.");
    },

    destroy() {
      if (this.provider) {
        const { UrlbarProvidersManager } = ChromeUtils.importESModule(
          "resource:///modules/UrlbarProvidersManager.sys.mjs"
        );
        UrlbarProvidersManager.unregisterProvider(this.provider);
        this.provider = null;
        debugLog("Urlbar provider unregistered.");
      }
    },

    /**
     * Initializes the command palette by creating and registering the UrlbarProvider.
     * This is the main entry point for the script.
     */
    async init() {
      debugLog("Starting ZenCommandPalette init...");

      try {
        const { globalActions } = ChromeUtils.importESModule(
          "resource:///modules/ZenUBGlobalActions.sys.mjs"
        );
        this._globalActions = globalActions;
      } catch (e) {
        debugError("Could not load native globalActions, native commands will be unavailable.", e);
      }

      this.Settings = SettingsModal;
      this.Settings.init(this);
      debugLog("Settings modal initialized.");

      await this.loadUserConfig();
      this.applyUserConfig();
      debugLog("User config loaded and applied.");

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
      debugLog("Urlbar modules imported.");

      const DYNAMIC_TYPE_NAME = "ZenCommandPalette";
      UrlbarResult.addDynamicResultType(DYNAMIC_TYPE_NAME);
      debugLog(`Dynamic result type "${DYNAMIC_TYPE_NAME}" added.`);

      try {
        const self = this;
        class ZenCommandProvider extends UrlbarProvider {
          _isInPrefixMode = false;

          get name() {
            return "TestProvider";
          }
          get type() {
            return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
          }
          getPriority(context) {
            const input = (context.searchString || "").trim();
            return input.startsWith(Prefs.prefix) ? 10000 : 0;
          }

          async isActive(context) {
            try {
              const input = (context.searchString || "").trim();
              const isPrefixSearch = input.startsWith(Prefs.prefix);

              if (this._isInPrefixMode && !isPrefixSearch) {
                this._isInPrefixMode = false;
                Prefs.resetTempMaxRichResults();
              }

              const inSearchMode =
                !!context.searchMode?.engineName || !!gURLBar.searchMode?.engineName;
              if (inSearchMode) {
                return false;
              }

              if (isPrefixSearch) return true;
              if (Prefs.prefixRequired) return false;

              if (input.length >= Prefs.minQueryLength) {
                const liveCommands = await self.generateLiveCommands(true, isPrefixSearch);
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
              const input = (context.searchString || "").trim();
              debugLog(`startQuery for: "${input}"`);

              const isPrefixSearch = input.startsWith(Prefs.prefix);
              const query = isPrefixSearch ? input.substring(1).trim() : input.trim();

              this._isInPrefixMode = isPrefixSearch;

              if (isPrefixSearch) Prefs.setTempMaxRichResults(Prefs.maxCommandsPrefix);
              else Prefs.resetTempMaxRichResults();

              if (context.canceled) return;

              const liveCommands = await self.generateLiveCommands(true, isPrefixSearch);
              if (context.canceled) return;

              const addResult = (cmd, isHeuristic = false) => {
                if (!cmd) return;
                const shortcut = self.getShortcutForCommand(cmd.key);
                const [payload, payloadHighlights] = UrlbarResult.payloadAndSimpleHighlights([], {
                  suggestion: cmd.label,
                  title: cmd.label,
                  query: input,
                  keywords: cmd?.tags,
                  icon: cmd.icon || "chrome://browser/skin/trending.svg",
                  shortcutContent: shortcut,
                  dynamicType: DYNAMIC_TYPE_NAME,
                });
                const result = new UrlbarResult(
                  UrlbarUtils.RESULT_TYPE.DYNAMIC,
                  UrlbarUtils.RESULT_SOURCE.OTHER_LOCAL,
                  payload,
                  payloadHighlights
                );
                if (isHeuristic) result.heuristic = true;
                result._zenCmd = cmd;
                add(this, result);
                return true;
              };

              if (isPrefixSearch && !query) {
                let count = 0;
                const maxResults = Prefs.maxCommandsPrefix;
                const recentCmds = self._recentCommands
                  .map((key) => liveCommands.find((c) => c.key === key))
                  .filter(Boolean)
                  .filter((cmd) => self.commandIsVisible(cmd));

                for (const cmd of recentCmds) {
                  if (context.canceled || count >= maxResults) break;
                  addResult(cmd, count === 0);
                  count++;
                }

                if (count < maxResults) {
                  const recentKeys = new Set(self._recentCommands);
                  const otherCmds = liveCommands.filter(
                    (c) => !recentKeys.has(c.key) && self.commandIsVisible(c)
                  );
                  for (const cmd of otherCmds) {
                    if (context.canceled || count >= maxResults) break;
                    addResult(cmd, count === 0);
                    count++;
                  }
                }

                if (count === 0 && !context.canceled) {
                  addResult({
                    key: "no-results",
                    label: "No available commands",
                    command: () => self._closeUrlBar(),
                    icon: "chrome://browser/skin/zen-icons/info.svg",
                  });
                }
                return;
              }

              const matches = self.filterCommandsByInput(input, liveCommands);

              if (!matches.length && isPrefixSearch) {
                addResult({
                  key: "no-results",
                  label: "No matching commands found",
                  command: () => self._closeUrlBar(),
                  icon: "chrome://browser/skin/zen-icons/info.svg",
                });
                return;
              }

              matches.forEach((cmd, index) => addResult(cmd, index === 0));
            } catch (e) {
              debugError("startQuery unexpected error:", e);
            }
          }

          dispose() {
            Prefs.resetTempMaxRichResults();
            this._isInPrefixMode = false;
            setTimeout(() => {
              self.clearDynamicCommandsCache();
            }, 0);
          }

          onEngagement(queryContext, controller, details) {
            const cmd = details.result._zenCmd;
            if (cmd) {
              debugLog("Executing command from onEngagement:", cmd.key);
              self._closeUrlBar();
              self.addRecentCommand(cmd);
              setTimeout(() => self.executeCommandByKey(cmd.key), 0);
            }
          }

          getViewUpdate(result) {
            return {
              icon: { attributes: { src: result.payload.icon } },
              titleStrong: { textContent: result.payload.title },
              shortcutContent: { textContent: result.payload.shortcutContent || "" },
            };
          }

          getViewTemplate() {
            return {
              attributes: { selectable: true },
              children: [
                { name: "icon", tag: "img", classList: ["urlbarView-favicon"] },
                {
                  name: "title",
                  tag: "span",
                  classList: ["urlbarView-title"],
                  children: [{ name: "titleStrong", tag: "strong" }],
                },
                { name: "shortcutContent", tag: "span", classList: ["urlbarView-shortcutContent"] },
              ],
            };
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
      this.clearDynamicCommandsCache();
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
        "items. total static commands:",
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
        this.clearDynamicCommandsCache();
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
      this.clearDynamicCommandsCache();
    },
  };

  // Initialization
  UC_API.Runtime.startupFinished().then(() => {
    Prefs.setInitialPrefs();
    window.ZenCommandPalette = ZenCommandPalette;
    ZenCommandPalette.init();

    debugLog(
      "Zen Command Palette initialized. Static commands count:",
      window.ZenCommandPalette.staticCommands.length
    );
  });

  exports.ZenCommandPalette = ZenCommandPalette;

}));
