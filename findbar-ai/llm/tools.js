import { str, num, strArr, arrOf, obj, paramNames } from "./schema.js";
import { getVideoContext } from "./youtube.js";
import { messageManagerAPI } from "../messageManager.js";
import { PREFS } from "../utils/prefs.js";
import { showToast } from "../../utils/toast.js";
import {
  getEngineByName,
  getDefaultEngine,
  getVisibleEngines,
} from "../../utils/search-service.js";
import { openLink } from "../../utils/open-link.js";
import { bestFuzzyScore } from "../../utils/fuzzy.js";
import { buildTools } from "../library/build-tools.js";

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
    const existing = this.#tabIdMap.get(tab);
    if (existing !== undefined && this.#idTabMap.get(existing) === tab) {
      return existing;
    }
    // WeakMap still knows the tab but the id map lost it (a miss deletes
    // there): issue a fresh id so getAllTabs output always resolves.
    const id = this.#nextId++;
    this.#tabIdMap.set(tab, id);
    this.#idTabMap.set(id, tab);
    return id;
  }

  getTabById(id) {
    const numericId = Number(id);
    if (Number.isInteger(numericId)) {
      const tab = this.#idTabMap.get(numericId);
      // gBrowser.tabs only covers the active strip in Zen (tabs live in
      // per-workspace sections), so validate DOM presence directly instead.
      // No ownerGlobal check: if our own window were closed, no code here
      // would be running to ask.
      if (tab && tab.isConnected && !tab.closing) {
        return tab;
      }
      this.#idTabMap.delete(numericId);
    }
    // Fall back to the tab element's own id (Zen assigns stable unique ids).
    if (typeof id === "string" && id) {
      try {
        const el = document.getElementById(id);
        if (el && el.tagName === "tab" && el.isConnected && !el.closing) return el;
      } catch {}
    }
    return null;
  }

  knownIds() {
    const ids = [];
    for (const [id, tab] of this.#idTabMap) {
      if (tab && tab.isConnected) ids.push(id);
    }
    return ids.sort((a, b) => a - b);
  }

  mapTab(tab) {
    if (!tab) return null;

    const id = this._getOrCreateId(tab);
    const splitGroup = tab.group?.hasAttribute("split-view-group") ? tab.group : null;
    const workspaceId = tab.getAttribute("zen-workspace-id");
    const workspace = workspaceId ? gZenWorkspaces.getWorkspaceFromId(workspaceId) : null;
    const activeWorkspaceId = gZenWorkspaces.activeWorkspace;
    const isEssential = tab.hasAttribute("zen-essential");
    const workspaceInfos = {
      workspaceId,
      workspaceName: workspace?.name || null,
      workspaceIcon: workspace?.icon || null,
    };

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

// Zen marks its own folder/workspace placeholder tabs with zen-empty-tab
// (user-opened blank tabs never carry it), and filters them the same way.
function isPlaceholderTab(tab) {
  try {
    return tab.hasAttribute("zen-empty-tab");
  } catch {
    return false;
  }
}

const createStringParameter = (description, isOptional = false) => {
  return str(description, isOptional);
};

const createStringArrayParameter = (description, isOptional = false) => {
  return strArr(description, isOptional);
};

const createTool = (description, parameters, executeFn) => {
  return {
    description,
    parameters: obj(parameters),
    execute: executeFn,
  };
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

function missingTabIds(tabIds) {
  if (!Array.isArray(tabIds)) tabIds = [tabIds];
  return tabIds.filter((id) => !TabIdManager.getTabById(id)).map((id) => String(id));
}

function unknownTabsError(missing) {
  let known = "";
  try {
    const ids = TabIdManager.knownIds();
    if (ids.length) known = ` Known tab ids right now: ${ids.join(", ")}.`;
  } catch {}
  return (
    `No tabs found for ids: ${missing.join(", ")}.${known} ` +
    `Copy the exact "id" values from getAllTabs or searchTabs output; never invent, prefix, or derive them.`
  );
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
    const engine = await getEngineByName(engineName);
    if (!engine) {
      PREFS.debugError(`No search engine found with name: ${engineName}`);
      return null;
    }
    const submission = engine.getSubmission(searchTerm.trim());
    if (!submission) {
      PREFS.debugError(`No submission found for term: ${searchTerm} and engine: ${engineName}`);
      return null;
    }
    return submission.uri.spec;
  } catch (e) {
    PREFS.debugError(`Error getting search URL for engine "${engineName}".`, e);
    return null;
  }
}

async function search(args) {
  const { searchTerm, engineName, where } = args;
  const defaultEngine = await getDefaultEngine();
  const defaultEngineName = defaultEngine.name;
  const searchEngineName = engineName || defaultEngineName;
  if (!searchTerm) return { error: "Search tool requires a searchTerm." };

  const url = await getSearchURL(searchEngineName, searchTerm);
  if (url) {
    return await openLinkTool({ link: url, where });
  } else {
    return {
      error: `Could not find search engine named '${searchEngineName}'.`,
    };
  }
}

// ╭─────────────────────────────────────────────────────────╮
// │                          TABS                           │
// ╰─────────────────────────────────────────────────────────╯
async function openLinkTool(args) {
  const { link, where = "new tab" } = args;
  if (!link) return { error: "openLink requires a link." };
  const destination = where?.toLowerCase()?.trim();
  try {
    const opened = await openLink(link, destination);
    if (opened) return { result: `Successfully opened ${link} in ${where}.` };
    const reason =
      destination === "glance"
        ? "Glance not available."
        : (destination || "").endsWith("split")
          ? "Split view is not available."
          : `Unknown location "${where}".`;
    return { result: `${reason} Opened in a new tab as fallback.` };
  } catch (e) {
    PREFS.debugError(`Failed to open link "${link}" in "${where}".`, e);
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
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return {
      result: `Successfully created split view with ${links.length} tabs.`,
    };
  } catch (e) {
    PREFS.debugError("Failed to create split view.", e);
    return { error: "Failed to create split view." };
  }
}

/**
 * Retrieves all open tabs across all workspaces.
 * @returns {Promise<object>} A promise that resolves with an object containing an array of all tabs.
 */
async function getAllTabs() {
  try {
    const allTabs = gZenWorkspaces.allStoredTabs
      .filter((tab) => !isPlaceholderTab(tab))
      .map(mapTabToObject)
      .filter(Boolean);
    return { tabs: allTabs };
  } catch (e) {
    PREFS.debugError("Failed to get all tabs:", e);
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
    if (tabsToClose.length === 0)
      return { error: unknownTabsError(missingTabIds(tabIds)) };

    gBrowser.removeTabs(tabsToClose);
    return { result: `Successfully closed ${tabsToClose.length} tab(s).` };
  } catch (e) {
    PREFS.debugError("Failed to close tabs:", e);
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
    if (tabs.length < 2)
      return { error: unknownTabsError(missingTabIds(tabIds)) };

    let gridType;
    const lowerType = type.toLowerCase();
    if (lowerType === "grid") {
      gridType = "grid";
    } else if (lowerType === "horizontal") {
      gridType = "hsep";
    } else {
      gridType = "vsep";
    }

    gZenViewSplitter.splitTabs(tabs, gridType);
    return { result: `Successfully created split view with ${tabs.length} tabs.` };
  } catch (e) {
    PREFS.debugError("Failed to split existing tabs.", e);
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
  const { query } = args || {};
  if (!query) return { error: "searchTabs requires a query." };

  try {
    const allTabs = gZenWorkspaces.allStoredTabs.filter((tab) => !isPlaceholderTab(tab));
    const results = allTabs
      .map((tab) => {
        const title = tab.label || "";
        const url = tab.linkedBrowser?.currentURI?.spec || "";
        return { tab, score: bestFuzzyScore([title, url], query) };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ tab }) => mapTabToObject(tab))
      .filter(Boolean);

    return { tabs: results };
  } catch (e) {
    PREFS.debugError(`Error searching tabs for query "${query}":`, e);
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
      return {
        error: `Folder with ID "${folderId}" not found. Use the folder "id" from createTabFolder's result, not its name.`,
      };
    }
    if (tabs.length === 0) return { error: unknownTabsError(missingTabIds(tabIds)) };

    for (const tab of tabs) {
      if (!tab.pinned) gBrowser.pinTab(tab);
    }

    folder.addTabs(tabs);
    return { result: `Successfully added ${tabs.length} tab(s) to folder "${folder.label}".` };
  } catch (e) {
    PREFS.debugError("Failed to add tabs to folder:", e);
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
    if (tabs.length === 0) return { error: unknownTabsError(missingTabIds(tabIds)) };

    let ungroupedCount = 0;
    tabs.forEach((tab) => {
      if (tab.group) {
        gBrowser.ungroupTab(tab);
        ungroupedCount++;
      }
    });
    return { result: `Successfully ungrouped ${ungroupedCount} tab(s).` };
  } catch (e) {
    PREFS.debugError("Failed to remove tabs from folder:", e);
    return { error: "Failed to remove tabs from folder." };
  }
}

