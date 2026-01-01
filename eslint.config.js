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
        UC_API: "readonly",
        ucAPI: "readonly",
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
      },
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    }
  },
  {
    files: ["rollup.config.js", ".github/scripts/publish.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  prettier,
];