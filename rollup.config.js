import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { string } from "rollup-plugin-string";

const header = `// ==UserScript==
// @name            BrowseBot
// @description     Transforms the standard Zen Browser findbar into a modern, floating, AI-powered chat interface.
// @author          BibekBhusal
// ==/UserScript==

`;

export default {
  input: "findbar-ai/findbar-ai.uc.js",
  output: [
    {
      file: "dist/browse-bot.uc.js",
      format: "umd",
      name: "BrowseBot",
      banner: header,
    },
  ],
  context: "window",
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    string({
      include: "**/*.css",
    }),
  ],
};
