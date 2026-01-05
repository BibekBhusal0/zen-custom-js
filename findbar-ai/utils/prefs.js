import { PREFS as BasePREFS } from "../../utils/pref.js";

class BrowseBotPREFS extends BasePREFS {
  static MOD_NAME = "BrowseBot";
  static DEBUG_MODE = "extension.browse-bot.debug-mode";

  static ENABLED = "extension.browse-bot.findbar-ai.enabled";
  static MINIMAL = "extension.browse-bot.findbar-ai.minimal";
  static PERSIST = "extension.browse-bot.findbar-ai.persist-chat";
  static DND_ENABLED = "extension.browse-bot.findbar-ai.dnd-enabled";
  static POSITION = "extension.browse-bot.findbar-ai.position";
  static REMEMBER_DIMENSIONS = "extension.browse-bot.findbar-ai.remember-dimensions";
  static WIDTH = "extension.browse-bot.findbar-ai.width";
  static STREAM_ENABLED = "extension.browse-bot.findbar-ai.stream-enabled";
  static AGENTIC_MODE = "extension.browse-bot.findbar-ai.agentic-mode";
  static CITATIONS_ENABLED = "extension.browse-bot.findbar-ai.citations-enabled";
  static MAX_TOOL_CALLS = "extension.browse-bot.findbar-ai.max-tool-calls";
  static CONFORMATION = "extension.browse-bot.findbar-ai.conform-before-tool-call";
  static CONTEXT_MENU_ENABLED = "extension.browse-bot.findbar-ai.context-menu-enabled";
  static CONTEXT_MENU_AUTOSEND = "extension.browse-bot.findbar-ai.context-menu-autosend";
  static CONTEXT_MENU_COMMAND_WITH_SELECTION =
    "extension.browse-bot.findbar-ai.context-menu-command-with-selection";
  static CONTEXT_MENU_COMMAND_NO_SELECTION =
    "extension.browse-bot.findbar-ai.context-menu-command-no-selection";
  static BACKGROUND_STYLE = "extension.browse-bot.findbar-ai.background-style";
  static CUSTOM_SYSTEM_PROMPT = "extension.browse-bot.custom-system-prompt";

  static SHORTCUT_FINDBAR = "extension.browse-bot.findbar-ai.shortcut-findbar";
  static SHORTCUT_URLBAR = "extension.browse-bot.urlbar-ai.shortcut-urlbar";

  static URLBAR_AI_ENABLED = "extension.browse-bot.urlbar-ai-enabled";
  static URLBAR_AI_HIDE_SUGGESTIONS = "extension.browse-bot.urlbar-ai.hide-suggestions";
  static URLBAR_AI_ANIMATIONS_ENABLED = "extension.browse-bot.urlbar-ai.animations-enabled";

  static SOLID_BG = "extension.browse-bot.solid-bg";

  static LLM_PROVIDER = "extension.browse-bot.llm-provider";
  static MISTRAL_API_KEY = "extension.browse-bot.mistral-api-key";
  static MISTRAL_MODEL = "extension.browse-bot.mistral-model";
  static GEMINI_API_KEY = "extension.browse-bot.gemini-api-key";
  static GEMINI_MODEL = "extension.browse-bot.gemini-model";
  static OPENAI_API_KEY = "extension.browse-bot.openai-api-key";
  static OPENAI_MODEL = "extension.browse-bot.openai-model";
  static CLAUDE_API_KEY = "extension.browse-bot.claude-api-key";
  static CLAUDE_MODEL = "extension.browse-bot.claude-model";
  static GROK_API_KEY = "extension.browse-bot.grok-api-key";
  static GROK_MODEL = "extension.browse-bot.grok-model";
  static PERPLEXITY_API_KEY = "extension.browse-bot.perplexity-api-key";
  static PERPLEXITY_MODEL = "extension.browse-bot.perplexity-model";
  static CEREBRAS_API_KEY = "extension.browse-bot.cerebras-api-key";
  static CEREBRAS_MODEL = "extension.browse-bot.cerebras-model";
  static OLLAMA_MODEL = "extension.browse-bot.ollama-model";
  static OLLAMA_BASE_URL = "extension.browse-bot.ollama-base-url";

