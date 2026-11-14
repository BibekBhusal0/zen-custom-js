import { getSearchEngineFavicon } from "../utils/favicon.js";
import { getVisibleEngines } from "../utils/search-service.js";
import { openLink } from "../utils/open-link.js";
import { addDynamicCommandsProvider } from "../utils/command-palete.js";
import { PREFS } from "./utils/prefs.js";

/**
 * Registers a dynamic provider that builds one command per visible engine.
 * Each command re-runs the term the switcher detected on the current page
 * with that engine; the engine already in use is skipped, since the
 * switcher itself handles that one.
 * @param {() => ({term?: string, engine?: {name: string}}|null)} getCurrentSearchInfo
 */
export function setupCommandPaletteIntegration(getCurrentSearchInfo) {
  async function generateSearchEngineSelectCommands() {
    const engines = await getVisibleEngines();

    return engines.map((engine) => ({
      key: `search-engine-select:search-in:${engine.name}`,
      label: "Search current search term in",
      prettyName: engine.name,
      prettyIcon: getSearchEngineFavicon(engine),
      command: () => {
        const info = getCurrentSearchInfo();
        if (!info?.term) return;
        const url = engine.getSubmission(info.term)?.uri?.spec;
        if (url) openLink(url, "current tab");
      },
      condition: () => {
        if (!PREFS.enabled) return false;
        const info = getCurrentSearchInfo();
        return !!info?.term && info.engine?.name !== engine.name;
      },
      icon: "chrome://browser/skin/zen-icons/search-glass.svg",
      tags: ["search", "engine", "search-engine-select", engine.name.toLowerCase()],
      openUrl: true,
    }));
  }

  addDynamicCommandsProvider(generateSearchEngineSelectCommands, PREFS.PALETTE_COMMANDS);
}
