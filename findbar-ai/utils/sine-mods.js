import { PREFS } from "./prefs.js";

export const BROWSEBOT_REPO_URL = "https://github.com/Vertex-Mods/Browse-Bot";

export function slugify(name) {
  const slug = String(name || "browsebot-mod")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "browsebot-mod";
}

export function browseBotAuthor(modelName) {
  return modelName ? `BrowseBot/${modelName}` : "BrowseBot";
}

export function isBrowseBotAuthor(author) {
  return String(author || "")
    .toLowerCase()
    .includes("browsebot");
}

function profileFile(...parts) {
  const dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
  const file = dir.clone();
  for (const part of parts) if (part) file.append(part);
  return file.path;
}

const sineUtils = () => window.SineAPI?.utils || null;
const sineManager = () => window.SineAPI?.manager || null;

// Falls back to <profile>/chrome/sine-mods when SineAPI is unavailable.
export function getSineModsDir() {
  try {
    const dir = sineUtils()?.modsDir;
    if (typeof dir === "string" && dir) return dir;
  } catch {}
  return profileFile("chrome", "sine-mods");
}

function getModsDataFile() {
  try {
    const file = sineUtils()?.modsDataFile;
    if (typeof file === "string" && file) return file;
  } catch {}
  return `${getSineModsDir()}/mods.json`;
}

function getModFolder(id) {
  try {
    const folder = sineUtils()?.getModFolder?.(id);
    if (typeof folder === "string" && folder) return folder;
  } catch {}
  return `${getSineModsDir()}/${id}`;
}

function legacyModsDir() {
  return profileFile("sine-mods");
}

async function readText(path) {
  if (typeof IOUtils.readUTF8 === "function") return IOUtils.readUTF8(path);
  const bytes = await IOUtils.read(path);
  return new TextDecoder().decode(bytes);
}

async function writeText(path, text) {
  if (typeof IOUtils.writeUTF8 === "function") return IOUtils.writeUTF8(path, String(text ?? ""));
  const data = new TextEncoder().encode(String(text ?? ""));
  return IOUtils.write(path, data, { tmpPath: path + ".tmp" });
}

async function ensureDir(path) {
  try {
    if (typeof IOUtils.makeDirectory === "function") {
      await IOUtils.makeDirectory(path, { createAncestors: true, ignoreExisting: true });
      return;
    }
  } catch {}
  try {
    const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(path);
    if (!file.exists()) file.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
  } catch (e) {
    PREFS.debugError("Could not create mod directory:", e);
    throw e;
  }
}

export async function getInstalledMods() {
  try {
    const mods = await sineUtils()?.getMods?.();
    const count = mods && typeof mods === "object" ? Object.keys(mods).length : 0;
    PREFS.debugLog(`Build: Sine reports ${count} installed mod(s).`);
    return mods && typeof mods === "object" ? mods : {};
  } catch (e) {
    PREFS.debugError("Could not list Sine mods:", e);
    return {};
  }
}

export async function resolveModDir(modId) {
  PREFS.debugLog(`Build: resolving dir for mod "${modId}".`);
  const mods = await getInstalledMods();
  const mod = mods?.[modId];
  for (const key of ["path", "dir", "location", "root", "folder"]) {
    if (mod?.[key] && typeof mod[key] === "string") {
      try {
        if (await IOUtils.exists(mod[key])) {
          PREFS.debugLog(`Build: resolved "${modId}" via metadata key "${key}": ${mod[key]}`);
          return mod[key];
        }
      } catch {}
    }
  }
  const direct = getModFolder(modId);
  try {
    if (await IOUtils.exists(direct)) {
      PREFS.debugLog(`Build: resolved "${modId}" at ${direct}`);
      return direct;
    }
  } catch (e) {
    PREFS.debugLog(`Build: exists check failed for ${direct}:`, e?.message || e);
  }
  try {
    const base = getSineModsDir();
    PREFS.debugLog(`Build: scanning ${base} for theme id "${modId}".`);
    const children = await IOUtils.getChildren(base);
    for (const child of children) {
      try {
        const themePath = `${child}/theme.json`;
        if (!(await IOUtils.exists(themePath))) continue;
        const theme = JSON.parse(await readText(themePath));
        if (theme?.id === modId) {
          PREFS.debugLog(`Build: resolved "${modId}" via theme.json scan: ${child}`);
          return child;
        }
      } catch {}
    }
  } catch (e) {
    PREFS.debugError("Could not scan sine-mods dir:", e);
  }
  PREFS.debugLog(`Build: no existing dir for "${modId}", returning ${direct}`);
  return direct;
}

const AGENT_DOCS = [
  "AGENTS.override.md",
  "AGENTS.md",
  "AGENT.md",
  "CLAUDE.md",
  "GEMINI.md",
  "CODEX.md",
];

const READABLE_FILES = [
  "theme.json",
  "index.js",
  "style.css",
  "README.md",
  ...AGENT_DOCS,
  "preferences.json",
];

