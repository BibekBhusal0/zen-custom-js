import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
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

  getModel() {
    const mistralProvider = createMistral({
      apiKey: this.apiKey,
    });
    return mistralProvider(this.model);
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

  getModel() {
    const google = createGoogleGenerativeAI({
      apiKey: this.apiKey,
    });
    return google(this.model);
  },
};

export { mistral, gemini }
