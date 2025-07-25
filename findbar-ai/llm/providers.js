import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { xai as createGrok } from "@ai-sdk/xai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { ollama } from "ollama-ai-provider";
import PREFS from "../utils/prefs.js";

const mistral = {
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
  get apiKey() { return PREFS.mistralApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.mistralApiKey = v },
  get model() { return PREFS.mistralModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.mistralModel = v },
  getModel() { return createMistral({ apiKey: this.apiKey })(this.model) }
};

const gemini = {
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
  get apiKey() { return PREFS.geminiApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.geminiApiKey = v },
  get model() { return PREFS.geminiModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.geminiModel = v },
  getModel() { return createGoogleGenerativeAI({ apiKey: this.apiKey })(this.model) }
};

const openai = {
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
    "gpt-4o-audio-preview",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1",
    "o3-mini",
    "o3",
    "o4-mini"
  ],
  AVAILABLE_MODELS_LABELS: {
    "gpt-4.1": "GPT 4.1",
    "gpt-4.1-mini": "GPT 4.1 Mini",
    "gpt-4.1-nano": "GPT 4.1 Nano",
    "gpt-4o": "GPT 4o",
    "gpt-4o-mini": "GPT 4o Mini",
    "gpt-4o-audio-preview": "GPT 4o Audio Preview",
    "gpt-4-turbo": "GPT 4 Turbo",
    "gpt-4": "GPT 4",
    "gpt-3.5-turbo": "GPT 3.5 Turbo",
    "o1": "O1",
    "o3-mini": "O3 Mini",
    "o3": "O3",
    "o4-mini": "O4 Mini",
  },
  modelPref: PREFS.OPENAI_MODEL,
  apiPref: PREFS.OPENAI_API_KEY,
  get apiKey() { return PREFS.openaiApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.openaiApiKey = v },
  get model() { return PREFS.openaiModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.openaiModel = v },
  getModel() { return createOpenAI({ apiKey: this.apiKey })(this.model) }
};

const claude = {
  name: "claude",
  label: "Anthropic Claude",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=anthropic.com",
  apiKeyUrl: "https://console.anthropic.com/api-keys",
  AVAILABLE_MODELS: [
    "claude-4-opus",
    "claude-4-sonnet",
    "claude-4-haiku",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku"
  ],
  AVAILABLE_MODELS_LABELS: {
    "claude-4-opus": "Claude 4 Opus",
    "claude-4-sonnet": "Claude 4 Sonnet",
    "claude-4-haiku": "Claude 4 Haiku",
    "claude-3-opus": "Claude 3 Opus",
    "claude-3-sonnet": "Claude 3 Sonnet",
    "claude-3-haiku": "Claude 3 Haiku"
  },
  modelPref: PREFS.CLAUDE_MODEL,
  apiPref: PREFS.CLAUDE_API_KEY,
  get apiKey() { return PREFS.claudeApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.claudeApiKey = v },
  get model() { return PREFS.claudeModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.claudeModel = v },
  getModel() { return createAnthropic({ apiKey: this.apiKey })(this.model) }
};

const grok = {
  name: "grok",
  label: "xAI Grok",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=x.ai",
  apiKeyUrl: "https://x.ai",
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
    "grok-beta"
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
    "grok-beta": "Grok Beta"
  },
  modelPref: PREFS.GROK_MODEL,
  apiPref: PREFS.GROK_API_KEY,
  get apiKey() { return PREFS.grokApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.grokApiKey = v },
  get model() { return PREFS.grokModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.grokModel = v },
  getModel() { return createGrok({ apiKey: this.apiKey })(this.model) }
};

const perplexity = {
  name: "perplexity",
  label: "Perplexity AI",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=perplexity.ai",
  apiKeyUrl: "https://perplexity.ai",
  AVAILABLE_MODELS: [
    'sonar-deep-research'	,
'sonar-reasoning-pro'	,
'sonar-reasoning'	,
'sonar-pro'	,
'sonar',
  ],
  AVAILABLE_MODELS_LABELS: {
    'sonar-deep-research': 'Sonar Deep Research',
    'sonar-reasoning-pro': 'Sonar Reasoning Pro',
    'sonar-reasoning': 'Sonar Reasoning',
    'sonar-pro': 'Sonar Pro',
    'sonar': 'Sonar',
  },
  modelPref: PREFS.PERPLEXITY_MODEL,
  apiPref: PREFS.PERPLEXITY_API_KEY,
  get apiKey() { return PREFS.perplexityApiKey },
  set apiKey(v) { if (typeof v === "string") PREFS.perplexityApiKey = v },
  get model() { return PREFS.perplexityModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.perplexityModel = v },
  getModel() { return createPerplexity({ apiKey: this.apiKey })(this.model) }
};

