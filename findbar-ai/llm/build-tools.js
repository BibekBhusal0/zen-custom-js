import { str, strArr, obj, paramNames } from "./schema.js";
import { PREFS } from "../utils/prefs.js";
import {
  applyPreviewCSS,
  clearPreviewCSS,
  clearStagedJS,
  getPreviewCSS,
  getPreviewState,
  getStagedJS,
  setStagedJS,
} from "../utils/build-preview.js";
import {
  browseBotAuthor,
  BROWSEBOT_REPO_URL,
  createSineMod,
  getInstalledMods,
  isBrowseBotAuthor,
  readModFiles,
  writeModFile,
} from "../utils/sine-mods.js";

const createTool = (description, parameters, executeFn) => ({
  description,
  parameters: obj(parameters),
  execute: executeFn,
});

// Preview/read tools skip confirmation; everything else confirms via library-llm.js.
export const BUILD_NO_CONFIRM = new Set([
  "applyPreviewCSS",
  "inspectChrome",
  "listMods",
  "readMod",
  "getPreviewState",
  "clearPreview",
]);

function currentModelName() {
  try {
    const provider = String(PREFS.llmProvider || "pollinations");
    const model = PREFS.getPref(`extension.browse-bot.${provider}-model`);
    return String(model || provider);
  } catch {
    return "unknown";
  }
}

export function buildAuthor() {
  return browseBotAuthor(currentModelName());
}

function previewValue(value, limit = 2000) {
  let text;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value ?? null);
  } catch {
    text = String(value);
  }
  if (text.length > limit) return text.slice(0, limit) + "\n[Truncated.]";
  return text;
}

async function runChromeJS(args) {
  const { code } = args;
  if (!code || !String(code).trim()) return { error: "runChromeJS requires code." };
  const logs = [];
  const methods = ["log", "info", "warn", "error", "debug"];
  const originals = {};
  for (const m of methods) {
    originals[m] = console[m]?.bind?.(console);
    console[m] = (...a) => {
      try {
        logs.push(`[${m}] ${a.map((x) => previewValue(x, 500)).join(" ")}`.slice(0, 1000));
      } catch {}
      try {
        originals[m]?.(...a);
      } catch {}
    };
  }
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(String(code));
    const result = await fn();
    setStagedJS(String(code));
    return { result: previewValue(result), logs: logs.slice(0, 50) };
  } catch (e) {
    PREFS.debugError("runChromeJS failed:", e);
    return { error: `${e?.name || "Error"}: ${e?.message || e}`, logs: logs.slice(0, 50) };
  } finally {
    for (const m of methods) {
      try {
        if (originals[m]) console[m] = originals[m];
      } catch {}
    }
  }
}

async function applyPreviewCSSExec(args) {
  const { css } = args;
  if (!css || !String(css).trim()) return { error: "applyPreviewCSS requires css." };
  const { appliedChars } = applyPreviewCSS(String(css));
  return {
    result: `Preview CSS applied (${appliedChars} chars). Ask the user to look at the browser chrome, then iterate or offer to save it as a mod.`,
  };
}

async function inspectChrome(args) {
  const { selector } = args;
  try {
    const el = selector ? document.querySelector(selector) : document.documentElement;
    if (!el) {
      return {
        error: `No element matches "${selector}". Try a simpler selector, e.g. "#navigator-toolbox", "#tabbrowser-tabs", ".toolbarbutton-1".`,
      };
    }
    const attrs = {};
    try {
      for (const a of el.attributes || []) attrs[a.name] = String(a.value).slice(0, 200);
    } catch {}
    let computed = {};
    try {
      const cs = getComputedStyle(el);
      for (const prop of [
        "display",
        "color",
        "background-color",
        "background-image",
        "border-color",
        "border-radius",
        "padding",
        "margin",
        "font-size",
        "opacity",
      ]) {
        computed[prop] = cs.getPropertyValue(prop);
      }
    } catch {}
    const children = [];
    try {
      for (const child of el.children || []) {
        children.push(
          `${child.tagName.toLowerCase()}${child.id ? `#${child.id}` : ""}${child.className && typeof child.className === "string" ? `.${child.className.split(/\s+/).slice(0, 3).join(".")}` : ""}`
        );
        if (children.length >= 12) break;
      }
    } catch {}
    const parents = [];
    try {
      let p = el.parentElement;
      while (p && parents.length < 3) {
        parents.push(`${p.tagName.toLowerCase()}${p.id ? `#${p.id}` : ""}`);
        p = p.parentElement;
      }
    } catch {}
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes:
        typeof el.className === "string"
          ? el.className.split(/\s+/).filter(Boolean).slice(0, 10)
          : [],
      attributes: attrs,
      computed,
      parents,
      children,
      outerHTML: previewValue(el.outerHTML, 4000),
    };
  } catch (e) {
    return { error: `inspectChrome failed: ${e?.message || e}` };
  }
}

