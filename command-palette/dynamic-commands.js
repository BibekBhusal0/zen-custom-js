/**
 * Creates an SVG data URL from a text string or emoji, suitable for use as an icon.
 * @param {string} text - The character or emoji to render.
 * @param {boolean} isWorkspace - If true, adds a marker to the data URL to identify it as a workspace icon.
 * @returns {string} A data URL for the generated SVG.
 */
const textToSvgDataUrl = (text, isWorkspace = false) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="10" fill="currentColor">${text}</text>
  </svg>`;
  // Add a marker in the data URL if it's a workspace icon to allow for specific CSS targeting.
  const marker = isWorkspace ? ";type=workspace-icon" : "";
  return `data:image/svg+xml;charset=utf-8${marker},${encodeURIComponent(svg)}`;
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
 * Generates commands for switching the default search engine.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of search engine commands.
 */
export async function generateSearchEngineCommands() {
  if (!Services.search) return [];
  try {
    const engines = await Services.search.getVisibleEngines();
    return engines.map((engine) => ({
      key: `search:${engine.name}`,
      label: `Switch search to: ${engine.name}`,
      command: () => {
        Services.search.defaultEngine = engine;
      },
      condition: () =>
        !!Services.search.defaultEngine && Services.search.defaultEngine.name !== engine.name,
      icon: engine.iconURI?.spec || "chrome://browser/skin/search-glass.svg",
      tags: ["search", "engine", engine.name.toLowerCase()],
    }));
  } catch (e) {
    console.error("zen-command-palette: Could not generate search engine commands.", e);
    return [];
  }
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

  return workspacesData.workspaces
    .filter((workspace) => workspace.uuid !== window.gZenWorkspaces.activeWorkspace)
    .map((workspace) => {
      const icon = window.gZenWorkspaces.getWorkspaceIcon(workspace);
      let iconUrl = "chrome://browser/skin/zen-icons/workspace.svg"; // Default icon

      if (icon) {
        if (icon.endsWith(".svg")) {
          iconUrl = icon;
        } else {
          // Render emoji or character as an SVG icon
          iconUrl = textToSvgDataUrl(icon, true);
        }
      }
      return {
        key: `workspace:${workspace.uuid}`,
        label: `Switch to workspace: ${workspace.name}`,
        command: () => window.gZenWorkspaces.changeWorkspaceWithID(workspace.uuid),
        icon: iconUrl,
        tags: ["workspace", "switch", workspace.name.toLowerCase()],
      };
    });
}

/**
 * Asynchronously generates and collects all dynamic commands based on provided options.
 * @param {object} [options] - Determines which command sets to generate.
 * @returns {Promise<Array<object>>} A flat array of all generated commands.
 */
export async function generateDynamicCommands(options = {}) {
  const {
    loadAboutPages = true,
    loadSearchEngines = true,
    loadExtensions = true,
    loadWorkspaces = true,
  } = options;

  const commandPromises = [];
  if (loadAboutPages) commandPromises.push(generateAboutPageCommands());
  if (loadSearchEngines) commandPromises.push(generateSearchEngineCommands());
  if (loadExtensions) commandPromises.push(generateExtensionCommands());
  if (loadWorkspaces) commandPromises.push(generateWorkspaceCommands());

  const commandSets = await Promise.all(commandPromises);
  return commandSets.flat();
}
