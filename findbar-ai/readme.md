<h1 align="center">BrowseBot</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

Inspired by Arc Browser, this script transforms the standard findbar and URL bar in **Zen Browser** into modern, AI-powered command interfaces. The findbar becomes a floating chat panel for deep interaction with page content, while the URL bar offers quick AI-powered actions and searches.

https://github.com/user-attachments/assets/40dae6f6-065c-4852-be07-f29d00ec99ae

>[!Note]
> This is beta version and contains experimental features. This docs might not be upto date. and the preferences.json file might not be upto date as well. Don't open a issue if the experimental features are not working as expected (since they are under heavy developement).

## 🌟 Features

- 🎨 **Floating Chat UI**: A sleek, draggable, and resizable findbar that transforms into an AI chat panel.
- 🚀 **URL Bar AI Commands**: Activate an AI command mode directly in your URL bar for quick actions.
- 🤖 **Multi-Provider Support**: Integrates with Google Gemini, Mistral AI, OpenAI, Anthropic Claude, xAI Grok, Perplexity AI, and local models via Ollama.
- 🧠 **Page Content Awareness**: Lets the AI read the current page's text, HTML, and even YouTube transcripts to provide context-aware answers.
- 👑 **Powerful AI Tool-belt**: Empowers the AI to control the browser—manage tabs, workspaces, bookmarks, perform searches, and interact with page elements.
- 🖱️ **Context Menu Integration**: Right-click to quickly ask the AI about selected text or summarize the current page.
- 📚 **Citation Support**: Get direct quotes from the page text that support the AI's answer.
- 🔧 **Highly Customizable**: Fine-tune every aspect through an extensive in-app settings panel or `about:config`.

## 🛠️ Technologies used

