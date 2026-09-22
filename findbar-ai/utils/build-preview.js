import { PREFS } from "./prefs.js";

const STYLE_ID = "browsebot-build-preview";
const JS_ID = "browsebot-build-script";

let stagedJS = "";

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
  try {
    document.getElementById(JS_ID)?.remove();
  } catch {}
}

export function getPreviewState() {
  return { cssChars: getPreviewCSS().length, jsChars: getStagedJS().length, hasPreview: !!getPreviewCSS() || !!getStagedJS() };
}
