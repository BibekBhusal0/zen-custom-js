import { PREFS } from "./utils/prefs.js";
import { Storage } from "./utils/storage.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { icons, svgToUrl } from "../utils/icon.js";
import {
  checkShortcutConflicts,
  eventToShortcutSignature,
  getPrettyShortcut,
} from "../utils/keyboard.js";

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
  _showCommandIconsInSelect: false,

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
    const defaultShortcuts = this._mainModule._getDefaultShortcuts();
    const filteredCustomShortcuts = {};
    for (const [commandKey, shortcut] of Object.entries(
      this._currentSettings.customShortcuts || {}
    )) {
      // FIXED (Bug): Allow saving empty strings (to unbind defaults)
      // Check if shortcut is not undefined (allows "") and is different from default
      if (shortcut !== undefined && defaultShortcuts[commandKey] !== shortcut) {
        filteredCustomShortcuts[commandKey] = shortcut;
      }
    }

    // Collect settings from UI
    const newSettings = {
      hiddenCommands: [],
      customIcons: { ...this._currentSettings.customIcons },
      customShortcuts: filteredCustomShortcuts,
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
      PREFS.setPref(prefKey, value);
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
      const oldShortcuts = oldSettings.customShortcuts || {};
      const newShortcuts = newSettings.customShortcuts || {};
      const defautlShortcut = this._mainModule._getDefaultShortcuts();

      // Remove old shortcuts
      for (const [commandKey] of Object.entries(oldShortcuts)) {
        if (!newShortcuts[commandKey] && oldShortcuts[commandKey] !== defautlShortcut[commandKey]) {
          this._mainModule.removeHotkey(commandKey);
        }
      }

      // Add/update new shortcuts
      for (const [commandKey, shortcutStr] of Object.entries(newShortcuts)) {
        if (shortcutStr && oldShortcuts[commandKey] !== shortcutStr) {
          this._mainModule.addHotkey(commandKey, shortcutStr);
        }
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
      if (group.pref && !PREFS.getPref(group.pref)) {
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
    const prettyShortcut = shortcutValue ? getPrettyShortcut(shortcutValue) : "";
    const shortcutInputHtml = `<div class="shortcut-input-wrapper">
      <input type="text" class="shortcut-input" placeholder="Set Shortcut" value="${escapeXmlAttribute(
        prettyShortcut
      )}" ${!allowShortcutChange ? "readonly" : ""} />
      <span class="shortcut-conflict-warning" hidden title="Shortcut conflict"></span>
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
      const conflictWarning = item.querySelector(".shortcut-conflict-warning");

      shortcutInput.addEventListener("focus", (e) => {
        this._currentShortcutTarget = e.target;
        e.target.placeholder = "Press keys...";
        if (conflictWarning) conflictWarning.hidden = true;
        window.addEventListener("keydown", this._boundHandleShortcutKeyDown, true);
      });
      shortcutInput.addEventListener("blur", () => {
        if (this._currentShortcutTarget) {
          if (this._currentShortcutTarget.classList.contains("conflict")) {
            this._currentShortcutTarget.value =
              this._currentSettings.customShortcuts[cmd.key] || nativeShortcut || "";
          }
          this._currentShortcutTarget.classList.remove("conflict");
          if (conflictWarning) conflictWarning.hidden = true;
          this._currentShortcutTarget = null;
        }
        window.removeEventListener("keydown", this._boundHandleShortcutKeyDown, true);
      });
      shortcutInput.addEventListener("keydown", (e) => {
        e.preventDefault();
        e.stopPropagation();
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

  _handleShortcutKeyDown(event) {
    if (!this._currentShortcutTarget) return;

    event.preventDefault();
    event.stopPropagation();

    const key = event.key;
    const targetInput = this._currentShortcutTarget;
    const commandItem = targetInput.closest(".command-item");
    const commandKey = commandItem?.dataset.key;
    const conflictWarning = commandItem?.querySelector(".shortcut-conflict-warning");

    const clearConflict = () => {
      targetInput.classList.remove("conflict");
      if (conflictWarning) conflictWarning.hidden = true;
    };

    if (key === "Escape") {
      clearConflict();
      targetInput.blur();
      return;
    }

    if (key === "Backspace" || key === "Delete") {
      targetInput.value = "";
      if (commandKey) {
        // FIXED (Bug): Set to empty string to indicate "unbound" instead of deleting
        this._currentSettings.customShortcuts[commandKey] = "";
      }
      clearConflict();
      window.removeEventListener("keydown", this._boundHandleShortcutKeyDown, true);
      this._currentShortcutTarget = null;
      targetInput.blur();
      return;
    }

    if (!commandKey) {
      targetInput.blur();
      return;
    }

    if (["Control", "Alt", "Shift", "Meta"].includes(key)) {
      return;
    }

    const shortcutString = eventToShortcutSignature(event);
    const conflictCheck = checkShortcutConflicts(shortcutString, commandKey);

    targetInput.value = getPrettyShortcut(shortcutString);

    if (conflictCheck.hasConflict) {
      targetInput.classList.add("conflict");
      if (conflictWarning) {
        const conflictDetails = conflictCheck.conflicts
          .map((c) => (c.source === "zen" ? `Zen: ${c.id}` : `Custom: ${c.id}`))
          .join(", ");
        conflictWarning.textContent = `Conflict: ${conflictDetails}`;
        conflictWarning.title = `Conflicts with: ${conflictDetails}`;
        conflictWarning.setAttribute("aria-label", `Conflicts with: ${conflictDetails}`);
        conflictWarning.hidden = false;
        targetInput.title = `Shortcut conflicts with: ${conflictDetails}`;
      }
      PREFS.debugLog(
        `Shortcut conflict detected for "${commandKey}" with shortcut "${shortcutString}":`,
        conflictCheck.conflicts
      );
      // FIXED (Bug): Save the shortcut anyway, allowing user override despite conflict
      this._currentSettings.customShortcuts[commandKey] = shortcutString;
    } else {
      clearConflict();
      this._currentSettings.customShortcuts[commandKey] = shortcutString;
      targetInput.title = "";
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
      const defaultIcon = "chrome://browser/skin/trending.svg";
      const icon = cmd.icon || defaultIcon;

      const item = parseElement(`
        <div class="custom-command-item" data-id="${cmd.id}">
          <img src="${escapeXmlAttribute(icon)}" class="custom-command-icon" />
          <span class="custom-command-name">${escapeXmlAttribute(cmd.name)}</span>
          <span class="custom-command-type">${cmd.type === "js" ? "JS" : "Chain"}</span>
          <div class="custom-command-controls">
            <button class="edit-custom-cmd icon-button" title="Edit Command"><img src="chrome://global/skin/icons/edit.svg" /></button>
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
        case "select": {
          const optionsHtml = param.options
            .map(
              (opt) =>
                `<option value="${escapeXmlAttribute(opt.value)}" ${
                  (currentValue || "").trim() === opt.value ? "selected" : ""
                } > ${escapeXmlAttribute(opt.label)} </option>`
            )
            .join("");
          inputHtml = `<select class="param-input" data-param="${param.name}">${optionsHtml}</select>`;
          break;
        }
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
      PREFS.debugLog("renderChainList called");
      const listContainer = editorContainer.querySelector("#current-chain-list");
      if (!listContainer) {
        PREFS.debugLog("renderChainList: listContainer not found");
        return;
      }
      listContainer.innerHTML = "";

      if (currentChain.length === 0) {
        listContainer.innerHTML = `<p class="no-custom-commands">No commands in chain. Use the dropdown above to add one.</p>`;
        return;
      }

      const allCommands = await this._mainModule.getAllCommandsForConfig();
      PREFS.debugLog(`renderChainList: building list with ${currentChain.length} items`);

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
          PREFS.debugLog(`Rendering function step: ${step.action}`);
          const functionStepEl = self._renderFunctionStep(step, index, currentChain);
          itemContainer.appendChild(functionStepEl);
        }

        const arrowControls = parseElement(`<div class="chain-item-arrow-controls"></div>`);

        if (index > 0) {
          const upButton = parseElement(
            `<button class="move-up-button icon-button" title="Move Up">
               <img src="chrome://global/skin/icons/arrow-up.svg" />
             </button>`
          );
          upButton.addEventListener("click", () => {
            [currentChain[index - 1], currentChain[index]] = [
              currentChain[index],
              currentChain[index - 1],
            ];
            renderChainList();
          });
          arrowControls.appendChild(upButton);
        }

        if (index < currentChain.length - 1) {
          const downButton = parseElement(
            `<button class="move-down-button icon-button" title="Move Down">
               <img src="chrome://global/skin/icons/arrow-down.svg" />
             </button>`
          );
          downButton.addEventListener("click", () => {
            [currentChain[index + 1], currentChain[index]] = [
              currentChain[index],
              currentChain[index + 1],
            ];
            renderChainList();
          });
          arrowControls.appendChild(downButton);
        }
        itemContainer.appendChild(arrowControls);

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

        PREFS.debugLog(`Function button clicked: ${action}`);

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
      PREFS.debugLog("Chain editor: getting all commands...");
      this._mainModule
        .getAllCommandsForConfig()
        .then((allCommands) => {
          PREFS.debugLog(`Chain editor: received ${allCommands.length} commands.`);
          const placeholder = editorContainer.querySelector("#chain-command-selector-placeholder");
          if (!placeholder) {
            PREFS.debugLog("Chain editor: placeholder DIV not found!");
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
            PREFS.debugLog("Chain editor: XUL menulist successfully created and inserted.");
          } catch (e) {
            PREFS.debugLog("Chain editor: Failed to parse or insert XUL menulist.", e);
            placeholder.textContent = "Error creating command list.";
          }
        })
        .catch((err) => {
          PREFS.debugLog("Chain editor: getAllCommandsForConfig promise rejected.", err);
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
        url: "https://github.com/Vertex-Mods/Zen-Command-Palette/tree/main/command-palette",
        icon: svgToUrl(icons["book"]),
        title: "View Documentation",
        description: "Read the full guide on GitHub.",
      },
      {
        url: "https://github.com/Vertex-Mods/Zen-Command-Palette",
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
            key: PREFS.PREFIX,
            label: "Command Prefix",
            type: "char",
          },
          {
            key: PREFS.PREFIX_REQUIRED,
            label: "Require prefix to activate",
            type: "bool",
          },
          {
            key: PREFS.MIN_QUERY_LENGTH,
            label: "Min query length (no prefix)",
            type: "number",
          },
          { key: PREFS.MAX_COMMANDS, label: "Max results (no prefix)", type: "number" },
          {
            key: PREFS.MAX_COMMANDS_PREFIX,
            label: "Max results (with prefix)",
            type: "number",
          },
          { key: PREFS.MIN_SCORE_THRESHOLD, label: "Min relevance score", type: "number" },
          { key: PREFS.DEBUG_MODE, label: "Enable debug logging", type: "bool" },
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
        const currentValue = PREFS.getPref(item.key);
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

export { SettingsModal };
