import PREFS from "../utils/prefs.js";
import { googleFaviconAPI } from "../../utils/favicon.js";

// Every provider is a key plus an endpoint. Providers on the OpenAI Chat
// Completions protocol share one code path in client.js; only the transport
// kind differs ("openai" full params, "gemini" no penalty params, "anthropic"
// translated via anthropic.js).
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
    if (!this.AVAILABLE_MODELS) {
      if (typeof v === "string" && this.modelPref) PREFS.setPref(this.modelPref, v);
    } else if (this.AVAILABLE_MODELS.includes(v)) {
      PREFS.setPref(this.modelPref, v);
    }
  },
  getModel() {
    return {
      kind: this.kind || "openai",
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      model: this.model,
      ...(this.extraHeaders ? { extraHeaders: this.extraHeaders } : {}),
    };
  },
};

function chatUrl(base) {
  const clean = String(base || "").replace(/\/+$/, "");
  return clean.endsWith("/chat/completions") ? clean : `${clean}/chat/completions`;
}

const mistral = Object.assign(Object.create(providerPrototype), {
  name: "mistral",
  label: "Mistral AI",
  faviconUrl: googleFaviconAPI("mistral.ai"),
  apiKeyUrl: "https://console.mistral.ai/api-keys/",
  AVAILABLE_MODELS: [
    "mistral-large-latest",
    "mistral-medium-latest",
    "mistral-medium-3.5",
    "mistral-small-latest",
    "magistral-medium-latest",
    "codestral-latest",
    "pixtral-large-latest",
    "ministral-8b-latest",
    "ministral-3b-latest",
  ],
  AVAILABLE_MODELS_LABELS: {
    "mistral-large-latest": "Mistral Large (Latest)",
    "mistral-medium-latest": "Mistral Medium (Latest)",
    "mistral-medium-3.5": "Mistral Medium 3.5",
    "mistral-small-latest": "Mistral Small (Latest)",
    "magistral-medium-latest": "Magistral Medium (Latest)",
    "codestral-latest": "Codestral (Latest)",
    "pixtral-large-latest": "Pixtral Large (Latest)",
    "ministral-8b-latest": "Ministral 8B (Latest)",
    "ministral-3b-latest": "Ministral 3B (Latest)",
  },
  modelPref: PREFS.MISTRAL_MODEL,
  apiPref: PREFS.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1/chat/completions",
});

const gemini = Object.assign(Object.create(providerPrototype), {
  name: "gemini",
  label: "Google Gemini",
  faviconUrl: googleFaviconAPI("gemini.google.com"),
  apiKeyUrl: "https://aistudio.google.com/app/apikey",
  kind: "gemini",
  AVAILABLE_MODELS: [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ],
  AVAILABLE_MODELS_LABELS: {
    "gemini-3.8-flash": "Gemini 3.8 Flash",
    "gemini-3.7-flash": "Gemini 3.7 Flash",
    "gemini-3.6-flash": "Gemini 3.6 Flash",
    "gemini-3.5-flash": "Gemini 3.5 Flash",
    "gemini-3.5-flash-lite": "Gemini 3.5 Flash Lite",
    "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
    "gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview",
    "gemini-3-flash-preview": "Gemini 3 Flash Preview",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  },
  modelPref: PREFS.GEMINI_MODEL,
  apiPref: PREFS.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
});

