import { PREFS } from "../utils/prefs.js";
import { textToSvgDataUrl, svgToUrl, icons } from "../../utils/icon.js";
import { Storage } from "../utils/storage.js";
import { showToast } from "../../utils/toast.js";
import { getEngineByName } from "../../utils/search-service.js";
import { openLink } from "../../utils/open-link.js";

/*
 * ╭─────────────────────────────────────────────────────────╮
 * │                      Quick Split                        │
 * ╰─────────────────────────────────────────────────────────╯
 *
 * `site1 | site2` opens a side-by-side split, `site1 - site2` a
 * stacked split (mixing both uses a grid), and `+site` opens a
 * single site in glance. A leading or trailing separator stands for
 * the current tab (`| gh` splits github with this page). Keywords are
 * managed in the Quick Split settings tab and stored in the JSON
 * settings file.
 */

const QUICK_SPLIT_CURRENT = "<current-tab>";

// "|" may touch its neighbours ("a|b"), but "-" and "_" need spaces
// so ordinary terms like "e-commerce" never split.
export function parseQuickSplit(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const term = trimmed.slice(1).trim();
    if (!term) return null;
    if (/(\s*\|\s*|\s+-\s+|\s+_\s+)/.test(term)) return { kind: "invalid" };
    return { kind: "glance", term };
  }

  let rest = trimmed;
  let prefixCurrent = false;
  let suffixCurrent = false;
  const separators = [];
  const leading = rest.match(/^(?:\|\s*|-\s+|_\s+)/);
  if (leading) {
    prefixCurrent = true;
    separators.push(leading[0].trim());
    rest = rest.slice(leading[0].length).trim();
  }
  const trailing = rest.match(/(?:\s*\|\s*|\s+[-_]\s*)$/);
  if (trailing) {
    suffixCurrent = true;
    separators.push(trailing[0].trim());
    rest = rest.slice(0, -trailing[0].length).trim();
  }
  if (prefixCurrent && suffixCurrent) return null;
  if (!rest) return null;

  // split() with a capture group alternates parts and separators,
  // with parts always at even indices.
  const tokens = rest.split(/(\s*\|\s*|\s+-\s+|\s+_\s+)/);
  const parts = [];
  tokens.forEach((token, index) => {
    if (index % 2 === 0) {
      const part = token.trim();
      if (part) parts.push(part);
    } else {
      separators.push(token.trim());
    }
  });
  if (prefixCurrent) parts.unshift(QUICK_SPLIT_CURRENT);
  if (suffixCurrent) parts.push(QUICK_SPLIT_CURRENT);
  if (parts.length < 2) return null;

  const hasVertical = separators.some((s) => s === "|");
  const hasHorizontal = separators.some((s) => s === "-" || s === "_");
  const gridType = hasVertical && hasHorizontal ? "grid" : hasVertical ? "vsep" : "hsep";
  return { kind: "split", parts, gridType };
}

export function describeQuickSplit(parsed) {
  if (!parsed) return "";
  if (parsed.kind === "glance") return `Open glance: ${parsed.term}`;
  if (parsed.kind === "invalid") return "Glance (+) supports a single site only";
  const layout =
    parsed.gridType === "vsep" ? "side-by-side" : parsed.gridType === "hsep" ? "stacked" : "grid";
  const names = parsed.parts.map((p) => (p === QUICK_SPLIT_CURRENT ? "current tab" : p));
  let summary = `Open ${layout} split (${names.length}): ${names.join(", ")}`;
  if (summary.length > 100) summary = summary.slice(0, 97) + "...";
  return summary;
}

async function getQuickSplitKeywords() {
  const { quickSplitKeywords } = await Storage.loadSettings();
  if (!quickSplitKeywords || typeof quickSplitKeywords !== "object") return {};
  return quickSplitKeywords;
}

function quickSplitLooksLikeUrl(part) {
  if (!part || /\s/.test(part)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(part)) return true;
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(part)) return true;
  return /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(part);
}

