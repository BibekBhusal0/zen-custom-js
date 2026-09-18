/**
 * Generates commands related to Zen Folders, like deleting or moving tabs to them.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of folder-related commands.
 */
export async function generateFolderCommands() {
  if (!window.gZenFolders) return [];

  const commands = [];
  const folders = Array.from(gBrowser.tabContainer.querySelectorAll("zen-folder"));
  if (!folders.length) return [];

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
