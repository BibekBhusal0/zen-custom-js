import { PREFS } from "../utils/prefs.js";
import { svgToUrl, icons } from "../../utils/icon.js";
import { showToast } from "../../utils/toast.js";

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
