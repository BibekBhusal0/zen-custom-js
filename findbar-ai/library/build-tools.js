import { str, strArr, obj, paramNames } from "../llm/schema.js";
import { PREFS } from "../utils/prefs.js";
import {
  applyPreviewCSS,
  clearPreviewCSS,
  clearStagedJS,
  getPreviewCSS,
  getPreviewState,
  getStagedJS,
  setStagedJS,
  addCleanup,
  revertStagedJS,
} from "./build-preview.js";
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
  const realConsole = {};
  for (const m of methods) realConsole[m] = console[m]?.bind?.(console);
  const capture =
    (m) =>
    (...a) => {
      try {
        logs.push(`[${m}] ${a.map((x) => previewValue(x, 500)).join(" ")}`.slice(0, 1000));
      } catch {}
      try {
        realConsole[m]?.(...a);
      } catch {}
    };
  try {
    const Cu = Components.utils;
    const sandbox = Cu.Sandbox(window, { sandboxPrototype: window, wantXrays: true });
    sandbox.console = {
      log: capture("log"),
      info: capture("info"),
      warn: capture("warn"),
      error: capture("error"),
      debug: capture("debug"),
    };
    sandbox.__browsebotCleanup = (fn) => addCleanup(fn);
    let result = Cu.evalInSandbox(`;(async () => {\n${String(code)}\n})()`, sandbox);
    if (result && typeof result.then === "function") result = await result;
    setStagedJS(String(code));
    return { result: previewValue(result), logs: logs.slice(0, 50) };
  } catch (e) {
    PREFS.debugError("runChromeJS failed:", e);
    return { error: `${e?.name || "Error"}: ${e?.message || e}`, logs: logs.slice(0, 50) };
  }
}

