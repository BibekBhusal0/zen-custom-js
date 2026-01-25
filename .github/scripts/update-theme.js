import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

/**
 * Updates updatedAt field in all theme.json files based on git history
 */
function updateThemeFiles() {
  let updatedAny = false;

  // Get all theme.json files
  const result = execSync('find . -name "theme.json" -print0', {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });
  const files = result.split("\0").filter(Boolean);

  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file);
    const dirPath = path.dirname(filePath);

    try {
      // Get git modified date for directory
      const relativeDir = path.relative(ROOT_DIR, dirPath);
      const gitDate = execSync(`git log -1 --format=%ad --date=short -- ${relativeDir}`, {
        cwd: ROOT_DIR,
        encoding: "utf8",
      }).trim();

      if (!gitDate) {
        console.log(`No git history for directory ${dirPath}`);
        continue;
      }

      // Read and parse theme.json
      const originalData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      if (originalData.updatedAt === gitDate) {
        console.log(`Unchanged ${file} — updatedAt already set to ${gitDate}`);
        continue;
      }

      const originalJson = fs.readFileSync(filePath, "utf8");

      // Only change the updatedAt field, preserve original formatting for rest of the file
      const lines = originalJson.split("\n");
      const result = lines
        .map((line) => {
          if (line.trim().startsWith('"updatedAt"')) {
            return '  "updatedAt": "' + gitDate + '",';
          }
          return line;
        })
        .join("\n");

      fs.writeFileSync(filePath, result);

      console.log(`Updated ${file} with date ${gitDate}`);
      updatedAny = true;
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }

  return updatedAny;
}

// Run the function
if (import.meta.url === `file://${process.argv[1]}`) {
  const updated = updateThemeFiles();
  console.log(`Theme files updated: ${updated}`);

  // Set output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `updated=${updated}\n`);
  }
}

export { updateThemeFiles };
