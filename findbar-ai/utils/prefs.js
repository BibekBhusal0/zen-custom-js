export const PREFS = {
  ENABLED: "extension.browse-bot.enabled",
  MINIMAL: "extension.browse-bot.minimal",
  PERSIST: "extension.browse-bot.persist-chat",
  DND_ENABLED: "extension.browse-bot.dnd-enabled",
  POSITION: "extension.browse-bot.position",
  DEBUG_MODE: "extension.browse-bot.debug-mode",
  PSEUDO_BG: "extension.pseudo-bg.enabled",

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
  [PREFS.PSEUDO_BG]: false,
  // [PREFS.COPY_BTN_ENABLED]: true,
  // [PREFS.MARKDOWN_ENABLED]: true,
  // [PREFS.SHOW_TOOL_CALL]: false,
};

export default PREFS;
