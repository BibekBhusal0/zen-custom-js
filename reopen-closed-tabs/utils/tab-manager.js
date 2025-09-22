import { debugLog, debugError } from "./prefs.js";

// ZenPinnedTabManager and ZenFolders are assumed to be globally available as gZenPinnedTabManager and gZenFolders.

const TabManager = {
  /**
   * Fetches a list of recently closed tabs.
   * @returns {Promise<Array<object>>} A promise resolving to an array of closed tab data.
   */
  async getRecentlyClosedTabs() {
    debugLog("Fetching recently closed tabs.");
    try {
      if (typeof SessionStore !== 'undefined' && SessionStore.getClosedTabData) {
        const closedTabsData = SessionStore.getClosedTabData(window); // window is the current browser window
        const closedTabs = closedTabsData.map((tab, index) => ({
            url: tab.url,
            title: tab.title,
            isClosed: true,
            sessionData: tab,
            sessionIndex: index
        }));
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

  /**
   * Fetches a list of currently open tabs across all browser windows.
   * Includes information about pinned, essential, and folder status.
   * @returns {Promise<Array<object>>} A promise resolving to an array of open tab data.
   */
  async getOpenTabs() {
    debugLog("Fetching open tabs.");
    const openTabs = [];
    try {
      const enumerator = Services.wm.getEnumerator("navigator:browser");
      while (enumerator.hasMoreElements()) {
        const win = enumerator.getNext();
        const gBrowser = win.gBrowser;

        for (let i = 0; i < gBrowser.tabs.length; i++) {
          const tab = gBrowser.tabs[i];
          const browser = tab.linkedBrowser;

          const tabInfo = {
            id: tab.id,
            url: browser.currentURI.spec,
            title: browser.contentTitle,
            isPinned: tab.pinned,
            isEssential: tab.hasAttribute('zen-essential'),
            folder: null,
            isClosed: false,
          };

          // TODO: Consider if gZenPinnedTabManager offers additional relevant APIs for tab status.

          // Check folder status using global gZenFolders
          if (typeof gZenFolders !== 'undefined' && tab.group && tab.group.isZenFolder) {
            tabInfo.folder = tab.group.name;
          }
          openTabs.push(tabInfo);
        }
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
   * @param {string} tabData.url - The URL of the tab.
   * @param {string} [tabData.id] - The ID of the tab if it's currently open.
   * @param {boolean} [tabData.isClosed] - True if the tab was recently closed.
   */
  reopenTab(tabData) {
    debugLog("Reopening tab:", tabData);
    try {
      if (tabData && tabData.url) {
        // If the tab is already open, switch to it and focus its window.
        if (!tabData.isClosed && tabData.id) {
            // Check if the tab is in the current window first
            const targetTabInCurrentWindow = gBrowser.getTabForBrowser(gBrowser.getBrowserForTabId(tabData.id));
            if (targetTabInCurrentWindow) {
                gBrowser.selectedTab = targetTabInCurrentWindow;
                window.focus(); // Focus the current window
                return;
            }

            // If not in current window, iterate through all other windows
            const enumerator = Services.wm.getEnumerator("navigator:browser");
            while (enumerator.hasMoreElements()) {
                const win = enumerator.getNext();
                // Skip the current window as it has already been checked.
                if (win === window) continue;

                const winGBrowser = win.gBrowser;
                const targetTab = winGBrowser.getTabForBrowser(winGBrowser.getBrowserForTabId(tabData.id));
                if (targetTab) {
                    winGBrowser.selectedTab = targetTab;
                    win.focus(); // Focus the window where the tab is found.
                    return;
                }
            }
        }

        // If it's a closed tab, try to restore it using undoCloseTab.
        if (tabData.isClosed && tabData.sessionIndex !== undefined) {
            undoCloseTab(window, tabData.sessionIndex); // window is the current browser window
            return;
        }

        // If the tab is closed but no sessionIndex, or an open tab not found, open a new tab.
        const newTab = gBrowser.addTab(tabData.url);
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
