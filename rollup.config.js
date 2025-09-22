import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { string } from "rollup-plugin-string";

// --- Headers ---
const browseBotHeader = `// ==UserScript==
// @name            BrowseBot
// @description     Transforms the standard Zen Browser findbar into a modern, floating, AI-powered chat interface.
// @author          BibekBhusal
// ==/UserScript==

`;

const commandPaletteHeader = `// ==UserScript==
// @name            Zen Command Palette
// @description     A powerful, extensible command interface for Zen Browser, seamlessly integrated into the URL bar.
// @author          BibekBhusal
// @onlyonce
// ==/UserScript==

`;

const reopenClosedTabsHeader = `// ==UserScript==
// @name            Reopen Closed Tabs
// @description     A popup menu to view and restore recently closed tabs. Includes a toolbar button and keyboard shortcut.
// @author          BibekBhusal
// @onlyonce
// ==/UserScript==

`;

// --- Common Plugins ---
const commonPlugins = [
  resolve(),
  commonjs(),
  string({
    include: "**/*.css",
  }),
];

// --- Individual Configurations ---
const browseBotConfig = {
  input: "findbar-ai/findbar-ai.uc.js",
  output: [
    {
      file: "dist/browse-bot.uc.js",
      format: "umd",
      name: "BrowseBot",
      banner: browseBotHeader,
    },
  ],
  plugins: commonPlugins,
};

const reopenClosedTabsConfig = {
  input: "reopen-closed-tabs/reopen-closed-tabs.uc.js",
  output: [
    {
      file: "dist/reopen-closed-tabs.uc.js",
      format: "umd",
      name: "reopenClosedTabs",
      banner: reopenClosedTabsHeader,
    },
  ],
  plugins: commonPlugins,
};

const commandPaletteConfig = {
  input: "command-palette/command-palette.uc.js",
  output: [
    {
      file: "dist/zen-command-palette.uc.js",
      format: "umd",
      name: "ZenCommandPalette",
      banner: commandPaletteHeader,
    },
  ],
  plugins: commonPlugins,
};

// --- Export Logic ---
const target = process.env.TARGET;
let config;

if (target === "browsebot") {
  config = browseBotConfig;
} else if (target === "palette") {
  config = commandPaletteConfig;
} else if (target === "reopen") {
  config = reopenClosedTabsConfig;
} else {
  // If no target is specified, build all
  config = [browseBotConfig, commandPaletteConfig];
}

export default config;
