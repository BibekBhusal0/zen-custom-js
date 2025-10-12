import { tool } from "ai";
import { z } from "zod";
import { messageManagerAPI } from "../messageManager.js";
import { debugLog, debugError } from "../utils/prefs.js";

// ╭─────────────────────────────────────────────────────────╮
// │                 TAB ID MANAGEMENT                       │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Manages unique, session-only IDs for tab objects.
 * This is necessary because no built-in tab property is consistently
 * available and unique for all tabs (e.g., background/unloaded tabs).
 */
const TabIdManager = new (class {
  #tabIdMap = new WeakMap();
  #idTabMap = new Map();
  #nextId = 1;

  _getOrCreateId(tab) {
    if (!this.#tabIdMap.has(tab)) {
      const id = this.#nextId++;
      this.#tabIdMap.set(tab, id);
      this.#idTabMap.set(id, tab);
    }
    return this.#tabIdMap.get(tab);
  }

  getTabById(id) {
    const numericId = Number(id);
    const tab = this.#idTabMap.get(numericId);
    // Ensure the tab still exists in the browser before returning it.
    if (tab && tab.ownerGlobal && !tab.ownerGlobal.closed && gBrowser.tabs.includes(tab)) {
      return tab;
    }
    // Clean up the map if the tab is gone.
    this.#idTabMap.delete(numericId);
    return null;
  }

  mapTab(tab) {
    if (!tab) return null;

    const id = this._getOrCreateId(tab);
    const splitGroup = tab.group?.hasAttribute("split-view-group") ? tab.group : null;
    const workspaceId = tab.getAttribute("zen-workspace-id");
    const workspace = workspaceId ? gZenWorkspaces.getWorkspaceFromId(workspaceId) : null;
    const activeWorkspaceId = gZenWorkspaces.activeWorkspace;
      const isEssential= tab.hasAttribute("zen-essential");
    const workspaceInfos = {
      workspaceId,
      workspaceName: workspace?.name || null,
      workspaceIcon: workspace?.icon || null,
    }

    return {
      id: String(id),
      title: tab.label,
      url: tab.linkedBrowser?.currentURI?.spec,
      isCurrent: tab === gBrowser.selectedTab,
      inCurrentWorkspace: workspaceId === activeWorkspaceId,
      pinned: tab.pinned,
      isGroup: gBrowser.isTabGroup(tab),
      isEssential,
      parentFolderId: tab.group && !splitGroup ? tab.group.id : null,
      parentFolderName: tab.group && !splitGroup ? tab.group.label : null,
      isSplitView: !!splitGroup,
      splitViewId: splitGroup ? splitGroup.id : null,
      ...(isEssential ? {} : workspaceInfos),
    };
  }
})();

// Helper function to create Zod string parameters
const createStringParameter = (description, isOptional = false) => {
  let schema = z.string().describe(description);
  return isOptional ? schema.optional() : schema;
};

// Helper function for array of strings parameter
const createStringArrayParameter = (description, isOptional = false) => {
  let schema = z.array(z.string()).describe(description);
  return isOptional ? schema.optional() : schema;
};

// Helper function to create tools with consistent structure
const createTool = (description, parameters, executeFn) => {
  return tool({
    description,
    inputSchema: z.object(parameters),
    execute: executeFn,
  });
};

// ╭─────────────────────────────────────────────────────────╮
// │                      HELPERS                            │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Retrieves tab objects based on their session IDs.
 * @param {string[]} tabIds - An array of session IDs for the tabs to retrieve.
 * @returns {Array<object>} An array of tab browser elements.
 */
function getTabsByIds(tabIds) {
  if (!Array.isArray(tabIds)) tabIds = [tabIds];
  return tabIds.map((id) => TabIdManager.getTabById(id)).filter(Boolean);
}

/**
 * Maps a tab element to a simplified object for AI consumption.
 * @param {object} tab - The tab browser element.
 * @returns {object|null} A simplified tab object, or null if the tab is invalid.
 */
function mapTabToObject(tab) {
  return TabIdManager.mapTab(tab);
}

// ╭─────────────────────────────────────────────────────────╮
// │                         SEARCH                          │
// ╰─────────────────────────────────────────────────────────╯
async function getSearchURL(engineName, searchTerm) {
  try {
    const engine = await Services.search.getEngineByName(engineName);
    if (!engine) {
      debugError(`No search engine found with name: ${engineName}`);
      return null;
    }
    const submission = engine.getSubmission(searchTerm.trim());
    if (!submission) {
      debugError(`No submission found for term: ${searchTerm} and engine: ${engineName}`);
      return null;
    }
    return submission.uri.spec;
  } catch (e) {
    debugError(`Error getting search URL for engine "${engineName}".`, e);
    return null;
  }
}

async function search(args) {
  const { searchTerm, engineName, where } = args;
  const defaultEngineName = Services.search.defaultEngine.name;
  const searchEngineName = engineName || defaultEngineName;
  if (!searchTerm) return { error: "Search tool requires a searchTerm." };

  const url = await getSearchURL(searchEngineName, searchTerm);
  if (url) {
    return await openLink({ link: url, where });
  } else {
    return {
      error: `Could not find search engine named '${searchEngineName}'.`,
    };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                          TABS                           │
// ╰─────────────────────────────────────────────────────────╯
async function openLink(args) {
  const { link, where = "new tab" } = args;
  if (!link) return { error: "openLink requires a link." };
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
          const rect = gBrowser.selectedBrowser.getBoundingClientRect();
          window.gZenGlanceManager.openGlance({
            url: link,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: 10,
            height: 10,
          });
        } else {
          openTrustedLinkIn(link, "tab");
          return { result: `Glance not available. Opened in a new tab.` };
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
        } else return { error: "Split view is not available." };
        break;
      default:
        openTrustedLinkIn(link, "tab");
        return {
          result: `Unknown location "${where}". Opened in a new tab as fallback.`,
        };
    }
    return { result: `Successfully opened ${link} in ${where}.` };
  } catch (e) {
    debugError(`Failed to open link "${link}" in "${where}".`, e);
    return { error: `Failed to open link.` };
  }
}

