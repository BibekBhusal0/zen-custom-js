import { $ } from "bun";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * Combines all preferences.json files from mod directories into a single preferences.json in root
 * Each mod section gets a header with the mod name
 */
async function combinePreferences() {
  const combinedPreferences = [];

  // Get all directories that contain theme.json (these are the mods)
  const modDirs = (await $`ls -d ${ROOT_DIR}/*/theme.json`.quiet())
    .text().split("\n")
    .filter(Boolean)
    .map((p) => path.dirname(p))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  for (const modDir of modDirs) {
    const preferencesPath = path.join(modDir, "preferences.json");
    const themePath = path.join(modDir, "theme.json");

    // Skip if preferences.json doesn't exist
    if (!(await Bun.file(preferencesPath).exists())) {
      console.log(`No preferences.json found in ${path.basename(modDir)}, skipping...`);
      continue;
    }

    let modName = path.basename(modDir);
    if (await Bun.file(themePath).exists()) {
      try {
        const themeData = JSON.parse(await Bun.file(themePath).text());
        modName = themeData.name || path.basename(modDir);
      } catch (e) {
        console.warn(`Could not read theme.json from ${modDir}:`, e.message);
      }
    }

    console.log(`Processing ${modName} from ${modDir}...`);

    // Add section header for the mod
    combinedPreferences.push({
      type: "text",
      label: `**${modName}**`,
      size: "18px",
      margin: "20px 0 10px 0",
    });

    // Read and combine preferences
    try {
      const modPreferences = JSON.parse(await Bun.file(preferencesPath).text());

      if (Array.isArray(modPreferences) && modPreferences.length > 0) {
        combinedPreferences.push(...modPreferences);
      } else {
        console.log(`No preferences to add from ${modDir}`);
      }
    } catch (e) {
      console.error(`Error reading preferences from ${modDir}:`, e.message);
    }

    // spacing between mods
    if (modDir !== modDirs[modDirs.length - 1]) {
      combinedPreferences.push({
        type: "text",
        label: "",
        margin: "30px 0 0 0",
      });
    }
  }

  const outputPath = path.join(ROOT_DIR, "preferences.json");
  await Bun.write(outputPath, JSON.stringify(combinedPreferences, null, 2) + "\n");

  console.log(`Combined preferences written to ${outputPath}`);
  console.log(`Total preferences: ${combinedPreferences.length}`);

  return combinedPreferences;
}

combinePreferences();

export { combinePreferences };