import { windowManagerAPI } from "../windowManager.js";
import { debugLog, debugError } from "../prefs.js";

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
  if (!url && !title)
    return {
      error: "updateBookmark requires either a new url or a new title.",
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
  return windowManagerAPI.clickElement(selector);
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
  if (!value) return { error: "fillForm requires a value." };
  return windowManagerAPI.fillForm(selector, value);
}

const availableTools = {
  search,
  newSplit,
  openLink,
  getPageTextContent: windowManagerAPI.getPageTextContent.bind(windowManagerAPI),
  getHTMLContent: windowManagerAPI.getHTMLContent.bind(windowManagerAPI),
  getYoutubeTranscript: windowManagerAPI.getYoutubeTranscript.bind(windowManagerAPI),
  searchBookmarks,
  getAllBookmarks,
  createBookmark,
  addBookmarkFolder,
  updateBookmark,
  deleteBookmark,
  clickElement,
  fillForm,
};

const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: "search",
        description: "Performs a web search using a specified search engine and opens the results.",
        parameters: {
          type: "OBJECT",
          properties: {
            searchTerm: {
              type: "STRING",
              description: "The term to search for.",
            },
            engineName: {
              type: "STRING",
              description: "Optional. The name of the search engine to use.",
            },
            where: {
              type: "STRING",
              description:
                "Optional. Where to open the search results. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Defaults to 'new tab'. Note that 'glance', 'vsplit' and 'hsplit' are special to zen browser. 'glance' opens in small popup and 'vsplit' and 'hsplit' opens in vertical and horizontal split respectively. When user says open in split and don't spicify 'vsplit' or 'hsplit' default to 'vsplit'.",
            },
          },
          required: ["searchTerm"],
        },
      },
      {
        name: "openLink",
        description:
          "Opens a given URL in a specified location. Can also create a split view with the current tab.",
        parameters: {
          type: "OBJECT",
          properties: {
            link: { type: "STRING", description: "The URL to open." },
            where: {
              type: "STRING",
              description:
                "Optional. Where to open the link. Options: 'current tab', 'new tab', 'new window', 'incognito', 'glance', 'vsplit', 'hsplit'. Defaults to 'new tab'. Note that 'glance', 'vsplit' and 'hsplit' are special to zen browser. 'glance' opens in small popup and 'vsplit' and 'hsplit' opens in vertical and horizontal split respectively. When user says open in split and don't spicify 'vsplit' or 'hsplit' default to 'vsplit'.",
            },
          },
          required: ["link"],
        },
      },
      {
        name: "newSplit",
        description:
          "Creates a split view by opening two new URLs in two new tabs, then arranging them side-by-side.",
        parameters: {
          type: "OBJECT",
          properties: {
            link1: {
              type: "STRING",
              description: "The URL for the first new tab.",
            },
            link2: {
              type: "STRING",
              description: "The URL for the second new tab.",
            },
            type: {
              type: "STRING",
              description:
                "Optional, The split type: 'horizontal' or 'vertical'. Defaults to 'vertical'.",
            },
          },
          required: ["link1", "link2"],
        },
      },
      {
        name: "getPageTextContent",
        description:
          "Retrieves the text content of the current web page to answer questions if the initial context is insufficient.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "getHTMLContent",
        description:
          "Retrieves the full HTML source of the current web page for detailed analysis. Use this tool very rarely, only when text content is insufficient.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "getYoutubeTranscript",
        description:
        "Retrives the transcript of the current youtube video. Only use if current page is a youtube video.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "searchBookmarks",
        description: "Searches bookmarks based on a query.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The search term for bookmarks.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "getAllBookmarks",
        description: "Retrieves all bookmarks.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "createBookmark",
        description: "Creates a new bookmark.",
        parameters: {
          type: "OBJECT",
          properties: {
            url: {
              type: "STRING",
              description: "The URL to bookmark.",
            },
            title: {
              type: "STRING",
              description:
                "Optional. The title for the bookmark. If not provided, the URL is used.",
            },
            parentID: {
              type: "STRING",
              description:
                'Optional. The GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder.',
            },
          },
          required: ["url"],
        },
      },
      {
        name: "addBookmarkFolder",
        description: "Creates a new bookmark folder.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "The title for the new folder.",
            },
            parentID: {
              type: "STRING",
              description:
                'Optional. The GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder.',
            },
          },
          required: ["title"],
        },
      },
      {
        name: "updateBookmark",
        description: "Updates an existing bookmark.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {
              type: "STRING",
              description: "The GUID of the bookmark to update.",
            },
            url: {
              type: "STRING",
              description: "The new URL for the bookmark.",
            },
            title: {
              type: "STRING",
              description: "The new title for the bookmark.",
            },
            parentID: {
              type: "STRING",
              description: "The GUID of the parent folder.",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "deleteBookmark",
        description: "Deletes a bookmark.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: {
              type: "STRING",
              description: "The GUID of the bookmark to delete.",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "clickElement",
        description: "Clicks an element on the page.",
        parameters: {
          type: "OBJECT",
          properties: {
            selector: {
              type: "STRING",
              description: "The CSS selector of the element to click.",
            },
          },
          required: ["selector"],
        },
      },
      {
        name: "fillForm",
        description: "Fills a form input on the page.",
        parameters: {
          type: "OBJECT",
          properties: {
            selector: {
              type: "STRING",
              description: "The CSS selector of the input element to fill.",
            },
            value: {
              type: "STRING",
              description: "The value to fill the input with.",
            },
          },
          required: ["selector", "value"],
        },
      },
    ],
  },
];