async function applyPreviewCSSExec(args) {
  const { css, verifySelector } = args;
  if (!css || !String(css).trim()) return { error: "applyPreviewCSS requires css." };
  const { appliedChars } = applyPreviewCSS(String(css));
  const out = {
    result: `Preview CSS applied (${appliedChars} chars). Ask the user to look at the browser chrome, then iterate or offer to save it as a mod.`,
  };
  if (verifySelector && String(verifySelector).trim()) {
    try {
      const el = document.querySelector(String(verifySelector));
      if (!el) {
        out.verify = {
          selector: verifySelector,
          matched: false,
          hint: "No element matches. Try '#navigator-toolbox', '#tabbrowser-tabs', or '.toolbarbutton-1'.",
        };
      } else {
        let computed = {};
        try {
          const cs = getComputedStyle(el);
          for (const prop of ["display", "color", "background-color", "border-radius", "opacity"]) {
            computed[prop] = cs.getPropertyValue(prop);
          }
        } catch {}
        out.verify = { selector: verifySelector, matched: true, computed };
      }
    } catch (e) {
      out.verify = { selector: verifySelector, matched: false, hint: `${e?.message || e}` };
    }
  }
  return out;
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
    clearPreviewCSS();
    clearStagedJS();
    return {
      result:
        `Created mod "${created.name}" (id: ${created.id}) with ${created.files.length} files verified on disk at ${created.dir} and registered in Sine's mods.json. Staged preview was cleared. Tell the user to reopen Settings → Sine Mods to see it; restart only if the script doesn't take effect.` +
        (created.jsBlocked
          ? ` IMPORTANT: this mod contains JS but Sine is blocking scripts from unofficial sources, so its script will NOT run until the user turns on "Enable installing JS from unofficial sources" in Sine settings themselves. Tell them exactly that; never offer to change the setting for them.`
          : ""),
      modId: created.id,
      dir: created.dir,
      files: created.files,
      jsBlocked: created.jsBlocked,
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
  const hadJS = getStagedJS().length > 0;
  const reverted = revertStagedJS();
  return {
    result:
      "Cleared staged preview CSS from the browser chrome." +
      (hadJS
        ? ` Reverted staged JS (ran ${reverted.cleanups} cleanup(s), removed ${reverted.nodes} tagged node(s)). Mutations without a registered cleanup cannot be undone; restart the browser if effects persist.`
        : " No staged JS was stored."),
  };
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
    "Applies CSS to the browser chrome as a live preview (no restart, reversible). Use for all styling iterations. No permission needed. Pass verifySelector to confirm the match and get computed styles back in the same call.",
    {
      css: str("Full CSS text to preview in browser chrome."),
      verifySelector: str(
        "Optional chrome selector to verify in the same call, e.g. '#navigator-toolbox'. Returns whether it matched plus a few computed styles.",
        true
      ),
    },
    applyPreviewCSSExec
  ),
  runChromeJS: createTool(
    "Executes JavaScript in browser-chrome context with chrome privileges. Console output is captured and returned. Requires user permission every time. Every snippet MUST be revertable: tag created nodes with data-browsebot-js and register teardown with __browsebotCleanup(fn) for listeners, observers, timers, and DOM mutations.",
    {
      code: str(
        "JavaScript to execute. Can use document, window, gBrowser, SineAPI. Async allowed. Keep it short. Tag created elements with data-browsebot-js and call __browsebotCleanup(() => {...}) to undo listeners and mutations."
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
    "Reads files from an installed Sine mod. Always read theme.json first; the agent docs file is auto-included when present and MUST be followed.",
    {
      modId: str("The mod id from listMods."),
      files: strArr(
        "Files to read: theme.json, style.css, README.md, agent docs (AGENTS.md, CLAUDE.md), preferences.json, the mod's .uc.js script, or 'all'. The real script/style filenames from theme.json are auto-included.",
        true
      ),
    },
    readMod
  ),
  createMod: createTool(
    "Creates a new Sine mod from staged preview CSS/JS (or explicit css/js). Author is set to BrowseBot/model automatically. Only call when the user asks for a mod, or after they confirm your offer. If the mod contains JS while Sine blocks scripts from unofficial sources, the user gets a confirmation popup first and must enable the Sine setting themselves.",
    {
      name: str(
        "Mod name, e.g. 'Cyberpunk UI'. Omit only if the user said 'just make it' - then invent a good name.",
        true
      ),
      description: str("One-line description of what the mod does.", true),
      css: str("CSS for style.css. Omit to reuse the staged preview CSS.", true),
      js: str(
        "JS for the mod's .uc.js script. Omit to reuse staged JS, or for a CSS-only mod.",
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
        "File to write: the mod's .uc.js script, style.css, theme.json, README.md, agent docs, preferences.json."
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
    "Removes the staged preview CSS and reverts staged JS (runs registered cleanups, removes tagged nodes). Untracked JS mutations cannot be undone.",
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
  return `## Build Mode - Zen Browser mod builder

You build Sine mods for Zen Browser (Firefox UI). Two surfaces, never mix them:
- BROWSER CHROME (toolbars, tabs, sidebar, URL bar, Library): styled by style.css, declared as theme.json style.chrome. This is your default target.
- PAGE CONTENT (websites and browser internal pages such as about:newtab or settings): styled by a content stylesheet, declared as theme.json style.content. Use it only when the user asks to restyle page content. It cannot touch browser UI and has no chrome privileges. Example: "style": {"chrome": "style.css", "content": "content.css"}, with content.css scoping to an internal page via @-moz-document url("about:newtab") { body { background: #111 !important; } }.

You have live tools: inspect elements, preview CSS instantly, run privileged JS, and scaffold real Sine mods.

### Golden workflow (token-efficient)
1. UNDERSTAND (CSS work only): for styling, call \`inspectChrome\` once with a targeted selector (e.g. \`#navigator-toolbox\`, \`#tabbrowser-tabs\`) to verify the match and read computed styles. For JS-driven mods, skip inspection and go straight to a short \`runChromeJS\` snippet.
2. PREVIEW ONCE: call \`applyPreviewCSS\` a single time with the full CSS plus \`verifySelector\` set to your main selector. The result confirms the match and computed styles in the same call, so do NOT follow it with \`inspectChrome\` just to re-verify. Describe what the user should see and ask them to confirm visually. Only iterate if they report a problem or the verify block says no match.
3. JS NEEDS PERMISSION: \`runChromeJS\` always asks the user first and its console output + return value come back to you as the tool result - read the logs, fix errors, never guess blindly. Keep snippets short and show what each snippet does in one sentence before/after. The code is executed once, then its text is staged for \`createMod\`; there is no live JS preview to re-check. Every snippet MUST be revertable so the user can undo it: tag created nodes with data-browsebot-js, never use anonymous listeners you cannot remove, save and restore anything you mutate. Example:
  \`\`\`js
  const btn = document.createElement("toolbarbutton");
  btn.setAttribute("data-browsebot-js", "my-button");
  btn.addEventListener("click", onClick, { signal: ctl.signal });
  parent.appendChild(btn);
  __browsebotCleanup(() => { ctl.abort(); btn.remove(); });
  \`\`\`
4. OFFER TO KEEP: once the preview looks right, end with exactly: "Do you want to turn this into a mod?" The UI shows a Create Mod button that saves the staged preview (name/description prompt included). If the user instead says "make it a mod" directly, call \`createMod\` yourself - invent a good name/description, never interrogate for details, author is set automatically.
5. MOD EDITS: \`listMods\` → \`readMod\` (theme.json first). If the mod has an agent docs file it is auto-included, follow it. BrowseBot-authored mods edit freely; other authors' mods pop a permission dialog first.

### Mod conventions (Sine)
- New mods get: theme.json (id slug, name, description, author BrowseBot/<model>, version 1.0.0), style.css (browser-chrome CSS), plus <id>.uc.js only when there is JS to save (CSS-only mods ship no script at all), README.md starting with the mod name and a "> Made with [BrowseBot](${BROWSEBOT_REPO_URL})" credit line. Sine rebuilds automatically; a restart may still be needed for scripts.
- preferences.json (optional): an array of {property, label, type} controls shown in the mod settings UI. Types per Zen docs: checkbox (boolean), dropdown (needs "options": [{"label", "value"}], string values without spaces), string (free CSS value). Optional keys: defaultValue, description, placeholder (dropdown/string), disabledOn (e.g. ["macos"]). Sine extras: number, separator, text, restart (true shows a restart hint), conditions + operator ("AND"/"OR" with nested if/not rules), margin, size, border ("value" mirrors a color input on the border). Keep property names stable; read the existing file first when editing. Full example:
  \`\`\`json
  [
    {
      "property": "mod.mymod.round-tabs",
      "label": "Round tabs",
      "type": "checkbox",
      "defaultValue": true,
      "description": "Gives tabs fully rounded corners."
    },
    {
      "property": "mod.mymod.accent",
      "label": "Accent color",
      "type": "dropdown",
      "defaultValue": "blue",
      "description": "Color used for active UI highlights.",
      "options": [
        { "value": "blue", "label": "Blue" },
        { "value": "green", "label": "Green" }
      ],
      "conditions": [{ "if": { "property": "mod.mymod.round-tabs", "value": true } }]
    },
    {
      "property": "mod.mymod.tab-padding",
      "label": "Tab padding",
      "type": "string",
      "placeholder": "e.g: 10px"
    }
  ]
  \`\`\`
  CSS use: checkbox/dropdown via -moz-pref, string via var() with dots changed to hyphens:
  @media (-moz-pref("mod.mymod.round-tabs")) { .tabbrowser-tab { border-radius: 12px !important; } }
  @media (-moz-pref("mod.mymod.accent", "green")) { .my-btn { background: green !important; } }
  .tabbrowser-tab { padding: var(--mod-mymod-tab-padding); }
  JS use: same property name via Services.prefs, observe for live updates:
  const round = Services.prefs.getBoolPref("mod.mymod.round-tabs", true);
  const accent = Services.prefs.getStringPref("mod.mymod.accent", "blue");
  Services.prefs.addObserver("mod.mymod.accent", () => applyAccent(Services.prefs.getStringPref("mod.mymod.accent", "blue")));
- style.chrome vs style.content: theme.json "style": {"chrome": "style.css"} targets browser UI; adding "content": "content.css" targets page content (sites and internal pages). Content CSS never sees XUL/chrome elements and chrome CSS never applies inside pages. A mod can ship both files. Example content.css for a site plus an internal page:
  @-moz-document domain("github.com") { body { font-size: 15px !important; } }
  @-moz-document url("about:newtab") { body { background: #111 !important; } }
- Browser colors by default: match the user's theme with variables instead of hardcoded colors, unless the user names specific colors. You can read what is available with \`inspectChrome\` (computed block) or getComputedStyle in \`runChromeJS\`. Useful natives: var(--zen-primary-color) and var(--lwt-accent-color) for accents, var(--toolbar-bgcolor) and var(--toolbar-color) for toolbars, var(--lwt-text-color) for text, var(--toolbarbutton-icon-fill) for icons.
- When editing: write full file content via \`updateModFile\` (or mode append for small additions). Never touch files outside the mod dir. Keep diffs minimal.
- Installed mods (subset): ${modIds || "(could not list mods)"}

### Safety
- Prefer CSS over JS. Never exfiltrate data, never touch passwords/keys, never disable security UI, never run destructive commands. If a request looks harmful, refuse and suggest a safe alternative.
- A mod's script only runs if Sine's "JS from unofficial sources" is on. Always ask first; only the user's own checkbox opt-in turns it on, never anything automatic.
- Quote selectors and short code in your replies so the user sees what ran. Tool calls already render a status row; JS rows expand to show the executed code.
- Be concise. Act with tools instead of asking clarifying questions when the intent is clear (e.g. "cyberpunk UI" → inspect once, preview once with verifySelector, offer the mod).`;
}

export { paramNames };