const openai = Object.assign(Object.create(providerPrototype), {
  name: "openai",
  label: "OpenAI GPT",
  faviconUrl: googleFaviconAPI("chatgpt.com"),
  apiKeyUrl: "https://platform.openai.com/account/api-keys",
  AVAILABLE_MODELS: [
    "gpt-6-astra",
    "gpt-5.6",
    "gpt-5.6-sol",
    "gpt-5.6-terra",
    "gpt-5.6-luna",
    "gpt-5.5",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-4o-mini",
  ],
  AVAILABLE_MODELS_LABELS: {
    "gpt-6-astra": "GPT 6 Astra",
    "gpt-5.6": "GPT 5.6",
    "gpt-5.6-sol": "GPT 5.6 Sol",
    "gpt-5.6-terra": "GPT 5.6 Terra",
    "gpt-5.6-luna": "GPT 5.6 Luna",
    "gpt-5.5": "GPT 5.5",
    "gpt-5.4": "GPT 5.4",
    "gpt-5.4-mini": "GPT 5.4 Mini",
    "gpt-5.4-nano": "GPT 5.4 Nano",
    "gpt-5.2": "GPT 5.2",
    "gpt-5.1": "GPT 5.1",
    "gpt-5": "GPT 5",
    "gpt-5-mini": "GPT 5 Mini",
    "gpt-4.1": "GPT 4.1",
    "gpt-4.1-mini": "GPT 4.1 Mini",
    "gpt-4o": "GPT 4o",
    "gpt-4o-mini": "GPT 4o Mini",
  },
  modelPref: PREFS.OPENAI_MODEL,
  apiPref: PREFS.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1/chat/completions",
});

const claude = Object.assign(Object.create(providerPrototype), {
  name: "claude",
  label: "Anthropic Claude",
  faviconUrl: googleFaviconAPI("claude.ai"),
  apiKeyUrl: "https://console.anthropic.com/dashboard",
  kind: "anthropic",
  AVAILABLE_MODELS: [
    "claude-fable-5-1",
    "claude-opus-5",
    "claude-sonnet-5",
    "claude-haiku-4-5",
    "claude-fable-5",
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-opus-4-5",
    "claude-sonnet-4-5",
  ],
  AVAILABLE_MODELS_LABELS: {
    "claude-fable-5-1": "Claude Fable 5.1",
    "claude-opus-5": "Claude Opus 5",
    "claude-sonnet-5": "Claude Sonnet 5",
    "claude-haiku-4-5": "Claude Haiku 4.5",
    "claude-fable-5": "Claude Fable 5",
    "claude-opus-4-8": "Claude Opus 4.8",
    "claude-opus-4-7": "Claude Opus 4.7",
    "claude-opus-4-6": "Claude Opus 4.6",
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
    "claude-opus-4-5": "Claude Opus 4.5",
    "claude-sonnet-4-5": "Claude Sonnet 4.5",
  },
  modelPref: PREFS.CLAUDE_MODEL,
  apiPref: PREFS.CLAUDE_API_KEY,
  get baseURL() {
    return "";
  },
});

const grok = Object.assign(Object.create(providerPrototype), {
  name: "grok",
  label: "xAI Grok",
  faviconUrl: googleFaviconAPI("grok.com"),
  apiKeyUrl: "https://x.ai/api",
  AVAILABLE_MODELS: [
    "grok-4.6",
    "grok-4.5",
    "grok-4.3",
    "grok-4.1-fast",
    "grok-code-fast-1",
    "grok-4.20-0309-reasoning",
    "grok-4.20-0309-non-reasoning",
  ],
  AVAILABLE_MODELS_LABELS: {
    "grok-4.6": "Grok 4.6",
    "grok-4.5": "Grok 4.5",
    "grok-4.3": "Grok 4.3",
    "grok-4.1-fast": "Grok 4.1 Fast",
    "grok-code-fast-1": "Grok Code Fast 1",
    "grok-4.20-0309-reasoning": "Grok 4.20 (Reasoning)",
    "grok-4.20-0309-non-reasoning": "Grok 4.20 (Non-Reasoning)",
  },
  modelPref: PREFS.GROK_MODEL,
  apiPref: PREFS.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1/chat/completions",
});

const perplexity = Object.assign(Object.create(providerPrototype), {
  name: "perplexity",
  label: "Perplexity AI",
  faviconUrl: googleFaviconAPI("perplexity.ai"),
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
  baseURL: "https://api.perplexity.ai/chat/completions",
});

