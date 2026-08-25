import { $ } from "bun";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MODS_DIR = path.resolve(__dirname, "../../");
const TEMPLATES_DIR = path.join(MODS_DIR, "templates");
const ORG_NAME = "Vertex-Mods";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ACTOR = process.env.GITHUB_ACTOR || "github-actions[bot]";

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is missing");
  process.exit(1);
}

// Helper to run shell commands
async function run(command, cwd = MODS_DIR) {
  console.log(`Running: ${command} in ${cwd}`);
  try {
    const result = await $`${{ raw: command }}`.cwd(cwd).quiet().text();
    return result.trim();
  } catch (e) {
    console.error(`Command failed: ${command}`);
    console.error(e.stderr);
    throw e;
  }
}

// Helper to copy directories recursively, excluding JS files and empty folders
async function copyDirectoryExcludingJs(src, dest) {
  if (!existsSync(dest)) {
    await $`mkdir -p ${dest}`;
  }

  const entries = await $`ls -la ${src}`.quiet().text();
  let hasFiles = false;

  for (const entry of entries.trim().split("\n").slice(1)) {
    const parts = entry.trim().split(/\s+/);
    if (parts.length < 9) continue;
    const name = parts.slice(8).join(" ");
    if (name === "." || name === "..") continue;

    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);

    const stat = await $`test -d ${srcPath} && echo dir || echo file`.quiet().text();
    if (stat.trim() === "dir") {
      const subDirHasFiles = await copyDirectoryExcludingJs(srcPath, destPath);
      if (!subDirHasFiles) {
        await $`rm -rf ${destPath}`;
      } else {
        hasFiles = true;
      }
    } else {
      if (name.endsWith(".js") || name.endsWith(".mjs")) continue;
      await $`cp ${srcPath} ${destPath}`;
      hasFiles = true;
    }
  }

  return hasFiles;
}

// Helper to make HTTP requests using fetch (built into Bun)
async function githubRequest(url, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "User-Agent": GITHUB_ACTOR,
      Accept: "application/vnd.github.v3+json",
    },
  };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.text();

  if (res.status >= 200 && res.status < 300) {
    try {
      return data ? JSON.parse(data) : {};
    } catch {
      return data;
    }
  } else {
    if (res.status === 404) {
      throw new Error("404 Not Found");
    } else {
      throw new Error(`Request failed with status ${res.status}: ${data}`);
    }
  }
}

// Helper to configure git
async function configureGit() {
  await run(`git config --global user.name "${GITHUB_ACTOR}"`);
  await run(`git config --global user.email "${GITHUB_ACTOR}@users.noreply.github.com"`);
}

// Get all mod folders
async function getModFolders() {
  const dirs = await $`ls -d ${MODS_DIR}/*/`.quiet().text();
  const allDirs = dirs
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((d) => path.basename(d.trim()));

  const validDirs = [];
  for (const dir of allDirs) {
    if (await Bun.file(path.join(MODS_DIR, dir, "theme.json")).exists()) {
      validDirs.push(dir);
    }
  }
  return validDirs;
}

// Helper to get repository name from theme
function getRepoName(theme) {
  if (theme.homepage && theme.homepage.includes("github.com/" + ORG_NAME)) {
    return theme.homepage.split("/").pop();
  }
  return theme.name.replace(/\s+/g, "-");
}

// Check for version changes by comparing with remote
async function getUpdatedMods() {
  const mods = await getModFolders();
  const updatedMods = [];

  for (const modFolder of mods) {
    const themePath = path.join(MODS_DIR, modFolder, "theme.json");
    const theme = JSON.parse(await Bun.file(themePath).text());

    if (theme.vertex === false) {
      console.log(`Skipping ${modFolder}: vertex is false`);
      continue;
    }

    const repoName = getRepoName(theme);
    const version = theme.version;
    const isBeta = version.endsWith("b");
    const branch = isBeta ? "beta" : "main";

    let remoteVersion = null;
    try {
      const remoteThemeUrl = `https://raw.githubusercontent.com/${ORG_NAME}/${repoName}/${branch}/theme.json`;
      console.log(`Checking remote version: ${remoteThemeUrl}`);
      const remoteTheme = await githubRequest(remoteThemeUrl);
      remoteVersion = remoteTheme.version;
    } catch {
      console.log(
        `Could not fetch remote version for ${repoName} on branch ${branch}. Assuming new mod or branch.`
      );
    }

    if (version !== remoteVersion) {
      console.log(`Mod ${modFolder} needs update: Remote(${remoteVersion}) -> Local(${version})`);
      updatedMods.push({ folder: modFolder, theme, prevVersion: remoteVersion });
    } else {
      console.log(`Mod ${modFolder} is up to date (v${version})`);
    }
  }

  return updatedMods;
}

