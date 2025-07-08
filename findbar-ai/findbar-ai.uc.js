import windowManager, { windowManagerAPI } from "./windowManager.js";
import { llm } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./prefs.js";

windowManager();

const parseElement = (elementString, type = "html") => {
  if (type === "xul") {
    return window.MozXULElement.parseXULToFragment(elementString).firstChild;
  }

  let element = new DOMParser().parseFromString(elementString, "text/html");
  if (element.body.children.length) element = element.body.firstChild;
  else element = element.head.firstChild;
  return element;
};

const escapeXmlAttribute = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

PREFS.setInitialPrefs();

var markdownStylesInjected = false;
const injectMarkdownStyles = async () => {
  try {
    const { markedStyles } = await import(
      "chrome://userscripts/content/engine/marked.js"
    );
    const styleTag = parseElement(`<style>${markedStyles}<style>`);
    document.head.appendChild(styleTag);
    markdownStylesInjected = true;
    return true;
  } catch (e) {
    debugError(e);
    return false;
  }
};

function parseMD(markdown) {
  const markedOptions = { breaks: true, gfm: true };
  if (!markdownStylesInjected) {
    injectMarkdownStyles();
  }
  const content = window.marked
    ? window.marked.parse(markdown, markedOptions)
    : markdown;
  let htmlContent = parseElement(`<div class="markdown-body">${content}</div>`);

  return htmlContent;
}

