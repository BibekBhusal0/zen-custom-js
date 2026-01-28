import { getSearchEngineFavicon } from "../utils/favicon.js";
import { PREFS } from "./utils/prefs.js";
import { textToSvgDataUrl, svgToUrl, icons } from "../utils/icon.js";
import { Storage } from "./utils/storage.js";
import { ZenCommandPalette } from "./index.js";
import { showToast } from "../utils/toast.js";
import { isNotEmptyTab } from "./utils/notEmptyTab.js";

const commandChainUtils = {
  async openLink(params) {
    const { link, where = "new tab" } = params;
    if (!link) return;
    const whereNormalized = where?.toLowerCase()?.trim();
    try {
      switch (whereNormalized) {
        case "current tab":
          openTrustedLinkIn(link, "current");
          break;
        case "new tab":
          openTrustedLinkIn(link, "tab");
          break;
        case "new window":
          openTrustedLinkIn(link, "window");
          break;
        case "incognito":
        case "private":
          window.openTrustedLinkIn(link, "window", { private: true });
          break;
        case "glance":
          if (window.gZenGlanceManager) {
            window.gZenGlanceManager.openGlance({
              url: link,
            });
          } else {
            openTrustedLinkIn(link, "tab");
          }
          break;
        case "vsplit":
        case "hsplit":
          if (window.gZenViewSplitter) {
            const sep = whereNormalized === "vsplit" ? "vsep" : "hsep";
            const tab1 = gBrowser.selectedTab;
            await openTrustedLinkIn(link, "tab");
            const tab2 = gBrowser.selectedTab;
            gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
          } else {
            openTrustedLinkIn(link, "tab");
          }
          break;
        default:
          openTrustedLinkIn(link, "tab");
      }
    } catch (e) {
      PREFS.debugError(`Command Chain: Failed to open link "${link}" in "${where}".`, e);
    }
  },
  async delay(params) {
    const { time = 50 } = params;
    if (!time) return;
    await new Promise((resolve) => setTimeout(resolve, time));
  },
  async showToast(params) {
    const { title, description } = params;
    if (!title || !description) return;

    try {
      showToast({ title: title, description: description });
    } catch (e) {
      PREFS.debugError("Failed to show toast:", e);
      alert([title, description], 0);
    }
  },
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
      openUrl: true,
    };
  });
}

/**
 * Generates commands for enabling or disabling extensions.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of addon state commands.
 */
export async function generateExtensionEnableDisableCommands() {
  const addons = await AddonManager.getAddonsByTypes(["extension"]);
  const commands = [];
  for (const addon of addons) {
    if (addon.isSystem) continue;

    if (addon.isActive) {
      commands.push({
        key: `addon:disable:${addon.id}`,
        label: `Disable Extension: ${addon.name}`,
        command: () => addon.disable(),
        icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
        tags: ["extension", "addon", "disable", addon.name.toLowerCase()],
      });
    } else {
      commands.push({
        key: `addon:enable:${addon.id}`,
        label: `Enable Extension: ${addon.name}`,
        command: () => addon.enable(),
        icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
        tags: ["extension", "addon", "enable", addon.name.toLowerCase()],
      });
    }
  }
  return commands;
}

/**
 * Generates commands for uninstalling extensions.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of addon uninstall commands.
 */
export async function generateExtensionUninstallCommands() {
  const addons = await AddonManager.getAddonsByTypes(["extension"]);
  const commands = [];
  for (const addon of addons) {
    if (addon.isSystem) continue;

    commands.push({
      key: `addon:uninstall:${addon.id}`,
      label: `Uninstall Extension: ${addon.name}`,
      command: () => {
        if (confirm(`Are you sure you want to uninstall "${addon.name}"?`)) {
          addon.uninstall();
        }
      },
      icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
      tags: ["extension", "addon", "uninstall", "remove", addon.name.toLowerCase()],
    });
  }
  return commands;
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
      // HACK: adding tags 3 times so that this appears in top
      tags: [
        "extension",
        "addon",
        "options",
        addon.name.toLowerCase(),
        addon.name.toLowerCase(),
        addon.name.toLowerCase(),
      ],
    }));
}

/**
 * Generates commands for opening the current tab in different containers.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of container commands.
 */
