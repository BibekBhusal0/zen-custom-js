import { debugLog, debugError } from "./prefs.js";

const TabManager = {
  /**
   * Fetches a list of recently closed tabs.
   * @returns {Promise<Array<object>>} A promise resolving to an array of closed tab data.
   */
  async getRecentlyClosedTabs() {
    debugLog("Fetching recently closed tabs.");
    try {
      if (typeof SessionStore !== 'undefined' && SessionStore.getClosedTabData) {
        const closedTabsData = SessionStore.getClosedTabData(window);
        const closedTabs = closedTabsData.map((tab, index) => {
          const url = tab.state.entries[0]?.url;
          return {
            url: url,
            title: tab.title || tab.state.entries[0]?.title,
            isClosed: true,
            sessionData: tab,
            sessionIndex: index,
            faviconUrl: tab.image
          };
        });
        debugLog("Recently closed tabs fetched:", closedTabs);
        return closedTabs;
      } else {
        debugError("SessionStore.getClosedTabData not available.");
        return [];
      }
    } catch (e) {
      debugError("Error fetching recently closed tabs:", e);
      return [];
    }
  },

  _getFolderBreadcrumbs(group) {
    const path = [];
    let currentGroup = group;
    while (currentGroup && currentGroup.isZenFolder) {
        path.unshift(currentGroup.label);
        currentGroup = currentGroup.group;
    }
    return path.join(' / ');
  },

  /**
   * Fetches a list of currently open tabs across all browser windows and workspaces.
   * @returns {Promise<Array<object>>} A promise resolving to an array of open tab data.
   */
  async getOpenTabs() {
    debugLog("Fetching open tabs.");
    const openTabs = [];
    try {
      const workspaceTabs = gZenWorkspaces.allStoredTabs;
      const essentialTabs = Array.from(document.querySelectorAll('tab[zen-essential="true"]'));
      const allTabs = [...new Set([...workspaceTabs, ...essentialTabs])];

      for (const tab of allTabs) {
        if (tab.hasAttribute("zen-empty-tab") || tab.closing) continue;

        const browser = tab.linkedBrowser;
        const win = tab.ownerGlobal;
        const workspaceId = tab.getAttribute('zen-workspace-id');
        const workspace = workspaceId && win.gZenWorkspaces.getWorkspaceFromId(workspaceId);
        const folder = tab.group?.isZenFolder ? this._getFolderBreadcrumbs(tab.group) : null;

        const tabInfo = {
          id: tab.id,
          url: browser.currentURI.spec,
          title: browser.contentTitle || tab.label,
          isPinned: tab.pinned,
          isEssential: tab.hasAttribute('zen-essential'),
          folder: folder,
          workspace: workspace?.name,
          isClosed: false,
          faviconUrl: tab.image,
          tabElement: tab
        };

        openTabs.push(tabInfo);
      }
      debugLog("Open tabs fetched:", openTabs);
      return openTabs;
    } catch (e) {
      debugError("Error fetching open tabs:", e);
      return [];
    }
  },

  /**
   * Reopens a tab based on its data.
   * If the tab is already open, it switches to it. Otherwise, it opens a new tab.
   * @param {object} tabData - The data of the tab to reopen.
   */
  async reopenTab(tabData) {
    debugLog("Reopening tab:", tabData);
    try {
      // If the tab is already open, switch to it.
      if (!tabData.isClosed && tabData.tabElement) {
        const tab = tabData.tabElement;
        const win = tab.ownerGlobal;
        win.gZenWorkspaces.switchTabIfNeeded(tab);
        return;
      }

      // If it's a closed tab, manually restore it.
      if (tabData.isClosed && tabData.sessionData) {
        const tabState = tabData.sessionData.state;
        const url = tabState.entries[0]?.url;
        if (!url) {
            debugError("Cannot reopen tab: URL not found in session data.", tabData);
            return;
        }

        const newTab = gBrowser.addTab(url, {
            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
            userContextId: tabState.userContextId || 0,
            skipAnimation: true
        });
        gBrowser.selectedTab = newTab;

        const workspaceId = tabState.zenWorkspace;
        const activeWorkspaceId = gZenWorkspaces.activeWorkspace;

        // Switch workspace if necessary
        if (workspaceId && workspaceId !== activeWorkspaceId) {
            await gZenWorkspaces.changeWorkspaceWithID(workspaceId);
            gZenWorkspaces.moveTabToWorkspace(newTab, workspaceId);
        }

        // Pin if it was previously pinned
        if (tabState.pinned) gBrowser.pinTab(newTab);

        // Restore to folder state
        const groupId = tabData.sessionData.closedInTabGroupId;
        if (groupId) {
            const folder = document.getElementById(groupId);
            if (folder && typeof folder.addTabs === 'function') {
                folder.addTabs([newTab]);
            }
        }
        gBrowser.selectedTab = newTab;
        return;
      }

      // Fallback for any other case.
      if (tabData.url) {
        const newTab = gBrowser.addTab(tabData.url, {
            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
        });
        gBrowser.selectedTab = newTab;
      } else {
        debugError("Cannot reopen tab: missing URL or session data.", tabData);
      }
    } catch (e) {
      debugError("Error reopening tab:", e);
    }
  },
};

export default TabManager;
