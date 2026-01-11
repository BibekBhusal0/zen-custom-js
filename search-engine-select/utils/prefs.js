import { PREFS as BasePREFS } from "../../utils/pref.js";

class SearchEngineSelectPREFS extends BasePREFS {
  static MOD_NAME = "SearchEngineSelect";
  static DEBUG_MODE = "extension.search-engine-select.debug-mode";
  static ENABLED = "extension.search-engine-select.enabled";
  static REMEMBER_POSITION = "extension.search-engine-select.remember-position";
  static Y_COOR = "extension.search-engine-select.y-coor";

  static defaultValues = {
    [SearchEngineSelectPREFS.DEBUG_MODE]: false,
    [SearchEngineSelectPREFS.ENABLED]: true,
    [SearchEngineSelectPREFS.REMEMBER_POSITION]: true,
    [SearchEngineSelectPREFS.Y_COOR]: "60%",
  };

  static get enabled() {
    return this.getPref(this.ENABLED);
  }

  static set enabled(value) {
    this.setPref(this.ENABLED, value);
  }

  static get rememberPosition() {
    return this.getPref(this.REMEMBER_POSITION);
  }

  static set rememberPosition(value) {
    this.setPref(this.REMEMBER_POSITION, value);
  }

  static get yCoor() {
    return this.getPref(this.Y_COOR);
  }

  static set yCoor(value) {
    this.setPref(this.Y_COOR, value);
  }
}

export const PREFS = SearchEngineSelectPREFS;
