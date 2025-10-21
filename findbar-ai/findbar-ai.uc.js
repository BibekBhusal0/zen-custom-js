import { messageManagerAPI } from "./messageManager.js";
import { browseBotFindbarLLM } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { SettingsModal } from "./settings.js";
import { toolNameMapping } from "./llm/tools.js";

const icons = {
  loading: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--browse-bot-muted)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--browse-bot-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--browse-bot-error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  declined: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--browse-bot-warning)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
};

const getSidebarWidth = () => {
  if (
    gZenCompactModeManager &&
    (!gZenCompactModeManager?.preference || !PREFS.getPref("zen.view.compact.hide-tabbar")) &&
    !gZenCompactModeManager.sidebarIsOnRight
  ) {
    return gZenCompactModeManager.getAndApplySidebarWidth();
  } else return 0;
};

function updateSidebarWidth() {
  if (!PREFS.pseudoBg) return;
  const mainWindow = document.getElementById("main-window");
  const width = getSidebarWidth();
  if (width) mainWindow.style.setProperty("--zen-sidebar-width", width + "px");
  setTimeout(() => browseBotFindbar._updateFindbarDimensions(), 2);
}

const sidebarWidthUpdate = function () {
  const mainWindow = document.getElementById("main-window");
  const attributes = ["zen-compact-mode", "zen-sidebar-expanded", "zen-right-side"];

  // Set up a MutationObserver to watch attribute changes on #main-window
  const observer = new MutationObserver((mutationsList) => {
    if (!PREFS.pseudoBg) return;
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && attributes.includes(mutation.attributeName)) {
        updateSidebarWidth();
      }
    }
  });

  // Observe attribute changes
  observer.observe(mainWindow, {
    attributes: true,
    attributeFilter: attributes,
  });
  updateSidebarWidth();
};

sidebarWidthUpdate();

function parseMD(markdown, convertHTML = true) {
  const markedOptions = { breaks: true, gfm: true };
  let content = window.marked ? window.marked.parse(markdown, markedOptions) : markdown;
  content = content
    .replace(/<img([^>]*?)(?<!\/)>/gi, "<img$1 />")
    .replace(/<hr([^>]*?)(?<!\/)>/gi, "<hr$1 />")
    .replace(/<br([^>]*?)(?<!\/)>/gi, "<br$1 />");
  if (!convertHTML) return content;
  let htmlContent = parseElement(`<div class="markdown-body">${content}</div>`);

  return htmlContent;
}

