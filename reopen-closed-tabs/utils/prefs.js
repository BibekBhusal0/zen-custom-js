export const Prefs = {
  DEBUG_MODE: "extensions.reopen-closed-tabs.debug-mode",
  SHORTCUT_KEY: "extensions.reopen-closed-tabs.shortcut-key",
  SHOW_OPEN_TABS: "extensions.reopen-closed-tabs.show-open-tabs",

  defaultValues: {},

  /**
   * Retrieves a preference value.
   * @param {string} key - The preference key.
   * @param {*} [defaultValue=undefined] - The default value to return if the preference is not set.
   * @returns {*} The preference value or the default value.
   */
  getPref(key, defaultValue = undefined) {
    try {
      const pref = UC_API.Prefs.get(key);
      if (!pref) return defaultValue !== undefined ? defaultValue : Prefs.defaultValues[key];
      if (!pref.exists()) return defaultValue !== undefined ? defaultValue : Prefs.defaultValues[key];
      return pref.value;
    } catch (e) {
      console.error(`ReopenClosedTabs Prefs: Error getting pref ${key}:`, e);
      return defaultValue !== undefined ? defaultValue : Prefs.defaultValues[key];
    }
  },

  setPref(prefKey, value) {
    UC_API.Prefs.set(prefKey, value);
  },

  setInitialPrefs() {
    for (const [key, value] of Object.entries(Prefs.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  },

  get debugMode() {
    return this.getPref(this.DEBUG_MODE);
  },
  set debugMode(value) {
    this.setPref(this.DEBUG_MODE, value);
  },

  get shortcutKey() {
    return this.getPref(this.SHORTCUT_KEY);
  },
  set shortcutKey(value) {
    this.setPref(this.SHORTCUT_KEY, value);
  },

  get showOpenTabs() {
    return this.getPref(this.SHOW_OPEN_TABS);
  },
  set showOpenTabs(value) {
    this.setPref(this.SHOW_OPEN_TABS, value);
  },
};

Prefs.defaultValues = {
  [Prefs.DEBUG_MODE]: false,
  [Prefs.SHORTCUT_KEY]: "Alt+A",
  [Prefs.SHOW_OPEN_TABS]: false,
};

export const debugLog = (...args) => {
  if (Prefs.debugMode) {
    console.log("ReopenClosedTabs :", ...args);
  }
};

export const debugError = (...args) => {
  if (Prefs.debugMode) {
    console.error("ReopenClosedTabs :", ...args);
  }
};
