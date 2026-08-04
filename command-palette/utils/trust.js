import { PREFS } from "./prefs.js";

let _cachedTrustKeyHex = null;
let _cachedCryptoKey = null;

function getOSKeyStore() {
  return ChromeUtils.importESModule("resource://gre/modules/OSKeyStore.sys.mjs").OSKeyStore;
}

function generateTrustKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getOrCreateTrustKey() {
  let key = PREFS.commandTrustKey;
  if (key && !/^[0-9a-f]{64}$/.test(key)) {
    try {
      return await getOSKeyStore().decrypt(key, "zen-command-palette");
    } catch (e) {
      PREFS.debugError("Failed to decrypt command trust key:", e);
      key = null;
    }
  }
  if (!key) {
    key = generateTrustKey();
    try {
      PREFS.commandTrustKey = await getOSKeyStore().encrypt(key);
    } catch (e) {
      PREFS.debugError("OSKeyStore unavailable:", e);
      PREFS.commandTrustKey = key;
    }
  }
  return key;
}

export async function hmacCode(str) {
  const keyHex = await getOrCreateTrustKey();
  if (keyHex !== _cachedTrustKeyHex) {
    const keyBytes = new Uint8Array(keyHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
    _cachedCryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    _cachedTrustKeyHex = keyHex;
  }
  const data = new TextEncoder().encode(str);
  const sig = await crypto.subtle.sign("HMAC", _cachedCryptoKey, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