PREFS.setInitialPrefs();
export const browseBotFindbar = {
  findbar: null,
  expandButton: null,
  chatContainer: null,
  apiKeyContainer: null,
  _updateFindbar: null,
  _addKeymaps: null,
  _handleInputKeyPress: null,
  _handleFindFieldInput: null,
  _handleFindbarOpenEvent: null,
  _handleFindbarCloseEvent: null,
  _isExpanded: false,
  _updateContextMenuText: null,
  _agenticModeListener: null,
  _backgroundStylesListener: null,
  _citationsListener: null,
  _contextMenuEnabledListener: null,
  _persistListener: null,
  _minimalListener: null,
  _dndListener: null,
  contextMenuItem: null,
  _matchesObserver: null,
  _isDragging: false,
  _startDrag: null,
  _stopDrag: null,
  _handleDrag: null,
  _initialContainerCoor: { x: null, y: null },
  _initialMouseCoor: { x: null, y: null },
  _startWidth: null,
  _resizeHandle: null,
  _isResizing: false,
  _startResize: null,
  _stopResize: null,
  _handleResize: null,
  _handleResizeEnd: null,
  _toolConfirmationDialog: null,
  _highlightTimeout: null,
  _originalOnMatchesCountResult: null,
  _currentAIMessageDiv: null,

  /**
   * Save findbar dimensions in css variables
   */
  _updateFindbarDimensions() {
    if (!this.findbar) {
      document.documentElement.style.removeProperty("--findbar-width");
      document.documentElement.style.removeProperty("--findbar-height");
      document.documentElement.style.removeProperty("--findbar-x");
      document.documentElement.style.removeProperty("--findbar-y");
      return;
    }
    const rect = this.findbar.getBoundingClientRect();
    const _findbarDimension = { width: rect.width, height: rect.height };
    const _findbarCoors = { x: rect.left, y: rect.top };
    document.documentElement.style.setProperty("--findbar-width", `${_findbarDimension.width}px`);
    document.documentElement.style.setProperty("--findbar-height", `${_findbarDimension.height}px`);
    document.documentElement.style.setProperty("--findbar-x", `${_findbarCoors.x}px`);
    document.documentElement.style.setProperty("--findbar-y", `${_findbarCoors.y}px`);
  },

  /**
   * Save findbar dimensions in prefs
   */
  _saveFindbarDimensions() {
    if (!this.findbar || !PREFS.rememberDimensions) return;
    const rect = this.findbar.getBoundingClientRect();
    PREFS.width = rect.width;
  },

  /**
   * Apply findbar dimensions in saved prefs
   */
  _applyFindbarDimensions() {
    if (!this.findbar || !PREFS.rememberDimensions) return;
    const width = PREFS.width;
    if (width) {
      this.findbar.style.width = `${width}px`;
    }
  },
  _isStreaming: false,
  _abortController: null,

  get expanded() {
    return this._isExpanded;
  },
  set expanded(value) {
    const isChanged = value !== this._isExpanded;
    this._isExpanded = value;
    if (!this.findbar) return;
    this.findbar.expanded = value;
    if (isChanged) {
      setTimeout(() => this._updateFindbarDimensions(), 2);
      setTimeout(() => this._updateFindbarDimensions(), 20);
    }

    if (value) {
      this.findbar.classList.add("ai-expanded");
      this.show();
      this.showAIInterface();
      if (isChanged) this.focusPrompt();
      const messagesContainer = this?.chatContainer?.querySelector("#chat-messages");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } else {
      if (this._isStreaming) {
        this._abortController?.abort(); // Stop messsage if it is running
      }
      this.findbar.classList.remove("ai-expanded");
      this.removeAIInterface();
      if (isChanged && !this.minimal) this.focusInput();
    }
  },

  get enabled() {
    return PREFS.enabled;
  },
  set enabled(value) {
    if (typeof value === "boolean") PREFS.enabled = value;
  },
  handleEnabledChange(enabled) {
    if (enabled.value) this.init();
    else this.destroy();
  },

  get minimal() {
    return PREFS.minimal;
  },
  set minimal(value) {
    if (typeof value === "boolean") PREFS.minimal = value;
  },

  handleMinimalPrefChange: function () {
    this.removeExpandButton();
    this.addExpandButton();
    this.removeAIInterface();
    this.showAIInterface();
  },

  createToolConfirmationDialog(toolNames) {
    return new Promise((resolve) => {
      const dialog = parseElement(`
        <div class="tool-confirmation-dialog">
          <div class="tool-confirmation-content">
            <p>Allow AI to do following tasks: ${toolNames?.join(", ")}?</p>
            <div class="buttons">
              <button class="not-again">Don't ask again</button>
              <div class="right-side-buttons">
                <button class="confirm-tool">Yes</button>
                <button class="cancel-tool">No</button>
              </div>
            </div>
          </div>
        </div>
      `);
      this._toolConfirmationDialog = dialog;

      const removeDilog = () => {
        dialog.remove();
        this._toolConfirmationDialog = null;
      };

      const confirmButton = dialog.querySelector(".confirm-tool");
      confirmButton.addEventListener("click", () => {
        removeDilog();
        resolve(true);
      });

      const cancelButton = dialog.querySelector(".cancel-tool");
      cancelButton.addEventListener("click", () => {
        removeDilog();
        resolve(false);
      });

      const notAgainButton = dialog.querySelector(".not-again");
      notAgainButton.addEventListener("click", () => {
        removeDilog();
        PREFS.conformation = false;
        resolve(true);
      });

      document.body.appendChild(dialog);
    });
  },

  updateFindbar() {
    SettingsModal.hide();
    this.removeExpandButton();
    this.removeAIInterface();
    this.disableResize();
    if (!PREFS.persistChat) {
      this.hide();
      this.expanded = false;
      this.clear();
    }
    gBrowser.getFindBar().then((findbar) => {
      this.findbar = findbar;
      this._applyFindbarDimensions();
      this.addExpandButton();
      if (PREFS.persistChat) {
        if (this?.findbar?.history) {
          browseBotFindbarLLM.history = this.findbar.history; // restore history from findbar
          if (
            this?.findbar?.aiStatus &&
            JSON.stringify(this.aiStatus) !== JSON.stringify(this.findbar.aiStatus) // check status saved in findabr
          ) {
            // clear history if ai stauts is changed
            browseBotFindbarLLM.history = [];
            this.findbar.history = [];
          }
        } else browseBotFindbarLLM.history = [];
        if (this?.findbar?.expanded && !this?.findbar?.hidden) {
          setTimeout(() => (this.expanded = true), 200);
        } else {
          this.hide();
          this.expanded = false;
        }
      } else {
        this.hide();
        this.expanded = false;
      }
      this.updateFindbarStatus();
      setTimeout(() => {
        if (PREFS.dndEnabled) this.enableResize();
        this._updateFindbarDimensions();
      }, 0);

      const matches = this.findbar.querySelector(".found-matches");
      const status = this.findbar.querySelector(".findbar-find-status");
      const wrapper = this.findbar.querySelector('hbox[anonid="findbar-textbox-wrapper"]');
      if (wrapper) {
        if (matches && matches.parentElement !== wrapper) wrapper.appendChild(matches);
        if (status && status.parentElement !== wrapper) wrapper.appendChild(status);
      }

      this.findbar._findField.removeEventListener("keypress", this._handleInputKeyPress);
      this.findbar._findField.addEventListener("keypress", this._handleInputKeyPress);
      this.findbar._findField.removeEventListener("input", this._handleFindFieldInput);
      this.findbar._findField.addEventListener("input", this._handleFindFieldInput);
    });
  },

  /**
   * Highlight a word using native findbar
   * @param {string} word - Word to highlight.
   */
  highlight(word) {
    if (!this.findbar) return;

    // clear any existing timeout before starting a new one
    if (this._highlightTimeout) clearTimeout(this._highlightTimeout);

    this.findbar._find(word);

    this._highlightTimeout = setTimeout(() => {
      this.findbar.browser.finder.highlight(false);
      this._highlightTimeout = null; // cleanup
    }, 2000);
  },

  show() {
    if (!this.findbar) return false;
    this.findbar.open();
    this.focusInput();
    setTimeout(() => this._updateFindbarDimensions(), 0);
    return true;
  },
  hide() {
    if (!this.findbar) return false;
    this.findbar.close();
    this.findbar.toggleHighlight(false);
    setTimeout(() => this._updateFindbarDimensions(), 0);
    return true;
  },
  toggleVisibility() {
    if (!this.findbar) return;
    if (this.findbar.hidden) this.show();
    else this.hide();
  },

  clear() {
    browseBotFindbarLLM.clearData();
    if (this.findbar) {
      this.findbar.history = null;
    }
    const messages = this?.chatContainer?.querySelector("#chat-messages");
    if (messages) messages.innerHTML = "";
    setTimeout(() => this._updateFindbarDimensions(), 1);
  },

  aiStatus: {
    citationsEnabled: PREFS.citationsEnabled,
    agenticMode: PREFS.agenticMode,
  },
  updateFindbarStatus() {
    this.aiStatus = {
      agenticMode: PREFS.agenticMode,
      citationsEnabled: PREFS.citationsEnabled,
    };
    if (this.findbar) this.findbar.aiStatus = this.aiStatus;
  },

  createAPIKeyInterface() {
    const currentProviderName = browseBotFindbarLLM.currentProvider.name;
    const menuItems = Object.entries(browseBotFindbarLLM.AVAILABLE_PROVIDERS)
      .map(
        ([name, provider]) => `
                  <menuitem
                    value="${name}"
                    label="${escapeXmlAttribute(provider.label)}"
                    ${name === currentProviderName ? 'selected="true"' : ""}
                    ${provider.faviconUrl ? `image="${escapeXmlAttribute(provider.faviconUrl)}"` : ""}
                  />
                `
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
        <div class="browse-bot-setup">
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

    const providerSelectionGroup = container.querySelector(".provider-selection-group");
    // Insert the XUL menulist after the label within the group
    providerSelectionGroup.appendChild(providerSelectorXulElement);

    const providerSelector = container.querySelector("#provider-selector");
    const input = container.querySelector("#api-key");
    const saveBtn = container.querySelector("#save-api-key");
    const getApiKeyLink = container.querySelector("#get-api-key-link");
    const setupContent = container.querySelector(".ai-setup-content");
    const description = setupContent.querySelector("p");

    const updateUIForProvider = (providerName) => {
      const provider = browseBotFindbarLLM.AVAILABLE_PROVIDERS[providerName];
      if (providerName === "ollama") {
        description.textContent =
          "Ollama is selected. You can customize the Base URL below or use the default.";
        input.type = "text";
        input.placeholder = "Enter Ollama Base URL";
        input.value = PREFS.ollamaBaseUrl || "";
        getApiKeyLink.style.display = "none";
      } else {
        description.textContent =
          "To use AI features, you need to set up your API key and select a provider.";
        input.type = "password";
        input.placeholder = "Enter your API key";
        input.value = provider.apiKey || "";
        getApiKeyLink.style.display = provider.apiKeyUrl ? "inline-block" : "none";
        getApiKeyLink.disabled = !provider.apiKeyUrl;
        getApiKeyLink.title = provider.apiKeyUrl
          ? "Get API Key"
          : "No API key link available for this provider.";
      }
    };

    updateUIForProvider(currentProviderName);

    // Use 'command' event for XUL menulist
    providerSelector.addEventListener("command", (e) => {
      const selectedProviderName = e.target.value;
      browseBotFindbarLLM.setProvider(selectedProviderName); // This also updates PREFS.llmProvider internally
      updateUIForProvider(selectedProviderName);
    });

    getApiKeyLink.addEventListener("click", () => {
      openTrustedLinkIn(browseBotFindbarLLM.currentProvider.apiKeyUrl, "tab");
    });

    saveBtn.addEventListener("click", () => {
      const value = input.value.trim();
      const providerName = browseBotFindbarLLM.currentProvider.name;

      if (providerName === "ollama") {
        if (value) {
          PREFS.ollamaBaseUrl = value;
        }
        this.showAIInterface();
      } else if (value) {
        browseBotFindbarLLM.currentProvider.apiKey = value; // This also updates PREFS.mistralApiKey/geminiApiKey internally
        this.showAIInterface(); // Refresh UI after saving key
      }
    });
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });
    return container;
  },

  _removeToolCallUI() {
    if (!this._currentAIMessageDiv) return;
    const container = this._currentAIMessageDiv.querySelector(".tool-calls-container");
    if (container) {
      container.remove();
      setTimeout(() => this._updateFindbarDimensions(), 0);
    }
  },

  _createOrUpdateToolCallUI(toolName, status, errorMsg = null) {
    const messageDiv = this._currentAIMessageDiv;
    if (!messageDiv) return;

    let container = messageDiv.querySelector(".tool-calls-container");
    const messageContent = messageDiv.querySelector(".message-content");
    if (!container) {
      container = parseElement(`<div class="tool-calls-container"></div>`);
      if (messageContent) {
        messageDiv.insertBefore(container, messageContent);
      } else {
        messageDiv.appendChild(container);
      }
    }

    const friendlyName = toolNameMapping[toolName] || toolName;
    const existingLoadingItems = container.querySelectorAll(
      '.tool-call-status[data-status="loading"]'
    );
    existingLoadingItems.forEach((item) => item.remove());

    let toolDiv = parseElement(`
<div class="tool-call-status" data-tool-name="${toolName} data-status="${status}">
  <span class="tool-call-icon">${icons[status] || ""}</span>
  <span class="tool-call-name">${friendlyName}</span>
</div>
`);

    container.appendChild(toolDiv);

    // toolDiv.dataset.status = status;
    let title = friendlyName;
    if (status === "error" && errorMsg) {
      title += `\nError: ${errorMsg}`;
    } else if (status === "declined") {
      title += `\nDeclined by user.`;
    }
    toolDiv.setAttribute("tooltiptext", title);

    messageDiv.scrollTop = messageDiv.scrollHeight;
    setTimeout(() => this._updateFindbarDimensions(), 0);
  },

  async sendMessage(prompt) {
    if (!prompt || this._isStreaming) return;

    this.show();
    this.expanded = true;

    this.addChatMessage({ role: "user", content: prompt });
    const messagesContainer = this.chatContainer.querySelector("#chat-messages");

    this._abortController = new AbortController();
    this._toggleStreamingControls(true);

    const aiMessageDiv = parseElement(
      `<div class="chat-message chat-message-ai">
        <div class="message-content">
          <div class="markdown-body"></div>
        </div>
      </div>`
    );
    const contentDiv = aiMessageDiv.querySelector(".markdown-body");
    if (messagesContainer) {
      messagesContainer.appendChild(aiMessageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    this._currentAIMessageDiv = aiMessageDiv;

    try {
      const resultPromise = browseBotFindbarLLM.sendMessage(prompt, this._abortController.signal);

      if (PREFS.citationsEnabled || !PREFS.streamEnabled) {
        const loadingIndicator = this.createLoadingIndicator();
        messagesContainer.appendChild(loadingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
          const result = await resultPromise;
          if (loadingIndicator.parentNode) loadingIndicator.remove();

          if (PREFS.citationsEnabled) {
            const { answer, citations } = result;
            if (citations && citations.length > 0) {
              aiMessageDiv.dataset.citations = JSON.stringify(citations);
            }
            const textToParse = answer.replace(
              /\[(\d+)\]/g,
              `<span class="citation-link" data-citation-id="$1">[$1]</span>`
            );
            contentDiv.appendChild(parseMD(textToParse));
          } else {
            if (result.text.trim() === "" && aiMessageDiv.querySelector(".tool-calls-container")) {
              contentDiv.innerHTML = parseMD("*(Tool actions performed)*", false);
            } else if (
              result.text.trim() === "" &&
              !aiMessageDiv.querySelector(".tool-calls-container")
            ) {
              aiMessageDiv.remove();
            } else {
              contentDiv.appendChild(parseMD(result.text));
            }
          }
        } finally {
          if (loadingIndicator.parentNode) loadingIndicator.remove();
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          setTimeout(() => this._updateFindbarDimensions(), 0);
        }
      } else {
        const result = await resultPromise;
        let fullText = "";
        for await (const delta of result.textStream) {
          fullText += delta;
          try {
            contentDiv.innerHTML = parseMD(fullText, false);
          } catch (e) {
            debugError("innerHTML assignment failed:", e.message);
          }
          setTimeout(() => this._updateFindbarDimensions(), 0);
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }
        if (fullText.trim() === "" && aiMessageDiv.querySelector(".tool-calls-container")) {
          contentDiv.innerHTML = parseMD("*(Tool actions performed)*", false);
        } else if (fullText.trim() === "" && !aiMessageDiv.querySelector(".tool-calls-container")) {
          aiMessageDiv.remove();
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        debugError("Error sending message:", e);
        if (aiMessageDiv) aiMessageDiv.remove();
        this.addChatMessage({ role: "error", content: `**Error**: ${e.message}` });
      } else {
        debugLog("Streaming aborted by user.");
        if (aiMessageDiv) aiMessageDiv.remove();
      }
    } finally {
      this._toggleStreamingControls(false);
      this._abortController = null;
      this._removeToolCallUI();
      this._currentAIMessageDiv = null;
    }
  },

  _toggleStreamingControls(isStreaming) {
    this._isStreaming = isStreaming;
    if (!this.chatContainer) return;

    const sendBtn = this.chatContainer.querySelector("#send-prompt");
    const stopBtn = this.chatContainer.querySelector("#stop-generation");
    const promptInput = this.chatContainer.querySelector("#ai-prompt");

    if (isStreaming) {
      sendBtn.style.display = "none";
      stopBtn.style.display = "flex";
      promptInput.disabled = true;
    } else {
      sendBtn.style.display = "flex";
      stopBtn.style.display = "none";
      promptInput.disabled = false;
      this.focusPrompt();
    }
  },

  // The following _overrideFindbarMatchesDisplay function is adapted from
  // aminomancer's Findbar Mods (https://github.com/aminomancer/uc.css.js/blob/master/JS/findbarMods.uc.js)
  // under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
  // Original Author: aminomancer
  // Source: https://github.com/aminomancer/uc.css.js
  // License: http://creativecommons.org/licenses/by-nc-sa/4.0/
  _overrideFindbarMatchesDisplay(retry = 0) {
    debugLog(`_overrideFindbarMatchesDisplay called, retry: ${retry}`);
    if (this._originalOnMatchesCountResult) {
      debugLog("Prototype already overridden.");
      return;
    }

    const findbarClass = customElements.get("findbar")?.prototype;

    if (!findbarClass) {
      debugLog("findbarClass not found.");
      if (retry < 10) {
        setTimeout(() => this._overrideFindbarMatchesDisplay(retry + 1), 100);
        debugLog(`Retrying _overrideFindbarMatchesDisplay in 100ms, retry: ${retry + 1}`);
      } else {
        debugError(
          "Failed to override findbar matches display: findbar custom element not found after multiple retries."
        );
      }
      return;
    }

    debugLog("findbarClass found. Overriding onMatchesCountResult.");
    this._originalOnMatchesCountResult = findbarClass.onMatchesCountResult;

    findbarClass.onMatchesCountResult = function (result) {
      if (!PREFS.enabled) return;

      const foundMatchesElement = this._foundMatches;
      if (typeof result?.current !== "number" || typeof result?.total !== "number") return;

      const next = this.querySelector(".findbar-find-next");
      const previous = this.querySelector(".findbar-find-previous");
      if (next && previous) {
        if (result.searchString.trim() === "" || result.total <= 1) {
          next.disabled = true;
          previous.disabled = true;
        } else if (result.current <= 1) {
          next.disabled = false;
          previous.disabled = true;
        } else if (result.current >= result.total) {
          next.disabled = true;
          previous.disabled = false;
        } else {
          next.disabled = false;
          previous.disabled = false;
        }
      }

      if (!foundMatchesElement) return;
      if (result.searchString.trim() === "") {
        foundMatchesElement.setAttribute("value", "");
        return;
      }

      foundMatchesElement.hidden = false;
      const newLabel = `${result.current}/${result.total}`;
      foundMatchesElement.setAttribute("value", newLabel);
    };
    debugLog("onMatchesCountResult successfully overridden.");
  },

  _restoreFindbarMatchesDisplay() {
    if (this._originalOnMatchesCountResult) {
      const findbarClass = customElements.get("findbar")?.prototype;
      if (findbarClass) {
        findbarClass.onMatchesCountResult = this._originalOnMatchesCountResult;
      }
      this._originalOnMatchesCountResult = null;

      // Reset the DOM element for the current findbar instance
      if (this.findbar) {
        const foundMatchesElement = this.findbar._foundMatches;
        if (foundMatchesElement) {
          foundMatchesElement.setAttribute("value", "");
          foundMatchesElement.hidden = true;
        }
      }
    }
  },

  createChatInterface() {
    const chatInputGroup = `<div class="ai-chat-input-group">
          <textarea id="ai-prompt" placeholder="Ask AI anything..." rows="2"></textarea>
          <button id="send-prompt" class="send-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.991 6.01L5.399 10.563l4.195 2.428l3.699-3.7a1 1 0 0 1 1.414 1.415l-3.7 3.7l2.43 4.194L17.99 6.01Zm.323-2.244c1.195-.433 2.353.725 1.92 1.92l-5.282 14.605c-.434 1.198-2.07 1.344-2.709.241l-3.217-5.558l-5.558-3.217c-1.103-.639-.957-2.275.241-2.709z" />
            </svg>
          </button>
          <button id="stop-generation" class="stop-btn" style="display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m2 6h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />
              </svg>
          </button>
        </div>`;

    const container = parseElement(`
        <div class="browse-bot-chat">
          <div class="ai-chat-header">
            <div class="findbar-drag-handle"></div>
          </div>
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
      "xul"
    );

    const settingsBtn = parseElement(
      `
        <toolbarbutton 
          id="open-settings-btn" 
          class="settings-btn" 
          image="chrome://global/skin/icons/settings.svg" 
          tooltiptext="Settings"
        />`,
      "xul"
    );

    const collapseBtn = parseElement(
      `
        <toolbarbutton 
          id="findbar-collapse-btn" 
          class="findbar-collapse-btn" 
          image="chrome://browser/skin/zen-icons/unpin.svg" 
          tooltiptext="Collapse"
        />`,
      "xul"
    );

    chatHeader.appendChild(clearBtn);
    chatHeader.appendChild(settingsBtn);
    chatHeader.appendChild(collapseBtn);

    const chatMessages = container.querySelector("#chat-messages");
    const promptInput = container.querySelector("#ai-prompt");
    const sendBtn = container.querySelector("#send-prompt");
    const stopBtn = container.querySelector("#stop-generation");

    const handleSend = () => {
      const prompt = promptInput.value.trim();
      this.sendMessage(prompt);
      promptInput.value = ""; // Clear input after sending
    };

    sendBtn.addEventListener("click", handleSend);
    stopBtn.addEventListener("click", () => {
      this._abortController?.abort();
    });

    promptInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    clearBtn.addEventListener("click", () => {
      this.clear();
      this.expanded = false;
    });

    settingsBtn.addEventListener("click", () => {
      SettingsModal.show();
    });

    collapseBtn.addEventListener("click", () => {
      this.expanded = false;
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
              `Citation [${citationId}] clicked. Requesting highlight for:`,
              citation.source_quote
            );
            this.highlight(citation.source_quote);
          }
        }
      } else if (e.target?.href) {
        e.preventDefault();
        try {
          openTrustedLinkIn(e.target.href, "tab");
        } catch (e) {}
      }
    });

    return container;
  },

  createLoadingIndicator() {
    const messageDiv = parseElement(
      `<div class="chat-message chat-message-loading"><div class="message-content">Loading...</div></div>`
    );
    return messageDiv;
  },

  addChatMessage(message) {
    const { role, content } = message;
    if (!this.chatContainer || content === undefined || content === null) return;

    const messagesContainer = this.chatContainer.querySelector("#chat-messages");
    if (!messagesContainer) return;

    let type;
    switch (role) {
      case "user":
        type = "user";
        break;
      case "assistant":
        type = "ai";
        break;
      case "error":
        type = "error";
        break;
      default:
        return; // Don't display other roles like 'tool'
    }

    const messageDiv = parseElement(`<div class="chat-message chat-message-${type}"></div>`);
    const contentDiv = parseElement(`<div class="message-content"></div>`);

    if (role === "assistant" && typeof content === "object" && content.answer !== undefined) {
      // Case 1: Live response from generateObject for citations
      const { answer, citations } = content;
      if (citations && citations.length > 0) {
        messageDiv.dataset.citations = JSON.stringify(citations);
      }
      const textToParse = answer.replace(
        /\[(\d+)\]/g,
        `<span class="citation-link" data-citation-id="$1">[$1]</span>`
      );
      contentDiv.appendChild(parseMD(textToParse));
    } else {
      // Case 2: String content (from user, stream, generateText, or history)
      const textContent = typeof content === "string" ? content : (content[0]?.text ?? "");

      if (role === "assistant" && PREFS.citationsEnabled) {
        // Sub-case: Rendering historical assistant message in citation mode.
        // It's a string that needs to be parsed into answer/citations.
        const { answer, citations } = browseBotFindbarLLM.parseModelResponseText(textContent);
        if (citations && citations.length > 0) {
          messageDiv.dataset.citations = JSON.stringify(citations);
        }
        const textToParse = answer.replace(
          /\[(\d+)\]/g,
          `<span class="citation-link" data-citation-id="$1">[$1]</span>`
        );
        contentDiv.appendChild(parseMD(textToParse));
      } else {
        // Sub-case: Simple string content
        contentDiv.appendChild(parseMD(textContent));
      }
    }

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    setTimeout(() => this._updateFindbarDimensions(), 10);
  },

  showAIInterface() {
    if (!this.findbar) return;
    this.removeAIInterface();

    this.findbar.classList.remove("ai-settings-active");

    if (
      !browseBotFindbarLLM.currentProvider.apiKey &&
      browseBotFindbarLLM.currentProvider.name !== "ollama"
    ) {
      this.apiKeyContainer = this.createAPIKeyInterface();
      this.findbar.insertBefore(this.apiKeyContainer, this.findbar.firstChild);
    } else {
      this.chatContainer = this.createChatInterface();
      if (PREFS.dndEnabled) this.enableDND();

      // Re-render history using the new message format
      const history = browseBotFindbarLLM.getHistory();
      for (const message of history) {
        this.addChatMessage(message);
      }

      this.findbar.insertBefore(this.chatContainer, this.findbar.firstChild);
    }
    setTimeout(() => this._updateFindbarDimensions(), 10);
  },

  focusInput() {
    if (this.findbar) setTimeout(() => this.findbar._findField.focus(), 10);
  },
  focusPrompt() {
    const promptInput = this.chatContainer?.querySelector("#ai-prompt");
    if (promptInput) setTimeout(() => promptInput.focus(), 10);
  },
  setPromptText(text) {
    const promptInput = this?.chatContainer?.querySelector("#ai-prompt");
    if (promptInput && text) promptInput.value = text;
  },
  async setPromptTextFromSelection() {
    let text = "";
    const selection = await messageManagerAPI.getSelectedText();
    if (!selection || !selection.hasSelection) text = this?.findbar?._findField?.value;
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
    this._overrideFindbarMatchesDisplay();
  },
  destroy() {
    this.findbar = null;
    setTimeout(() => this._updateFindbarDimensions(), 10);
    this.expanded = false;
    try {
      this.removeListeners();
    } catch {}
    this.removeExpandButton();
    this.removeContextMenuItem();
    this.removeAIInterface();
    this._toolConfirmationDialog?.remove();
    this._toolConfirmationDialog = null;
    SettingsModal.hide();
    this._restoreFindbarMatchesDisplay();
  },

  addExpandButton() {
    if (!this.findbar) return false;

    // Always remove both buttons before adding the correct one
    this.removeExpandButton();

    if (this.minimal) {
      const container = this.findbar.querySelector(".findbar-container");
      if (container && !container.querySelector("#findbar-ask")) {
        const askBtn = parseElement(`<button id="findbar-ask" anonid="findbar-ask">Ask</button>`);
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
        `<button id="${button_id}" anonid="${button_id}">Expand</button>`
      );
      button.addEventListener("click", () => (this.expanded = true));
      button.textContent = "Expand";
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

  handleInputKeyPress: function (e) {
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
        debugLog(`Context menu not found, retrying... (attempt ${retryCount + 1}/5)`);
        setTimeout(() => this.addContextMenuItem(retryCount + 1), 200);
      } else {
        debugError("Failed to add context menu item after 5 attempts: Context menu not found.");
      }
      return;
    }

    const menuItem = document.createXULElement("menuitem");
    menuItem.id = "browse-bot-context-menu-item";
    menuItem.setAttribute("label", "Ask AI");
    menuItem.setAttribute("accesskey", "A");

    menuItem.addEventListener("command", this.handleContextMenuClick.bind(this));
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

  removeContextMenuItem: function () {
    this?.contextMenuItem?.remove();
    this.contextMenuItem = null;
    document
      ?.getElementById("contentAreaContextMenu")
      ?.removeEventListener("popupshowing", this._updateContextMenuText);
  },
  handleContextMenuClick: async function () {
    const selection = await messageManagerAPI.getSelectedText();
    let finalMessage = "";
    if (selection.hasSelection) {
      const commandTemplate = PREFS.contextMenuCommandWithSelection;
      finalMessage = commandTemplate.replace("{selection}", selection.selectedText);
    } else {
      finalMessage = PREFS.contextMenuCommandNoSelection;
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

  handleContextMenuPrefChange: function (pref) {
    if (pref.value) this.addContextMenuItem();
    else this.removeContextMenuItem();
  },
  updateContextMenuText() {
    if (!PREFS.contextMenuEnabled || !this.contextMenuItem) return;
    const hasSelection = gContextMenu?.isTextSelected === true;
    this.contextMenuItem.label = hasSelection ? "Ask AI" : "Summarize with AI";
  },

  enableResize() {
    if (!this.findbar || this._resizeHandle) return;
    const resizeHandle = parseElement(`<div class="findbar-resize-handle"></div>`);
    this.findbar.appendChild(resizeHandle);
    this._resizeHandle = resizeHandle;
    this._startResize = this.startResize.bind(this);
    this._resizeHandle.addEventListener("mousedown", this._startResize);
  },

  startResize(e) {
    if (e.button !== 0 || !this.findbar) return;
    this._isResizing = true;
    this._initialMouseCoor = { x: e.clientX, y: e.clientY };
    const rect = this.findbar.getBoundingClientRect();
    this.startWidth = rect.width;
    this._handleResize = this.doResize.bind(this);
    this._stopResize = this.stopResize.bind(this);
    document.addEventListener("mousemove", this._handleResize);
    document.addEventListener("mouseup", this._stopResize);
  },

  doResize(e) {
    if (!this._isResizing || !this.findbar) return;
    const minWidth = 300;
    const maxWidth = 800;
    const directionFactor = PREFS.position.includes("right") ? -1 : 1;
    let newWidth = this.startWidth + (e.clientX - this._initialMouseCoor.x) * directionFactor;
    newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    this.findbar.style.width = `${newWidth}px`;
    this._updateFindbarDimensions();
  },

  stopResize() {
    this._isResizing = false;
    document.removeEventListener("mousemove", this._handleResize);
    document.removeEventListener("mouseup", this._stopResize);
    this._handleResize = null;
    this._stopResize = null;
    this._updateFindbarDimensions();
    this._saveFindbarDimensions();
  },
  disableResize() {
    this._resizeHandle?.remove();
    this._resizeHandle = null;
    this.stopResize();
  },

  startDrag(e) {
    if (!this.chatContainer || e.button !== 0) return;
    this._isDragging = true;
    this._initialMouseCoor = { x: e.clientX, y: e.clientY };
    const rect = this.findbar.getBoundingClientRect();
    this._initialContainerCoor = { x: rect.left, y: rect.top };
    this._handleDrag = this.doDrag.bind(this);
    this._stopDrag = this.stopDrag.bind(this);
    document.addEventListener("mousemove", this._handleDrag);
    document.addEventListener("mouseup", this._stopDrag);
  },

  doDrag(e) {
    if (!this._isDragging) return;
    const minCoors = { x: 15, y: 35 };
    const rect = this.findbar.getBoundingClientRect();
    const maxCoors = {
      x: window.innerWidth - rect.width - 33,
      y: window.innerHeight - rect.height - 33,
    };
    const newCoors = {
      x: this._initialContainerCoor.x + (e.clientX - this._initialMouseCoor.x),
      y: this._initialContainerCoor.y + (e.clientY - this._initialMouseCoor.y),
    };

    newCoors.x -= getSidebarWidth();
    newCoors.x = Math.max(minCoors.x, Math.min(newCoors.x, maxCoors.x));
    newCoors.y = Math.max(minCoors.y, Math.min(newCoors.y, maxCoors.y));
    if (PREFS.pseudoBg) this._updateFindbarDimensions();

    this.findbar.style.setProperty("left", `${newCoors.x}px`, "important");
    this.findbar.style.setProperty("top", `${newCoors.y}px`, "important");
    this.findbar.style.setProperty("right", "unset", "important");
    this.findbar.style.setProperty("bottom", "unset", "important");
  },

  stopDrag() {
    this._isDragging = false;
    if (!PREFS.pseudoBg) {
      this.findbar.style.setProperty("transition", "all 0.3s ease", "important");
      setTimeout(() => this.findbar.style.removeProperty("transition"), 400);
      setTimeout(() => this._updateFindbarDimensions(), 401); // update dimensions after transition
    }
    this.snapToClosestCorner();
    this._initialMouseCoor = { x: null, y: null };
    this._initialContainerCoor = { x: null, y: null };
    document.removeEventListener("mouseup", this._stopDrag);
    document.removeEventListener("mousemove", this._handleDrag);
    this._handleDrag = null;
    this._stopDrag = null;
    setTimeout(() => this._updateFindbarDimensions(), 0);
  },

  snapToClosestCorner() {
    if (!this.findbar || !PREFS.dndEnabled) return;

    const rect = this.findbar.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const findbarWidth = rect.width;
    const findbarHeight = rect.height;

    const snapPoints = {
      "top-left": { x: 0, y: 0 },
      "top-right": { x: window.innerWidth - findbarWidth, y: 0 },
      "bottom-left": { x: 0, y: window.innerHeight - findbarHeight },
      "bottom-right": {
        x: window.innerWidth - findbarWidth,
        y: window.innerHeight - findbarHeight,
      },
    };

    let closestPointName = PREFS.position;
    let minDistance = Infinity;

    for (const name in snapPoints) {
      const p = snapPoints[name];
      const distance = Math.sqrt(Math.pow(currentX - p.x, 2) + Math.pow(currentY - p.y, 2));

      if (distance < minDistance) {
        minDistance = distance;
        closestPointName = name;
      }
    }

    // Update preference if position changed
    if (closestPointName !== PREFS.position) {
      PREFS.position = closestPointName;
    }
    this.findbar.style.removeProperty("left");
    this.findbar.style.removeProperty("top");
    this.findbar.style.removeProperty("bottom");
    this.findbar.style.removeProperty("right");
    // this.applyFindbarPosition(closestPointName);
  },
  enableDND() {
    if (!this.chatContainer) return;
    const handle = this.chatContainer.querySelector(".findbar-drag-handle");
    if (!handle) return;
    this._startDrag = this.startDrag.bind(this);
    handle.addEventListener("mousedown", this._startDrag);
  },
  disableDND() {
    this._isDragging = false;
    if (!this.chatContainer) return;
    const handle = this.chatContainer.querySelector(".findbar-drag-handle");
    if (!handle) return;
    handle.removeEventListener("mousedown", this._startDrag);
    document.removeEventListener("mouseup", this._stopDrag);
    document.removeEventListener("mousemove", this._handleDrag);
    this._startDrag = null;
    this._stopDrag = null;
  },

  addKeymaps: function (e) {
    if (e.key && e.key.toLowerCase() === "f" && e.ctrlKey && e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      this.expanded = true;
      this.show();
      this.focusPrompt();
      this.setPromptTextFromSelection();
    }
    if (e.key?.toLowerCase() === "escape") {
      if (SettingsModal._modalElement && SettingsModal._modalElement.parentNode) {
        e.preventDefault();
        e.stopPropagation();
        SettingsModal.hide();
      } else if (this._toolConfirmationDialog) {
        const cancelButton = this._toolConfirmationDialog.querySelector(".cancel-tool");
        cancelButton?.click();
      } else if (this.expanded) {
        e.preventDefault();
        e.stopPropagation();
        this.expanded = false;
        this.focusInput();
      }
    }
  },

  addListeners() {
    this._updateFindbar = this.updateFindbar.bind(this);
    this._addKeymaps = this.addKeymaps.bind(this);
    this._handleInputKeyPress = this.handleInputKeyPress.bind(this);
    const _clearLLMData = () => {
      this.updateFindbarStatus();
      this.clear();
    };
    const _handleContextMenuPrefChange = this.handleContextMenuPrefChange.bind(this);
    const _handleMinimalPrefChange = this.handleMinimalPrefChange.bind(this);
    const _handleBackgroundStyleChange = () => {
      updateSidebarWidth();
    };

    gBrowser.tabContainer.addEventListener("TabSelect", this._updateFindbar);
    document.addEventListener("keydown", this._addKeymaps);
    this._handleFindbarOpenEvent = this.handleFindbarOpenEvent.bind(this);
    this._handleFindbarCloseEvent = this.handleFindbarCloseEvent.bind(this);
    window.addEventListener("findbaropen", this._handleFindbarOpenEvent);
    window.addEventListener("findbarclose", this._handleFindbarCloseEvent);
    this._agenticModeListener = UC_API.Prefs.addListener(PREFS.AGENTIC_MODE, _clearLLMData);
    this._backgroundStylesListener = UC_API.Prefs.addListener(
      PREFS.BACKGROUND_STYLE,
      _handleBackgroundStyleChange
    );
    this._citationsListener = UC_API.Prefs.addListener(PREFS.CITATIONS_ENABLED, _clearLLMData);
    this._minimalListener = UC_API.Prefs.addListener(PREFS.MINIMAL, _handleMinimalPrefChange);
    this._contextMenuEnabledListener = UC_API.Prefs.addListener(
      PREFS.CONTEXT_MENU_ENABLED,
      _handleContextMenuPrefChange
    );
    this._persistListener = UC_API.Prefs.addListener(PREFS.PERSIST, (pref) => {
      if (!this.findbar) return;
      if (pref.value) this.findbar.history = browseBotFindbarLLM.history;
      else this.findbar.history = null;
    });
    this._dndListener = UC_API.Prefs.addListener(PREFS.DND_ENABLED, (pref) => {
      if (pref.value) {
        this.enableDND();
        this.enableResize();
      } else {
        this.disableDND();
        this.disableResize();
      }
    });
  },

  removeListeners() {
    if (this.findbar) {
      this.findbar._findField.removeEventListener("keypress", this._handleInputKeyPress);
      this.findbar._findField.removeEventListener("input", this._handleFindFieldInput);
    }
    gBrowser.tabContainer.removeEventListener("TabSelect", this._updateFindbar);
    document.removeEventListener("keydown", this._addKeymaps);
    window.removeEventListener("findbaropen", this._handleFindbarOpenEvent);
    window.removeEventListener("findbarclose", this._handleFindbarCloseEvent);
    UC_API.Prefs.removeListener(this._agenticModeListener);
    UC_API.Prefs.removeListener(this._backgroundStylesListener);
    UC_API.Prefs.removeListener(this._citationsListener);
    UC_API.Prefs.removeListener(this._contextMenuEnabledListener);
    UC_API.Prefs.removeListener(this._minimalListener);
    UC_API.Prefs.removeListener(this._persistListener);
    UC_API.Prefs.removeListener(this._dndListener);
    this.disableDND();

    this._handleInputKeyPress = null;
    this._updateFindbar = null;
    this._addKeymaps = null;
    this._agenticModeListener = null;
    this._citationsListener = null;
    this._contextMenuEnabledListener = null;
    this._minimalListener = null;
    this._dndListener = null;
    this._handleFindbarOpenEvent = null;
    this._handleFindbarCloseEvent = null;
  },

  handleFindbarOpenEvent: function () {
    if (this.enabled) {
      debugLog("Findbar is being opened");
      setTimeout(() => (this.findbar._findField.placeholder = "Press Alt + Enter to ask AI"), 100);
      setTimeout(() => this._updateFindbarDimensions(), 1);
    }
  },

  handleFindbarCloseEvent: function () {
    if (this.enabled) {
      debugLog("Findbar is being closed");
      if (this._isStreaming) {
        this._abortController?.abort();
      }
    }
  },
};
