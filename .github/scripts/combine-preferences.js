import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * Combines all preferences.json files from mod directories into a single preferences.json in root
 * Each mod section gets a header with the mod name
 */
function combinePreferences() {
  const combinedPreferences = [];

  // Get all directories that contain theme.json (these are the mods)
  const modDirs = fs
    .readdirSync(ROOT_DIR)
    .filter((file) => {
      const fullPath = path.join(ROOT_DIR, file);
      return (
        fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, "theme.json"))
      );
    })
    .sort();

  for (const modDir of modDirs) {
    const preferencesPath = path.join(ROOT_DIR, modDir, "preferences.json");
    const themePath = path.join(ROOT_DIR, modDir, "theme.json");

    // Skip if preferences.json doesn't exist
    if (!fs.existsSync(preferencesPath)) {
      console.log(`No preferences.json found in ${modDir}, skipping...`);
      continue;
    }

    let modName = modDir;
    if (fs.existsSync(themePath)) {
      try {
        const themeData = JSON.parse(fs.readFileSync(themePath, "utf8"));
        modName = themeData.name || modDir;
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
      const modPreferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"));

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
  const jsonString = JSON.stringify(combinedPreferences, null, 2) + "\n";
  fs.writeFileSync(outputPath, jsonString, "utf8");

  console.log(`Combined preferences written to ${outputPath}`);
  console.log(`Total preferences: ${combinedPreferences.length}`);

  return combinedPreferences;
}

combinePreferences();

export { combinePreferences };
