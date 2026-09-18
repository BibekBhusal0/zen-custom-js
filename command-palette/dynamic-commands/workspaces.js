import { textToSvgDataUrl } from "../../utils/icon.js";
import { isNotEmptyTab } from "../utils/notEmptyTab.js";

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
          return !!currentTab;
        },
        tags: ["workspace", "move", "tab", workspace.name.toLowerCase()],
      });
    });
  }

  return commands;
}