export async function readModFiles(modId, files = ["theme.json"]) {
  const dir = await resolveModDir(modId);
  const out = { modId, dir, files: {} };
  let wanted = files.includes("all") ? [...READABLE_FILES] : [...files];
  for (const file of wanted) {
    const path = `${dir}/${file}`;
    try {
      if (!(await IOUtils.exists(path))) {
        out.files[file] = null;
        continue;
      }
      const text = await readText(path);
      out.files[file] = text.length > 12000 ? text.slice(0, 12000) + "\n\n[Truncated.]" : text;
    } catch (e) {
      out.files[file] = `[Read error: ${e?.message || e}]`;
    }
  }
  try {
    const themeText = out.files["theme.json"];
    if (typeof themeText === "string" && !themeText.startsWith("[Read error")) {
      const theme = JSON.parse(themeText);
      const discovered = [
        ...Object.keys(theme?.scripts || {}),
        theme?.style?.chrome,
        theme?.style?.content,
      ].filter((f) => typeof f === "string" && !(f in out.files));
      for (const file of discovered) {
        try {
          if (!(await IOUtils.exists(`${dir}/${file}`))) continue;
          const text = await readText(`${dir}/${file}`);
          out.files[file] = text.length > 12000 ? text.slice(0, 12000) + "\n\n[Truncated.]" : text;
        } catch {}
      }
    }
  } catch {}
  if (out.files["theme.json"]) {
    for (const doc of AGENT_DOCS) {
      if (doc in out.files) continue;
      try {
        const docPath = `${dir}/${doc}`;
        if (await IOUtils.exists(docPath)) {
          const text = await readText(docPath);
          out.files[doc] = text.length > 8000 ? text.slice(0, 8000) + "\n\n[Truncated.]" : text;
          break;
        }
      } catch {}
    }
  }
  return out;
}

function themeTemplate({ id, name, description, author, hasJS }) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    name,
    description: description || `${name} - created with BrowseBot.`,
    homepage: BROWSEBOT_REPO_URL,
    style: { chrome: "style.css" },
    ...(hasJS
      ? { scripts: { [`${id}.uc.js`]: { include: ["chrome://browser/content/browser.xhtml"] } } }
      : {}),
    author,
    version: "1.0.0",
    tags: ["browsebot"],
    createdAt: today,
    updatedAt: today,
    fork: ["zen"],
  };
}

function readmeTemplate({ name, description, author, hasJS, scriptFile }) {
  const files = [
    "- `theme.json` - mod metadata (id, version, author)",
    ...(hasJS
      ? [
          `- \`${scriptFile}\` - browser-chrome JavaScript (filename must match the \`scripts\` key in theme.json)`,
        ]
      : []),
    "- `style.css` - browser-chrome CSS",
  ].join("\n");
  return `# ${name}\n\n${description || "A Zen Browser mod created with BrowseBot."}\n\n> Made with [BrowseBot](${BROWSEBOT_REPO_URL}) (${author}).\n\n## Files\n\n${files}\n\n## Development\n\nEdit the files, then rebuild/reload Sine mods to apply changes.\n`;
}

async function writeJSON(path, obj) {
  if (typeof IOUtils.writeJSON === "function") return IOUtils.writeJSON(path, obj);
  return writeText(path, JSON.stringify(obj, null, 2) + "\n");
}

// Sine ignores mod folders missing from mods.json, so creating registers too.
async function registerModInSine(theme) {
  const modsFile = getModsDataFile();
  let mods = {};
  try {
    if (await IOUtils.exists(modsFile)) mods = (await IOUtils.readJSON(modsFile)) || {};
  } catch (e) {
    PREFS.debugLog(`Build: could not read ${modsFile}, starting fresh:`, e?.message || e);
  }
  const prev = mods[theme.id] || {};
  mods[theme.id] = {
    ...theme,
    enabled: typeof prev.enabled === "boolean" ? prev.enabled : true,
    "no-updates": true,
  };
  PREFS.debugLog(
    `Build: registering "${theme.id}" in ${modsFile} (enabled: ${mods[theme.id].enabled}).`
  );
  await writeJSON(modsFile, mods);
}

function reloadSineMods() {
  const manager = sineManager();
  try {
    PREFS.debugLog("Build: calling SineAPI.manager.rebuildMods().");
    manager?.rebuildMods?.();
  } catch (e) {
    PREFS.debugError("rebuildMods failed:", e);
  }
  try {
    manager?.loadMods?.();
  } catch (e) {
    PREFS.debugLog("Build: loadMods unavailable:", e?.message || e);
  }
}

