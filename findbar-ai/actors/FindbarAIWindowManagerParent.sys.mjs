const getPref = (key, defaultValue) => {
  try {
    const pref = UC_API.Prefs.get(key);
    if (!pref) return defaultValue;
    if (!pref.exists()) return defaultValue;
    return pref.value;
  } catch {
    return defaultValue;
  }
};

const debugLog = (...args) => {
  if (getPref("extension.findbar-ai.debug-mode", false)) {
    console.log("[findbar-ai] windowManager.js (parent):", ...args);
  }
};

const debugError = (...args) => {
  if (getPref("extension.findbar-ai.debug-mode", false)) {
    console.error("[findbar-ai] windowManager.js (parent Error):", ...args);
  }
};

debugLog("Window Manager parent loaded");

export class FindbarAIWindowManagerParent extends JSWindowActorParent {
  constructor() {
    super();
  }

  async receiveMessage(message) {
    debugLog("parent received message");
    debugLog(`Message name: ${message.name}`);
    switch (message.name) {
      case "FindbarAI:ContentLoaded":
        debugLog(`Page loaded: ${message.data.title} - ${message.data.url}`);
        break;

      default:
        debugLog(`unhandled message: ${message.name}`);
    }
  }

  async getPageHTMLContent() {
    try {
      const result = await this.sendQuery("FindbarAI:GetPageHTMLContent");
      return result;
    } catch (e) {
      debugError("Failed to get page content:", e);
      return {};
    }
  }

  async getSelectedText() {
    try {
      const result = await this.sendQuery("FindbarAI:GetSelectedText");
      return result;
    } catch (e) {
      debugError("Failed to get selected text:", e);
      return {};
    }
  }

  async getPageTextContent(trimWhiteSpace) {
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.log("FindbarAIWindowManagerParent#getPageTextContent trimWhiteSpace:", trimWhiteSpace); // __AUTO_GENERATED_PRINT_VAR_END__
    try {
      const result = await this.sendQuery("FindbarAI:GetPageTextContent", {
        trimWhiteSpace,
      });
      // __AUTO_GENERATED_PRINT_VAR_START__
      console.log("FindbarAIWindowManagerParent#getPageTextContent result:", result); // __AUTO_GENERATED_PRINT_VAR_END__
      return result;
    } catch (e) {
      debugError("Failed to get page text content:", e);
      return {};
    }
  }

  async clickElement(selector) {
    try {
      const result = await this.sendQuery("FindbarAI:ClickElement", { selector });
      return result;
    } catch (e) {
      debugError("Failed to click element:", e);
      return { error: `Failed to click element: ${e}` };
    }
  }

  async fillForm(selector, value) {
    try {
      const result = await this.sendQuery("FindbarAI:FillForm", { selector, value });
      return result;
    } catch (e) {
      debugError("Failed to fill form:", e);
      return { error: `Failed to fill form: ${e}` };
    }
  }

  async getYoutubeTranscript() {
    try {
      const result = await this.sendQuery("FindbarAI:GetYoutubeTranscript");
      return result;
    } catch (e) {
      debugError("Failed to get youtube transcript:", e);
      return { error: `Failed to get youtube transcript: ${e}` };
    }
  }
}
