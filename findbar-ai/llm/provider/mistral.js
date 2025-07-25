import { createMistral } from "@ai-sdk/mistral";
import PREFS from "../../utils/prefs.js";

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

export default mistral;
