import { setPref } from "../utils/pref.js";
const prefs = [
  {
    name: "zen.view.compact.enable-at-startup",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_transparency_color",
    value: "#00000000",
  },
  {
    name: "extension.search-engine-select.size",
    value: "small",
  },
  {
    name: "mod.sameerasw.zen_bg_opacity",
    value: "0.8",
  },
  {
    name: "zen-command-palette.settings-file-path",
    value: "chrome/sine-mods/zen-custom-js/zen-commands-settings.json",
  },
  {
    name: "extension.search-engine-select.theme",
    value: "dark",
  },
  {
    name: "services.sync.engine.addons",
    value: true,
  },
  {
    name: "services.sync.engine.passwords",
    value: false,
  },
  {
    name: "services.sync.engine.prefs.modified",
    value: false,
  },
  {
    name: "browser.ctrlTab.sortByRecentlyUsed",
    value: true,
  },
  {
    name: "browser.tabs.allow_transparent_browser",
    value: true,
  },
  {
    name: "devtools.chrome.enabled",
    value: true,
  },
  {
    name: "devtools.debugger.remote-enabled",
    value: true,
  },
  {
    name: "devtools.toolbox.host",
    value: "window",
  },
  {
    name: "extension.browse-bot.debug-mode",
    value: true,
  },
  {
    name: "extension.browse-bot.findbar-ai.conform-before-tool-call",
    value: false,
  },
  {
    name: "extension.browse-bot.findbar-ai.max-tool-calls",
    value: 50,
  },
  {
    name: "extension.browse-bot.findbar-ai.minimal",
    value: false,
  },
  {
    name: "extension.browse-bot.findbar-ai.persist-chat",
    value: true,
  },
  {
    name: "extension.search-engine-select.debug-mode",
    value: false,
  },
  {
    name: "extension.sidebar-right",
    value: true,
  },
  {
    name: "extensions.reopen-closed-tabs.debug-mode",
    value: true,
  },
  {
    name: "extensions.reopen-closed-tabs.show-open-tabs",
    value: true,
  },
  {
    name: "extensions.reopen-closed-tabs.show-sync-tabs",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_bg_color_enabled",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_tab_switch_anim",
    value: false,
  },
  {
    name: "mod.sameerasw.zen_trackpad_anim",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_transparent_glance_enabled",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_transparent_sidebar_enabled",
    value: true,
  },
  {
    name: "mod.sameerasw.zen_urlbar_zoom_anim",
    value: true,
  },
  {
    name: "sine.allow-unsafe-js",
    value: true,
  },
  {
    name: "toolkit.legacyUserProfileCustomizations.stylesheets",
    value: true,
  },
  {
    name: "ui.prefersReducedMotion",
    value: 1,
  },
  {
    name: "zen-command-palette.dynamic.about-pages",
    value: false,
  },
  {
    name: "zen-command-palette.dynamic.active-tabs",
    value: false,
  },
  {
    name: "zen-command-palette.dynamic.container-tabs",
    value: true,
  },
  {
    name: "zen-command-palette.dynamic.extension-enable-disable",
    value: false,
  },
  {
    name: "zen-command-palette.dynamic.extension-uninstall",
    value: false,
  },
  {
    name: "zen-command-palette.dynamic.extensions",
    value: true,
  },
  {
    name: "zen-command-palette.dynamic.folders",
    value: true,
  },
  {
    name: "zen-command-palette.dynamic.search-engines",
    value: true,
  },
  {
    name: "zen-command-palette.dynamic.sine-mods",
    value: true,
  },
  {
    name: "zen-command-palette.dynamic.unload-tab",
    value: false,
  },
  {
    name: "zen-command-palette.dynamic.workspaces",
    value: true,
  },
  {
    name: "zen-command-palette.max-commands",
    value: 3,
  },
  {
    name: "zen-command-palette.max-commands-prefix",
    value: 10,
  },
  {
    name: "zen-command-palette.min-query-length",
    value: 3,
  },
  {
    name: "zen-command-palette.min-score-threshold",
    value: 150,
  },
  {
    name: "zen-command-palette.prefix-required",
    value: false,
  },
  {
    name: "zen.glance.animation-duration",
    value: 0,
  },
  {
    name: "zen.tabs.vertical.right-side",
    value: true,
  },
  {
    name: "zen.view.compact.hide-toolbar",
    value: true,
  },
  {
    name: "zen.view.grey-out-inactive-windows",
    value: false,
  },
  {
    name: "zen.view.show-newtab-button-top",
    value: false,
  },
  {
    name: "zen.view.use-single-toolbar",
    value: false,
  },
];

for (const pref of prefs) {
  setPref(pref.name, pref.value);
}
