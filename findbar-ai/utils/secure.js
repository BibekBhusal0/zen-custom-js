import { PREFS } from "./prefs.js";

const ENC_PREFIX = "enc1:";
const _cache = new Map();

function getOSKeyStore() {
  return ChromeUtils.importESModule("resource://gre/modules/OSKeyStore.sys.mjs").OSKeyStore;
}

export function isEncryptedValue(value) {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export function isApiKeyPref(prefKey) {
  return typeof prefKey === "string" && prefKey.endsWith("-api-key");
}

export function getApiKeyPrefs() {
  return [
    PREFS.MISTRAL_API_KEY,
    PREFS.GEMINI_API_KEY,
    PREFS.OPENAI_API_KEY,
    PREFS.CLAUDE_API_KEY,
    PREFS.GROK_API_KEY,
    PREFS.PERPLEXITY_API_KEY,
    PREFS.CEREBRAS_API_KEY,
    PREFS.DEEPSEEK_API_KEY,
    PREFS.OPENROUTER_API_KEY,
    PREFS.POLLINATIONS_API_KEY,
    PREFS.CUSTOM_API_KEY,
  ].filter(Boolean);
}

export function getCachedApiKey(prefKey) {
  if (!prefKey) return "";
  if (_cache.has(prefKey)) return _cache.get(prefKey) || "";
  const raw = PREFS.getPref(prefKey, "");
  if (!raw || isEncryptedValue(raw)) return "";
  return raw;
}

export async function getSecureApiKey(prefKey) {
  if (!prefKey) return "";
  if (_cache.has(prefKey)) return _cache.get(prefKey) || "";
  const raw = PREFS.getPref(prefKey, "");
  if (!raw) {
    _cache.set(prefKey, "");
    return "";
  }
  if (!isEncryptedValue(raw)) {
    _cache.set(prefKey, raw);
    void migratePlaintextKey(prefKey, raw);
    return raw;
  }
  try {
    const decrypted = await getOSKeyStore().decrypt(raw.slice(ENC_PREFIX.length));
    _cache.set(prefKey, decrypted || "");
    return decrypted || "";
  } catch (e) {
    PREFS.debugError(`Could not decrypt API key for ${prefKey}:`, e);
    return "";
  }
}

async function migratePlaintextKey(prefKey, plainValue) {
  if (!plainValue) return;
  try {
    const encrypted = await getOSKeyStore().encrypt(plainValue);
    PREFS.setPref(prefKey, ENC_PREFIX + encrypted);
    PREFS.debugLog(`Migrated plaintext API key to encrypted storage: ${prefKey}`);
  } catch (e) {
    PREFS.debugError(`Could not encrypt API key for ${prefKey}, keeping plaintext:`, e);
  }
}

export async function setSecureApiKey(prefKey, plainValue) {
  if (!prefKey) return;
  const value = typeof plainValue === "string" ? plainValue : "";
  _cache.set(prefKey, value);
  if (!value) {
    PREFS.setPref(prefKey, "");
    return;
  }
  try {
    const encrypted = await getOSKeyStore().encrypt(value);
    PREFS.setPref(prefKey, ENC_PREFIX + encrypted);
  } catch (e) {
    PREFS.debugError(`OSKeyStore unavailable for ${prefKey}, storing plaintext:`, e);
    PREFS.setPref(prefKey, value);
  }
}

export function clearCachedApiKey(prefKey) {
  if (prefKey) _cache.delete(prefKey);
}

export async function ensureApiKeysLoaded() {
  const keys = getApiKeyPrefs();
  await Promise.all(keys.map((key) => getSecureApiKey(key).catch(() => "")));
}