/**
 * Creates new, empty tab folders (one per name, or many via args.names).
 * @param {object} args - The arguments object.
 * @param {string} [args.name] - The name for the new folder.
 * @param {string[]} [args.names] - Folder names to create in one call.
 * @returns {Promise<object>} A promise that resolves with the new folder's information or an error.
 */
async function createTabFolder(args) {
  const { name, names } = args || {};
  const targets = Array.isArray(names) && names.length ? names : name ? [name] : [];
  if (!targets.length) return { error: "createTabFolder requires a name, or a names array." };
  try {
    const folders = targets.map((label) => {
      const folder = gZenFolders.createFolder([], { label, renameFolder: false });
      return { id: folder.id, name: folder.label };
    });
    if (targets.length === 1) {
      return {
        result: `Successfully created folder "${folders[0].name}".`,
        folder: folders[0],
      };
    }
    return { result: `Successfully created ${folders.length} folders.`, folders };
  } catch (e) {
    PREFS.debugError("Failed to create tab folder:", e);
    return { error: "Failed to create tab folder." };
  }
}

async function deleteTabFolder(args) {
  const { folderId, folderIds } = args || {};
  const targets =
    Array.isArray(folderIds) && folderIds.length ? folderIds : folderId ? [folderId] : [];
  if (!targets.length)
    return { error: "deleteTabFolder requires a folderId, or a folderIds array." };
  const deleted = [];
  const failed = [];
  for (const id of targets) {
    try {
      const folder = document.getElementById(id);
      if (!folder || !folder.isZenFolder) {
        failed.push(id);
        continue;
      }
      const name = folder.label || String(id);
      const memberTabs = gZenWorkspaces.allStoredTabs.filter(
        (tab) => tab.group === folder && !isPlaceholderTab(tab)
      );
      for (const tab of memberTabs) {
        try {
          gBrowser.ungroupTab(tab);
        } catch {}
      }
      if (typeof gZenFolders?.removeFolder === "function") {
        await gZenFolders.removeFolder(folder);
      } else if (typeof folder.delete === "function") {
        await folder.delete();
      } else {
        folder.remove();
      }
      deleted.push({ id: String(id), name, ungrouped: memberTabs.length });
    } catch (e) {
      PREFS.debugError(`Failed to delete tab folder "${id}":`, e);
      failed.push(id);
    }
  }
  if (targets.length === 1) {
    if (!deleted.length)
      return {
        error: `No folder found with id "${targets[0]}". Copy the exact "id" from getAllTabs output; never invent it or use the folder name.`,
      };
    const d = deleted[0];
    return { result: `Deleted folder "${d.name}". ${d.ungrouped} tab(s) kept open.` };
  }
  return {
    result: `Deleted ${deleted.length}/${targets.length} folders. Contained tabs were kept open.`,
    deleted: deleted.map((d) => d.id),
    failed,
  };
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
    if (!tab) return { error: unknownTabsError([tabId]) };
    gBrowser.moveTabTo(tab, { tabIndex: newIndex });
    return { result: `Successfully moved tab to index ${newIndex}.` };
  } catch (e) {
    PREFS.debugError("Failed to reorder tab:", e);
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
    if (tabs.length === 0) return { error: unknownTabsError(missingTabIds(tabIds)) };
    if (window.gZenPinnedTabManager) {
      gZenPinnedTabManager.addToEssentials(tabs);
      return { result: `Successfully added ${tabs.length} tab(s) to essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    PREFS.debugError("Failed to add tabs to essentials:", e);
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
    if (tabs.length === 0) return { error: unknownTabsError(missingTabIds(tabIds)) };
    if (window.gZenPinnedTabManager) {
      tabs.forEach((tab) => gZenPinnedTabManager.removeEssentials(tab));
      return { result: `Successfully removed ${tabs.length} tab(s) from essentials.` };
    } else {
      return { error: "Essentials manager is not available." };
    }
  } catch (e) {
    PREFS.debugError("Failed to remove tabs from essentials:", e);
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

    PREFS.debugLog(`Found ${results.length} bookmarks for query "${query}":`, results);
    return { bookmarks: results };
  } catch (e) {
    PREFS.debugError(`Error searching bookmarks for query "${query}":`, e);
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

    PREFS.debugLog(`Read ${results.length} total bookmarks.`);
    return { bookmarks: results };
  } catch (e) {
    PREFS.debugError(`Error reading all bookmarks:`, e);
    return { error: `Failed to read all bookmarks.` };
  }
}

/**
 * Creates a new bookmark, or many at once via args.bookmarks.
 * @param {object} args - The arguments object.
 * @param {string} [args.url] - The URL to bookmark (single mode).
 * @param {string} [args.title] - The title for the bookmark. If not provided, the URL is used.
 * @param {string} [args.parentID] - The GUID of the parent folder.
 * @param {Array} [args.bookmarks] - Items with {url, title?, parentID?} for batch mode.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function insertBookmark({ url, title, parentID }) {
  const bm = await PlacesUtils.bookmarks.insert({
    parentGuid: parentID || PlacesUtils.bookmarks.toolbarGuid,
    url: new URL(url),
    title: title || url,
  });
  return { id: bm.guid, title: bm.title, url };
}

async function createBookmark(args) {
  const { url, title, parentID, bookmarks } = args || {};
  if (Array.isArray(bookmarks) && bookmarks.length) {
    const created = [];
    for (const item of bookmarks) {
      if (!item || !item.url) {
        created.push({ error: "Each bookmark needs a url." });
        continue;
      }
      try {
        created.push({
          result: `Bookmarked "${item.title || item.url}".`,
          ...(await insertBookmark({ ...item, parentID: item.parentID || parentID })),
        });
      } catch (e) {
        PREFS.debugError(`Error creating bookmark for URL "${item.url}":`, e);
        created.push({ error: `Failed to bookmark "${item.url}".` });
      }
    }
    const ok = created.filter((r) => !r.error).length;
    return { result: `Created ${ok}/${created.length} bookmarks.`, bookmarks: created };
  }
  if (!url) return { error: "createBookmark requires a URL, or a bookmarks array." };

  try {
    const bm = await insertBookmark({ url, title, parentID });
    PREFS.debugLog(`Bookmark created successfully:`, JSON.stringify(bm));
    return { result: `Successfully bookmarked "${bm.title}".`, id: bm.id };
  } catch (e) {
    PREFS.debugError(`Error creating bookmark for URL "${url}":`, e);
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

    PREFS.debugLog(`Bookmark folder created successfully:`, JSON.stringify(folderInfo));
    return { result: `Successfully created folder "${folder.title}".` };
  } catch (e) {
    PREFS.debugError(`Error creating bookmark folder "${title}":`, e);
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
  const { id, url, title, parentID } = args || {};
  if (!id) return { error: "updateBookmark requires a bookmark id (guid)." };
  if (url === undefined && title === undefined && !parentID)
    return {
      error: "updateBookmark requires a new url, title, or parentID.",
    };

  try {
    const oldBookmark = await PlacesUtils.bookmarks.fetch(id);
    if (!oldBookmark) {
      return { error: `No bookmark found with id "${id}".` };
    }
    if (url !== undefined && oldBookmark.type !== PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      return { error: "Only URL bookmarks have a URL to update." };
    }
    let newUrl = oldBookmark.url;
    if (url !== undefined) {
      try {
        newUrl = new URL(url);
      } catch {
        return { error: `"${url}" is not a valid URL.` };
      }
    }

    const info = {
      guid: id,
      url: newUrl,
      title: title !== undefined ? title : oldBookmark.title,
    };
    if (parentID) {
      info.parentGuid = parentID;
      info.index = PlacesUtils.bookmarks.DEFAULT_INDEX;
    }
    const bm = await PlacesUtils.bookmarks.update(info);

    PREFS.debugLog(`Bookmark updated successfully:`, JSON.stringify(bm));
    return { result: `Successfully updated bookmark to "${bm.title}".` };
  } catch (e) {
    PREFS.debugError(`Error updating bookmark with id "${id}":`, e);
    return { error: `Failed to update bookmark.` };
  }
}

/**
 * Deletes a bookmark, or many at once via args.ids.
 * @param {object} args - The arguments object.
 * @param {string} [args.id] - The GUID of the bookmark to delete.
 * @param {string[]} [args.ids] - GUIDs of bookmarks to delete in one call.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */

async function deleteBookmark(args) {
  const { id, ids } = args || {};
  const targets = Array.isArray(ids) && ids.length ? ids : id ? [id] : [];
  if (!targets.length)
    return { error: "deleteBookmark requires a bookmark id (guid), or an ids array." };
  try {
    const deleted = [];
    const failed = [];
    for (const guid of targets) {
      try {
        await PlacesUtils.bookmarks.remove(guid);
        deleted.push(guid);
      } catch (e) {
        PREFS.debugError(`Error deleting bookmark with id "${guid}":`, e);
        failed.push(guid);
      }
    }
    if (targets.length === 1) {
      return failed.length
        ? { error: `Failed to delete bookmark.` }
        : { result: `Successfully deleted bookmark.` };
    }
    return { result: `Deleted ${deleted.length}/${targets.length} bookmarks.`, deleted, failed };
  } catch (e) {
    PREFS.debugError(`Error deleting bookmarks:`, e);
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
    let workspaces = null;
    if (typeof gZenWorkspaces?.getWorkspaces === "function") {
      workspaces = await gZenWorkspaces.getWorkspaces();
    } else if (typeof gZenWorkspaces?._workspaces === "function") {
      const res = await gZenWorkspaces._workspaces();
      workspaces = Array.isArray(res) ? res : res?.workspaces;
    }
    if (!Array.isArray(workspaces)) throw new Error("Workspace list unavailable.");
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
    PREFS.debugError("Failed to get all workspaces:", e);
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
    PREFS.debugError("Failed to create workspace:", e);
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
    PREFS.debugError("Failed to update workspace:", e);
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
    PREFS.debugError("Failed to delete workspace:", e);
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
    if (tabs.length === 0) return { error: unknownTabsError(missingTabIds(tabIds)) };
    gZenWorkspaces.moveTabsToWorkspace(tabs, workspaceId);
    return { result: `Successfully moved ${tabs.length} tab(s) to workspace.` };
  } catch (e) {
    PREFS.debugError("Failed to move tabs to workspace:", e);
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
    PREFS.debugError("Failed to reorder workspace:", e);
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
async function clickElement(args, opts) {
  const { selector } = args || {};
  if (!selector) return { error: "clickElement requires a selector." };
  return messageManagerAPI.clickElement(selector, opts);
}

/**
 * Fills a form input on the page.
 * @param {object} args - The arguments object.
 * @param {string} args.selector - The CSS selector of the input element to fill.
 * @param {string} args.value - The value to fill the input with.
 * @returns {Promise<object>} A promise that resolves with a success message or an error.
 */
async function fillForm(args, opts) {
  const { selector, value } = args || {};
  if (!selector) return { error: "fillForm requires a selector." };
  if (value === undefined) return { error: "fillForm requires a value." };
  return messageManagerAPI.fillForm(selector, value, opts);
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
async function showCustomToast(args) {
  const { title, description } = args;
  if (!title) return { error: "showToast requires a title." };

  try {
    showToast({
      title,
      description,
      preset: 0,
    });
    return { result: "Toast displayed successfully." };
  } catch (e) {
    PREFS.debugError("Failed to show toast:", e);
    return { error: "An error occurred while displaying the toast." };
  }
}
// ╭─────────────────────────────────────────────────────────╮
// │                         YOUTUBE                         │
// ╰─────────────────────────────────────────────────────────╯
async function getYoutubeTranscript(args, opts) {
  if (!messageManagerAPI.currentUrlIsYouTubeVideo()) {
    return {
      error: "Current page is not a YouTube video. Only use this tool on youtube.com/watch pages.",
    };
  }
  try {
    const video = await getVideoContext(messageManagerAPI.getUrlAndTitle().url, 0);
    if (video && video.text) return { transcript: video.text };
  } catch (e) {
    PREFS.debugLog("Captions API transcript failed, falling back to page transcript.", e?.message);
  }
  return messageManagerAPI.getYoutubeTranscript(opts);
}

const toolVerbs = {
  search: ["Searching the web", "Searched the web"],
  openLink: ["Opening a link", "Opened link"],
  newSplit: ["Creating a split view", "Created split view"],
  splitExistingTabs: ["Splitting existing tabs", "Split tabs"],
  getAllTabs: ["Reading tabs", "Read tabs"],
  searchTabs: ["Searching tabs", "Searched tabs"],
  closeTabs: ["Closing tabs", "Closed tabs"],
  reorderTab: ["Reordering a tab", "Reordered tab"],
  addTabsToFolder: ["Adding tabs to a folder", "Added tabs to folder"],
  removeTabsFromFolder: ["Removing tabs from a folder", "Removed tabs from folder"],
  createTabFolder: ["Creating a tab folder", "Created tab folder"],
  deleteTabFolder: ["Deleting a tab folder", "Deleted folder"],
  addTabsToEssentials: ["Adding tabs to Essentials", "Added to Essentials"],
  removeTabsFromEssentials: ["Removing tabs from Essentials", "Removed from Essentials"],
  getPageTextContent: ["Reading page content", "Read page"],
  getHTMLContent: ["Reading page source code", "Read page source"],
  clickElement: ["Clicking an element", "Clicked element"],
  fillForm: ["Filling a form", "Filled form"],
  getYoutubeTranscript: ["Getting YouTube transcript", "Got transcript"],
  getYoutubeDescription: ["Getting YouTube description", "Got description"],
  searchBookmarks: ["Searching bookmarks", "Searched bookmarks"],
  getAllBookmarks: ["Reading bookmarks", "Read bookmarks"],
  createBookmark: ["Creating a bookmark", "Created bookmark"],
  addBookmarkFolder: ["Creating a bookmark folder", "Created bookmark folder"],
  updateBookmark: ["Updating a bookmark", "Updated bookmark"],
  deleteBookmark: ["Deleting a bookmark", "Deleted bookmark"],
  getAllWorkspaces: ["Reading workspaces", "Read workspaces"],
  createWorkspace: ["Creating a workspace", "Created workspace"],
  updateWorkspace: ["Updating a workspace", "Updated workspace"],
  deleteWorkspace: ["Deleting a workspace", "Deleted workspace"],
  moveTabsToWorkspace: ["Moving tabs to a workspace", "Moved tabs"],
  reorderWorkspace: ["Reordering a workspace", "Reordered workspace"],
  showToast: ["Showing a notification", "Showed notification"],
  inspectChrome: ["Inspecting browser UI", "Inspected UI"],
  applyPreviewCSS: ["Previewing CSS", "Previewed CSS"],
  runChromeJS: ["Running browser script", "Ran script"],
  listMods: ["Listing Sine mods", "Listed mods"],
  readMod: ["Reading mod files", "Read mod"],
  createMod: ["Creating a Sine mod", "Created mod"],
  updateModFile: ["Editing mod files", "Edited mod"],
  getPreviewState: ["Checking staged preview", "Checked preview"],
  clearPreview: ["Clearing preview", "Cleared preview"],
};

const toolNameMapping = Object.fromEntries(
  Object.entries(toolVerbs).map(([name, [loading]]) => [name, loading])
);

const tabsInstructions = `If you open tab in glace it will create new small popup window to show the tab, vsplit and hsplit means it will open new tab in vertical and horizontal split with current tab respectively.`;
const toolGroups = {
  search: {
    moreInstructions: async () => {
      const searchEngines = await getVisibleEngines();
      const defaultEngine = await getDefaultEngine();
      const engineNames = searchEngines.map((e) => e.name).join(", ");
      const defaultEngineName = defaultEngine.name;
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
            "Where to open the link. Options: 'current tab', 'new tab', 'background tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Default: 'new tab'.",
            true
          ),
        },
        openLinkTool
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

The tool getAllTabs is super super useful, tool you can use it in multiple case for tab/workspace management. Don't ask conformative questions to user like when user's input is clear. Like when user asks you to close tabs don't ask them "Do you really want to close those tabs ... ".
More importantly, please don't use IDs of folder/tabs/workspace while talking to user, refere them by name not id. User might not know the ids of tabs.
**Never** mention tabId or groupId with the user. Don't ask for Id if you need Id to filfill user's request you have to read it yourself.
Tab IDs are short numeric strings valid for this session only: always call getAllTabs or searchTabs first and copy the "id" values exactly. Never invent IDs, add prefixes like "tab-", use indexes, or pass URLs/names where an ID is expected. Folder operations need the folder "id" from getAllTabs (folders list) or createTabFolder's result, never the folder name.
Tabs placed in a folder are automatically pinned; that is expected, not something to undo.
Batch independent work into single calls: close/move/group many tabs with one call's tabIds array, create several folders with one createTabFolder names array, delete several folders with one deleteTabFolder folderIds array.
`,
    tools: {
      getAllTabs: createTool(
        "Retrieves all open tabs plus all tab folders (id, name, tabCount), including empty folders. Also provides more information about tabs like id, title, url, isCurrent, inCurrentWorkspace, workspace, workspaceName, workspaceIcon, pinned, isGroup, isEssential, parentFolderId, parentFolderName, isSplitView, splitViewId. Zen's own blank placeholder tabs are excluded.",
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
          newIndex: num("The new index for the tab."),
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
        "Creates new, empty tab folders. Pass names to create several at once.",
        {
          name: createStringParameter("The name for the new folder.", true),
          names: createStringArrayParameter(
            "Multiple folder names to create in one call. Either this or name is required.",
            true
          ),
        },
        createTabFolder
      ),
      deleteTabFolder: createTool(
        "Deletes one or more tab folders by id. Tabs inside are kept open (ungrouped), never closed.",
        {
          folderId: createStringParameter("The ID of the folder to delete.", true),
          folderIds: createStringArrayParameter(
            "Multiple folder IDs to delete in one call. Either this or folderId is required.",
            true
          ),
        },
        deleteTabFolder
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
        "Retrieves the transcript of the current YouTube video. Only use if the current page is a YouTube video; on any other page it fails fast with an error.",
        {},
        getYoutubeTranscript
      ),
      getYoutubeDescription: createTool(
        "Retrieves the description of the current YouTube video. Only use if the current page is a YouTube video; on any other page it fails fast with an error.",
        {},
        messageManagerAPI.getYoutubeDescription.bind(messageManagerAPI)
      ),
    },
    example: async () => `#### Getting YouTube Video Details:
-   **User Prompt:** "Summarize this Youtube Video in 5 bullet points"
-   **Your Tool Call:** \`{"functionCall": {"name": "getYoutubeTranscript"}}\`
-   And you summarize the video as per user's requirements.
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
        "Creates one bookmark, or many at once via bookmarks (preferred for multiples). Returns each bookmark's id so you can update or delete without searching.",
        {
          url: createStringParameter("The URL to bookmark.", true),
          title: createStringParameter("The title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
          bookmarks: arrOf(
            obj({
              url: str("The URL to bookmark."),
              title: str("The title for the bookmark.", true),
              parentID: str("The GUID of the parent folder.", true),
            }),
            "Multiple bookmarks to create in one call. Either this or url is required.",
            true
          ),
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
        "Deletes one bookmark by id, or many at once via ids.",
        {
          id: createStringParameter("The GUID of the bookmark to delete.", true),
          ids: createStringArrayParameter(
            "Multiple bookmark GUIDs to delete in one call. Either this or id is required.",
            true
          ),
        },
        deleteBookmark
      ),
    },
    example: async () => `#### Finding and Editing a bookmark by folder name:
-   **User Prompt:** "Move bookmark titled 'Example' to folder 'MyFolder'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "Example"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "MyFolder"}}}\`
-   **Your Third Tool Call (after receiving the bookmark and folder ids):** \`{"functionCall": {"name": "updateBookmark", "args": {"id": "xxxxxxxxxxxx", "parentID": "yyyyyyyyyyyy"}}}\`
Note that first and second tool clls can be made in parallel, but the third tool call needs output from the first and second tool calls so it must be made after first and second.

#### Saving several bookmarks at once:
-   **User Prompt:** "Bookmark these three pages in folder 'Reading'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "addBookmarkFolder", "args": {"title": "Reading"}}}\`
-   **Your Second Tool Call (after getting the folder id):** \`{"functionCall": {"name": "createBookmark", "args": {"bookmarks": [{"url": "https://a.com", "title": "A", "parentID": "zzzzzzzzzzzz"}, {"url": "https://b.com", "title": "B", "parentID": "zzzzzzzzzzzz"}, {"url": "https://c.com", "title": "C", "parentID": "zzzzzzzzzzzz"}]}}}\`
Note: one createBookmark call with the bookmarks array, not one call per bookmark. The result includes each bookmark's id for later update/delete.`,
  },
  workspaces: {
    moreInstructions: `Zen browser has advanced tab management features and one of them is workspace.
Different workspace can contain different tabs (pinned and unpinned). A workspace has it's own icon (most likely a emoji sometimes even URL), name and it has tabs inside workspace. While creating new workspace if user don't specify icon use most logical emoji you could find but don't use text make sure to use emoji.
If tab is essential which means does not belong to any specific workspace.

**Never** mention worksapceId with the user. Don't ask for Id if you need Id to filfill user's request you have to read it yourself.
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
          newPosition: num("The new zero-based index for the workspace."),
        },
        reorderWorkspace
      ),
    },
  },
  uiFeedback: {
    tools: {
      showToast: createTool(
        "Shows a temporary toast message to the user.",
        {
          title: createStringParameter("The main title of the toast message."),
          description: createStringParameter("Optional secondary text for the toast.", true),
        },
        showCustomToast
      ),
    },
    example: async () => `#### Showing a Toast Notification:
-   **User Prompt:** "let me know when the download is complete"
-   **Your Tool Call (after a long-running task):** \`{"functionCall": {"name": "showToast", "args": {"title": "Download Complete", "description": "The file has been saved to your downloads folder."}}}\``,
  },
  build: {
    moreInstructions: `Build tools act on the BROWSER CHROME (Firefox UI), not web content. inspectChrome and applyPreviewCSS never need permission; runChromeJS, createMod, and updateModFile (non-BrowseBot authors) ask first. Console output from runChromeJS is returned as the tool result.`,
    tools: buildTools,
    example: async () => `#### Styling the browser UI:
-   **User Prompt:** "make the browser UI look like cyberpunk"
-   **Your First Tool Call:** \`{"functionCall": {"name": "inspectChrome", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "applyPreviewCSS", "args": {"css": ":root { --zen-primary-color: #00fff9 !important; }"}}}\`
-   Then verify with \`inspectChrome\` and end with: "Do you want to turn this into a mod?"

#### Creating a mod when asked:
-   **User Prompt:** "turn this into a mod called Neon Tabs"
-   **Your Tool Call:** \`{"functionCall": {"name": "createMod", "args": {"name": "Neon Tabs", "description": "Neon cyberpunk tab styling"}}}\``,
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
-   **User Prompt:** "Manage my tabs"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getAllTabs", "args": {}}}\`
-   **Your Second Tool Call:**(based on all tabs) \`{"functionCall": {"name": "createTabFolder", "args": {"name": "..."}}}\`
-   **Your Third Tool Call (based on all tabs):** \`{"functionCall": {"name": "addTabsToFolder", "args": {"tabIds": ["x", "y", ...] }}}\`
-   **Your Fourth Tool Call (based on all tabs):** \`{"functionCall": {"name": "moveTabsToWorkspace", "args": {"tabIds": ["x", "y", ...], "workspaceId": "e1f2a3b4-c5d6..."}}}\`
-   Go on keep making tool calls until tabs are managed (note here you should not ask any question to user for confirmation).

`;
      }
      return example;
    },
  },
};

