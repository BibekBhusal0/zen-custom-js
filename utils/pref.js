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

export class PREFS  {
  defaultValues= {}
  DEBUG_MODE = ""

  getPref(key) {
    return getPref(key, PREFS.defaultValues[key])
  }

  setInitialPrefs() {
    this.migratePrefs();
    for (const [key, value] of Object.entries(PREFS.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  }

  get debugMode() {
    if (!this.DEBUG_MODE) return
    return this.getPref(this.DEBUG_MODE);
  }
  set debugMode(value) {
    if (!this.DEBUG_MODE) return
    setPref(this.DEBUG_MODE, value);
  }
};
