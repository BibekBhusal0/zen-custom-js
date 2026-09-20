import { PREFS } from "./prefs.js";

const DEFAULT_QUICK_SPLIT_KEYWORDS = {
  // Search
  ddg: "https://duckduckgo.com",
  duckduckgo: "https://duckduckgo.com",
  bing: "https://bing.com",
  google: "https://google.com",

  // Google services
  gmail: "https://mail.google.com",
  mail: "https://mail.google.com",
  drive: "https://drive.google.com",
  docs: "https://docs.google.com",
  calendar: "https://calendar.google.com",
  cal: "https://calendar.google.com",
  maps: "https://maps.google.com",

  // AI assistants
  chatgpt: "https://chatgpt.com",
  gpt: "https://chatgpt.com",
  claude: "https://claude.ai",
  gemini: "https://gemini.google.com",
  perplexity: "https://perplexity.ai",
  deepseek: "https://chat.deepseek.com",

  // Social
  reddit: "https://reddit.com",
  x: "https://x.com",
  twitter: "https://x.com",
  instagram: "https://instagram.com",
  ig: "https://instagram.com",
  facebook: "https://facebook.com",
  fb: "https://facebook.com",
  tiktok: "https://tiktok.com",
  linkedin: "https://linkedin.com",

  // Media and streaming
  yt: "https://youtube.com",
  youtube: "https://youtube.com",
  ytmusic: "https://music.youtube.com",
  netflix: "https://netflix.com",
  spotify: "https://open.spotify.com",
  twitch: "https://twitch.tv",
  prime: "https://www.primevideo.com",
  imdb: "https://imdb.com",
  bbc: "https://bbc.com",

  // Shopping
  amazon: "https://amazon.com",
  ebay: "https://ebay.com",

  // Communication
  discord: "https://discord.com",
  whatsapp: "https://web.whatsapp.com",
  telegram: "https://web.telegram.org",
  zoom: "https://zoom.us",

  // Development
  gh: "https://github.com",
  github: "https://github.com",
  so: "https://stackoverflow.com",
  stackoverflow: "https://stackoverflow.com",
  mdn: "https://developer.mozilla.org",
  npm: "https://npmjs.com",
  hn: "https://news.ycombinator.com",

  // Design and docs
  figma: "https://figma.com",
  notion: "https://notion.so",
  canva: "https://canva.com",
  pinterest: "https://pinterest.com",

  // Games
  chess: "https://chess.com",
  lichess: "https://lichess.org",

  // Reference
  wikipedia: "https://wikipedia.org",
  wiki: "https://wikipedia.org",
  w: "https://wikipedia.org",
  apple: "https://apple.com",

  // Zen Browser
  zen: "https://zen-browser.app",
  "zen-mods": "https://zen-browser.app/mods",
  "zen-reddit": "https://reddit.com/zen",
};

const DEFAULTS = {
  hiddenCommands: [],
  customIcons: {},
  customShortcuts: {},
  toolbarButtons: [],
  customCommands: [],
  quickSplitKeywords: { ...DEFAULT_QUICK_SPLIT_KEYWORDS },
};

let _settings = null;

export const Storage = {
  _getFilePath() {
    const relativePath = PREFS.commandSettingsFile;
    if (!relativePath) {
      PREFS.debugError("Settings file path preference is not set.");
      return null;
    }
    try {
      const profileDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
      const file = profileDir.clone();
      // Handle both forward and backslashes in the path
      const pathParts = relativePath.split(/[/\\]/);
      for (const part of pathParts) {
        if (part) file.append(part);
      }
      return file.path;
    } catch (e) {
      PREFS.debugError("Could not construct file path:", e);
      return null;
    }
  },

  async loadSettings() {
    if (_settings) return _settings;

    const path = this._getFilePath();
    if (!path) {
      _settings = { ...DEFAULTS };
      return _settings;
    }

    try {
      if (await IOUtils.exists(path)) {
        const content = await IOUtils.readJSON(path);
        _settings = { ...DEFAULTS, ...content };
        PREFS.debugLog("Command palette settings loaded from", path);
      } else {
        PREFS.debugLog("No settings file found at", path, ". Using defaults.");
        _settings = { ...DEFAULTS };
      }
    } catch (e) {
      PREFS.debugError("Error loading command palette settings:", e);
      _settings = { ...DEFAULTS };
    }
    return _settings;
  },

  async saveSettings(newSettings) {
    const path = this._getFilePath();
    if (!path) {
      PREFS.debugError("Settings file path preference is not set. Cannot save.");
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(newSettings, null, 2));
      await IOUtils.write(path, data, { tmpPath: path + ".tmp" });

      _settings = newSettings;
      PREFS.debugLog("Command palette settings saved to", path);
    } catch (e) {
      PREFS.debugError("Error saving command palette settings:", e);
    }
  },

  getSettings() {
    return _settings || DEFAULTS;
  },

  reset() {
    _settings = null;
  },
};