const getTools = (groups, { shouldToolBeCalled, afterToolCall } = {}) => {
  const selectedTools = groups.reduce((acc, groupName) => {
    if (toolGroups[groupName] && toolGroups[groupName].tools) {
      return { ...acc, ...toolGroups[groupName].tools };
    }
    return acc;
  }, {});

  if (!shouldToolBeCalled && !afterToolCall) {
    return selectedTools;
  }

  const wrappedTools = {};
  for (const toolName in selectedTools) {
    const originalTool = selectedTools[toolName];
    const newTool = { ...originalTool };

    const originalExecute = originalTool.execute;
    newTool.execute = async (args, opts) => {
      if (shouldToolBeCalled && !(await shouldToolBeCalled(toolName, args))) {
        PREFS.debugLog(`Tool execution for '${toolName}' was denied by shouldToolBeCalled.`);
        return { error: `Tool execution for '${toolName}' was denied by user.` };
      }
      const result = await originalExecute(args, opts);
      if (afterToolCall) afterToolCall(toolName, result, args);
      return result;
    };
    wrappedTools[toolName] = newTool;
  }

  return wrappedTools;
};

const getToolSystemPrompt = async (groups, includeExamples = true) => {
  try {
    const activeGroupNames = groups;
    const activeGroups = new Set(activeGroupNames);

    let availableTools = [];
    let toolExamples = [];

    for (const groupName of activeGroupNames) {
      const group = toolGroups[groupName];
      if (group) {
        if (group.tools) {
          for (const toolName in group.tools) {
            const tool = group.tools[toolName];
            const params = paramNames(tool.parameters).join(", ");
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
    PREFS.debugError("Error in getToolSystemPrompt:", error);
    return "";
  }
};

export { getToolSystemPrompt, getTools, toolNameMapping, toolVerbs, toolGroups };