const SettingsModal = {
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
          />`,
      )
      .join("");

    const menulistXul = `
      <menulist id="pref-llm-provider" data-pref="${PREFS.LLM_PROVIDER}" value="${PREFS.llmProvider}">
        <menupopup>
          ${providerOptionsXUL}
        </menupopup>
      </menulist>`;

    const providerSelectorXulElement = parseElement(menulistXul, "xul");
    const placeholder = this._modalElement.querySelector(
      "#llm-provider-selector-placeholder",
    );
    if (placeholder) {
      placeholder.replaceWith(providerSelectorXulElement);
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
            />`,
      ).join("");

      const modelMenulistXul = `
          <menulist id="pref-${this._getSafeIdForProvider(name)}-model" data-pref="${modelPrefKey}" value="${currentModel}">
            <menupopup>
              ${modelOptionsXUL}
            </menupopup>
          </menulist>`;

      const modelPlaceholder = this._modalElement.querySelector(
        `#llm-model-selector-placeholder-${this._getSafeIdForProvider(name)}`,
      );
      if (modelPlaceholder) {
        const modelSelectorXulElement = parseElement(modelMenulistXul, "xul");
        modelPlaceholder.replaceWith(modelSelectorXulElement);
      }
    }

    this._attachEventListeners();
    this._updateWarningMessage();
    return container;
  },

  _attachEventListeners() {
    if (!this._modalElement) return;

    // Close button
    this._modalElement
      .querySelector("#close-settings")
      .addEventListener("click", () => {
        this.hide();
      });

    // Save button
    this._modalElement
      .querySelector("#save-settings")
      .addEventListener("click", () => {
        this.saveSettings();
        this.hide();
        findbar.updateFindbar();
        findbar.showAIInterface();
      });

    this._modalElement.addEventListener("click", (e) => {
      if (e.target === this._modalElement) {
        this.hide();
      }
    });

    // Initialize and listen to changes on controls (store in _currentPrefValues)
    this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      const prefName = PREFS.getPrefSetterName(prefKey);

      // Initialize control value from PREFS
      if (control.type === "checkbox") {
        control.checked = PREFS[prefName];
      } else {
        if (control.tagName.toLowerCase() === "menulist") {
          control.value = PREFS[prefName];
        } else {
          control.value = PREFS[prefName];
        }
      }
      this._currentPrefValues[prefName] = PREFS[prefName];

      // Store changes in _currentPrefValues
      if (control.tagName.toLowerCase() === "menulist") {
        control.addEventListener("command", (e) => {
          this._currentPrefValues[prefName] = e.target.value;
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefName]}`,
          );
          if (prefKey === PREFS.LLM_PROVIDER) {
            this._updateProviderSpecificSettings(
              this._modalElement,
              this._currentPrefValues[prefName],
            );
          }
        });
      } else {
        control.addEventListener("change", (e) => {
          this._currentPrefValues[prefName] =
            control.type === "checkbox" ? e.target.checked : e.target.value;
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefName]}`,
          );
          if (
            prefKey === PREFS.CITATIONS_ENABLED ||
            prefKey === PREFS.GOD_MODE
          ) {
            this._updateWarningMessage();
          }
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
    for (const prefName in this._currentPrefValues) {
      if (
        Object.prototype.hasOwnProperty.call(this._currentPrefValues, prefName)
      ) {
        PREFS[prefName] = this._currentPrefValues[prefName];
        debugLog(`Saving pref ${prefName} to: ${PREFS[prefName]}`);
      }
    }
    // Special case: If API key is empty after saving, ensure findbar is collapsed
    if (!llm.currentProvider.apiKey) {
      findbar.expanded = false;
    }
  },

  show() {
    this.createModalElement();
    this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      const prefName = PREFS.getPrefSetterName(prefKey);
      if (control.type === "checkbox") {
        control.checked = PREFS[prefName];
      } else {
        // For XUL menulist, ensure its value is set correctly on show
        if (control.tagName.toLowerCase() === "menulist") {
          control.value = PREFS[prefName];
        } else {
          control.value = PREFS[prefName];
        }
      }
      this._currentPrefValues[prefName] = PREFS[prefName];
    });
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider);
    this._updateWarningMessage();

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
      `#${this._getSafeIdForProvider(selectedProviderName)}-settings-group`,
    );
    if (activeGroup) {
      activeGroup.style.display = "block";

      // Dynamically update the model dropdown for the active provider
      const modelPrefKey = PREFS[`${selectedProviderName.toUpperCase()}_MODEL`];
      if (modelPrefKey) {
        const modelPrefName = PREFS.getPrefSetterName(modelPrefKey);
        // Use the safe ID for the model selector as well
        const modelSelect = activeGroup.querySelector(
          `#pref-${this._getSafeIdForProvider(selectedProviderName)}-model`,
        );
        if (modelSelect) {
          modelSelect.value =
            this._currentPrefValues[modelPrefName] || PREFS[modelPrefName];
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

  _updateWarningMessage() {
    if (!this._modalElement) return;

    const citationsEnabled =
      this._currentPrefValues[PREFS.getPrefSetterName(PREFS.CITATIONS_ENABLED)];
    const godModeEnabled =
      this._currentPrefValues[PREFS.getPrefSetterName(PREFS.GOD_MODE)];
    const warningDiv = this._modalElement.querySelector(
      "#citations-god-mode-warning",
    );

    if (citationsEnabled && godModeEnabled) {
      if (warningDiv) warningDiv.style.display = "block";
    } else {
      if (warningDiv) warningDiv.style.display = "none";
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

  _createCheckboxSectionHtml(title, settingsArray, additionalContentHtml = "") {
    const settingsHtml = settingsArray
      .map((s) => this._generateCheckboxSettingHtml(s.label, s.pref))
      .join("");
    return `
      <section class="settings-section">
        <h4>${title}</h4>
        ${additionalContentHtml}
        ${settingsHtml}
      </section>
    `;
  },

  _generateSettingsHtml() {
    const generalSettings = [
      { label: "Enable AI Findbar", pref: PREFS.ENABLED },
      { label: "Minimal Mode", pref: PREFS.MINIMAL },
      { label: "Persist Chat", pref: PREFS.PERSIST },
      { label: "Debug Mode", pref: PREFS.DEBUG_MODE },
    ];
    const generalSectionHtml = this._createCheckboxSectionHtml(
      "General",
      generalSettings,
    );

    const aiBehaviorSettings = [
      { label: "Enable Citations", pref: PREFS.CITATIONS_ENABLED },
      { label: "God Mode (AI can use tool calls)", pref: PREFS.GOD_MODE },
    ];
    const aiBehaviorWarningHtml = `
      <div id="citations-god-mode-warning" class="warning-message" style="display: none; color: red; margin-bottom: 10px;">
        Warning: Enabling both Citations and God Mode may lead to unexpected behavior or errors.
      </div>
    `;
    const aiBehaviorSectionHtml = this._createCheckboxSectionHtml(
      "AI Behavior",
      aiBehaviorSettings,
      aiBehaviorWarningHtml,
    );

    // Context Menu Settings
    const contextMenuSettings = [
      { label: "Enable Context Menu", pref: PREFS.CONTEXT_MENU_ENABLED },
      {
        label: "Auto Send from Context Menu",
        pref: PREFS.CONTEXT_MENU_AUTOSEND,
      },
    ];
    const contextMenuSectionHtml = this._createCheckboxSectionHtml(
      "Context Menu",
      contextMenuSettings,
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
            <button class="get-api-key-link" data-url="${escapeXmlAttribute(provider.apiKeyUrl || "")}" style="display: ${provider.apiKeyUrl ? "inline-block" : "none"};">Get API Key</button>
          </div>
          ${apiInputHtml}
          ${modelSelectPlaceholderHtml}
        </div>
      `;
    }

    const llmProvidersSectionHtml = `
      <section class="settings-section">
        <h4>LLM Providers</h4>
        <div class="setting-item">
          <label for="pref-llm-provider">Select Provider</label>
          <div id="llm-provider-selector-placeholder"></div>
        </div>
        ${llmProviderSettingsHtml}
      </section>`;

    return `
      <div id="ai-settings-modal-overlay">
        <div class="findbar-ai-settings-modal">
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
          </div>
        </div>
      </div>
    `;
  },
};

const findbar = {
  findbar: null,
  expandButton: null,
  chatContainer: null,
  apiKeyContainer: null,
  _updateFindbar: null,
  _addKeymaps: null,
  _handleInputKeyPress: null,
  _handleFindFieldInput: null,
  _isExpanded: false,
  _updateContextMenuText: null,
  _godModeListener: null,
  _citationsListener: null,
  _contextMenuEnabledListener: null,
  _minimalListener: null,
  contextMenuItem: null,
  _matchesObserver: null,

  get expanded() {
    return this._isExpanded;
  },
  set expanded(value) {
    const isChanged = value !== this._isExpanded;
    this._isExpanded = value;
    if (!this.findbar) return;
    this.findbar.expanded = value;

    // Handle the button text for the non-minimal "Expand" button
    if (this.expandButton) {
      this.expandButton.textContent = value ? "Collapse" : "Expand";
    }

    if (value) {
      if (!this.minimal) {
        this.findbar.classList.add("ai-expanded");
      }
      this.show();
      this.showAIInterface();
      if (isChanged) this.focusPrompt();
      const messagesContainer =
        this?.chatContainer?.querySelector("#chat-messages");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } else {
      this.findbar.classList.remove("ai-expanded");
      this.removeAIInterface();
      if (isChanged && !this.minimal) this.focusInput();
    }
  },
  toggleExpanded() {
    this.expanded = !this.expanded;
  },

  get enabled() {
    return PREFS.enabled;
  },
  set enabled(value) {
    if (typeof value === "boolean") PREFS.enabled = value;
  },
  toggleEnabled() {
    this.enabled = !this.enabled;
  },
  handleEnabledChange(enabled) {
    if (enabled.value) this.init();
    else this.destroy();
  },

  get minimal() {
    return PREFS.minimal;
  },
  set minimal(value) {
    if (typeof value === "boolean") {
      PREFS.minimal = value;
      if (value) this.expanded = false;
      // Remove both buttons and add the correct one for the new mode
      if (this.findbar) {
        this.removeExpandButton();
        this.addExpandButton();
      }
    }
  },

  handleMinimalPrefChange: function(pref) {
    this.minimal = pref.value;
    this.updateFindbar();
  },

  updateFindbar() {
    SettingsModal.hide();
    this.removeExpandButton();
    this.removeAIInterface();
    if (!PREFS.persistChat) {
      this.hide();
      this.expanded = false;
      llm.clearData();
      if (this.findbar) this.findbar.history = null;
    }
    gBrowser.getFindBar().then((findbar) => {
      this.findbar = findbar;
      this.addExpandButton();
      if (PREFS.persistChat) {
        if (this?.findbar?.history) llm.history = this.findbar.history;
        else llm.history = [];
        if (this?.findbar?.expanded) {
          setTimeout(() => (this.expanded = true), 200);
        } else {
          this.hide();
          this.expanded = false;
        }
      } else {
        this.hide();
        this.expanded = false;
      }
      setTimeout(() => this.updateFoundMatchesDisplay(), 0); // Wait for DOM update
      this.findbar._findField.removeEventListener(
        "keypress",
        this._handleInputKeyPress,
      );
      this.findbar._findField.addEventListener(
        "keypress",
        this._handleInputKeyPress,
      );
      this.findbar._findField.removeEventListener(
        "input",
        this._handleFindFieldInput,
      );
      this.findbar._findField.addEventListener(
        "input",
        this._handleFindFieldInput,
      );

      const originalOnFindbarOpen = this.findbar.browser.finder.onFindbarOpen;
      const originalOnFindbarClose = this.findbar.browser.finder.onFindbarClose;

      //making sure this only runs one time
      if (!findbar?.openOverWritten) {
        //update placeholder when findbar is opened
        findbar.browser.finder.onFindbarOpen = (...args) => {
          originalOnFindbarOpen.apply(findbar.browser.finder, args); //making sure original function is called
          if (this.enabled) {
            debugLog("Findbar is being opened");
            setTimeout(
              () =>
              (this.findbar._findField.placeholder =
                "Press Alt + Enter to ask AI"),
              100,
            );

            if (this.minimal) this.showAIInterface();
          }
        };
        findbar.browser.finder.onFindbarClose = (...args) => {
          originalOnFindbarClose.apply(findbar.browser.finder, args);
          if (this.enabled) {
            debugLog("Findbar is being closed");
          }
        };
        findbar.openOverWritten = true;
      }
    });
  },

  show() {
    if (!this.findbar) return false;
    this.findbar.open();
    this.focusInput();
    if (this.minimal) this.showAIInterface();
    return true;
  },
  hide() {
    if (!this.findbar) return false;
    this.findbar.close();
    this.findbar.toggleHighlight(false);
    return true;
  },
  toggleVisibility() {
    if (!this.findbar) return;
    if (this.findbar.hidden) this.show();
    else this.hide();
  },

  createAPIKeyInterface() {
    const currentProviderName = llm.currentProvider.name;
    const menuItems = Object.entries(llm.AVAILABLE_PROVIDERS)
      .map(
        ([name, provider]) => `
                  <menuitem
                    value="${name}"
                    label="${escapeXmlAttribute(provider.label)}"
                    ${name === currentProviderName ? 'selected="true"' : ""}
                    ${provider.faviconUrl ? `image="${escapeXmlAttribute(provider.faviconUrl)}"` : ""}
                  />
                `,
      )
      .join("");

    const menulistXul = `
        <menulist id="provider-selector" class="provider-selector" value="${currentProviderName}">
          <menupopup>
            ${menuItems}
          </menupopup>
        </menulist>`;

    const providerSelectorXulElement = parseElement(menulistXul, "xul");

    const html = `
        <div class="findbar-ai-setup">
          <div class="ai-setup-content">
            <h3>AI Setup Required</h3>
            <p>To use AI features, you need to set up your API key and select a provider.</p>
            <div class="provider-selection-group">
              <label for="provider-selector">Select Provider:</label>
            </div>
            <div class="api-key-input-group">
              <input type="password" id="api-key" placeholder="Enter your API key" />
              <button id="save-api-key">Save</button>
            </div>
            <div class="api-key-links">
              <button id="get-api-key-link">Get API Key</button>
            </div>
          </div>
        </div>`;
    const container = parseElement(html);

    const providerSelectionGroup = container.querySelector(
      ".provider-selection-group",
    );
    // Insert the XUL menulist after the label within the group
    providerSelectionGroup.appendChild(providerSelectorXulElement);

    const providerSelector = container.querySelector("#provider-selector");
    const input = container.querySelector("#api-key");
    const saveBtn = container.querySelector("#save-api-key");
    const getApiKeyLink = container.querySelector("#get-api-key-link");

    // Initialize the input and link based on the currently selected provider
    input.value = llm.currentProvider.apiKey || "";
    getApiKeyLink.disabled = !llm.currentProvider.apiKeyUrl;
    getApiKeyLink.title = llm.currentProvider.apiKeyUrl
      ? "Get API Key"
      : "No API key link available for this provider.";

    // Use 'command' event for XUL menulist
    providerSelector.addEventListener("command", (e) => {
      const selectedProviderName = e.target.value;
      llm.setProvider(selectedProviderName); // This also updates PREFS.llmProvider internally
      input.value = llm.currentProvider.apiKey || "";
      getApiKeyLink.disabled = !llm.currentProvider.apiKeyUrl;
      getApiKeyLink.title = llm.currentProvider.apiKeyUrl
        ? "Get API Key"
        : "No API key link available for this provider.";
    });

    getApiKeyLink.addEventListener("click", () => {
      openTrustedLinkIn(llm.currentProvider.apiKeyUrl, "tab");
    });

    saveBtn.addEventListener("click", () => {
      const key = input.value.trim();
      if (key) {
        llm.currentProvider.apiKey = key; // This also updates PREFS.mistralApiKey/geminiApiKey internally
        this.showAIInterface(); // Refresh UI after saving key
      }
    });
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });
    return container;
  },

  async sendMessage(prompt) {
    if (!prompt) return;

    this.show();
    this.expanded = true;

    const pageContext = {
      url: gBrowser.currentURI.spec,
      title: gBrowser.selectedBrowser.contentTitle,
    };

    this.addChatMessage({ answer: prompt }, "user");

    const loadingIndicator = this.createLoadingIndicator();
    const messagesContainer =
      this.chatContainer.querySelector("#chat-messages");
    if (messagesContainer) {
      messagesContainer.appendChild(loadingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      const response = await llm.sendMessage(prompt, pageContext);
      if (response && response.answer) {
        this.addChatMessage(response, "ai");
      }
    } catch (e) {
      this.addChatMessage({ answer: `Error: ${e.message}` }, "error");
    } finally {
      loadingIndicator.remove();
      this.focusInput();
      if (PREFS.persistChat) this.findbar.history = llm.getHistory();
    }
  },

  createChatInterface() {
    const chatInputGroup = this.minimal
      ? ""
      : `<div class="ai-chat-input-group">
          <textarea id="ai-prompt" placeholder="Ask AI anything..." rows="2"></textarea>
          <button id="send-prompt" class="send-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.991 6.01L5.399 10.563l4.195 2.428l3.699-3.7a1 1 0 0 1 1.414 1.415l-3.7 3.7l2.43 4.194L17.99 6.01Zm.323-2.244c1.195-.433 2.353.725 1.92 1.92l-5.282 14.605c-.434 1.198-2.07 1.344-2.709.241l-3.217-5.558l-5.558-3.217c-1.103-.639-.957-2.275.241-2.709z" />
            </svg>
          </button>
        </div>`;

    const container = parseElement(`
        <div class="findbar-ai-chat">
          <div class="ai-chat-header"></div>
          <div class="ai-chat-messages" id="chat-messages"></div>
          ${chatInputGroup}
        </div>`);

    const chatHeader = container.querySelector(".ai-chat-header");

    const clearBtn = parseElement(
      `
        <toolbarbutton 
          id="clear-chat" 
          class="clear-chat-btn" 
          image="chrome://global/skin/icons/delete.svg" 
          tooltiptext="Clear Chat"
        />`,
      "xul",
    );

    const settingsBtn = parseElement(
      `
        <toolbarbutton 
          id="open-settings-btn" 
          class="settings-btn" 
          image="chrome://global/skin/icons/settings.svg" 
          tooltiptext="Settings"
        />`,
      "xul",
    );

    chatHeader.appendChild(clearBtn);
    chatHeader.appendChild(settingsBtn);

    const chatMessages = container.querySelector("#chat-messages");

    if (!this.minimal) {
      const promptInput = container.querySelector("#ai-prompt");
      const sendBtn = container.querySelector("#send-prompt");
      const handleSend = () => this.sendMessage(promptInput.value.trim());
      sendBtn.addEventListener("click", handleSend);
      promptInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    clearBtn.addEventListener("click", () => {
      container.querySelector("#chat-messages").innerHTML = "";
      llm.clearData();
      this.findbar.history = null;
      this.expanded = false;
    });

    settingsBtn.addEventListener("click", () => {
      SettingsModal.show(); // Open the settings modal
    });

    chatMessages.addEventListener("click", async (e) => {
      if (e.target.classList.contains("citation-link")) {
        const button = e.target;
        const citationId = button.dataset.citationId;
        const messageEl = button.closest(".chat-message[data-citations]");

        if (messageEl) {
          const citations = JSON.parse(messageEl.dataset.citations);
          const citation = citations.find((c) => c.id == citationId);
          if (citation && citation.source_quote) {
            debugLog(
              `[findbar-ai] Citation [${citationId}] clicked. Requesting highlight for:`,
              citation.source_quote,
            );
            await windowManagerAPI.highlightAndScrollToText(
              citation.source_quote,
            );
          }
        }
      } else if (e.target?.href) {
        e.preventDefault();
        try {
          openTrustedLinkIn(e.target.href, "tab");
        } catch (e) { }
      }
    });

    return container;
  },

  createLoadingIndicator() {
    const messageDiv = parseElement(
      `<div class="chat-message chat-message-loading"></div>`,
    );
    const contentDiv = parseElement(
      `<div class="message-content">Loading...</div>`,
    );
    messageDiv.appendChild(contentDiv);
    return messageDiv;
  },

  addChatMessage(response, type) {
    const { answer, citations } = response;
    if (!this.chatContainer || !answer) return;
    const messagesContainer =
      this.chatContainer.querySelector("#chat-messages");
    if (!messagesContainer) return;

    const messageDiv = parseElement(
      `<div class="chat-message chat-message-${type}"></div>`,
    );
    if (citations && citations.length > 0) {
      messageDiv.dataset.citations = JSON.stringify(citations);
    }

    const contentDiv = parseElement(`<div class="message-content"></div>`);
    const processedContent = answer.replace(
      /\[(\d+)\]/g,
      `<button class="citation-link" data-citation-id="$1">[$1]</button>`,
    );
    contentDiv.appendChild(parseMD(processedContent));

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  showAIInterface() {
    if (!this.findbar) return;
    this.removeAIInterface(); // Removes API key, chat, and settings interfaces

    // Remove settings modal class from findbar as it's now a separate modal
    this.findbar.classList.remove("ai-settings-active");

    if (!llm.currentProvider.apiKey) {
      this.apiKeyContainer = this.createAPIKeyInterface();
      this.findbar.insertBefore(this.apiKeyContainer, this.findbar.firstChild);
    } else {
      this.chatContainer = this.createChatInterface();
      const history = llm.getHistory();
      for (const message of history) {
        if (
          message.role === "tool" ||
          (message?.parts && message?.parts.some((p) => p.functionCall))
        )
          continue;

        const isModel = message.role === "model";
        const textContent = message?.parts[0]?.text;
        if (!textContent) continue;

        let responsePayload = { answer: "" };

        if (isModel && PREFS.citationsEnabled) {
          responsePayload = llm.parseModelResponseText(textContent);
        } else {
          responsePayload.answer = textContent.replace(
            /\[Current Page Context:.*?\]\s*/,
            "",
          );
        }

        if (responsePayload.answer) {
          this.addChatMessage(responsePayload, isModel ? "ai" : "user");
        }
      }
      this.findbar.insertBefore(this.chatContainer, this.findbar.firstChild);
    }
  },

  focusInput() {
    if (this.findbar) setTimeout(() => this.findbar._findField.focus(), 10);
  },
  focusPrompt() {
    if (this.minimal) {
      this.focusInput();
      return;
    }
    const promptInput = this.chatContainer?.querySelector("#ai-prompt");
    if (promptInput) setTimeout(() => promptInput.focus(), 10);
  },
  setPromptText(text) {
    if (this.minimal) {
      if (this.findbar?._findField) {
        this.findbar._findField.value = text;
      }
      return;
    }
    const promptInput = this?.chatContainer?.querySelector("#ai-prompt");
    if (promptInput && text) promptInput.value = text;
  },
  async setPromptTextFromSelection() {
    let text = "";
    const selection = await windowManagerAPI.getSelectedText();
    if (!selection || !selection.hasSelection)
      text = this?.findbar?._findField?.value;
    else text = selection.selectedText;
    this.setPromptText(text);
  },

  removeAIInterface() {
    if (this.apiKeyContainer) {
      this.apiKeyContainer.remove();
      this.apiKeyContainer = null;
    }
    if (this.chatContainer) {
      this.chatContainer.remove();
      this.chatContainer = null;
    }
  },

  init() {
    if (!this.enabled) return;
    this.updateFindbar();
    this.addListeners();
    if (PREFS.contextMenuEnabled) {
      this.addContextMenuItem();
    }
  },
  destroy() {
    this.findbar = null;
    this.expanded = false;
    try {
      this.removeListeners();
    } catch { }
    this.removeExpandButton();
    this.removeContextMenuItem();
    this.removeAIInterface();
    SettingsModal.hide();
  },

  addExpandButton() {
    if (!this.findbar) return false;

    // Always remove both buttons before adding the correct one
    this.removeExpandButton();

    if (this.minimal) {
      const container = this.findbar.querySelector(".findbar-container");
      if (container && !container.querySelector("#findbar-ask")) {
        const askBtn = parseElement(
          `<button id="findbar-ask" anonid="findbar-ask">Ask</button>`,
        );
        askBtn.addEventListener("click", () => {
          const inpText = this.findbar._findField.value.trim();
          this.sendMessage(inpText);
          this.findbar._findField.value = "";
          this.focusInput();
        });
        container.appendChild(askBtn);
        this.askButton = askBtn;
      }
    } else {
      const button_id = "findbar-expand";
      const button = parseElement(
        `<button id="${button_id}" anonid="${button_id}">Expand</button>`,
      );
      button.addEventListener("click", () => this.toggleExpanded());
      button.textContent = this.expanded ? "Collapse" : "Expand";
      this.findbar.appendChild(button);
      this.expandButton = button;
    }
    return true;
  },

  removeExpandButton() {
    if (this.askButton) {
      this.askButton.remove();
      this.askButton = null;
    }
    if (this.expandButton) {
      this.expandButton.remove();
      this.expandButton = null;
    }
    return true;
  },

  handleInputKeyPress: function(e) {
    if (e?.key === "Enter" && e?.altKey) {
      e.preventDefault();
      const inpText = this.findbar._findField.value.trim();
      this.sendMessage(inpText);
      this.findbar._findField.value = "";
      this.focusInput();
    }
  },

  addContextMenuItem(retryCount = 0) {
    if (this.contextMenuItem) return; // Already added
    if (!PREFS.contextMenuEnabled) return;

    const contextMenu = document.getElementById("contentAreaContextMenu");

    if (!contextMenu) {
      if (retryCount < 5) {
        debugLog(
          `Context menu not found, retrying... (attempt ${retryCount + 1}/5)`,
        );
        setTimeout(() => this.addContextMenuItem(retryCount + 1), 200);
      } else {
        debugError(
          "Failed to add context menu item after 5 attempts: Context menu not found.",
        );
      }
      return;
    }

    const menuItem = document.createXULElement("menuitem");
    menuItem.id = "ai-findbar-context-menu-item";
    menuItem.setAttribute("label", "Ask AI");
    menuItem.setAttribute("accesskey", "A");

    menuItem.addEventListener(
      "command",
      this.handleContextMenuClick.bind(this),
    );
    this.contextMenuItem = menuItem;

    const searchSelectItem = contextMenu.querySelector("#context-searchselect");

    if (searchSelectItem) {
      // Insert right after the searchselect item
      if (searchSelectItem.nextSibling) {
        contextMenu.insertBefore(menuItem, searchSelectItem.nextSibling);
      } else {
        contextMenu.appendChild(menuItem);
      }
    } else {
      // Fallback: insert after context-sep-redo separator
      const redoSeparator = contextMenu.querySelector("#context-sep-redo");
      if (redoSeparator) {
        if (redoSeparator.nextSibling) {
          contextMenu.insertBefore(menuItem, redoSeparator.nextSibling);
        } else {
          contextMenu.appendChild(menuItem);
        }
      } else {
        // Final fallback: don't add the menu item if neither element is found
        return;
      }
    }

    this._updateContextMenuText = this.updateContextMenuText.bind(this);
    contextMenu.addEventListener("popupshowing", this._updateContextMenuText);
  },

  removeContextMenuItem: function() {
    this?.contextMenuItem?.remove();
    this.contextMenuItem = null;
    document
      ?.getElementById("contentAreaContextMenu")
      ?.removeEventListener("popupshowing", this._updateContextMenuText);
  },
  handleContextMenuClick: async function() {
    const selection = await windowManagerAPI.getSelectedText();
    let finalMessage = "";
    if (!selection.hasSelection) {
      finalMessage = "Summarize current page";
    } else {
      finalMessage += "Explain this in context of current page\n";
      const selectedTextFormatted = selection?.selectedText
        ?.split("\n")
        ?.map((line) => line.trim())
        ?.filter((line) => line.length > 0)
        ?.map((line) => "> " + line)
        ?.join("\n");

      finalMessage += selectedTextFormatted;
    }
    this.expanded = true;
    if (PREFS.contextMenuAutoSend) {
      this.sendMessage(finalMessage);
      this.focusPrompt();
    } else {
      this.setPromptText(finalMessage);
      this.show();
      this.focusPrompt();
    }
  },

  handleContextMenuPrefChange: function(pref) {
    if (pref.value) this.addContextMenuItem();
    else this.removeContextMenuItem();
  },
  updateContextMenuText() {
    if (!PREFS.contextMenuEnabled) return;
    if (!this.contextMenuItem) return;
    const hasSelection = gContextMenu?.isTextSelected === true;
    this.contextMenuItem.label = hasSelection ? "Ask AI" : "Summarize with AI";
  },

  //TODO: add drag and drop
  doResize: function() { },
  stopResize: function() { },
  doDrag: function() { },
  stopDrag: function() { },
  stopDrag: function() { },

  addKeymaps: function(e) {
    if (
      e.key &&
      e.key.toLowerCase() === "f" &&
      e.ctrlKey &&
      e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.expanded = true;
      this.show();
      this.focusPrompt();
      this.setPromptTextFromSelection();
    }
    if (e.key?.toLowerCase() === "escape") {
      if (
        SettingsModal._modalElement &&
        SettingsModal._modalElement.parentNode
      ) {
        // If settings modal is open, close it
        e.preventDefault();
        e.stopPropagation();
        SettingsModal.hide();
      } else if (this.expanded) {
        e.preventDefault();
        e.stopPropagation();
        this.expanded = false;
        if (this.minimal) this.hide();
        else this.focusInput();
      }
    }
  },

  addListeners() {
    this._updateFindbar = this.updateFindbar.bind(this);
    this._addKeymaps = this.addKeymaps.bind(this);
    this._handleInputKeyPress = this.handleInputKeyPress.bind(this);
    this._handleFindFieldInput = this.updateFoundMatchesDisplay.bind(this);
    const _clearLLMData = () => {
      llm.clearData();
      this.findbar.history = null;
    };
    const _handleContextMenuPrefChange =
      this.handleContextMenuPrefChange.bind(this);
    const _handleMinimalPrefChange = this.handleMinimalPrefChange.bind(this);

    gBrowser.tabContainer.addEventListener("TabSelect", this._updateFindbar);
    document.addEventListener("keydown", this._addKeymaps);
    this._godModeListener = UC_API.Prefs.addListener(
      PREFS.GOD_MODE,
      _clearLLMData,
    );
    this._citationsListener = UC_API.Prefs.addListener(
      PREFS.CITATIONS_ENABLED,
      _clearLLMData,
    );
    this._minimalListener = UC_API.Prefs.addListener(
      PREFS.MINIMAL,
      _handleMinimalPrefChange,
    );
    this._contextMenuEnabledListener = UC_API.Prefs.addListener(
      PREFS.CONTEXT_MENU_ENABLED,
      _handleContextMenuPrefChange,
    );
  },

  removeListeners() {
    if (this.findbar) {
      this.findbar._findField.removeEventListener(
        "keypress",
        this._handleInputKeyPress,
      );
      this.findbar._findField.removeEventListener(
        "input",
        this._handleFindFieldInput,
      );
    }
    gBrowser.tabContainer.removeEventListener("TabSelect", this._updateFindbar);
    document.removeEventListener("keydown", this._addKeymaps);
    UC_API.Prefs.removeListener(this._godModeListener);
    UC_API.Prefs.removeListener(this._citationsListener);
    UC_API.Prefs.removeListener(this._contextMenuEnabledListener);
    UC_API.Prefs.removeListener(this._minimalListener);

    // Disconnect the MutationObserver when listeners are removed
    if (this._matchesObserver) {
      this._matchesObserver.disconnect();
      this._matchesObserver = null;
    }

    this._handleInputKeyPress = null;
    this._handleFindFieldInput = null;
    this._updateFindbar = null;
    this._addKeymaps = null;
    this._godModeListener = null;
    this._citationsListener = null;
    this._contextMenuEnabledListener = null;
    this._minimalListener = null;
  },

  updateFoundMatchesDisplay(retry = 0) {
    if (!this.findbar) return;
    const matches = this.findbar.querySelector(".found-matches");
    const status = this.findbar.querySelector(".findbar-find-status");
    const wrapper = this.findbar.querySelector(
      'hbox[anonid="findbar-textbox-wrapper"]',
    );
    if (!wrapper) {
      if (retry < 10)
        setTimeout(() => this.updateFoundMatchesDisplay(retry + 1), 100);
      return;
    }
    if (matches && matches.parentElement !== wrapper)
      wrapper.appendChild(matches);
    if (status && status.parentElement !== wrapper) wrapper.appendChild(status);

    if (status && status.getAttribute("status") === "notfound") {
      status.setAttribute("value", "0/0");
      status.textContent = "0/0";
    }

    if (matches) {
      const labelChild = matches.querySelector("label");
      let labelValue = labelChild
        ? labelChild.getAttribute("value")
        : matches.getAttribute("value");
      let newLabel = "";
      if (labelValue) {
        let normalized = labelValue.replace(
          /(\d+)\s+of\s+(\d+)(?:\s+match(?:es)?)?/i,
          "$1/$2",
        );
        newLabel = normalized === "1/1" ? "1/1" : normalized;
      }
      if (labelChild) {
        if (labelChild.getAttribute("value") !== newLabel)
          labelChild.setAttribute("value", newLabel);
        if (labelChild.textContent !== newLabel)
          labelChild.textContent = newLabel;
      } else {
        if (matches.getAttribute("value") !== newLabel)
          matches.setAttribute("value", newLabel);
        if (matches.textContent !== newLabel) matches.textContent = newLabel;
      }

      // Disconnect existing observer before creating a new one
      if (this._matchesObserver) this._matchesObserver.disconnect();

      const observer = new MutationObserver(() =>
        this.updateFoundMatchesDisplay(),
      );
      observer.observe(matches, {
        attributes: true,
        attributeFilter: ["value"],
      });
      if (labelChild)
        observer.observe(labelChild, {
          attributes: true,
          attributeFilter: ["value"],
        });
      if (status)
        observer.observe(status, {
          attributes: true,
          attributeFilter: ["status", "value"],
        });
      this._matchesObserver = observer;
    }
  },
};

findbar.init();
UC_API.Prefs.addListener(
  PREFS.ENABLED,
  findbar.handleEnabledChange.bind(findbar),
);
window.findbar = findbar;
