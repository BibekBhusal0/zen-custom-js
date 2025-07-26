# 🔍 BrowseBot for Zen Browser

Inspired by Arc Browser, this script transforms the standard findbar in **Zen Browser** into a modern, floating, AI-powered chat interface. It leverages Different AI models to allow you to interact with and ask questions about the content of the current webpage.

https://github.com/user-attachments/assets/40dae6f6-065c-4852-be07-f29d00ec99ae

## Features

- **Modern, Floating UI**: Replaces the default findbar with a sleek, draggable, resizable, and collapsible interface.
- **Multi-Provider AI Chat**: Integrates with Google's Gemini and Mistral models for a conversational experience.
- **Page Content Awareness**: The AI can read the text content, HTML, and even YouTube transcripts of the current webpage to answer your questions accurately.
- **Built-in Keyboard Shortcuts**: Use `Ctrl+Shift+F` and `Alt+Enter` for quick AI access.
- **Highly Customizable**: Fine-tune your experience through an extensive in-app settings or `about:config`.
- **AI Browser Control (God Mode)**: Allow the AI to perform actions like searching, opening links, managing bookmarks, and interacting with page elements.
- **Context Menu Integration**: Right-click to quickly ask the AI about selected text or the current page.
- **Citation Support**: (Experimental) Get direct quotes from the page text that support the AI's answer.

## Technologies used