export async function generateContainerTabCommands() {
  if (!window.ContextualIdentityService) {
    return [];
  }

  const commands = [];

  commands.push({
    key: `container-tab:open-default`,
    label: `Open Tab without Container`,
    command: () => {
      const tabToMove = gBrowser.selectedTab;
      if (tabToMove && tabToMove.linkedBrowser) {
        const url = tabToMove.linkedBrowser.currentURI.spec;
        window.openTrustedLinkIn(url, "tab", {
          userContextId: 0,
          relatedToCurrent: true,
          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        });
        gBrowser.removeTab(tabToMove);
      }
    },
    icon: "chrome://browser/skin/zen-icons/tab.svg",
    tags: ["container", "tab", "open", "default", "no container"],
    condition: () => {
      const currentTab = gBrowser.selectedTab;
      return currentTab && (currentTab.userContextId || 0) !== 0;
    },
    allowIcons: true, // Allow user to change the default tab icon
  });

  const identities = ContextualIdentityService.getPublicIdentities();
  if (!identities || identities.length === 0) {
    return commands;
  }

  identities.forEach((identity) => {
    const name = identity.name || identity.l10nId;
    commands.push({
      key: `container-tab:open:${identity.userContextId}`,
      label: `Open Tab in: ${name}`,
      command: () => {
        const tabToMove = gBrowser.selectedTab;
        if (tabToMove && tabToMove.linkedBrowser) {
          const url = tabToMove.linkedBrowser.currentURI.spec;
          window.openTrustedLinkIn(url, "tab", {
            userContextId: identity.userContextId,
            relatedToCurrent: true,
            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
          });
          gBrowser.removeTab(tabToMove);
        }
      },
      // TODO: figure out how to get container Icon
      // Generate a colored circle icon dynamically using the container's color.
      icon: svgToUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${identity.color}"><circle r="5" cx="8" cy="8" /></svg>`
      ),
      tags: ["container", "tab", "open", name.toLowerCase()],
      condition: () => {
        const currentTab = gBrowser.selectedTab;
        // Show command only if the tab is not already in this container.
        return currentTab && (currentTab.userContextId || 0) !== identity.userContextId;
      },
    });
  });

  return commands;
}

/**
 * Generates commands for switching to active tabs.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of active tab commands.
 */
export async function generateActiveTabCommands() {
  const commands = [];
  const tabs = window.gZenWorkspaces?.workspaceEnabled
    ? window.gZenWorkspaces.allStoredTabs
    : Array.from(gBrowser.tabs);

  for (const tab of tabs) {
    // Some tabs might be placeholders or internal, linkedBrowser can be null.
    if (!tab.linkedBrowser) {
      continue;
    }

    // Skip the empty new tab placeholder used by Zen.
    if (tab.hasAttribute("zen-empty-tab")) {
      continue;
    }

    commands.push({
      key: `switch-tab:${tab.label}`,
      label: `Switch to Tab: ${tab.label}`,
      command: () => {
        if (window.gZenWorkspaces?.workspaceEnabled) {
          // This function handles switching workspace if necessary.
          window.gZenWorkspaces.switchTabIfNeeded(tab);
        } else {
          gBrowser.selectedTab = tab;
        }
      },
      condition: () => gBrowser.selectedTab !== tab,
      icon: tab.image || "chrome://browser/skin/zen-icons/tab.svg",
      tags: ["tab", "switch", "active", tab.label.toLowerCase()],
    });
  }
  return commands;
}

/**
 * Generates commands for unloading to tabs.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of active tab commands.
 */
export async function generateUnloadTabCommands() {
  const commands = [];
  // Use gZenWorkspaces.allStoredTabs to get tabs from all workspaces in the current window.
  const tabs = window.gZenWorkspaces?.workspaceEnabled
    ? window.gZenWorkspaces.allStoredTabs
    : Array.from(gBrowser.tabs);

  for (const tab of tabs) {
    // Skip already unloaded tabs
    if (tab.hasAttribute("pending")) {
      continue;
    }

    // Skip the empty new tab placeholder used by Zen.
    if (tab.hasAttribute("zen-empty-tab") || !tab.linkedBrowser) {
      continue;
    }

    commands.push({
      key: `unload-tab:${tab.linkedBrowser.outerWindowID}-${tab.linkedBrowser.tabId}`,
      label: `Unload tab: ${tab.label}`,
      command: () => gBrowser.discardBrowser(tab),
      condition: () => gBrowser.selectedTab !== tab,
      icon: tab.image || "chrome://browser/skin/zen-icons/close-all.svg",
      tags: ["unload", "sleep", tab.label.toLowerCase()],
    });
  }
  return commands;
}

