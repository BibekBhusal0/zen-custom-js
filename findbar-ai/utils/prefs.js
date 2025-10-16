export const PREFS = {
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

export const debugLog = (...args) => {
  if (PREFS.getPref(PREFS.DEBUG_MODE, false)) {
    console.log("BrowseBot :", ...args);
  }
};

export const debugError = (...args) => {
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

export default PREFS;
