import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { xai as createGrok } from "@ai-sdk/xai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { createOllama } from "ollama-ai-provider";
import PREFS from "../utils/prefs.js";

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
    "gpt-5": "GTP 5",
    "gpt-5-mini": "GPT 5 mini",
    "gpt-5-mini": "GPT 5 mini",
    "gpt-5-chat-latest": "GPT 5 latest",
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
    "claude-4-opus",
    "claude-4-sonnet",
    "claude-4-haiku",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
  ],
  AVAILABLE_MODELS_LABELS: {
    "claude-4-opus": "Claude 4 Opus",
    "claude-4-sonnet": "Claude 4 Sonnet",
    "claude-4-haiku": "Claude 4 Haiku",
    "claude-3-opus": "Claude 3 Opus",
    "claude-3-sonnet": "Claude 3 Sonnet",
    "claude-3-haiku": "Claude 3 Haiku",
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
    "grok-2-1212",
    "grok-beta",
  ],
  AVAILABLE_MODELS_LABELS: {
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
    "grok-2-1212": "Grok 2 1212",
    "grok-beta": "Grok Beta",
  },
  modelPref: PREFS.GROK_MODEL,
  apiPref: PREFS.GROK_API_KEY,
  create: createGrok,
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

export { mistral, gemini, openai, claude, grok, perplexity, ollama };
