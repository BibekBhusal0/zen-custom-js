import { Prefs, debugLog, debugError } from "./utils/prefs.js";
import { parseShortcutString } from "../utils/keyboard.js";
import { parseElement, escapeXmlAttribute } from "../findbar-ai/utils/parse.js";
import TabManager from "./utils/tab-manager.js";
import { icons } from "./utils/icon.js";
import { svgToUrl } from "../command-palette/utils/icon.js";

const ReopenClosedTabs = {
  _boundToggleMenu: null,
  _menuPopup: null,
  _boundHandleMenuItemClick: null,
  _allTabsCache: [],
  _registeredHotkey: null,

  /**
   * Initializes the Reopen Closed Tabs mod.
   */
  async init() {
    debugLog("Initializing mod.");
    Prefs.setInitialPrefs();
    this._boundToggleMenu = this.toggleMenu.bind(this);
    this._boundHandleMenuItemClick = this._handleMenuItemClick.bind(this);
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
    const menuPopupId = "reopen-closed-tabs-menupopup";

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

      this._menuPopup = parseElement(`
        <menupopup id="${menuPopupId}">
          <menuitem label="Loading tabs..." />
        </menupopup>
      `, "xul");

      const mainPopupSet = document.getElementById("mainPopupSet");
      if (mainPopupSet) {
        mainPopupSet.appendChild(this._menuPopup);
        debugLog(`Created menupopup: ${menuPopupId}`);
      } else {
        debugError("Could not find #mainPopupSet to append menupopup.");
      }

      const button = document.getElementById(buttonId);
      if (button) {
        button.setAttribute("menupopup", menuPopupId);
      }
    } catch (e) {
      debugError("Failed to register toolbar button:", e);
    }
  },

  async toggleMenu() {
    debugLog("Toggle menu called.");
    const button = document.getElementById("reopen-closed-tabs-button");
    if (button && this._menuPopup) {
      if (this._menuPopup.state === "open") {
        this._menuPopup.hidePopup();
      }
      else {
        await this._populateMenu();
        this._menuPopup.openPopup(button, "after_start", 0, 0, false, false);
      }
    }
  },

  async _populateMenu() {
    debugLog("Populating menu.");
    while (this._menuPopup.firstChild) {
      this._menuPopup.removeChild(this._menuPopup.firstChild);
    }

    // Search bar
    const searchBox = parseElement(`
      <vbox id="reopen-closed-tabs-search-container">
         <textbox id="reopen-closed-tabs-search-input" type="search" placeholder="Search tabs..." flex="1"/>
      </vbox>
    `, "xul");
    this._menuPopup.appendChild(searchBox);
    this._menuPopup.appendChild(parseElement(`<menuseparator />`, "xul"));

    const allItemsContainer = parseElement(`<vbox id="reopen-closed-tabs-list-container" flex="1" />`, "xul");
    this._menuPopup.appendChild(allItemsContainer);

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
      const noTabsItem = parseElement(`<menuitem label="No tabs to display." disabled="true"/>`, "xul");
      allItemsContainer.appendChild(noTabsItem);
    }

    this._allTabsCache = [...closedTabs, ...openTabs];

    const searchInput = document.getElementById("reopen-closed-tabs-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => this._filterTabs(event.target.value));
      searchInput.addEventListener("keydown", (event) => this._handleSearchKeydown(event));
      setTimeout(() => searchInput.focus(), 0);
    }
  },

  _renderGroup(container, groupTitle, tabs) {
    const groupHeader = parseElement(`
      <menuitem class="reopen-closed-tabs-group-header" label="${escapeXmlAttribute(groupTitle)}" disabled="true" />
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
      statusIcons.push(`<image class="tab-status-icon" src="${svgToUrl(icons.pinned)}" />`);
    }
    if (tab.isEssential) {
      statusIcons.push(`<image class="tab-status-icon" src="${svgToUrl(icons.essential)}" />`);
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

    const menuItem = parseElement(`
      <menuitem class="reopen-closed-tab-item" label="${label}" tooltiptext="${url}">
        <hbox class="tab-item-content" align="center">
          <image class="tab-favicon" src="${faviconSrc}" />
          <vbox class="tab-item-labels" flex="1">
            <label class="tab-item-label">${label}</label>
            ${contextLabel ? `<label class="tab-item-context">${contextLabel}</label>` : ''}
          </vbox>
          <hbox class="tab-item-status-icons">
            ${iconHtml}
          </hbox>
        </hbox>
      </menuitem>
    `, "xul");

    menuItem.tabData = tab;
    menuItem.addEventListener("command", this._boundHandleMenuItemClick);
    container.appendChild(menuItem);
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

    const tabItemsContainer = document.getElementById("reopen-closed-tabs-list-container");
    if (tabItemsContainer) {
      while (tabItemsContainer.firstChild) {
        tabItemsContainer.removeChild(tabItemsContainer.firstChild);
      }
      if (filteredTabs.length === 0) {
        const noResultsItem = parseElement(`<menuitem label="No matching tabs." disabled="true"/>`, "xul");
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
    const tabItemsContainer = document.getElementById("reopen-closed-tabs-list-container");
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

  _handleMenuItemClick(event) {
    // Find the menuitem element by traversing up from the event target
    let menuItem = event.target;
    while (menuItem && !menuItem.classList.contains('reopen-closed-tab-item')) {
      menuItem = menuItem.parentElement;
    }

    if (menuItem && menuItem.tabData) {
      TabManager.reopenTab(menuItem.tabData);
      this._menuPopup.hidePopup();
    } else {
      debugError("Cannot reopen tab: Tab data not found on menu item.", event.target);
    }
  },
};

UC_API.Runtime.startupFinished().then(() => {
  ReopenClosedTabs.init();
});
