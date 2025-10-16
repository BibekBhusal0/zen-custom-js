import { Prefs, debugLog, debugError } from "./utils/prefs.js";
import { parseShortcutString } from "../utils/keyboard.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { timeAgo } from "../utils/timesAgo.js";
import TabManager from "./utils/tab-manager.js";

const ReopenClosedTabs = {
  _boundToggleMenu: null,
  _boundHandleItemClick: null,
  _allTabsCache: [],
  _registeredHotkey: null,

  /**
   * Initializes the Reopen Closed Tabs mod.
   */
  async init() {
    debugLog("Initializing mod.");
    Prefs.setInitialPrefs();
    this._boundToggleMenu = this.toggleMenu.bind(this);
    this._boundHandleItemClick = this._handleItemClick.bind(this);
    this._registerKeyboardShortcut();
    this._registerToolbarButton();
    UC_API.Prefs.addListener(Prefs.SHORTCUT_KEY, this.onHotkeyChange.bind(this));
    debugLog("Mod initialized.");
  },

  async _registerKeyboardShortcut() {
    const shortcutString = Prefs.shortcutKey;
    if (!shortcutString) {
      debugLog("No shortcut key defined.");
      return;
    }

    const { key, modifiers } = parseShortcutString(shortcutString);
    if (!key) {
      debugError("Invalid shortcut string:", shortcutString);
      return;
    }

    try {
      const translatedModifiers = modifiers.replace(/accel/g, "ctrl").replace(",", " ");

      const hotkey = {
        id: "reopen-closed-tabs-hotkey",
        modifiers: translatedModifiers,
        key: key,
        command: this._boundToggleMenu,
      };
      this._registeredHotkey = await UC_API.Hotkeys.define(hotkey);
      if (this._registeredHotkey) {
        this._registeredHotkey.autoAttach({ suppressOriginal: true });
        debugLog(`Registered shortcut: ${shortcutString}`);
      }
    } catch (e) {
      debugError("Failed to register keyboard shortcut:", e);
    }
  },

  onHotkeyChange() {
    // TODO: Figure out how to apply changes real time (without restart)
    if (window.ucAPI && typeof window.ucAPI.showToast === "function") {
      window.ucAPI.showToast(
        ["Hotkey Changed", "A restart is required for changes to take effect."],
        1 // Restart button preset
      );
    }
  },

  _registerToolbarButton() {
    const buttonId = "reopen-closed-tabs-button";

    try {
      UC_API.Utils.createWidget({
        id: buttonId,
        label: "Reopen Closed Tabs",
        tooltip: "View and reopen recently closed tabs",
        image: "chrome://browser/skin/zen-icons/history.svg",
        type: "toolbarbutton",
        callback: this.toggleMenu.bind(this),
      });
      debugLog(`Registered toolbar button: ${buttonId}`);
    } catch (e) {
      debugError("Failed to register toolbar button:", e);
    }
  },

  async toggleMenu(event) {
    debugLog("Toggle menu called.");
    let button;
    if (event && event.target && event.target.id === "reopen-closed-tabs-button") {
      button = event.target;
    } else {
      // Called from hotkey, find the button in the current window
      button = document.getElementById("reopen-closed-tabs-button");
    }

    if (!button) {
      debugError("Reopen Closed Tabs button not found.");
      return;
    }

    const panelId = "reopen-closed-tabs-panel";

    if (!button._reopenClosedTabsPanel) {
      // Create panel if it doesn't exist for this button
      const panel = parseElement(
        `
        <panel id="${panelId}" type="arrow">
        </panel>
      `,
        "xul"
      );

      const mainPopupSet = document.getElementById("mainPopupSet");
      if (mainPopupSet) {
        mainPopupSet.appendChild(panel);
        button._reopenClosedTabsPanel = panel; // Store panel on the button
        debugLog(`Created panel: ${panelId} for button: ${button.id}`);
      } else {
        debugError("Could not find #mainPopupSet to append panel.");
        return;
      }
    }

    const panel = button._reopenClosedTabsPanel;

    if (panel.state === "open") {
      panel.hidePopup();
    } else {
      await this._populatePanel(panel); // Pass the panel to populate
      panel.openPopup(button, "after_start", 0, 0, false, false);
    }
  },

  async _populatePanel(panel) {
    debugLog("Populating panel.");
    while (panel.firstChild) {
      panel.removeChild(panel.firstChild);
    }

    const mainVbox = parseElement(`<vbox flex="1"/>`, "xul");
    panel.appendChild(mainVbox);

    // Search bar
    const searchBox = parseElement(
      `
      <div id="reopen-closed-tabs-search-container">
        <img src="chrome://global/skin/icons/search-glass.svg" class="search-icon"/>
        <input id="reopen-closed-tabs-search-input" type="search" placeholder="Search tabs..."/>
      </div>
    `,
      "html"
    );
    mainVbox.appendChild(searchBox);

    const allItemsContainer = parseElement(
      `<vbox id="reopen-closed-tabs-list-container" flex="1" />`,
      "xul"
    );
    mainVbox.appendChild(allItemsContainer);

    const closedTabs = await TabManager.getRecentlyClosedTabs();
    const showOpenTabs = Prefs.showOpenTabs;
    let openTabs = [];

    if (showOpenTabs) {
      openTabs = await TabManager.getOpenTabs();
    }

    if (closedTabs.length > 0) {
      this._renderGroup(allItemsContainer, "Recently Closed", closedTabs);
    }

    if (openTabs.length > 0) {
      this._renderGroup(allItemsContainer, "Open Tabs", openTabs);
    }

    if (closedTabs.length === 0 && openTabs.length === 0) {
      const noTabsItem = parseElement(
        `<label class="reopen-closed-tab-item-disabled" value="No tabs to display."/>`,
        "xul"
      );
      allItemsContainer.appendChild(noTabsItem);
    }

    this._allTabsCache = [...closedTabs, ...openTabs];

    const firstItem = allItemsContainer.querySelector(".reopen-closed-tab-item");
    if (firstItem) {
      firstItem.setAttribute("selected", "true");
    }

    const searchInput = panel.querySelector("#reopen-closed-tabs-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => this._filterTabs(event.target.value, panel));
      searchInput.addEventListener("keydown", (event) => this._handleSearchKeydown(event, panel));
      panel.addEventListener(
        "popupshown",
        () => {
          searchInput.focus();
          const listContainer = panel.querySelector("#reopen-closed-tabs-list-container");
          if (listContainer) {
            listContainer.scrollTop = 0;
          }
        },
        { once: true }
      );
    }
  },

  _renderGroup(container, groupTitle, tabs) {
    const groupHeader = parseElement(
      `
      <hbox class="reopen-closed-tabs-group-header" align="center">
        <label value="${escapeXmlAttribute(groupTitle)}"/>
      </hbox>
    `,
      "xul"
    );
    container.appendChild(groupHeader);

    tabs.forEach((tab) => {
      this._renderTabItem(container, tab);
    });
  },

  _renderTabItem(container, tab) {
    const label = escapeXmlAttribute(tab.title || tab.url || "Untitled Tab");
    const url = escapeXmlAttribute(tab.url || "");
    const faviconSrc = escapeXmlAttribute(tab.faviconUrl || "chrome://branding/content/icon32.png");

    let iconHtml = "";
    if (tab.isEssential) {
      iconHtml = `<image class="tab-status-icon" src="chrome://browser/skin/zen-icons/essential-add.svg" />`;
    } else if (tab.isPinned) {
      iconHtml = `<image class="tab-status-icon" src="chrome://browser/skin/zen-icons/pin.svg" />`;
    }

    let contextParts = [];
    if (tab.isClosed) {
      if (tab.closedAt) {
        contextParts = ["Closed " + timeAgo(tab.closedAt)];
      }
    } else {
      if (tab.lastAccessed) contextParts.push(timeAgo(tab.lastAccessed));
      if (tab.workspace) contextParts.push(escapeXmlAttribute(tab.workspace));
      if (tab.folder) contextParts.push(escapeXmlAttribute(tab.folder));
    }
    const contextLabel = contextParts.join(" ● ");

    const tabItem = parseElement(
      `
      <hbox class="reopen-closed-tab-item" align="center" tooltiptext="${url}">
        <image class="tab-favicon" src="${faviconSrc}" />
        <vbox class="tab-item-labels" flex="1">
          <label class="tab-item-label" value="${label}"/>
          ${contextLabel ? `<label class="tab-item-context" value="${contextLabel}"/>` : ""}
        </vbox>
        <hbox class="tab-item-status-icons" align="center">
          ${iconHtml}
          ${tab.isClosed ? `<image class="close-button" src="chrome://global/skin/icons/close.svg" tooltiptext="Remove from list" />` : ""}
        </hbox>
      </hbox>
    `,
      "xul"
    );

    if (tab.isUnloaded) {
      tabItem.classList.add("unloaded-tab");
    }

    tabItem.tabData = tab;
    tabItem.addEventListener("click", this._boundHandleItemClick);
    const closeButton = tabItem.querySelector(".close-button");
    if (closeButton) {
      closeButton.addEventListener("click", (event) => this._handleRemoveTabClick(event, tabItem));
    }
    container.appendChild(tabItem);
  },

  _handleRemoveTabClick(event, tabItem) {
    event.stopPropagation();
    if (tabItem && tabItem.tabData && tabItem.tabData.isClosed) {
      TabManager.removeClosedTab(tabItem.tabData);
      tabItem.remove();
      this._allTabsCache = this._allTabsCache.filter((tab) => tab !== tabItem.tabData);
    } else {
      debugError("Cannot remove tab: Tab data not found or tab is not closed.", tabItem);
    }
  },

  _filterTabs(query, panel) {
    const lowerQuery = query.toLowerCase();
    const filteredTabs = this._allTabsCache.filter((tab) => {
      const title = (tab.title || "").toLowerCase();
      const url = (tab.url || "").toLowerCase();
      const workspace = (tab.workspace || "").toLowerCase();
      const folder = (tab.folder || "").toLowerCase();
      return (
        title.includes(lowerQuery) ||
        url.includes(lowerQuery) ||
        workspace.includes(lowerQuery) ||
        folder.includes(lowerQuery)
      );
    });

    const tabItemsContainer = panel.querySelector("#reopen-closed-tabs-list-container");
    if (tabItemsContainer) {
      while (tabItemsContainer.firstChild) {
        tabItemsContainer.removeChild(tabItemsContainer.firstChild);
      }
      if (filteredTabs.length === 0) {
        const noResultsItem = parseElement(
          `<label class="reopen-closed-tab-item-disabled" value="No matching tabs."/>`,
          "xul"
        );
        tabItemsContainer.appendChild(noResultsItem);
      } else {
        // Re-render groups with filtered tabs
        const closedTabs = filteredTabs.filter((t) => t.isClosed);
        const openTabs = filteredTabs.filter((t) => !t.isClosed);

        if (closedTabs.length > 0) {
          this._renderGroup(tabItemsContainer, "Recently Closed", closedTabs);
        }
        if (openTabs.length > 0) {
          this._renderGroup(tabItemsContainer, "Open Tabs", openTabs);
        }

        const firstItem = tabItemsContainer.querySelector(".reopen-closed-tab-item");
        if (firstItem) {
          firstItem.setAttribute("selected", "true");
        }
      }
    }
  },

  _handleSearchKeydown(event, panel) {
    event.stopPropagation();
    const tabItemsContainer = panel.querySelector("#reopen-closed-tabs-list-container");
    if (!tabItemsContainer) return;

    const currentSelected = tabItemsContainer.querySelector(".reopen-closed-tab-item[selected]");
    const allItems = Array.from(tabItemsContainer.querySelectorAll(".reopen-closed-tab-item"));
    let nextSelected = null;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (currentSelected) {
        const currentIndex = allItems.indexOf(currentSelected);
        nextSelected = allItems[currentIndex + 1] || allItems[0];
      } else {
        nextSelected = allItems[0];
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentSelected) {
        const currentIndex = allItems.indexOf(currentSelected);
        nextSelected = allItems[currentIndex - 1] || allItems[allItems.length - 1];
      } else {
        nextSelected = allItems[allItems.length - 1];
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (currentSelected) {
        currentSelected.click();
      }
    }

    if (currentSelected) {
      currentSelected.removeAttribute("selected");
    }
    if (nextSelected) {
      nextSelected.setAttribute("selected", "true");
      nextSelected.scrollIntoView({ block: "nearest" });

      // Adjust scroll position to prevent selected item from being hidden behind sticky group label
      const stickyHeader = tabItemsContainer.querySelector(".reopen-closed-tabs-group-header");
      if (stickyHeader) {
        const stickyHeaderHeight = stickyHeader.offsetHeight;
        const selectedItemRect = nextSelected.getBoundingClientRect();
        const containerRect = tabItemsContainer.getBoundingClientRect();
        if (selectedItemRect.top < containerRect.top + stickyHeaderHeight) {
          tabItemsContainer.scrollTop -=
            containerRect.top + stickyHeaderHeight - selectedItemRect.top;
        }
      }
    }
  },

  _handleItemClick(event) {
    let tabItem = event.target;
    while (tabItem && !tabItem.classList.contains("reopen-closed-tab-item")) {
      tabItem = tabItem.parentElement;
    }

    if (tabItem && tabItem.tabData) {
      TabManager.reopenTab(tabItem.tabData);
      const panel = tabItem.closest("panel");
      if (panel) {
        panel.hidePopup();
      } else {
        debugError("Could not find parent panel to hide.");
      }
    } else {
      debugError("Cannot reopen tab: Tab data not found on menu item.", event.target);
    }
  },
};

function setupCommandPaletteIntegration(retryCount = 0) {
  if (window.ZenCommandPalette) {
    debugLog("Integrating with Zen Command Palette...");
    window.ZenCommandPalette.addCommands([
      {
        key: "reopen:closed-tabs-menu",
        label: "Open Reopen closed tab menu",
        command: () => ReopenClosedTabs.toggleMenu(),
        icon: "chrome://browser/skin/zen-icons/history.svg",
        tags: ["reopen", "tabs", "closed"],
      },
    ]);

    debugLog("Zen Command Palette integration successful.");
  } else {
    debugLog("Zen Command Palette not found, retrying in 1000ms");
    if (retryCount < 10) {
      setTimeout(() => setupCommandPaletteIntegration(retryCount + 1), 1000);
    } else {
      debugError("Could not integrate with Zen Command Palette after 10 retries.");
    }
  }
}

UC_API.Runtime.startupFinished().then(() => {
  ReopenClosedTabs.init();
  setupCommandPaletteIntegration();
});
