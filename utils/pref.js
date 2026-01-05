export function setPref(prefKey, value) {
  UC_API.Prefs.set(prefKey, value);
}

export const getPref = (key, defaultValue) => {
  try {
    const pref = UC_API.Prefs.get(key);
    if (!pref) return defaultValue;
    if (!pref.exists()) return defaultValue;
    return pref.value;
  } catch {
    return defaultValue;
  }
};

export const setPrefIfUnset = (key, value) => {
  UC_API.Prefs.setIfUnset(key, value);
};

export class PREFS {
  static MOD_NAME = "BasePrefs";
  static DEBUG_MODE = "";

  static defaultValues = {};

  static getPref(key, defaultValue = undefined) {
    const defaultVal = defaultValue !== undefined ? defaultValue : PREFS.defaultValues[key];
    return getPref(key, defaultVal);
  }

  static setPref(prefKey, value) {
    setPref(prefKey, value);
  }

  static setInitialPrefs() {
    this.migratePrefs();
    for (const [key, value] of Object.entries(PREFS.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  }

  static migratePrefs() {}

  static get debugMode() {
    if (!PREFS.DEBUG_MODE) return false;
    return this.getPref(PREFS.DEBUG_MODE);
  }

  static set debugMode(value) {
    if (!PREFS.DEBUG_MODE) return;
    this.setPref(PREFS.DEBUG_MODE, value);
  }

  static debugLog(...args) {
    if (this.debugMode) {
      console.log(`${PREFS.MOD_NAME}:`, ...args);
    }
  }

  static debugError(...args) {
    if (this.debugMode) {
      console.error(`${PREFS.MOD_NAME}:`, ...args);
    }
  }
}
