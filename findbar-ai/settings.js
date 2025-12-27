import { browseBotFindbarLLM } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
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

    const providerOptionsXUL = Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)
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

    for (const [name, provider] of Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)) {
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

    // Preset Change Listener - REMOVED

    // Reset Button Listeners
    this._modalElement.querySelectorAll(".reset-section-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent accordion toggle
        const prefsToReset = btn.dataset.resetPrefs.split(",");
        prefsToReset.forEach(prefKey => {
          if (!prefKey) return; // skip empty
          const defVal = PREFS.defaultValues[prefKey];

          // Update internal state
          this._currentPrefValues[prefKey] = defVal;

          // Update UI
          const control = this._modalElement.querySelector(`[data-pref="${prefKey}"]`);
          if (control) {
            if (control.type === "checkbox") {
              control.checked = defVal;
            } else if (control.tagName.toLowerCase() === "menulist") {
              control.value = defVal;
            } else {
              control.value = defVal;
            }

            // Special logic for provider reset
            if (prefKey === PREFS.LLM_PROVIDER) {
              this._updateProviderSpecificSettings(
                this._modalElement,
                defVal
              );
            }
          }
        });
      });
    });
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
    if (!browseBotFindbarLLM.currentProvider.apiKey) {
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
      const provider = browseBotFindbarLLM.AVAILABLE_PROVIDERS[selectedProviderName];
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

  _generateNumberSettingHtml(label, prefConstant, min, max, step, tooltip) {
    const prefId = `pref-${prefConstant.toLowerCase().replace(/_/g, "-")}`;
    const infoIconHtml = tooltip
      ? `<span class="info-icon-wrapper" data-tooltip="${escapeXmlAttribute(tooltip)}"><img class="info-icon" src="chrome://global/skin/icons/info.svg" /></span>`
      : "";

    return `
      <div class="setting-item">
        <label for="${prefId}" style="display: flex; align-items: center; gap: 6px;">
          ${label}
          ${infoIconHtml}
        </label>
        <input type="number" id="${prefId}" data-pref="${prefConstant}" min="${min}" max="${max}" step="${step}" />
      </div>
    `;
  },

  _createCheckboxSectionHtml(
    title,
    settingsArray,
    expanded = true,
    contentBefore = "",
    contentAfter = "",
    resetPrefs = []
  ) {
    const settingsHtml = settingsArray
      .map((s) => {
        if (s.type === 'number') {
          return this._generateNumberSettingHtml(s.label, s.pref, s.min, s.max, s.step, s.tooltip);
        }
        return this._generateCheckboxSettingHtml(s.label, s.pref);
      })
      .join("");

    // If no explicit resetPrefs passed, try to infer from settingsArray
    const prefsToReset = (resetPrefs.length > 0 ? resetPrefs : settingsArray.map(s => s.pref)).join(",");

    return `
    <section class="settings-section settings-accordion" data-expanded="${expanded}" >
      <h4 class="accordion-header">
        ${title}
        <div class="reset-section-btn" data-reset-prefs="${prefsToReset}" title="Reset Section" role="button">
            <img src="chrome://global/skin/icons/reload.svg" />
        </div>
      </h4>
      <div class="accordion-content">
        ${contentBefore}
        ${settingsHtml}
        ${contentAfter}
      </div>
    </section>
  `;
  },

  _generateSettingsHtml() {
    // Section 1: Findbar
    const findbarSettings = [
      { label: "Enable AI Findbar", pref: PREFS.ENABLED },
      { label: "Minimal Mode (similar to arc)", pref: PREFS.MINIMAL },
      { label: "Persist Chat (don't persist when browser closes)", pref: PREFS.PERSIST },
      { label: "Enable Drag and Drop", pref: PREFS.DND_ENABLED },
      { label: "Remember Dimensions", pref: PREFS.REMEMBER_DIMENSIONS },
    ];
    const positionOptions = {
      "top-left": "Top Left",
      "top-right": "Top Right",
      "bottom-left": "Bottom Left",
      "bottom-right": "Bottom Right",
    };
    const positionOptionsHTML = Object.entries(positionOptions)
      .map(([value, label]) => `<option value="${value}">${escapeXmlAttribute(label)}</option>`)
      .join("");
    const positionSelectorHtml = `
      <div class="setting-item">
        <label for="pref-position">Position</label>
        <select id="pref-position" data-pref="${PREFS.POSITION}">
          ${positionOptionsHTML}
        </select>
      </div>
    `;

    const backgroundStyleOptions = {
      solid: "Solid",
      acrylic: "Acrylic",
      pseudo: "Pseudo",
    };
    const backgroundStyleOptionsHTML = Object.entries(backgroundStyleOptions)
      .map(([value, label]) => `<option value="${value}">${escapeXmlAttribute(label)}</option>`)
      .join("");
    const backgroundStyleSelectorHtml = `
      <div class="setting-item">
        <label for="pref-background-style">Background Style</label>
        <select id="pref-background-style" data-pref="${PREFS.BACKGROUND_STYLE}">
          ${backgroundStyleOptionsHTML}
        </select>
      </div>
    `;

    const findbarResetPrefs = [...findbarSettings.map(s => s.pref), PREFS.POSITION, PREFS.BACKGROUND_STYLE];
    const findbarSectionHtml = this._createCheckboxSectionHtml(
      "Findbar AI (ctrl + shift + F)",
      findbarSettings,
      true,
      "",
      positionSelectorHtml + backgroundStyleSelectorHtml,
      findbarResetPrefs
    );

    // Section 2: URLBar AI
    const urlbarSettings = [
      { label: "Enable URLBar AI", pref: PREFS.URLBAR_AI_ENABLED },
      { label: "Enable Animations", pref: PREFS.URLBAR_AI_ANIMATIONS_ENABLED },
      { label: "Hide Suggestions", pref: PREFS.URLBAR_AI_HIDE_SUGGESTIONS },
    ];
    const urlbarSectionHtml = this._createCheckboxSectionHtml(
      "URLBar AI (ctrl + space)",
      urlbarSettings,
      false,
      "",
      "",
      urlbarSettings.map(s => s.pref)
    );

    // Section 3: AI Behavior
    const aiBehaviorSettings = [
      { label: "Enable Citations", pref: PREFS.CITATIONS_ENABLED },
      { label: "Stream Response", pref: PREFS.STREAM_ENABLED },
      { label: "Agentic Mode (AI can use tool calls)", pref: PREFS.AGENTIC_MODE },
      { label: "Conformation before tool call", pref: PREFS.CONFORMATION },
    ];
    const aiBehaviorWarningHtml = `
      <div id="citations-agentic-mode-warning" class="warning-message" >
        Warning: Enabling both Citations and Agentic Mode may lead to unexpected behavior or errors.
      </div>
    `;
    const maxToolCallsHtml = `
  <div class="setting-item">
    <label for="pref-max-tool-calls">Max Tool Calls (Maximum number of messages to send AI back to back)</label>
    <input type="number" id="pref-max-tool-calls" data-pref="${PREFS.MAX_TOOL_CALLS}" />
  </div>
`;

    const aiBehaviorResetPrefs = [...aiBehaviorSettings.map(s => s.pref), PREFS.MAX_TOOL_CALLS];
    const aiBehaviorSectionHtml = this._createCheckboxSectionHtml(
      "AI Behavior",
      aiBehaviorSettings,
      true,
      aiBehaviorWarningHtml,
      maxToolCallsHtml,
      aiBehaviorResetPrefs
    );

    // Section 4: Context Menu
    const contextMenuSettings = [
      { label: "Enable Context Menu (right click menu)", pref: PREFS.CONTEXT_MENU_ENABLED },
      {
        label: "Auto Send from Context Menu",
        pref: PREFS.CONTEXT_MENU_AUTOSEND,
      },
    ];
    const contextMenuCommandsHtml = `
      <div class="setting-item">
        <label for="pref-context-menu-command-no-selection">Command when no text is selected</label>
        <input type="text" id="pref-context-menu-command-no-selection" data-pref="${PREFS.CONTEXT_MENU_COMMAND_NO_SELECTION}" />
      </div>
      <div class="setting-item">
        <label for="pref-context-menu-command-with-selection">Command when text is selected. Use {selection} for the selected text.</label>
        <textarea id="pref-context-menu-command-with-selection" data-pref="${PREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION}" rows="3"></textarea>
      </div>
    `;
    const contextMenuResetPrefs = [...contextMenuSettings.map(s => s.pref), PREFS.CONTEXT_MENU_COMMAND_NO_SELECTION, PREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION];
    const contextMenuSectionHtml = this._createCheckboxSectionHtml(
      "Context Menu",
      contextMenuSettings,
      false,
      "",
      contextMenuCommandsHtml,
      contextMenuResetPrefs
    );

    // Section 5: LLM Providers
    let llmProviderSettingsHtml = "";
    for (const [name, provider] of Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)) {
      const modelPrefKey = provider.modelPref;

      let apiInputHtml;
      if (name === "ollama") {
        const baseUrlPrefKey = PREFS.OLLAMA_BASE_URL;
        apiInputHtml = `
        <div class="setting-item">
          <label for="pref-ollama-base-url">Base URL</label>
          <input type="text" id="pref-ollama-base-url" data-pref="${baseUrlPrefKey}" placeholder="http://localhost:11434/api" />
        </div>
      `;
      } else {
        const apiPrefKey = PREFS[`${name.toUpperCase()}_API_KEY`];
        apiInputHtml = apiPrefKey
          ? `
        <div class="setting-item">
          <label for="pref-${this._getSafeIdForProvider(name)}-api-key">API Key</label>
          <input type="password" id="pref-${this._getSafeIdForProvider(name)}-api-key" data-pref="${apiPrefKey}" placeholder="Enter ${provider.label} API Key" />
        </div>
      `
          : "";
      }

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

    const llmProvidersResetPrefs = [
      PREFS.LLM_PROVIDER,
      PREFS.OLLAMA_BASE_URL,
      ...Object.values(browseBotFindbarLLM.AVAILABLE_PROVIDERS).flatMap(p => [p.modelPref, PREFS[`${p.name.toUpperCase()}_API_KEY`]]).filter(Boolean)
    ];

    const llmProvidersSectionHtml = `
      <section class="settings-section settings-accordion" data-expanded="false">
        <h4 class="accordion-header">
            LLM Providers
            <div class="reset-section-btn" data-reset-prefs="${llmProvidersResetPrefs.join(",")}" title="Reset Section" role="button">
                <img src="chrome://global/skin/icons/reload.svg" />
            </div>
        </h4>
        <div class="setting-item accordion-content" class="">
          <label for="pref-llm-provider">Select Provider</label>
          <div id="llm-provider-selector-placeholder"></div>
        </div>
        ${llmProviderSettingsHtml}
      </section>`;

    // Section 8: Advanced LLM
    const advancedLLMSettings = [
      {
        label: "Temperature",
        pref: PREFS.LLM_TEMPERATURE,
        type: "number", step: 0.1, min: 0, max: 2,
        tooltip: "Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both."
      },
      {
        label: "Top P",
        pref: PREFS.LLM_TOP_P,
        type: "number", step: 0.1, min: 0, max: 1,
        tooltip: "Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both."
      },
      {
        label: "Top K",
        pref: PREFS.LLM_TOP_K,
        type: "number", step: 1, min: 0, max: 200,
        tooltip: "Only sample from the top K options for each subsequent token. Used to remove \"long tail\" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature."
      },
      {
        label: "Presence Penalty",
        pref: PREFS.LLM_PRESENCE_PENALTY,
        type: "number", step: 0.1, min: -2, max: 2,
        tooltip: "Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model."
      },
      {
        label: "Frequency Penalty",
        pref: PREFS.LLM_FREQUENCY_PENALTY,
        type: "number", step: 0.1, min: -2, max: 2,
        tooltip: "Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model."
      },
      {
        label: "Max Output Tokens",
        pref: PREFS.LLM_MAX_OUTPUT_TOKENS,
        type: "number", step: 1, min: 1, max: 32000,
        tooltip: "Maximum number of tokens to generate."
      },
    ];

    // Preset removed as per user request
    const advancedLLMResetPrefs = advancedLLMSettings.map(s => s.pref);

    const advancedLLMSectionHtml = this._createCheckboxSectionHtml(
      "Advanced LLM Settings",
      advancedLLMSettings,
      false,
      "", // No preset selector
      "",
      advancedLLMResetPrefs
    );

    // Section 6: Browser Findbar
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
      false,
      "",
      "",
      browserFindbarSettings.map(s => s.pref)
    );

    // Section 7: Development
    const devSettings = [{ label: "Debug Mode (logs in console)", pref: PREFS.DEBUG_MODE }];
    const devSectionHtml = this._createCheckboxSectionHtml("Development", devSettings, false);

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
            ${findbarSectionHtml}
            ${urlbarSectionHtml}
            ${aiBehaviorSectionHtml}
            ${contextMenuSectionHtml}
            ${llmProvidersSectionHtml}
            ${advancedLLMSectionHtml}
            ${browserSettingsHtml}
            ${devSectionHtml}
          </div>
        </div>
      </div>
    `;
  },
};

export default SettingsModal;
