let _originalMaxResults = null;

export const Prefs = {
  KEYS: {
    PREFIX_REQUIRED: "zen-command-palette.prefix-required",
    DEBUG_MODE: "zen-command-palette.debug-mode",
    MAX_COMMANDS: "zen-command-palette.max-commands",
    MAX_COMMANDS_PREFIX: "zen-command-palette.max-commands-prefix",
    MIN_QUERY_LENGTH: "zen-command-palette.min-query-length",
    MIN_SCORE_THRESHOLD: "zen-command-palette.min-score-threshold",
    DYNAMIC_ABOUT_PAGES: "zen-command-palette.dynamic.about-pages",
    DYNAMIC_SEARCH_ENGINES: "zen-command-palette.dynamic.search-engines",
    DYNAMIC_EXTENSIONS: "zen-command-palette.dynamic.extensions",
    DYNAMIC_WORKSPACES: "zen-command-palette.dynamic.workspaces",
    DYNAMIC_SINE_MODS: "zen-command-palette.dynamic.sine-mods",
    DYNAMIC_FOLDERS: "zen-command-palette.dynamic.folders",
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

  get prefixRequired() {
    return this.getPref(this.KEYS.PREFIX_REQUIRED);
  },
  get debugMode() {
    return this.getPref(this.KEYS.DEBUG_MODE);
  },
  get maxCommands() {
    return this.getPref(this.KEYS.MAX_COMMANDS);
  },
  get maxCommandsPrefix() {
    return this.getPref(this.KEYS.MAX_COMMANDS_PREFIX);
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
  get loadFolders() {
    return this.getPref(this.KEYS.DYNAMIC_FOLDERS);
  },

  setTempMaxRichResults(value) {
    if (_originalMaxResults === null) {
      _originalMaxResults = UC_API.Prefs.get("browser.urlbar.maxRichResults")?.value ?? 10;
    }
    UC_API.Prefs.set("browser.urlbar.maxRichResults", value);
  },

  resetTempMaxRichResults() {
    if (_originalMaxResults !== null) {
      UC_API.Prefs.set("browser.urlbar.maxRichResults", _originalMaxResults);
      _originalMaxResults = null;
    }
  },
};

Prefs.defaultValues = {
  [Prefs.KEYS.PREFIX_REQUIRED]: false,
  [Prefs.KEYS.DEBUG_MODE]: false,
  [Prefs.KEYS.MAX_COMMANDS]: 3,
  [Prefs.KEYS.MAX_COMMANDS_PREFIX]: 50,
  [Prefs.KEYS.MIN_QUERY_LENGTH]: 3,
  [Prefs.KEYS.MIN_SCORE_THRESHOLD]: 20,
  [Prefs.KEYS.DYNAMIC_ABOUT_PAGES]: false,
  [Prefs.KEYS.DYNAMIC_SEARCH_ENGINES]: true,
  [Prefs.KEYS.DYNAMIC_EXTENSIONS]: true,
  [Prefs.KEYS.DYNAMIC_WORKSPACES]: true,
  [Prefs.KEYS.DYNAMIC_SINE_MODS]: true,
  [Prefs.KEYS.DYNAMIC_FOLDERS]: true,
};

export const debugLog = (...args) => {
  if (Prefs.debugMode) console.log("zen-command-palette:", ...args);
};

export const debugError = (...args) => {
  if (Prefs.debugMode) console.error("zen-command-palette:", ...args);
};
