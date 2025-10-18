// ==UserScript==
// @name            BrowseBot
// @description     Transforms the standard Zen Browser findbar into a modern, floating, AI-powered chat interface.
// @author          BibekBhusal
// ==/UserScript==


import { n as number, t as tool, o as object, s as string, a as array, c as createPerplexity, b as createOpenAI, d as createOllama, e as createMistral, x as xai, f as createGoogleGenerativeAI, g as createAnthropic, h as stepCountIs, i as generateText, j as streamText, k as generateObject } from './browse-bot_vercel-ai-sdk.uc.js';

const PREFS = {
  // Findbar
  ENABLED: "extension.browse-bot.findbar-ai.enabled",
  MINIMAL: "extension.browse-bot.findbar-ai.minimal",
  PERSIST: "extension.browse-bot.findbar-ai.persist-chat",
  DND_ENABLED: "extension.browse-bot.findbar-ai.dnd-enabled",
  POSITION: "extension.browse-bot.findbar-ai.position",
  REMEMBER_DIMENSIONS: "extension.browse-bot.findbar-ai.remember-dimensions",
  WIDTH: "extension.browse-bot.findbar-ai.width",
  STREAM_ENABLED: "extension.browse-bot.findbar-ai.stream-enabled",
  AGENTIC_MODE: "extension.browse-bot.findbar-ai.agentic-mode",
  CITATIONS_ENABLED: "extension.browse-bot.findbar-ai.citations-enabled",
  MAX_TOOL_CALLS: "extension.browse-bot.findbar-ai.max-tool-calls",
  CONFORMATION: "extension.browse-bot.findbar-ai.conform-before-tool-call",
  CONTEXT_MENU_ENABLED: "extension.browse-bot.findbar-ai.context-menu-enabled",
  CONTEXT_MENU_AUTOSEND: "extension.browse-bot.findbar-ai.context-menu-autosend",
  CONTEXT_MENU_COMMAND_WITH_SELECTION:
    "extension.browse-bot.findbar-ai.context-menu-command-with-selection",
  CONTEXT_MENU_COMMAND_NO_SELECTION:
    "extension.browse-bot.findbar-ai.context-menu-command-no-selection",
  BACKGROUND_STYLE: "extension.browse-bot.findbar-ai.background-style",

  // URL Bar
  URLBAR_AI_ENABLED: "extension.browse-bot.urlbar-ai-enabled",
  URLBAR_AI_HIDE_SUGGESTIONS: "extension.browse-bot.urlbar-ai.hide-suggestions",
  URLBAR_AI_ANIMATIONS_ENABLED: "extension.browse-bot.urlbar-ai.animations-enabled",

  // Other
  DEBUG_MODE: "extension.browse-bot.debug-mode",
  SOLID_BG: "extension.browse-bot.solid-bg",

  // Shared LLM
  LLM_PROVIDER: "extension.browse-bot.llm-provider",
  MISTRAL_API_KEY: "extension.browse-bot.mistral-api-key",
  MISTRAL_MODEL: "extension.browse-bot.mistral-model",
  GEMINI_API_KEY: "extension.browse-bot.gemini-api-key",
  GEMINI_MODEL: "extension.browse-bot.gemini-model",
  OPENAI_API_KEY: "extension.browse-bot.openai-api-key",
  OPENAI_MODEL: "extension.browse-bot.openai-model",
  CLAUDE_API_KEY: "extension.browse-bot.claude-api-key",
  CLAUDE_MODEL: "extension.browse-bot.claude-model",
  GROK_API_KEY: "extension.browse-bot.grok-api-key",
  GROK_MODEL: "extension.browse-bot.grok-model",
  PERPLEXITY_API_KEY: "extension.browse-bot.perplexity-api-key",
  PERPLEXITY_MODEL: "extension.browse-bot.perplexity-model",
  OLLAMA_MODEL: "extension.browse-bot.ollama-model",
  OLLAMA_BASE_URL: "extension.browse-bot.ollama-base-url",

  //TODO: Not yet implimented
  COPY_BTN_ENABLED: "extension.browse-bot.findbar-ai.copy-btn-enabled",
  MARKDOWN_ENABLED: "extension.browse-bot.findbar-ai.markdown-enabled",
  SHOW_TOOL_CALL: "extension.browse-bot.findbar-ai.show-tool-call",

  defaultValues: {},

  getPref(key) {
    try {
      const pref = UC_API.Prefs.get(key);
      if (!pref) return PREFS.defaultValues[key];
      if (!pref.exists()) return PREFS.defaultValues[key];
      return pref.value;
    } catch {
      return PREFS.defaultValues[key];
    }
  },

  setPref(prefKey, value) {
    UC_API.Prefs.set(prefKey, value);
  },

  migratePrefs() {
    const migrationMap = {
      "extension.browse-bot.enabled": PREFS.ENABLED,
      "extension.browse-bot.minimal": PREFS.MINIMAL,
      "extension.browse-bot.persist-chat": PREFS.PERSIST,
      "extension.browse-bot.dnd-enabled": PREFS.DND_ENABLED,
      "extension.browse-bot.position": PREFS.POSITION,
      "extension.browse-bot.stream-enabled": PREFS.STREAM_ENABLED,
      "extension.browse-bot.god-mode": PREFS.AGENTIC_MODE,
      "extension.browse-bot.findbar-god-mode": PREFS.AGENTIC_MODE,
      "extension.browse-bot.citations-enabled": PREFS.CITATIONS_ENABLED,
      "extension.browse-bot.max-tool-calls": PREFS.MAX_TOOL_CALLS,
      "extension.browse-bot.conform-before-tool-call": PREFS.CONFORMATION,
      "extension.browse-bot.context-menu-enabled": PREFS.CONTEXT_MENU_ENABLED,
      "extension.browse-bot.context-menu-autosend": PREFS.CONTEXT_MENU_AUTOSEND,
    };

    for (const [oldKey, newKey] of Object.entries(migrationMap)) {
      try {
        const oldPref = UC_API.Prefs.get(oldKey);
        if (oldPref && oldPref.exists()) {
          const value = oldPref.value;
          debugLog(`Migrating pref ${oldKey} to ${newKey} with value: ${value}`);
          UC_API.Prefs.set(newKey, value);
          oldPref.reset();
        }
      } catch (e) {
        // It's fine if it fails, just log it in debug mode
        debugError(`Could not migrate pref ${oldKey}:`, e);
      }
    }
  },

  setInitialPrefs() {
    this.migratePrefs();
    for (const [key, value] of Object.entries(PREFS.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  },

  get enabled() {
    return this.getPref(this.ENABLED);
  },
  set enabled(value) {
    this.setPref(this.ENABLED, value);
  },

  get minimal() {
    return this.getPref(this.MINIMAL);
  },
  set minimal(value) {
    this.setPref(this.MINIMAL, value);
  },

  get streamEnabled() {
    return this.getPref(this.STREAM_ENABLED);
  },
  set streamEnabled(value) {
    this.setPref(this.STREAM_ENABLED, value);
  },

  set agenticMode(value) {
    this.setPref(this.AGENTIC_MODE, value);
  },
  get agenticMode() {
    return this.getPref(this.AGENTIC_MODE);
  },

  get citationsEnabled() {
    return this.getPref(this.CITATIONS_ENABLED);
  },
  set citationsEnabled(value) {
    this.setPref(this.CITATIONS_ENABLED, value);
  },

  get contextMenuEnabled() {
    return this.getPref(this.CONTEXT_MENU_ENABLED);
  },
  set contextMenuEnabled(value) {
    this.setPref(this.CONTEXT_MENU_ENABLED, value);
  },

  get contextMenuAutoSend() {
    return this.getPref(this.CONTEXT_MENU_AUTOSEND);
  },
  set contextMenuAutoSend(value) {
    this.setPref(this.CONTEXT_MENU_AUTOSEND, value);
  },

  get contextMenuCommandWithSelection() {
    return this.getPref(this.CONTEXT_MENU_COMMAND_WITH_SELECTION);
  },
  set contextMenuCommandWithSelection(value) {
    this.setPref(this.CONTEXT_MENU_COMMAND_WITH_SELECTION, value);
  },

  get contextMenuCommandNoSelection() {
    return this.getPref(this.CONTEXT_MENU_COMMAND_NO_SELECTION);
  },
  set contextMenuCommandNoSelection(value) {
    this.setPref(this.CONTEXT_MENU_COMMAND_NO_SELECTION, value);
  },

  get llmProvider() {
    return this.getPref(this.LLM_PROVIDER);
  },
  set llmProvider(value) {
    this.setPref(this.LLM_PROVIDER, value);
  },

  get persistChat() {
    return this.getPref(this.PERSIST);
  },
  set persistChat(value) {
    this.setPref(this.PERSIST, value);
  },

  get backgroundStyle() {
    return this.getPref(this.BACKGROUND_STYLE);
  },

  get pseudoBg() {
    return this.backgroundStyle === "pseudo";
  },

  get maxToolCalls() {
    return this.getPref(this.MAX_TOOL_CALLS);
  },
  set maxToolCalls(value) {
    this.setPref(this.MAX_TOOL_CALLS, value);
  },

  get copyBtnEnabled() {
    return this.getPref(this.COPY_BTN_ENABLED);
  },
  set copyBtnEnabled(value) {
    this.setPref(this.COPY_BTN_ENABLED, value);
  },

  get markdownEnabled() {
    return this.getPref(this.MARKDOWN_ENABLED);
  },
  set markdownEnabled(value) {
    this.setPref(this.MARKDOWN_ENABLED, value);
  },

  get conformation() {
    return this.getPref(this.CONFORMATION);
  },
  set conformation(value) {
    this.setPref(this.CONFORMATION, value);
  },

  get showToolCall() {
    return this.getPref(this.SHOW_TOOL_CALL);
  },
  set showToolCall(value) {
    this.setPref(this.SHOW_TOOL_CALL, value);
  },

  get dndEnabled() {
    return this.getPref(this.DND_ENABLED);
  },
  set dndEnabled(value) {
    this.setPref(this.DND_ENABLED, value);
  },

  get position() {
    return this.getPref(this.POSITION);
  },
  set position(value) {
    this.setPref(this.POSITION, value);
  },

  get rememberDimensions() {
    return this.getPref(this.REMEMBER_DIMENSIONS);
  },
  set rememberDimensions(value) {
    this.setPref(this.REMEMBER_DIMENSIONS, value);
  },

  get width() {
    return this.getPref(this.WIDTH);
  },
  set width(value) {
    this.setPref(this.WIDTH, value);
  },

  get ollamaBaseUrl() {
    return this.getPref(this.OLLAMA_BASE_URL);
  },
  set ollamaBaseUrl(value) {
    this.setPref(this.OLLAMA_BASE_URL, value);
  },
};

const debugLog = (...args) => {
  if (PREFS.getPref(PREFS.DEBUG_MODE, false)) {
    console.log("BrowseBot :", ...args);
  }
};

const debugError = (...args) => {
  if (PREFS.getPref(PREFS.DEBUG_MODE, false)) {
    console.error("BrowseBot :", ...args);
  }
};

PREFS.defaultValues = {
  [PREFS.ENABLED]: true,
  [PREFS.URLBAR_AI_ENABLED]: true,
  [PREFS.URLBAR_AI_HIDE_SUGGESTIONS]: true,
  [PREFS.URLBAR_AI_ANIMATIONS_ENABLED]: true,
  [PREFS.MINIMAL]: true,
  [PREFS.AGENTIC_MODE]: false,
  [PREFS.DEBUG_MODE]: false,
  [PREFS.PERSIST]: false,
  [PREFS.STREAM_ENABLED]: true,
  [PREFS.CITATIONS_ENABLED]: false,
  [PREFS.CONTEXT_MENU_ENABLED]: true,
  [PREFS.CONTEXT_MENU_AUTOSEND]: true,
  [PREFS.CONTEXT_MENU_COMMAND_NO_SELECTION]: "Summarize current page",
  [PREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION]:
    "Explain this in context of current page:\n\n{selection}",
  [PREFS.LLM_PROVIDER]: "gemini",
  [PREFS.MISTRAL_API_KEY]: "",
  [PREFS.MISTRAL_MODEL]: "mistral-medium-latest",
  [PREFS.GEMINI_API_KEY]: "",
  [PREFS.GEMINI_MODEL]: "gemini-2.0-flash",
  [PREFS.OPENAI_API_KEY]: "",
  [PREFS.OPENAI_MODEL]: "gpt-4o",
  [PREFS.CLAUDE_API_KEY]: "",
  [PREFS.CLAUDE_MODEL]: "claude-4-opus",
  [PREFS.GROK_API_KEY]: "",
  [PREFS.GROK_MODEL]: "grok-4",
  [PREFS.PERPLEXITY_API_KEY]: "",
  [PREFS.PERPLEXITY_MODEL]: "sonar",
  [PREFS.OLLAMA_MODEL]: "llama2",
  [PREFS.OLLAMA_BASE_URL]: "http://localhost:11434/api",
  [PREFS.DND_ENABLED]: true,
  [PREFS.POSITION]: "top-right",
  [PREFS.REMEMBER_DIMENSIONS]: true,
  [PREFS.WIDTH]: 500,
  [PREFS.MAX_TOOL_CALLS]: 5,
  [PREFS.CONFORMATION]: true,
  [PREFS.BACKGROUND_STYLE]: "solid",
  // [PREFS.COPY_BTN_ENABLED]: true,
  // [PREFS.MARKDOWN_ENABLED]: true,
  // [PREFS.SHOW_TOOL_CALL]: false,
};

function frameScript() {
  const getUrlAndTitle = () => {
    return {
      url: content.location.href,
      title: content.document.title,
    };
  };

  const extractRelevantContent = () => {
    const clonedBody = content.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, img, video, audio, object, embed, applet, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());
    return clonedBody.innerHTML;
  };

  const extractTextContent = (trimWhiteSpace = true) => {
    const clonedBody = content.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, input, textarea, select, img, video, audio, object, embed, applet, form, button, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());

    clonedBody.querySelectorAll("br").forEach((br) => {
      br.replaceWith("\n");
    });

    const blockSelector =
      "p, div, li, h1, h2, h3, h4, h5, h6, tr, article, section, header, footer, aside, main, blockquote, pre";
    clonedBody.querySelectorAll(blockSelector).forEach((el) => {
      el.append("\n");
    });

    const textContent = clonedBody.textContent;

    if (trimWhiteSpace) {
      return textContent.replace(/\s+/g, " ").trim();
    }

    return textContent
      .replace(/[ \t\r\f\v]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n+/g, "\n")
      .trim();
  };

  async function getYouTubeTranscript() {
    const win = content;
    const doc = content.document;

    async function ensureBodyAvailable() {
      if (doc.body) return;
      await new Promise((resolve) => {
        const check = () => {
          if (doc.body) resolve();
          else win.setTimeout(check, 50);
        };
        check();
      });
    }

    function waitForSelectorWithObserver(selector, timeout = 5000) {
      return new Promise(async (resolve, reject) => {
        try {
          await ensureBodyAvailable();
          const el = doc.querySelector(selector);
          if (el) return resolve(el);

          const observer = new win.MutationObserver(() => {
            const el = doc.querySelector(selector);
            if (el) {
              observer.disconnect();
              resolve(el);
            }
          });

          observer.observe(doc.body, {
            childList: true,
            subtree: true,
          });

          win.setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for ${selector}`));
          }, timeout);
        } catch (e) {
          reject(new Error(`waitForSelectorWithObserver failed: ${e.message}`));
        }
      });
    }

    try {
      if (!doc.querySelector("ytd-transcript-renderer")) {
        const button = doc.querySelector('button[aria-label="Show transcript"]');
        if (!button)
          throw new Error('"Show transcript" button not found — transcript may not be available.');
        button.click();
        await waitForSelectorWithObserver("ytd-transcript-renderer", 5000);
      }

      await waitForSelectorWithObserver("ytd-transcript-segment-renderer .segment-text", 5000);

      const segments = Array.from(
        doc.querySelectorAll("ytd-transcript-segment-renderer .segment-text")
      );
      if (!segments.length) throw new Error("Transcript segments found, but all are empty.");

      const transcript = segments
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .join("\n");
      return transcript;
    } catch (err) {
      throw err;
    }
  }

  const getYoutubeDescription = async () => {
    const descriptionContainer = content.document.querySelector("#description-inline-expander");
    if (descriptionContainer) {
      const expandButton =
        descriptionContainer.querySelector("#expand") ||
        descriptionContainer.querySelector("#expand-button") ||
        descriptionContainer.querySelector("tp-yt-paper-button#more");
      // Check if button is visible, as it's hidden when expanded
      if (expandButton && expandButton.offsetParent !== null) {
        expandButton.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const desc = content.document.querySelector(
      "#description-inline-expander .yt-core-attributed-string, #description .content, .ytd-expandable-video-description-body-renderer .yt-core-attributed-string"
    );
    return desc ? desc.textContent.trim() : "Description not found.";
  };

  const getYoutubeComments = (count = 10) => {
    const comments = Array.from(
      content.document.querySelectorAll("ytd-comment-thread-renderer #content-text")
    ).slice(0, count);
    if (comments.length === 0) return ["No comments found or they are not loaded yet."];
    return comments.map((c) => c.textContent.trim());
  };

  const handlers = {
    GetPageHTMLContent: () => {
      return {
        content: extractRelevantContent(),
        url: getUrlAndTitle().url,
        title: getUrlAndTitle().title,
      };
    },

    GetSelectedText: () => {
      const selection = content.getSelection();
      return {
        selectedText: selection.toString(),
        hasSelection: !selection.isCollapsed,
        ...getUrlAndTitle(),
      };
    },

    GetPageTextContent: ({ trimWhiteSpace }) => {
      return {
        textContent: extractTextContent(trimWhiteSpace),
        ...getUrlAndTitle(),
      };
    },

    ClickElement: ({ selector }) => {
      const element = content.document.querySelector(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found.`);
      }
      element.click();
      return { result: `Clicked element with selector "${selector}".` };
    },

    FillForm: ({ selector, value }) => {
      const element = content.document.querySelector(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found.`);
      }
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return {
        result: `Filled element with selector "${selector}" with value "${value}".`,
      };
    },

    GetYoutubeTranscript: async () => {
      const transcript = await getYouTubeTranscript();
      return { transcript };
    },

    GetYoutubeDescription: async () => {
      const description = await getYoutubeDescription();
      return { description };
    },

    GetYoutubeComments: ({ count }) => {
      return { comments: getYoutubeComments(count) };
    },
  };

  addMessageListener("FindbarAI:Command", async function (msg) {
    const cmd = msg.data.command;
    const data = msg.data.data || {};
    try {
      const result = await handlers[cmd](data);
      sendAsyncMessage("FindbarAI:Result", { command: cmd, result });
    } catch (e) {
      sendAsyncMessage("FindbarAI:Result", { command: cmd, result: { error: e.message } });
    }
  });
}

let currentMessageManager = null;

const updateMessageManager = () => {
  if (gBrowser && gBrowser.selectedBrowser) {
    const mm = gBrowser.selectedBrowser.messageManager;
    if (mm !== currentMessageManager) {
      currentMessageManager = mm;
      if (!gBrowser.selectedBrowser._findbarAIInjected) {
        const scriptText = `(${frameScript})();`;
        mm.loadFrameScript(
          "data:application/javascript;charset=utf-8," + encodeURIComponent(scriptText),
          false
        );
        gBrowser.selectedBrowser._findbarAIInjected = true;
      }
    }
  }
};

const messageManagerAPI = {
  send(cmd, data = {}) {
    updateMessageManager();
    if (!currentMessageManager) {
      debugError("No message manager available.");
      return Promise.reject(new Error("No message manager available."));
    }

    return new Promise((resolve, reject) => {
      const listener = (msg) => {
        if (msg.data.command === cmd) {
          currentMessageManager.removeMessageListener("FindbarAI:Result", listener);
          if (msg.data.result && msg.data.result.error) {
            reject(new Error(msg.data.result.error));
          } else {
            resolve(msg.data.result);
          }
        }
      };
      currentMessageManager.addMessageListener("FindbarAI:Result", listener);
      currentMessageManager.sendAsyncMessage("FindbarAI:Command", { command: cmd, data });
    });
  },

  getUrlAndTitle() {
    return {
      url: gBrowser.currentURI.spec,
      title: gBrowser.selectedBrowser.contentTitle,
    };
  },

  async getHTMLContent() {
    try {
      return await this.send("GetPageHTMLContent");
    } catch (error) {
      debugError("Failed to get page HTML content:", error);
      return {};
    }
  },

  async getSelectedText() {
    try {
      const result = await this.send("GetSelectedText");
      if (!result || !result.hasSelection) {
        return this.getUrlAndTitle();
      }
      return result;
    } catch (error) {
      debugError("Failed to get selected text:", error);
      return this.getUrlAndTitle();
    }
  },

  async getPageTextContent(trimWhiteSpace = true) {
    try {
      return await this.send("GetPageTextContent", { trimWhiteSpace });
    } catch (error) {
      debugError("Failed to get page text content:", error);
      return this.getUrlAndTitle();
    }
  },

  async clickElement(selector) {
    try {
      return await this.send("ClickElement", { selector });
    } catch (error) {
      debugError(`Failed to click element with selector "${selector}":`, error);
      return { error: `Failed to click element with selector "${selector}".` };
    }
  },

  async fillForm(selector, value) {
    try {
      return await this.send("FillForm", { selector, value });
    } catch (error) {
      debugError(`Failed to fill form with selector "${selector}":`, error);
      return { error: `Failed to fill form with selector "${selector}".` };
    }
  },

  async getYoutubeTranscript() {
    try {
      return await this.send("GetYoutubeTranscript");
    } catch (error) {
      debugError("Failed to get youtube transcript:", error);
      return { error: `Failed to get youtube transcript: ${error.message}` };
    }
  },

  async getYoutubeDescription() {
    try {
      return await this.send("GetYoutubeDescription");
    } catch (error) {
      debugError("Failed to get youtube description:", error);
      return { error: `Failed to get youtube description: ${error.message}` };
    }
  },

  async getYoutubeComments(count) {
    try {
      return await this.send("GetYoutubeComments", { count });
    } catch (error) {
      debugError("Failed to get youtube comments:", error);
      return { error: `Failed to get youtube comments: ${error.message}` };
    }
  },
};

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

    const findbarSectionHtml = this._createCheckboxSectionHtml(
      "Findbar AI (ctrl + shift + F)",
      findbarSettings,
      true,
      "",
      positionSelectorHtml + backgroundStyleSelectorHtml
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
      false
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

    const aiBehaviorSectionHtml = this._createCheckboxSectionHtml(
      "AI Behavior",
      aiBehaviorSettings,
      true,
      aiBehaviorWarningHtml,
      maxToolCallsHtml
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
    const contextMenuSectionHtml = this._createCheckboxSectionHtml(
      "Context Menu",
      contextMenuSettings,
      false,
      "",
      contextMenuCommandsHtml
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

    const llmProvidersSectionHtml = `
      <section class="settings-section settings-accordion" data-expanded="false">
        <h4 class="accordion-header">LLM Providers</h4>
        <div class="setting-item accordion-content" class="">
          <label for="pref-llm-provider">Select Provider</label>
          <div id="llm-provider-selector-placeholder"></div>
        </div>
        ${llmProviderSettingsHtml}
      </section>`;

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
      false
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
            ${browserSettingsHtml}
            ${devSectionHtml}
          </div>
        </div>
      </div>
    `;
  },
};

// ╭─────────────────────────────────────────────────────────╮
// │                 TAB ID MANAGEMENT                       │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Manages unique, session-only IDs for tab objects.
 * This is necessary because no built-in tab property is consistently
 * available and unique for all tabs (e.g., background/unloaded tabs).
 */
const TabIdManager = new (class {
  #tabIdMap = new WeakMap();
  #idTabMap = new Map();
  #nextId = 1;

  _getOrCreateId(tab) {
    if (!this.#tabIdMap.has(tab)) {
      const id = this.#nextId++;
      this.#tabIdMap.set(tab, id);
      this.#idTabMap.set(id, tab);
    }
    return this.#tabIdMap.get(tab);
  }

  getTabById(id) {
    const numericId = Number(id);
    const tab = this.#idTabMap.get(numericId);
    // Ensure the tab still exists in the browser before returning it.
    if (tab && tab.ownerGlobal && !tab.ownerGlobal.closed && gBrowser.tabs.includes(tab)) {
      return tab;
    }
    // Clean up the map if the tab is gone.
    this.#idTabMap.delete(numericId);
    return null;
  }

  mapTab(tab) {
    if (!tab) return null;

    const id = this._getOrCreateId(tab);
    const splitGroup = tab.group?.hasAttribute("split-view-group") ? tab.group : null;
    const workspaceId = tab.getAttribute("zen-workspace-id");
    const workspace = workspaceId ? gZenWorkspaces.getWorkspaceFromId(workspaceId) : null;
    const activeWorkspaceId = gZenWorkspaces.activeWorkspace;
    const isEssential = tab.hasAttribute("zen-essential");
    const workspaceInfos = {
      workspaceId,
      workspaceName: workspace?.name || null,
      workspaceIcon: workspace?.icon || null,
    };

    return {
      id: String(id),
      title: tab.label,
      url: tab.linkedBrowser?.currentURI?.spec,
      isCurrent: tab === gBrowser.selectedTab,
      inCurrentWorkspace: workspaceId === activeWorkspaceId,
      pinned: tab.pinned,
      isGroup: gBrowser.isTabGroup(tab),
      isEssential,
      parentFolderId: tab.group && !splitGroup ? tab.group.id : null,
      parentFolderName: tab.group && !splitGroup ? tab.group.label : null,
      isSplitView: !!splitGroup,
      splitViewId: splitGroup ? splitGroup.id : null,
      ...(isEssential ? {} : workspaceInfos),
    };
  }
})();

// Helper function to create Zod string parameters
const createStringParameter = (description, isOptional = false) => {
  let schema = string().describe(description);
  return isOptional ? schema.optional() : schema;
};

// Helper function for array of strings parameter
const createStringArrayParameter = (description, isOptional = false) => {
  let schema = array(string()).describe(description);
  return isOptional ? schema.optional() : schema;
};

// Helper function to create tools with consistent structure
const createTool = (description, parameters, executeFn) => {
  return tool({
    description,
    inputSchema: object(parameters),
    execute: executeFn,
  });
};

// ╭─────────────────────────────────────────────────────────╮
// │                      HELPERS                            │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Retrieves tab objects based on their session IDs.
 * @param {string[]} tabIds - An array of session IDs for the tabs to retrieve.
 * @returns {Array<object>} An array of tab browser elements.
 */
function getTabsByIds(tabIds) {
  if (!Array.isArray(tabIds)) tabIds = [tabIds];
  return tabIds.map((id) => TabIdManager.getTabById(id)).filter(Boolean);
}

/**
 * Maps a tab element to a simplified object for AI consumption.
 * @param {object} tab - The tab browser element.
 * @returns {object|null} A simplified tab object, or null if the tab is invalid.
 */
function mapTabToObject(tab) {
  return TabIdManager.mapTab(tab);
}

// ╭─────────────────────────────────────────────────────────╮
// │                         SEARCH                          │
// ╰─────────────────────────────────────────────────────────╯
async function getSearchURL(engineName, searchTerm) {
  try {
    const engine = await Services.search.getEngineByName(engineName);
    if (!engine) {
      debugError(`No search engine found with name: ${engineName}`);
      return null;
    }
    const submission = engine.getSubmission(searchTerm.trim());
    if (!submission) {
      debugError(`No submission found for term: ${searchTerm} and engine: ${engineName}`);
      return null;
    }
    return submission.uri.spec;
  } catch (e) {
    debugError(`Error getting search URL for engine "${engineName}".`, e);
    return null;
  }
}

async function search(args) {
  const { searchTerm, engineName, where } = args;
  const defaultEngineName = Services.search.defaultEngine.name;
  const searchEngineName = engineName || defaultEngineName;
  if (!searchTerm) return { error: "Search tool requires a searchTerm." };

  const url = await getSearchURL(searchEngineName, searchTerm);
  if (url) {
    return await openLink({ link: url, where });
  } else {
    return {
      error: `Could not find search engine named '${searchEngineName}'.`,
    };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                          TABS                           │
// ╰─────────────────────────────────────────────────────────╯
async function openLink(args) {
  const { link, where = "new tab" } = args;
  if (!link) return { error: "openLink requires a link." };
  const whereNormalized = where?.toLowerCase()?.trim();
  try {
    switch (whereNormalized) {
      case "current tab":
        openTrustedLinkIn(link, "current");
        break;
      case "new tab":
        openTrustedLinkIn(link, "tab");
        break;
      case "new window":
        openTrustedLinkIn(link, "window");
        break;
      case "incognito":
      case "private":
        window.openTrustedLinkIn(link, "window", { private: true });
        break;
      case "glance":
        if (window.gZenGlanceManager) {
          const rect = gBrowser.selectedBrowser.getBoundingClientRect();
          window.gZenGlanceManager.openGlance({
            url: link,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: 10,
            height: 10,
          });
        } else {
          openTrustedLinkIn(link, "tab");
          return { result: `Glance not available. Opened in a new tab.` };
        }
        break;
      case "vsplit":
      case "hsplit":
        if (window.gZenViewSplitter) {
          const sep = whereNormalized === "vsplit" ? "vsep" : "hsep";
          const tab1 = gBrowser.selectedTab;
          await openTrustedLinkIn(link, "tab");
          const tab2 = gBrowser.selectedTab;
          gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
        } else return { error: "Split view is not available." };
        break;
      default:
        openTrustedLinkIn(link, "tab");
        return {
          result: `Unknown location "${where}". Opened in a new tab as fallback.`,
        };
    }
    return { result: `Successfully opened ${link} in ${where}.` };
  } catch (e) {
    debugError(`Failed to open link "${link}" in "${where}".`, e);
    return { error: `Failed to open link.` };
  }
}

async function newSplit(args) {
  const { links, type = "vertical" } = args;
  if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
  if (!links || !Array.isArray(links) || links.length < 2)
    return { error: "newSplit requires an array of at least two links." };

  try {
    const tabs = [];
    for (const link of links) {
      // openTrustedLinkIn seems to always select the new tab
      await openTrustedLinkIn(link, "tab");
      tabs.push(gBrowser.selectedTab);
    }

    let gridType;
    const lowerType = type.toLowerCase();
    if (lowerType === "grid") {
      gridType = "grid";
    } else if (lowerType === "horizontal") {
      gridType = "hsep";
    } else {
      // "vertical" or default
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return {
      result: `Successfully created split view with ${links.length} tabs.`,
    };
  } catch (e) {
    debugError("Failed to create split view.", e);
    return { error: "Failed to create split view." };
  }
}

/**
 * Retrieves all open tabs across all workspaces.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all tabs.
 */
async function getAllTabs() {
  try {
    const allTabs = gZenWorkspaces.allStoredTabs.map(mapTabToObject).filter(Boolean);
    return { tabs: allTabs };
  } catch (e) {
    debugError("Failed to get all tabs:", e);
    return { error: "Failed to retrieve tabs." };
  }
}

/**
 * Closes specified tabs.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to close.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function closeTabs(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0) return { error: "closeTabs requires an array of tabIds." };
  try {
    const tabsToClose = getTabsByIds(tabIds);
    if (tabsToClose.length === 0) return { error: "No matching tabs found to close." };

    gBrowser.removeTabs(tabsToClose);
    return { result: `Successfully closed ${tabsToClose.length} tab(s).` };
  } catch (e) {
    debugError("Failed to close tabs:", e);
    return { error: "An error occurred while closing tabs." };
  }
}

/**
 * Splits existing tabs into a view.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to split.
 * @param {string} [args.type="vertical"] - The split type: 'horizontal', 'vertical', or 'grid'. Defaults to 'vertical'.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function splitExistingTabs(args) {
  const { tabIds, type = "vertical" } = args;
  if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
  if (!tabIds || tabIds.length < 2)
    return { error: "splitExistingTabs requires at least two tabIds." };

  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length < 2) return { error: "Could not find at least two tabs to split." };

    let gridType;
    const lowerType = type.toLowerCase();
    if (lowerType === "grid") {
      gridType = "grid";
    } else if (lowerType === "horizontal") {
      gridType = "hsep";
    } else {
      // "vertical" or default
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return { result: `Successfully created split view with ${tabs.length} tabs.` };
  } catch (e) {
    debugError("Failed to split existing tabs.", e);
    return { error: "Failed to create split view." };
  }
}

/**
 * Searches tabs based on a query.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search term for tabs.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of tab results or an error.
 */
async function searchTabs(args) {
  const { query } = args;
  if (!query) return { error: "searchTabs requires a query." };
  const lowerCaseQuery = query.toLowerCase();

  try {
    const allTabs = gZenWorkspaces.allStoredTabs;
    const results = allTabs
      .filter((tab) => {
        const title = tab.label?.toLowerCase() || "";
        const url = tab.linkedBrowser?.currentURI?.spec?.toLowerCase() || "";
        return title.includes(lowerCaseQuery) || url.includes(lowerCaseQuery);
      })
      .map(mapTabToObject)
      .filter(Boolean);

    return { tabs: results };
  } catch (e) {
    debugError(`Error searching tabs for query "${query}":`, e);
    return { error: `Failed to search tabs.` };
  }
}

/**
 * Adds tabs to a folder (tab group).
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to add.
 * @param {string} args.folderId - The ID of the folder to add the tabs to.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addTabsToFolder(args) {
  const { tabIds, folderId } = args;
  if (!tabIds || !folderId) return { error: "addTabsToFolder requires tabIds and a folderId." };

  try {
    const tabs = getTabsByIds(tabIds);
    const folder = document.getElementById(folderId);

    if (!folder || !folder.isZenFolder) {
      return { error: `Folder with ID "${folderId}" not found or is not a valid folder.` };
    }
    if (tabs.length === 0) return { error: "No valid tabs found to add to the folder." };

    for (const tab of tabs) {
      if (!tab.pinned) gBrowser.pinTab(tab);
    }

    folder.addTabs(tabs);
    return { result: `Successfully added ${tabs.length} tab(s) to folder "${folder.label}".` };
  } catch (e) {
    debugError("Failed to add tabs to folder:", e);
    return { error: "Failed to add tabs to folder." };
  }
}

/**
 * Removes tabs from their current folder.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to remove from their folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function removeTabsFromFolder(args) {
  const { tabIds } = args;
  if (!tabIds) return { error: "removeTabsFromFolder requires tabIds." };

  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No valid tabs found." };

    let ungroupedCount = 0;
    tabs.forEach((tab) => {
      if (tab.group) {
        gBrowser.ungroupTab(tab);
        ungroupedCount++;
      }
    });
    return { result: `Successfully ungrouped ${ungroupedCount} tab(s).` };
  } catch (e) {
    debugError("Failed to remove tabs from folder:", e);
    return { error: "Failed to remove tabs from folder." };
  }
}

/**
 * Creates a new, empty tab folder.
 * @param {object} args - The arguments object.
 * @param {string} args.name - The name for the new folder.
 * @returns {Promise<object>} A promise that resolves with the new folder's information or an error.
 */
async function createTabFolder(args) {
  const { name } = args;
  if (!name) return { error: "createTabFolder requires a name." };
  try {
    const folder = gZenFolders.createFolder([], { label: name, renameFolder: false });
    return {
      result: `Successfully created folder "${folder.label}".`,
      folder: {
        id: folder.id,
        name: folder.label,
      },
    };
  } catch (e) {
    debugError("Failed to create tab folder:", e);
    return { error: "Failed to create tab folder." };
  }
}

/**
 * Reorders a tab to a new index.
 * @param {object} args - The arguments object.
 * @param {string} args.tabId - The session ID of the tab to reorder.
 * @param {number} args.newIndex - The new index for the tab.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function reorderTab(args) {
  const { tabId, newIndex } = args;
  if (!tabId || typeof newIndex !== "number") {
    return { error: "reorderTab requires a tabId and a newIndex." };
  }
  try {
    const tab = TabIdManager.getTabById(tabId);
    if (!tab) return { error: `Tab with id ${tabId} not found.` };
    gBrowser.moveTabTo(tab, { tabIndex: newIndex });
    return { result: `Successfully moved tab to index ${newIndex}.` };
  } catch (e) {
    debugError("Failed to reorder tab:", e);
    return { error: "Failed to reorder tab." };
  }
}

/**
 * Adds one or more tabs to the essentials.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to add to essentials.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addTabsToEssentials(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0)
    return { error: "addTabsToEssentials requires at least one tabId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No matching tabs found." };
    if (window.gZenPinnedTabManager) {
      gZenPinnedTabManager.addToEssentials(tabs);
      return { result: `Successfully added ${tabs.length} tab(s) to essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    debugError("Failed to add tabs to essentials:", e);
    return { error: "An error occurred while adding tabs to essentials." };
  }
}

/**
 * Removes one or more tabs from the essentials.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to remove from essentials.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function removeTabsFromEssentials(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0)
    return { error: "removeTabsFromEssentials requires at least one tabId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No matching tabs found." };
    if (window.gZenPinnedTabManager) {
      tabs.forEach((tab) => gZenPinnedTabManager.removeFromEssentials(tab));
      return { result: `Successfully removed ${tabs.length} tab(s) from essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    debugError("Failed to remove tabs from essentials:", e);
    return { error: "An error occurred while removing tabs from essentials." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                        BOOKMARKS                        │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Searches bookmarks based on a query.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search term for bookmarks.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of bookmark results or an error.
 */
async function searchBookmarks(args) {
  const { query } = args;
  if (!query) return { error: "searchBookmarks requires a query." };

  try {
    const searchParams = { query };
    const bookmarks = await PlacesUtils.bookmarks.search(searchParams);

    // Map to a simpler format to save tokens for the AI model
    const results = bookmarks.map((bookmark) => ({
      id: bookmark.guid,
      title: bookmark.title,
      url: bookmark?.url?.href,
      parentID: bookmark.parentGuid,
    }));

    debugLog(`Found ${results.length} bookmarks for query "${query}":`, results);
    return { bookmarks: results };
  } catch (e) {
    debugError(`Error searching bookmarks for query "${query}":`, e);
    return { error: `Failed to search bookmarks.` };
  }
}

/**
 * Reads all bookmarks.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all bookmark results or an error.
 */

async function getAllBookmarks() {
  try {
    const bookmarks = await PlacesUtils.bookmarks.search({});

    const results = bookmarks.map((bookmark) => ({
      id: bookmark.guid,
      title: bookmark.title,
      url: bookmark?.url?.href,
      parentID: bookmark.parentGuid,
    }));

    debugLog(`Read ${results.length} total bookmarks.`);
    return { bookmarks: results };
  } catch (e) {
    debugError(`Error reading all bookmarks:`, e);
    return { error: `Failed to read all bookmarks.` };
  }
}

/**
 * Creates a new bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.url - The URL to bookmark.
 * @param {string} [args.title] - The title for the bookmark. If not provided, the URL is used.
 * @param {string} [args.parentID] - The GUID of the parent folder. Defaults to the "Other Bookmarks" folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function createBookmark(args) {
  const { url, title, parentID } = args;
  if (!url) return { error: "createBookmark requires a URL." };

  try {
    const bookmarkInfo = {
      parentGuid: parentID || PlacesUtils.bookmarks.toolbarGuid,
      url: new URL(url),
      title: title || url,
    };

    const bm = await PlacesUtils.bookmarks.insert(bookmarkInfo);

    debugLog(`Bookmark created successfully:`, JSON.stringify(bm));
    return { result: `Successfully bookmarked "${bm.title}".` };
  } catch (e) {
    debugError(`Error creating bookmark for URL "${url}":`, e);
    return { error: `Failed to create bookmark.` };
  }
}

/**
 * Creates a new bookmark folder.
 * @param {object} args - The arguments object.
 * @param {string} args.title - The title for the new folder.
 * @param {string} [args.parentID] - The GUID of the parent folder. Defaults to the "Other Bookmarks" folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addBookmarkFolder(args) {
  const { title, parentID } = args;
  if (!title) return { error: "addBookmarkFolder requires a title." };

  try {
    const folderInfo = {
      parentGuid: parentID || PlacesUtils.bookmarks.toolbarGuid,
      type: PlacesUtils.bookmarks.TYPE_FOLDER,
      title: title,
    };

    const folder = await PlacesUtils.bookmarks.insert(folderInfo);

    debugLog(`Bookmark folder created successfully:`, JSON.stringify(folderInfo));
    return { result: `Successfully created folder "${folder.title}".` };
  } catch (e) {
    debugError(`Error creating bookmark folder "${title}":`, e);
    return { error: `Failed to create folder.` };
  }
}

/**
 * Updates an existing bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The GUID of the bookmark to update.
 * @param {string} [args.url] - The new URL for the bookmark.
 * @param {string} [args.parentID] - parent id
 *
 * @param {string} [args.title] - The new title for the bookmark.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function updateBookmark(args) {
  const { id, url, title, parentID } = args;
  if (!id) return { error: "updateBookmark requires a bookmark id (guid)." };
  if (!url && !title && !parentID)
    return {
      error: "updateBookmark requires either a new url, title, or parentID.",
    };

  try {
    const oldBookmark = await PlacesUtils.bookmarks.fetch(id);
    if (!oldBookmark) {
      return { error: `No bookmark found with id "${id}".` };
    }

    const bm = await PlacesUtils.bookmarks.update({
      guid: id,
      url: url ? new URL(url) : oldBookmark.url,
      title: title || oldBookmark.title,
      parentGuid: parentID || oldBookmark.parentGuid,
    });

    debugLog(`Bookmark updated successfully:`, JSON.stringify(bm));
    return { result: `Successfully updated bookmark to "${bm.title}".` };
  } catch (e) {
    debugError(`Error updating bookmark with id "${id}":`, e);
    return { error: `Failed to update bookmark.` };
  }
}

/**
 * Deletes a bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The GUID of the bookmark to delete.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */

async function deleteBookmark(args) {
  const { id } = args;
  if (!id) return { error: "deleteBookmark requires a bookmark id (guid)." };
  try {
    await PlacesUtils.bookmarks.remove(id);
    debugLog(`Bookmark with id "${id}" deleted successfully.`);
    return { result: `Successfully deleted bookmark.` };
  } catch (e) {
    debugError(`Error deleting bookmark with id "${id}":`, e);
    return { error: `Failed to delete bookmark.` };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                        WORKSPACES                       │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Retrieves all workspaces.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all workspaces.
 */
async function getAllWorkspaces() {
  try {
    const { workspaces } = await gZenWorkspaces._workspaces();
    const activeWorkspaceId = gZenWorkspaces.activeWorkspace;
    const result = workspaces.map((ws) => ({
      id: ws.uuid,
      name: ws.name,
      icon: ws.icon,
      position: ws.position,
      isActive: ws.uuid === activeWorkspaceId,
    }));
    return { workspaces: result };
  } catch (e) {
    debugError("Failed to get all workspaces:", e);
    return { error: "Failed to retrieve workspaces." };
  }
}

/**
 * Creates a new workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.name - The name for the new workspace.
 * @param {string} [args.icon] - The icon (emoji or URL) for the new workspace.
 * @returns {Promise<object>} A promise that resolves with the new workspace information.
 */
async function createWorkspace(args) {
  const { name, icon } = args;
  if (!name) return { error: "createWorkspace requires a name." };
  try {
    const ws = await gZenWorkspaces.createAndSaveWorkspace(name, icon, false);
    return {
      result: `Successfully created workspace "${name}".`,
      workspace: { id: ws.uuid, name: ws.name, icon: ws.icon },
    };
  } catch (e) {
    debugError("Failed to create workspace:", e);
    return { error: "Failed to create workspace." };
  }
}

/**
 * Updates an existing workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to update.
 * @param {string} [args.name] - The new name for the workspace.
 * @param {string} [args.icon] - The new icon for the workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function updateWorkspace(args) {
  const { id, name, icon } = args;
  if (!id) return { error: "updateWorkspace requires a workspace id." };
  if (!name && !icon) return { error: "updateWorkspace requires a new name or icon." };
  try {
    const workspace = gZenWorkspaces.getWorkspaceFromId(id);
    if (!workspace) return { error: `Workspace with id ${id} not found.` };
    if (name) workspace.name = name;
    if (icon) workspace.icon = icon;
    await gZenWorkspaces.saveWorkspace(workspace);
    return { result: `Successfully updated workspace.` };
  } catch (e) {
    debugError("Failed to update workspace:", e);
    return { error: "Failed to update workspace." };
  }
}

/**
 * Deletes a workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function deleteWorkspace(args) {
  const { id } = args;
  if (!id) return { error: "deleteWorkspace requires a workspace id." };
  try {
    await gZenWorkspaces.removeWorkspace(id);
    return { result: "Successfully deleted workspace." };
  } catch (e) {
    debugError("Failed to delete workspace:", e);
    return { error: "Failed to delete workspace." };
  }
}

/**
 * Moves tabs to a specified workspace.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to move.
 * @param {string} args.workspaceId - The ID of the target workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function moveTabsToWorkspace(args) {
  const { tabIds, workspaceId } = args;
  if (!tabIds || !workspaceId)
    return { error: "moveTabsToWorkspace requires tabIds and a workspaceId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No valid tabs found to move." };
    gZenWorkspaces.moveTabsToWorkspace(tabs, workspaceId);
    return { result: `Successfully moved ${tabs.length} tab(s) to workspace.` };
  } catch (e) {
    debugError("Failed to move tabs to workspace:", e);
    return { error: "Failed to move tabs to workspace." };
  }
}

/**
 * Reorders a workspace to a new position.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to reorder.
 * @param {number} args.newPosition - The new zero-based index for the workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function reorderWorkspace(args) {
  const { id, newPosition } = args;
  if (!id || typeof newPosition !== "number") {
    return { error: "reorderWorkspace requires a workspace id and a newPosition." };
  }
  try {
    await gZenWorkspaces.reorderWorkspace(id, newPosition);
    return { result: "Successfully reordered workspace." };
  } catch (e) {
    debugError("Failed to reorder workspace:", e);
    return { error: "Failed to reorder workspace." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                         ELEMENTS                        │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Clicks an element on the page.
 * @param {object} args - The arguments object.
 * @param {string} args.selector - The CSS selector of the element to click.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function clickElement(args) {
  const { selector } = args;
  if (!selector) return { error: "clickElement requires a selector." };
  return messageManagerAPI.clickElement(selector);
}

/**
 * Fills a form input on the page.
 * @param {object} args - The arguments object.
 * @param {string} args.selector - The CSS selector of the input element to fill.
 * @param {string} args.value - The value to fill the input with.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function fillForm(args) {
  const { selector, value } = args;
  if (!selector) return { error: "fillForm requires a selector." };
  if (value === undefined) return { error: "fillForm requires a value." };
  return messageManagerAPI.fillForm(selector, value);
}

// ╭─────────────────────────────────────────────────────────╮
// │                        UI FEEDBACK                      │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Shows a temporary toast message to the user.
 * @param {object} args - The arguments object.
 * @param {string} args.title - The main title of the toast message.
 * @param {string} [args.description] - Optional secondary text for the toast.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function showToast(args) {
  const { title, description } = args;
  if (!title) return { error: "showToast requires a title." };

  try {
    if (window.ucAPI && typeof window.ucAPI.showToast === "function") {
      // ucAPI.showToast takes an array [title, description] and a preset.
      // Preset 0 means no button will be shown.
      // https://github.com/CosmoCreeper/Sine/blob/main/engine/utils/uc_api.js#L102
      window.ucAPI.showToast([title, description], 0);
      return { result: "Toast displayed successfully." };
    } else {
      debugError("ucAPI.showToast is not available.");
      return { error: "Toast functionality is not available." };
    }
  } catch (e) {
    debugError("Failed to show toast:", e);
    return { error: "An error occurred while displaying the toast." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                         YOUTUBE                         │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Wrapper for messageManagerAPI.getYoutubeComments to handle arguments.
 * @param {object} args - The arguments object.
 * @param {number} [args.count] - The number of comments to retrieve.
 * @returns {Promise<object>} A promise that resolves with the comments.
 */
async function getYoutubeComments(args) {
  return messageManagerAPI.getYoutubeComments(args.count);
}

const toolNameMapping = {
  search: "Searching the web",
  openLink: "Opening a link",
  newSplit: "Creating a split view",
  splitExistingTabs: "Splitting existing tabs",
  getAllTabs: "Reading tabs",
  searchTabs: "Searching tabs",
  closeTabs: "Closing tabs",
  reorderTab: "Reordering a tab",
  addTabsToFolder: "Adding tabs to a folder",
  removeTabsFromFolder: "Removing tabs from a folder",
  createTabFolder: "Creating a tab folder",
  addTabsToEssentials: "Adding tabs to Essentials",
  removeTabsFromEssentials: "Removing tabs from Essentials",
  getPageTextContent: "Reading page content",
  getHTMLContent: "Reading page source code",
  clickElement: "Clicking an element",
  fillForm: "Filling a form",
  getYoutubeTranscript: "Getting YouTube transcript",
  getYoutubeDescription: "Getting YouTube description",
  getYoutubeComments: "Getting YouTube comments",
  searchBookmarks: "Searching bookmarks",
  getAllBookmarks: "Reading bookmarks",
  createBookmark: "Creating a bookmark",
  addBookmarkFolder: "Creating a bookmark folder",
  updateBookmark: "Updating a bookmark",
  deleteBookmark: "Deleting a bookmark",
  getAllWorkspaces: "Reading workspaces",
  createWorkspace: "Creating a workspace",
  updateWorkspace: "Updating a workspace",
  deleteWorkspace: "Deleting a workspace",
  moveTabsToWorkspace: "Moving tabs to a workspace",
  reorderWorkspace: "Reordering a workspace",
  showToast: "Showing a notification",
};

const tabsInstructions = `If you open tab in glace it will create new small popup window to show the tab, vsplit and hsplit means it will open new tab in vertical and horizontal split with current tab respectively.`;
const toolGroups = {
  search: {
    moreInstructions: async () => {
      const searchEngines = await Services.search.getVisibleEngines();
      const engineNames = searchEngines.map((e) => e.name).join(", ");
      const defaultEngineName = Services.search.defaultEngine.name;
      return (
        `For the search tool, available engines are: ${engineNames}. The default is '${defaultEngineName}'.` +
        "\n" +
        tabsInstructions
      );
    },
    tools: {
      search: createTool(
        "Performs a web search using a specified search engine and opens the results.",
        {
          searchTerm: createStringParameter("The term to search for."),
          engineName: createStringParameter("The name of the search engine to use.", true),
          where: createStringParameter(
            "Where to open results. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Default: 'new tab'.",
            true
          ),
        },
        search
      ),
    },
    example: async () => {
      return `#### Searching and Spliting: 
-   **User Prompt:** "search cat in google and dog in youtube open them in vertical split"
-   **Your first Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "cat", "engineName": "google", where: "new tab"}}}\`
-   **Your second Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "dog", "engineName": "youtube", where: "vsplit"}}}\`
Note: Only second search is open in split (vertial by default), this will make it split with first search.
`;
    },
  },
  navigation: {
    moreInstructions: tabsInstructions + "While opening tab make sure it has valid URL.",
    tools: {
      openLink: createTool(
        "Opens a given URL in a specified location. Can also create a split view with the current tab.",
        {
          link: createStringParameter("The URL to open."),
          where: createStringParameter(
            "Where to open the link. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Default: 'new tab'.",
            true
          ),
        },
        openLink
      ),
      newSplit: createTool(
        "Creates a split view by opening multiple new URLs in new tabs, then arranging them side-by-side.",
        {
          links: createStringArrayParameter("An array of URLs for the new tabs."),
          type: createStringParameter(
            "The split type: 'vertical', 'horizontal', or 'grid'. Defaults to 'vertical'.",
            true
          ),
        },
        newSplit
      ),
      splitExistingTabs: createTool(
        "Creates a split view from existing open tabs.",
        {
          tabIds: createStringArrayParameter("An array of tab session IDs to split."),
          type: createStringParameter(
            "The split type: 'vertical', 'horizontal', or 'grid'. Defaults to 'vertical'.",
            true
          ),
        },
        splitExistingTabs
      ),
    },
    example: async () => `#### Opening a Single Link:
-   **User Prompt:** "open github"
-   **Your Tool Call:** \`{"functionCall": {"name": "openLink", "args": {"link": "https://github.com", "where": "new tab"}}}\`

#### Creating a Split View with New Pages:
-   **User Prompt:** "show me youtube and twitch side by side"
-   **Your Tool Call:** \`{"functionCall": {"name": "newSplit", "args": {"links": ["https://youtube.com", "https://twitch.tv"], "type": "vertical"}}}\`

#### Splitting Existing Tabs:
-   **User Prompt:** "Make all my open youtube tabs in grid"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call (after getting tab IDs):** \`{"functionCall": {"name": "splitExistingTabs", "args": {"tabIds": ["x", "y", ...]}, "type": "grid"}}\``,
  },
  tabs: {
    moreInstructions: `Zen browser has advanced tab management features they are:
- Workspaces: Different workspace can contain different tabs (pinned and unpinned).
- Essential: Essential tabs are not workspace specific, they are most important tabs and they are always shown dispite of current workspace.
- Tab folders: Similar tabs can be made in folders to organize it in better way (it is also called tab group).
- Split tabs: Zen allows to view multiple tabs at same time by splitting.

The tool getAllTabs is super super useful, tool you can use it in multiple case for tab/workspace management. Don't ask conformative questions to user like when user's input is clear. Like when user asks you to close tabs don't ask them "Do you really want to close those tabs ... ".
More importantly, please don't use IDs of folder/tabs/workspace while talking to user, refere them by name not id. User might not know the ids of tabs.
**Never** mention tabId or groupId with the user. Don't ask for Id if you need Id to filfill user's request you have to read it yourself.
`,
    tools: {
      getAllTabs: createTool(
        "Retrieves all open tabs. Also provides more information about tabs like id, title, url, isCurrent, inCurrentWorkspace, workspace, workspaceName, workspaceIcon, pinned, isGroup, isEssential, parentFolderId, parentFolderName, isSplitView, splitViewId.",
        {},
        getAllTabs
      ),
      searchTabs: createTool(
        "Searches open tabs by title or URL. Similar to `getAllTabs` this will also provide more information about tab.",
        { query: createStringParameter("The search term for tabs.") },
        searchTabs
      ),
      closeTabs: createTool(
        "Closes one or more tabs.",
        { tabIds: createStringArrayParameter("An array of tab session IDs to close.") },
        closeTabs
      ),
      reorderTab: createTool(
        "Reorders a tab to a new index.",
        {
          tabId: createStringParameter("The session ID of the tab to reorder."),
          newIndex: number().describe("The new index for the tab."),
        },
        reorderTab
      ),
      addTabsToFolder: createTool(
        "Adds one or more tabs to a folder.",
        {
          tabIds: createStringArrayParameter("The session IDs of the tabs to add."),
          folderId: createStringParameter("The ID of the folder to add the tabs to."),
        },
        addTabsToFolder
      ),
      removeTabsFromFolder: createTool(
        "Removes one or more tabs from their folder.",
        {
          tabIds: createStringArrayParameter(
            "The session IDs of the tabs to remove from their folder."
          ),
        },
        removeTabsFromFolder
      ),
      createTabFolder: createTool(
        "Creates a new, empty tab folder.",
        {
          name: createStringParameter("The name for the new folder."),
        },
        createTabFolder
      ),
      addTabsToEssentials: createTool(
        "Adds one or more tabs to the essentials.",
        { tabIds: createStringArrayParameter("An array of session IDs to add to essentials.") },
        addTabsToEssentials
      ),
      removeTabsFromEssentials: createTool(
        "Removes one or more tabs from the essentials.",
        {
          tabIds: createStringArrayParameter("An array of session IDs to remove from essentials."),
        },
        removeTabsFromEssentials
      ),
    },
    example: async () => `#### Finding and Closing Tabs:
-   **User Prompt:** "close all youtube tabs"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchTabs", "args": {"query": "youtube.com"}}}\`
-   **Your Second Tool Call (after receiving tab IDs):** \`{"functionCall": {"name": "closeTabs", "args": {"tabIds": ["1", "2"]}}}\`

#### Creating a Folder and Adding Tabs:
-   **User Prompt:** "create a new folder called 'Social Media' and add all my facebook tab to it"
-   **Your First Tool Call (to get tab ID):** \`{"functionCall": {"name": "searchTabs", "args": {"query": "facebook.com"}}}\`
-   **Your Second Tool Call (to create folder):** \`{"functionCall": {"name": "createTabFolder", "args": {"name": "Social Media"}}}\`
-   **Your Third Tool Call (after getting IDs):** \`{"functionCall": {"name": "addTabsToFolder", "args": {"tabIds": ["3", ...], "folderId": "folder-123"}}}\`

#### Making a Tab Essential:
-   **User Prompt:** "make my current tab essential"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call (after finding the current tab ID):** \`{"functionCall": {"name": "addTabsToEssentials", "args": {"tabIds": ["5"]}}}\``,
  },
  pageInteraction: {
    tools: {
      getPageTextContent: createTool(
        "Retrieves the text content of the current web page to answer questions. Only use if the initial context is insufficient to answer user's question or fulfill user's command.",
        {},
        messageManagerAPI.getPageTextContent.bind(messageManagerAPI)
      ),
      getHTMLContent: createTool(
        "Retrieves the full HTML source of the current web page for detailed analysis. Use this tool very rarely, only when text content is insufficient.",
        {},
        messageManagerAPI.getHTMLContent.bind(messageManagerAPI)
      ),
      clickElement: createTool(
        "Clicks an element on the page.",
        {
          selector: createStringParameter("The CSS selector of the element to click."),
        },
        clickElement
      ),
      fillForm: createTool(
        "Fills a form input on the page.",
        {
          selector: createStringParameter("The CSS selector of the input element to fill."),
          value: createStringParameter("The value to fill the input with."),
        },
        fillForm
      ),
    },
    example: async () => `#### Reading the Current Page for Context
-   **User Prompt:** "summarize this page for me"
-   **Your Tool Call:** \`{"functionCall": {"name": "getPageTextContent", "args": {}}}\`
-   And you summarize the page as per user's requirements.

#### Finding and Clicking a Link on the Current Page
-   **User Prompt:** "click on the contact link"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call (after receiving HTML and finding the link):** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#contact-link"}}}\`

#### Filling a form:
-   **User Prompt:** "Fill the name with John and submit"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "fillForm", "args": {"selector": "#name", "value": "John"}}}\`
-   **Your Third Tool Call:** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#submit-button"}}}\`
Note: you must run tool getHTMLContent before clicking button or filling form to make sure element exists.
`,
  },
  youtube: {
    tools: {
      getYoutubeTranscript: createTool(
        "Retrieves the transcript of the current YouTube video. Only use if the current page is a YouTube video.",
        {},
        messageManagerAPI.getYoutubeTranscript.bind(messageManagerAPI)
      ),
      getYoutubeDescription: createTool(
        "Retrieves the description of the current YouTube video. Only use if the current page is a YouTube video.",
        {},
        messageManagerAPI.getYoutubeDescription.bind(messageManagerAPI)
      ),
      getYoutubeComments: createTool(
        "Retrieves top-level comments from the current YouTube video. Only use if the current page is a YouTube video.",
        {
          count: number()
            .optional()
            .describe("The maximum number of comments to retrieve. Defaults to 10."),
        },
        getYoutubeComments
      ),
    },
    example: async () => `#### Getting YouTube Video Details:
-   **User Prompt:** "Summarize this Youtube Video in 5 bullet points"
-   **Your Tool Call:** \`{"functionCall": {"name": "getYoutubeTranscript"}}\`
-   And you summarize the video as per user's requirements.

#### Reading Youtube Comments:
-   **User Prompt:** "What are the user's feedback on this video"
-   **Your Tool Call:** \`{"functionCall": {"name": "getYoutubeComments", count: 20}}\`
-   And Based on comments you tell user about the user's feedback on video.
`,
  },
  bookmarks: {
    tools: {
      searchBookmarks: createTool(
        "Searches bookmarks based on a query.",
        {
          query: createStringParameter("The search term for bookmarks."),
        },
        searchBookmarks
      ),
      getAllBookmarks: createTool("Retrieves all bookmarks.", {}, getAllBookmarks),
      createBookmark: createTool(
        "Creates a new bookmark.",
        {
          url: createStringParameter("The URL to bookmark."),
          title: createStringParameter("The title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        createBookmark
      ),
      addBookmarkFolder: createTool(
        "Creates a new bookmark folder.",
        {
          title: createStringParameter("The title for the new folder."),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        addBookmarkFolder
      ),
      updateBookmark: createTool(
        "Updates an existing bookmark.",
        {
          id: createStringParameter("The GUID of the bookmark to update."),
          url: createStringParameter("The new URL for the bookmark.", true),
          title: createStringParameter("The new title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        updateBookmark
      ),
      deleteBookmark: createTool(
        "Deletes a bookmark.",
        {
          id: createStringParameter("The GUID of the bookmark to delete."),
        },
        deleteBookmark
      ),
    },
    example: async () => `#### Finding and Editing a bookmark by folder name:
-   **User Prompt:** "Move bookmark titled 'Example' to folder 'MyFolder'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "Example"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "MyFolder"}}}\`
-   **Your Third Tool Call (after receiving the bookmark and folder ids):** \`{"functionCall": {"name": "updateBookmark", "args": {"id": "xxxxxxxxxxxx", "parentID": "yyyyyyyyyyyy"}}}\`
Note that first and second tool clls can be made in parallel, but the third tool call needs output from the first and second tool calls so it must be made after first and second.`,
  },
  workspaces: {
    moreInstructions: `Zen browser has advanced tab management features and one of them is workspace.
Different workspace can contain different tabs (pinned and unpinned). A workspace has it's own icon (most likely a emoji sometimes even URL), name and it has tabs inside workspace. While creating new workspace if user don't specify icon use most logical emoji you could find but don't use text make sure to use emoji.
If tab is essential which means does not belong to any specific workspace.

**Never** mention worksapceId with the user. Don't ask for Id if you need Id to filfill user's request you have to read it yourself.
`,
    tools: {
      getAllWorkspaces: createTool(
        "Retrieves all workspaces with id, name, icon, position and isActive.",
        {},
        getAllWorkspaces
      ),
      createWorkspace: createTool(
        "Creates a new workspace.",
        {
          name: createStringParameter("The name for the new workspace."),
          icon: createStringParameter("The icon (emoji or URL) for the new workspace.", true),
        },
        createWorkspace
      ),
      updateWorkspace: createTool(
        "Updates an existing workspace (name and icon).",
        {
          id: createStringParameter("The ID of the workspace to update."),
          name: createStringParameter("The new name for the workspace.", true),
          icon: createStringParameter("The new icon for the workspace.", true),
        },
        updateWorkspace
      ),
      deleteWorkspace: createTool(
        "Deletes a workspace.",
        { id: createStringParameter("The ID of the workspace to delete.") },
        deleteWorkspace
      ),
      moveTabsToWorkspace: createTool(
        "Moves tabs to a specified workspace.",
        {
          tabIds: createStringArrayParameter("The session IDs of the tabs to move."),
          workspaceId: createStringParameter("The ID of the target workspace."),
        },
        moveTabsToWorkspace
      ),
      reorderWorkspace: createTool(
        "Reorders a workspace to a new position.",
        {
          id: createStringParameter("The ID of the workspace to reorder."),
          newPosition: number().describe("The new zero-based index for the workspace."),
        },
        reorderWorkspace
      ),
    },
    // example: async () =>
  },
  uiFeedback: {
    tools: {
      showToast: createTool(
        "Shows a temporary toast message to the user.",
        {
          title: createStringParameter("The main title of the toast message."),
          description: createStringParameter("Optional secondary text for the toast.", true),
        },
        showToast
      ),
    },
    example: async () => `#### Showing a Toast Notification:
-   **User Prompt:** "let me know when the download is complete"
-   **Your Tool Call (after a long-running task):** \`{"functionCall": {"name": "showToast", "args": {"title": "Download Complete", "description": "The file has been saved to your downloads folder."}}}\``,
  },
  misc: {
    example: async (activeGroups) => {
      let example = "";
      if (activeGroups.has("workspaces") && activeGroups.has("tabs")) {
        example += `#### Creating and Managing a Workspace:
-   **User Prompt:** "make a new workspace called 'Research', then move all tabs related to animals in that workspace."
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "createWorkspace", "args": {"name": "Research"}}}\`
-   **Your Third Tool Call (after getting the new workspace ID and reading all tabs):** \`{"functionCall": {"name": "moveTabsToWorkspace", "args": {"tabIds": ["x", "y", ...], "workspaceId": "e1f2a3b4-c5d6..."}}}\`

#### Advanced tabs management (using tools related to folder and workspace to manage tabs)
-   **User Prompt:** "Manage my tabs"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call:**(based on all tabs) \`{"functionCall": {"name": "createTabFolder", "args": {"name": "..."}}}\`
-   **Your Third Tool Call (based on all tabs):** \`{"functionCall": {"name": "addTabsToFolder", "args": {"tabIds": ["x", "y", ...] }}}\`
-   **Your Fourth Tool Call (based on all tabs):** \`{"functionCall": {"name": "moveTabsToWorkspace", "args": {"tabIds": ["x", "y", ...], "workspaceId": "e1f2a3b4-c5d6..."}}}\`
-   Go on keep making tool calls until tabs are managed (note here you should not ask any question to user for conformation).

`;
      }
      return example;
    },
  },
};

const getTools = (groups, { shouldToolBeCalled, afterToolCall } = {}) => {
  const selectedTools = (() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      // get all tools from all groups except 'misc'
      return Object.entries(toolGroups).reduce((acc, [name, group]) => {
        if (name !== "misc" && group.tools) {
          return { ...acc, ...group.tools };
        }
        return acc;
      }, {});
    }
    return groups.reduce((acc, groupName) => {
      if (toolGroups[groupName] && toolGroups[groupName].tools) {
        return { ...acc, ...toolGroups[groupName].tools };
      }
      return acc;
    }, {});
  })();

  if (!shouldToolBeCalled && !afterToolCall) {
    return selectedTools;
  }

  const wrappedTools = {};
  for (const toolName in selectedTools) {
    const originalTool = selectedTools[toolName];
    const newTool = { ...originalTool };

    const originalExecute = originalTool.execute;
    newTool.execute = async (args) => {
      if (shouldToolBeCalled && !(await shouldToolBeCalled(toolName))) {
        debugLog(`Tool execution for '${toolName}' was denied by shouldToolBeCalled.`);
        return { error: `Tool execution for '${toolName}' was denied by user.` };
      }
      const result = await originalExecute(args);
      if (afterToolCall) afterToolCall(toolName, result);
      return result;
    };
    wrappedTools[toolName] = newTool;
  }

  return wrappedTools;
};

const getToolSystemPrompt = async (groups, includeExamples = true) => {
  try {
    const activeGroupNames =
      groups && Array.isArray(groups) && groups.length > 0
        ? groups
        : Object.keys(toolGroups).filter((g) => g !== "misc");
    const activeGroups = new Set(activeGroupNames);

    let availableTools = [];
    let toolExamples = [];

    for (const groupName of activeGroupNames) {
      const group = toolGroups[groupName];
      if (group) {
        if (group.tools) {
          for (const toolName in group.tools) {
            const tool = group.tools[toolName];
            const params = Object.keys(tool.inputSchema.shape).join(", ");
            availableTools.push(`- \`${toolName}(${params})\`: ${tool.description}`);
          }
        }
        if (group.moreInstructions) {
          const instructions =
            typeof group.moreInstructions === "function"
              ? await group.moreInstructions()
              : group.moreInstructions;
          availableTools.push(instructions);
        }
        if (includeExamples && group.example) {
          toolExamples.push(await group.example(activeGroups));
        }
      }
    }

    if (includeExamples && toolGroups.misc && toolGroups.misc.example) {
      const miscExample = await toolGroups.misc.example(activeGroups);
      if (miscExample) toolExamples.push(miscExample);
    }

    let systemPrompt = `
## Available Tools:
${availableTools.join("\n")}
`;

    if (includeExamples && toolExamples.length > 0) {
      systemPrompt += `
## Tool Call Examples:
These are just examples for you on how you can use tools calls, each example gives you some concept, the concept is not specific to single tool.

${toolExamples.join("\n\n")}
`;
    }

    return systemPrompt;
  } catch (error) {
    debugError("Error in getToolSystemPrompt:", error);
    return "";
  }
};

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
const browseBotFindbar = {
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

// Base object with shared logic for all providers
const providerPrototype = {
  get apiKey() {
    return PREFS.getPref(this.apiPref);
  },
  set apiKey(v) {
    if (typeof v === "string" && this.apiPref) PREFS.setPref(this.apiPref, v);
  },
  get model() {
    return PREFS.getPref(this.modelPref);
  },
  set model(v) {
    if (this.AVAILABLE_MODELS.includes(v)) PREFS.setPref(this.modelPref, v);
  },
  getModel() {
    return this.create({ apiKey: this.apiKey })(this.model);
  },
};

const mistral = Object.assign(Object.create(providerPrototype), {
  name: "mistral",
  label: "Mistral AI",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=https%3A%2F%2Fmistral.ai%2F",
  apiKeyUrl: "https://console.mistral.ai/api-keys/",
  AVAILABLE_MODELS: [
    "pixtral-large-latest",
    "mistral-large-latest",
    "mistral-medium-latest",
    "mistral-medium-2505",
    "mistral-small-latest",
    "magistral-small-2506",
    "magistral-medium-2506",
    "ministral-3b-latest",
    "ministral-8b-latest",
    "pixtral-12b-2409",
    "open-mistral-7b",
    "open-mixtral-8x7b",
    "open-mixtral-8x22b",
  ],
  AVAILABLE_MODELS_LABELS: {
    "pixtral-large-latest": "Pixtral Large (Latest)",
    "mistral-large-latest": "Mistral Large (Latest)",
    "mistral-medium-latest": "Mistral Medium (Latest)",
    "mistral-medium-2505": "Mistral Medium (2505)",
    "mistral-small-latest": "Mistral Small(Latest)",
    "magistral-small-2506": "Magistral Small (2506)",
    "magistral-medium-2506": "Magistral Medium (2506)",
    "ministral-3b-latest": "Ministral 3B (Latest)",
    "ministral-8b-latest": "Ministral 8B (Latest)",
    "pixtral-12b-2409": "Pixtral 12B (2409)",
    "open-mistral-7b": "Open Mistral 7B",
    "open-mixtral-8x7b": "Open Mixtral 8x7B",
    "open-mixtral-8x22b": "Open Mixtral 8x22B",
  },
  modelPref: PREFS.MISTRAL_MODEL,
  apiPref: PREFS.MISTRAL_API_KEY,
  create: createMistral,
});

const gemini = Object.assign(Object.create(providerPrototype), {
  name: "gemini",
  label: "Google Gemini",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=https%3A%2F%2Fgemini.google.com",
  apiKeyUrl: "https://aistudio.google.com/app/apikey",
  AVAILABLE_MODELS: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-lite-preview-06-17",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash-8b-latest",
  ],
  AVAILABLE_MODELS_LABELS: {
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gemini-2.5-flash-lite-preview-06-17": "Gemini 2.5 Flash Lite (preview)",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-1.5-pro-latest": "Gemini 1.5 Pro Latest",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-1.5-flash-latest": "Gemini 1.5 Flash Latest",
    "gemini-1.5-flash-8b": "Gemini 1.5 Flash 8B",
    "gemini-1.5-flash-8b-latest": "Gemini 1.5 Flash 8B Latest",
  },
  modelPref: PREFS.GEMINI_MODEL,
  apiPref: PREFS.GEMINI_API_KEY,
  create: createGoogleGenerativeAI,
});

const openai = Object.assign(Object.create(providerPrototype), {
  name: "openai",
  label: "OpenAI GPT",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=chatgpt.com/",
  apiKeyUrl: "https://platform.openai.com/account/api-keys",
  AVAILABLE_MODELS: [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1",
    "o3-mini",
    "o3",
    "o4-mini",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5-chat-latest",
    "gpt-5-codex",
  ],
  AVAILABLE_MODELS_LABELS: {
    "gpt-4.1": "GPT 4.1",
    "gpt-4.1-mini": "GPT 4.1 Mini",
    "gpt-4.1-nano": "GPT 4.1 Nano",
    "gpt-4o": "GPT 4o",
    "gpt-4o-mini": "GPT 4o Mini",
    "gpt-4-turbo": "GPT 4 Turbo",
    "gpt-4": "GPT 4",
    "gpt-3.5-turbo": "GPT 3.5 Turbo",
    o1: "O1",
    "o3-mini": "O3 Mini",
    o3: "O3",
    "o4-mini": "O4 Mini",
    "gpt-5": "GPT 5",
    "gpt-5-mini": "GPT 5 Mini",
    "gpt-5-nano": "GPT 5 Nano",
    "gpt-5-chat-latest": "GPT 5 Latest",
    "gpt-5-codex": "GPT 5 Codex",
  },
  modelPref: PREFS.OPENAI_MODEL,
  apiPref: PREFS.OPENAI_API_KEY,
  create: createOpenAI,
});

const claude = Object.assign(Object.create(providerPrototype), {
  name: "claude",
  label: "Anthropic Claude",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=anthropic.com",
  apiKeyUrl: "https://console.anthropic.com/dashboard",
  AVAILABLE_MODELS: [
    "claude-sonnet-4-5",
    "claude-opus-4-1",
    "claude-opus-4-0",
    "claude-sonnet-4-0",
    "claude-3-7-sonnet-latest",
    "claude-3-5-haiku-latest",
  ],
  AVAILABLE_MODELS_LABELS: {
    "claude-sonnet-4-5": "Claude Sonnet 4.5",
    "claude-opus-4-1": "Claude Opus 4.1",
    "claude-opus-4-0": "Claude Opus 4.0",
    "claude-sonnet-4-0": "Claude Sonnet 4.0",
    "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet Latest",
    "claude-3-5-haiku-latest": "Claude 3.5 Haiku Latest",
  },
  modelPref: PREFS.CLAUDE_MODEL,
  apiPref: PREFS.CLAUDE_API_KEY,
  create: createAnthropic,
});

const grok = Object.assign(Object.create(providerPrototype), {
  name: "grok",
  label: "xAI Grok",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=x.ai",
  apiKeyUrl: "https://x.ai/api",
  AVAILABLE_MODELS: [
    "grok-4-fast-non-reasoning",
    "grok-4-fast-reasoning",
    "grok-code-fast-1",
    "grok-4",
    "grok-3",
    "grok-3-latest",
    "grok-3-fast",
    "grok-3-fast-latest",
    "grok-3-mini",
    "grok-3-mini-latest",
    "grok-3-mini-fast",
    "grok-3-mini-fast-latest",
    "grok-2",
    "grok-2-latest",
  ],
  AVAILABLE_MODELS_LABELS: {
    "grok-4-fast-non-reasoning": "Grok 4 Fast (Non-Reasoning)",
    "grok-4-fast-reasoning": "Grok 4 Fast (Reasoning)",
    "grok-code-fast-1": "Grok Code Fast 1",
    "grok-4": "Grok 4",
    "grok-3": "Grok 3",
    "grok-3-latest": "Grok 3 Latest",
    "grok-3-fast": "Grok 3 Fast",
    "grok-3-fast-latest": "Grok 3 Fast Latest",
    "grok-3-mini": "Grok 3 Mini",
    "grok-3-mini-latest": "Grok 3 Mini Latest",
    "grok-3-mini-fast": "Grok 3 Mini Fast",
    "grok-3-mini-fast-latest": "Grok 3 Mini Fast Latest",
    "grok-2": "Grok 2",
    "grok-2-latest": "Grok 2 Latest",
  },
  modelPref: PREFS.GROK_MODEL,
  apiPref: PREFS.GROK_API_KEY,
  create: xai,
});

const perplexity = Object.assign(Object.create(providerPrototype), {
  name: "perplexity",
  label: "Perplexity AI",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=perplexity.ai",
  apiKeyUrl: "https://perplexity.ai",
  AVAILABLE_MODELS: [
    "sonar-deep-research",
    "sonar-reasoning-pro",
    "sonar-reasoning",
    "sonar-pro",
    "sonar",
  ],
  AVAILABLE_MODELS_LABELS: {
    "sonar-deep-research": "Sonar Deep Research",
    "sonar-reasoning-pro": "Sonar Reasoning Pro",
    "sonar-reasoning": "Sonar Reasoning",
    "sonar-pro": "Sonar Pro",
    sonar: "Sonar",
  },
  modelPref: PREFS.PERPLEXITY_MODEL,
  apiPref: PREFS.PERPLEXITY_API_KEY,
  create: createPerplexity,
});

const ollama = Object.assign(Object.create(providerPrototype), {
  name: "ollama",
  label: "Ollama (local)",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=ollama.com/",
  apiKeyUrl: "",
  baseUrlPref: PREFS.OLLAMA_BASE_URL,
  get baseUrl() {
    return PREFS.ollamaBaseUrl;
  },
  set baseUrl(v) {
    if (typeof v === "string") PREFS.ollamaBaseUrl = v;
  },
  AVAILABLE_MODELS: [
    "deepseek-r1:8b",
    "deepseek-r1:1.5b",
    "deepseek-r1:7b",
    "deepseek-r1:14b",
    "deepseek-r1:32b",
    "deepseek-r1:70b",
    "mixtral:8x22b",
    "mixtral:8x7b",
    "qwen3:0.6b",
    "qwen3:1.7b",
    "qwen3:4b",
    "qwen3:8b",
    "qwen3:14b",
    "qwen3:32b",
    "qwen3:30b-a3b",
    "qwen3:235b-a22b",
    "llama4:scout",
    "llama4:maverick",
  ],
  AVAILABLE_MODELS_LABELS: {
    "deepseek-r1:8b": "DeepSeek R1 (8B parameters)",
    "deepseek-r1:1.5b": "DeepSeek R1 (1.5B parameters)",
    "deepseek-r1:7b": "DeepSeek R1 (7B parameters)",
    "deepseek-r1:14b": "DeepSeek R1 (14B parameters)",
    "deepseek-r1:32b": "DeepSeek R1 (32B parameters)",
    "deepseek-r1:70b": "DeepSeek R1 (70B parameters)",
    "mixtral:8x22b": "Mixtral (8x22B)",
    "mixtral:8x7b": "Mixtral (8x7B)",
    "qwen3:0.6b": "Qwen3 (0.6B parameters)",
    "qwen3:1.7b": "Qwen3 (1.7B parameters)",
    "qwen3:4b": "Qwen3 (4B parameters)",
    "qwen3:8b": "Qwen3 (8B parameters)",
    "qwen3:14b": "Qwen3 (14B parameters)",
    "qwen3:32b": "Qwen3 (32B parameters)",
    "qwen3:30b-a3b": "Qwen3 (30B-A3B)",
    "qwen3:235b-a22b": "Qwen3 (235B-A22B)",
    "llama4:scout": "Llama 4 Scout",
    "llama4:maverick": "Llama 4 Maverick",
  },
  modelPref: PREFS.OLLAMA_MODEL,
  get apiKey() {
    return "not_required";
  },
  set apiKey(v) {
    return;
    // Not required at all
  },
  getModel() {
    const ollama = createOllama({
      baseURL: this.baseUrl,
    });
    return ollama(this.model);
  },
});

const citationSchema = object({
  answer: string().describe("The conversational answer to the user's query."),
  citations: array(
      object({
        id: number()
          .describe(
            "Unique identifier for the citation, corresponding to the marker in the answer text."
          ),
        source_quote: string()
          .describe(
            "The exact, verbatim quote from the source text that supports the information."
          ),
      })
    )
    .describe("An array of citation objects from the source text."),
});

/**
 * A base class for interacting with language models.
 * It handles provider management, history, and provides generic methods
 * for text generation, streaming, and object generation.
 */
class LLM {
  constructor() {
    this.history = [];
    this.AVAILABLE_PROVIDERS = {
      claude: claude,
      gemini: gemini,
      grok: grok,
      mistral: mistral,
      ollama: ollama,
      openai: openai,
      perplexity: perplexity,
    };
  }

  get llmProvider() {
    return PREFS.llmProvider;
  }

  get currentProvider() {
    return (
      this.AVAILABLE_PROVIDERS[this.llmProvider || "gemini"] || this.AVAILABLE_PROVIDERS["gemini"]
    );
  }

  setProvider(providerName) {
    if (this.AVAILABLE_PROVIDERS[providerName]) {
      PREFS.llmProvider = providerName;
      debugLog(`Switched LLM provider to: ${providerName}`);
    } else {
      debugError(`Provider "${providerName}" not found.`);
    }
  }

  async getSystemPrompt() {
    // Base implementation. Should be overridden by extending classes.
    return "";
  }

  async generateText(options) {
    const { prompt, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      ...rest,
    };

    const result = await generateText(config);

    // Only update history if it wasn't overridden in the options
    if (!rest.messages) {
      this.history.push(...result.response.messages);
    }
    return result;
  }

  async streamText(options) {
    const { prompt, onFinish, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const self = this;
    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      ...rest,
      async onFinish(result) {
        // Only update history if it wasn't overridden in the options
        if (!rest.messages) {
          self.history.push(...result.response.messages);
        }
        if (onFinish) onFinish(result);
      },
    };
    return streamText(config);
  }

  async generateTextWithCitations(options) {
    const { prompt, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      schema: citationSchema,
      ...rest,
    };

    const { object } = await generateObject(config);

    // Only update history if it wasn't overridden in the options
    if (!rest.messages) {
      this.history.push({ role: "assistant", content: JSON.stringify(object) });
    }
    return object;
  }

  getHistory() {
    return [...this.history];
  }

  clearData() {
    debugLog("Clearing LLM history and system prompt.");
    this.history = [];
  }

  getLastMessage() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }
}

/**
 * An extended LLM class specifically for the BrowseBot Findbar.
 * It manages application-specific states like agentic, streaming, citations,
 * and constructs the appropriate system prompts.
 */
class BrowseBotLLM extends LLM {
  constructor() {
    super();
    this.systemInstruction = "";
  }

  get agenticMode() {
    return PREFS.agenticMode;
  }
  get streamEnabled() {
    return PREFS.streamEnabled;
  }
  get citationsEnabled() {
    return PREFS.citationsEnabled;
  }
  get maxToolCalls() {
    return PREFS.maxToolCalls;
  }

  async updateSystemPrompt() {
    debugLog("Updating system prompt...");
    this.systemInstruction = await this.getSystemPrompt();
  }

  async getSystemPrompt() {
    let systemPrompt = `You are a helpful AI assistant integrated into Zen Browser, a minimal and modern fork of Firefox. Your primary purpose is to answer user questions based on the content of the current webpage.

## Your Instructions:
- Be concise, accurate, and helpful.`;

    if (this.agenticMode) {
      systemPrompt += `

## AGENTIC MODE ENABLED - TOOL USAGE:
You have access to browser functions. The user knows you have these abilities.
- **CRITICAL**: When you decide to call a tool, give short summary of what tool are you calling and why?
- Use tools when the user explicitly asks, or when it is the only logical way to fulfill their request (e.g., "search for...").
- When asked about your own abilities, describe the functions you can perform based on the tools listed below.
`;
      systemPrompt += await getToolSystemPrompt();
      systemPrompt += `
## More instructions for Running tools
- While running tool like \`openLink\` and \`newSplit\` make sure URL is valid.
- User will provide URL and title of current of webpage. If you need more context, use the \`getPageTextContent\` or \`getHTMLContent\` tools.
- When the user asks you to "read the current page", use the \`getPageTextContent()\` or \`getHTMLContent\` tool.
- Don't use search tool unless user explicitely asks.
- When user asks you to manage tabs (close/group/move tabs) do it smartly first read tabs and take action don't ask too many question for confirmation.
- If the user asks you to open a link by its text (e.g., "click the 'About Us' link"), you must first use \`getHTMLContent()\` to find the link's full URL, then use \`openLink()\` to open it.`;
    }

    if (this.citationsEnabled) {
      systemPrompt += `

## Citation Instructions
- **Output Format**: Your entire response **MUST** be a single, valid JSON object with two keys: \`"answer"\` and \`"citations"\`.
- **Answer**: The \`"answer"\` key holds the conversational text. Use Markdown Syntax for formatting like lists, bolding, etc.
- **Citations**: The \`"citations"\` key holds an array of citation objects.
- **When to Cite**: For any statement of fact that is directly supported by the provided page content, you **SHOULD** provide a citation. It is not mandatory for every sentence.
- **How to Cite**: In your \`"answer"\`, append a marker like \`[1]\`, \`[2]\`. Each marker must correspond to a citation object in the array.
- **CRITICAL RULES FOR CITATIONS**:
    1.  **source_quote**: This MUST be the **exact, verbatim, and short** text from the page content.
    2.  **Accuracy**: The \`"source_quote"\` field must be identical to the text on the page, including punctuation and casing.
    3.  **Multiple Citations**: If multiple sources support one sentence, format them like \`[1][2]\`, not \`[1,2]\`.
    4.  **Unique IDs**: Each citation object **must** have a unique \`"id"\` that matches its marker in the answer text.
    5.  **Short**: The source quote must be short no longer than one sentence and should not contain line brakes.
- **Do Not Cite**: Do not cite your own abilities, general greetings, or information not from the provided text. Make sure the text is from page text content not from page title or URL.
- **Tool Calls**: If you call a tool, you **must not** provide citations in the same turn.

### Citation Examples

Here are some examples demonstrating the correct JSON output format.

**Example 1: General Question with a List and Multiple Citations**
-   **User Prompt:** "What are the main benefits of using this library?"
-   **Your JSON Response:**
    \`\`\`json
    {
      "answer": "This library offers several key benefits:\n\n*   **High Performance**: It is designed to be fast and efficient for large-scale data processing [1].\n*   **Flexibility**: You can integrate it with various frontend frameworks [2].\n*   **Ease of Use**: The API is well-documented and simple to get started with [3].",
      "citations": [
        {
          "id": 1,
          "source_quote": "The new architecture provides significant performance gains, especially for large-scale data processing."
        },
        {
          "id": 2,
          "source_quote": "It is framework-agnostic, offering adapters for React, Vue, and Svelte."
        },
        {
          "id": 3,
          "source_quote": "Our extensive documentation and simple API make getting started a breeze."
        }
      ]
    }
    \`\`\`

**Example 2: A Sentence Supported by Two Different Sources**
-   **User Prompt:** "Tell me about the project's history."
-   **Your JSON Response:**
    \`\`\`json
    {
      "answer": "The project was initially created in 2021 [1] and later became open-source in 2022 [2].",
      "citations": [
        {
          "id": 1,
          "source_quote": "Development began on the initial prototype in early 2021."
        },
        {
          "id": 2,
          "source_quote": "We are proud to announce that as of September 2022, the project is fully open-source."
        }
      ]
    }
    \`\`\`

**Example 3: The WRONG way (What NOT to do)**
This is incorrect because it uses one citation \`[1]\` for three different facts. This is lazy and unhelpful.
-   **Your JSON Response (Incorrect):**
    \`\`\`json
    {
      "answer": "This project is a toolkit for loading custom JavaScript into the browser [1]. Its main features include a modern UI [1] and an API for managing hotkeys and notifications [1].",
      "citations": [
        {
          "id": 1,
          "source_quote": "...a toolkit for loading custom JavaScript... It has features like a modern UI... provides an API for hotkeys and notifications..."
        }
      ]
    }
    \`\`\`

**Example 4: The WRONG way (What NOT to do)**
This is incorrect because it uses one citation same id for all facts.
\`\`\`json
{
  "answer": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion [1]. It is built with Tiptap and Vercel AI SDK [1]. You can install it using npm [1]. Features include a slash menu, bubble menu, AI autocomplete, and image uploads [1].",
  "citations": [
    {
      "id": 1,
      "source_quote": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion."
    },
    {
      "id": 1,
      "source_quote": "Built with Tiptap + Vercel AI SDK."
    },
    {
      "id": 1,
      "source_quote": "Installation npm i novel"
    },
    {
      "id": 1,
      "source_quote": "Features Slash menu & bubble menu AI autocomplete (type ++ to activate, or select from slash menu) Image uploads (drag & drop / copy & paste, or select from slash menu)"
    }
  ]
}
\`\`\`

**Example 5: The correct format of previous example**
This example is correct, note that it contain unique \`id\`, and each in text citation match to each citation \`id\`.
\`\`\`json
{
  "answer": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion [1]. It is built with Tiptap and Vercel AI SDK [2]. You can install it using npm [3]. Features include a slash menu, bubble menu, AI autocomplete, and image uploads [4].",
  "citations": [
    {
      "id": 1,
      "source_quote": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion."
    },
    {
      "id": 2,
      "source_quote": "Built with Tiptap + Vercel AI SDK."
    },
    {
      "id": 3,
      "source_quote": "Installation npm i novel"
    },
    {
      "id": 4,
      "source_quote": "Features Slash menu & bubble menu AI autocomplete (type ++ to activate, or select from slash menu) Image uploads (drag & drop / copy & paste, or select from slash menu)"
    }
  ]
}
\`\`\`
`;
    }

    if (!this.agenticMode) {
      systemPrompt += `
- Strictly base all your answers on the webpage content provided below.
- If the user's question cannot be answered from the content, state that the information is not available on the page.

Here is the initial info about the current page:
`;
      const pageContext = await messageManagerAPI.getPageTextContent(!this.citationsEnabled);
      systemPrompt += JSON.stringify(pageContext);
    }
    return systemPrompt;
  }

  parseModelResponseText(responseText) {
    let answer = responseText;
    let citations = [];

    if (PREFS.citationsEnabled) {
      try {
        // Find the JSON part of the response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        const parsedContent = JSON.parse(jsonString);

        if (typeof parsedContent.answer === "string") {
          answer = parsedContent.answer;
          if (Array.isArray(parsedContent.citations)) {
            citations = parsedContent.citations;
          }
        } else {
          // Parsed JSON but 'answer' field is missing or not a string.
          debugLog("AI response JSON missing 'answer' field or not a string:", parsedContent);
        }
      } catch (e) {
        // JSON parsing failed, keep rawText as answer.
        debugError("Failed to parse AI message content as JSON:", e, "Raw Text:", responseText);
      }
    }
    return { answer, citations };
  }

  async sendMessage(prompt, abortSignal) {
    debugLog("Current history before sending:", this.history);

    if (this.citationsEnabled) {
      const object = await super.generateTextWithCitations({
        prompt,
        abortSignal,
      });

      if (browseBotFindbar?.findbar) {
        browseBotFindbar.findbar.history = this.getHistory();
      }
      return object;
    }

    if (!this.agenticMode) {
      if (this.streamEnabled) {
        const self = this;
        const streamResult = await super.streamText({ prompt, abortSignal });
        (async () => {
          await streamResult.text;
          if (browseBotFindbar?.findbar) {
            browseBotFindbar.findbar.history = self.getHistory();
          }
        })();
        return streamResult;
      } else {
        const result = await super.generateText({ prompt, abortSignal });
        if (browseBotFindbar?.findbar) {
          browseBotFindbar.findbar.history = this.getHistory();
        }
        return result;
      }
    }

    const shouldToolBeCalled = async (toolName) => {
      browseBotFindbar._createOrUpdateToolCallUI(toolName, "loading");
      if (PREFS.conformation) {
        const friendlyName = toolNameMapping[toolName] || toolName;
        const confirmed = await browseBotFindbar.createToolConfirmationDialog([friendlyName]);
        if (!confirmed) {
          debugLog(`Tool execution for '${toolName}' cancelled by user.`);
          browseBotFindbar._createOrUpdateToolCallUI(toolName, "declined");
          return false;
        }
      }
      return true;
    };

    const afterToolCall = (toolName, result) => {
      const status = result.error ? "error" : "success";
      browseBotFindbar._createOrUpdateToolCallUI(toolName, status, result.error);
    };

    // NOTE: Not using bookmarks group because AI always made bookmark folder when asked to make tab folder
    const findbarToolGroups = Object.keys(toolGroups).filter(
      (group) => group !== "bookmarks" && group !== "misc"
    );
    const tools = getTools(findbarToolGroups, { shouldToolBeCalled, afterToolCall });

    const commonConfig = {
      prompt,
      tools,
      stopWhen: stepCountIs(this.maxToolCalls),
      abortSignal,
    };

    if (this.streamEnabled) {
      const self = this;
      return super.streamText({
        ...commonConfig,
        onFinish: () => {
          if (browseBotFindbar?.findbar) {
            browseBotFindbar.findbar.history = self.getHistory();
          }
        },
      });
    } else {
      const result = await super.generateText(commonConfig);
      if (browseBotFindbar?.findbar) {
        browseBotFindbar.findbar.history = this.getHistory();
      }
      return result;
    }
  }

  clearData() {
    super.clearData();
    this.systemInstruction = "";
  }
}

const browseBotFindbarLLM = new BrowseBotLLM();
window.browseBotFindabrLLM = browseBotFindbarLLM;

const urlBarGroups = ["search", "navigation", "tabs", "workspaces", "uiFeedback"];

class UrlBarLLM extends LLM {
  async getSystemPrompt() {
    let systemPrompt = `You are an AI integrated with Zen Browser URL bar, designed to assist users in browsing the web effectively and organizing their workspace in better way.

Your primary responsibilities include:
1. Making tool calls in each response based on user input.
2. If the user does not provide specific commands, perform a search using the provided terms. You are permitted to correct any grammar or spelling mistakes and refine user queries for better accuracy.
3. If a URL is provided, open it directly.
4. Update user about your action with Toast Notification.
5. Managing tabs, if user ask you to manage the tabs (grouping, closing, spliting) you will do it with tools you have access to.

When To use Toast:
- When you perform not default action like searching or opening URL while if you fix spelling mistake in search term.
- When you can't fulfill user's requirement (show short and clear toast why user's requirement can't be fulfilled).
- When Long and complicated task is completed.

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

const urlBarLLM = new UrlBarLLM();
window.browseBotURLBarLLM = urlBarLLM;

const urlbarAI = {
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
        urlbarLLM.clearData();
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

function setupCommandPaletteIntegration(retryCount = 0) {
  if (window.ZenCommandPalette) {
    debugLog("Integrating with Zen Command Palette...");

    window.ZenCommandPalette.addCommands([
      {
        key: "browsebot:summarize",
        label: "Summarize Page",
        command: () => {
          browseBotFindbar.expanded = true;
          browseBotFindbar.sendMessage(PREFS.contextMenuCommandNoSelection);
          browseBotFindbar.focusPrompt();
        },
        condition: () => PREFS.enabled,
        icon: "chrome://global/skin/icons/highlights.svg",
        tags: ["AI", "Summarize", "BrowseBot", "findbar"],
      },
      {
        key: "browsebot:settings",
        label: "Open BrowseBot Settings",
        command: () => SettingsModal.show(),
        icon: "chrome://global/skin/icons/settings.svg",
        tags: ["AI", "BrowseBot", "Settings"],
      },
      {
        key: "browsebot:urlbarAi",
        label: "Toggle URL bar AI mode",
        command: () => urlbarAI.toggleAIMode(),
        condition: () => urlbarAI.enabled,
        icon: "chrome://global/skin/icons/highlights.svg",
        tags: ["AI", "BrowseBot", "URL", "Command"],
      },
      {
        key: "browsebot:expand-findbar",
        label: "Expand findbar AI",
        command: () => (browseBotFindbar.expanded = true),
        condition: () => PREFS.enabled,
        icon: "chrome://global/skin/icons/highlights.svg",
        tags: ["AI", "BrowseBot", "findbar"],
      },
    ]);

    debugLog("Zen Command Palette integration successful.");
  } else {
    debugLog("Zen Command Palette not found, retrying in 1000ms");
    if (retryCount < 10) {
      setTimeout(() => setupCommandPaletteIntegration(retryCount + 1), 1000);
    } else {
      debugError("Could not integrate with Zen Command Palette after 10 retries.");
    }
  }
}

UC_API.Runtime.startupFinished().then(() => {
  // Init findbar-AI
  browseBotFindbar.init();
  UC_API.Prefs.addListener(
    PREFS.ENABLED,
    browseBotFindbar.handleEnabledChange.bind(browseBotFindbar)
  );
  window.browseBotFindbar = browseBotFindbar;

  // Init URL bar-AI
  urlbarAI.init();
  urlbarAI._prefListener = UC_API.Prefs.addListener(
    PREFS.URLBAR_AI_ENABLED,
    urlbarAI.handlePrefChange.bind(urlbarAI)
  );

  setupCommandPaletteIntegration();
});
