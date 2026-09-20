import PREFS from "../utils/prefs.js";
import { googleFaviconAPI } from "../../utils/favicon.js";
import { getCachedApiKey, getSecureApiKey, setSecureApiKey } from "../utils/secure.js";

// Every provider is a key plus an endpoint. Providers on the OpenAI Chat
// Completions protocol share one code path in client.js; only the transport
// kind differs ("openai" full params, "gemini" no penalty params, "anthropic"
// translated via anthropic.js).
const providerPrototype = {
  get apiKey() {
    return getCachedApiKey(this.apiPref);
  },
  set apiKey(v) {
    if (typeof v === "string" && this.apiPref) void setSecureApiKey(this.apiPref, v);
  },
  getApiKeyAsync() {
    return getSecureApiKey(this.apiPref);
  },
  setApiKeyAsync(v) {
    return setSecureApiKey(this.apiPref, v);
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
  async getModelAsync() {
    return {
      kind: this.kind || "openai",
      baseURL: this.baseURL,
      apiKey: await this.getApiKeyAsync(),
      model: this.model,
      ...(this.extraHeaders ? { extraHeaders: this.extraHeaders } : {}),
    };
  },
  getModelLabel(model) {
    return this.AVAILABLE_MODELS_LABELS?.[model] ?? formatModelLabel(model);
  },
};

export function formatModelLabel(modelId) {
  const tokens = String(modelId || "").split("-");
  const suffixTerms = {
    latest: "Latest",
    experimental: "Experimental",
    exp: "Experimental",
    reasoning: "Reasoning",
  };
  let suffix = "";
  if (
    tokens.length > 2 &&
    tokens[tokens.length - 2] === "non" &&
    tokens[tokens.length - 1] === "reasoning"
  ) {
    tokens.splice(-2);
    suffix = " (Non-Reasoning)";
  } else if (tokens.length > 1 && suffixTerms[tokens[tokens.length - 1].toLowerCase()]) {
    suffix = ` (${suffixTerms[tokens.pop().toLowerCase()]})`;
  }
  const words = [];
  for (const token of tokens) {
    const prev = words[words.length - 1];
    if (prev && /^\d+$/.test(prev.raw) && /^\d+$/.test(token)) {
      prev.raw += `.${token}`;
      prev.text = prev.raw;
      continue;
    }
    const lower = token.toLowerCase();
    let text;
    if (lower === "gpt") text = "GPT";
    else if (lower === "oss") text = "OSS";
    else if (lower === "deepseek") text = "DeepSeek";
    else if (/^\d+b$/i.test(token)) text = token.toUpperCase();
    else text = token.charAt(0).toUpperCase() + token.slice(1);
    words.push({ raw: token, text });
  }
  return words.map((word) => word.text).join(" ") + suffix;
}

function chatUrl(base) {
  const clean = String(base || "").replace(/\/+$/, "");
  return clean.endsWith("/chat/completions") ? clean : `${clean}/chat/completions`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
  modelPref: PREFS.PERPLEXITY_MODEL,
  apiPref: PREFS.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai/chat/completions",
});

const cerebras = Object.assign(Object.create(providerPrototype), {
  name: "cerebras",
  label: "Cerebras AI",
  faviconUrl: "https://www.google.com/s2/favicons?sz=32&domain_url=cerebras.ai",
  apiKeyUrl: "https://cerebras.ai",
  AVAILABLE_MODELS: ["gpt-oss-120b", "qwen-3.8-27b"],
  modelPref: PREFS.CEREBRAS_MODEL,
  apiPref: PREFS.CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1/chat/completions",
});

const deepseek = Object.assign(Object.create(providerPrototype), {
  name: "deepseek",
  label: "DeepSeek",
  faviconUrl: googleFaviconAPI("deepseek.com"),
  apiKeyUrl: "https://platform.deepseek.com/api_keys",
  AVAILABLE_MODELS: ["deepseek-v4-flash", "deepseek-v4-pro", "deepseek-v4-flash-vision-exp"],
  modelPref: PREFS.DEEPSEEK_MODEL,
  apiPref: PREFS.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/chat/completions",
});

