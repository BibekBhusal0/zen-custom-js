import { LLM } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { getToolSystemPrompt, getTools, toolNameMapping } from "./llm/tools.js";
import { parseElement } from "./utils/parse.js";

const urlBarGroups = ["search", "navigation", "tabs", "workspaces", "uiFeedback"];

class UrlBarLLM extends LLM {
  // TODO: Improve system prompt, should use Toast as feedback
  async getSystemPrompt() {
    let systemPrompt = `You are an AI integrated with Zen Browser URL bar, designed to assist users in browsing the web effectively. 

Your primary responsibilities include:
1. Making tool calls in each response based on user input.
2. If the user does not provide specific commands, perform a search using the provided terms. You are permitted to correct any grammar or spelling mistakes and refine user queries for better accuracy.
3. If a URL is provided, open it directly.

Your goal is to ensure a seamless and user-friendly browsing experience.`;
    systemPrompt += await getToolSystemPrompt(urlBarGroups);
    return systemPrompt;
  }

  async sendMessage(prompt) {
    debugLog(`urlBarLLM: Sending prompt: "${prompt}"`);

    const shouldToolBeCalled = async (toolName) => {
      const friendlyName = toolNameMapping[toolName] || toolName;
      gURLBar.inputField.setAttribute("placeholder", `AI: ${friendlyName}...`);
      return true;
    };

    const urlBarToolSet = getTools(urlBarGroups, shouldToolBeCalled);

    await super.sendMessageAndToolCalls({
      prompt,
      tools: urlBarToolSet,
      maxCalls: PREFS.maxToolCalls,
    });
  }
}

const urlBarLLM = new UrlBarLLM();
window.browseBotURLBarLLM = urlBarLLM;