const getToolSystemPrompt = async () => {
  try {
    const searchEngines = await Services.search.getVisibleEngines();
    const engineNames = searchEngines.map((e) => e.name).join(", ");
    const defaultEngineName = Services.search.defaultEngine.name;
    return `
- When asked about your own abilities, describe the functions you can perform based on the tools listed below.

## GOD MODE ENABLED - TOOL USAGE:
You have access to browser functions. The user knows you have these abilities.
- **CRITICAL**: When you decide to call a tool, give short summary of what tool are you calling and why?
- Use tools when the user explicitly asks, or when it is the only logical way to fulfill their request (e.g., "search for...").

## Available Tools:
- \`search(searchTerm, engineName, where)\`: Performs a web search. Available engines: ${engineNames}. The default is '${defaultEngineName}'.
- \`openLink(link, where)\`: Opens a URL. Use this to open a single link or to create a split view with the *current* tab.
- \`newSplit(link1, link2, type)\`: Use this specifically for creating a split view with *two new tabs*.
- \`getPageTextContent()\` / \`getHTMLContent()\`: Use these to get updated page information if context is missing. Prefer \`getPageTextContent\`.
- \`searchBookmarks(query)\`: Searches your bookmarks for a specific query.
- \`getAllBookmarks()\`: Retrieves all of your bookmarks.
- \`createBookmark(url, title, parentID)\`: Creates a new bookmark.  The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`addBookmarkFolder(title, parentID)\`: Creates a new bookmark folder. The \`parentID\` is optional and should be the GUID of the parent folder. Defaults to the "Bookmarks Toolbar" folder which has GUID: \`PlacesUtils.bookmarks.toolbarGuid\`.
- \`updateBookmark(id, url, title, parentID)\`: Updates an existing bookmark.  The \`id\` is the GUID of the bookmark.  You must provide the ID and either a new URL or a new title or new parentID (or any one or two).
- \`deleteBookmark(id)\`: Deletes a bookmark.  The \`id\` is the GUID of the bookmark.
- \`clickElement(selector)\`: Clicks an element on the page.
- \`fillForm(selector, value)\`: Fills a form input on the page.

## More instructions for Running tools
- While running tool like \`openLink\` and \`newSplit\` make sure URL is valid.
- User will provide URL and title of current of webpage. If you need more context, use the \`getPageTextContent\` or \`getHTMLContent\` tools.
- When the user asks you to "read the current page", use the \`getPageTextContent()\` or \`getHTMLContent\` tool.
- If the user asks you to open a link by its text (e.g., "click the 'About Us' link"), you must first use \`getHTMLContent()\` to find the link's full URL, then use \`openLink()\` to open it.

## Tool Call Examples:
Therse are just examples for you on how you can use tools calls, each example give you some concept, the concept is not specific to single tool.

### Use default value when user don't provides full information, If user don't provide default value you may ask and even give options if possible
#### Searching the Web: 
-   **User Prompt:** "search for firefox themes"
-   **Your Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "firefox themes", "engineName": "${defaultEngineName}"}}}\`

### Make sure you are calling tools with correct parameters.
#### Opening a Single Link:
-   **User Prompt:** "open github"
-   **Your Tool Call:** \`{"functionCall": {"name": "openLink", "args": {"link": "https://github.com", "where": "new tab"}}}\`

#### Creating a Split View with Two New Pages:
-   **User Prompt:** "show me youtube and twitch side by side"
-   **Your Tool Call:** \`{"functionCall": {"name": "newSplit", "args": {"link1": "https://youtube.com", "link2": "https://twitch.tv"}}}\`

### Use tools to get more context: If user ask anything whose answer is unknown to you and it can be obtained via tool call use it.
#### Reading the Current Page for Context
-   **User Prompt:** "summarize this page for me"
-   **Your Tool Call:** \`{"functionCall": {"name": "getPageTextContent", "args": {}}}\`

### Taking multiple steps; you might need for previous tool to compete and give you output before calling next tool
#### Finding and Clicking a Link on the Current Page
-   **User Prompt:** "click on the contact link"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call (after receiving HTML and finding the link):** \`{"functionCall": {"name": "openLink", "args": {"link": "https://example.com/contact-us"}}}\`

#### Finding and Editing a bookmark by folder name:
-   **User Prompt:** "Move bookmark titled 'Example' to folder 'MyFolder'"
-   **Your First Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "Example"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "searchBookmarks", "args": {"query": "MyFolder"}}}\`
-   **Your Third Tool Call (after receiving the bookmark and folder ids):** \`{"functionCall": {"name": "updateBookmark", "args": {"id": "xxxxxxxxxxxx", "parentID": "yyyyyyyyyyyy"}}}\`
Note that first and second tool clls can be made in parallel, but the third tool call needs output from the first and second tool calls so it must be made after first and second.

#### Filling a form:
-   **User Prompt:** "Fill the name with John and submit"
-   **Your First Tool Call:** \`{"functionCall": {"name": "getHTMLContent", "args": {}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "fillForm", "args": {"selector": "#name", "value": "John"}}}\`
-   **Your Third Tool Call:** \`{"functionCall": {"name": "clickElement", "args": {"selector": "#submit-button"}}}\`

### Calling multiple tools at once.
#### Making 2 searches in split 
-   **User Prompt:** "Search for Japan in google and search for America in Youtube. Open them in vertical split."
-   **Your First Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "Japan", "engineName": "Google", "where": "new tab"}}}\`
-   **Your Second Tool Call:** \`{"functionCall": {"name": "search", "args": {"searchTerm": "America", "engineName": "Youtube", "where": "vsplit"}}}\`

*(Available search engines: ${engineNames}. Default is '${defaultEngineName}'.)*
`;
  } catch (error) {
    debugError("Error in getToolSystemPrompt:", error);
    return "";
  }
};

export { availableTools, toolDeclarations, getToolSystemPrompt };
