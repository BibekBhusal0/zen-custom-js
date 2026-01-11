import { PREFS as BasePREFS } from "../../utils/pref.js";

let _originalMaxResults = null;

class CommandPalettePREFS extends BasePREFS {
  static MOD_NAME = "zen-command-palette";
  static DEBUG_MODE = "zen-command-palette.debug-mode";

  static PREFIX = "zen-command-palette.prefix";
  static PREFIX_REQUIRED = "zen-command-palette.prefix-required";
  static MAX_COMMANDS = "zen-command-palette.max-commands";
  static MAX_COMMANDS_PREFIX = "zen-command-palette.max-commands-prefix";
  static MIN_QUERY_LENGTH = "zen-command-palette.min-query-length";
  static MIN_SCORE_THRESHOLD = "zen-command-palette.min-score-threshold";
  static DYNAMIC_ABOUT_PAGES = "zen-command-palette.dynamic.about-pages";
  static DYNAMIC_SEARCH_ENGINES = "zen-command-palette.dynamic.search-engines";
  static DYNAMIC_EXTENSIONS = "zen-command-palette.dynamic.extensions";
  static DYNAMIC_WORKSPACES = "zen-command-palette.dynamic.workspaces";
  static DYNAMIC_SINE_MODS = "zen-command-palette.dynamic.sine-mods";
  static DYNAMIC_FOLDERS = "zen-command-palette.dynamic.folders";
  static DYNAMIC_CONTAINER_TABS = "zen-command-palette.dynamic.container-tabs";
  static DYNAMIC_ACTIVE_TABS = "zen-command-palette.dynamic.active-tabs";
  static DYNAMIC_UNLOAD_TABS = "zen-command-palette.dynamic.unload-tab";
  static DYNAMIC_EXTENSION_ENABLE_DISABLE = "zen-command-palette.dynamic.extension-enable-disable";
  static DYNAMIC_EXTENSION_UNINSTALL = "zen-command-palette.dynamic.extension-uninstall";
  static COMMAND_SETTINGS_FILE = "zen-command-palette.settings-file-path";

  static defaultValues = {
    [CommandPalettePREFS.PREFIX_REQUIRED]: false,
    [CommandPalettePREFS.PREFIX]: ":",
    [CommandPalettePREFS.DEBUG_MODE]: false,
    [CommandPalettePREFS.MAX_COMMANDS]: 3,
    [CommandPalettePREFS.MAX_COMMANDS_PREFIX]: 50,
    [CommandPalettePREFS.MIN_QUERY_LENGTH]: 3,
    [CommandPalettePREFS.MIN_SCORE_THRESHOLD]: 150,
    [CommandPalettePREFS.DYNAMIC_ABOUT_PAGES]: false,
    [CommandPalettePREFS.DYNAMIC_SEARCH_ENGINES]: true,
    [CommandPalettePREFS.DYNAMIC_EXTENSIONS]: false,
    [CommandPalettePREFS.DYNAMIC_WORKSPACES]: false,
    [CommandPalettePREFS.DYNAMIC_SINE_MODS]: true,
    [CommandPalettePREFS.DYNAMIC_FOLDERS]: true,
    [CommandPalettePREFS.DYNAMIC_CONTAINER_TABS]: false,
    [CommandPalettePREFS.DYNAMIC_ACTIVE_TABS]: false,
    [CommandPalettePREFS.DYNAMIC_UNLOAD_TABS]: false,
    [CommandPalettePREFS.DYNAMIC_EXTENSION_ENABLE_DISABLE]: false,
    [CommandPalettePREFS.DYNAMIC_EXTENSION_UNINSTALL]: false,
    [CommandPalettePREFS.COMMAND_SETTINGS_FILE]: "chrome/zen-commands-settings.json",
  };

  static get prefix() {
    return this.getPref(this.PREFIX);
  }

  static get prefixRequired() {
    return this.getPref(this.PREFIX_REQUIRED);
  }

  static get maxCommands() {
    return this.getPref(this.MAX_COMMANDS);
  }

  static get maxCommandsPrefix() {
    return this.getPref(this.MAX_COMMANDS_PREFIX);
  }

  static get minQueryLength() {
    return this.getPref(this.MIN_QUERY_LENGTH);
  }

  static get minScoreThreshold() {
    return this.getPref(this.MIN_SCORE_THRESHOLD);
  }

  static get loadAboutPages() {
    return this.getPref(this.DYNAMIC_ABOUT_PAGES);
  }

  static get loadSearchEngines() {
    return this.getPref(this.DYNAMIC_SEARCH_ENGINES);
  }

  static get loadExtensions() {
    return this.getPref(this.DYNAMIC_EXTENSIONS);
  }

  static get loadWorkspaces() {
    return this.getPref(this.DYNAMIC_WORKSPACES);
  }

  static get loadSineMods() {
    return this.getPref(this.DYNAMIC_SINE_MODS);
  }

  static get loadFolders() {
    return this.getPref(this.DYNAMIC_FOLDERS);
  }

  static get loadContainerTabs() {
    return this.getPref(this.DYNAMIC_CONTAINER_TABS);
  }

  static get loadActiveTabs() {
    return this.getPref(this.DYNAMIC_ACTIVE_TABS);
  }

  static get commandSettingsFile() {
    return this.getPref(this.COMMAND_SETTINGS_FILE);
  }

  static setTempMaxRichResults(value) {
    if (_originalMaxResults === null) {
      _originalMaxResults = this.getPref("browser.urlbar.maxRichResults", 10);
    }
    this.setPref("browser.urlbar.maxRichResults", value);
  }

  static resetTempMaxRichResults() {
    if (_originalMaxResults !== null) {
      this.setPref("browser.urlbar.maxRichResults", _originalMaxResults);
      _originalMaxResults = null;
    }
  }
}

export const PREFS = CommandPalettePREFS;
