import { svgToUrl } from "../../utils/icon.js";

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
