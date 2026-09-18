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
