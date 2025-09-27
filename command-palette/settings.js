import { Prefs, debugLog } from "./utils/prefs.js";
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

  _showCustomCommandEditor(cmd) {
    this._modalElement.querySelector("#custom-commands-view").hidden = true;
    const editorContainer = this._modalElement.querySelector("#custom-command-editor");
    editorContainer.hidden = false;

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
          <div class="js-warning">Only run code from sources you trust. Malicious code can compromise your browser.</div>
          <textarea id="custom-cmd-code">${escapeXmlAttribute(cmd.code)}</textarea>
        </div>
      `;
    } else {
      typeSpecificHtml = `
        <div class="setting-item-vertical">
          <label>Commands</label>
          <div id="chain-builder">
            <div id="chain-command-selector-container">
              <div id="chain-command-selector-placeholder">Loading...</div>
              <button id="add-command-to-chain">Add</button>
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
      debugLog("renderChainList: starting");
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

      // Get all commands ONCE to build the options string, so we don't fetch it in the loop.
      const allCommands = await this._mainModule.getAllCommandsForConfig();
      debugLog(`renderChainList: building list with ${currentChain.length} items`);

      const menuitemsXUL = allCommands
        .map(
          // BUG: can't figure out way to control size of icon for menulist, not including icon till fixed
          // image="${escapeXmlAttribute(c.icon || "chrome://browser/skin/trending.svg")}"
          (c) =>
            `<menuitem value="${escapeXmlAttribute(c.key)}"
                         label="${escapeXmlAttribute(c.label)}"
                         />`
        )
        .join("");

      currentChain.forEach((key, index) => {
        const menulistXUL = `
          <menulist class="chain-item-selector" value="${escapeXmlAttribute(key)}">
            <menupopup>${menuitemsXUL}</menupopup>
          </menulist>`;

        const menulistElement = parseElement(menulistXUL, "xul");
        const deleteButton = parseElement(
          `<button class="delete-button icon-button" title="Remove Command">
             <img src="chrome://browser/skin/zen-icons/edit-delete.svg" />
           </button>`
        );

        const itemContainer = parseElement(`<div class="chain-item-container"></div>`);
        itemContainer.append(menulistElement, deleteButton);
        listContainer.appendChild(itemContainer);

        // Add listeners
        menulistElement.addEventListener("command", (e) => {
          currentChain[index] = e.target.value;
          debugLog(`Chain item at index ${index} changed to ${e.target.value}`);
        });

        deleteButton.addEventListener("click", () => {
          currentChain.splice(index, 1);
          renderChainList(); // Re-render the whole list
        });
      });
    };

    if (cmd.type === "chain") {
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

          const menuitemsXUL = allCommands
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(
              // BUG: can't figure out way to control size of icon for menulist, not including icon till fixed
              // image="${escapeXmlAttribute(c.icon || "chrome://browser/skin/trending.svg")}" <!-- This line should be moved 3 lines down after issue is resolved -->
              (c) =>
                `<menuitem value="${escapeXmlAttribute(c.key)}"
                           label="${escapeXmlAttribute(c.label)}"
                           />`
            )
            .join("");

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

      editorContainer.querySelector("#add-command-to-chain").addEventListener("click", () => {
        const selector = editorContainer.querySelector("#chain-command-selector");
        if (selector && selector.value) {
          currentChain.push(selector.value);
          renderChainList();
        }
      });

      renderChainList();
    }

    editorContainer.querySelector("#cancel-custom-cmd").addEventListener("click", () => {
      this._hideCustomCommandEditor();
    });

    editorContainer.querySelector("#save-custom-cmd").addEventListener("click", () => {
      this._saveCustomCommand(cmd, currentChain);
    });
  },

  _hideCustomCommandEditor() {
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
    container.innerHTML = ""; // Clear previous content

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

    const buttonsHtml = helpItems
      .map(
        (item) => `
      <button class="help-button" data-url="${escapeXmlAttribute(item.url)}">
        <img src="${escapeXmlAttribute(item.icon)}" />
        <span>${escapeXmlAttribute(item.title)}</span>
        <p>${escapeXmlAttribute(item.description)}</p>
      </button>
    `
      )
      .join("");

    const content = parseElement(`
      <div class="help-buttons-container">
        ${buttonsHtml}
      </div>
    `);

    container.appendChild(content);
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
            type: "text",
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
        } else if (item.type === "text") {
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

export { SettingsModal };
