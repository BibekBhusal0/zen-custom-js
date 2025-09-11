import { tool } from "ai";
import { browseBotFindbar } from "../findbar-ai.uc.js";
import { z } from "zod";
import { messageManagerAPI } from "../messageManager.js";
import { debugLog, debugError, PREFS } from "../utils/prefs.js";

// Helper function to create Zod string parameters
const createStringParameter = (description, isOptional = false) => {
  let schema = z.string().describe(description);
  return isOptional ? schema.optional() : schema;
};

// Helper function to create tools with consistent structure
const createTool = (name, description, parameters, executeFn) => {
  const t = tool({
    description,
    inputSchema: z.object(parameters),
    execute: (args) => confirmAndExecute(name, executeFn, args),
  });
  // Attach the original execute function so we can bypass confirmation later
  Object.defineProperty(t, "executeFn", {
    value: executeFn,
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return t;
};

// Confirmation wrapper
async function confirmAndExecute(toolName, executeFn, args) {
  if (PREFS.conformation) {
    const confirmed = await browseBotFindbar.createToolConfirmationDialog([toolName]);
    if (!confirmed) {
      debugLog(`Tool execution for '${toolName}' cancelled by user.`);
      return { error: `Tool execution for '${toolName}' was cancelled by the user.` };
    }
  }
  return executeFn(args);
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
  const { link1, link2, type = "vertical" } = args;
  if (!window.gZenViewSplitter) return { error: "Split view function is not available." };
  if (!link1 || !link2) return { error: "newSplit requires two links." };
  try {
    const sep = type.toLowerCase() === "vertical" ? "vsep" : "hsep";
    await openTrustedLinkIn(link1, "tab");
    const tab1 = gBrowser.selectedTab;
    await openTrustedLinkIn(link2, "tab");
    const tab2 = gBrowser.selectedTab;
    gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
    return {
      result: `Successfully created ${type} split view with the provided links.`,
    };
  } catch (e) {
    debugError("Failed to create split view.", e);
    return { error: "Failed to create split view." };
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

const toolGroups = {
  search: {
    description: async () => {
      const searchEngines = await Services.search.getVisibleEngines();
      const engineNames = searchEngines.map((e) => e.name).join(", ");
      const defaultEngineName = Services.search.defaultEngine.name;
      return `- \`search(searchTerm, engineName, where)\`: Performs a web search. Available engines: ${engineNames}. The default is '${defaultEngineName}'.`;
    },
    tools: {
      search: createTool(
        "search",
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
      const defaultEngineName = Services.search.defaultEngine.name;
      return `#### Searching the Web: 
-   **User Prompt:** "search for firefox themes"
-   **Your Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "firefox themes", "engineName": "${defaultEngineName}"}}}\``;
    },
  },
  navigation: {
    description: async () => `- \`openLink(link, where)\`: Opens a URL. Use this to open a single link or to create a split view with the *current* tab.
- \`newSplit(link1, link2, type)\`: Use this specifically for creating a split view with *two new tabs*.`,
    tools: {
      openLink: createTool(
        "openLink",
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
        "newSplit",
        "Creates a split view by opening two new URLs in two new tabs, then arranging them side-by-side.",
        {
          link1: createStringParameter("The URL for the first new tab."),
          link2: createStringParameter("The URL for the second new tab."),
          type: createStringParameter(
            "The split type: 'horizontal' or 'vertical'. Defaults to 'vertical'.",
            true
          ),
        },
        newSplit
      ),
    },
    example: async () => `#### Opening a Single Link:
-   **User Prompt:** "open github"
-   **Your Tool Call:** \`{"functionCall": {"name": "openLink", "args": {"link": "https://github.com", "where": "new tab"}}}\`

#### Creating a Split View with Two New Pages:
-   **User Prompt:** "show me youtube and twitch side by side"
-   **Your Tool Call:** \`{"functionCall": {"name": "newSplit", "args": {"link1": "https://youtube.com", "link2": "https://twitch.tv"}}}\``,
  },
  pageInteraction: {
    description: async () => `- \`getPageTextContent()\` / \`getHTMLContent()\`: Use these to get updated page information if context is missing. Prefer \`getPageTextContent\`.
- \`getYoutubeTranscript()\`: Retrives the transcript of the current youtube video. Only use if current page is a youtube video.
- \`clickElement(selector)\`: Clicks an element on the page.
- \`fillForm(selector, value)\`: Fills a form input on the page.`,
    tools: {
      getPageTextContent: createTool(
        "getPageTextContent",
        "Retrieves the text content of the current web page to answer questions if the initial context is insufficient.",
        {},
        messageManagerAPI.getPageTextContent.bind(messageManagerAPI)
      ),
      getHTMLContent: createTool(
        "getHTMLContent",
        "Retrieves the full HTML source of the current web page for detailed analysis. Use this tool very rarely, only when text content is insufficient.",
        {},
        messageManagerAPI.getHTMLContent.bind(messageManagerAPI)
      ),
      getYoutubeTranscript: createTool(
        "getYoutubeTranscript",
        "Retrives the transcript of the current youtube video. Only use if current page is a youtube video.",
        {},
        messageManagerAPI.getYoutubeTranscript.bind(messageManagerAPI)
      ),
      clickElement: createTool(
        "clickElement",
        "Clicks an element on the page.",
        {
          selector: createStringParameter("The CSS selector of the element to click."),
        },
        clickElement
      ),
      fillForm: createTool(
        "fillForm",
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

#### Finding and Clicking a Link on the Current Page
-   **User Prompt:** "click on the contact link"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call (after receiving HTML and finding the link):** \`{"functionCall": {"name": "openLink", "args": {"link": "https://example.com/contact-us"}}}\`

#### Filling a form:
-   **User Prompt:** "Fill the name with John and submit"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "fillForm", "args": {"selector": "#name", "value": "John"}}}\`
-   **Your Third Tool Call:** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#submit-button"}}}\``,
  },
  bookmarks: {
    description: async () => `- \`searchBookmarks(query)\`: Searches your bookmarks for a specific query.
- \`getAllBookmarks()\`: Retrieves all of your bookmarks.
- \`createBookmark(url, title, parentID)\`: Creates a new bookmark.  The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`addBookmarkFolder(title, parentID)\`: Creates a new bookmark folder. The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`updateBookmark(id, url, title, parentID)\`: Updates an existing bookmark.  The \`id\` is the GUID of the bookmark.  You must provide the ID and either a new URL or a new title or new parentID (or any one or two).
- \`deleteBookmark(id)\`: Deletes a bookmark.  The \`id\` is the GUID of the bookmark.`,
    tools: {
      searchBookmarks: createTool(
        "searchBookmarks",
        "Searches bookmarks based on a query.",
        {
          query: createStringParameter("The search term for bookmarks."),
        },
        searchBookmarks
      ),
      getAllBookmarks: createTool(
        "getAllBookmarks",
        "Retrieves all bookmarks.",
        {},
        getAllBookmarks
      ),
      createBookmark: createTool(
        "createBookmark",
        "Creates a new bookmark.",
        {
          url: createStringParameter("The URL to bookmark."),
          title: createStringParameter("The title for the bookmark.", true),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        createBookmark
      ),
      addBookmarkFolder: createTool(
        "addBookmarkFolder",
        "Creates a new bookmark folder.",
        {
          title: createStringParameter("The title for the new folder."),
          parentID: createStringParameter("The GUID of the parent folder.", true),
        },
        addBookmarkFolder
      ),
      updateBookmark: createTool(
        "updateBookmark",
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
        "deleteBookmark",
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
  misc: {
    example: async (activeGroups) => {
      if (activeGroups.has("search") && activeGroups.has("navigation")) {
        return `### Calling multiple tools at once.
#### Making 2 searches in split 
-   **User Prompt:** "Search for Japan in google and search for America in Youtube. Open them in vertical split."
-   **Your First Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "Japan", "engineName": "Google", "where": "new tab"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "America", "engineName": "Youtube", "where": "vsplit"}}}\``;
      }
      return "";
    },
  },
};

const getTools = (groups) => {
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
};

const toolSet = getTools();

const getToolSystemPrompt = async (groups) => {
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
        if (group.description) availableTools.push(await group.description());
        if (group.example) toolExamples.push(await group.example(activeGroups));
      }
    }

    if (toolGroups.misc && toolGroups.misc.example) {
      const miscExample = await toolGroups.misc.example(activeGroups);
      if (miscExample) toolExamples.push(miscExample);
    }

    let systemPrompt = `
## Available Tools:
${availableTools.join("\n")}
`;

    if (toolExamples.length > 0) {
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

export { toolSet, getToolSystemPrompt, getTools };