- [Vercel AI SDK](https://ai-sdk.dev/)
- [Zod](https://zod.dev/)

## 🚨 Caution

- **Privacy**: To answer questions about a webpage, this script sends the text content of the page to your selected provider. Please be aware of the privacy implications before using this feature on pages with sensitive information.

## ⚙️ Installation

### Easy Install via Sine (Recommended)

1.  Ensure you have the latest version of [Sine](https://github.com/CosmoCreeper/Sine) installed.
2.  In Zen Browser, open Settings and navigate to the `Sine Mods` tab.
3.  Search for **BrowseBot**.
4.  Click **Install**.
5.  Restart the browser when prompted.
6.  Enjoy your new AI assistant! ✨

### Manual Install (`fx-autoconfig`)

For advanced users or those not using Sine or who are willing to contribute:

1.  **Setup `fx-autoconfig`**: If you haven't already, follow the setup instructions at [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

2.  **Clone this Repository**: Open a terminal or command prompt, navigate to the `js` directory created by `fx-autoconfig` inside your profile folder, and clone the repository with the name `custom`:

    ```bash
    git clone https://github.com/BibekBhusal0/zen-custom-js.git custom
    ```

3.  **Bundle the Script**: This script uses modern JavaScript that needs to be bundled. Navigate into the new directory and run the build command:

    ```bash
    cd custom
    npm install
    npm run build
    ```

4.  **Import the Script**: In your JS directory, create a new file `import.uc.mjs` (or add to an existing one), and add the following line:

    ```javascript
    import "./custom/dist/browse-bot.uc.js";
    ```

5.  **Import the Styles**: In your `userChrome.css` file, add the following line:

    ```css
    @import "js/custom/findbar-ai/style.css";
    ```

6.  **Restart Zen Browser**: Restart the browser for all changes to take effect. You might need to clear the startup cache from `about:support`.

## 🚀 Usage

### Findbar AI Chat

1.  **Get an API Key**: After installation press `Ctrl+Shift+F`, the BrowseBot will prompt you to select a provider and set an API key. It will also provide a link to get the required key.
2.  **Save the Key**: Paste the key into the input field and click "Save". The chat interface will now appear.
3.  **Start Chatting**:
    - Press `Ctrl+F` to open the standard findbar.
    - In the default (non-minimal) view, click the "Expand" button to switch to AI chat. In Minimal Mode, just enter your query and click "Ask".
    - Type your questions about the current page and press "Send".
    - Use `Ctrl+Shift+F` to open the AI chat directly, using any text you have selected on the page as the initial prompt.

### URL Bar AI Commands

1.  Press `Ctrl+Space` to activate AI mode in the URL bar.
2.  Type your command directly (e.g., "search for red pandas", "open github.com", "close all youtube tabs").
3.  Press `Enter` to execute the command. The AI will perform the action, often providing feedback via a small toast notification.

## 🔧 Customization

You can customize the BrowseBot through the settings modal (found in the chat header) or via `about:config`.

<details>
<summary><h3>Preferences (`about:config`)</h3></summary>

| Preference                                                 | Type    | Default                   | Description                                                                                                 |
| ---------------------------------------------------------- | ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `extension.browse-bot.findbar-ai.enabled`                  | Boolean | `true`                    | Toggles the findbar AI feature on or off.                                                                   |
| `extension.browse-bot.urlbar-ai-enabled`                   | Boolean | `true`                    | Toggles the URL bar AI feature on or off.                                                                   |
| `extension.browse-bot.findbar-ai.minimal`                  | Boolean | `true`                    | Toggles a simpler, more compact UI.                                                                         |
| `extension.browse-bot.findbar-ai.persist-chat`             | Boolean | `false`                   | Persists chat history across tab switches (but not browser restarts).                                       |
| `extension.browse-bot.findbar-ai.dnd-enabled`              | Boolean | `true`                    | Enables dragging to move and resizing of the findbar window.                                                |
| `extension.browse-bot.findbar-ai.position`                 | String  | `"top-right"`             | Sets the corner where the findbar snaps. Options: `top-left`, `top-right`, `bottom-left`, `bottom-right`.   |
| `extension.browse-bot.findbar-ai.pseudo-bg.enabled`        | Boolean | `false`                   | Enables a pseudo-background for use with transparent browser themes.                                        |
| `extension.browse-bot.llm-provider`                        | String  | `"gemini"`                | Which AI provider to use. Options: `gemini`, `mistral`, `openai`, `claude`, `grok`, `perplexity`, `ollama`. |
| `extension.browse-bot.gemini-api-key`                      | String  | _(empty)_                 | Your API key for Google Gemini.                                                                             |
| `extension.browse-bot.gemini-model`                        | String  | `"gemini-2.0-flash"`      | The specific Gemini model to use.                                                                           |
| `extension.browse-bot.mistral-api-key`                     | String  | _(empty)_                 | Your API key for Mistral AI.                                                                                |
| `extension.browse-bot.mistral-model`                       | String  | `"mistral-medium-latest"` | The specific Mistral model to use.                                                                          |
| `extension.browse-bot.openai-api-key`                      | String  | _(empty)_                 | Your API key for OpenAI.                                                                                    |
| `extension.browse-bot.openai-model`                        | String  | `"gpt-4o"`                | The specific OpenAI model to use.                                                                           |
| `extension.browse-bot.claude-api-key`                      | String  | _(empty)_                 | Your API key for Anthropic Claude.                                                                          |
| `extension.browse-bot.claude-model`                        | String  | `"claude-4-opus"`         | The specific Claude model to use.                                                                           |
| `extension.browse-bot.grok-api-key`                        | String  | _(empty)_                 | Your API key for xAI Grok.                                                                                  |
| `extension.browse-bot.grok-model`                          | String  | `"grok-4"`                | The specific Grok model to use.                                                                             |
| `extension.browse-bot.perplexity-api-key`                  | String  | _(empty)_                 | Your API key for Perplexity AI.                                                                             |
| `extension.browse-bot.perplexity-model`                    | String  | `"sonar"`                 | The specific Perplexity model to use.                                                                       |
| `extension.browse-bot.ollama-api-key`                      | String  | _(empty)_                 | Your API key for Ollama (if required).                                                                      |
| `extension.browse-bot.ollama-model`                        | String  | `"llama2"`                | The specific Ollama model to use.                                                                           |
| `extension.browse-bot.findbar-ai.context-menu-enabled`     | Boolean | `true`                    | Toggles the "Ask AI" item in the right-click context menu.                                                  |
| `extension.browse-bot.findbar-ai.context-menu-autosend`    | Boolean | `true`                    | If true, clicking the context menu item sends the request to the AI immediately.                            |
| `extension.browse-bot.findbar-ai.agentic-mode`             | Boolean | `false`                   | If true, allows the AI to use tools to interact with the browser.                                           |
| `extension.browse-bot.findbar-ai.max-tool-calls`           | Number  | `5`                       | The maximum number of consecutive tool calls the AI can make in one turn.                                   |
| `extension.browse-bot.findbar-ai.conform-before-tool-call` | Boolean | `true`                    | If true, prompts you for confirmation before the AI executes any tools.                                     |
| `extension.browse-bot.findbar-ai.stream-enabled`           | Boolean | `true`                    | AI response will be smooth.                                                                                 |
| `extension.browse-bot.findbar-ai.citations-enabled`        | Boolean | `false`                   | If true, the AI will try to cite its sources from the page content.                                         |
| `extension.browse-bot.debug-mode`                          | Boolean | `false`                   | Set to `true` to enable verbose logging in the Browser Console for troubleshooting.                         |

> [!WARNING]
> Don't turn on both Agentic Mode Citations at the same time. The AI might not function properly.

</details>

### ⌨️ Keymaps

| Shortcut       | Action                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `Ctrl+Shift+F` | Opens the findbar directly into the expanded AI mode.                                                       |
| `Ctrl+Space`   | Toggles the URL bar into AI command mode.                                                                   |
| `Escape`       | If the AI interface is expanded, it collapses to the standard findbar. If not expanded, closes the findbar. |
| `Alt + Enter`  | Sends the text from the standard findbar to the AI, expanding the view.                                     |

## 🔨 Tool-calls

AI can also make tool calls to perform actions within the browser. To enable this, go to `about:config` or the settings and set `extension.browse-bot.findbar-ai.agentic-mode` to `true`.

> [!NOTE]
> The **Findbar AI** has access to all tools listed below in Agentic Mode (except for bookmarks). The **URL Bar AI** uses a focused subset for quick actions: `Search`, `Navigation`, `Tab Management`, `Workspace Management`, and `UI Feedback`.

Currently available tool calls are:

- **Search**: Searches a term on your default or a specified search engine.
- **Navigation**: `openLink` in various locations (current/new tab, window, private, glance, splits), `newSplit` with multiple URLs, and `splitExistingTabs`.
- **Tab Management**: A full suite of tools to `getAllTabs`, `searchTabs`, `closeTabs`, `reorderTab`, `addTabsToFolder`, `removeTabsFromFolder`, `createTabFolder`, `addTabsToEssentials`, and `removeTabsFromEssentials`.
- **Page Interaction**: `getPageTextContent` to read text, `getHTMLContent` for the full source, `clickElement` using a CSS selector, and `fillForm` inputs.
- **YouTube**: `getYoutubeTranscript`, `getYoutubeDescription`, and `getYoutubeComments` for the current video.
- **Bookmark Management**: A full suite of tools to `searchBookmarks`, `getAllBookmarks`, `createBookmark`, `addBookmarkFolder`, `updateBookmark`, and `deleteBookmark`. Bookmark management tools are disabled due to confustion with tab folder and bookmark fodler.
- **Workspace Management**: Tools to `getAllWorkspaces`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace`, `moveTabsToWorkspace`, and `reorderWorkspace`.
- **UI Feedback**: `showToast` to display temporary notifications to the user.

More tools will be comming soon. [More tools](./llm/more-tools.js) are currently in test.

## ✔️ Development Roadmap

- [ ] Pin/unpin the findbar
- [x] Context Menu integration
- [ ] Different themes (glass, light, dark, etc.)
- [ ] Smooth animations for all interactions
- [ ] Custom system prompts
- [x] Add Settings.
- [ ] Copy Button
- [ ] Markdown Formatting toggle
- [ ] Slash Command and variables
- [x] Adding more tools (tab groups, workspaces, background search)
- [x] Giving AI YouTube transcript
- [ ] Tagging multiple tabs

## 🐛 Bugs and potential issues (I am working on fixing them)

- If AI makes tool call to open tab, history might not persist correctly.
- AI can't make multiple tool calls in row
- Styles in glance

## 🙏 Credits and Acknowledgements

- **[natsumi-browser](https://github.com/greeeen-dev/natsumi-browser)**: For inspiration on the modern, floating UI styles in Findbar.
- **[aminomancer/uc.css.js](https://github.com/aminomancer/uc.css.js)**: The `_overrideFindbarMatchesDisplay` function in `findbar-ai.uc.js` is adapted from `JS/findbarMods.uc.js` under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).
- **[12th-devs](https://github.com/12th-devs/)** for helping me in each step of developement and design.

## 📄 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
