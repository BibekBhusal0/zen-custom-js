import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { string } from "rollup-plugin-string";
import fs from "fs";
import path from "path";

// --- Common Plugins ---
const commonPlugins = [
  resolve({ browser: true }),
  commonjs(),
  string({
    include: "**/*.css",
  }),
];

// --- Helper Functions ---
const getSubdirectories = (dir) => {
  return fs.readdirSync(dir).filter((file) => {
    const fullPath = path.join(dir, file);
    return (
      fs.statSync(fullPath).isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== "dist"
    );
  });
};

const createBanner = (themePath, packagePath) => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf-8"));
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

  let banner = `// ==UserScript==
// @name            ${theme.name}
// @description     ${theme.description}
// @author          ${packageJson.author}
// @version         ${theme.version}
// @lastUpdated     ${theme.updatedAt}
`;

  const standardKeys = [
    "id",
    "name",
    "description",
    "author",
    "version",
    "updatedAt",
    "entryFile",
    "tags",
    "fork",
    "homepage",
    "preferences",
    "style",
    "js",
    "readme",
    "image",
    "createdAt",
  ];

  for (const key in theme) {
    if (!standardKeys.includes(key)) {
      banner += `// @${key.padEnd(15)} ${theme[key]}\n`;
    }
  }

  banner += `// ==/UserScript==\n\n`;

  return banner;
};

// --- Generate Configurations ---
const configs = getSubdirectories(process.cwd()).flatMap((dir) => {
  const themePath = path.join(dir, "theme.json");
  const packagePath = "package.json";

  if (fs.existsSync(themePath)) {
    const theme = JSON.parse(fs.readFileSync(themePath, "utf-8"));
    if (!theme.entryFile) return [];

    const banner = createBanner(themePath, packagePath);

    const baseConfig = {
      input: `${dir}/${theme.entryFile}`,
      context: "window",
      plugins: commonPlugins,
      themeId: theme.id,
    };

    const umdConfig = {
      ...baseConfig,
      output: {
        file: `dist/${theme.id}.uc.js`,
        format: "umd",
        name: theme.id.replace(/-/g, "_"),
        banner,
        inlineDynamicImports: true,
      },
    };

    if (theme.id === 'browse-bot') {
      const buildType = process.env.BUILD_TYPE;
      const isTargetedBuild = (buildType === 'dev' || buildType === 'targeted');

      if (isTargetedBuild) {
        return [umdConfig];
      }

      const esmConfig = {
        ...baseConfig,
        output: {
          dir: "dist",
          format: "es",
          banner,
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const vendorPackages = ["@ai-sdk", "ai", "zod", "ollama-ai-provider"];
              if (vendorPackages.some((pkg) => id.includes(pkg))) {
                return "vercel-ai-sdk";
              }
            }
          },
          chunkFileNames: (chunkInfo) => {
            return chunkInfo.name === "vercel-ai-sdk" ? "vercel-ai-sdk.js" : "[name]-[hash].js";
          },
          entryFileNames: "browse-bot.uc.js",
          banner: (chunkInfo) => {
            return chunkInfo.name !== "vercel-ai-sdk" ? banner : "";
          },
        },
      };

      const umdAllConfig = {
        ...baseConfig,
        output: {
          file: `dist/browse-bot-all.uc.js`,
          format: "umd",
          name: "browse_bot_all",
          banner,
          inlineDynamicImports: true,
        },
      };

      return [umdConfig, esmConfig, umdAllConfig];
    }
    
    return [umdConfig];
  }
  return [];
});

// --- Export Logic ---
const target = process.env.TARGET;
let exportConfigs;

if (target) {
  exportConfigs = configs.filter(config => {
    const normalizedTarget = target.replace(/-/g, '');
    const normalizedThemeId = config.themeId.replace(/-/g, '');
    return normalizedThemeId.includes(normalizedTarget);
  });
} else {
  exportConfigs = configs;
}

export default exportConfigs;