const urlbarAI = {
  _isAIMode: false,
  _originalPlaceholder: "",
  _initialized: false,
  _enabled: false,
  _prefListener: null,

  get enabled() {
    return PREFS.getPref(PREFS.URLBAR_AI_ENABLED);
  },

  init() {
    if (!this.enabled) {
      debugLog("urlbarAI: Disabled by preference.");
      return;
    }
    debugLog("urlbarAI: Initializing");
    if (this._initialized) {
      debugLog("urlbarAI: Already initialized.");
      return;
    }
    this._originalPlaceholder = gURLBar.inputField.getAttribute("placeholder");
    this.addAskButton();
    this.addListeners();
    this._initialized = true;
    debugLog("urlbarAI: Initialization complete");
  },

  destroy() {
    debugLog("urlbarAI: Destroying");
    this.removeAskButton();
    this.removeListeners();
    if (this._isAIMode) {
      this.toggleAIMode(false);
    }
    gURLBar.removeAttribute("ai-mode-active");
    gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
    this._initialized = false;
    debugLog("urlbarAI: Destruction complete");
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
      gURLBar.startQuery();
    } else {
      gURLBar.removeAttribute("ai-mode-active");
      gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
      this._closeUrlBar();
      gURLBar.value = "";
    }
    debugLog(`urlbarAI: AI mode is now ${this._isAIMode ? "ON" : "OFF"}`);
  },

  handleGlobalKeyDown(e) {
    if (e.ctrlKey && e.code === "Space" && !e.altKey && !e.shiftKey) {
      debugLog("urlbarAI: Ctrl+Space detected globally");
      e.preventDefault();
      e.stopPropagation();
      gURLBar.focus();
      setTimeout(() => this.toggleAIMode(), 0);
    }
  },

  handleUrlbarKeyDown(e) {
    if (e.key === "Enter" && this._isAIMode) {
      debugLog("urlbarAI: Enter key pressed in AI mode");
      let isNavigational = false;
      if (gURLBar.view.isOpen && gURLBar.view.selectedResult) {
        const type = gURLBar?.view?.selectedResult?.type;
        if (type !== 2) isNavigational = true;
      }

      if (isNavigational) {
        debugLog("urlbarAI: Selected item is navigational, letting default action proceed.");
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      this.send();
    }
  },

  addListeners() {
    debugLog("urlbarAI: Adding event listeners");
    this._boundHandleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
    this._boundHandleUrlbarKeyDown = this.handleUrlbarKeyDown.bind(this);
    this._boundDisableAIMode = () => {
      gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
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

  removeListeners() {
    debugLog("urlbarAI: Removing event listeners");
    if (this._boundHandleGlobalKeyDown) {
      document.removeEventListener("keydown", this._boundHandleGlobalKeyDown, true);
      this._boundHandleGlobalKeyDown = null;
    }
    if (this._boundHandleUrlbarKeyDown) {
      gURLBar.inputField.removeEventListener("keydown", this._boundHandleUrlbarKeyDown, true);
      this._boundHandleUrlbarKeyDown = null;
    }
    if (this._boundDisableAIMode) {
      gURLBar.inputField.removeEventListener("blur", this._boundDisableAIMode);
      gURLBar.view.panel.removeEventListener("popuphiding", this._boundDisableAIMode);
      this._boundDisableAIMode = null;
    }
  },

  send() {
    const prompt = gURLBar.value.trim();
    if (prompt) {
      debugLog(`URLbar: Sending prompt: "${prompt}"`);
      gURLBar.value = "";
      // TODO: Maybe better animations could be added here
      gURLBar.inputField.setAttribute("placeholder", "AI thinking...");
      urlBarLLM.sendMessage(prompt).finally(() => {
        gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
        this.toggleAIMode(false);
      });
    } else {
      this.toggleAIMode(false);
    }
  },

  addAskButton() {
    debugLog("urlbarAI: Adding 'Ask' button");
    if (document.getElementById("urlbar-ask-ai-button")) {
      debugLog("urlbarAI: 'Ask' button already exists.");
      return;
    }

    const buttonString = `
      <toolbarbutton id="urlbar-ask-ai-button" class="urlbar-icon"
        image="chrome://global/skin/icons/highlights.svg" tooltiptext="Ask AI"/>
    `;
    const button = parseElement(buttonString, "xul");

    button.addEventListener("click", () => setTimeout(() => this.send(), 100));

    const insertButton = (retryCount = 0) => {
      const inputContainer = document.querySelector("#urlbar .urlbar-input-container");
      if (inputContainer) {
        inputContainer.appendChild(button);
        debugLog("urlbarAI: 'Ask' button added successfully to .urlbar-input-container");
      } else if (retryCount < 10) {
        debugError(
          `Could not find #urlbar .urlbar-input-container to add the 'Ask' button. Retrying in 500ms... (attempt ${
            retryCount + 1
          })`
        );
        setTimeout(() => insertButton(retryCount + 1), 500);
      } else {
        debugError(
          "Could not find #urlbar .urlbar-input-container after multiple attempts. Giving up."
        );
      }
    };

    insertButton();
  },

  removeAskButton() {
    debugLog("urlbarAI: Removing 'Ask' button");
    const button = document.getElementById("urlbar-ask-ai-button");
    if (button) {
      button.remove();
      debugLog("urlbarAI: 'Ask' button removed.");
    }
  },

  handlePrefChange(pref) {
    if (pref.value) {
      this.init();
    } else {
      this.destroy();
    }
  },
};

function startup() {
  urlbarAI.init();
  urlbarAI._prefListener = UC_API.Prefs.addListener(
    PREFS.URLBAR_AI_ENABLED,
    urlbarAI.handlePrefChange.bind(urlbarAI)
  );
}

if (typeof UC_API !== "undefined" && UC_API.Runtime) {
  UC_API.Runtime.startupFinished().then(startup);
} else {
  if (gBrowserInit.delayedStartupFinished) {
    startup();
  } else {
    let observer = new MutationObserver(() => {
      if (gBrowserInit.delayedStartupFinished) {
        startup();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}