const cerebras = Object.assign(Object.create(providerPrototype), {
  name: "cerebras",
  label: "Cerebras AI",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=cerebras.ai",
  apiKeyUrl: "https://cerebras.ai",
  AVAILABLE_MODELS: ["gpt-oss-120b", "gemma-4-31b"],
  AVAILABLE_MODELS_LABELS: {
    "gpt-oss-120b": "OpenAI GPT OSS 120B",
    "gemma-4-31b": "Gemma 4 31B",
  },
  modelPref: PREFS.CEREBRAS_MODEL,
  apiPref: PREFS.CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1/chat/completions",
});

const deepseek = Object.assign(Object.create(providerPrototype), {
  name: "deepseek",
  label: "DeepSeek",
  faviconUrl: googleFaviconAPI("deepseek.com"),
  apiKeyUrl: "https://platform.deepseek.com/api_keys",
  AVAILABLE_MODELS: ["deepseek-chat", "deepseek-reasoner"],
  AVAILABLE_MODELS_LABELS: {
    "deepseek-chat": "DeepSeek V3 (Chat)",
    "deepseek-reasoner": "DeepSeek R1 (Reasoner)",
  },
  modelPref: PREFS.DEEPSEEK_MODEL,
  apiPref: PREFS.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/chat/completions",
});

const openrouter = Object.assign(Object.create(providerPrototype), {
  name: "openrouter",
  label: "OpenRouter",
  faviconUrl: googleFaviconAPI("openrouter.ai"),
  apiKeyUrl: "https://openrouter.ai/keys",
  customModel: true,
  modelPlaceholder: "e.g. anthropic/claude-opus-4-8",
  get model() {
    return PREFS.getPref(this.modelPref) || "";
  },
  set model(v) {
    if (typeof v === "string") PREFS.setPref(this.modelPref, v);
  },
  modelPref: PREFS.OPENROUTER_MODEL,
  apiPref: PREFS.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1/chat/completions",
  extraHeaders: {
    "HTTP-Referer": "https://github.com/BibekBhusal0/zen-custom-js",
    "X-Title": "BrowseBot",
  },
});

const ollama = Object.assign(Object.create(providerPrototype), {
  name: "ollama",
  label: "Ollama (local)",
  faviconUrl: googleFaviconAPI("ollama.com"),
  apiKeyUrl: "",
  customModel: true,
  modelPlaceholder: "e.g. qwen3:8b",
  baseUrlPref: PREFS.OLLAMA_BASE_URL,
  get baseUrl() {
    return PREFS.ollamaBaseUrl;
  },
  set baseUrl(v) {
    if (typeof v === "string") PREFS.ollamaBaseUrl = v;
  },
  get baseURL() {
    return chatUrl(this.baseUrl.replace(/\/api$/, "/v1"));
  },
  modelPref: PREFS.OLLAMA_MODEL,
  get apiKey() {
    return "not_required";
  },
  set apiKey(v) {
    return;
    // Not required at all
  },
});

const custom = Object.create(
  providerPrototype,
  Object.getOwnPropertyDescriptors({
    name: "custom",
    label: "Custom Provider (OpenAI Compatible)",
    faviconUrl: "chrome://global/skin/icons/settings.svg",
    apiKeyUrl: "",
    customModel: true,
    modelPlaceholder: "e.g. deepseek-chat",
    modelPref: PREFS.CUSTOM_MODEL,
    apiPref: PREFS.CUSTOM_API_KEY,
    get model() {
      return PREFS.getPref(this.modelPref) || "";
    },
    set model(v) {
      if (typeof v === "string") PREFS.setPref(this.modelPref, v);
    },
    get baseURL() {
      return chatUrl(PREFS.getPref(PREFS.CUSTOM_BASE_URL) || "");
    },
  })
);

export {
  mistral,
  gemini,
  openai,
  claude,
  grok,
  perplexity,
  cerebras,
  deepseek,
  openrouter,
  ollama,
  custom,
};