  static LLM_TEMPERATURE = "extension.browse-bot.llm.temperature";
  static LLM_TOP_P = "extension.browse-bot.llm.top-p";
  static LLM_TOP_K = "extension.browse-bot.llm.top-k";
  static LLM_FREQUENCY_PENALTY = "extension.browse-bot.llm.frequency-penalty";
  static LLM_PRESENCE_PENALTY = "extension.browse-bot.llm.presence-penalty";
  static LLM_MAX_OUTPUT_TOKENS = "extension.browse-bot.llm.max-output-tokens";

  // static COPY_BTN_ENABLED = "extension.browse-bot.findbar-ai.copy-btn-enabled";
  // static MARKDOWN_ENABLED = "extension.browse-bot.findbar-ai.markdown-enabled";
  // static SHOW_TOOL_CALL = "extension.browse-bot.findbar-ai.show-tool-call";

  static defaultValues = {
    [BrowseBotPREFS.ENABLED]: true,
    [BrowseBotPREFS.URLBAR_AI_ENABLED]: true,
    [BrowseBotPREFS.URLBAR_AI_HIDE_SUGGESTIONS]: true,
    [BrowseBotPREFS.URLBAR_AI_ANIMATIONS_ENABLED]: true,
    [BrowseBotPREFS.MINIMAL]: true,
    [BrowseBotPREFS.AGENTIC_MODE]: false,
    [BrowseBotPREFS.DEBUG_MODE]: false,
    [BrowseBotPREFS.PERSIST]: false,
    [BrowseBotPREFS.STREAM_ENABLED]: true,
    [BrowseBotPREFS.CITATIONS_ENABLED]: false,
    [BrowseBotPREFS.CONTEXT_MENU_ENABLED]: true,
    [BrowseBotPREFS.CONTEXT_MENU_AUTOSEND]: true,
    [BrowseBotPREFS.CONTEXT_MENU_COMMAND_NO_SELECTION]: "Summarize current page",
    [BrowseBotPREFS.CONTEXT_MENU_COMMAND_WITH_SELECTION]:
      "Explain this in context of current page:\n\n{selection}",
    [BrowseBotPREFS.LLM_PROVIDER]: "gemini",
    [BrowseBotPREFS.MISTRAL_API_KEY]: "",
    [BrowseBotPREFS.MISTRAL_MODEL]: "mistral-medium-latest",
    [BrowseBotPREFS.GEMINI_API_KEY]: "",
    [BrowseBotPREFS.GEMINI_MODEL]: "gemini-2.5-flash",
    [BrowseBotPREFS.OPENAI_API_KEY]: "",
    [BrowseBotPREFS.OPENAI_MODEL]: "gpt-5.2",
    [BrowseBotPREFS.CLAUDE_API_KEY]: "",
    [BrowseBotPREFS.CLAUDE_MODEL]: "claude-4-opus",
    [BrowseBotPREFS.GROK_API_KEY]: "",
    [BrowseBotPREFS.GROK_MODEL]: "grok-4",
    [BrowseBotPREFS.PERPLEXITY_API_KEY]: "",
    [BrowseBotPREFS.PERPLEXITY_MODEL]: "sonar",
    [BrowseBotPREFS.CEREBRAS_API_KEY]: "",
    [BrowseBotPREFS.CEREBRAS_MODEL]: "llama3.1-8b",
    [BrowseBotPREFS.OLLAMA_MODEL]: "llama2",
    [BrowseBotPREFS.OLLAMA_BASE_URL]: "http://localhost:11434/api",
    [BrowseBotPREFS.DND_ENABLED]: true,
    [BrowseBotPREFS.POSITION]: "top-right",
    [BrowseBotPREFS.REMEMBER_DIMENSIONS]: true,
    [BrowseBotPREFS.WIDTH]: 500,
    [BrowseBotPREFS.MAX_TOOL_CALLS]: 5,
    [BrowseBotPREFS.CONFORMATION]: true,
    [BrowseBotPREFS.BACKGROUND_STYLE]: "solid",
    [BrowseBotPREFS.SHORTCUT_FINDBAR]: "ctrl+shift+f",
    [BrowseBotPREFS.SHORTCUT_URLBAR]: "ctrl+space",
    [BrowseBotPREFS.CUSTOM_SYSTEM_PROMPT]: "",
    [BrowseBotPREFS.LLM_TEMPERATURE]: 0.7,
    [BrowseBotPREFS.LLM_TOP_P]: 1.0,
    [BrowseBotPREFS.LLM_TOP_K]: 40,
    [BrowseBotPREFS.LLM_FREQUENCY_PENALTY]: 0.0,
    [BrowseBotPREFS.LLM_PRESENCE_PENALTY]: 0.0,
    [BrowseBotPREFS.LLM_MAX_OUTPUT_TOKENS]: 2048,
  };