const openrouter = Object.create(
  providerPrototype,
  Object.getOwnPropertyDescriptors({
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
    isFreeModel(id) {
      return String(id || "").endsWith(":free");
    },
    async checkKey(apiKey) {
      if (!apiKey) return { valid: false };
      const headers = { Authorization: `Bearer ${apiKey}` };
      const keyRes = await fetch("https://openrouter.ai/api/v1/auth/key", { headers });
      if (keyRes.status === 401 || keyRes.status === 403) return { valid: false };
      if (!keyRes.ok) throw new Error(`HTTP ${keyRes.status}`);
      const keyJson = await keyRes.json().catch(() => ({}));
      const creditRes = await fetch("https://openrouter.ai/api/v1/credits", { headers });
      if (!creditRes.ok) throw new Error(`HTTP ${creditRes.status}`);
      const creditJson = await creditRes.json().catch(() => ({}));
      const data = creditJson?.data || {};
      const remaining =
        (data.total_credits ?? data.limit ?? 0) - (data.total_usage ?? data.usage ?? 0);
      return {
        valid: true,
        freeTier: keyJson?.data?.is_free_tier !== false,
        paidAccess: remaining > 0,
      };
    },
    async refreshModels() {
      const json = await fetchJson("https://openrouter.ai/api/v1/models");
      const ids = [...new Set((json?.data || []).map((m) => m?.id).filter(Boolean))];
      ids.sort(
        (a, b) => Number(this.isFreeModel(b)) - Number(this.isFreeModel(a)) || a.localeCompare(b)
      );
      return ids;
    },
    modelPref: PREFS.OPENROUTER_MODEL,
    apiPref: PREFS.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1/chat/completions",
    extraHeaders: {
      "HTTP-Referer": "https://github.com/BibekBhusal0/zen-custom-js",
      "X-Title": "BrowseBot",
    },
  })
);

const pollinations = Object.assign(Object.create(providerPrototype), {
  name: "pollinations",
  label: "Pollinations AI",
  faviconUrl: googleFaviconAPI("pollinations.ai"),
  apiKeyUrl: "https://enter.pollinations.ai/keys",
  noApiKey: true,
  customModel: true,
  modelPlaceholder: "e.g. openai-fast",
  get model() {
    return PREFS.getPref(this.modelPref) || "";
  },
  set model(v) {
    if (typeof v === "string") PREFS.setPref(this.modelPref, v);
  },
  isFreeModel() {
    return true;
  },
  isBalanceExhaustedText(text) {
    const t = String(text || "");
    if (!t) return false;
    if (/doesn'?t have enough credits|budget exhausted|insufficient balance/i.test(t)) return true;
    return (
      /top[- ]?up/i.test(t) &&
      /quest|pollen|pollinations|enter\.pollinations\.ai/i.test(t)
    );
  },
  async refreshModels() {
    if (this.apiKey) {
      try {
        const res = await fetch("https://gen.pollinations.ai/v1/models", {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const ids = [...new Set((json?.data || []).map((m) => m?.id).filter(Boolean))];
        if (ids.length) return ids;
      } catch (e) {
        PREFS.debugError?.("Keyed Pollinations model list failed, falling back:", e);
      }
    }
    const json = await fetchJson("https://text.pollinations.ai/models");
    const ids = [];
    for (const m of Array.isArray(json) ? json : []) {
      if (m?.name) ids.push(m.name);
      for (const alias of m?.aliases || []) ids.push(alias);
    }
    return [...new Set(ids)];
  },
  modelPref: PREFS.POLLINATIONS_MODEL,
  apiPref: PREFS.POLLINATIONS_API_KEY,
  get baseURL() {
    return this.apiKey
      ? "https://gen.pollinations.ai/v1/chat/completions"
      : "https://text.pollinations.ai/openai";
  },
});

const ollama = Object.assign(Object.create(providerPrototype), {
  name: "ollama",
  label: "Ollama (local)",
  faviconUrl: googleFaviconAPI("ollama.com"),
  apiKeyUrl: "",
  noApiKey: true,
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
  getApiKeyAsync() {
    return Promise.resolve("not_required");
  },
});

const custom = Object.create(
  providerPrototype,
  Object.getOwnPropertyDescriptors({
    name: "custom",
    label: "Custom Provider",
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
  pollinations,
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