function quickSplitNormalizeUrl(value) {
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(value)) return `http://${value}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

function quickSplitLuckyUrl(query, engineName = "") {
  if (/google/i.test(engineName))
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
  return `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(query)}`;
}

async function resolveQuickSplitPart(part) {
  const trimmed = part.trim();
  if (!trimmed) return null;
  const keywords = await getQuickSplitKeywords();
  const keywordUrl = keywords[trimmed.toLowerCase()];
  if (keywordUrl) return quickSplitNormalizeUrl(keywordUrl);
  if (quickSplitLooksLikeUrl(trimmed)) return quickSplitNormalizeUrl(trimmed);
  const saved = (PREFS.quickSplitSearchEngine || "").trim();
  if (!saved || /^duckduckgo lucky$/i.test(saved)) return quickSplitLuckyUrl(trimmed, saved);
  if (/^google lucky$/i.test(saved)) return quickSplitLuckyUrl(trimmed, saved);
  try {
    const engine = await getEngineByName(saved);
    const submission = engine.getSubmission(trimmed);
    if (submission?.uri?.spec) return submission.uri.spec;
  } catch (e) {
    PREFS.debugError(`Failed to build search URL for "${trimmed}".`, e);
  }
  return quickSplitLuckyUrl(trimmed);
}

export async function executeQuickSplit(parsed) {
  if (!parsed) return false;
  if (parsed.kind === "invalid") {
    showToast({
      title: "Quick Split",
      description: "Glance (+) supports a single site only, no split characters.",
    });
    return false;
  }
  if (parsed.kind === "glance") {
    const url = await resolveQuickSplitPart(parsed.term);
    if (!url) return false;
    await openLink(url, "glance");
    return true;
  }
  if (
    parsed.parts.length === 2 &&
    parsed.parts.includes(QUICK_SPLIT_CURRENT) &&
    parsed.gridType !== "grid"
  ) {
    const other = parsed.parts.find((p) => p !== QUICK_SPLIT_CURRENT);
    const url = await resolveQuickSplitPart(other);
    if (!url) return false;
    await openLink(url, parsed.gridType);
    return true;
  }
  const urls = [];
  for (const part of parsed.parts) {
    if (part === QUICK_SPLIT_CURRENT) {
      urls.push(null);
      continue;
    }
    const url = await resolveQuickSplitPart(part);
    if (url) urls.push(url);
  }
  if (urls.length < 2) {
    showToast({ title: "Quick Split", description: "Need at least two valid sites to split." });
    return false;
  }
  try {
    const currentTab = gBrowser.selectedTab;
    const tabs = [];
    for (const url of urls) {
      if (url === null) {
        tabs.push(currentTab);
        continue;
      }
      await openTrustedLinkIn(url, "tab");
      tabs.push(gBrowser.selectedTab);
    }
    if (window.gZenViewSplitter && tabs.length >= 2) {
      gZenViewSplitter.splitTabs(tabs, parsed.gridType);
    }
    return true;
  } catch (e) {
    PREFS.debugError("Failed to open split view.", e);
    return false;
  }
}

/**
 * Builds a palette command for raw query text (`a | b`, `a - b`, `+a`).
 * Returns null when the feature is disabled or the query is not Quick
 * Split syntax. The command carries its parsed input, so selecting it
 * executes the split or glance directly.
 * @param {string} query - The raw palette query text.
 * @returns {object|null} The command object, or null when not applicable.
 */
export function getQuickSplitCommand(query) {
  if (!PREFS.loadQuickSplit) return null;
  const parsed = parseQuickSplit(query);
  if (!parsed) return null;
  let label = describeQuickSplit(parsed);
  if (
    parsed.kind === "split" &&
    parsed.parts.includes(QUICK_SPLIT_CURRENT) &&
    gBrowser?.selectedTab?.splitView
  ) {
    label = label.replace("side-by-side split", "grid split").replace("stacked split", "grid split");
  }
  return {
    key: "quick-split:open",
    label,
    command: async () => {
      await executeQuickSplit(parsed);
    },
    icon: parsed.kind === "glance" ? textToSvgDataUrl("+") : svgToUrl(icons.splitVz),
    tags: ["quick", "split", "glance", "side-by-side", "stacked", "grid"],
    // Synthetic result for this exact query: not re-discoverable by
    // key lookup, so keep it out of recent commands (repeat-last).
    transient: true,
  };
}
