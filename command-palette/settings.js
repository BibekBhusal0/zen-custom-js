import { Prefs } from "./utils/prefs.js";
import { Storage } from "./utils/storage.js";
import { parseElement, escapeXmlAttribute } from "../findbar-ai/utils/parse.js";
import { icons, svgToUrl } from "./utils/icon.js";

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
    } else {
      // this._mainModule.applyUserConfig();
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

    // Fallback for failed icon loads
    item.querySelector(".command-icon").onerror = function () {
      this.src = "chrome://browser/skin/trending.svg";
      this.onerror = null;
    };

    if (allowIcons) {
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
          {
            key: Prefs.KEYS.DYNAMIC_UNLOAD_TABS,
            label: "Generate commands for unload tabs",
            type: "bool",
          },
          {
            key: Prefs.KEYS.DYNAMIC_EXTENSION_ENABLE_DISABLE,
            label: "Generate commands for enabling/disabling extensions",
            type: "bool",
          },
          {
            key: Prefs.KEYS.DYNAMIC_EXTENSION_UNINSTALL,
            label: "Generate commands for uninstalling extensions",
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
              <div id="commands-list"></div>
            </div>
            <div id="settings-tab-content" class="cmd-settings-tab-content" hidden>
              <!-- Content will be populated by _populateSettingsTab -->
            </div>
            <div id="help-tab-content" class="cmd-settings-tab-content" hidden>
              <div class="help-buttons-container">
                <button class="help-button" data-url="https://github.com/BibekBhusal0/zen-custom-js/tree/main/command-palette">
                  <img src="${escapeXmlAttribute(svgToUrl(icons["book"]))}" />
                  <span>View Documentation</span>
                  <p>Read the full guide on GitHub.</p>
                </button>
                <button class="help-button" data-url="https://github.com/BibekBhusal0/zen-custom-js">
                  <img src="${escapeXmlAttribute(svgToUrl(icons["star"]))}" />
                  <span>Star on GitHub</span>
                  <p>Enjoying the mod? Leave a star!</p>
                </button>
                <button class="help-button" data-url="https://github.com/BibekBhusal0/zen-custom-js/issues/new">
                  <img src="${escapeXmlAttribute(svgToUrl(icons["bug"]))}" />
                  <span>Report a Bug</span>
                  <p>Found an issue? Let us know.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return parseElement(html);
  },
};

export { SettingsModal };
