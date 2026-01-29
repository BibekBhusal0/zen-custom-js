import globals from "globals";
import pluginJs from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/*"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        // Firefox/userscript globals
        gBrowser: "readonly",
        gURLBar: "readonly",
        gZenCompactModeManager: "readonly",
        gZenPinnedTabManager: "readonly",
        gZenViewSplitter: "readonly",
        gZenFolders: "readonly",
        gZenWorkspaces: "readonly",
        gContextMenu: "readonly",
        SineAPI: "readonly",
        openTrustedLinkIn: "readonly",
        switchToTabHavingURI: "readonly",
        BrowserCommands: "readonly",
        BrowserAddonUI: "readonly",
        ContextualIdentityService: "readonly",
        SessionStore: "readonly",
        PlacesUtils: "readonly",
        ChromeUtils: "readonly",
        Components: "readonly",
        Cc: "readonly",
        Ci: "readonly",
        IOUtils: "readonly",
        AddonManager: "readonly",
        Services: "readonly",
        nsKeyShortcutModifiers: "readonly",
        content: "readonly",
        addMessageListener: "readonly",
        sendAsyncMessage: "readonly",
        JSWindowActorChild: "readonly",
        JSWindowActorParent: "readonly",
        TabContextMenu: "readonly",
        gZenUIManager: "readonly",
      },
    },
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-empty": "off",
    },
  },
  {
    files: ["rollup.config.js", ".github/scripts/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  prettier,
];