// Build Mod
async function buildMod(mod) {
  if (!mod.theme.scripts) {
    console.log(`Skipping build for ${mod.folder}: no scripts`);
    return;
  }

  console.log(`Building ${mod.folder}...`);
  const themeId = mod.theme.id;
  const command = `TARGET=${themeId} bun build.js`;

  await run(command);
}

// Process Mod
async function processMod(modData) {
  const { folder, theme } = modData;
  const version = theme.version;
  const isBeta = version.endsWith("b");
  const branch = isBeta ? "beta" : "main";
  const repoName = getRepoName(theme);

  console.log(`Processing ${folder} (v${version}, ${branch})...`);

  // Build
  await buildMod(modData);

  // Prepare files
  const workDir = path.join(process.env.RUNNER_TEMP || "/tmp", `${folder}-${Date.now()}`);
  await $`mkdir -p ${workDir}`;

  // Copy all files from mod folder (excluding JS source and release-notes)
  const sourceDir = path.join(MODS_DIR, folder);
  const files = await $`ls ${sourceDir}`.quiet().text();
  for (const file of files.trim().split("\n").filter(Boolean)) {
    if (file === "release-notes.md") continue;

    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(workDir, file);
    const stat = await $`test -d ${srcPath} && echo dir || echo file`.quiet().text();
    if (stat.trim() === "dir") {
      await copyDirectoryExcludingJs(srcPath, destPath);
    } else {
      if (file.endsWith(".js") || file.endsWith(".mjs")) continue;
      await $`cp ${srcPath} ${destPath}`;
    }
  }

  // Copy bundled JS
  if (theme.scripts) {
    const distDir = path.join(MODS_DIR, "dist");
    if (existsSync(distDir)) {
      const distFiles = await $`ls ${distDir}`.quiet().text();
      for (const file of distFiles.trim().split("\n").filter(Boolean)) {
        const normalizedId = theme.id.replace(/-/g, "_");
        // For browse-bot, also copy the vendor chunk (vercel-ai-sdk)
        if (file.startsWith(`${theme.id}.`) || file.startsWith(`${normalizedId}.`)) {
          await $`cp ${path.join(distDir, file)} ${path.join(workDir, file)}`;
        } else if (theme.id === "browse-bot" && file.startsWith("vercel-ai-sdk")) {
          await $`cp ${path.join(distDir, file)} ${path.join(workDir, file)}`;
        }
      }
    }
  }

  // Templates
  const placeholders = {
    MOD_NAME: theme.name,
    MOD_FOLDER: folder,
  };

  const applyTemplate = async (templateName, destRelativePath) => {
    const templateContent = await Bun.file(path.join(TEMPLATES_DIR, templateName)).text();
    const content = templateContent
      .replace(/\{MOD_NAME\}/g, placeholders.MOD_NAME)
      .replace(/\{MOD_FOLDER\}/g, placeholders.MOD_FOLDER);
    const dest = path.join(workDir, destRelativePath);
    await $`mkdir -p ${path.dirname(dest)}`;
    await Bun.write(dest, content);
  };

  await applyTemplate("CONTRIBUTING.template.md", "CONTRIBUTING.md");
  await applyTemplate("config.template.yml", ".github/ISSUE_TEMPLATE/config.yml");
  await applyTemplate("pull_request_template.template.md", ".github/pull_request_template.md");
  await applyTemplate(
    "close-pull-requests.template.yml",
    ".github/workflows/close-pull-requests.yml"
  );

  // License
  await $`cp ${path.join(MODS_DIR, "LICENSE")} ${path.join(workDir, "LICENSE")}`;

  // Theme.json filtering
  const themeKeys = [
    "id",
    "homepage",
    "name",
    "description",
    "author",
    "version",
    "updatedAt",
    "tags",
    "fork",
    "preferences",
    "style",
    "scripts",
    "readme",
    "image",
    "createdAt",
  ];
  const newTheme = {};
  for (const key of themeKeys) {
    if (theme[key] !== undefined) newTheme[key] = theme[key];
  }

  await Bun.write(path.join(workDir, "theme.json"), JSON.stringify(newTheme, null, 2));

  // README update links
  const readmePath = path.join(workDir, "README.md");
  if (await Bun.file(readmePath).exists()) {
    let readme = await Bun.file(readmePath).text();
    if (isBeta) {
      const warning = `> [!WARNING]\n> This is a beta version and may contain issues. Some bugs and breaking changes are expected.\n\n`;
      readme = warning + readme;
    }
    readme = readme.replace(/\(\.\.\/CONTRIBUTING\.md\)/g, "(./CONTRIBUTING.md)");
    readme = readme.replace(/\(\.\.\/LICENSE\)/g, "(./LICENSE)");
    await Bun.write(readmePath, readme);
  }

  // Publish
  const remoteUrl = `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${ORG_NAME}/${repoName}.git`;

  // Create repo if not exists
  try {
    console.log(`Checking if repo ${repoName} exists...`);
    await githubRequest(`https://api.github.com/repos/${ORG_NAME}/${repoName}`);
  } catch (e) {
    if (e.message.includes("404")) {
      console.log(`Repo ${repoName} does not exist. Creating...`);
      await githubRequest(`https://api.github.com/orgs/${ORG_NAME}/repos`, "POST", {
        name: repoName,
        description: theme.description,
      });
    } else {
      console.error("Error checking/creating repo:", e);
      throw e;
    }
  }

  const repoDir = path.join(process.env.RUNNER_TEMP || "/tmp", `repo-${folder}-${Date.now()}`);
  await run(`git clone ${remoteUrl} ${repoDir}`);

  // Checkout branch
  try {
    await run(`git checkout ${branch}`, repoDir);
  } catch {
    await run(`git checkout -b ${branch}`, repoDir);
  }

  // Copy files to repoDir
  const repoFiles = await $`ls ${repoDir}`.quiet().text();
  for (const file of repoFiles.trim().split("\n").filter(Boolean)) {
    if (file === ".git") continue;
    await $`rm -rf ${path.join(repoDir, file)}`;
  }

  await $`cp -r ${workDir}/* ${repoDir}/`;

  // Push
  await run(`git add .`, repoDir);
  try {
    await run(`git commit -m "Update to v${version}"`, repoDir);
    await run(`git push origin ${branch}`, repoDir);
  } catch {
    console.log("No changes to commit.");
  }

  // Release
  const releaseNotesPath = path.join(MODS_DIR, folder, "release-notes.md");
  const releaseTemplatePath = path.join(TEMPLATES_DIR, "release-notes.template.md");

  if (await Bun.file(releaseNotesPath).exists()) {
    const releaseNotes = (await Bun.file(releaseNotesPath).text()).trim();
    let templateContent = "";
    if (await Bun.file(releaseTemplatePath).exists()) {
      templateContent = (await Bun.file(releaseTemplatePath).text()).trim();
    }

    // Check if release notes has actual content (different from template)
    if (releaseNotes && releaseNotes !== templateContent) {
      console.log("Creating release...");
      const tag = `v${version}`;
      await githubRequest(`https://api.github.com/repos/${ORG_NAME}/${repoName}/releases`, "POST", {
        tag_name: tag,
        name: `${theme.name} ${tag}`,
        body: releaseNotes,
        prerelease: isBeta,
      });

      // Reset release notes in parent
      const rawTemplate = (await Bun.file(releaseTemplatePath).exists())
        ? await Bun.file(releaseTemplatePath).text()
        : "";
      await Bun.write(releaseNotesPath, rawTemplate);
      await run(`git add ${releaseNotesPath}`, MODS_DIR);
      await run(`git commit -m "Reset release notes for ${theme.name} v${version}"`, MODS_DIR);
    } else {
      console.log("Release notes empty or match template. Skipping release creation.");
    }
  }
}

// Main
async function main() {
  await configureGit();
  const updatedMods = await getUpdatedMods();

  if (updatedMods.length === 0) {
    console.log("No updated mods found.");
    return;
  }

  for (const mod of updatedMods) {
    try {
      await processMod(mod);
    } catch (e) {
      console.error(`Failed to process ${mod.folder}`, e);
    }
  }

  // Push changes to parent repo (release notes reset)
  try {
    await run(`git push`);
  } catch {
    console.log("Nothing to push to parent repo");
  }
}

main();