async function listMods() {
  const mods = await getInstalledMods();
  const list = Object.values(mods).map((m) => ({
    id: m.id,
    name: m.name,
    author: m.author,
    version: m.version,
    enabled: m.enabled,
    description: String(m.description || "").slice(0, 160),
    browseBotOwned: isBrowseBotAuthor(m.author),
  }));
  return { mods: list };
}

async function readMod(args) {
  const { modId, files } = args;
  if (!modId) return { error: "readMod requires modId." };
  const wanted = Array.isArray(files) && files.length ? files : ["theme.json"];
  return readModFiles(modId, wanted);
}

async function createMod(args) {
  const { name, description, css, js, id } = args;
  const finalCss = css ?? getPreviewCSS();
  const finalJs = js ?? getStagedJS();
  if (!finalCss && !finalJs) {
    return {
      error: "Nothing to save yet. Apply preview CSS or run JS first, or pass css/js explicitly.",
    };
  }
  try {
    const created = await createSineMod({
      name: name || "BrowseBot Mod",
      description: description || "",
      css: String(finalCss || `/* ${name || "BrowseBot Mod"} */\n`),
      js: String(finalJs || ""),
      id,
      author: buildAuthor(),
    });
    return {
      result: `Created mod "${created.name}" (id: ${created.id}) with ${created.files.length} files verified on disk at ${created.dir} and registered in Sine's mods.json. Tell the user to reopen Settings → Sine Mods to see it; the live preview is still applied meanwhile, restart only if the script doesn't take effect.`,
      modId: created.id,
      dir: created.dir,
      files: created.files,
    };
  } catch (e) {
    return { error: `Failed to create mod: ${e?.message || e}` };
  }
}

async function updateModFile(args) {
  const { modId, file, content, mode } = args;
  if (!modId || !file || content === undefined) {
    return { error: "updateModFile requires modId, file, and content." };
  }
  return writeModFile(modId, file, String(content), mode === "append" ? "append" : "replace");
}

async function getPreviewStateTool() {
  const state = getPreviewState();
  return {
    ...state,
    cssPreview: previewValue(getPreviewCSS(), 3000),
    jsPreview: previewValue(getStagedJS(), 3000),
  };
}

async function clearPreview() {
  clearPreviewCSS();
  clearStagedJS();
  return { result: "Cleared staged preview CSS and JS." };
}

export const buildTools = {
  inspectChrome: createTool(
    "Inspects a browser-chrome element (Firefox UI, NOT web content). Returns tag, attributes, computed styles, and HTML so you can verify selectors before styling.",
    {
      selector: str(
        "CSS selector in browser chrome, e.g. '#navigator-toolbox', '#tabbrowser-tabs .tabbrowser-tab'. Omit to inspect the root.",
        true
      ),
    },
    inspectChrome
  ),
  applyPreviewCSS: createTool(
    "Applies CSS to the browser chrome as a live preview (no restart, reversible). Use for all styling iterations. No permission needed.",
    { css: str("Full CSS text to preview in browser chrome.") },
    applyPreviewCSSExec
  ),
  runChromeJS: createTool(
    "Executes JavaScript in browser-chrome context with chrome privileges. Console output is captured and returned. Requires user permission every time.",
    {
      code: str(
        "JavaScript to execute. Can use document, window, gBrowser, SineAPI. Async allowed. Keep it short."
      ),
    },
    runChromeJS
  ),
  listMods: createTool(
    "Lists installed Sine mods with id, name, author, and version.",
    {},
    listMods
  ),
  readMod: createTool(
    "Reads files from an installed Sine mod. Always read theme.json first; AGENTS.md is auto-included when present and MUST be followed.",
    {
      modId: str("The mod id from listMods."),
      files: strArr(
        "Files to read: theme.json, style.css, README.md, AGENTS.md, preferences.json, the mod's .uc.js script, or 'all'. The real script/style filenames from theme.json are auto-included.",
        true
      ),
    },
    readMod
  ),
  createMod: createTool(
    "Creates a new Sine mod from staged preview CSS/JS (or explicit css/js). Author is set to BrowseBot/model automatically. Only call when the user asks for a mod, or after they confirm your offer.",
    {
      name: str(
        "Mod name, e.g. 'Cyberpunk UI'. Omit only if the user said 'just make it' — then invent a good name.",
        true
      ),
      description: str("One-line description of what the mod does.", true),
      css: str("CSS for style.css. Omit to reuse the staged preview CSS.", true),
      js: str(
        "JS for the mod's .uc.js script. Omit to reuse staged JS (or a minimal template).",
        true
      ),
      id: str("Custom mod id slug. Omit to auto-generate from the name.", true),
    },
    createMod
  ),
  updateModFile: createTool(
    "Edits one file in an existing Sine mod. BrowseBot-owned mods apply directly; other authors require user permission (handled before this runs).",
    {
      modId: str("The mod id."),
      file: str(
        "File to write: the mod's .uc.js script, style.css, theme.json, README.md, AGENTS.md, preferences.json."
      ),
      content: str("Full new content of the file (or content to append)."),
      mode: str("`replace` (default) or `append`.", true),
    },
    updateModFile
  ),
  getPreviewState: createTool(
    "Returns what CSS/JS is currently staged as a preview.",
    {},
    getPreviewStateTool
  ),
  clearPreview: createTool(
    "Removes the staged preview CSS and JS from the browser.",
    {},
    clearPreview
  ),
};

