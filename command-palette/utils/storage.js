import { Prefs, debugError, debugLog } from "./prefs.js";

const DEFAULTS = {
  hiddenCommands: [],
  customIcons: {},
  customShortcuts: {},
};

let _settings = null;

export const Storage = {
  _getFilePath() {
    const relativePath = Prefs.commandSettingsFile;
    if (!relativePath) {
      debugError("Settings file path preference is not set.");
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
      debugError("Could not construct file path:", e);
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
        debugLog("Command palette settings loaded from", path);
      } else {
        debugLog("No settings file found at", path, ". Using defaults.");
        _settings = { ...DEFAULTS };
      }
    } catch (e) {
      debugError("Error loading command palette settings:", e);
      _settings = { ...DEFAULTS };
    }
    return _settings;
  },

  async saveSettings(newSettings) {
    const path = this._getFilePath();
    if (!path) {
      debugError("Settings file path preference is not set. Cannot save.");
      return;
    }

    try {
      const formattedJson = JSON.stringify(newSettings, null, 2);
      await IOUtils.write(path, formattedJson, { encoding: "utf-8", tmpPath: path + ".tmp" });
      _settings = newSettings; 
      debugLog("Command palette settings saved to", path);
    } catch (e) {
      debugError("Error saving command palette settings:", e);
    }
  },

  getSettings() {
    return _settings || DEFAULTS;
  },

  reset() {
    _settings = null;
  },
};