const ollamaProvider = {
  name: "ollama",
  label: "Ollama (local)",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=ollama.com/",
  apiKeyUrl: "",
  AVAILABLE_MODELS: ["deepseek-r1","gemma3n","gemma3","qwen3","qwen2.5vl","llama3.1","nomic-embed-text","llama3.2","mistral","qwen2.5","llama3","llava","gemma2","phi3","qwen2.5-coder","gemma","qwen","mxbai-embed-large","qwen2","llama2","phi4","minicpm-v","codellama","tinyllama","llama3.3","llama3.2-vision","mistral-nemo","dolphin3","olmo2","deepseek-v3","bge-m3","qwq","mistral-small","llava-llama3","smollm2","llama2-uncensored","mixtral","starcoder2","deepseek-coder-v2","all-minilm","deepseek-coder","snowflake-arctic-embed","phi","codegemma","dolphin-mixtral","openthinker","llama4","orca-mini","wizardlm2","smollm","dolphin-mistral","dolphin-llama3","codestral","command-r","hermes3","phi3.5","yi","zephyr","phi4-mini","granite3.3","moondream","granite-code","wizard-vicuna-uncensored","starcoder","devstral","magistral","vicuna","openchat","mistral-small3.1","deepcoder","mistral-openorca","phi4-reasoning","codegeex4","deepseek-llm","cogito","deepseek-v2","openhermes","codeqwen","mistral-large","llama2-chinese","aya","granite3.2-vision","tinydolphin","qwen2-math","glm4","stable-code","nous-hermes2","wizardcoder","command-r-plus","bakllava","neural-chat","stablelm2","granite3.2","bge-large","sqlcoder","llama3-chatqa","reflection","wizard-math","snowflake-arctic-embed2","llava-phi3","granite3.1-dense","granite3-dense","llama3-gradient","dbrx","nous-hermes","exaone3.5","samantha-mistral","yi-coder","dolphincoder","nemotron-mini","starling-lm","phind-codellama","solar","xwinlm","falcon","internlm2","deepscaler","athene-v2","nemotron","yarn-llama2","dolphin-phi","llama3-groq-tool-use","wizardlm","opencoder","paraphrase-multilingual","exaone-deep","wizardlm-uncensored","orca2","aya-expanse","smallthinker","falcon3","llama-guard3","granite-embedding","medllama2","nous-hermes2-mixtral","stable-beluga","meditron","granite3-moe","deepseek-v2.5","r1-1776","reader-lm","granite3.1-moe","llama-pro","yarn-mistral","nexusraven","shieldgemma","command-r7b","mathstral","everythinglm","codeup","marco-o1","stablelm-zephyr","tulu3","mistral-small3.2","solar-pro","duckdb-nsql","falcon2","magicoder","phi4-mini-reasoning","mistrallite","codebooga","bespoke-minicheck","wizard-vicuna","nuextract","granite3-guardian","megadolphin","notux","open-orca-platypus2","notus","goliath","command-a","sailor2","firefunction-v2","alfred","command-r7b-arabic"],
  AVAILABLE_MODELS_LABELS: {
  },
  modelPref: PREFS.OLLAMA_MODEL,
  apiPref: PREFS.OLLAMA_API_KEY,
  get apiKey() { return PREFS.ollamaApiKey },
  set apiKey(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.ollamaApiKey = v },
  get model() { return PREFS.ollamaModel },
  set model(v) { if (this.AVAILABLE_MODELS.includes(v)) PREFS.ollamaModel = v },
  getModel() { return ollama(this.model) }
};

export {
  mistral,
  gemini,
  openai,
  claude,
  grok,
  deepseek,
  perplexity,
  ollamaProvider
};

