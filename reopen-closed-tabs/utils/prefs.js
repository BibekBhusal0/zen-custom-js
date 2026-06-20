import { PREFS as BasePREFS } from "../../utils/pref.js";

class ReopenClosedTabsPREFS extends BasePREFS {
  static MOD_NAME = "ReopenClosedTabs";
  static DEBUG_MODE = "extensions.reopen-closed-tabs.debug-mode";
  static SHORTCUT_KEY = "extensions.reopen-closed-tabs.shortcut-key";
  static SHOW_OPEN_TABS = "extensions.reopen-closed-tabs.show-open-tabs";
  static SHOW_SYNC_TABS = "extensions.reopen-closed-tabs.show-sync-tabs";

  static defaultValues = {
    [ReopenClosedTabsPREFS.DEBUG_MODE]: false,
    [ReopenClosedTabsPREFS.SHORTCUT_KEY]: "Alt+A",
    [ReopenClosedTabsPREFS.SHOW_OPEN_TABS]: false,
    [ReopenClosedTabsPREFS.SHOW_SYNC_TABS]: true,
  };

  static get shortcutKey() {
    return this.getPref(this.SHORTCUT_KEY);
  }

  static set shortcutKey(value) {
    this.setPref(this.SHORTCUT_KEY, value);
  }

  static get showOpenTabs() {
    return this.getPref(this.SHOW_OPEN_TABS);
  }

  static set showOpenTabs(value) {
    this.setPref(this.SHOW_OPEN_TABS, value);
  }

  static get showSyncTabs() {
    return this.getPref(this.SHOW_SYNC_TABS);
  }

  static set showSyncTabs(value) {
    this.setPref(this.SHOW_SYNC_TABS, value);
  }
}

export const PREFS = ReopenClosedTabsPREFS;
