import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import PREFS from "../utils/prefs.js";

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

  getModel() {
    const google = createGoogleGenerativeAI({
      apiKey: this.apiKey,
    });
    return google(this.model);
  },
};

export { mistral, gemini }