async function newSplit(args) {
  const { links, type = "vertical" } = args;
  if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
  if (!links || !Array.isArray(links) || links.length < 2)
    return { error: "newSplit requires an array of at least two links." };

  try {
    const tabs = [];
    for (const link of links) {
      // openTrustedLinkIn seems to always select the new tab
      await openTrustedLinkIn(link, "tab");
      tabs.push(gBrowser.selectedTab);
    }

    let gridType;
    const lowerType = type.toLowerCase();
    if (lowerType === "grid") {
      gridType = "grid";
    } else if (lowerType === "horizontal") {
      gridType = "hsep";
    } else {
      // "vertical" or default
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return {
      result: `Successfully created split view with ${links.length} tabs.`,
    };
  } catch (e) {
    debugError("Failed to create split view.", e);
    return { error: "Failed to create split view." };
  }
}

/**
 * Retrieves all open tabs across all workspaces.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all tabs.
 */
async function getAllTabs() {
  try {
    const allTabs = gZenWorkspaces.allStoredTabs.map(mapTabToObject).filter(Boolean);
    return { tabs: allTabs };
  } catch (e) {
    debugError("Failed to get all tabs:", e);
    return { error: "Failed to retrieve tabs." };
  }
}

/**
 * Closes specified tabs.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to close.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function closeTabs(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0) return { error: "closeTabs requires an array of tabIds." };
  try {
    const tabsToClose = getTabsByIds(tabIds);
    if (tabsToClose.length === 0) return { error: "No matching tabs found to close." };

    gBrowser.removeTabs(tabsToClose);
    return { result: `Successfully closed ${tabsToClose.length} tab(s).` };
  } catch (e) {
    debugError("Failed to close tabs:", e);
    return { error: "An error occurred while closing tabs." };
  }
}

/**
 * Splits existing tabs into a view.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to split.
 * @param {string} [args.type="vertical"] - The split type: 'horizontal', 'vertical', or 'grid'. Defaults to 'vertical'.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function splitExistingTabs(args) {
  const { tabIds, type = "vertical" } = args;
  if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
  if (!tabIds || tabIds.length < 2)
    return { error: "splitExistingTabs requires at least two tabIds." };

  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length < 2) return { error: "Could not find at least two tabs to split." };

    let gridType;
    const lowerType = type.toLowerCase();
    if (lowerType === "grid") {
      gridType = "grid";
    } else if (lowerType === "horizontal") {
      gridType = "hsep";
    } else {
      // "vertical" or default
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return { result: `Successfully created split view with ${tabs.length} tabs.` };
  } catch (e) {
    debugError("Failed to split existing tabs.", e);
    return { error: "Failed to create split view." };
  }
}

/**
 * Searches tabs based on a query.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search term for tabs.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of tab results or an error.
 */
async function searchTabs(args) {
  const { query } = args;
  if (!query) return { error: "searchTabs requires a query." };
  const lowerCaseQuery = query.toLowerCase();

  try {
    const allTabs = gZenWorkspaces.allStoredTabs;
    const results = allTabs
      .filter((tab) => {
        const title = tab.label?.toLowerCase() || "";
        const url = tab.linkedBrowser?.currentURI?.spec?.toLowerCase() || "";
        return title.includes(lowerCaseQuery) || url.includes(lowerCaseQuery);
      })
      .map(mapTabToObject)
      .filter(Boolean);

    return { tabs: results };
  } catch (e) {
    debugError(`Error searching tabs for query "${query}":`, e);
    return { error: `Failed to search tabs.` };
  }
}

/**
 * Adds tabs to a folder (tab group).
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to add.
 * @param {string} args.folderId - The ID of the folder to add the tabs to.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addTabsToFolder(args) {
  const { tabIds, folderId } = args;
  if (!tabIds || !folderId) return { error: "addTabsToFolder requires tabIds and a folderId." };

  try {
    const tabs = getTabsByIds(tabIds);
    const folder = document.getElementById(folderId);

    if (!folder || !folder.isZenFolder) {
      return { error: `Folder with ID "${folderId}" not found or is not a valid folder.` };
    }
    if (tabs.length === 0) return { error: "No valid tabs found to add to the folder." };

    folder.addTabs(tabs);
    return { result: `Successfully added ${tabs.length} tab(s) to folder "${folder.label}".` };
  } catch (e) {
    debugError("Failed to add tabs to folder:", e);
    return { error: "Failed to add tabs to folder." };
  }
}

/**
 * Removes tabs from their current folder.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to remove from their folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function removeTabsFromFolder(args) {
  const { tabIds } = args;
  if (!tabIds) return { error: "removeTabsFromFolder requires tabIds." };

  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No valid tabs found." };

    let ungroupedCount = 0;
    tabs.forEach((tab) => {
      if (tab.group) {
        gBrowser.ungroupTab(tab);
        ungroupedCount++;
      }
    });
    return { result: `Successfully ungrouped ${ungroupedCount} tab(s).` };
  } catch (e) {
    debugError("Failed to remove tabs from folder:", e);
    return { error: "Failed to remove tabs from folder." };
  }
}

/**
 * Creates a new, empty tab folder.
 * @param {object} args - The arguments object.
 * @param {string} args.name - The name for the new folder.
 * @returns {Promise<object>} A promise that resolves with the new folder's information or an error.
 */
async function createTabFolder(args) {
  const { name } = args;
  if (!name) return { error: "createTabFolder requires a name." };
  try {
    const folder = gZenFolders.createFolder([], { label: name, renameFolder: false });
    return {
      result: `Successfully created folder "${folder.label}".`,
      folder: {
        id: folder.id,
        name: folder.label,
      },
    };
  } catch (e) {
    debugError("Failed to create tab folder:", e);
    return { error: "Failed to create tab folder." };
  }
}

/**
 * Reorders a tab to a new index.
 * @param {object} args - The arguments object.
 * @param {string} args.tabId - The session ID of the tab to reorder.
 * @param {number} args.newIndex - The new index for the tab.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function reorderTab(args) {
  const { tabId, newIndex } = args;
  if (!tabId || typeof newIndex !== "number") {
    return { error: "reorderTab requires a tabId and a newIndex." };
  }
  try {
    const tab = TabIdManager.getTabById(tabId);
    if (!tab) return { error: `Tab with id ${tabId} not found.` };
    gBrowser.moveTabTo(tab, { tabIndex: newIndex });
    return { result: `Successfully moved tab to index ${newIndex}.` };
  } catch (e) {
    debugError("Failed to reorder tab:", e);
    return { error: "Failed to reorder tab." };
  }
}

/**
 * Adds one or more tabs to the essentials.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to add to essentials.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addTabsToEssentials(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0)
    return { error: "addTabsToEssentials requires at least one tabId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No matching tabs found." };
    if (window.gZenPinnedTabManager) {
      gZenPinnedTabManager.addToEssentials(tabs);
      return { result: `Successfully added ${tabs.length} tab(s) to essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    debugError("Failed to add tabs to essentials:", e);
    return { error: "An error occurred while adding tabs to essentials." };
  }
}

/**
 * Removes one or more tabs from the essentials.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - An array of session IDs for the tabs to remove from essentials.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function removeTabsFromEssentials(args) {
  const { tabIds } = args;
  if (!tabIds || tabIds.length === 0)
    return { error: "removeTabsFromEssentials requires at least one tabId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No matching tabs found." };
    if (window.gZenPinnedTabManager) {
      tabs.forEach((tab) => gZenPinnedTabManager.removeFromEssentials(tab));
      return { result: `Successfully removed ${tabs.length} tab(s) from essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    debugError("Failed to remove tabs from essentials:", e);
    return { error: "An error occurred while removing tabs from essentials." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                        BOOKMARKS                        │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Searches bookmarks based on a query.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search term for bookmarks.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of bookmark results or an error.
 */
async function searchBookmarks(args) {
  const { query } = args;
  if (!query) return { error: "searchBookmarks requires a query." };

  try {
    const searchParams = { query };
    const bookmarks = await PlacesUtils.bookmarks.search(searchParams);

    // Map to a simpler format to save tokens for the AI model
    const results = bookmarks.map((bookmark) => ({
      id: bookmark.guid,
      title: bookmark.title,
      url: bookmark?.url?.href,
      parentID: bookmark.parentGuid,
    }));

    debugLog(`Found ${results.length} bookmarks for query "${query}":`, results);
    return { bookmarks: results };
  } catch (e) {
    debugError(`Error searching bookmarks for query "${query}":`, e);
    return { error: `Failed to search bookmarks.` };
  }
}

/**
 * Reads all bookmarks.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all bookmark results or an error.
 */

async function getAllBookmarks() {
  try {
    const bookmarks = await PlacesUtils.bookmarks.search({});

    const results = bookmarks.map((bookmark) => ({
      id: bookmark.guid,
      title: bookmark.title,
      url: bookmark?.url?.href,
      parentID: bookmark.parentGuid,
    }));

    debugLog(`Read ${results.length} total bookmarks.`);
    return { bookmarks: results };
  } catch (e) {
    debugError(`Error reading all bookmarks:`, e);
    return { error: `Failed to read all bookmarks.` };
  }
}

/**
 * Creates a new bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.url - The URL to bookmark.
 * @param {string} [args.title] - The title for the bookmark. If not provided, the URL is used.
 * @param {string} [args.parentID] - The GUID of the parent folder. Defaults to the "Other Bookmarks" folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function createBookmark(args) {
  const { url, title, parentID } = args;
  if (!url) return { error: "createBookmark requires a URL." };

  try {
    const bookmarkInfo = {
      parentGuid: parentID || PlacesUtils.bookmarks.toolbarGuid,
      url: new URL(url),
      title: title || url,
    };

    const bm = await PlacesUtils.bookmarks.insert(bookmarkInfo);

    debugLog(`Bookmark created successfully:`, JSON.stringify(bm));
    return { result: `Successfully bookmarked "${bm.title}".` };
  } catch (e) {
    debugError(`Error creating bookmark for URL "${url}":`, e);
    return { error: `Failed to create bookmark.` };
  }
}

/**
 * Creates a new bookmark folder.
 * @param {object} args - The arguments object.
 * @param {string} args.title - The title for the new folder.
 * @param {string} [args.parentID] - The GUID of the parent folder. Defaults to the "Other Bookmarks" folder.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function addBookmarkFolder(args) {
  const { title, parentID } = args;
  if (!title) return { error: "addBookmarkFolder requires a title." };

  try {
    const folderInfo = {
      parentGuid: parentID || PlacesUtils.bookmarks.toolbarGuid,
      type: PlacesUtils.bookmarks.TYPE_FOLDER,
      title: title,
    };

    const folder = await PlacesUtils.bookmarks.insert(folderInfo);

    debugLog(`Bookmark folder created successfully:`, JSON.stringify(folderInfo));
    return { result: `Successfully created folder "${folder.title}".` };
  } catch (e) {
    debugError(`Error creating bookmark folder "${title}":`, e);
    return { error: `Failed to create folder.` };
  }
}

/**
 * Updates an existing bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The GUID of the bookmark to update.
 * @param {string} [args.url] - The new URL for the bookmark.
 * @param {string} [args.parentID] - parent id
 *
 * @param {string} [args.title] - The new title for the bookmark.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function updateBookmark(args) {
  const { id, url, title, parentID } = args;
  if (!id) return { error: "updateBookmark requires a bookmark id (guid)." };
  if (!url && !title && !parentID)
    return {
      error: "updateBookmark requires either a new url, title, or parentID.",
    };

  try {
    const oldBookmark = await PlacesUtils.bookmarks.fetch(id);
    if (!oldBookmark) {
      return { error: `No bookmark found with id "${id}".` };
    }

    const bm = await PlacesUtils.bookmarks.update({
      guid: id,
      url: url ? new URL(url) : oldBookmark.url,
      title: title || oldBookmark.title,
      parentGuid: parentID || oldBookmark.parentGuid,
    });

    debugLog(`Bookmark updated successfully:`, JSON.stringify(bm));
    return { result: `Successfully updated bookmark to "${bm.title}".` };
  } catch (e) {
    debugError(`Error updating bookmark with id "${id}":`, e);
    return { error: `Failed to update bookmark.` };
  }
}

/**
 * Deletes a bookmark.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The GUID of the bookmark to delete.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */

async function deleteBookmark(args) {
  const { id } = args;
  if (!id) return { error: "deleteBookmark requires a bookmark id (guid)." };
  try {
    await PlacesUtils.bookmarks.remove(id);
    debugLog(`Bookmark with id "${id}" deleted successfully.`);
    return { result: `Successfully deleted bookmark.` };
  } catch (e) {
    debugError(`Error deleting bookmark with id "${id}":`, e);
    return { error: `Failed to delete bookmark.` };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                        WORKSPACES                       │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Retrieves all workspaces.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all workspaces.
 */
async function getAllWorkspaces() {
  try {
    const { workspaces } = await gZenWorkspaces._workspaces();
    const activeWorkspaceId = gZenWorkspaces.activeWorkspace;
    const result = workspaces.map((ws) => ({
      id: ws.uuid,
      name: ws.name,
      icon: ws.icon,
      position: ws.position,
      isActive: ws.uuid === activeWorkspaceId,
    }));
    return { workspaces: result };
  } catch (e) {
    debugError("Failed to get all workspaces:", e);
    return { error: "Failed to retrieve workspaces." };
  }
}

/**
 * Creates a new workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.name - The name for the new workspace.
 * @param {string} [args.icon] - The icon (emoji or URL) for the new workspace.
 * @returns {Promise<object>} A promise that resolves with the new workspace information.
 */
async function createWorkspace(args) {
  const { name, icon } = args;
  if (!name) return { error: "createWorkspace requires a name." };
  try {
    const ws = await gZenWorkspaces.createAndSaveWorkspace(name, icon, false);
    return {
      result: `Successfully created workspace "${name}".`,
      workspace: { id: ws.uuid, name: ws.name, icon: ws.icon },
    };
  } catch (e) {
    debugError("Failed to create workspace:", e);
    return { error: "Failed to create workspace." };
  }
}

/**
 * Updates an existing workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to update.
 * @param {string} [args.name] - The new name for the workspace.
 * @param {string} [args.icon] - The new icon for the workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function updateWorkspace(args) {
  const { id, name, icon } = args;
  if (!id) return { error: "updateWorkspace requires a workspace id." };
  if (!name && !icon) return { error: "updateWorkspace requires a new name or icon." };
  try {
    const workspace = gZenWorkspaces.getWorkspaceFromId(id);
    if (!workspace) return { error: `Workspace with id ${id} not found.` };
    if (name) workspace.name = name;
    if (icon) workspace.icon = icon;
    await gZenWorkspaces.saveWorkspace(workspace);
    return { result: `Successfully updated workspace.` };
  } catch (e) {
    debugError("Failed to update workspace:", e);
    return { error: "Failed to update workspace." };
  }
}

/**
 * Deletes a workspace.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to delete.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function deleteWorkspace(args) {
  const { id } = args;
  if (!id) return { error: "deleteWorkspace requires a workspace id." };
  try {
    await gZenWorkspaces.removeWorkspace(id);
    return { result: "Successfully deleted workspace." };
  } catch (e) {
    debugError("Failed to delete workspace:", e);
    return { error: "Failed to delete workspace." };
  }
}

/**
 * Moves tabs to a specified workspace.
 * @param {object} args - The arguments object.
 * @param {string[]} args.tabIds - The session IDs of the tabs to move.
 * @param {string} args.workspaceId - The ID of the target workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function moveTabsToWorkspace(args) {
  const { tabIds, workspaceId } = args;
  if (!tabIds || !workspaceId)
    return { error: "moveTabsToWorkspace requires tabIds and a workspaceId." };
  try {
    const tabs = getTabsByIds(tabIds);
    if (tabs.length === 0) return { error: "No valid tabs found to move." };
    gZenWorkspaces.moveTabsToWorkspace(tabs, workspaceId);
    return { result: `Successfully moved ${tabs.length} tab(s) to workspace.` };
  } catch (e) {
    debugError("Failed to move tabs to workspace:", e);
    return { error: "Failed to move tabs to workspace." };
  }
}

/**
 * Reorders a workspace to a new position.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the workspace to reorder.
 * @param {number} args.newPosition - The new zero-based index for the workspace.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
async function reorderWorkspace(args) {
  const { id, newPosition } = args;
  if (!id || typeof newPosition !== "number") {
    return { error: "reorderWorkspace requires a workspace id and a newPosition." };
  }
  try {
    await gZenWorkspaces.reorderWorkspace(id, newPosition);
    return { result: "Successfully reordered workspace." };
  } catch (e) {
    debugError("Failed to reorder workspace:", e);
    return { error: "Failed to reorder workspace." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                         ELEMENTS                        │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Clicks an element on the page.
 * @param {object} args - The arguments object.
 * @param {string} args.selector - The CSS selector of the element to click.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function clickElement(args) {
  const { selector } = args;
  if (!selector) return { error: "clickElement requires a selector." };
  return messageManagerAPI.clickElement(selector);
}

/**
 * Fills a form input on the page.
 * @param {object} args - The arguments object.
 * @param {string} args.selector - The CSS selector of the input element to fill.
 * @param {string} args.value - The value to fill the input with.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function fillForm(args) {
  const { selector, value } = args;
  if (!selector) return { error: "fillForm requires a selector." };
  if (value === undefined) return { error: "fillForm requires a value." };
  return messageManagerAPI.fillForm(selector, value);
}

// ╭─────────────────────────────────────────────────────────╮
// │                        UI FEEDBACK                      │
// ╰─────────────────────────────────────────────────────────╯

/**
 * Shows a temporary toast message to the user.
 * @param {object} args - The arguments object.
 * @param {string} args.title - The main title of the toast message.
 * @param {string} [args.description] - Optional secondary text for the toast.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function showToast(args) {
  const { title, description } = args;
  if (!title) return { error: "showToast requires a title." };

  try {
    if (window.ucAPI && typeof window.ucAPI.showToast === "function") {
      // ucAPI.showToast takes an array [title, description] and a preset.
      // Preset 0 means no button will be shown.
      // https://github.com/CosmoCreeper/Sine/blob/main/engine/utils/uc_api.js#L102
      window.ucAPI.showToast([title, description], 0);
      return { result: "Toast displayed successfully." };
    } else {
      debugError("ucAPI.showToast is not available.");
      return { error: "Toast functionality is not available." };
    }
  } catch (e) {
    debugError("Failed to show toast:", e);
    return { error: "An error occurred while displaying the toast." };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                         YOUTUBE                         │
// ╰─────────────────────────────────────────────────────────╯
/**
 * Wrapper for messageManagerAPI.getYoutubeComments to handle arguments.
 * @param {object} args - The arguments object.
 * @param {number} [args.count] - The number of comments to retrieve.
 * @returns {Promise<object>} A promise that resolves with the comments.
 */
async function getYoutubeComments(args) {
  return messageManagerAPI.getYoutubeComments(args.count);
}

const toolNameMapping = {
  search: "Searching the web",
  openLink: "Opening a link",
  newSplit: "Creating a split view",
  splitExistingTabs: "Splitting existing tabs",
  getAllTabs: "Reading tabs",
  searchTabs: "Searching tabs",
  closeTabs: "Closing tabs",
  reorderTab: "Reordering a tab",
  addTabsToFolder: "Adding tabs to a folder",
  removeTabsFromFolder: "Removing tabs from a folder",
  createTabFolder: "Creating a tab folder",
  addTabsToEssentials: "Adding tabs to Essentials",
  removeTabsFromEssentials: "Removing tabs from Essentials",
  getPageTextContent: "Reading page content",
  getHTMLContent: "Reading page source code",
  clickElement: "Clicking an element",
  fillForm: "Filling a form",
  getYoutubeTranscript: "Getting YouTube transcript",
  getYoutubeDescription: "Getting YouTube description",
  getYoutubeComments: "Getting YouTube comments",
  searchBookmarks: "Searching bookmarks",
  getAllBookmarks: "Reading bookmarks",
  createBookmark: "Creating a bookmark",
  addBookmarkFolder: "Creating a bookmark folder",
  updateBookmark: "Updating a bookmark",
  deleteBookmark: "Deleting a bookmark",
  getAllWorkspaces: "Reading workspaces",
  createWorkspace: "Creating a workspace",
  updateWorkspace: "Updating a workspace",
  deleteWorkspace: "Deleting a workspace",
  moveTabsToWorkspace: "Moving tabs to a workspace",
  reorderWorkspace: "Reordering a workspace",
  showToast: "Showing a notification",
};

const tabsInstructions = `If you open tab in glace it will create new small popup window to show the tab, vsplit and hsplit means it will open new tab in vertical and horizontal split with current tab respectively.`;
const toolGroups = {
  search: {
    moreInstructions: async () => {
      const searchEngines = await Services.search.getVisibleEngines();
      const engineNames = searchEngines.map((e) => e.name).join(", ");
      const defaultEngineName = Services.search.defaultEngine.name;
      return (
        `For the search tool, available engines are: ${engineNames}. The default is '${defaultEngineName}'.` +
        "\n" +
        tabsInstructions
      );
    },
    tools: {
      search: createTool(
        "Performs a web search using a specified search engine and opens the results.",
        {
          searchTerm: createStringParameter("The term to search for."),
          engineName: createStringParameter("The name of the search engine to use.", true),
          where: createStringParameter(
            "Where to open results. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Default: 'new tab'.",
            true
          ),
        },
        search
      ),
    },
    example: async () => {
      return `#### Searching and Spliting: 
-   **User Prompt:** "search cat in google and dog in youtube open them in vertical split"
-   **Your first Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "cat", "engineName": "google", where: "new tab"}}}\`
-   **Your second Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "dog", "engineName": "youtube", where: "vsplit"}}}\`
Note: Only second search is open in split (vertial by default), this will make it split with first search.
`;
    },
  },
  navigation: {
    moreInstructions: tabsInstructions + "While opening tab make sure it has valid URL.",
    tools: {
      openLink: createTool(
        "Opens a given URL in a specified location. Can also create a split view with the current tab.",
        {
          link: createStringParameter("The URL to open."),
          where: createStringParameter(
            "Where to open the link. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Default: 'new tab'.",
            true
          ),
        },
        openLink
      ),
      newSplit: createTool(
        "Creates a split view by opening multiple new URLs in new tabs, then arranging them side-by-side.",
        {
          links: createStringArrayParameter("An array of URLs for the new tabs."),
          type: createStringParameter(
            "The split type: 'vertical', 'horizontal', or 'grid'. Defaults to 'vertical'.",
            true
          ),
        },
        newSplit
      ),
      splitExistingTabs: createTool(
        "Creates a split view from existing open tabs.",
        {
          tabIds: createStringArrayParameter("An array of tab session IDs to split."),
          type: createStringParameter(
            "The split type: 'vertical', 'horizontal', or 'grid'. Defaults to 'vertical'.",
            true
          ),
        },
        splitExistingTabs
      ),
    },
    example: async () => `#### Opening a Single Link:
-   **User Prompt:** "open github"
-   **Your Tool Call:** \`{"functionCall": {"name": "openLink", "args": {"link": "https://github.com", "where": "new tab"}}}\`

#### Creating a Split View with New Pages:
-   **User Prompt:** "show me youtube and twitch side by side"
-   **Your Tool Call:** \`{"functionCall": {"name": "newSplit", "args": {"links": ["https://youtube.com", "https://twitch.tv"], "type": "vertical"}}}\`

#### Splitting Existing Tabs:
-   **User Prompt:** "Make all my open youtube tabs in grid"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call (after getting tab IDs):** \`{"functionCall": {"name": "splitExistingTabs", "args": {"tabIds": ["x", "y", ...]}, "type": "grid"}}\``,
  },
  tabs: {
    moreInstructions: `Zen browser has advanced tab management features they are:
- Workspaces: Different workspace can contain different tabs (pinned and unpinned).
- Essential: Essential tabs are not workspace specific, they are most important tabs and they are always shown dispite of current workspace.
- Tab folders: Similar tabs can be made in folders to organize it in better way (it is also called tab group).
- Split tabs: Zen allows to view multiple tabs at same time by splitting.

The tool getAllTabs is super super useful, tool you can use it in multiple case for tab/workspace management
`,
    tools: {
      getAllTabs: createTool(
        "Retrieves all open tabs. Also provides more information about tabs like id, title, url, isCurrent, inCurrentWorkspace, workspace, workspaceName, workspaceIcon, pinned, isGroup, isEssential, parentFolderId, parentFolderName, isSplitView, splitViewId.",
        {},
        getAllTabs
      ),
      searchTabs: createTool(
        "Searches open tabs by title or URL. Similar to `getAllTabs` this will also provide more information about tab.",
        { query: createStringParameter("The search term for tabs.") },
        searchTabs
      ),
      closeTabs: createTool(
        "Closes one or more tabs.",
        { tabIds: createStringArrayParameter("An array of tab session IDs to close.") },
        closeTabs
      ),
      reorderTab: createTool(
        "Reorders a tab to a new index.",
        {
          tabId: createStringParameter("The session ID of the tab to reorder."),
          newIndex: z.number().describe("The new index for the tab."),
        },
        reorderTab
      ),
      addTabsToFolder: createTool(
        "Adds one or more tabs to a folder.",
        {
          tabIds: createStringArrayParameter("The session IDs of the tabs to add."),
          folderId: createStringParameter("The ID of the folder to add the tabs to."),
        },
        addTabsToFolder
      ),
      removeTabsFromFolder: createTool(
        "Removes one or more tabs from their folder.",
        {
          tabIds: createStringArrayParameter(
            "The session IDs of the tabs to remove from their folder."
          ),
        },
        removeTabsFromFolder
      ),
      createTabFolder: createTool(
        "Creates a new, empty tab folder.",
        {
          name: createStringParameter("The name for the new folder."),
        },
        createTabFolder
      ),
      addTabsToEssentials: createTool(
        "Adds one or more tabs to the essentials.",
        { tabIds: createStringArrayParameter("An array of session IDs to add to essentials.") },
        addTabsToEssentials
      ),
      removeTabsFromEssentials: createTool(
        "Removes one or more tabs from the essentials.",
        {
          tabIds: createStringArrayParameter("An array of session IDs to remove from essentials."),
        },
        removeTabsFromEssentials
      ),
    },
    example: async () => `#### Finding and Closing Tabs:
-   **User Prompt:** "close all youtube tabs"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchTabs", "args": {"query": "youtube.com"}}}\`
-   **Your Second Tool Call (after receiving tab IDs):** \`{"functionCall": {"name": "closeTabs", "args": {"tabIds": ["1", "2"]}}}\`

#### Creating a Folder and Adding Tabs:
-   **User Prompt:** "create a new folder called 'Social Media' and add all my facebook tab to it"
-   **Your First Tool Call (to get tab ID):** \`{"functionCall": {"name": "searchTabs", "args": {"query": "facebook.com"}}}\`
-   **Your Second Tool Call (to create folder):** \`{"functionCall": {"name": "createTabFolder", "args": {"name": "Social Media"}}}\`
-   **Your Third Tool Call (after getting IDs):** \`{"functionCall": {"name": "addTabsToFolder", "args": {"tabIds": ["3", ...], "folderId": "folder-123"}}}\`

#### Making a Tab Essential:
-   **User Prompt:** "make my current tab essential"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call (after finding the current tab ID):** \`{"functionCall": {"name": "addTabsToEssentials", "args": {"tabIds": ["5"]}}}\``,
  },
  pageInteraction: {
    tools: {
      getPageTextContent: createTool(
        "Retrieves the text content of the current web page to answer questions. Only use if the initial context is insufficient to answer user's question or fulfill user's command.",
        {},
        messageManagerAPI.getPageTextContent.bind(messageManagerAPI)
      ),
      getHTMLContent: createTool(
        "Retrieves the full HTML source of the current web page for detailed analysis. Use this tool very rarely, only when text content is insufficient.",
        {},
        messageManagerAPI.getHTMLContent.bind(messageManagerAPI)
      ),
      clickElement: createTool(
        "Clicks an element on the page.",
        {
          selector: createStringParameter("The CSS selector of the element to click."),
        },
        clickElement
      ),
      fillForm: createTool(
        "Fills a form input on the page.",
        {
          selector: createStringParameter("The CSS selector of the input element to fill."),
          value: createStringParameter("The value to fill the input with."),
        },
        fillForm
      ),
    },
    example: async () => `#### Reading the Current Page for Context
-   **User Prompt:** "summarize this page for me"
-   **Your Tool Call:** \`{"functionCall": {"name": "getPageTextContent", "args": {}}}\`
-   And you summarize the page as per user's requirements.

#### Finding and Clicking a Link on the Current Page
-   **User Prompt:** "click on the contact link"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call (after receiving HTML and finding the link):** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#contact-link"}}}\`

#### Filling a form:
-   **User Prompt:** "Fill the name with John and submit"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "fillForm", "args": {"selector": "#name", "value": "John"}}}\`
-   **Your Third Tool Call:** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#submit-button"}}}\`
Note: you must run tool getHTMLContent before clicking button or filling form to make sure element exists.
`,
  },
  youtube: {
    tools: {
      getYoutubeTranscript: createTool(
        "Retrieves the transcript of the current YouTube video. Only use if the current page is a YouTube video.",
        {},
        messageManagerAPI.getYoutubeTranscript.bind(messageManagerAPI)
      ),
      getYoutubeDescription: createTool(
        "Retrieves the description of the current YouTube video. Only use if the current page is a YouTube video.",
        {},
        messageManagerAPI.getYoutubeDescription.bind(messageManagerAPI)
      ),
      getYoutubeComments: createTool(
        "Retrieves top-level comments from the current YouTube video. Only use if the current page is a YouTube video.",
        {
          count: z
            .number()
            .optional()
            .describe("The maximum number of comments to retrieve. Defaults to 10."),
        },
        getYoutubeComments
      ),
    },
    example: async () => `#### Getting YouTube Video Details:
-   **User Prompt:** "Summarize this Youtube Video in 5 bullet points"
-   **Your Tool Call:** \`{"functionCall": {"name": "getYoutubeTranscript"}}\`
-   And you summarize the video as per user's requirements.

#### Reading Youtube Comments:
-   **User Prompt:** "What are the user's feedback on this video"
-   **Your Tool Call:** \`{"functionCall": {"name": "getYoutubeComments", count: 20}}\`
-   And Based on comments you tell user about the user's feedback on video.
`,
  },
  bookmarks: {
    tools: {
      searchBookmarks: createTool(
        "Searches bookmarks based on a query.",
        {
          query: createStringParameter("The search term for bookmarks."),
        },
        searchBookmarks
      ),
      getAllBookmarks: createTool("Retrieves all bookmarks.", {}, getAllBookmarks),
      createBookmark: createTool(
        "Creates a new bookmark.",
        {
          url: createStringParameter("The URL to bookmark."),
          title: createStringParameter("The title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        createBookmark
      ),
      addBookmarkFolder: createTool(
        "Creates a new bookmark folder.",
        {
          title: createStringParameter("The title for the new folder."),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        addBookmarkFolder
      ),
      updateBookmark: createTool(
        "Updates an existing bookmark.",
        {
          id: createStringParameter("The GUID of the bookmark to update."),
          url: createStringParameter("The new URL for the bookmark.", true),
          title: createStringParameter("The new title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        updateBookmark
      ),
      deleteBookmark: createTool(
        "Deletes a bookmark.",
        {
          id: createStringParameter("The GUID of the bookmark to delete."),
        },
        deleteBookmark
      ),
    },
    example: async () => `#### Finding and Editing a bookmark by folder name:
-   **User Prompt:** "Move bookmark titled 'Example' to folder 'MyFolder'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "Example"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "MyFolder"}}}\`
-   **Your Third Tool Call (after receiving the bookmark and folder ids):** \`{"functionCall": {"name": "updateBookmark", "args": {"id": "xxxxxxxxxxxx", "parentID": "yyyyyyyyyyyy"}}}\`
Note that first and second tool clls can be made in parallel, but the third tool call needs output from the first and second tool calls so it must be made after first and second.`,
  },
  workspaces: {
    moreInstructions: `Zen browser has advanced tab management features and one of them is workspace.
Different workspace can contain different tabs (pinned and unpinned). A workspace has it's own icon (most likely a emoji sometimes even URL), name and it has tabs inside workspace. While creating new workspace if user don't specify icon use most logical emoji you could find but don't use text make sure to use emoji.

Also if tab is essential which means does not belong to any specific workspace.
`,
    tools: {
      getAllWorkspaces: createTool(
        "Retrieves all workspaces with id, name, icon, position and isActive.",
        {},
        getAllWorkspaces
      ),
      createWorkspace: createTool(
        "Creates a new workspace.",
        {
          name: createStringParameter("The name for the new workspace."),
          icon: createStringParameter("The icon (emoji or URL) for the new workspace.", true),
        },
        createWorkspace
      ),
      updateWorkspace: createTool(
        "Updates an existing workspace (name and icon).",
        {
          id: createStringParameter("The ID of the workspace to update."),
          name: createStringParameter("The new name for the workspace.", true),
          icon: createStringParameter("The new icon for the workspace.", true),
        },
        updateWorkspace
      ),
      deleteWorkspace: createTool(
        "Deletes a workspace.",
        { id: createStringParameter("The ID of the workspace to delete.") },
        deleteWorkspace
      ),
      moveTabsToWorkspace: createTool(
        "Moves tabs to a specified workspace.",
        {
          tabIds: createStringArrayParameter("The session IDs of the tabs to move."),
          workspaceId: createStringParameter("The ID of the target workspace."),
        },
        moveTabsToWorkspace
      ),
      reorderWorkspace: createTool(
        "Reorders a workspace to a new position.",
        {
          id: createStringParameter("The ID of the workspace to reorder."),
          newPosition: z.number().describe("The new zero-based index for the workspace."),
        },
        reorderWorkspace
      ),
    },
    // example: async () =>
  },
  uiFeedback: {
    tools: {
      showToast: createTool(
        "Shows a temporary toast message to the user.",
        {
          title: createStringParameter("The main title of the toast message."),
          description: createStringParameter("Optional secondary text for the toast.", true),
        },
        showToast
      ),
    },
    example: async () => `#### Showing a Toast Notification:
-   **User Prompt:** "let me know when the download is complete"
-   **Your Tool Call (after a long-running task):** \`{"functionCall": {"name": "showToast", "args": {"title": "Download Complete", "description": "The file has been saved to your downloads folder."}}}\``,
  },
  misc: {
    example: async (activeGroups) => {
      let example = "";
      if (activeGroups.has("workspaces") && activeGroups.has("tabs")) {
        example += `#### Creating and Managing a Workspace:
-   **User Prompt:** "make a new workspace called 'Research', then move all tabs related to animals in that workspace."
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "createWorkspace", "args": {"name": "Research"}}}\`
-   **Your Third Tool Call (after getting the new workspace ID and reading all tabs):** \`{"functionCall": {"name": "moveTabsToWorkspace", "args": {"tabIds": ["x", "y", ...], "workspaceId": "e1f2a3b4-c5d6..."}}}\`

#### Advanced tabs management (using tools related to folder and workspace to manage tabs)
-   **User Prompt:** "My tabs are not properly managed manage them"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call:**(based on all tabs) \`{"functionCall": {"name": "createTabFolder", "args": {"name": "..."}}}\`
-   **Your Third Tool Call (based on all tabs):** \`{"functionCall": {"name": "addTabsToFolder", "args": {"tabIds": ["x", "y", ...] }}}\`
-   **Your Fourth Tool Call (based on all tabs):** \`{"functionCall": {"name": "moveTabsToWorkspace", "args": {"tabIds": ["x", "y", ...], "workspaceId": "e1f2a3b4-c5d6..."}}}\`
-   Go on making on tool calls until tabs are managed.

`;
      }
      return example;
    },
  },
};

const getTools = (groups, { shouldToolBeCalled, afterToolCall } = {}) => {
  const selectedTools = (() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      // get all tools from all groups except 'misc'
      return Object.entries(toolGroups).reduce((acc, [name, group]) => {
        if (name !== "misc" && group.tools) {
          return { ...acc, ...group.tools };
        }
        return acc;
      }, {});
    }
    return groups.reduce((acc, groupName) => {
      if (toolGroups[groupName] && toolGroups[groupName].tools) {
        return { ...acc, ...toolGroups[groupName].tools };
      }
      return acc;
    }, {});
  })();

  if (!shouldToolBeCalled && !afterToolCall) {
    return selectedTools;
  }

  const wrappedTools = {};
  for (const toolName in selectedTools) {
    const originalTool = selectedTools[toolName];
    const newTool = { ...originalTool };

    const originalExecute = originalTool.execute;
    newTool.execute = async (args) => {
      if (shouldToolBeCalled && !(await shouldToolBeCalled(toolName))) {
        debugLog(`Tool execution for '${toolName}' was denied by shouldToolBeCalled.`);
        return { error: `Tool execution for '${toolName}' was denied by user.` };
      }
      const result = await originalExecute(args);
      if (afterToolCall) afterToolCall(toolName, result);
      return result;
    };
    wrappedTools[toolName] = newTool;
  }

  return wrappedTools;
};

const getToolSystemPrompt = async (groups, includeExamples = true) => {
  try {
    const activeGroupNames =
      groups && Array.isArray(groups) && groups.length > 0
        ? groups
        : Object.keys(toolGroups).filter((g) => g !== "misc");
    const activeGroups = new Set(activeGroupNames);

    let availableTools = [];
    let toolExamples = [];

    for (const groupName of activeGroupNames) {
      const group = toolGroups[groupName];
      if (group) {
        if (group.tools) {
          for (const toolName in group.tools) {
            const tool = group.tools[toolName];
            const params = Object.keys(tool.inputSchema.shape).join(", ");
            availableTools.push(`- \`${toolName}(${params})\`: ${tool.description}`);
          }
        }
        if (group.moreInstructions) {
          const instructions =
            typeof group.moreInstructions === "function"
              ? await group.moreInstructions()
              : group.moreInstructions;
          availableTools.push(instructions);
        }
        if (includeExamples && group.example) {
          toolExamples.push(await group.example(activeGroups));
        }
      }
    }

    if (includeExamples && toolGroups.misc && toolGroups.misc.example) {
      const miscExample = await toolGroups.misc.example(activeGroups);
      if (miscExample) toolExamples.push(miscExample);
    }

    let systemPrompt = `
## Available Tools:
${availableTools.join("\n")}
`;

    if (includeExamples && toolExamples.length > 0) {
      systemPrompt += `
## Tool Call Examples:
These are just examples for you on how you can use tools calls, each example gives you some concept, the concept is not specific to single tool.

${toolExamples.join("\n\n")}
`;
    }

    return systemPrompt;
  } catch (error) {
    debugError("Error in getToolSystemPrompt:", error);
    return "";
  }
};

export { getToolSystemPrompt, getTools, toolNameMapping, toolGroups };