export async function createSineMod({ name, description, css = "", js = "", id, author }) {
  const modName = String(name || "BrowseBot Mod").slice(0, 80);
  let modId = slugify(id || modName);
  const base = getSineModsDir();
  PREFS.debugLog(`Build: creating mod "${modName}" (id: ${modId}) in ${base}.`);
  // Repairs dirs written to <profile>/sine-mods by earlier versions. BrowseBot-owned only.
  try {
    const stale = `${legacyModsDir()}/${modId}`;
    if (await IOUtils.exists(stale)) {
      let isOurs = false;
      try {
        isOurs = isBrowseBotAuthor(JSON.parse(await readText(`${stale}/theme.json`))?.author);
      } catch {}
      if (isOurs) {
        PREFS.debugLog(`Build: removing stale dir from old location: ${stale}`);
        await IOUtils.remove(stale, { recursive: true });
      } else {
        PREFS.debugLog(`Build: stale dir ${stale} is not BrowseBot-owned, leaving it alone.`);
      }
    }
  } catch (e) {
    PREFS.debugLog("Build: stale-dir cleanup skipped:", e?.message || e);
  }
  let dir = `${base}/${modId}`;
  try {
    if (await IOUtils.exists(dir)) {
      let reuse = false;
      try {
        const existing = JSON.parse(await readText(`${dir}/theme.json`));
        reuse = isBrowseBotAuthor(existing?.author);
      } catch {}
      PREFS.debugLog(`Build: dir ${dir} exists, BrowseBot-owned: ${reuse}.`);
      if (reuse) {
        try {
          if (await IOUtils.exists(`${dir}/index.js`)) await IOUtils.remove(`${dir}/index.js`);
        } catch {}
      } else {
        modId = `${modId}-${Date.now().toString(36)}`;
        dir = `${base}/${modId}`;
        PREFS.debugLog(`Build: dir taken, using ${dir}.`);
      }
    }
  } catch (e) {
    PREFS.debugLog("Build: exists check failed:", e?.message || e);
  }
  PREFS.debugLog(`Build: ensuring dir ${dir}.`);
  await ensureDir(dir);
  const hasJS = !!String(js || "").trim();
  const theme = themeTemplate({ id: modId, name: modName, description, author, hasJS });
  const scriptFile = hasJS ? Object.keys(theme.scripts)[0] : null;
  const styleFile = theme.style?.chrome || "style.css";
  const payload = {
    "theme.json": JSON.stringify(theme, null, 2) + "\n",
    [styleFile]: String(css || `/* ${modName} */\n`) + "\n",
    ...(hasJS ? { [scriptFile]: String(js) + "\n" } : {}),
    "README.md": readmeTemplate({ name: modName, description, author, hasJS, scriptFile }) + "\n",
  };
  for (const [file, text] of Object.entries(payload)) {
    PREFS.debugLog(`Build: writing ${dir}/${file} (${text.length} chars).`);
    await writeText(`${dir}/${file}`, text);
  }
  const verified = [];
  for (const file of Object.keys(payload)) {
    try {
      if (await IOUtils.exists(`${dir}/${file}`)) verified.push(file);
    } catch {}
  }
  PREFS.debugLog(
    `Build: verified ${verified.length}/${Object.keys(payload).length} files on disk.`
  );
  if (verified.length !== Object.keys(payload).length) {
    throw new Error(
      `Wrote ${verified.length}/${Object.keys(payload).length} files to ${dir}. Directory may not be writable.`
    );
  }
  await registerModInSine(theme);
  reloadSineMods();
  PREFS.debugLog(`Build: created mod "${modId}" at ${dir}.`);
  return { id: modId, dir, name: modName, files: verified };
}

export async function writeModFile(modId, file, content, mode = "replace") {
  if (
    typeof file !== "string" ||
    file.includes("..") ||
    file.includes("/") ||
    file.includes("\\") ||
    !/\.(js|mjs|css|json|md)$/.test(file)
  ) {
    return {
      error: `Refusing to write "${file}". Must be a single .js/.mjs/.css/.json/.md filename.`,
    };
  }
  const dir = await resolveModDir(modId);
  const path = `${dir}/${file}`;
  PREFS.debugLog(
    `Build: writing ${path} (${String(content ?? "").length} chars, mode: ${mode === "append" ? "append" : "replace"}).`
  );
  try {
    let text = String(content ?? "");
    if (mode === "append") {
      try {
        if (await IOUtils.exists(path)) text = (await readText(path)) + "\n" + text;
      } catch {}
    }
    await writeText(path, text);
    const ok = await IOUtils.exists(path).catch(() => false);
    PREFS.debugLog(`Build: verify ${path}: ${ok ? "on disk" : "MISSING"}.`);
    if (!ok)
      return {
        error: `Write reported success but ${file} is missing at ${dir}. Directory may not be writable.`,
      };
    if (file === "theme.json") {
      try {
        await registerModInSine(JSON.parse(text));
      } catch (e) {
        PREFS.debugLog("Build: could not re-register theme.json:", e?.message || e);
      }
    }
    reloadSineMods();
    return { result: `Wrote ${file} in mod "${modId}" at ${dir}. Reload Sine mods to apply.` };
  } catch (e) {
    PREFS.debugError(`Failed to write ${file} in mod "${modId}":`, e);
    return { error: `Failed to write ${file}: ${e?.message || e}` };
  }
}
