import { $ } from "bun";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

/**
 * Updates updatedAt field in all theme.json files based on git history
 */
async function updateThemeFiles() {
  let updatedAny = false;

  // Get all theme.json files using Bun's glob
  const files = await $`find . -name "theme.json" -print0`.cwd(ROOT_DIR).quiet().text();
  const fileList = files.split("\0").filter(Boolean);

  for (const file of fileList) {
    const filePath = path.join(ROOT_DIR, file);
    const dirPath = path.dirname(filePath);

    try {
      // Get git modified date for directory
      const relativeDir = path.relative(ROOT_DIR, dirPath);
      const gitDate = await $`git log -1 --format=%ad --date=short -- ${relativeDir}`
        .cwd(ROOT_DIR)
        .quiet()
        .text();
      const trimmedGitDate = gitDate.trim();

      if (!trimmedGitDate) {
        console.log(`No git history for directory ${dirPath}`);
        continue;
      }

      // Read and parse theme.json
      const originalData = JSON.parse(await Bun.file(filePath).text());

      if (originalData.updatedAt === trimmedGitDate) {
        console.log(`Unchanged ${file} — updatedAt already set to ${trimmedGitDate}`);
        continue;
      }

      const originalJson = await Bun.file(filePath).text();

      // Only change the updatedAt field, preserve original formatting for rest of the file
      const lines = originalJson.split("\n");
      const result = lines
        .map((line) => {
          if (line.trim().startsWith('"updatedAt"')) {
            return '  "updatedAt": "' + trimmedGitDate + '",';
          }
          return line;
        })
        .join("\n");

      await Bun.write(filePath, result);

      console.log(`Updated ${file} with date ${trimmedGitDate}`);
      updatedAny = true;
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }

  return updatedAny;
}

// Run the function
if (import.meta.url === `file://${process.argv[1]}`) {
  const updated = await updateThemeFiles();
  console.log(`Theme files updated: ${updated}`);

  // Set output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    await Bun.write(process.env.GITHUB_OUTPUT, `updated=${updated}\n`, { append: true });
  }
}

export { updateThemeFiles };
