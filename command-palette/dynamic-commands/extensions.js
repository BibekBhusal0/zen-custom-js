import { PREFS } from "../utils/prefs.js";

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

function triggerExtensionAction(addonId) {
  const policy = globalThis.WebExtensionPolicy?.getByID(addonId);
  const extension = policy?.extension;
  if (!extension) return false;

  const browserWindow = Services.wm.getMostRecentWindow("navigator:browser") || window;

  try {
    const { ExtensionParent } = ChromeUtils.importESModule(
      "resource://gre/modules/ExtensionParent.sys.mjs"
    );
    const apiGlobal = ExtensionParent.apiManager?.global;
    for (const getter of ["browserActionFor", "pageActionFor", "sidebarActionFor"]) {
      try {
        const forFn = apiGlobal?.[getter];
        if (typeof forFn === "function") {
          const action = forFn(extension);
          if (action?.triggerAction) {
            action.triggerAction(browserWindow);
            return true;
          }
        }
      } catch {}
    }
  } catch (e) {
    PREFS.debugError("triggerExtensionAction via ExtensionParent failed", e);
  }

  try {
    const button =
      browserWindow.document.querySelector(`toolbarbutton[data-extensionid="${addonId}"]`) ||
      document.querySelector(`toolbarbutton[data-extensionid="${addonId}"]`);
    if (button) {
      button.click();
      return true;
    }
  } catch (e) {
    PREFS.debugError("triggerExtensionAction via toolbar button failed", e);
  }

  return false;
}

/**
 * Generates commands for triggering extension actions (toolbar button click)
 * and running named extension commands declared in manifest.json `commands`
 * (e.g. Obsidian Web Clipper capture, Dark Reader toggle).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of extension action commands.
 */
export async function generateExtensionCommands() {
  let addons;
  try {
    addons = await AddonManager.getAddonsByTypes(["extension"]);
  } catch (e) {
    PREFS.debugError("Failed to load addons for extension actions.", e);
    return [];
  }

  const commands = [];
  for (const addon of addons) {
    if (!addon.isActive || addon.isSystem) continue;

    const policy = globalThis.WebExtensionPolicy?.getByID(addon.id);
    const extension = policy?.extension;
    if (!extension) continue;

    const manifest = extension.manifest || {};
    const hasAction = !!(manifest.action || manifest.browser_action || manifest.page_action);
    if (hasAction) {
      commands.push({
        key: `extension-action:${addon.id}`,
        label: `Trigger Extension: ${addon.name}`,
        command: () => triggerExtensionAction(addon.id),
        icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
        tags: ["extension", "addon", "trigger", "action", addon.name.toLowerCase()],
      });
    }

    let extensionCommands = [];
    try {
      if (extension.shortcuts?.allCommands) {
        extensionCommands = await extension.shortcuts.allCommands();
      }
    } catch (e) {
      PREFS.debugError(`Failed to load commands for ${addon.id}`, e);
      continue;
    }

    for (const cmd of extensionCommands) {
      if (!cmd?.name || cmd.name.startsWith("_execute_")) continue;
      const cmdLabel = cmd.description || cmd.name;
      commands.push({
        key: `extension-command:${addon.id}:${cmd.name}`,
        label: `${addon.name}: ${cmdLabel}`,
        command: () => {
          try {
            extension.shortcuts.onCommand(cmd.name);
          } catch (e) {
            PREFS.debugError(`Failed to run extension command ${cmd.name}`, e);
          }
        },
        icon: addon.iconURL || "chrome://mozapps/skin/extensions/extension.svg",
        // Manifest-declared shortcut (e.g. "Ctrl+Shift+Y"), shown in the
        // palette via getShortcutForCommand unless the user overrides it.
        shortcut: cmd.shortcut || null,
        tags: [
          "extension",
          "addon",
          "command",
          "run",
          addon.name.toLowerCase(),
          cmd.name.toLowerCase(),
          cmdLabel.toLowerCase(),
        ],
      });
    }
  }
  return commands;
}
