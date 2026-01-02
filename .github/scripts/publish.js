const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

// Configuration
const MODS_DIR = path.resolve(__dirname, "../../");
const TEMPLATES_DIR = path.join(MODS_DIR, "templates");
const ORG_NAME = "Vertex-Mods";
// const MAIN_REPO = 'BibekBhusal0/zen-custom-js';
// const SINE_STORE_REPO = 'bibekBhusal0/sine-store'; // Use fork for testing
const SINE_STORE_REPO = "sineorg/store"; // Production

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ACTOR = process.env.GITHUB_ACTOR || "github-actions[bot]";

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is missing");
  process.exit(1);
}

// Helper to run shell commands
function run(command, cwd = MODS_DIR) {
  console.log(`Running: ${command} in ${cwd}`);
  try {
    return execSync(command, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (e) {
    console.error(`Command failed: ${command}`);
    console.error(e.stderr);
    throw e;
  }
}

// Helper to make HTTP requests (replaces curl)
function githubRequest(url, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "User-Agent": GITHUB_ACTOR,
        Accept: "application/vnd.github.v3+json",
      },
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
    }

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Some responses might not be JSON or empty
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve(data); // Return raw text if not JSON
          }
        } else {
          // If 404, we might want to handle it specifically, but generally it's an error for the caller
          // Unless checking if repo exists
          if (res.statusCode === 404) {
            reject(new Error("404 Not Found"));
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Helper to configure git
function configureGit() {
  run(`git config --global user.name "${GITHUB_ACTOR}"`);
  run(`git config --global user.email "${GITHUB_ACTOR}@users.noreply.github.com"`);
}

// Get all mod folders
function getModFolders() {
  return fs.readdirSync(MODS_DIR).filter((file) => {
    const fullPath = path.join(MODS_DIR, file);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, "theme.json"));
  });
}

// Helper to get repository name from theme
function getRepoName(theme) {
  if (theme.homepage && theme.homepage.includes("github.com/" + ORG_NAME)) {
    return theme.homepage.split("/").pop();
  }
  // Fallback to name-based generation if homepage is missing or doesn't match ORG_NAME
  return theme.name.replace(/\s+/g, "-");
}

