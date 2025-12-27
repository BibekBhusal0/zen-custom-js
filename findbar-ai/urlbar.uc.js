import { LLM } from "./llm/index.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js";
import { getToolSystemPrompt, getTools, toolNameMapping } from "./llm/tools.js";
import { stepCountIs } from "ai";
import { parseElement } from "../utils/parse.js";

const urlBarGroups = ["search", "navigation", "tabs", "workspaces", "uiFeedback"];

export class UrlBarLLM extends LLM {
  async getSystemPrompt() {
    let systemPrompt = `You are an AI integrated with Zen Browser URL bar, designed to assist users in browsing the web effectively and organizing their workspace in a better way.

Your primary responsibilities include:
1. Making tool calls in each response based on user input.
2. If the user does not provide specific commands, perform a search using the provided terms. You are permitted to correct any grammar or spelling mistakes and refine user queries for better accuracy.
3. If a URL is provided, open it directly.
4. Update the user about your action with a Toast Notification.
5. Managing tabs, if a user asks you to manage the tabs (grouping, closing, splitting) you will do it with tools you have access to.

When to use Toast:
- When you perform a non-default action, like searching or opening a URL, or if you fix a spelling mistake in the search term.
- When you can't fulfill a user's requirement (show a short and clear toast why the user's requirement can't be fulfilled).
- When a long and complicated task is completed.

Your goal is to ensure a seamless and user-friendly browsing experience.`;
    systemPrompt += await getToolSystemPrompt(urlBarGroups);
    return systemPrompt;
  }

  async sendMessage(prompt) {
    debugLog(`urlBarLLM: Sending prompt: "${prompt}"`);

    const shouldToolBeCalled = async (toolName) => {
      const friendlyName = toolNameMapping[toolName] || toolName;
      gURLBar.inputField.setAttribute("placeholder", `${friendlyName}...`);
      return true;
    };

    const urlBarToolSet = getTools(urlBarGroups, { shouldToolBeCalled });

    await super.generateText({
      prompt,
      tools: urlBarToolSet,
      stopWhen: stepCountIs(PREFS.maxToolCalls),
    });
  }
}

export const urlBarLLM = new UrlBarLLM();
window.browseBotURLBarLLM = urlBarLLM;

export const urlbarAI = {
  _isAIMode: false,
  _originalPlaceholder: "",
  _originalHeight: null,
  _initialized: false,
  _enabled: false,
  _prefListener: null,

  get enabled() {
    return PREFS.getPref(PREFS.URLBAR_AI_ENABLED);
  },
  get hideSuggestions() {
    return PREFS.getPref(PREFS.URLBAR_AI_HIDE_SUGGESTIONS);
  },
  get animationsEnabled() {
    return PREFS.getPref(PREFS.URLBAR_AI_ANIMATIONS_ENABLED);
  },

  _hideSuggestions() {
    gURLBar.setAttribute("hide-suggestions", "true");
  },
  _resetHideSuggestions() {
    gURLBar.removeAttribute("hide-suggestions");
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
    gURLBar.removeAttribute("is-ai-thinking");
    gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
    this._initialized = false;
    debugLog("urlbarAI: Destruction complete");
  },

  _closeUrlBar() {
    try {
      this.clearAnimationPropertiesInUrlBar();
      this._resetHideSuggestions();
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

  animateAIOn() {
    if (!this.hideSuggestions) {
      return false;
    }
    if (!this.animationsEnabled) {
      this._hideSuggestions();
      return false;
    }
    try {
      const textbox = gURLBar.textbox;
      if (!textbox) return false;
      if (!gURLBar.view.isOpen) {
        this._hideSuggestions();
        return false;
      }
      const height = textbox.getBoundingClientRect().height;
      if (!height) return;
      this._originalHeight = height;
      textbox.style.setProperty("height", height + "px", "important");
      textbox.style.setProperty("overflow", "hidden", "important");
      textbox.style.setProperty("transition", "height 0.15s ease", "important");
      const panelHeight = gURLBar.panel.getBoundingClientRect().height;
      const inputHeight = height - panelHeight - 10;
      setTimeout(() => textbox.style.setProperty("height", inputHeight + "px", "important"), 1);
      setTimeout(() => this._hideSuggestions(), 151);
    } catch (e) {
      debugError("Error while animating", e);
      return false;
    }
    return true;
  },

  animateAIOff() {
    if (!this.hideSuggestions) {
      return false;
    }
    if (!this.animationsEnabled) {
      this._resetHideSuggestions();
      return false;
    }
    try {
      const textbox = gURLBar.textbox;
      if (!textbox) return false;
      if (!gURLBar.view.isOpen) {
        this._resetHideSuggestions();
        return false;
      }
      if (!this._originalHeight) return false;
      const height = textbox.getBoundingClientRect().height;
      if (!height) return;
      if (height === this._originalHeight) return;
      textbox.style.setProperty("transition", "height 0.15s ease", "important");
      textbox.style.setProperty("overflow", "hidden", "important");
      setTimeout(() => {
        textbox.style.setProperty("height", this._originalHeight + "px", "important");
        this._originalHeight = null;
      }, 1);
      setTimeout(() => {
        this.clearAnimationPropertiesInUrlBar();
        this._resetHideSuggestions();
      }, 151);
    } catch (e) {
      debugError("Error while animating", e);
      return false;
    }
    return true;
  },

  clearAnimationPropertiesInUrlBar() {
    try {
      const textbox = gURLBar.textbox;
      if (!textbox) return;
      textbox.style.removeProperty("transition");
      textbox.style.removeProperty("overflow");
      textbox.style.removeProperty("height");
    } catch {}
  },

  toggleAIMode(forceState, forceClose = false) {
    const newState = typeof forceState === "boolean" ? forceState : !this._isAIMode;
    if (newState === this._isAIMode) return;

    debugLog(`urlbarAI: Toggling AI mode. Current: ${this._isAIMode}, New: ${newState}`);
    this._isAIMode = newState;

    if (this._isAIMode) {
      gURLBar.value = "";
      gURLBar.setAttribute("ai-mode-active", "true");
      gURLBar.inputField.setAttribute("placeholder", "Command to AI");
      this.animateAIOn();
      gURLBar.startQuery();
    } else {
      if (forceClose) this._closeUrlBar();
      else this.animateAIOff();
      gURLBar.removeAttribute("ai-mode-active");
      gURLBar.removeAttribute("is-ai-thinking");
      gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
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
    if (this._isAIMode) {
      if (
        ((e.key === "ArrowUp" || e.key === "ArrowDown") && this.hideSuggestions) ||
        e.key === "Tab"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === "Enter") {
        debugLog("urlbarAI: Enter key pressed in AI mode");
        e.preventDefault();
        e.stopPropagation();
        this.send();
      }
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
        this.clearAnimationPropertiesInUrlBar();
        this._resetHideSuggestions();
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
      gURLBar.setAttribute("is-ai-thinking", "true");
      gURLBar.inputField.setAttribute("placeholder", "AI thinking...");
      urlBarLLM.sendMessage(prompt).finally(() => {
        gURLBar.removeAttribute("is-ai-thinking");
        gURLBar.inputField.setAttribute("placeholder", this._originalPlaceholder);
        this.toggleAIMode(false, true);

// clear data after 4 seconds
    setTimeout(() => 
urlBarLLM.clearData()
, 4000);
      });
    } else {
      this.toggleAIMode(false, true);
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
    if (pref.value) this.init();
    else this.destroy();
  },
};
