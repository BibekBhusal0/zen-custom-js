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
// ==/UserScript==

`;

// --- Common Plugins ---
const commonPlugins = [
  resolve({ browser: true }),
  commonjs(),
  string({
    include: "**/*.css",
  }),
];

// --- Individual Configurations ---
const browseBotConfig = {
  input: "findbar-ai/browse-bot.uc.js",
  output: {
    dir: "dist",
    format: "es",
    banner: browseBotHeader,
    manualChunks(id) {
      if (id.includes("node_modules")) {
        // Bundle Vercel AI SDK, Zod, and other AI libs into a vendor chunk
        const vendorPackages = ["@ai-sdk", "ai", "zod", "ollama-ai-provider"];
        if (vendorPackages.some((pkg) => id.includes(pkg))) {
          return "vercel-ai-sdk";
        }
      }
    },
    chunkFileNames: (chunkInfo) => {
      // Remove banner for vercel-ai-sdk chunk
      return chunkInfo.name === "vercel-ai-sdk" 
        ? "vercel-ai-sdk.js" 
        : "[name]-[hash].js";
    },
    entryFileNames: "browse-bot.uc.js",
    banner: (chunkInfo) => {
      return chunkInfo.name !== "vercel-ai-sdk" ? browseBotHeader : "";
    }
  },
  context: "window",
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
      inlineDynamicImports: true,
    },
  ],
  context: "window",
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
      inlineDynamicImports: true,
    },
  ],
  context: "window",
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
  config = [browseBotConfig, commandPaletteConfig, reopenClosedTabsConfig];
}

export default config;
