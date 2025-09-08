import { debugLog } from "./utils/prefs.js";
import { textToSvgDataUrl, svgToUrl, icons } from "./utils/icon.js";

/**
 * Gets a favicon for a search engine, with fallbacks.
 * @param {object} engine - The search engine object.
 * @returns {string} The URL of the favicon.
 */
const getSearchEngineFavicon = (engine) => {
  if (engine.iconURI?.spec) {
    return engine.iconURI.spec;
  }
  try {
    const submissionUrl = engine.getSubmission("test_query").uri.spec;
    const hostName = new URL(submissionUrl).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${hostName}&sz=32`;
  } catch (e) {
    return "chrome://browser/skin/search-glass.svg"; // Absolute fallback
  }
};

/**
 * Generates commands for opening "about:" pages.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of about page commands.
 */
export async function generateAboutPageCommands() {
  const aboutPages = [
    { page: "preferences", icon: "chrome://browser/skin/zen-icons/settings.svg" },
    { page: "config", icon: "chrome://browser/skin/zen-icons/settings.svg" },
    { page: "newtab", icon: "chrome://browser/skin/zen-icons/home.svg" },
    { page: "addons", icon: "chrome://browser/skin/zen-icons/extension.svg" },
    { page: "downloads", icon: "chrome://browser/skin/zen-icons/downloads.svg" },
    { page: "debugging" },
    { page: "deleteprofile" },
    { page: "logins" },
    { page: "editprofile" },
    { page: "memory" },
    { page: "newprofile" },
    { page: "processes" },
    { page: "profiles" },
    { page: "serviceworkers" },
    { page: "about" },
    { page: "buildconfig" },
    { page: "cache" },
    { page: "certificate" },
    { page: "checkerboard" },
    { page: "compat" },
    { page: "credits" },
    { page: "support", icon: "chrome://browser/skin/zen-icons/info.svg" },
    { page: "home", icon: "chrome://browser/skin/zen-icons/home.svg" },
    { page: "license" },
    { page: "logging" },
    { page: "loginsimportreport" },
    { page: "logo" },
    { page: "mozilla" },
    { page: "networking" },
    { page: "policies" },
    { page: "privatebrowsing", icon: "chrome://browser/skin/zen-icons/private-window.svg" },
    { page: "profiling" },
    { page: "protections" },
    { page: "rights" },
    { page: "robots" },
    { page: "studies" },
    { page: "sync-log" },
    { page: "telemetry" },
    { page: "third-party" },
    { page: "unloads" },
    { page: "url-classifier" },
    { page: "webrtc" },
    { page: "welcome" },
    { page: "windows-messages" },
  ];

  return aboutPages.map((aboutPage) => ({
    key: `about:${aboutPage.page}`,
    label: `Open about:${aboutPage.page}`,
    command: () => switchToTabHavingURI(`about:${aboutPage.page}`, true),
    condition: !!window.switchToTabHavingURI,
    icon: aboutPage.icon || "chrome://browser/skin/zen-icons/tab.svg",
    tags: ["about", "internal", aboutPage.page],
  }));
}

/**
 * Generates commands for changing the current search engine in the URL bar.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of search engine commands.
 */
export async function generateSearchEngineCommands() {
  if (!Services.search) return [];

  const engines = await Services.search.getVisibleEngines();
  return engines.map((engine) => {
    const engineName = engine.name;
    return {
      key: `search:${engineName}`,
      label: `Search with: ${engineName}`,
      command: () => {
        if (window.gURLBar) {
          // Clear the command text from the urlbar before changing mode. This is the key fix.
          window.gURLBar.value = "";
          window.gURLBar.searchMode = {
            engineName,
            // "oneoff" is the entry type used by urlbar one-off buttons.
            entry: "oneoff",
          };
          window.gURLBar.focus();
        }
      },
      condition: () => {
        const currentEngineName =
          window.gURLBar.searchMode?.engineName || Services.search.defaultEngine?.name;
        return currentEngineName !== engineName;
      },
      icon: getSearchEngineFavicon(engine),
      tags: ["search", "engine", engineName.toLowerCase()],
    };
  });
}

/**
 * Generates commands for opening extension options pages.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of extension commands.
 */
export async function generateExtensionCommands() {
  const addons = await AddonManager.getAddonsByTypes(["extension"]);
  return addons
    .filter((addon) => addon.isActive && !addon.isSystem && addon.optionsURL)
    .map((addon) => ({
      key: `extension:${addon.id}`,
      label: `Extension Options: ${addon.name}`,
      command: () =>
        BrowserAddonUI.openAddonsMgr(
          "addons://detail/" + encodeURIComponent(addon.id) + "/preferences"
        ),
      icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
      tags: ["extension", "addon", "options", addon.name.toLowerCase()],
    }));
}

/**
 * Generates commands for switching between Zen Workspaces.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of workspace commands.
 */
export async function generateWorkspaceCommands() {
  if (!window.gZenWorkspaces?.workspaceEnabled) return [];
  const workspacesData = await window.gZenWorkspaces._workspaces();
  if (!workspacesData || !workspacesData.workspaces) return [];

  return workspacesData.workspaces.map((workspace) => {
    const icon = window.gZenWorkspaces.getWorkspaceIcon(workspace);
    let iconUrl = "chrome://browser/skin/zen-icons/workspace.svg"; // Default icon

    if (icon) {
      if (icon.endsWith(".svg")) {
        iconUrl = icon;
      } else {
        iconUrl = textToSvgDataUrl(icon);
      }
    }
    return {
      key: `workspace:${workspace.uuid}`,
      label: `Switch to workspace: ${workspace.name}`,
      command: () => window.gZenWorkspaces.changeWorkspaceWithID(workspace.uuid),
      condition: () => workspace.uuid !== window.gZenWorkspaces.activeWorkspace,
      icon: iconUrl,
      tags: ["workspace", "switch", workspace.name.toLowerCase()],
    };
  });
}

/**
 * Generates commands for installing and uninstalling Sine mods.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of Sine mod commands.
 */
export async function generateSineCommands() {
  // SineAPI is required for both installing and uninstalling.
  if (!window.SineAPI) {
    debugLog("SineAPI not found, skipping Sine command generation.");
    return [];
  }

  const commands = [];
  const installedMods = await SineAPI.utils.getMods();

  // Generate "Install" commands. This requires the main `Sine` object to be available.
  if (window.Sine?.marketplace) {
    const marketplaceMods = window.Sine.marketplace;
    for (const modId in marketplaceMods) {
      if (!installedMods[modId]) {
        const mod = marketplaceMods[modId];
        commands.push({
          key: `sine:install:${modId}`,
          label: `Install Sine Mod: ${mod.name}`,
          command: () => Sine.installMod(mod.homepage),
          icon: svgToUrl(icons.sine),
          tags: ["sine", "install", "mod", mod.name.toLowerCase()],
        });
      }
    }
  } else {
    console.log(
      "zen-command-palette: Global Sine object not found. 'Install' commands will be unavailable."
    );
  }

  // Generate "Uninstall" commands for installed mods.
  for (const modId in installedMods) {
    const mod = installedMods[modId];
    commands.push({
      key: `sine:uninstall:${modId}`,
      label: `Uninstall Sine Mod: ${mod.name}`,
      command: () => {
        if (window.confirm(`Are you sure you want to remove the Sine mod "${mod.name}"?`)) {
          SineAPI.manager.removeMod(mod.id).then(() => {
            SineAPI.manager.rebuildMods();
            if (mod.js) {
              ucAPI.showToast([
                `"${mod.name}" has been removed.`,
                "A restart is recommended to fully unload its scripts.",
              ]);
            }
          });
        }
      },
      icon: svgToUrl(icons.sine),
      tags: ["sine", "uninstall", "mod", mod.name.toLowerCase()],
    });
  }

  return commands;
}
