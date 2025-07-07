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
  _currentPrefValues: {}, // Store values from the form before saving

  createModalElement() {
    const settingsHtml = this._generateSettingsHtml();
    const container = parseElement(settingsHtml);
    this._modalElement = container;

    // Manually create and insert the XUL menulist for LLM Provider selection
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

    this._attachEventListeners();
    this._updateWarningMessage(); // Initial check for warning
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
        // Notify findbar to update UI based on new settings
        findbar.updateFindbar();
        findbar.showAIInterface();
      });

    // Initialize and listen to changes on controls (store in _currentPrefValues)
    this._modalElement.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      const prefName = PREFS.getPrefSetterName(prefKey); // Use helper from PREFS object

      // Initialize control value from PREFS
      if (control.type === "checkbox") {
        control.checked = PREFS[prefName];
      } else {
        // For XUL menulist, ensure its value is set correctly on attach
        if (control.tagName.toLowerCase() === "menulist") {
          control.value = PREFS[prefName];
        } else {
          control.value = PREFS[prefName];
        }
      }
      this._currentPrefValues[prefName] = PREFS[prefName]; // Sync internal state

      // Store changes in _currentPrefValues
      if (control.tagName.toLowerCase() === "menulist") {
        // Special handling for XUL menulist using 'command' event
        control.addEventListener("command", (e) => {
          this._currentPrefValues[prefName] = e.target.value;
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefName]}`,
          );
          this._updateProviderSpecificSettings(
            this._modalElement,
            this._currentPrefValues[prefName],
          );
        });
      } else {
        control.addEventListener("change", (e) => {
          this._currentPrefValues[prefName] =
            control.type === "checkbox" ? e.target.checked : e.target.value;
          debugLog(
            `Settings form value for ${prefKey} changed to: ${this._currentPrefValues[prefName]}`,
          );
          // Update warning message if relevant preferences change
          if (
            prefKey === PREFS.CITATIONS_ENABLED ||
            prefKey === PREFS.GOD_MODE
          ) {
            this._updateWarningMessage();
          }
        });
      }
    });

    // Initial update for provider-specific settings display
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider);
  },

  saveSettings() {
    // Iterate _currentPrefValues and set PREFS
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
    if (!this._modalElement) {
      this.createModalElement();
    }
    // Always re-initialize control values from actual PREFS before showing
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
      this._currentPrefValues[prefName] = PREFS[prefName]; // Sync internal state
    });
    this._updateProviderSpecificSettings(this._modalElement, PREFS.llmProvider); // Update model dropdowns based on current PREFS
    this._updateWarningMessage(); // Update warning message when showing the modal

    document.documentElement.appendChild(this._modalElement); // Append to documentElement for full-screen overlay
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

    const activeGroup = container.querySelector(
      `#${selectedProviderName}-settings-group`,
    );
    if (activeGroup) {
      activeGroup.style.display = "block";

      // Dynamically update the model dropdown for the active provider
      const modelPrefKey = PREFS[`${selectedProviderName.toUpperCase()}_MODEL`];
      if (modelPrefKey) {
        const modelPrefName = PREFS.getPrefSetterName(modelPrefKey);
        const modelSelect = activeGroup.querySelector(
          `#pref-${selectedProviderName}-model`,
        );
        if (modelSelect) {
          modelSelect.value =
            this._currentPrefValues[modelPrefName] || PREFS[modelPrefName];
        }
      }
    }
  },

  // Helper to display warning if both citations and god mode are enabled
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

  _generateSettingsHtml() {
    let generalSectionHtml = `
      <section class="settings-section">
        <h4>General</h4>
        <div class="setting-item">
          <label for="pref-enabled">Enable AI Findbar</label>
          <input type="checkbox" id="pref-enabled" data-pref="${PREFS.ENABLED}" />
        </div>
        <div class="setting-item">
          <label for="pref-minimal">Minimal Mode</label>
          <input type="checkbox" id="pref-minimal" data-pref="${PREFS.MINIMAL}" />
        </div>
        <div class="setting-item">
          <label for="pref-persist-chat">Persist Chat</label>
          <input type="checkbox" id="pref-persist-chat" data-pref="${PREFS.PERSIST}" />
        </div>
        <div class="setting-item">
          <label for="pref-debug-mode">Debug Mode</label>
          <input type="checkbox" id="pref-debug-mode" data-pref="${PREFS.DEBUG_MODE}" />
        </div>
      </section>`;

    let aiBehaviorSectionHtml = `
      <section class="settings-section">
        <h4>AI Behavior</h4>
        <div id="citations-god-mode-warning" class="warning-message" style="display: none; color: red; margin-bottom: 10px;">
          Warning: Enabling both Citations and God Mode may lead to unexpected behavior or errors.
        </div>
        <div class="setting-item">
          <label for="pref-citations-enabled">Enable Citations</label>
          <input type="checkbox" id="pref-citations-enabled" data-pref="${PREFS.CITATIONS_ENABLED}" />
        </div>
        <div class="setting-item">
          <label for="pref-god-mode">God Mode (Use Local Files)</label>
          <input type="checkbox" id="pref-god-mode" data-pref="${PREFS.GOD_MODE}" />
        </div>
      </section>`;

    let contextMenuSectionHtml = `
      <section class="settings-section">
        <h4>Context Menu</h4>
        <div class="setting-item">
          <label for="pref-context-menu-enabled">Enable Context Menu</label>
          <input type="checkbox" id="pref-context-menu-enabled" data-pref="${PREFS.CONTEXT_MENU_ENABLED}" />
        </div>
        <div class="setting-item">
          <label for="pref-context-menu-autosend">Auto Send from Context Menu</label>
          <input type="checkbox" id="pref-context-menu-autosend" data-pref="${PREFS.CONTEXT_MENU_AUTOSEND}" />
        </div>
      </section>`;

    let llmProviderSettingsHtml = "";
    for (const [name, provider] of Object.entries(llm.AVAILABLE_PROVIDERS)) {
      const apiPrefKey = PREFS[`${name.toUpperCase()}_API_KEY`];
      const modelPrefKey = PREFS[`${name.toUpperCase()}_MODEL`];

      const apiInputHtml = apiPrefKey
        ? `
        <div class="setting-item">
          <label for="pref-${name}-api-key">API Key</label>
          <input type="password" id="pref-${name}-api-key" data-pref="${apiPrefKey}" placeholder="Enter ${provider.label} API Key" />
        </div>
      `
        : "";

      const modelSelectHtml = modelPrefKey
        ? `
        <div class="setting-item">
          <label for="pref-${name}-model">Model</label>
          <select id="pref-${name}-model" data-pref="${modelPrefKey}">
            ${provider.AVAILABLE_MODELS.map(
          (model) => `<option value="${model}">${model}</option>`,
        ).join("")}
          </select>
        </div>
      `
        : "";

      llmProviderSettingsHtml += `
        <div id="${name}-settings-group" class="provider-settings-group">
          <h5>${provider.label}</h5>
          ${apiInputHtml}
          ${modelSelectHtml}
        </div>
      `;
    }

    // Placeholder for the XUL menulist, which will be inserted dynamically
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
  _clearLLMData: null,
  _isExpanded: false,
  _handleContextMenuPrefChange: null,
  _updateContextMenuText: null,
  _handleMinimalPrefChange: null,
  contextMenuItem: null,
  isOpen: false,

  get expanded() {
    return this._isExpanded;
  },
  set expanded(value) {
    const isChanged = value !== this._isExpanded;
    this._isExpanded = value;
    if (!this.findbar) return;

    // Handle the button text for the non-minimal "Expand" button
    if (this.expandButton) {
      this.expandButton.textContent = value ? "Collapse" : "Expand";
    }

    if (value) {
      if (!this.minimal) {
        this.findbar.classList.add("ai-expanded");
      }
      // Set AI mode attribute
      this.findbar.setAttribute("ai-mode", "true");
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
      // Remove AI mode attribute
      this.findbar.removeAttribute("ai-mode");
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
        // Set or remove AI mode attribute for minimal mode
        if (PREFS.minimal) {
          this.findbar.setAttribute("ai-mode", "true");
        } else {
          this.findbar.removeAttribute("ai-mode");
        }
      }
    }
  },
  handleMinimalPrefChange: function(pref) {
    this.minimal = pref.value;
    this.updateFindbar();
  },

  updateFindbar() {
    this.removeExpandButton();
    this.removeAIInterface();
    if (!PREFS.persistChat) {
      this.hide();
      this.expanded = false;
      llm.clearData();
    }
    gBrowser.getFindBar().then((findbar) => {
      this.findbar = findbar;
      this.addExpandButton();
      if (PREFS.persistChat) {
        if (this.isOpen) this.show();
        setTimeout(() => {
          this.expanded = this.expanded; // just to make sure in new tab UI willl also be visible
        }, 200);
      } else {
        this.hide();
        this.expanded = false;
      }
      if (!this.isOpen) {
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

      //makeing sure this only runs one time
      if (!findbar?.openOverWritten) {
        //update placeholder when findbar is opened
        findbar.browser.finder.onFindbarOpen = (...args) => {
          originalOnFindbarOpen.apply(findbar.browser.finder, args); //making sure original function is called
          this.isOpen = true;
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
          this.isOpen = false;
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
    }
  },

  createChatInterface() {
    const modelOptions = llm.currentProvider.AVAILABLE_MODELS.map((model) => {
      const displayName =
        model.charAt(0).toUpperCase() + model.slice(1).replace(/-/g, " ");
      return `<option value="${model}" ${model === llm.currentProvider.model ? "selected" : ""
        }>${displayName}</option>`;
    }).join("");

    const chatInputGroup = this.minimal
      ? ""
      : `<div class="ai-chat-input-group">
          <textarea id="ai-prompt" placeholder="Ask AI anything..." rows="2"></textarea>
          <button id="send-prompt" class="send-btn">Send</button>
        </div>`;

    const html = `
      <div class="findbar-ai-chat">
        <div class="ai-chat-header">
          <button id="clear-chat" class="clear-chat-btn">Clear</button>
          <select id="model-selector" class="model-selector">${modelOptions}</select>
          <button id="open-settings-btn" class="settings-btn">Settings</button>
        </div>
        <div class="ai-chat-messages" id="chat-messages"></div>
        ${chatInputGroup}
      </div>`;
    const container = parseElement(html);

    const modelSelector = container.querySelector("#model-selector");
    const chatMessages = container.querySelector("#chat-messages");
    const clearBtn = container.querySelector("#clear-chat");
    const settingsBtn = container.querySelector("#open-settings-btn");

    modelSelector.addEventListener("change", (e) => {
      const selectedModel = e.target.value;
      llm.currentProvider.model = selectedModel;
      // Also update the persistent preference for the current provider's model
      if (llm.currentProvider.name === "mistral") {
        PREFS.mistralModel = selectedModel;
      } else if (llm.currentProvider.name === "gemini") {
        PREFS.geminiModel = selectedModel;
      }
    });

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
          (message.parts && message.parts.some((p) => p.functionCall))
        )
          continue;

        const isModel = message.role === "model";
        const textContent = message.parts[0]?.text;
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
      } else if (this.isOpen) this.hide();
    }
  },

  addListeners() {
    this._updateFindbar = this.updateFindbar.bind(this);
    this._addKeymaps = this.addKeymaps.bind(this);
    this._handleInputKeyPress = this.handleInputKeyPress.bind(this);
    this._handleFindFieldInput = this.updateFoundMatchesDisplay.bind(this);
    this._clearLLMData = llm.clearData.bind(llm);
    this._handleContextMenuPrefChange =
      this.handleContextMenuPrefChange.bind(this);
    this._handleMinimalPrefChange = this.handleMinimalPrefChange.bind(this);

    gBrowser.tabContainer.addEventListener("TabSelect", this._updateFindbar);
    document.addEventListener("keydown", this._addKeymaps);
    UC_API.Prefs.addListener(PREFS.GOD_MODE, this._clearLLMData);
    UC_API.Prefs.addListener(PREFS.CITATIONS_ENABLED, this._clearLLMData);
    UC_API.Prefs.addListener(PREFS.MINIMAL, this._handleMinimalPrefChange);
    UC_API.Prefs.addListener(
      PREFS.CONTEXT_MENU_ENABLED,
      this._handleContextMenuPrefChange,
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
    UC_API.Prefs.removeListener(PREFS.GOD_MODE, this._clearLLMData);
    UC_API.Prefs.removeListener(PREFS.CITATIONS_ENABLED, this._clearLLMData);
    UC_API.Prefs.removeListener(PREFS.MINIMAL, this._handleMinimalPrefChange);
    UC_API.Prefs.removeListener(
      PREFS.CONTEXT_MENU_ENABLED,
      this._handleContextMenuPrefChange,
    );

    this._handleInputKeyPress = null;
    this._handleFindFieldInput = null;
    this._updateFindbar = null;
    this._addKeymaps = null;
    this._handleContextMenuPrefChange = null;
    this._handleMinimalPrefChange = null;
    this._clearLLMData = null;
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
      if (matches._observer) matches._observer.disconnect();
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
      matches._observer = observer;
    }
  },
};

findbar.init();
UC_API.Prefs.addListener(
  PREFS.ENABLED,
  findbar.handleEnabledChange.bind(findbar),
);
window.findbar = findbar;
