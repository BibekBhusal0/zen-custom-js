import { PREFS } from "./prefs.js";

const DEFAULTS = {
  hiddenCommands: [],
  customIcons: {},
  customShortcuts: {},
  toolbarButtons: [],
  customCommands: [],
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
