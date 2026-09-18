import { PREFS } from "../utils/prefs.js";

/**
 * Loads toolkit profile names keyed by root directory path, so selectable
 * profiles can fall back to the matching toolkit name.
 * @returns {Map<string, string>} Map of root path to profile name.
 */
function loadToolkitProfileNames() {
  const names = new Map();
  try {
    const profileService = Cc["@mozilla.org/toolkit/profile-service;1"].getService(
      Ci.nsIToolkitProfileService
    );
    for (const profile of profileService.profiles) {
      try {
        const root = profile.rootDir?.path;
        const name = String(profile.name ?? "").trim();
        if (root && name) names.set(root, name);
      } catch {}
    }
  } catch {}
  return names;
}

/**
 * Resolves the display name of a profile from every available source. Falls
 * back to a numbered name only when no name is found anywhere.
 * @param {object} profile - A SelectableProfile or nsIToolkitProfile.
 * @param {string} numberedFallback - Fallback used when no name is available.
 * @param {Map<string, string>|null} toolkitNames - Toolkit names by root path.
 * @returns {Promise<string>} The profile name or the fallback.
 */
async function resolveProfileName(profile, numberedFallback, toolkitNames = null) {
  const direct = String(profile.name ?? "").trim();
  if (direct) return direct;
  try {
    const safe = await profile.toContentSafeObject?.();
    const contentName = String(safe?.name ?? "").trim();
    if (contentName) return contentName;
  } catch {}
  try {
    if (typeof profile.path === "string") {
      const toolkitName = toolkitNames?.get(profile.path);
      if (toolkitName) return toolkitName;
      const leaf = profile.path.split(/[/\\]/).pop() || "";
      const suffix = leaf.includes(".") ? leaf.slice(leaf.indexOf(".") + 1).trim() : leaf.trim();
      if (suffix) return suffix;
    }
  } catch {}
  return numberedFallback;
}

/**
 * Generates commands for switching between profiles.
 * Lists toolkit profiles first (the about:profiles list, launched with
 * Services.startup.createInstanceWithProfile just like its buttons do),
 * then selectable profiles not already covered (launched with
 * SelectableProfileService.launchInstance), deduplicated by folder path.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of profile commands.
 */
export async function generateProfileCommands() {
  const commands = [];
  const seenPaths = new Set();

  try {
    const profileService = Cc["@mozilla.org/toolkit/profile-service;1"].getService(
      Ci.nsIToolkitProfileService
    );
    const currentRoot = profileService.currentProfile?.rootDir?.path;
    let index = 0;
    for (const profile of profileService.profiles) {
      index++;
      let root = null;
      try {
        root = profile.rootDir?.path;
      } catch {}
      if (!root || root === currentRoot) continue;
      seenPaths.add(root);
      const name = await resolveProfileName(profile, `Profile ${index}`);
      commands.push({
        key: `profile:launch:${name}`,
        label: `Switch to Profile: ${name}`,
        command: () => Services.startup.createInstanceWithProfile(profile),
        icon: "chrome://browser/skin/zen-icons/tab.svg",
        tags: ["profile", "switch", "launch", name.toLowerCase()],
      });
    }
  } catch (e) {
    PREFS.debugError("Failed to load toolkit profiles.", e);
  }

  try {
    const { SelectableProfileService } = ChromeUtils.importESModule(
      "resource:///modules/profiles/SelectableProfileService.sys.mjs"
    );
    const profiles = await SelectableProfileService.getAllProfiles?.();
    if (profiles?.length) {
      const currentId = SelectableProfileService.currentProfile?.id;
      const toolkitNames = loadToolkitProfileNames();
      for (const profile of profiles) {
        if (profile.id === currentId) continue;
        if (profile.path && seenPaths.has(profile.path)) continue;
        const name = await resolveProfileName(profile, `Profile ${profile.id}`, toolkitNames);
        let icon = "chrome://browser/skin/zen-icons/tab.svg";
        try {
          if (!profile.hasCustomAvatar && typeof profile.getAvatarPath === "function") {
            icon = profile.getAvatarPath(24) || icon;
          }
        } catch {}
        commands.push({
          key: `profile:switch:${profile.id}`,
          label: `Switch to Profile: ${name}`,
          command: () => SelectableProfileService.launchInstance(profile),
          icon,
          tags: ["profile", "switch", name.toLowerCase()],
        });
      }
    }
  } catch (e) {
    PREFS.debugError("Failed to load selectable profiles.", e);
  }

  if (!commands.length) {
    commands.push({
      key: "profile:manage",
      label: "Manage Profiles (about:profiles)",
      command: () => switchToTabHavingURI("about:profiles", true),
      condition: !!window.switchToTabHavingURI,
      icon: "chrome://browser/skin/zen-icons/container-tab.svg",
      tags: ["profile", "manage", "about"],
    });
  }

  return commands;
}
