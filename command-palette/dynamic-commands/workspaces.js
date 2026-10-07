import { isNotEmptyTab } from "../utils/notEmptyTab.js";

/**
 * Pretty fields mirroring Zen's native workspace actions
 * (ZenUBActionsProvider), rendered as the prettyName chip.
 */
function workspacePretty(workspace) {
  let accentColor;
  try {
    accentColor =
      window.gZenWorkspaces
        .workspaceElement(workspace.uuid)
        ?.style.getPropertyValue("--zen-primary-color") || undefined;
  } catch {}
  return {
    prettyName: workspace.name,
    prettyIcon: workspace.icon || undefined,
    accentColor,
  };
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
    return {
      key: `workspace:${workspace.uuid}`,
      label: "Focus on",
      ...workspacePretty(workspace),
      command: () => window.gZenWorkspaces.changeWorkspaceWithID(workspace.uuid),
      condition: () => workspace.uuid !== window.gZenWorkspaces.activeWorkspace,
      icon: "chrome://browser/skin/zen-icons/forward.svg",
      tags: ["workspace", "switch", "focus", workspace.name.toLowerCase()],
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
        label: "Move Tab to Workspace",
        ...workspacePretty(workspace),
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
