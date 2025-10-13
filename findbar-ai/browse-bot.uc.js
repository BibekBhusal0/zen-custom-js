// ==UserScript==
// @name            BrowseBot
// @description     Transforms the standard Zen Browser findbar into a modern, floating, AI-powered chat interface.
// @author          BibekBhusal
// ==/UserScript==


(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  const PREFS = {
    ENABLED: "extension.browse-bot.enabled",
    MINIMAL: "extension.browse-bot.minimal",
    PERSIST: "extension.browse-bot.persist-chat",
    DND_ENABLED: "extension.browse-bot.dnd-enabled",
    POSITION: "extension.browse-bot.position",
    DEBUG_MODE: "extension.browse-bot.debug-mode",
    SOLID_BG: "extension.browse-bot.solid-bg",

    GOD_MODE: "extension.browse-bot.god-mode",
    CITATIONS_ENABLED: "extension.browse-bot.citations-enabled",
    MAX_TOOL_CALLS: "extension.browse-bot.max-tool-calls",
    CONFORMATION: "extension.browse-bot.conform-before-tool-call",

    CONTEXT_MENU_ENABLED: "extension.browse-bot.context-menu-enabled",
    CONTEXT_MENU_AUTOSEND: "extension.browse-bot.context-menu-autosend",

    LLM_PROVIDER: "extension.browse-bot.llm-provider",
    MISTRAL_API_KEY: "extension.browse-bot.mistral-api-key",
    MISTRAL_MODEL: "extension.browse-bot.mistral-model",
    GEMINI_API_KEY: "extension.browse-bot.gemini-api-key",
    GEMINI_MODEL: "extension.browse-bot.gemini-model",

    //TODO: Not yet implimented
    COPY_BTN_ENABLED: "extension.browse-bot.copy-btn-enabled",
    MARKDOWN_ENABLED: "extension.browse-bot.markdown-enabled",
    SHOW_TOOL_CALL: "extension.browse-bot.show-tool-call",

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

    setInitialPrefs() {
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

    set godMode(value) {
      this.setPref(this.GOD_MODE, value);
    },
    get godMode() {
      return this.getPref(this.GOD_MODE);
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

    get llmProvider() {
      return this.getPref(this.LLM_PROVIDER);
    },
    set llmProvider(value) {
      this.setPref(this.LLM_PROVIDER, value);
    },

    get mistralApiKey() {
      return this.getPref(this.MISTRAL_API_KEY);
    },
    set mistralApiKey(value) {
      this.setPref(this.MISTRAL_API_KEY, value);
    },

    get mistralModel() {
      return this.getPref(this.MISTRAL_MODEL);
    },
    set mistralModel(value) {
      this.setPref(this.MISTRAL_MODEL, value);
    },

    get geminiApiKey() {
      return this.getPref(this.GEMINI_API_KEY);
    },
    set geminiApiKey(value) {
      this.setPref(this.GEMINI_API_KEY, value);
    },

    get geminiModel() {
      return this.getPref(this.GEMINI_MODEL);
    },
    set geminiModel(value) {
      this.setPref(this.GEMINI_MODEL, value);
    },

    get persistChat() {
      return this.getPref(this.PERSIST);
    },
    set persistChat(value) {
      this.setPref(this.PERSIST, value);
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
    [PREFS.MINIMAL]: true,
    [PREFS.GOD_MODE]: false,
    [PREFS.DEBUG_MODE]: false,
    [PREFS.PERSIST]: false,
    [PREFS.CITATIONS_ENABLED]: false,
    [PREFS.CONTEXT_MENU_ENABLED]: true,
    [PREFS.CONTEXT_MENU_AUTOSEND]: true,
    [PREFS.LLM_PROVIDER]: "gemini",
    [PREFS.MISTRAL_API_KEY]: "",
    [PREFS.MISTRAL_MODEL]: "mistral-medium-latest",
    [PREFS.GEMINI_API_KEY]: "",
    [PREFS.GEMINI_MODEL]: "gemini-2.0-flash",
    [PREFS.DND_ENABLED]: true,
    [PREFS.POSITION]: "top-right",
    [PREFS.MAX_TOOL_CALLS]: 5,
    [PREFS.CONFORMATION]: true,
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
  };

  const gemini = {
    name: "gemini",
    label: "Google Gemini",
    faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=https%3A%2F%2Fgemini.google.com",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    AVAILABLE_MODELS: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
    ],
    AVAILABLE_MODELS_LABELS: {
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
      "gemini-1.5-flash-8b": "Gemini 1.5 Flash 8B",
    },
    modelPref: PREFS.GEMINI_MODEL,
    apiPref: PREFS.GEMINI_API_KEY,

    get apiKey() {
      return PREFS.geminiApiKey;
    },
    set apiKey(value) {
      if (typeof value === "string") PREFS.geminiApiKey = value;
    },

    get model() {
      return PREFS.geminiModel;
    },
    set model(value) {
      if (this.AVAILABLE_MODELS.includes(value)) PREFS.geminiModel = value;
    },

    get apiUrl() {
      const model = this.model;
      if (!model) return null;
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    },

    async sendMessage(requestBody) {
      const apiKey = this.apiKey;
      const apiUrl = this.apiUrl;
      if (!apiKey || !apiUrl) {
        throw new Error("Invalid arguments for sendMessage.");
      }
      let response = await fetch(apiUrl, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
      }

      let data = await response.json();
      let modelResponse = data.candidates?.[0]?.content;
      return modelResponse;
    },
  };

  // --- Mistral API Rate Limiting ---
  let mistralRequestQueue = [];
  let lastMistralRequestTime = 0;

  function enqueueMistralRequest(fn) {
    return new Promise((resolve, reject) => {
      mistralRequestQueue.push({ fn, resolve, reject });
      processMistralQueue();
    });
  }

  async function processMistralQueue() {
    if (processMistralQueue.running) return;
    processMistralQueue.running = true;
    while (mistralRequestQueue.length > 0) {
      const now = Date.now();
      const wait = Math.max(0, 1000 - (now - lastMistralRequestTime)); // 1 request per second
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
      const { fn, resolve, reject } = mistralRequestQueue.shift();
      try {
        const result = await fn();
        lastMistralRequestTime = Date.now();
        debugLog("Mistral API request completed at", new Date().toISOString());
        resolve(result);
      } catch (e) {
        lastMistralRequestTime = Date.now();
        debugError("Mistral API request failed at", new Date().toISOString(), e);
        reject(e);
      }
    }
    processMistralQueue.running = false;
    // If new requests were added while we were processing, start again
    if (mistralRequestQueue.length > 0) {
      processMistralQueue();
    }
  }

  // Recursively convert all type fields to lowercase (OpenAI/Mistral schema compliance)
  function normalizeSchemaTypes(obj) {
    if (Array.isArray(obj)) {
      return obj.map(normalizeSchemaTypes);
    } else if (obj && typeof obj === "object") {
      const newObj = {};
      for (const key in obj) {
        if (key === "type" && typeof obj[key] === "string") {
          newObj[key] = obj[key].toLowerCase();
        } else {
          newObj[key] = normalizeSchemaTypes(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

  // Generate a valid tool_call_id for Mistral: 9 chars, a-z, A-Z, 0-9
  function generateToolCallId() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 9; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  const mistral = {
    name: "mistral",
    label: "Mistral AI",
    faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=https%3A%2F%2Fmistral.ai%2F",
    apiKeyUrl: "https://console.mistral.ai/api-keys/",
    AVAILABLE_MODELS: [
      "mistral-small",
      "mistral-medium-latest",
      "mistral-large-latest",
      "pixtral-large-latest",
    ],
    AVAILABLE_MODELS_LABELS: {
      "mistral-small": "Mistral Small",
      "mistral-medium-latest": "Mistral Medium (Latest)",
      "mistral-large-latest": "Mistral Large (Latest)",
      "pixtral-large-latest": "Pixtral Large (Latest)",
    },
    modelPref: PREFS.MISTRAL_MODEL,
    apiPref: PREFS.MISTRAL_API_KEY,

    get apiKey() {
      return PREFS.mistralApiKey;
    },
    set apiKey(value) {
      if (typeof value === "string") PREFS.mistralApiKey = value;
    },

    get model() {
      return PREFS.mistralModel;
    },
    set model(value) {
      if (this.AVAILABLE_MODELS.includes(value)) PREFS.mistralModel = value;
    },

    get apiUrl() {
      return "https://api.mistral.ai/v1/chat/completions";
    },

    async sendMessage(requestBody) {
      const apiKey = this.apiKey;
      const apiUrl = this.apiUrl;
      if (!apiKey || !apiUrl) {
        throw new Error("No Mistral API key set.");
      }

      const messages = [];

      if (requestBody.systemInstruction?.parts?.[0]?.text) {
        messages.push({
          role: "system",
          content: requestBody.systemInstruction.parts[0].text,
        });
      }

      // Map history to Mistral messages format
      for (const entry of requestBody.contents) {
        if (entry.role === "user" || entry.role === "assistant") {
          messages.push({
            role: entry.role === "assistant" ? "assistant" : "user", // Mistral uses 'assistant' not 'model'
            content: entry.parts?.[0]?.text || "",
          });
        } else if (entry.role === "tool" && entry.parts) {
          // Handle tool responses from llm/index.js
          for (const part of entry.parts) {
            if (part.functionResponse) {
              messages.push({
                role: "tool",
                name: part.functionResponse.name,
                content: JSON.stringify(part.functionResponse.response),
                tool_call_id: generateToolCallId(), // Use valid tool_call_id
              });
            }
          }
        } else if (entry.role === "model" && entry.parts) {
          // Handle Gemini tool_calls format if coming from Gemini history (should be translated)
          const content = entry.parts.find((p) => p.text)?.text || "";
          const tool_calls = entry.parts
            .filter((p) => p.functionCall)
            .map((p) => ({
              id: generateToolCallId(),
              function: {
                name: p.functionCall.name,
                arguments: JSON.stringify(p.functionCall.args),
              },
            }));
          messages.push({
            role: "assistant",
            content: content,
            ...(tool_calls.length > 0 ? { tool_calls: tool_calls } : {}),
          });
        }
      }

      // Prepare tools for Mistral API (OpenAI-compatible format)
      let tools = undefined;
      if (requestBody.tools) {
        tools = requestBody.tools[0].functionDeclarations.map((fn) => ({
          type: "function",
          function: {
            name: fn.name,
            description: fn.description,
            parameters: normalizeSchemaTypes(fn.parameters),
          },
        }));
      }

      let body = {
        model: this.model,
        messages: messages,
      };

      if (tools) {
        body.tools = tools;
      } else if (requestBody.generationConfig?.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      let response;
      try {
        response = await enqueueMistralRequest(async () => {
          return await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
        });
      } catch (e) {
        debugError("Failed to connect to Mistral API:", e);
        throw new Error("Failed to connect to Mistral API: " + e.message);
      }

      if (!response.ok) {
        let errorMsg = `Mistral API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          debugError("Mistral API Error Details:", errorData);
          if (errorData.error && errorData.error.message) errorMsg += ` - ${errorData.error.message}`;
        } catch (err) {
          debugError("Mistral API Error: Could not parse error response.", err);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      // Convert Mistral's response format back to the common format expected by llm/index.js
      const modelResponse = {
        role: "model", // Convert Mistral's 'assistant' to 'model' for consistency
        parts: [],
      };

      if (choice?.message?.content) {
        modelResponse.parts.push({ text: choice.message.content });
      }

      if (choice?.message?.tool_calls && Array.isArray(choice.message.tool_calls)) {
        for (const call of choice.message.tool_calls) {
          modelResponse.parts.push({
            functionCall: {
              name: call.function?.name,
              args: JSON.parse(call.function?.arguments || "{}"),
            },
          });
        }
      }
      return modelResponse;
    },
  };

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
    const { link1, link2, type = "vertical" } = args;
    if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
    if (!link1 || !link2) return { error: "newSplit requires two links." };
    try {
      const sep = type.toLowerCase() === "vertical" ? "vsep" : "hsep";
      await openTrustedLinkIn(link1, "tab");
      const tab1 = gBrowser.selectedTab;
      await openTrustedLinkIn(link2, "tab");
      const tab2 = gBrowser.selectedTab;
      gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
      return {
        result: `Successfully created ${type} split view with the provided links.`,
      };
    } catch (e) {
      debugError("Failed to create split view.", e);
      return { error: "Failed to create split view." };
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
    if (!url && !title)
      return {
        error: "updateBookmark requires either a new url or a new title.",
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
    if (!value) return { error: "fillForm requires a value." };
    return messageManagerAPI.fillForm(selector, value);
  }

  const availableTools = {
    search,
    newSplit,
    openLink,
    getPageTextContent: messageManagerAPI.getPageTextContent.bind(messageManagerAPI),
    getHTMLContent: messageManagerAPI.getHTMLContent.bind(messageManagerAPI),
    getYoutubeTranscript: messageManagerAPI.getYoutubeTranscript.bind(messageManagerAPI),
    searchBookmarks,
    getAllBookmarks,
    createBookmark,
    addBookmarkFolder,
    updateBookmark,
    deleteBookmark,
    clickElement,
    fillForm,
  };

  const toolDeclarations = [
    {
      functionDeclarations: [
        {
          name: "search",
          description: "Performs a web search using a specified search engine and opens the results.",
          parameters: {
            type: "OBJECT",
            properties: {
              searchTerm: {
                type: "STRING",
                description: "The term to search for.",
              },
              engineName: {
                type: "STRING",
                description: "Optional. The name of the search engine to use.",
              },
              where: {
                type: "STRING",
                description:
                  "Optional. Where to open the search results. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Defaults to 'new tab'. Note that 'glance', 'vsplit' and 'hsplit' are special to zen browser. 'glance' opens in small popup and 'vsplit' and 'hsplit' opens in vertical and horizontal split respectively. When user says open in split and don't spicify 'vsplit' or 'hsplit' default to 'vsplit'.",
              },
            },
            required: ["searchTerm"],
          },
        },
        {
          name: "openLink",
          description:
            "Opens a given URL in a specified location. Can also create a split view with the current tab.",
          parameters: {
            type: "OBJECT",
            properties: {
              link: { type: "STRING", description: "The URL to open." },
              where: {
                type: "STRING",
                description:
                  "Optional. Where to open the link. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Defaults to 'new tab'. Note that 'glance', 'vsplit' and 'hsplit' are special to zen browser. 'glance' opens in small popup and 'vsplit' and 'hsplit' opens in vertical and horizontal split respectively. When user says open in split and don't spicify 'vsplit' or 'hsplit' default to 'vsplit'.",
              },
            },
            required: ["link"],
          },
        },
        {
          name: "newSplit",
          description:
            "Creates a split view by opening two new URLs in two new tabs, then arranging them side-by-side.",
          parameters: {
            type: "OBJECT",
            properties: {
              link1: {
                type: "STRING",
                description: "The URL for the first new tab.",
              },
              link2: {
                type: "STRING",
                description: "The URL for the second new tab.",
              },
              type: {
                type: "STRING",
                description:
                  "Optional, The split type: 'horizontal' or 'vertical'. Defaults to 'vertical'.",
              },
            },
            required: ["link1", "link2"],
          },
        },
        {
          name: "getPageTextContent",
          description:
            "Retrieves the text content of the current web page to answer questions if the initial context is insufficient.",
          parameters: { type: "OBJECT", properties: {} },
        },
        {
          name: "getHTMLContent",
          description:
            "Retrieves the full HTML source of the current web page for detailed analysis. Use this tool very rarely, only when text content is insufficient.",
          parameters: { type: "OBJECT", properties: {} },
        },
        {
          name: "getYoutubeTranscript",
          description:
            "Retrives the transcript of the current youtube video. Only use if current page is a youtube video.",
          parameters: { type: "OBJECT", properties: {} },
        },
        {
          name: "searchBookmarks",
          description: "Searches bookmarks based on a query.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: {
                type: "STRING",
                description: "The search term for bookmarks.",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "getAllBookmarks",
          description: "Retrieves all bookmarks.",
          parameters: { type: "OBJECT", properties: {} },
        },
        {
          name: "createBookmark",
          description: "Creates a new bookmark.",
          parameters: {
            type: "OBJECT",
            properties: {
              url: {
                type: "STRING",
                description: "The URL to bookmark.",
              },
              title: {
                type: "STRING",
                description:
                  "Optional. The title for the bookmark. If not provided, the URL is used.",
              },
              parentID: {
                type: "STRING",
                description:
                  'Optional. The GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder.',
              },
            },
            required: ["url"],
          },
        },
        {
          name: "addBookmarkFolder",
          description: "Creates a new bookmark folder.",
          parameters: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
                description: "The title for the new folder.",
              },
              parentID: {
                type: "STRING",
                description:
                  'Optional. The GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder.',
              },
            },
            required: ["title"],
          },
        },
        {
          name: "updateBookmark",
          description: "Updates an existing bookmark.",
          parameters: {
            type: "OBJECT",
            properties: {
              id: {
                type: "STRING",
                description: "The GUID of the bookmark to update.",
              },
              url: {
                type: "STRING",
                description: "The new URL for the bookmark.",
              },
              title: {
                type: "STRING",
                description: "The new title for the bookmark.",
              },
              parentID: {
                type: "STRING",
                description: "The GUID of the parent folder.",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "deleteBookmark",
          description: "Deletes a bookmark.",
          parameters: {
            type: "OBJECT",
            properties: {
              id: {
                type: "STRING",
                description: "The GUID of the bookmark to delete.",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "clickElement",
          description: "Clicks an element on the page.",
          parameters: {
            type: "OBJECT",
            properties: {
              selector: {
                type: "STRING",
                description: "The CSS selector of the element to click.",
              },
            },
            required: ["selector"],
          },
        },
        {
          name: "fillForm",
          description: "Fills a form input on the page.",
          parameters: {
            type: "OBJECT",
            properties: {
              selector: {
                type: "STRING",
                description: "The CSS selector of the input element to fill.",
              },
              value: {
                type: "STRING",
                description: "The value to fill the input with.",
              },
            },
            required: ["selector", "value"],
          },
        },
      ],
    },
  ];

  const getToolSystemPrompt = async () => {
    try {
      const searchEngines = await Services.search.getVisibleEngines();
      const engineNames = searchEngines.map((e) => e.name).join(", ");
      const defaultEngineName = Services.search.defaultEngine.name;
      return `
- When asked about your own abilities, describe the functions you can perform based on the tools listed below.

## GOD MODE ENABLED - TOOL USAGE:
You have access to browser functions. The user knows you have these abilities.
- **CRITICAL**: When you decide to call a tool, give short summary of what tool are you calling and why?
- Use tools when the user explicitly asks, or when it is the only logical way to fulfill their request (e.g., "search for...").

## Available Tools:
- \`search(searchTerm, engineName, where)\`: Performs a web search. Available engines: ${engineNames}. The default is '${defaultEngineName}'.
- \`openLink(link, where)\`: Opens a URL. Use this to open a single link or to create a split view with the *current* tab.
- \`newSplit(link1, link2, type)\`: Use this specifically for creating a split view with *two new tabs*.
- \`getPageTextContent()\` / \`getHTMLContent()\`: Use these to get updated page information if context is missing. Prefer \`getPageTextContent\`.
- \`searchBookmarks(query)\`: Searches your bookmarks for a specific query.
- \`getAllBookmarks()\`: Retrieves all of your bookmarks.
- \`createBookmark(url, title, parentID)\`: Creates a new bookmark.  The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`addBookmarkFolder(title, parentID)\`: Creates a new bookmark folder. The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`updateBookmark(id, url, title, parentID)\`: Updates an existing bookmark.  The \`id\` is the GUID of the bookmark.  You must provide the ID and either a new URL or a new title or new parentID (or any one or two).
- \`deleteBookmark(id)\`: Deletes a bookmark.  The \`id\` is the GUID of the bookmark.
- \`clickElement(selector)\`: Clicks an element on the page.
- \`fillForm(selector, value)\`: Fills a form input on the page.

## More instructions for Running tools
- While running tool like \`openLink\` and \`newSplit\` make sure URL is valid.
- User will provide URL and title of current of webpage. If you need more context, use the \`getPageTextContent\` or \`getHTMLContent\` tools.
- When the user asks you to "read the current page", use the \`getPageTextContent()\` or \`getHTMLContent\` tool.
- If the user asks you to open a link by its text (e.g., "click the 'About Us' link"), you must first use \`getHTMLContent()\` to find the link's full URL, then use \`openLink()\` to open it.

## Tool Call Examples:
Therse are just examples for you on how you can use tools calls, each example give you some concept, the concept is not specific to single tool.

### Use default value when user don't provides full information, If user don't provide default value you may ask and even give options if possible
#### Searching the Web: 
-   **User Prompt:** "search for firefox themes"
-   **Your Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "firefox themes", "engineName": "${defaultEngineName}"}}}\`

### Make sure you are calling tools with correct parameters.
#### Opening a Single Link:
-   **User Prompt:** "open github"
-   **Your Tool Call:** \`{"functionCall": {"name": "openLink", "args": {"link": "https://github.com", "where": "new tab"}}}\`

#### Creating a Split View with Two New Pages:
-   **User Prompt:** "show me youtube and twitch side by side"
-   **Your Tool Call:** \`{"functionCall": {"name": "newSplit", "args": {"link1": "https://youtube.com", "link2": "https://twitch.tv"}}}\`

### Use tools to get more context: If user ask anything whose answer is unknown to you and it can be obtained via tool call use it.
#### Reading the Current Page for Context
-   **User Prompt:** "summarize this page for me"
-   **Your Tool Call:** \`{"functionCall": {"name": "getPageTextContent", "args": {}}}\`

### Taking multiple steps; you might need for previous tool to compete and give you output before calling next tool
#### Finding and Clicking a Link on the Current Page
-   **User Prompt:** "click on the contact link"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call (after receiving HTML and finding the link):** \`{"functionCall": {"name": "openLink", "args": {"link": "https://example.com/contact-us"}}}\`

#### Finding and Editing a bookmark by folder name:
-   **User Prompt:** "Move bookmark titled 'Example' to folder 'MyFolder'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "Example"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "MyFolder"}}}\`
-   **Your Third Tool Call (after receiving the bookmark and folder ids):** \`{"functionCall": {"name": "updateBookmark", "args": {"id": "xxxxxxxxxxxx", "parentID": "yyyyyyyyyyyy"}}}\`
Note that first and second tool clls can be made in parallel, but the third tool call needs output from the first and second tool calls so it must be made after first and second.

#### Filling a form:
-   **User Prompt:** "Fill the name with John and submit"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "fillForm", "args": {"selector": "#name", "value": "John"}}}\`
-   **Your Third Tool Call:** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#submit-button"}}}\`

### Calling multiple tools at once.
#### Making 2 searches in split 
-   **User Prompt:** "Search for Japan in google and search for America in Youtube. Open them in vertical split."
-   **Your First Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "Japan", "engineName": "Google", "where": "new tab"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "America", "engineName": "Youtube", "where": "vsplit"}}}\`

*(Available search engines: ${engineNames}. Default is '${defaultEngineName}'.)*
`;
    } catch (error) {
      debugError("Error in getToolSystemPrompt:", error);
      return "";
    }
  };

  async function executeToolCalls(llmInstance, requestBody, modelResponse, currentDepth = 0) {
    const maxRecursionDepth = PREFS.maxToolCalls || 3;
    const functionCalls = modelResponse?.parts?.filter((part) => part.functionCall);

    if (!functionCalls || functionCalls.length === 0) {
      return modelResponse;
    }

    if (currentDepth >= maxRecursionDepth) {
      debugLog("Max recursion depth reached. Stopping tool execution.");
      return modelResponse;
    }

    debugLog(`Function call(s) requested by model (depth ${currentDepth}):`, functionCalls);

    // Gather the names of all tools to be called
    const toolNames = functionCalls.map((call) => call.functionCall.name);

    let confirmed = true;
    if (PREFS.conformation) {
      confirmed = await window.browserBotFindbar.createToolConfirmationDialog(toolNames);
    }

    const functionResponses = [];
    if (confirmed) {
      for (const call of functionCalls) {
        const { name, args } = call.functionCall;

        if (availableTools[name]) {
          debugLog(`Executing tool: "${name}" with args:`, args);
          const toolResult = await availableTools[name](args);
          debugLog(`Tool "${name}" executed. Result:`, toolResult);
          functionResponses.push({
            functionResponse: { name, response: toolResult },
          });
        } else {
          debugError(`Tool "${name}" not found!`);
          functionResponses.push({
            functionResponse: {
              name,
              response: { error: `Tool "${name}" is not available.` },
            },
          });
        }
      }
    } else {
      debugLog("Tool execution cancelled by user.");
      // Create error responses for all tool calls
      for (const name of toolNames) {
        functionResponses.push({
          functionResponse: {
            name,
            response: { error: `Tool "${name}" execution cancelled by user.` },
          },
        });
      }
    }

    llmInstance.history.push({ role: "tool", parts: functionResponses });

    requestBody = {
      contents: llmInstance.history,
      systemInstruction: llmInstance.systemInstruction,
      generationConfig: PREFS.citationsEnabled ? { responseMimeType: "application/json" } : {},
    };

    modelResponse = await llmInstance.currentProvider.sendMessage(requestBody);
    llmInstance.history.push(modelResponse);

    // Only recurse if the model provided a valid response
    if (modelResponse?.parts?.length > 0) {
      debugLog("Running tool call", currentDepth + 1, "Time");
      return executeToolCalls(llmInstance, requestBody, modelResponse, currentDepth + 1);
    } else {
      debugLog("Model returned an empty response after tool execution.");
      return modelResponse;
    }
  }

  const llm = {
    history: [],
    systemInstruction: null,
    AVAILABLE_PROVIDERS: {
      gemini: gemini,
      mistral: mistral,
    },
    get currentProvider() {
      const providerName = PREFS.llmProvider || "gemini";
      return this.AVAILABLE_PROVIDERS[providerName];
    },
    setProvider(providerName) {
      if (this.AVAILABLE_PROVIDERS[providerName]) {
        PREFS.llmProvider = providerName;
        this.clearData();
        debugLog(`Switched LLM provider to: ${providerName}`);
      } else {
        debugError(`Provider "${providerName}" not found.`);
      }
    },
    async updateSystemPrompt() {
      debugLog("Updating system prompt...");
      const promptText = await this.getSystemPrompt();
      this.setSystemPrompt(promptText);
    },
    async getSystemPrompt() {
      let systemPrompt = `You are a helpful AI assistant integrated into Zen Browser, a minimal and modern fork of Firefox. Your primary purpose is to answer user questions based on the content of the current webpage.

## Your Instructions:
- Be concise, accurate, and helpful.`;

      if (PREFS.godMode) {
        systemPrompt += await getToolSystemPrompt();
      }

      if (PREFS.citationsEnabled) {
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

      if (!PREFS.godMode) {
        systemPrompt += `
- Strictly base all your answers on the webpage content provided below.
- If the user's question cannot be answered from the content, state that the information is not available on the page.

Here is the initial info about the current page:
`;
        const pageContext = await messageManagerAPI.getPageTextContent(!PREFS.citationsEnabled);
        systemPrompt += JSON.stringify(pageContext);
      }

      return systemPrompt;
    },
    setSystemPrompt(promptText) {
      this.systemInstruction = promptText ? { parts: [{ text: promptText }] } : null;
      return this;
    },

    parseModelResponseText(responseText) {
      let answer = responseText;
      let citations = [];

      if (PREFS.citationsEnabled) {
        try {
          const parsedContent = JSON.parse(responseText);
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
    },

    async sendMessage(prompt, pageContext) {
      await this.updateSystemPrompt();

      const fullPrompt = `[Current Page Context: ${JSON.stringify(pageContext || {})}] ${prompt}`;
      this.history.push({ role: "user", parts: [{ text: fullPrompt }] });
      let requestBody = {
        contents: this.history,
        systemInstruction: this.systemInstruction,
      };
      if (PREFS.citationsEnabled) {
        requestBody.generationConfig = { responseMimeType: "application/json" };
      }

      if (PREFS.godMode) {
        requestBody.tools = toolDeclarations;
      }
      let modelResponse = await this.currentProvider.sendMessage(requestBody);
      if (modelResponse === null) {
        this.history.pop();
        return { answer: "The model did not return a valid response." };
      }
      this.history.push(modelResponse);

      if (PREFS.godMode) {
        modelResponse = await executeToolCalls(this, requestBody, modelResponse);
      }

      if (PREFS.citationsEnabled) {
        const responseText = modelResponse?.parts?.find((part) => part.text)?.text || "";
        const parsedResponse = this.parseModelResponseText(responseText);

        debugLog("Parsed AI Response:", parsedResponse);

        if (!parsedResponse.answer) {
          this.history.pop();
        }
        return parsedResponse;
      } else {
        const responseText = modelResponse?.parts?.find((part) => part.text)?.text || "";
        if (!responseText) {
          this.history.pop();
        }
        return {
          answer: responseText || "I used my tools to complete your request.",
        };
      }
    },
    getHistory() {
      return [...this.history];
    },
    clearData() {
      this.history = [];
      this.setSystemPrompt(null);
    },
    getLastMessage() {
      return this.history.length > 0 ? this.history[this.history.length - 1] : null;
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
        if (window.browserBotFindbar.enabled) window.browserBotFindbar.show();
        else window.browserBotFindbar.destroy();
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
            const maskedKey = "*".repeat(this._currentPrefValues[prefKey].length);
            debugLog(`Saving pref ${prefKey} to: ${maskedKey}`);
          } else {
            debugLog(`Saving pref ${prefKey} to: ${this._currentPrefValues[prefKey]}`);
          }
          PREFS.setPref(prefKey, this._currentPrefValues[prefKey]);
        }
      }
      // Special case: If API key is empty after saving, ensure findbar is collapsed
      if (!llm.currentProvider.apiKey) {
        window.browserBotFindbar.expanded = false;
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
        { label: "Solid Background", pref: PREFS.SOLID_BG },
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

  var markdownStylesInjected = false;
  const injectMarkdownStyles = async () => {
    try {
      const { markedStyles } = await import('chrome://userscripts/content/engine/marked.js');
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
    const content = window.marked ? window.marked.parse(markdown, markedOptions) : markdown;
    let htmlContent = parseElement(`<div class="markdown-body">${content}</div>`);

    return htmlContent;
  }

  PREFS.setInitialPrefs();
  const browserBotfindbar = {
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

    get expanded() {
      return this._isExpanded;
    },
    set expanded(value) {
      const isChanged = value !== this._isExpanded;
      this._isExpanded = value;
      if (!this.findbar) return;
      this.findbar.expanded = value;

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
            <p>Allow the following tools to run: ${toolNames?.join(", ")}?</p>
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
        this.addExpandButton();
        if (PREFS.persistChat) {
          if (this?.findbar?.history) {
            llm.history = this.findbar.history;
            if (
              this?.findbar?.aiStatus &&
              JSON.stringify(this.aiStatus) !== JSON.stringify(this.findbar.aiStatus)
            ) {
              llm.history = [];
              this.findbar.history = [];
            }
          } else llm.history = [];
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
        }, 0);
        setTimeout(() => this.updateFoundMatchesDisplay(), 0);
        this.findbar._findField.removeEventListener("keypress", this._handleInputKeyPress);
        this.findbar._findField.addEventListener("keypress", this._handleInputKeyPress);
        this.findbar._findField.removeEventListener("input", this._handleFindFieldInput);
        this.findbar._findField.addEventListener("input", this._handleFindFieldInput);

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
                () => (this.findbar._findField.placeholder = "Press Alt + Enter to ask AI"),
                100
              );
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

    highlight(word) {
      if (!this.findbar) return;
      this.findbar._find(word);
      setTimeout(() => {
        this.findbar.browser.finder.highlight(false);
      }, 2000);
    },

    show() {
      if (!this.findbar) return false;
      this.findbar.open();
      this.focusInput();
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

    clear() {
      llm.clearData();
      if (this.findbar) {
        this.findbar.history = null;
      }
      const messages = this?.chatContainer?.querySelector("#chat-messages");
      if (messages) messages.innerHTML = "";
    },

    aiStatus: {
      citationsEnabled: PREFS.citationsEnabled,
      godMode: PREFS.godMode,
    },
    updateFindbarStatus() {
      this.aiStatus = {
        godMode: PREFS.godMode,
        citationsEnabled: PREFS.citationsEnabled,
      };
      if (this.findbar) this.findbar.aiStatus = this.aiStatus;
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
      const messagesContainer = this.chatContainer.querySelector("#chat-messages");
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
        this.focusPrompt();
        if (PREFS.persistChat) this.findbar.history = llm.getHistory();
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
      const handleSend = () => this.sendMessage(promptInput.value.trim());
      sendBtn.addEventListener("click", handleSend);
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
      const messageDiv = parseElement(`<div class="chat-message chat-message-loading"></div>`);
      const contentDiv = parseElement(`<div class="message-content">Loading...</div>`);
      messageDiv.appendChild(contentDiv);
      return messageDiv;
    },

    addChatMessage(response, type) {
      const { answer, citations } = response;
      if (!this.chatContainer || !answer) return;
      const messagesContainer = this.chatContainer.querySelector("#chat-messages");
      if (!messagesContainer) return;

      const messageDiv = parseElement(`<div class="chat-message chat-message-${type}"></div>`);
      if (citations && citations.length > 0) {
        messageDiv.dataset.citations = JSON.stringify(citations);
      }

      const contentDiv = parseElement(`<div class="message-content"></div>`);
      const processedContent = answer.replace(
        /\[(\d+)\]/g,
        `<button class="citation-link" data-citation-id="$1">[$1]</button>`
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
        if (PREFS.dndEnabled) this.enableDND();
        const history = llm.getHistory();
        for (const message of history) {
          if (
            message?.role === "tool" ||
            (message?.parts && message?.parts.some((p) => p.functionCall))
          )
            continue;

          const isModel = message?.role === "model";
          const textContent = message?.parts[0]?.text;
          if (!textContent) continue;

          let responsePayload = { answer: "" };

          if (isModel && PREFS.citationsEnabled) {
            responsePayload = llm.parseModelResponseText(textContent);
          } else {
            responsePayload.answer = textContent.replace(/\[Current Page Context:.*?\]\s*/, "");
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
    },
    destroy() {
      this.findbar = null;
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
        button.addEventListener("click", () => this.toggleExpanded());
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

    handleContextMenuPrefChange: function (pref) {
      if (pref.value) this.addContextMenuItem();
      else this.removeContextMenuItem();
    },
    updateContextMenuText() {
      if (!PREFS.contextMenuEnabled) return;
      if (!this.contextMenuItem) return;
      const hasSelection = gContextMenu?.isTextSelected === true;
      this.contextMenuItem.label = hasSelection ? "Ask AI" : "Summarize with AI";
    },

    enableResize() {
      if (!this.findbar) return;
      if (this._resizeHandle) return;
      const resizeHandle = parseElement(`<div class="findbar-resize-handle"></div>`);
      this.findbar.appendChild(resizeHandle);
      this._resizeHandle = resizeHandle;
      this._startResize = this.startResize.bind(this);
      this._resizeHandle.addEventListener("mousedown", this._startResize);
    },

    startResize(e) {
      if (e.button !== 0) return;
      if (!this.findbar) return;
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
      if (!this._isResizing) return;
      if (!this.findbar) return;
      const minWidth = 300;
      const maxWidth = 800;
      const directionFactor = PREFS.position.includes("right") ? -1 : 1;
      let newWidth = this.startWidth + (e.clientX - this._initialMouseCoor.x) * directionFactor;
      newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      this.findbar.style.width = `${newWidth}px`;
    },

    stopResize() {
      this._isResizing = false;
      document.removeEventListener("mousemove", this._handleResize);
      document.removeEventListener("mouseup", this._stopResize);
      this._handleResize = null;
      this._stopResize = null;
    },
    disableResize() {
      this._resizeHandle?.remove();
      this._resizeHandle = null;
      this.stopResize();
    },

    startDrag(e) {
      if (!this.chatContainer) return;
      if (e.button !== 0) return;
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

      if (
        gZenCompactModeManager &&
        !gZenCompactModeManager?.preference &&
        !gZenCompactModeManager.sidebarIsOnRight
      ) {
        newCoors.x -= gZenCompactModeManager.getAndApplySidebarWidth(); // deduct sidebar width if not sidebar is visible on right
      }
      newCoors.x = Math.max(minCoors.x, Math.min(newCoors.x, maxCoors.x));
      newCoors.y = Math.max(minCoors.y, Math.min(newCoors.y, maxCoors.y));

      this.findbar.style.setProperty("left", `${newCoors.x}px`, "important");
      this.findbar.style.setProperty("top", `${newCoors.y}px`, "important");
      this.findbar.style.setProperty("right", "unset", "important");
      this.findbar.style.setProperty("bottom", "unset", "important");
    },

    stopDrag() {
      this._isDragging = false;
      this.snapToClosestCorner();
      this._initialMouseCoor = { x: null, y: null };
      this._initialContainerCoor = { x: null, y: null };
      document.removeEventListener("mouseup", this._stopDrag);
      document.removeEventListener("mousemove", this._handleDrag);
      this._handleDrag = null;
      this._stopDrag = null;
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
      this._handleFindFieldInput = this.updateFoundMatchesDisplay.bind(this);
      const _clearLLMData = () => {
        this.updateFindbarStatus();
        this.clear();
      };
      const _handleContextMenuPrefChange = this.handleContextMenuPrefChange.bind(this);
      const _handleMinimalPrefChange = this.handleMinimalPrefChange.bind(this);

      gBrowser.tabContainer.addEventListener("TabSelect", this._updateFindbar);
      document.addEventListener("keydown", this._addKeymaps);
      this._godModeListener = UC_API.Prefs.addListener(PREFS.GOD_MODE, _clearLLMData);
      this._citationsListener = UC_API.Prefs.addListener(PREFS.CITATIONS_ENABLED, _clearLLMData);
      this._minimalListener = UC_API.Prefs.addListener(PREFS.MINIMAL, _handleMinimalPrefChange);
      this._contextMenuEnabledListener = UC_API.Prefs.addListener(
        PREFS.CONTEXT_MENU_ENABLED,
        _handleContextMenuPrefChange
      );
      this._persistListener = UC_API.Prefs.addListener(PREFS.PERSIST, (pref) => {
        if (!this.findbar) return;
        if (pref.value) this.findbar.history = llm.history;
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
      UC_API.Prefs.removeListener(this._godModeListener);
      UC_API.Prefs.removeListener(this._citationsListener);
      UC_API.Prefs.removeListener(this._contextMenuEnabledListener);
      UC_API.Prefs.removeListener(this._minimalListener);
      UC_API.Prefs.removeListener(this._persistListener);
      UC_API.Prefs.removeListener(this._dndListener);
      this.disableDND();

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
      this._dndListener = null;
    },

    updateFoundMatchesDisplay(retry = 0) {
      if (!this.findbar) return;
      const matches = this.findbar.querySelector(".found-matches");
      const status = this.findbar.querySelector(".findbar-find-status");
      const wrapper = this.findbar.querySelector('hbox[anonid="findbar-textbox-wrapper"]');
      if (!wrapper) {
        if (retry < 10) setTimeout(() => this.updateFoundMatchesDisplay(retry + 1), 100);
        return;
      }
      if (matches && matches.parentElement !== wrapper) wrapper.appendChild(matches);
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
          let normalized = labelValue.replace(/(\d+)\s+of\s+(\d+)(?:\s+match(?:es)?)?/i, "$1/$2");
          newLabel = normalized === "1/1" ? "1/1" : normalized;
        }
        if (labelChild) {
          if (labelChild.getAttribute("value") !== newLabel)
            labelChild.setAttribute("value", newLabel);
          if (labelChild.textContent !== newLabel) labelChild.textContent = newLabel;
        } else {
          if (matches.getAttribute("value") !== newLabel) matches.setAttribute("value", newLabel);
          if (matches.textContent !== newLabel) matches.textContent = newLabel;
        }

        // Disconnect existing observer before creating a new one
        if (this._matchesObserver) this._matchesObserver.disconnect();

        const observer = new MutationObserver(() => this.updateFoundMatchesDisplay());
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

  UC_API.Runtime.startupFinished().then(() => {
    browserBotfindbar.init();
    UC_API.Prefs.addListener(
      PREFS.ENABLED,
      browserBotfindbar.handleEnabledChange.bind(browserBotfindbar)
    );
    window.browserBotFindbar = browserBotfindbar;
  });

}));
