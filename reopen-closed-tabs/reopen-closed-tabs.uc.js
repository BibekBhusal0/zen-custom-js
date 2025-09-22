import { Prefs, debugLog, debugError } from "./utils/prefs.js";
import { parseShortcutString } from "../utils/keyboard.js";
import { parseElement, escapeXmlAttribute } from "../findbar-ai/utils/parse.js";
import TabManager from "./utils/tab-manager.js";

const ReopenClosedTabs = {
  _boundToggleMenu: null,
  _panel: null,
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
    debugLog("Mod initialized.");
  },

  _registerKeyboardShortcut() {
    const shortcutString = Prefs.shortcutKey;
    if (!shortcutString) {
      debugLog("No shortcut key defined.");
      return;
    }

    const { key, modifiers } = parseShortcutString(shortcutString);
    if (!key ) {
      debugError("Invalid shortcut string:", shortcutString);
      return;
    }

    try {
      const translatedModifiers = modifiers.replace(/accel/g, 'ctrl');
      
      const hotkey = {
        id: "reopen-closed-tabs-hotkey",
        modifiers: translatedModifiers,
        key: key,
        command: this._boundToggleMenu,
      };
      this._registeredHotkey = UC_API.Hotkeys.define(hotkey).autoAttach({ suppressOriginal: false });
      debugLog(`Registered shortcut: ${shortcutString}`);
    } catch (e) {
      debugError("Failed to register keyboard shortcut:", e);
    }
  },

  _registerToolbarButton() {
    const buttonId = "reopen-closed-tabs-button";
    const panelId = "reopen-closed-tabs-panel";

    try {
      UC_API.Utils.createWidget({
        id: buttonId,
        label: "Reopen Closed Tabs",
        tooltip: "View and reopen recently closed tabs",
        image: "chrome://browser/skin/history.svg",
        type: "toolbarbutton",
        callback: this.toggleMenu.bind(this),
      });
      debugLog(`Registered toolbar button: ${buttonId}`);

      this._panel = parseElement(`
        <panel id="${panelId}" type="arrow" noautofocus="false">
        </panel>
      `, "xul");

      const mainPopupSet = document.getElementById("mainPopupSet");
      if (mainPopupSet) {
        mainPopupSet.appendChild(this._panel);
        debugLog(`Created panel: ${panelId}`);
      } else {
        debugError("Could not find #mainPopupSet to append panel.");
      }
    } catch (e) {
      debugError("Failed to register toolbar button:", e);
    }
  },

  async toggleMenu() {
    debugLog("Toggle menu called.");
    const button = document.getElementById("reopen-closed-tabs-button");
    if (button && this._panel) {
      if (this._panel.state === "open") {
        this._panel.hidePopup();
      }
      else {
        await this._populatePanel();
        this._panel.openPopup(button, "after_start", 0, 0, false, false);
      }
    }
  },

  async _populatePanel() {
    debugLog("Populating panel.");
    while (this._panel.firstChild) {
      this._panel.removeChild(this._panel.firstChild);
    }

    const mainVbox = parseElement(`<vbox flex="1"/>`, "xul");
    this._panel.appendChild(mainVbox);

    // Search bar
    const searchBox = parseElement(`
      <hbox id="reopen-closed-tabs-search-container" align="center">
        <input id="reopen-closed-tabs-search-input" type="search" placeholder="Search tabs..." xmlns="http://www.w3.org/1999/xhtml" flex="1"/>
      </hbox>
    `, "html");
    mainVbox.appendChild(searchBox);

    const allItemsContainer = parseElement(`<vbox id="reopen-closed-tabs-list-container" flex="1" />`, "xul");
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
      const noTabsItem = parseElement(`<label class="reopen-closed-tab-item-disabled" value="No tabs to display."/>`, "xul");
      allItemsContainer.appendChild(noTabsItem);
    }

    this._allTabsCache = [...closedTabs, ...openTabs];

    const searchInput = this._panel.querySelector("#reopen-closed-tabs-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => this._filterTabs(event.target.value));
      searchInput.addEventListener("keydown", (event) => this._handleSearchKeydown(event));
      setTimeout(() => searchInput.focus(), 0);
    }
  },

  _renderGroup(container, groupTitle, tabs) {
    const groupHeader = parseElement(`
      <hbox class="reopen-closed-tabs-group-header" align="center">
        <label value="${escapeXmlAttribute(groupTitle)}"/>
      </hbox>
    `, "xul");
    container.appendChild(groupHeader);

    tabs.forEach(tab => {
      this._renderTabItem(container, tab);
    });
  },

  _renderTabItem(container, tab) {
    const label = escapeXmlAttribute(tab.title || tab.url || "Untitled Tab");
    const url = escapeXmlAttribute(tab.url || "");
    const faviconSrc = escapeXmlAttribute(tab.faviconUrl || "chrome://branding/content/icon32.png");

    let statusIcons = [];
    if (tab.isPinned) {
      statusIcons.push(`<image class="tab-status-icon" src="chrome://browser/skin/zen-icons/pin.svg" />`);
    }
    if (tab.isEssential) {
      statusIcons.push(`<image class="tab-status-icon" src="chrome://browser/skin/zen-icons/essential-add.svg" />`);
    }
    const iconHtml = statusIcons.join('');

    let contextParts = [];
    if (tab.workspace) {
      contextParts.push(escapeXmlAttribute(tab.workspace));
    }
    if (tab.folder) {
      contextParts.push(escapeXmlAttribute(tab.folder));
    }
    const contextLabel = contextParts.join(' / ');

    const tabItem = parseElement(`
      <hbox class="reopen-closed-tab-item" align="center" tooltiptext="${url}">
        <image class="tab-favicon" src="${faviconSrc}" />
        <vbox class="tab-item-labels" flex="1">
          <label class="tab-item-label" value="${label}"/>
          ${contextLabel ? `<label class="tab-item-context" value="${contextLabel}"/>` : ''}
        </vbox>
        <hbox class="tab-item-status-icons" align="center">
          ${iconHtml}
        </hbox>
      </hbox>
    `, "xul");

    tabItem.tabData = tab;
    tabItem.addEventListener("click", this._boundHandleItemClick);
    container.appendChild(tabItem);
  },

  _filterTabs(query) {
    const lowerQuery = query.toLowerCase();
    const filteredTabs = this._allTabsCache.filter(tab => {
      const title = (tab.title || "").toLowerCase();
      const url = (tab.url || "").toLowerCase();
      const workspace = (tab.workspace || "").toLowerCase();
      const folder = (tab.folder || "").toLowerCase();
      return title.includes(lowerQuery) || url.includes(lowerQuery) || workspace.includes(lowerQuery) || folder.includes(lowerQuery);
    });

    const tabItemsContainer = this._panel.querySelector("#reopen-closed-tabs-list-container");
    if (tabItemsContainer) {
      while (tabItemsContainer.firstChild) {
        tabItemsContainer.removeChild(tabItemsContainer.firstChild);
      }
      if (filteredTabs.length === 0) {
        const noResultsItem = parseElement(`<label class="reopen-closed-tab-item-disabled" value="No matching tabs."/>`, "xul");
        tabItemsContainer.appendChild(noResultsItem);
      } else {
        // Re-render groups with filtered tabs
        const closedTabs = filteredTabs.filter(t => t.isClosed);
        const openTabs = filteredTabs.filter(t => !t.isClosed);

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

  _handleSearchKeydown(event) {
    event.stopPropagation();
    const tabItemsContainer = this._panel.querySelector("#reopen-closed-tabs-list-container");
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
    }
  },

  _handleItemClick(event) {
    let tabItem = event.target;
    while (tabItem && !tabItem.classList.contains('reopen-closed-tab-item')) {
      tabItem = tabItem.parentElement;
    }

    if (tabItem && tabItem.tabData) {
      TabManager.reopenTab(tabItem.tabData);
      this._panel.hidePopup();
    } else {
      debugError("Cannot reopen tab: Tab data not found on menu item.", event.target);
    }
  },
};

UC_API.Runtime.startupFinished().then(() => {
  ReopenClosedTabs.init();
});