export async function getBuildSystemPrompt() {
  let modIds = "";
  try {
    const mods = await getInstalledMods();
    modIds = Object.values(mods)
      .slice(0, 30)
      .map((m) => `${m.id} (${m.name}, by ${m.author})`)
      .join("; ");
  } catch {}
  return `## Build Mode — Zen Browser mod builder

You customize the BROWSER CHROME (Firefox UI: toolbars, tabs, sidebar, URL bar), never web-page content.
You have live tools: inspect elements, preview CSS instantly, run privileged JS, and scaffold real Sine mods.

### Golden workflow
1. UNDERSTAND FIRST: call \`inspectChrome\` (no selector, then targeted selectors like \`#navigator-toolbox\`, \`#tabbrowser-tabs\`) before writing any CSS/JS. Verify your selector matches and check computed styles.
2. CSS IS FREE: use \`applyPreviewCSS\` liberally to iterate (no permission needed, reversible). After each apply, use \`inspectChrome\` to verify computed styles changed, then describe what the user should see and ask them to confirm visually.
3. JS NEEDS PERMISSION: \`runChromeJS\` always asks the user first and its console output + return value come back to you as the tool result — read the logs, fix errors, never guess blindly. Keep snippets short and show what each snippet does in one sentence before/after.
4. OFFER TO KEEP: once the preview looks right, end with exactly: "Do you want to turn this into a mod?" The UI shows a Create Mod button that saves the staged preview (name/description prompt included). If the user instead says "make it a mod" directly, call \`createMod\` yourself — invent a good name/description, never interrogate for details, author is set automatically.
5. MOD EDITS: \`listMods\` → \`readMod\` (theme.json first). If the mod has AGENTS.md it is auto-included — follow it. BrowseBot-authored mods edit freely; other authors' mods pop a permission dialog first.

### Mod conventions (Sine)
- New mods get: theme.json (id slug, name, description, author BrowseBot/<model>, version 1.0.0), <id>.uc.js (browser-chrome JS, filename must match the scripts key), style.css (browser-chrome CSS), README.md starting with the mod name and a "> Made with [BrowseBot](${BROWSEBOT_REPO_URL})" credit line. Sine rebuilds automatically; a restart may still be needed for scripts.
- When editing: write full file content via \`updateModFile\` (or mode append for small additions). Never touch files outside the mod dir. Keep diffs minimal.
- Installed mods (subset): ${modIds || "(could not list mods)"}

### Safety
- Prefer CSS over JS. Never exfiltrate data, never touch passwords/keys, never disable security UI, never run destructive commands. If a request looks harmful, refuse and suggest a safe alternative.
- Quote selectors and short code in your replies so the user sees what ran. Tool calls already render a status row; JS rows expand to show the executed code.
- Be concise. Act with tools instead of asking clarifying questions when the intent is clear (e.g. "cyberpunk UI" → inspect, preview a neon theme, verify, offer the mod).`;
}

export { paramNames };
