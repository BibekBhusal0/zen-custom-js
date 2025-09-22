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

    const { key, keycode, modifiers } = parseShortcutString(shortcutString);
    if (!key && !keycode) {
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

    const closedTabs = await TabManager.getRecentlyClosedTabs();
    const showOpenTabs = Prefs.showOpenTabs;
    let allTabs = [...closedTabs];

    if (showOpenTabs) {
      const openTabs = await TabManager.getOpenTabs();
      allTabs = [...openTabs, ...closedTabs];
    }

    this._allTabsCache = allTabs;

    if (allTabs.length === 0) {
      const noTabsItem = parseElement(`<menuitem label="No tabs to display." />`, "xul");
      this._menuPopup.appendChild(noTabsItem);
      return;
    }

    const searchPanel = parseElement(`
      <panel id="reopen-closed-tabs-search-panel" noautohide="true">
        <vbox>
          <textbox id="reopen-closed-tabs-search-input" type="search" placeholder="Search tabs..." />
        </vbox>
      </panel>
    `, "xul");
    this._menuPopup.appendChild(searchPanel);
    this._menuPopup.appendChild(parseElement(`<menuseparator />`, "xul"));

    const tabItemsContainer = parseElement(`<vbox id="reopen-closed-tabs-list-container" />`, "xul");
    this._menuPopup.appendChild(tabItemsContainer);

    this._renderTabItems(allTabs, tabItemsContainer);

    const searchInput = document.getElementById("reopen-closed-tabs-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => this._filterTabs(event.target.value));
    }
  },

  _renderTabItems(tabsToRender, container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (tabsToRender.length === 0) {
      const noResultsItem = parseElement(`<menuitem label="No matching tabs." />`, "xul");
      container.appendChild(noResultsItem);
      return;
    }

    tabsToRender.forEach((tab) => {
      const label = escapeXmlAttribute(tab.title || tab.url || "Untitled Tab");
      const url = escapeXmlAttribute(tab.url || "");

      let iconHtml = "";
      if (tab.isPinned) {
        iconHtml += `<image class="tab-status-icon" src="${svgToUrl(icons.pinned)}" />`;
      }
      if (tab.isEssential) {
        iconHtml += `<image class="tab-status-icon" src="${svgToUrl(icons.essential)}" />`;
      }
      if (tab.folder) {
        iconHtml += `<image class="tab-status-icon" src="${svgToUrl(icons.folder)}" />`;
        iconHtml += `<label class="tab-folder-label">${escapeXmlAttribute(tab.folder)}</label>`;
      }

      const menuItem = parseElement(`
        <menuitem class="reopen-closed-tab-item" label="${label}" tooltiptext="${url}">
          <hbox class="tab-item-content">
            <label class="tab-item-label">${label}</label>
            <hbox class="tab-item-status-icons">
              ${iconHtml}
            </hbox>
          </hbox>
        </menuitem>
      `, "xul");
      menuItem.dataset.url = tab.url;
      if (tab.sessionData) {
          menuItem.dataset.sessionData = JSON.stringify(tab.sessionData);
      }
      menuItem.addEventListener("command", this._boundHandleMenuItemClick);
      container.appendChild(menuItem);
    });
  },

  _filterTabs(query) {
    const lowerQuery = query.toLowerCase();
    const filteredTabs = this._allTabsCache.filter(tab => {
      const title = (tab.title || "").toLowerCase();
      const url = (tab.url || "").toLowerCase();
      return title.includes(lowerQuery) || url.includes(lowerQuery);
    });

    const tabItemsContainer = document.getElementById("reopen-closed-tabs-list-container");
    if (tabItemsContainer) {
      this._renderTabItems(filteredTabs, tabItemsContainer);
    }
  },

  _handleMenuItemClick(event) {
    const menuItem = event.target;
    const url = menuItem.dataset.url;
    const sessionData = menuItem.dataset.sessionData ? JSON.parse(menuItem.dataset.sessionData) : null;

    if (url) {
      TabManager.reopenTab({ url, sessionData });
      this._menuPopup.hidePopup();
    }
    else {
      debugError("Cannot reopen tab: URL not found on menu item.", menuItem);
    }
  },
};

UC_API.Runtime.startupFinished().then(() => {
  ReopenClosedTabs.init();
});