  static migratePrefs() {
    const migrationMap = {
      "extension.browse-bot.enabled": this.ENABLED,
      "extension.browse-bot.minimal": this.MINIMAL,
      "extension.browse-bot.persist-chat": this.PERSIST,
      "extension.browse-bot.dnd-enabled": this.DND_ENABLED,
      "extension.browse-bot.position": this.POSITION,
      "extension.browse-bot.stream-enabled": this.STREAM_ENABLED,
      "extension.browse-bot.god-mode": this.AGENTIC_MODE,
      "extension.browse-bot.findbar-god-mode": this.AGENTIC_MODE,
      "extension.browse-bot.citations-enabled": this.CITATIONS_ENABLED,
      "extension.browse-bot.max-tool-calls": this.MAX_TOOL_CALLS,
      "extension.browse-bot.conform-before-tool-call": this.CONFORMATION,
      "extension.browse-bot.context-menu-enabled": this.CONTEXT_MENU_ENABLED,
      "extension.browse-bot.context-menu-autosend": this.CONTEXT_MENU_AUTOSEND,
    };

    for (const [oldKey, newKey] of Object.entries(migrationMap)) {
      try {
        const oldPref = UC_API.Prefs.get(oldKey);
        if (oldPref && oldPref.exists()) {
          const value = oldPref.value;
          this.debugLog(`Migrating pref ${oldKey} to ${newKey} with value: ${value}`);
          UC_API.Prefs.set(newKey, value);
          oldPref.reset();
        }
      } catch (e) {
        this.debugError(`Could not migrate pref ${oldKey}:`, e);
      }
    }
  }

  static get enabled() {
    return this.getPref(this.ENABLED);
  }

  static set enabled(value) {
    this.setPref(this.ENABLED, value);
  }

  static get minimal() {
    return this.getPref(this.MINIMAL);
  }

  static set minimal(value) {
    this.setPref(this.MINIMAL, value);
  }

  static get streamEnabled() {
    return this.getPref(this.STREAM_ENABLED);
  }

  static set streamEnabled(value) {
    this.setPref(this.STREAM_ENABLED, value);
  }

  static set agenticMode(value) {
    this.setPref(this.AGENTIC_MODE, value);
  }

  static get agenticMode() {
    return this.getPref(this.AGENTIC_MODE);
  }

  static get citationsEnabled() {
    return this.getPref(this.CITATIONS_ENABLED);
  }

  static set citationsEnabled(value) {
    this.setPref(this.CITATIONS_ENABLED, value);
  }

  static get contextMenuEnabled() {
    return this.getPref(this.CONTEXT_MENU_ENABLED);
  }

  static set contextMenuEnabled(value) {
    this.setPref(this.CONTEXT_MENU_ENABLED, value);
  }

  static get contextMenuAutoSend() {
    return this.getPref(this.CONTEXT_MENU_AUTOSEND);
  }

  static set contextMenuAutoSend(value) {
    this.setPref(this.CONTEXT_MENU_AUTOSEND, value);
  }

  static get contextMenuCommandWithSelection() {
    return this.getPref(this.CONTEXT_MENU_COMMAND_WITH_SELECTION);
  }

  static set contextMenuCommandWithSelection(value) {
    this.setPref(this.CONTEXT_MENU_COMMAND_WITH_SELECTION, value);
  }

  static get contextMenuCommandNoSelection() {
    return this.getPref(this.CONTEXT_MENU_COMMAND_NO_SELECTION);
  }

  static set contextMenuCommandNoSelection(value) {
    this.setPref(this.CONTEXT_MENU_COMMAND_NO_SELECTION, value);
  }

  static get llmProvider() {
    return this.getPref(this.LLM_PROVIDER);
  }

  static set llmProvider(value) {
    this.setPref(this.LLM_PROVIDER, value);
  }

  static get persistChat() {
    return this.getPref(this.PERSIST);
  }

  static set persistChat(value) {
    this.setPref(this.PERSIST, value);
  }

