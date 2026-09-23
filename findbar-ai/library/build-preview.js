import { PREFS } from "../utils/prefs.js";

const STYLE_ID = "browsebot-build-preview";

let stagedJS = "";

const cleanups = [];

export function addCleanup(fn) {
  if (typeof fn === "function") cleanups.push(fn);
}

export function revertStagedJS() {
  let ran = 0;
  for (const fn of cleanups.splice(0)) {
    try {
      fn();
      ran++;
    } catch {}
  }
  let nodes = 0;
  try {
    const tagged = document.querySelectorAll("[data-browsebot-js]");
    nodes = tagged.length;
    for (const el of tagged) el.remove();
  } catch {}
  stagedJS = "";
  return { cleanups: ran, nodes };
}

function ensureStyleEl() {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    el.setAttribute("data-browsebot", "preview");
    document.documentElement.appendChild(el);
  }
  return el;
}

export function applyPreviewCSS(css) {
  const safe = String(css || "");
  ensureStyleEl().textContent = safe;
  PREFS.debugLog(`Build preview: applied ${safe.length} chars of CSS.`);
  return { appliedChars: safe.length };
}

export function getPreviewCSS() {
  try {
    return document.getElementById(STYLE_ID)?.textContent || "";
  } catch {
    return "";
  }
}

export function clearPreviewCSS() {
  try {
    document.getElementById(STYLE_ID)?.remove();
  } catch {}
  PREFS.debugLog("Build preview: cleared CSS.");
}

export function setStagedJS(code) {
  stagedJS = String(code || "");
}

export function getStagedJS() {
  return stagedJS;
}

export function clearStagedJS() {
  stagedJS = "";
}

export function getPreviewState() {
  return {
    cssChars: getPreviewCSS().length,
    jsChars: getStagedJS().length,
    hasPreview: !!getPreviewCSS() || !!getStagedJS(),
  };
}
