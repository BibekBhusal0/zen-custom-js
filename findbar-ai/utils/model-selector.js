import { createCombobox } from "../../utils/combobox.js";
import { parseElement, escapeXmlAttribute } from "../../utils/parse.js";
import PREFS from "./prefs.js";

export function isDynamicModelProvider(provider) {
  return typeof provider?.refreshModels === "function";
}

function dynamicModelLabel(provider, id) {
  return `${provider.getModelLabel(id)}${provider.isFreeModel(id) ? " (Free)" : ""}`;
}

/**
 * Fetch dynamic models (openrouter, pollinations) into an existing combobox.
 * Free-only filtering mirrors the settings modal: paid lists unlock only when
 * the provided key verifies with paid access.
 */
export async function loadDynamicModels(provider, combo, { getApiKey, isCurrent } = {}) {
  try {
    const fetched = await provider.refreshModels();
    if (isCurrent && !isCurrent()) return [];
    const key = (typeof getApiKey === "function" ? getApiKey() : "") || "";
    let showAll = false;
    if (key && typeof provider.checkKey === "function") {
      try {
        const check = await provider.checkKey(key);
        showAll = check.valid && check.paidAccess !== false;
      } catch (e) {
        PREFS.debugError(`Could not verify key for ${provider.name}:`, e);
        showAll = true;
      }
    }
    const visible = showAll ? fetched : fetched.filter((id) => provider.isFreeModel(id));
    if (isCurrent && !isCurrent()) return [];
    combo.setItems(
      visible.map((id) => ({ value: id, label: dynamicModelLabel(provider, id), image: "" }))
    );
    if (!combo.value && visible.length) combo.value = visible[0];
    PREFS.debugLog(`Loaded ${visible.length} dynamic models for ${provider.name}`);
    return visible;
  } catch (e) {
    PREFS.debugError(`Could not load models for ${provider?.name}:`, e);
    return [];
  }
}

/**
 * Build the model field for a provider, same in settings and first-run setup:
 * dynamic combobox for refreshModels providers, text input for free-text
 * customModel providers, static combobox for fixed model lists.
 */
export function createModelField(
  provider,
  { id = "", value, attrs = {}, getApiKey, isCurrent, onDynamicLoaded } = {}
) {
  const current = value ?? ((provider.modelPref && PREFS.getPref(provider.modelPref)) || "");
  if (isDynamicModelProvider(provider)) {
    const seedItems = current
      ? [{ value: current, label: provider.getModelLabel(current), image: "" }]
      : [];
    const combo = createCombobox({ id, attrs, value: current, items: seedItems });
    loadDynamicModels(provider, combo, { getApiKey, isCurrent }).then((visible) => {
      if (isCurrent && !isCurrent()) return;
      onDynamicLoaded?.(combo, visible);
    });
    return combo;
  }
  if (provider.customModel) {
    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${escapeXmlAttribute(String(val))}"`)
      .join(" ");
    return parseElement(
      `<input type="text" class="zenux-input"${id ? ` id="${id}"` : ""}${attrString ? ` ${attrString}` : ""} value="${escapeXmlAttribute(current || "")}" placeholder="${escapeXmlAttribute(provider.modelPlaceholder || "")}" />`,
      "html"
    );
  }
  const fallback = current || provider.AVAILABLE_MODELS[0] || "";
  return createCombobox({
    id,
    attrs,
    value: fallback,
    items: provider.AVAILABLE_MODELS.map((model) => ({
      value: model,
      label: provider.getModelLabel(model),
      image: "",
    })),
  });
}