// Check for version changes by comparing with remote
async function getUpdatedMods() {
  const mods = getModFolders();
  const updatedMods = [];

  for (const modFolder of mods) {
    const themePath = path.join(MODS_DIR, modFolder, "theme.json");
    const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));

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
      // Try to fetch the theme.json from the remote repository's target branch
      const remoteThemeUrl = `https://raw.githubusercontent.com/${ORG_NAME}/${repoName}/${branch}/theme.json`;
      console.log(`Checking remote version: ${remoteThemeUrl}`);
      // Use githubRequest instead of curl
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
function buildMod(mod, isBeta) {
  if (mod.theme.js === false) {
    console.log(`Skipping build for ${mod.folder}: js is false`);
    return;
  }

  console.log(`Building ${mod.folder}...`);
  const themeId = mod.theme.id;
  let command = `npx cross-env TARGET=${themeId} rollup -c --bundleConfigAsCjs`;

  if (themeId === "browse-bot") {
    if (isBeta) {
      // Beta: Single bundled file
      command = `npx cross-env TARGET=${themeId} BUILD_TYPE=targeted rollup -c --bundleConfigAsCjs`;
    } else {
      // Stable: Two separate files (default rollup config for browse-bot without BUILD_TYPE)
      command = `npx cross-env TARGET=${themeId} rollup -c --bundleConfigAsCjs`;
    }
  }

  run(command);
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
  buildMod(modData, isBeta);

  // Prepare files
  const workDir = path.join(process.env.RUNNER_TEMP || "/tmp", `${folder}-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  // Copy all files from mod folder (excluding JS source and release-notes)
  const sourceDir = path.join(MODS_DIR, folder);
  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    if (file === "release-notes.md") continue;
    if (file.endsWith(".js") || file.endsWith(".mjs")) continue; // Skip source JS

    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(workDir, file);
    if (fs.statSync(srcPath).isDirectory()) {
      // Recursive copy for subdirectories (like .github if present, or css dirs)
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Copy bundled JS
  if (theme.js !== false) {
    const distDir = path.join(MODS_DIR, "dist");
    if (fs.existsSync(distDir)) {
      const distFiles = fs.readdirSync(distDir);
      for (const file of distFiles) {
        // Filter relevant files
        if (theme.id === "browse-bot") {
          if (isBeta && file === "browse-bot-all.uc.js") {
            fs.copyFileSync(path.join(distDir, file), path.join(workDir, file));
          } else if (!isBeta && (file === "browse-bot.uc.js" || file === "vercel-ai-sdk.uc.js")) {
            fs.copyFileSync(path.join(distDir, file), path.join(workDir, file));
          }
        } else {
          if (file.includes(theme.id.replace(/-/g, "_")) || file.includes(theme.id)) {
            fs.copyFileSync(path.join(distDir, file), path.join(workDir, file));
          }
        }
      }
    }
  }

  // Templates
  const placeholders = {
    MOD_NAME: theme.name,
    MOD_FOLDER: folder,
  };

  const applyTemplate = (templateName, destRelativePath) => {
    const templateContent = fs.readFileSync(path.join(TEMPLATES_DIR, templateName), "utf8");
    const content = templateContent
      .replace(/\{MOD_NAME\}/g, placeholders.MOD_NAME)
      .replace(/\{MOD_FOLDER\}/g, placeholders.MOD_FOLDER);
    const dest = path.join(workDir, destRelativePath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  };

  applyTemplate("CONTRIBUTING.template.md", "CONTRIBUTING.md");
  applyTemplate("config.template.yml", ".github/ISSUE_TEMPLATE/config.yml");
  applyTemplate("pull_request_template.template.md", ".github/pull_request_template.md");
  applyTemplate("close-pull-requests.template.yml", ".github/workflows/close-pull-requests.yml");

  // License
  fs.copyFileSync(path.join(MODS_DIR, "LICENSE"), path.join(workDir, "LICENSE"));

  // Theme.json filtering
  const themeKeys = [
    "id",
    "name",
    "description",
    "author",
    "version",
    "updatedAt",
    "tags",
    "fork",
    "preferences",
    "style",
    "js",
    "readme",
    "image",
    "createdAt",
  ];
  const newTheme = {};
  for (const key of themeKeys) {
    if (theme[key] !== undefined) newTheme[key] = theme[key];
  }

  if (isBeta) {
    if (theme.js !== false) {
      let jsFile = `${theme.id}.uc.js`;
      if (theme.id === "browse-bot") jsFile = "browse-bot-all.uc.js";
      newTheme.js = `https://raw.githubusercontent.com/${ORG_NAME}/${repoName}/${branch}/${jsFile}`;
    }
  } else {
    if (theme.js !== false) {
      newTheme.js = true;
    }
  }
  fs.writeFileSync(path.join(workDir, "theme.json"), JSON.stringify(newTheme, null, 2));

  // README update links
  if (fs.existsSync(path.join(workDir, "README.md"))) {
    let readme = fs.readFileSync(path.join(workDir, "README.md"), "utf8");
    if (isBeta) {
      const warning = `> [!WARNING]\n> This is a beta version and may contain issues. Some bugs and breaking changes are expected.\n\n`;
      readme = warning + readme;
    }
    readme = readme.replace(/\(\.\.\/CONTRIBUTING\.md\)/g, "(./CONTRIBUTING.md)");
    readme = readme.replace(/\(\.\.\/LICENSE\)/g, "(./LICENSE)");
    fs.writeFileSync(path.join(workDir, "README.md"), readme);
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
  run(`git clone ${remoteUrl} ${repoDir}`);

  // Checkout branch
  try {
    run(`git checkout ${branch}`, repoDir);
  } catch {
    run(`git checkout -b ${branch}`, repoDir);
  }

  // Copy files to repoDir
  const repoFiles = fs.readdirSync(repoDir);
  for (const file of repoFiles) {
    if (file === ".git") continue;
    fs.rmSync(path.join(repoDir, file), { recursive: true, force: true });
  }

  fs.cpSync(workDir, repoDir, { recursive: true });

  // Push
  run(`git add .`, repoDir);
  try {
    run(`git commit -m "Update to v${version}"`, repoDir);
    run(`git push origin ${branch}`, repoDir);
  } catch {
    console.log("No changes to commit.");
  }

  // Release
  const releaseNotesPath = path.join(MODS_DIR, folder, "release-notes.md");
  const releaseTemplatePath = path.join(TEMPLATES_DIR, "release-notes.template.md");

  if (fs.existsSync(releaseNotesPath)) {
    const releaseNotes = fs.readFileSync(releaseNotesPath, "utf8").trim();
    let templateContent = "";
    if (fs.existsSync(releaseTemplatePath)) {
      templateContent = fs.readFileSync(releaseTemplatePath, "utf8").trim();
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
      const rawTemplate = fs.existsSync(releaseTemplatePath)
        ? fs.readFileSync(releaseTemplatePath, "utf8")
        : "";
      fs.writeFileSync(releaseNotesPath, rawTemplate);
      run(`git add ${releaseNotesPath}`, MODS_DIR);
      run(`git commit -m "Reset release notes for ${theme.name} v${version}"`, MODS_DIR);
    } else {
      console.log("Release notes empty or match template. Skipping release creation.");
    }
  }

  // Sine Store PR (Stable only, js != false)
  if (!isBeta && theme.js !== false) {
    await createSineStorePR(modData, workDir);
  }
}

