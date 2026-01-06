export function setPref(key, value) {
  try {
    const prefService = Services.prefs;
    if (typeof value === "boolean") {
      prefService.setBoolPref(key, value);
    } else if (typeof value === "number") {
      prefService.setIntPref(key, value);
    } else {
      prefService.setStringPref(key, value);
    }
  } catch {
    //ignore
  }
}

export const getPref = (key, defaultValue) => {
  try {
    const prefService = Services.prefs;
    if (prefService.prefHasUserValue(key)) {
      switch (prefService.getPrefType(key)) {
        case prefService.PREF_STRING:
          return prefService.getStringPref(key);
        case prefService.PREF_INT:
          return prefService.getIntPref(key);
        case prefService.PREF_BOOL:
          return prefService.getBoolPref(key);
      }
    }
  } catch (e) {
    return defaultValue;
  }
  return defaultValue;
};

export const setPrefIfUnset = (key, value) => {
  if (Services.prefs.getPrefType(key) === 0) {
    setPref(key, value);
  }
};

export const resetPref = (key) => {
  if (Services.prefs.getPrefType(key) !== 0) {
    Services.prefs.clearUserPref(key);
  }
};

export function addPrefListener(name, callback) {
  const modified_callback = () => {
    callback({value: getPref(name)});
  };
  Services.prefs.addObserver(name, modified_callback);
  return { name, callback };
}

export function removePrefListener(listener) {
  if (listener && listener.name && listener.callback) {
    Services.prefs.removeObserver(listener.name, listener.callback);
  }
}

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
      setPrefIfUnset(key, value);
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
