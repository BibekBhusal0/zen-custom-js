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
    const defaultVal = defaultValue !== undefined ? defaultValue : this.defaultValues[key];
    return getPref(key, defaultVal);
  }

  static setPref(prefKey, value) {
    setPref(prefKey, value);
  }

  static setInitialPrefs() {
    for (const [key, value] of Object.entries(this.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  }

  static get debugMode() {
    if (!this.DEBUG_MODE) return false;
    return this.getPref(this.DEBUG_MODE);
  }

  static set debugMode(value) {
    if (!this.DEBUG_MODE) return;
    this.setPref(this.DEBUG_MODE, value);
  }

  static debugLog(...args) {
    if (this.debugMode) {
      console.log(`${this.MOD_NAME}:`, ...args);
    }
  }

  static debugError(...args) {
    if (this.debugMode) {
      console.error(`${this.MOD_NAME}:`, ...args);
    }
  }
}
