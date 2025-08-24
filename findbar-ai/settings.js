import { llm } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { parseElement, escapeXmlAttribute } from "./utils/parse.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";

export const SettingsModal = {
  _modalElement: null,
  _currentPrefValues: {},

  _getSafeIdForProvider(providerName) {
    return providerName.replace(/\./g, "-");
  },

  createModalElement() {
    const settingsHtml = this._generateSettingsHtml();
    const container = parseElement(settingsHtml);
    this._modalElement = container;

    const providerOptionsXUL = Object.entries(llm.AVAILABLE_PROVIDERS)
      .map(
        ([name, provider]) =>
          `<menuitem
            value="${name}"
            label="${escapeXmlAttribute(provider.label)}"
            ${name === PREFS.llmProvider ? 'selected="true"' : ""}
            ${provider.faviconUrl ? `image="${escapeXmlAttribute(provider.faviconUrl)}"` : ""}
          />`
      )
      .join("");

    const menulistXul = `
      <menulist id="pref-llm-provider" data-pref="${PREFS.LLM_PROVIDER}" value="${PREFS.llmProvider}">
        <menupopup>
          ${providerOptionsXUL}
        </menupopup>
      </menulist>`;

    const providerSelectorXulElement = parseElement(menulistXul, "xul");
    const placeholder = this._modalElement.querySelector("#llm-provider-selector-placeholder");
    if (placeholder) {
      placeholder.replaceWith(providerSelectorXulElement);
    }

    const positionOptions = {
      "top-left": "Top Left",
      "top-right": "Top Right",
      "bottom-left": "Bottom Left",
      "bottom-right": "Bottom Right",
    };
    const positionOptionsXUL = Object.entries(positionOptions)
      .map(
        ([value, label]) =>
          `<menuitem
            value="${value}"
            label="${escapeXmlAttribute(label)}"
            ${value === PREFS.position ? 'selected="true"' : ""}
          />`
      )
      .join("");

    const positionMenulistXul = `
      <menulist id="pref-position" data-pref="${PREFS.POSITION}" value="${PREFS.position}">
        <menupopup>
          ${positionOptionsXUL}
        </menupopup>
      </menulist>`;
    const positionSelectorXulElement = parseElement(positionMenulistXul, "xul");
    const positionPlaceholder = this._modalElement.querySelector("#position-selector-placeholder");

    if (positionPlaceholder) {
      positionPlaceholder.replaceWith(positionSelectorXulElement);
    }

    for (const [name, provider] of Object.entries(llm.AVAILABLE_PROVIDERS)) {
      const modelPrefKey = provider.modelPref;
      const currentModel = provider.model;

      const modelOptionsXUL = provider.AVAILABLE_MODELS.map(
        (model) =>
          `<menuitem
              value="${model}"
              label="${escapeXmlAttribute(provider.AVAILABLE_MODELS_LABELS[model] || model)}"
              ${model === currentModel ? 'selected="true"' : ""}
            />`
      ).join("");

      const modelMenulistXul = `
          <menulist id="pref-${this._getSafeIdForProvider(name)}-model" data-pref="${modelPrefKey}" value="${currentModel}">
            <menupopup>
              ${modelOptionsXUL}
            </menupopup>
          </menulist>`;

      const modelPlaceholder = this._modalElement.querySelector(
        `#llm-model-selector-placeholder-${this._getSafeIdForProvider(name)}`
      );
      if (modelPlaceholder) {
        const modelSelectorXulElement = parseElement(modelMenulistXul, "xul");
        modelPlaceholder.replaceWith(modelSelectorXulElement);
      }
    }

    this._attachEventListeners();
    return container;
  },

  _attachEventListeners() {
    if (!this._modalElement) return;

    // Close button
    this._modalElement.querySelector("#close-settings").addEventListener("click", () => {
      this.hide();
    });

    // Save button
    this._modalElement.querySelector("#save-settings").addEventListener("click", () => {
      this.saveSettings();
      this.hide();
      if (browseBotFindbar.enabled) browseBotFindbar.show();
      else browseBotFindbar.destroy();
    });

    this._modalElement.addEventListener("click", (e) => {
      if (e.target === this._modalElement) {
        this.hide();
      }
    });

    this._modalElement.querySelectorAll(".accordion-header").forEach((header) => {
      header.addEventListener("click", () => {
        const section = header.closest(".settings-accordion");
        const isExpanded = section.dataset.expanded === "true";
        section.dataset.expanded = isExpanded ? "false" : "true";
      });
    });

    // Initialize and listen to changes on controls (store in _currentPrefValues)
    this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;

      // Initialize control value from PREFS
      if (control.type === "checkbox") {
        control.checked = PREFS.getPref(prefKey);
      } else if (control.tagName.toLowerCase() === "menulist") {
        control.value = PREFS.getPref(prefKey);
      } else {
        control.value = PREFS.getPref(prefKey);
      }

      this._currentPrefValues[prefKey] = PREFS.getPref(prefKey);

      // Store changes in _currentPrefValues
      if (control.tagName.toLowerCase() === "menulist") {
        control.addEventListener("command", (e) => {
          this._currentPrefValues[prefKey] = e.target.value;
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefKey]}`
          );
          if (prefKey === PREFS.LLM_PROVIDER) {
            this._updateProviderSpecificSettings(
              this._modalElement,
              this._currentPrefValues[prefKey]
            );
          }
        });
      } else {
        control.addEventListener("change", (e) => {
          if (control.type === "checkbox") {
            this._currentPrefValues[prefKey] = e.target.checked;
          } else if (control.type === "number") {
            try {
              this._currentPrefValues[prefKey] = Number(e.target.value);
            } catch (error) {
              this._currentPrefValues[prefKey] = 0;
            }
          } else {
            this._currentPrefValues[prefKey] = e.target.value;
          }
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefKey]}`
          );
        });
      }
    });

    // Attach event listeners for API key links
    this._modalElement.querySelectorAll(".get-api-key-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const url = e.target.dataset.url;
        if (url) {
          openTrustedLinkIn(url, "tab");
          this.hide();
        }
      });
    });

    // Initial update for provider-specific settings display
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider);
  },

  saveSettings() {
    for (const prefKey in this._currentPrefValues) {
      if (Object.prototype.hasOwnProperty.call(this._currentPrefValues, prefKey)) {
        if (prefKey.endsWith("api-key")) {
          if (this._currentPrefValues[prefKey]) {
            const maskedKey = "*".repeat(this._currentPrefValues[prefKey].length);
            debugLog(`Saving pref ${prefKey} to: ${maskedKey}`);
          }
        } else {
          debugLog(`Saving pref ${prefKey} to: ${this._currentPrefValues[prefKey]}`);
        }
        try {
          PREFS.setPref(prefKey, this._currentPrefValues[prefKey]);
        } catch (e) {
          debugError(`Error Saving pref for ${prefKey} ${e}`);
        }
      }
    }
    // Special case: If API key is empty after saving, ensure findbar is collapsed
    if (!llm.currentProvider.apiKey) {
      browseBotFindbar.expanded = false;
    }
  },

  show() {
    this.createModalElement();
    this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      if (control.type === "checkbox") {
        control.checked = PREFS.getPref(prefKey);
      } else {
        // For XUL menulist, ensure its value is set correctly on show
        if (control.tagName.toLowerCase() === "menulist") {
          control.value = PREFS.getPref(prefKey);
        } else {
          control.value = PREFS.getPref(prefKey);
        }
      }
      this._currentPrefValues[prefKey] = PREFS.getPref(prefKey);
    });
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider);

    document.documentElement.appendChild(this._modalElement);
  },

  hide() {
    if (this._modalElement && this._modalElement.parentNode) {
      this._modalElement.remove();
    }
  },

  // Helper to show/hide provider-specific settings sections and update model dropdowns
  _updateProviderSpecificSettings(container, selectedProviderName) {
    container.querySelectorAll(".provider-settings-group").forEach((group) => {
      group.style.display = "none";
    });

    // Use the safe ID for the selector
    const activeGroup = container.querySelector(
      `#${this._getSafeIdForProvider(selectedProviderName)}-settings-group`
    );
    if (activeGroup) {
      activeGroup.style.display = "block";

      // Dynamically update the model dropdown for the active provider
      const modelPrefKey = PREFS[`${selectedProviderName.toUpperCase()}_MODEL`];
      if (modelPrefKey) {
        // Use the safe ID for the model selector as well
        const modelSelect = activeGroup.querySelector(
          `#pref-${this._getSafeIdForProvider(selectedProviderName)}-model`
        );
        if (modelSelect) {
          modelSelect.value = this._currentPrefValues[modelPrefKey] || PREFS.getPref(modelPrefKey);
        }
      }
      // Update the "Get API Key" link's state for the active provider
      const provider = llm.AVAILABLE_PROVIDERS[selectedProviderName];
      const getApiKeyLink = activeGroup.querySelector(".get-api-key-link");
      if (getApiKeyLink) {
        if (provider.apiKeyUrl) {
          getApiKeyLink.style.display = "inline-block";
          getApiKeyLink.dataset.url = provider.apiKeyUrl;
        } else {
          getApiKeyLink.style.display = "none";
          delete getApiKeyLink.dataset.url;
        }
      }
    }
  },

  _generateCheckboxSettingHtml(label, prefConstant) {
    const prefId = `pref-${prefConstant.toLowerCase().replace(/_/g, "-")}`;
    return `
      <div class="setting-item">
        <label for="${prefId}">${label}</label>
        <input type="checkbox" id="${prefId}" data-pref="${prefConstant}" />
      </div>
    `;
  },

  _createCheckboxSectionHtml(
    title,
    settingsArray,
    expanded = true,
    contentBefore = "",
    contentAfter = ""
  ) {
    const settingsHtml = settingsArray
      .map((s) => this._generateCheckboxSettingHtml(s.label, s.pref))
      .join("");
    return `
    <section class="settings-section settings-accordion" data-expanded="${expanded}" >
      <h4 class="accordion-header">${title}</h4>
      <div class="accordion-content">
        ${contentBefore}
        ${settingsHtml}
        ${contentAfter}
      </div>
    </section>
  `;
  },

  _generateSettingsHtml() {
    const generalSettings = [
      { label: "Enable AI Findbar", pref: PREFS.ENABLED },
      { label: "Minimal Mode (similar to arc)", pref: PREFS.MINIMAL },
      { label: "Persist Chat (don't persist when browser closes)", pref: PREFS.PERSIST },
      { label: "Debug Mode (logs in console)", pref: PREFS.DEBUG_MODE },
      { label: "Enable Drag and Drop", pref: PREFS.DND_ENABLED },
      { label: "Pseudo Background (for transparent Browsers)", pref: PREFS.PSEUDO_BG },
    ];
    const positionSelectorPlaceholderHtml = `
      <div class="setting-item">
        <label for="pref-position">Position</label>
        <div id="position-selector-placeholder"></div>
      </div>
    `;
    const generalSectionHtml = this._createCheckboxSectionHtml(
      "General",
      generalSettings,
      true,
      "",
      positionSelectorPlaceholderHtml
    );

    const aiBehaviorSettings = [
      { label: "Enable Citations", pref: PREFS.CITATIONS_ENABLED },
      { label: "Stream Response", pref: PREFS.STREAM_ENABLED },
      { label: "God Mode (AI can use tool calls)", pref: PREFS.GOD_MODE },
      { label: "Conformation before tool call", pref: PREFS.CONFORMATION },
    ];
    const aiBehaviorWarningHtml = `
      <div id="citations-god-mode-warning" class="warning-message" >
        Warning: Enabling both Citations and God Mode may lead to unexpected behavior or errors.
      </div>
    `;
    const maxToolCallsHtml = `
  <div class="setting-item">
    <label for="pref-max-tool-calls">Max Tool Calls (Maximum number of messages to send AI back to back)</label>
    <input type="number" id="pref-max-tool-calls" data-pref="${PREFS.MAX_TOOL_CALLS}" />
  </div>
`;

    const aiBehaviorSectionHtml = this._createCheckboxSectionHtml(
      "AI Behavior",
      aiBehaviorSettings,
      true,
      aiBehaviorWarningHtml,
      maxToolCallsHtml
    );

    // Context Menu Settings
    const contextMenuSettings = [
      { label: "Enable Context Menu (right click menu)", pref: PREFS.CONTEXT_MENU_ENABLED },
      {
        label: "Auto Send from Context Menu",
        pref: PREFS.CONTEXT_MENU_AUTOSEND,
      },
    ];
    const contextMenuSectionHtml = this._createCheckboxSectionHtml(
      "Context Menu",
      contextMenuSettings
    );

    const browserFindbarSettings = [
      { label: "Find as you Type", pref: "accessibility.typeaheadfind" },
      {
        label: "Enable sound (when word not found)",
        pref: "accessibility.typeaheadfind.enablesound",
      },
      { label: "Entire Word", pref: "findbar.entireword" },
      { label: "Highlight All", pref: "findbar.highlightAll" },
    ];
    const browserSettingsHtml = this._createCheckboxSectionHtml(
      "Browser Findbar",
      browserFindbarSettings,
      false
    );

    let llmProviderSettingsHtml = "";
    for (const [name, provider] of Object.entries(llm.AVAILABLE_PROVIDERS)) {
      const apiPrefKey = PREFS[`${name.toUpperCase()}_API_KEY`];
      const modelPrefKey = PREFS[`${name.toUpperCase()}_MODEL`];

      const apiInputHtml = apiPrefKey
        ? `
        <div class="setting-item">
          <label for="pref-${this._getSafeIdForProvider(name)}-api-key">API Key</label>
          <input type="password" id="pref-${this._getSafeIdForProvider(name)}-api-key" data-pref="${apiPrefKey}" placeholder="Enter ${provider.label} API Key" />
        </div>
      `
        : "";

      // Placeholder for the XUL menulist, which will be inserted dynamically in createModalElement
      const modelSelectPlaceholderHtml = modelPrefKey
        ? `
        <div class="setting-item">
          <label for="pref-${this._getSafeIdForProvider(name)}-model">Model</label>
          <div id="llm-model-selector-placeholder-${this._getSafeIdForProvider(name)}"></div>
        </div>
      `
        : "";

      llmProviderSettingsHtml += `
        <div id="${this._getSafeIdForProvider(name)}-settings-group" class="provider-settings-group">
          <div class="provider-header-group">
            <h5>${provider.label}</h5>
            <button class="get-api-key-link" data-url="${provider.apiKeyUrl || ""}" style="display: ${provider.apiKeyUrl ? "inline-block" : "none"};">Get API Key</button>
          </div>
          ${apiInputHtml}
          ${modelSelectPlaceholderHtml}
        </div>
      `;
    }

    const llmProvidersSectionHtml = `
      <section class="settings-section settings-accordion" data-expanded="false">
        <h4 class="accordion-header">LLM Providers</h4>
        <div class="setting-item accordion-content" class="">
          <label for="pref-llm-provider">Select Provider</label>
          <div id="llm-provider-selector-placeholder"></div>
        </div>
        ${llmProviderSettingsHtml}
      </section>`;

    return `
      <div id="ai-settings-modal-overlay">
        <div class="browse-bot-settings-modal">
          <div class="ai-settings-header">
            <h3>Settings</h3>
            <div>
              <button id="close-settings" class="settings-close-btn">Close</button>
              <button id="save-settings" class="settings-save-btn">Save</button>
            </div>
          </div>
          <div class="ai-settings-content">
            ${generalSectionHtml}
            ${aiBehaviorSectionHtml}
            ${contextMenuSectionHtml}
            ${llmProvidersSectionHtml}
            ${browserSettingsHtml}
          </div>
        </div>
      </div>
    `;
  },
};

export default SettingsModal;