  static get backgroundStyle() {
    return this.getPref(this.BACKGROUND_STYLE);
  }

  static get pseudoBg() {
    return this.backgroundStyle === "pseudo";
  }

  static get maxToolCalls() {
    return this.getPref(this.MAX_TOOL_CALLS);
  }

  static set maxToolCalls(value) {
    this.setPref(this.MAX_TOOL_CALLS, value);
  }

  // static get copyBtnEnabled() {
  //   return this.getPref(this.COPY_BTN_ENABLED);
  // }
  //
  // static set copyBtnEnabled(value) {
  //   this.setPref(this.COPY_BTN_ENABLED, value);
  // }
  //
  // static get markdownEnabled() {
  //   return this.getPref(this.MARKDOWN_ENABLED);
  // }
  //
  // static set markdownEnabled(value) {
  //   this.setPref(this.MARKDOWN_ENABLED, value);
  // }

  static get conformation() {
    return this.getPref(this.CONFORMATION);
  }

  static set conformation(value) {
    this.setPref(this.CONFORMATION, value);
  }

  // static get showToolCall() {
  //   return this.getPref(this.SHOW_TOOL_CALL);
  // }
  //
  // static set showToolCall(value) {
  //   this.setPref(this.SHOW_TOOL_CALL, value);
  // }

  static get dndEnabled() {
    return this.getPref(this.DND_ENABLED);
  }

  static set dndEnabled(value) {
    this.setPref(this.DND_ENABLED, value);
  }

  static get position() {
    return this.getPref(this.POSITION);
  }

  static set position(value) {
    this.setPref(this.POSITION, value);
  }

  static get rememberDimensions() {
    return this.getPref(this.REMEMBER_DIMENSIONS);
  }

  static set rememberDimensions(value) {
    this.setPref(this.REMEMBER_DIMENSIONS, value);
  }

  static get width() {
    return this.getPref(this.WIDTH);
  }

  static set width(value) {
    this.setPref(this.WIDTH, value);
  }

  static get ollamaBaseUrl() {
    return this.getPref(this.OLLAMA_BASE_URL);
  }

  static set ollamaBaseUrl(value) {
    this.setPref(this.OLLAMA_BASE_URL, value);
  }

  static get llmTemperature() {
    return this.getPref(this.LLM_TEMPERATURE);
  }

  static set llmTemperature(value) {
    this.setPref(this.LLM_TEMPERATURE, value);
  }

  static get llmTopP() {
    return this.getPref(this.LLM_TOP_P);
  }

  static set llmTopP(value) {
    this.setPref(this.LLM_TOP_P, value);
  }

  static get llmTopK() {
    return this.getPref(this.LLM_TOP_K);
  }

  static set llmTopK(value) {
    this.setPref(this.LLM_TOP_K, value);
  }

  static get llmFrequencyPenalty() {
    return this.getPref(this.LLM_FREQUENCY_PENALTY);
  }

  static set llmFrequencyPenalty(value) {
    this.setPref(this.LLM_FREQUENCY_PENALTY, value);
  }

  static get llmPresencePenalty() {
    return this.getPref(this.LLM_PRESENCE_PENALTY);
  }

  static set llmPresencePenalty(value) {
    this.setPref(this.LLM_PRESENCE_PENALTY, value);
  }

  static get llmMaxOutputTokens() {
    return this.getPref(this.LLM_MAX_OUTPUT_TOKENS);
  }

  static set llmMaxOutputTokens(value) {
    this.setPref(this.LLM_MAX_OUTPUT_TOKENS, value);
  }

  static get shortcutFindbar() {
    return this.getPref(this.SHORTCUT_FINDBAR);
  }

  static set shortcutFindbar(value) {
    this.setPref(this.SHORTCUT_FINDBAR, value);
  }

  static get shortcutUrlbar() {
    return this.getPref(this.SHORTCUT_URLBAR);
  }

  static set shortcutUrlbar(value) {
    this.setPref(this.SHORTCUT_URLBAR, value);
  }

  static get customSystemPrompt() {
    return this.getPref(this.CUSTOM_SYSTEM_PROMPT);
  }

  static set customSystemPrompt(value) {
    this.setPref(this.CUSTOM_SYSTEM_PROMPT, value);
  }
}

export const PREFS = BrowseBotPREFS;
export default PREFS;