- [Vercel AI SDK](https://ai-sdk.dev/)
- [Zod](https://zod.dev/)

## 🚨 Caution 🚨

- **Privacy**: To answer questions about a webpage, this script sends the text content of the page to your selected provider. Please be aware of the privacy implications before using this feature on pages with sensitive information.

## Installation

### Method 1: Using Sine (recommended)

[Sine](https://github.com/CosmoCreeper/Sine) is a modern userscript and theme manager. This is available for instillation from Sine marketplace.

1. Follow instillation instruction from [Sine](https://github.com/CosmoCreeper/Sine).

2. Open settings and go to `Sine Mods`.

3. Search for BrowseBot and install.

### Method 2: Using `fx-autoconfig`

1.  **Setup `fx-autoconfig`**: If you haven't already, follow the setup instructions at [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

2.  **Clone this Repository**: Open a terminal or command prompt, navigate to the `js` directory created by `fx-autoconfig` inside your profile folder, and clone the repository with the name `custom`:

    ```bash
    git clone https://github.com/BibekBhusal0/zen-custom-js.git custom
    ```

3.  Since Vercel AI SDK is being used here it is needed to bundle

    ```bash
    cd custom
    npm run build
    ```

4.  **Import the Script**: In your JS directory, create new file `import.uc.mjs` (file name can be anything but should end with `.uc.mjs`), add the following line to import the script:

    ```javascript
    import "./custom/dist/browse-bot.uc.js";
    ```

5.  **Import the Styles**: In your `userChrome.css` file, add the following line to import the required styles:

    ```css
    @import "js/custom/findbar-ai/style.css";
    ```

6.  **Restart Zen Browser**: Restart the browser for all changes to take effect. You might need to clear the startup cache from `about:support`.

## Usage

1.  **Get an API Key**: After installation press `Ctrl+Shift+F`, the BrowseBot will prompt you to select a provider and set an API key. It will also provide a link to get the required key.
2.  **Save the Key**: Paste the key into the input field and click "Save". The chat interface will now appear.
3.  **Start Chatting**:
    - Press `Ctrl+F` to open the standard findbar.
    - In the default (non-minimal) view, click the "Expand" button to switch to AI chat. In Minimal Mode, just enter your query and click "Ask".
    - Type your questions about the current page and press "Send".
    - Use `Ctrl+Shift+F` to open the AI chat directly, using any text you have selected on the page as the initial prompt.

## Customization

You can customize the BrowseBot through the settings modal (found in the chat header) or via `about:config`.

### Preferences (`about:config`)

| Preference                                      | Type    | Default                   | Description                                                                                               |
| ----------------------------------------------- | ------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `extension.browse-bot.enabled`                  | Boolean | `true`                    | Toggles the entire feature on or off.                                                                     |
| `extension.browse-bot.minimal`                  | Boolean | `true`                    | Toggles a simpler, more compact UI.                                                                       |
| `extension.browse-bot.persist-chat`             | Boolean | `false`                   | Persists chat history across tab switches (but not browser restarts).                                     |
| `extension.browse-bot.dnd-enabled`              | Boolean | `true`                    | Enables dragging to move and resizing of the findbar window.                                              |
| `extension.browse-bot.position`                 | String  | `"top-right"`             | Sets the corner where the findbar snaps. Options: `top-left`, `top-right`, `bottom-left`, `bottom-right`. |
| `extension.browse-bot.llm-provider`             | String  | `"gemini"`                | Which AI provider to use. Options: `gemini`, `mistral`.                                                   |
| `extension.browse-bot.gemini-api-key`           | String  | _(empty)_                 | Your API key for Google Gemini.                                                                           |
| `extension.browse-bot.gemini-model`             | String  | `"gemini-2.0-flash"`      | The specific Gemini model to use.                                                                         |
| `extension.browse-bot.mistral-api-key`          | String  | _(empty)_                 | Your API key for Mistral AI.                                                                              |
| `extension.browse-bot.mistral-model`            | String  | `"mistral-medium-latest"` | The specific Mistral model to use.                                                                        |
| `extension.browse-bot.context-menu-enabled`     | Boolean | `true`                    | Toggles the "Ask AI" item in the right-click context menu.                                                |
| `extension.browse-bot.context-menu-autosend`    | Boolean | `true`                    | If true, clicking the context menu item sends the request to the AI immediately.                          |
| `extension.browse-bot.god-mode`                 | Boolean | `false`                   | If true, allows the AI to use tools to interact with the browser.                                         |
| `extension.browse-bot.max-tool-calls`           | Number  | `5`                       | The maximum number of consecutive tool calls the AI can make in one turn.                                 |
| `extension.browse-bot.conform-before-tool-call` | Boolean | `true`                    | If true, prompts you for confirmation before the AI executes any tools.                                   |
| `extension.browse-bot.citations-enabled`        | Boolean | `false`                   | (Experimental) If true, the AI will try to cite its sources from the page content.                        |
| `extension.browse-bot.debug-mode`               | Boolean | `false`                   | Set to `true` to enable verbose logging in the Browser Console for troubleshooting.                       |

> [!WARNING]
> Don't turn both god-mode and citation at the same time. AI might not function properly.

### ⌨️ Keymaps

| Shortcut       | Action                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `Ctrl+Shift+F` | Opens the findbar directly into the expanded AI mode.                                                       |
| `Escape`       | If the AI interface is expanded, it collapses to the standard findbar. If not expanded, closes the findbar. |
| `Alt + Enter`  | Sends the text from the standard findbar to the AI, expanding the view.                                     |

## 🔨 Tool-calls

AI can also make tool calls to perform actions within the browser. To enable this, go to `about:config` or the settings and set `extension.browse-bot.god-mode` to `true`.

Currently available tool calls are:

- **Search**: Searches a term on your default or a specified search engine.
- **Open Link**: Opens a URL in the current tab, new tab, new window, private window, or special Zen Browser views like Glance, vertical split, or horizontal split.
- **New Split**: Creates a vertical or horizontal split view with two new URLs.
- **Get Page Text Content**: Reads the plain text content of the current page.
- **Get HTML Content**: Reads the full HTML source of the current page.
- **Get YouTube Transcript**: Retrieves the transcript for the current YouTube video.
- **Bookmark Management**: A full suite of tools to `searchBookmarks`, `getAllBookmarks`, `createBookmark`, `addBookmarkFolder`, `updateBookmark`, and `deleteBookmark`.
- **Page Interaction**: Tools to `clickElement` using a CSS selector and `fillForm` inputs.

More tools will be comming soon. [More tools](./llm/more-tools.js) are currently in test.

## ✔️ Development Roadmap

- [x] Add styles to findbar
- [x] Make findbar collapsible
- [x] Custom keymaps for findbar
- [x] Basic chat
- [x] Integrating Gemini API
- [x] Reading current page HTML
- [x] Add Readme
- [x] Loading indicator
- [x] Improve system prompts
- [x] Markdown formatting
- [x] Minimal styles (like Arc Browser)
- [x] Highlight text in page that corresponds to AI's answer
- [x] AI interacting with page content (filling forms, clicking buttons)
- [x] Conformation before calling tools
- [x] Tool calls (opening links, search)
- [ ] Add support for other AI models (Open AI, Claude, Deepseek)
- [x] Drag-and-drop to resize and move the findbar (optional)
- [ ] Pin/unpin the findbar (optional)
- [x] Context Menu integration
- [ ] Different themes (glass, light, dark, etc.)
- [ ] Smooth animations for all interactions
- [ ] Custom system prompts
- [x] Add Settings.
- [ ] Copy Button
- [ ] Markdown Formatting toggle
- [ ] Slash Command and variables
- [ ] Adding more tools (tab groups, workspaces, background search)
- [x] Giving AI YouTube transcript
- [ ] Tagging multiple tabs

## 🐛 Bugs and potential issues (I am working on fixing them)

- If AI makes tool call to open tab, history might not persist correctly.
- Styles in glance

## Credits

- **[natsumi-browser](https://github.com/greeeen-dev/natsumi-browser)**: For inspiration on the modern, floating UI styles.

## License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
