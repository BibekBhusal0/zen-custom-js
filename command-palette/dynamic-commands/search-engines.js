import { getSearchEngineFavicon } from "../../utils/favicon.js";
import { PREFS } from "../utils/prefs.js";
import { getVisibleEngines, getDefaultEngine } from "../../utils/search-service.js";

/**
 * Generates commands for changing the current search engine in the URL bar.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of search engine commands.
 */
export async function generateSearchEngineCommands() {
  const engines = await getVisibleEngines();

  let defaultEngineName = null;
  try {
    const defaultEngine = await getDefaultEngine();
    defaultEngineName = defaultEngine?.name ?? null;
  } catch (e) {
    PREFS.debugError("Failed to get default search engine for command palette.", e);
  }

  return engines.map((engine) => {
    const engineName = engine.name;
    const isDefault = defaultEngineName !== null && engineName === defaultEngineName;
    return {
      key: `search:${engineName}`,
      label: isDefault ? `Search with: ${engineName} (Default)` : `Search with: ${engineName}`,
      command: () => {
        const browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
        const gURLBar = browserWindow.gURLBar;
        if (gURLBar) {
          // Clear the command text from the urlbar before changing mode. This is the key fix.
          gURLBar.value = "";
          gURLBar.searchMode = {
            engineName,
            entry: "oneoff",
          };
          gURLBar.focus();
        }
      },
      icon: getSearchEngineFavicon(engine),
      tags: isDefault
        ? ["search", "engine", "default", engineName.toLowerCase()]
        : ["search", "engine", engineName.toLowerCase()],
      openUrl: true,
    };
  });
}
