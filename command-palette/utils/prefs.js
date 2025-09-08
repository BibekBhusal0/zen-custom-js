export const Prefs = {
  KEYS: {
    DEBUG_MODE: "zen-command-palette.debug-mode",
    MAX_COMMANDS: "zen-command-palette.max-commands",
    MIN_QUERY_LENGTH: "zen-command-palette.min-query-length",
    MIN_SCORE_THRESHOLD: "zen-command-palette.min-score-threshold",
    DYNAMIC_ABOUT_PAGES: "zen-command-palette.dynamic.about-pages",
    DYNAMIC_SEARCH_ENGINES: "zen-command-palette.dynamic.search-engines",
    DYNAMIC_EXTENSIONS: "zen-command-palette.dynamic.extensions",
    DYNAMIC_WORKSPACES: "zen-command-palette.dynamic.workspaces",
    DYNAMIC_SINE_MODS: "zen-command-palette.dynamic.sine-mods",
  },

  defaultValues: {},

  getPref(key) {
    try {
      const pref = UC_API.Prefs.get(key);
      if (!pref || !pref.exists()) return this.defaultValues[key];
      return pref.value;
    } catch {
      return this.defaultValues[key];
    }
  },

  setPref(prefKey, value) {
    UC_API.Prefs.set(prefKey, value);
  },

  setInitialPrefs() {
    for (const [key, value] of Object.entries(this.defaultValues)) {
      UC_API.Prefs.setIfUnset(key, value);
    }
  },

  get debugMode() {
    return this.getPref(this.KEYS.DEBUG_MODE);
  },
  get maxCommands() {
    return this.getPref(this.KEYS.MAX_COMMANDS);
  },
  get minQueryLength() {
    return this.getPref(this.KEYS.MIN_QUERY_LENGTH);
  },
  get minScoreThreshold() {
    return this.getPref(this.KEYS.MIN_SCORE_THRESHOLD);
  },
  get loadAboutPages() {
    return this.getPref(this.KEYS.DYNAMIC_ABOUT_PAGES);
  },
  get loadSearchEngines() {
    return this.getPref(this.KEYS.DYNAMIC_SEARCH_ENGINES);
  },
  get loadExtensions() {
    return this.getPref(this.KEYS.DYNAMIC_EXTENSIONS);
  },
  get loadWorkspaces() {
    return this.getPref(this.KEYS.DYNAMIC_WORKSPACES);
  },
  get loadSineMods() {
    return this.getPref(this.KEYS.DYNAMIC_SINE_MODS);
  },
};

Prefs.defaultValues = {
  [Prefs.KEYS.DEBUG_MODE]: false,
  [Prefs.KEYS.MAX_COMMANDS]: 3,
  [Prefs.KEYS.MIN_QUERY_LENGTH]: 3,
  [Prefs.KEYS.MIN_SCORE_THRESHOLD]: 20,
  [Prefs.KEYS.DYNAMIC_ABOUT_PAGES]: false,
  [Prefs.KEYS.DYNAMIC_SEARCH_ENGINES]: true,
  [Prefs.KEYS.DYNAMIC_EXTENSIONS]: true,
  [Prefs.KEYS.DYNAMIC_WORKSPACES]: true,
  [Prefs.KEYS.DYNAMIC_SINE_MODS]: true,
};

export const debugLog = (...args) => {
  if (Prefs.debugMode) console.log("zen-command-palette:", ...args);
};

export const debugError = (...args) => {
  if (Prefs.debugMode) console.error("zen-command-palette:", ...args);
};