async function createSineStorePR(modData, preparedDir) {
  const { folder, theme } = modData;
  console.log(`Creating Sine Store PR for ${folder}...`);

  const storeDir = path.join(process.env.RUNNER_TEMP || "/tmp", `store-${folder}-${Date.now()}`);
  run(
    `git clone https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${SINE_STORE_REPO}.git ${storeDir}`
  );

  const modId = theme.id;
  const storeModDir = path.join(storeDir, "mods", modId);

  if (!fs.existsSync(storeModDir)) {
    console.log(`Mod folder ${modId} does not exist in store. Skipping.`);
    return;
  }

  // Create branch
  const branchName = `update-${modId}-${theme.version}`;
  run(`git checkout -b ${branchName}`, storeDir);

  // Copy bundled files
  if (theme.id === "browse-bot") {
    fs.copyFileSync(
      path.join(preparedDir, "browse-bot.uc.js"),
      path.join(storeModDir, "browse-bot.uc.js")
    );
    fs.copyFileSync(
      path.join(preparedDir, "vercel-ai-sdk.uc.js"),
      path.join(storeModDir, "vercel-ai-sdk.uc.js")
    );
  } else {
    const jsFile = `${theme.id}.uc.js`;
    fs.copyFileSync(path.join(preparedDir, jsFile), path.join(storeModDir, jsFile));
  }

  run(`git add .`, storeDir);
  try {
    run(`git commit -m "Update ${theme.name} to version ${theme.version}"`, storeDir);
    run(`git push origin ${branchName}`, storeDir);

    // Create PR
    const [owner, repo] = SINE_STORE_REPO.split("/");
    const prBody = {
      title: `Update ${theme.name} to version ${theme.version}`,
      body: `Update ${theme.name} to version ${theme.version}\n\n[Vertex-Mods Repository](https://github.com/${ORG_NAME}/${getRepoName(theme)})`,
      head: branchName,
      base: "main",
    };

    await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls`, "POST", prBody);
  } catch (e) {
    console.log("Failed to create PR (maybe no changes or error)", e);
  }
}

// Main
async function main() {
  configureGit();
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
    run(`git push`);
  } catch {
    console.log("Nothing to push to parent repo");
  }
}

main();