/**
 * Generates commands for switching between Zen Workspaces.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of workspace commands.
 */
export function generateWorkspaceCommands() {
  if (!window.gZenWorkspaces?.workspaceEnabled) return [];
  const workspacesData = window.gZenWorkspaces.getWorkspaces();
  if (!workspacesData) return [];

  return workspacesData.map((workspace) => {
    const icon = workspace.icon;
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
    PREFS.debugLog("SineAPI not found, skipping Sine command generation.");
    return [];
  }

  const commands = [];
  const installedMods = await SineAPI.utils.getMods();

  const marketplace = window.SineAPI?.manager?.marketplace;

  if (marketplace) {
    if (!marketplace.items) marketplace.init();
    const mods = marketplace.items;
    for (const modId in mods) {
      if (!installedMods[modId]) {
        const mod = mods[modId];
        commands.push({
          key: `sine:install:${modId}`,
          label: `Install Sine Mod: ${mod.name}`,
          command: () => {
            SineAPI.manager.installMod(mod.homepage);
          },
          icon: svgToUrl(icons.sine),
          tags: ["sine", "install", "mod", mod.name.toLowerCase()],
        });
      }
    }
  } else {
    PREFS.debugLog("Sine marketplace object not found. 'Install' commands will be unavailable.");
  }

  // Generate "Uninstall" commands for installed mods.
  for (const modId in installedMods) {
    const mod = installedMods[modId];
    commands.push({
      key: `sine:uninstall:${modId}`,
      label: `Uninstall Sine Mod: ${mod.name}`,
      command: async () => {
        if (window.confirm(`Are you sure you want to remove Sine mod "${mod.name}"?`)) {
          try {
            await SineAPI.manager.removeMod(mod.id);
            SineAPI.manager.rebuildMods();
            if (mod.js) {
              try {
                showToast({
                  title: `"${mod.name}" has been removed.`,
                  description: "A restart is recommended to fully unload its scripts.",
                  preset: 1,
                });
              } catch (e) {
                PREFS.debugError("Failed to show toast:", e);
              }
            }
          } catch (e) {
            PREFS.debugError("Failed to remove mod:", e);
          }
        }
      },
      icon: svgToUrl(icons.sine),
      tags: ["sine", "uninstall", "mod", mod.name.toLowerCase()],
    });
  }

  return commands;
}

/**
 * Generates commands related to Zen Folders, like deleting or moving tabs to them.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of folder-related commands.
 */
export async function generateFolderCommands() {
  if (!window.gZenFolders) return [];

  const commands = [];
  const folders = Array.from(gBrowser.tabContainer.querySelectorAll("zen-folder"));
  if (!folders.length) return [];

  // --- Generate "Delete Folder" commands ---
  folders.forEach((folder) => {
    commands.push({
      key: `folder-delete:${folder.id}`,
      label: `Delete Folder: ${folder.label}`,
      command: () => {
        if (
          confirm(
            `Are you sure you want to delete the folder "${folder.label}" and all its tabs? This cannot be undone.`
          )
        ) {
          folder.delete();
        }
      },
      icon: "chrome://browser/skin/zen-icons/edit-delete.svg",
      tags: ["folder", "delete", "remove", folder.label.toLowerCase()],
      allowShortcuts: false,
    });
  });

  // --- Generate "Move Active Tab to Folder" commands ---
  const activeTab = gBrowser.selectedTab;
  // Only generate these commands if there is an active, non-essential tab to move.
  if (activeTab && !activeTab.hasAttribute("zen-essential")) {
    folders.forEach((folder) => {
      // Don't show option to move a tab to its current folder.
      if (activeTab.group === folder) {
        return;
      }

      commands.push({
        key: `folder-move-active-to:${folder.id}`,
        label: `Move Tab to Folder: ${folder.label}`,
        command: () => {
          const tabToMove = gBrowser.selectedTab;
          if (!tabToMove) return;
          const targetFolder = document.getElementById(folder.id);
          if (!targetFolder) return;

          const targetWorkspaceId = targetFolder.getAttribute("zen-workspace-id");
          const currentWorkspaceId =
            tabToMove.getAttribute("zen-workspace-id") || gZenWorkspaces.activeWorkspace;

          if (currentWorkspaceId !== targetWorkspaceId) {
            gZenWorkspaces.moveTabToWorkspace(tabToMove, targetWorkspaceId);
          }

          if (!tabToMove.pinned) {
            gBrowser.pinTab(tabToMove);
          }
          targetFolder.addTabs([tabToMove]);

          if (gZenWorkspaces.activeWorkspace !== targetWorkspaceId) {
            gZenWorkspaces._lastSelectedWorkspaceTabs[targetWorkspaceId] = tabToMove;
            gZenWorkspaces.changeWorkspaceWithID(targetWorkspaceId);
          } else {
            gBrowser.selectedTab = tabToMove;
          }
        },
        condition: () => {
          const currentTab = gBrowser.selectedTab;
          return (
            currentTab && !currentTab.hasAttribute("zen-essential") && currentTab.group !== folder
          );
        },
        tags: ["folder", "move", "tab", folder.label.toLowerCase()],
      });
    });
  }

  return commands;
}

/**
 * Generates commands for moving the active tab to a different workspace.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of workspace-move commands.
 */
export function generateWorkspaceMoveCommands() {
  if (!window.gZenWorkspaces?.workspaceEnabled) return [];

  const commands = [];
  const workspacesData = window.gZenWorkspaces.getWorkspaces();
  if (!isNotEmptyTab()) return [];
  if (!workspacesData) return [];

  const activeTab = gBrowser.selectedTab;
  if (activeTab && !activeTab.hasAttribute("zen-essential")) {
    workspacesData.forEach((workspace) => {
      if (activeTab.getAttribute("zen-workspace-id") === workspace.uuid) {
        return;
      }

      commands.push({
        key: `workspace-move-active-to:${workspace.uuid}`,
        label: `Move Tab to Workspace: ${workspace.name}`,
        command: () => {
          const tabToMove = gBrowser.selectedTab;
          if (tabToMove) {
            gZenWorkspaces.moveTabToWorkspace(tabToMove, workspace.uuid);
            gZenWorkspaces.switchTabIfNeeded(tabToMove);
          }
        },
        condition: () => {
          const currentTab = gBrowser.selectedTab;
          return (!!currentTab);
        },
        tags: ["workspace", "move", "tab", workspace.name.toLowerCase()],
      });
    });
  }

  return commands;
}

export async function generateCustomCommands() {
  const { customCommands } = await Storage.loadSettings();
  if (!customCommands || customCommands.length === 0) {
    return [];
  }

  return customCommands.map((cmd) => {
    let commandFunc;
    if (cmd.type === "js") {
      commandFunc = async () => {
        try {
          const Cu = Components.utils;
          const sandbox = Cu.Sandbox(window, {
            sandboxPrototype: window,
            wantXrays: false,
          });
          Cu.evalInSandbox(cmd.code, sandbox);
        } catch (e) {
          try {
            showToast({
              title: `Custom command error: ${e.message}`,
              preset: 0,
            });
          } catch (toastError) {
            PREFS.debugError("Failed to show toast:", toastError);
          }
        }
      };
    } else if (cmd.type === "chain") {
      commandFunc = async () => {
        for (const step of cmd.commands) {
          if (typeof step === "string") {
            // It's a regular command key
            await new Promise((resolve) => setTimeout(resolve, 50));
            ZenCommandPalette.executeCommandByKey(step);
          } else if (typeof step === "object" && step.action && commandChainUtils[step.action]) {
            // It's a utility function call
            await commandChainUtils[step.action](step.params || {});
          }
        }
      };
    }

    return {
      key: `custom:${cmd.id}`,
      label: cmd.name,
      command: commandFunc,
      icon:
        cmd.icon ||
        (cmd.type === "js"
          ? "chrome://browser/skin/zen-icons/source-code.svg"
          : "chrome://browser/skin/zen-icons/settings.svg"),
      tags: ["custom", cmd.name.toLowerCase()],
      allowIcons: true,
      allowShortcuts: true,
    };
  });
}
