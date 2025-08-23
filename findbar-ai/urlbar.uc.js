import { LLM } from "./llm/index.js";
import { debugLog, debugError } from "./utils/prefs.js";
import { getToolSystemPrompt } from "./llm/tools.js";

class UrlBarLLM extends LLM {
  get godMode() {
    return true;
  }
  get streamEnabled() {
    return false;
  }
  get citationsEnabled() {
    return false;
  }
  get persistChat() {
    return false;
  }
  async getSystemPrompt() {
    let systemPrompt = `You are an AI integrated with Zen Browser URL bar, designed to assist users in browsing the web effectively. 

Your primary responsibilities include:
1. Making tool calls in each response based on user input.
2. If the user does not provide specific commands, perform a search using the provided terms. You are permitted to correct any grammar or spelling mistakes and refine user queries for better accuracy.
3. If a URL is provided, open it directly.

Your goal is to ensure a seamless and user-friendly browsing experience.`;
    systemPrompt += await getToolSystemPrompt();
    return systemPrompt;
  }

  send(prompt) {
    debugLog(`urlBarLLM: Sending prompt: "${prompt}"`);
    this.sendMessage(prompt).then(() => this.clearData());
  }
}

const urlBarLLM = new UrlBarLLM();
window.browseBotURLBarLLM = urlBarLLM;

const urlbarAI = {
  _isAIMode: false,
  _originalPlaceholder: "",
  _styleElement: null,
  _initialized: false,

  init() {
    debugLog("urlbarAI: Initializing");
    if (this._initialized) {
      debugLog("urlbarAI: Already initialized.");
      return;
    }
    this._originalPlaceholder = gURLBar.inputField.getAttribute("placeholder");
    this.addStyles();
    this.addAskButton();
    this.addListeners();
    this._initialized = true;
    debugLog("urlbarAI: Initialization complete");
  },

  _closeUrlBar() {
    try {
      if (window.gZenUIManager && typeof window.gZenUIManager.handleUrlbarClose === "function") {
        window.gZenUIManager.handleUrlbarClose(false, false);
        return;
      }

      gURLBar.selectionStart = gURLBar.selectionEnd = 0;
      gURLBar.blur();

      if (gURLBar.view.isOpen) {
        gURLBar.view.close();
      }
    } catch (e) {
      debugError("urlbarAI: Error in _closeUrlBar", e);
    }
  },

  toggleAIMode(forceState) {
    const newState = typeof forceState === "boolean" ? forceState : !this._isAIMode;
    if (newState === this._isAIMode) return;

    debugLog(`urlbarAI: Toggling AI mode. Current: ${this._isAIMode}, New: ${newState}`);
    this._isAIMode = newState;

    if (this._isAIMode) {
      gURLBar.setAttribute("ai-mode-active", "true");
      gURLBar.inputField.setAttribute("placeholder", "Command to AI");
      gURLBar.setAttribute("open", "true");
    } else {
      gURLBar.removeAttribute("ai-mode-active");
      gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
      gURLBar.removeAttribute("open");
    }
    debugLog(`urlbarAI: AI mode is now ${this._isAIMode ? "ON" : "OFF"}`);
  },

  handleGlobalKeyDown(e) {
    if (e.ctrlKey && e.code === "Space") {
      debugLog("urlbarAI: Ctrl+Space detected globally");
      e.preventDefault();
      e.stopPropagation();
      gURLBar.focus();
      setTimeout(() => this.toggleAIMode(true), 0);
    }
  },

  handleUrlbarKeyDown(e) {
    if (e.key === "Enter" && this._isAIMode) {
      debugLog("urlbarAI: Enter key pressed in AI mode");
      let isNavigational = false;
      if (gURLBar.view.isOpen && gURLBar.view.selectedItem) {
        const { action } = gURLBar.view.selectedItem;
        if (action && (action.startsWith("visiturl") || action.startsWith("switchtab"))) {
          isNavigational = true;
        }
      }

      if (isNavigational) {
        debugLog("urlbarAI: Selected item is navigational, letting default action proceed.");
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const prompt = gURLBar.value.trim();
      if (prompt) {
        debugLog(`urlbarAI: Sending prompt to AI: "${prompt}"`);
        urlBarLLM.send(prompt);
        gURLBar.value = "";
      }
      this.toggleAIMode(false);
      this._closeUrlBar();
    }
  },

  addListeners() {
    debugLog("urlbarAI: Adding event listeners");
    this._boundHandleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
    this._boundHandleUrlbarKeyDown = this.handleUrlbarKeyDown.bind(this);
    this._boundDisableAIMode = () => {
      if (this._isAIMode) {
        debugLog("urlbarAI: Disabling AI mode due to blur or popup hide");
        this.toggleAIMode(false);
      }
    };

    document.addEventListener("keydown", this._boundHandleGlobalKeyDown, true);
    gURLBar.inputField.addEventListener("keydown", this._boundHandleUrlbarKeyDown, true);
    gURLBar.inputField.addEventListener("blur", this._boundDisableAIMode);
    gURLBar.view.panel.addEventListener("popuphiding", this._boundDisableAIMode);
  },

  addAskButton() {
    debugLog("urlbarAI: Adding 'Ask' button");
    if (document.getElementById("urlbar-ask-ai-button")) {
      debugLog("urlbarAI: 'Ask' button already exists.");
      return;
    }

    const button = document.createXULElement("toolbarbutton");
    button.id = "urlbar-ask-ai-button";
    button.className = "urlbar-icon";
    button.setAttribute("tooltiptext", "Ask AI");
    button.style.listStyleImage = "url('chrome://global/skin/icons/search-glass.svg')";

    button.addEventListener("click", () => {
      const prompt = gURLBar.value.trim();
      if (prompt) {
        debugLog(`urlbarAI: 'Ask' button clicked. Sending prompt: "${prompt}"`);
        urlBarLLM.send(prompt);
        gURLBar.value = "";
      }
      this._closeUrlBar();
    });

    const insertButton = (retryCount = 0) => {
      if (gURLBar.actionsBox) {
        gURLBar.actionsBox.insertBefore(button, gURLBar.actionsBox.firstChild);
        debugLog("urlbarAI: 'Ask' button added successfully");
      } else if (retryCount < 20) {
        debugError(
          `Could not find gURLBar.actionsBox to add the 'Ask' button. Retrying in 500ms... (attempt ${
            retryCount + 1
          })`
        );
        setTimeout(() => insertButton(retryCount + 1), 500);
      } else {
        debugError("Could not find gURLBar.actionsBox after multiple attempts. Giving up.");
      }
    };

    insertButton();
  },

  addStyles() {
    debugLog("urlbarAI: Adding styles");
    this._styleElement = document.createElement("style");
    this._styleElement.id = "urlbar-ai-styles";
    this._styleElement.textContent = `
      #urlbar[ai-mode-active="true"] #urlbar-ask-ai-button {
        display: none !important;
      }
      #urlbar-ask-ai-button {
        margin-inline-end: 2px;
      }
    `;
    document.head.appendChild(this._styleElement);
  },
};

if (typeof UC_API !== "undefined" && UC_API.Runtime) {
  UC_API.Runtime.startupFinished().then(() => urlbarAI.init());
} else {
  if (gBrowserInit.delayedStartupFinished) {
    urlbarAI.init();
  } else {
    let observer = new MutationObserver(() => {
      if (gBrowserInit.delayedStartupFinished) {
        urlbarAI.init();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

