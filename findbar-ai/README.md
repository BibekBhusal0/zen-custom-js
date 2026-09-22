<h1 align="center">BrowseBot</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

Inspired by Arc Browser, this script transforms the standard findbar and URL bar in **Zen Browser** into modern, AI-powered command interfaces. The findbar becomes a floating chat panel for deep interaction with page content, while the URL bar offers quick AI-powered actions and searches. Heavy-duty agentic work lives in a dedicated **BrowseBot section inside the Zen Library**, which stays open across tab and workspace switches.

https://github.com/user-attachments/assets/40dae6f6-065c-4852-be07-f29d00ec99ae

## 🌟 Features

- 🎨 **Floating Chat UI**: A sleek, draggable, and resizable findbar that transforms into an AI chat panel.
- 📚 **Library AI**: A persistent BrowseBot section inside the Zen Library with **chat**, **agent**, and **build** (coming soon) modes, slash commands (`/chat`, `/agent`, `/build`), and `@` tab mentions that hand the AI the full page content. Unlike the findbar and URL bar, it never closes when you switch tabs or workspaces.
- 🚀 **URL Bar AI Commands**: Activate an AI command mode directly in your URL bar for quick searches and navigation.
- 🤖 **Multi-Provider Support**: Works out of the box with Pollinations AI (free, no API key needed). Also integrates with Google Gemini, Mistral AI, OpenAI, Anthropic Claude, xAI Grok, Perplexity AI, Cerebras, DeepSeek, OpenRouter, any OpenAI-compatible endpoint, and local models via Ollama.
- 🧠 **Page Content Awareness**: Lets the AI read the current page's text, HTML, and even YouTube transcripts to provide context-aware answers.
- 👑 **Powerful AI Tool-belt**: In Library agent mode, the AI controls the browser: manages tabs, workspaces, bookmarks, performs searches, and interacts with page elements.
- 🖱️ **Context Menu Integration**: Right-click to quickly ask the AI about selected text or summarize the current page.
- 📚 **Citation Support**: Get direct quotes from the page text that support the AI's answer.
- 🔧 **Highly Customizable**: Fine-tune every aspect through an sine settings or `about:config`.
- ⌨️ **Custom Shortcuts**: Configure keyboard shortcuts to open the AI chat and URL bar commands.

## Demo Videos

### URL Bar AI

https://github.com/user-attachments/assets/78e37797-0e6a-4176-8eb2-e5e03f868db3

### Agent mode (with tool calls)

https://github.com/user-attachments/assets/a8f3113e-97e6-42a6-8300-f99f0268274b

## 🚨 Caution

- **Privacy**: To answer questions about a webpage, this script sends the text content of the page to your selected provider. Please be aware of the privacy implications before using this feature on pages with sensitive information. Or if you are using ollama you don't have to worry about this.

- **Prompt Injectation**: Be aware of [prompt injectation](https://en.wikipedia.org/wiki/Prompt_injection) attacks and use this mod only in websites you trust.

## ⚙️ Installation

### Sine

1. Install latest version of [Sine](https://github.com/CosmoCreeper/Sine) (if you haven't already).
2. Restart Zen Browser.
3. Open settings and go to the `Sine` tab.
4. Search for `BrowseBot`.
5. Click Install.
6. A toast for restart should appear. Click on that to restart Zen.
7. Enjoy your new AI assistant! ✨

> [!NOTE]
> If you want to try Early Beta version you can use the beta branch `https://github.com/Vertex-Mods/Browse-Bot/tree/beta`

### Manual Install (`fx-autoconfig`)

For advanced users or those not using Sine or who are willing to contribute:

1.  **Setup `fx-autoconfig`**: If you haven't already, follow the setup instructions at [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

2.  **Clone this Repository**: Open a terminal or command prompt, navigate to the `js` directory created by `fx-autoconfig` inside your profile folder, and clone the repository with the name `custom`:

    ```bash
    git clone https://github.com/BibekBhusal0/zen-custom-js.git custom
    ```

3.  **Bundle the Script**: This script uses bun a modern JavaScript bundler to bundle all code. Navigate into the new directory and run the build command (bun needs to be installed for this):

    ```bash
    cd custom
    bun install
    bun run build
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

1.  **Configure Provider**: After installation, press `Ctrl+Shift+F`. No setup is needed to start: BrowseBot defaults to **Pollinations AI**, which is free and requires no API key. To use a different provider, select it and paste its API key instead. For **Ollama**, set the local Base URL in the settings.

> [!NOTE]
> The default Pollinations tier is anonymous and rate limited (about one request per 15 seconds) and serves smaller models on sponsor funded infrastructure, so heavy or agentic use can feel slow. Switch to a keyed provider, or register for a free Pollinations key for higher limits, when you need more.

2.  **Save the Key**: Paste the key into the input field and click "Save". The chat interface will now appear.
3.  **Start Chatting**:
    - Press `Ctrl+F` to open the standard findbar.
    - In the default (non-minimal) view, click the "Expand" button to switch to AI chat. In Minimal Mode, just enter your query and click "Ask".
    - Type your questions about the current page and press on send button.
    - Use `Ctrl+Shift+F` to open the AI chat directly, using any text you have selected on the page as the initial prompt (this shortcut will not work if it has been changed).

### URL Bar AI Commands

1.  Press `Ctrl+Space` to activate AI mode in the URL bar (this shortcut will not work if has been changed).
2.  Type your command directly (e.g., "search for red pandas", "open github").
3.  Press `Enter` to execute the command. The AI will perform the action, often providing feedback via a small toast notification.

> [!NOTE]
> The URL bar AI is intentionally scoped to search, navigation, and opening links. For tab, workspace, and bookmark management, use the Library AI agent mode instead.

### Library AI

> [!NOTE]
> The Library section needs a Zen build with the Library feature (currently Twilight). On builds without it, the section stays hidden and the findbar/URL bar keep working as before.

1.  Press `Alt+Shift+A` (customizable) to toggle the Library AI, or run **Open BrowseBot Library** from the command palette. The section appears in the Library sidebar as **AI**.
2.  Pick a mode with the header buttons or a slash command:
    - **Chat** (`/chat`): plain Q&A. No tools, no automatic page context.
    - **Agent** (`/agent`): the full browser tool-belt (tabs, workspaces, bookmarks, search, navigation, page interaction, YouTube). Tool calls ask for confirmation first unless you disable that.
    - **Build** (`/build`): coming soon. Switches the mode; behaves like chat for now.
3.  Type `@` to reference any open tab. Picking one hands its full page content to the AI with your message.
4.  Slash commands accept a trailing message: `/agent close all youtube tabs` switches to agent mode and sends the rest immediately.

### Command Palette Integration

BrowseBot integrates with Zen Command Palette to provide quick access to common actions:

1.  Press `Ctrl+L` to open the palette.
2.  Available BrowseBot commands:
    - **Summarize Page**: Opens the findbar AI and prompts to summarize the current page.
    - **Open BrowseBot Settings**: Opens the BrowseBot settings modal.
    - **Toggle URL bar AI mode**: Activates AI mode in the URL bar.
    - **Expand findbar AI**: Opens the findbar directly in AI chat mode.

## 🔧 Customization

You can customize the BrowseBot through the settings modal (found in the chat header) or via `about:config`.

<details>
<summary><h3>Preferences (`about:config`)</h3></summary>

| Preference                                                            | Type    | Default                                                     | Description                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extension.browse-bot.findbar-ai.enabled`                             | Boolean | `true`                                                      | Toggles the findbar AI feature on or off.                                                                                                                                   |
| `extension.browse-bot.urlbar-ai-enabled`                              | Boolean | `true`                                                      | Toggles the URL bar AI feature on or off.                                                                                                                                   |
| `extension.browse-bot.urlbar-ai.hide-suggestions`                     | Boolean | `true`                                                      | Hides autocomplete suggestions in the URL bar when AI mode is active.                                                                                                       |
| `extension.browse-bot.urlbar-ai.animations-enabled`                   | Boolean | `true`                                                      | Enables animations for the URL bar AI.                                                                                                                                      |
| `extension.browse-bot.findbar-ai.minimal`                             | Boolean | `true`                                                      | Toggles a simpler, more compact UI for the findbar.                                                                                                                         |
| `extension.browse-bot.findbar-ai.persist-chat`                        | Boolean | `false`                                                     | Persists chat history across tab switches (but not browser restarts).                                                                                                       |
| `extension.browse-bot.findbar-ai.dnd-enabled`                         | Boolean | `true`                                                      | Enables dragging to move and resizing of the findbar window.                                                                                                                |
| `extension.browse-bot.findbar-ai.remember-dimensions`                 | Boolean | `true`                                                      | Remembers the size of the findbar window across sessions.                                                                                                                   |
| `extension.browse-bot.findbar-ai.width`                               | Number  | `500`                                                       | The width of the findbar.                                                                                                                                                   |
| `extension.browse-bot.findbar-ai.position`                            | String  | `"top-right"`                                               | Sets the corner where the findbar snaps. Options: `top-left`, `top-right`, `bottom-left`, `bottom-right`.                                                                   |
| `extension.browse-bot.findbar-ai.background-style`                    | String  | `"solid"`                                                   | The background style of the findbar. Options: `solid`, `acrylic`, `pseudo`.                                                                                                 |
| `extension.browse-bot.llm-provider`                                   | String  | `"pollinations"`                                            | Which AI provider to use. Options: `pollinations`, `gemini`, `mistral`, `openai`, `claude`, `grok`, `perplexity`, `cerebras`, `deepseek`, `openrouter`, `ollama`, `custom`. |
| `extension.browse-bot.pollinations-model`                             | String  | `"openai"`                                                  | The Pollinations model ID to use. Pick from the live-fetched list in settings.                                                                                              |
| `extension.browse-bot.deepseek-api-key`                               | String  | _(empty)_                                                   | Your API key for DeepSeek.                                                                                                                                                  |
| `extension.browse-bot.deepseek-model`                                 | String  | `"deepseek-chat"`                                           | The specific DeepSeek model to use.                                                                                                                                         |
| `extension.browse-bot.openrouter-api-key`                             | String  | _(empty)_                                                   | Your API key for OpenRouter.                                                                                                                                                |
| `extension.browse-bot.openrouter-model`                               | String  | `"google/gemini-2.5-flash"`                                 | The OpenRouter model ID to use.                                                                                                                                             |
| `extension.browse-bot.cerebras-api-key`                               | String  | _(empty)_                                                   | Your API key for Cerebras AI.                                                                                                                                               |
| `extension.browse-bot.cerebras-model`                                 | String  | `"gpt-oss-120b"`                                            | The specific Cerebras model to use.                                                                                                                                         |
| `extension.browse-bot.gemini-api-key`                                 | String  | _(empty)_                                                   | Your API key for Google Gemini.                                                                                                                                             |
| `extension.browse-bot.gemini-model`                                   | String  | `"gemini-2.5-flash"`                                        | The specific Gemini model to use.                                                                                                                                           |
| `extension.browse-bot.mistral-api-key`                                | String  | _(empty)_                                                   | Your API key for Mistral AI.                                                                                                                                                |
| `extension.browse-bot.mistral-model`                                  | String  | `"mistral-medium-latest"`                                   | The specific Mistral model to use.                                                                                                                                          |
| `extension.browse-bot.openai-api-key`                                 | String  | _(empty)_                                                   | Your API key for OpenAI.                                                                                                                                                    |
| `extension.browse-bot.openai-model`                                   | String  | `"gpt-5.6-terra"`                                           | The specific OpenAI model to use.                                                                                                                                           |
| `extension.browse-bot.claude-api-key`                                 | String  | _(empty)_                                                   | Your API key for Anthropic Claude.                                                                                                                                          |
| `extension.browse-bot.claude-model`                                   | String  | `"claude-sonnet-5"`                                         | The specific Claude model to use.                                                                                                                                           |
| `extension.browse-bot.grok-api-key`                                   | String  | _(empty)_                                                   | Your API key for xAI Grok.                                                                                                                                                  |
| `extension.browse-bot.grok-model`                                     | String  | `"grok-4.6"`                                                | The specific Grok model to use.                                                                                                                                             |
| `extension.browse-bot.perplexity-api-key`                             | String  | _(empty)_                                                   | Your API key for Perplexity AI.                                                                                                                                             |
| `extension.browse-bot.perplexity-model`                               | String  | `"sonar"`                                                   | The specific Perplexity model to use.                                                                                                                                       |
| `extension.browse-bot.ollama-base-url`                                | String  | `http://localhost:11434/api`                                | The base URL for your local Ollama API.                                                                                                                                     |
| `extension.browse-bot.ollama-model`                                   | String  | `"qwen3:8b"`                                                | The specific Ollama model to use.                                                                                                                                           |
| `extension.browse-bot.findbar-ai.context-menu-enabled`                | Boolean | `true`                                                      | Toggles the "Ask AI" item in the right-click context menu.                                                                                                                  |
| `extension.browse-bot.findbar-ai.context-menu-autosend`               | Boolean | `true`                                                      | If true, clicking the context menu item sends the request to the AI immediately.                                                                                            |
| `extension.browse-bot.findbar-ai.context-menu-command-no-selection`   | String  | `"Summarize current page"`                                  | The command to send when no text is selected.                                                                                                                               |
| `extension.browse-bot.findbar-ai.context-menu-command-with-selection` | String  | `"Explain this in context of current page:\n\n{selection}"` | The command to send when text is selected. `{selection}` is the placeholder.                                                                                                |
| `extension.browse-bot.library-ai.max-tool-calls`                      | Number  | `0`                                                         | The maximum number of consecutive tool calls the AI can make in one turn. `0` means unlimited.                                                                              |
| `extension.browse-bot.findbar-ai.max-context-chars`                   | Number  | `0`                                                         | Maximum page or transcript characters sent per message. `0` means unlimited.                                                                                                |
| `extension.browse-bot.findbar-ai.system-prompt`                       | String  | _(empty)_                                                   | Custom system prompt for the findbar AI.                                                                                                                                    |
| `extension.browse-bot.urlbar-ai.system-prompt`                        | String  | _(empty)_                                                   | Custom system prompt for the URL bar AI.                                                                                                                                    |
| `extension.browse-bot.library-ai.chat-system-prompt`                  | String  | _(empty)_                                                   | Custom system prompt for the Library chat mode.                                                                                                                             |
| `extension.browse-bot.library-ai.agent-system-prompt`                 | String  | _(empty)_                                                   | Custom system prompt for the Library agent mode.                                                                                                                            |
| `extension.browse-bot.library-ai.build-system-prompt`                 | String  | _(empty)_                                                   | Custom system prompt for the Library build mode.                                                                                                                            |
| `extension.browse-bot.library-ai.confirm-before-tool-call`            | Boolean | `true`                                                      | If true, prompts you for confirmation before the AI executes any tools.                                                                                                     |
| `extension.browse-bot.findbar-ai.stream-enabled`                      | Boolean | `true`                                                      | AI response will be streamed in chunks.                                                                                                                                     |
| `extension.browse-bot.findbar-ai.citations-enabled`                   | Boolean | `false`                                                     | If true, the AI will try to cite its sources from the page content.                                                                                                         |
| `extension.browse-bot.llm.temperature`                                | Number  | `0.7`                                                       | Controls randomness.                                                                                                                                                        |
| `extension.browse-bot.llm.top-p`                                      | Number  | `1.0`                                                       | Nucleus sampling limits.                                                                                                                                                    |
| `extension.browse-bot.llm.top-k`                                      | Number  | `40`                                                        | Limits sampling to top K tokens.                                                                                                                                            |
| `extension.browse-bot.llm.frequency-penalty`                          | Number  | `0.0`                                                       | Penalizes frequent tokens.                                                                                                                                                  |
| `extension.browse-bot.llm.presence-penalty`                           | Number  | `0.0`                                                       | Penalizes repeated tokens.                                                                                                                                                  |
| `extension.browse-bot.llm.max-output-tokens`                          | Number  | `2048`                                                      | Maximum number of tokens to generate.                                                                                                                                       |
| `extension.browse-bot.findbar-ai.shortcut-findbar`                    | String  | `"ctrl+shift+f"`                                            | Keyboard shortcut to open findbar AI. Format: `ctrl+shift+f` (press keys to record in settings).                                                                            |
| `extension.browse-bot.urlbar-ai.shortcut-urlbar`                      | String  | `"ctrl+space"`                                              | Keyboard shortcut to toggle URL bar AI mode. Format: `ctrl+space` (press keys to record in settings).                                                                       |
| `extension.browse-bot.library-ai.shortcut-library`                    | String  | `"alt+shift+a"`                                             | Keyboard shortcut to open the BrowseBot Library section.                                                                                                                    |
| `extension.browse-bot.library-ai.enabled`                             | Boolean | `true`                                                      | Adds the BrowseBot section to the Zen Library (needs a Zen build with the Library feature).                                                                                 |
| `extension.browse-bot.library-ai.mode`                                | String  | `"chat"`                                                    | Library AI mode. Options: `chat`, `agent`, `build` (coming soon).                                                                                                           |
| `extension.browse-bot.debug-mode`                                     | Boolean | `false`                                                     | Set to `true` to enable verbose logging in the Browser Console for troubleshooting.                                                                                         |

</details>

### ⌨️ Keymaps

Default keyboard shortcuts:

| Shortcut       | Action                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `Ctrl+Shift+F` | Opens the findbar directly into the expanded AI mode.                                                       |
| `Ctrl+Space`   | Toggles the URL bar into AI command mode.                                                                   |
| `Escape`       | If the AI interface is expanded, it collapses to the standard findbar. If not expanded, closes the findbar. |
| `Alt + Enter`  | Sends the text from the standard findbar to the AI, expanding the view.                                     |

> [!NOTE]
> You can customize these shortcuts in the Settings modal under "Keyboard Shortcuts".

## 🔨 Tool-calls

Tool calls live in the **Library AI agent mode**, which stays open across tab and workspace switches, so long multi-step runs are never aborted by navigation.

> [!NOTE]
> The **Findbar AI** is page Q&A only and makes no tool calls. The **URL Bar AI** uses a focused subset for quick actions: `Search`, `Navigation`, and `UI Feedback` (toast notifications).

Currently available tool calls are (full set in Library agent mode):

- **Search**: Searches a term on your default or a specified search engine.
- **Navigation**: `openLink` in various locations (current/new tab, window, private, glance, splits), `newSplit` with multiple URLs, and `splitExistingTabs`.
- **Tab Management**: A full suite of tools to `getAllTabs`, `searchTabs`, `closeTabs`, `reorderTab`, `addTabsToFolder`, `removeTabsFromFolder`, `createTabFolder`, `addTabsToEssentials`, and `removeTabsFromEssentials`.
- **Page Interaction**: `getPageTextContent` to read text, `getHTMLContent` for the full source, `clickElement` using a CSS selector, and `fillForm` inputs.
- **YouTube**: `getYoutubeTranscript`, `getYoutubeDescription`, and `getYoutubeComments` for the current video.
- **Bookmark Management**: A full suite of tools to `searchBookmarks`, `getAllBookmarks`, `createBookmark`, `addBookmarkFolder`, `updateBookmark`, and `deleteBookmark`.
- **Workspace Management**: Tools to `getAllWorkspaces`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace`, `moveTabsToWorkspace`, and `reorderWorkspace`.
- **UI Feedback**: `showToast` to display temporary notifications to the user.

## ✔️ Development Roadmap

- [ ] Pin/unpin the findbar
- [x] Context Menu integration
- [x] Different themes (glass, light, dark, etc.)
- [ ] Smooth animations for all interactions
- [x] Custom system prompts
- [x] Add Settings.
- [ ] Copy Button
- [ ] Markdown Formatting toggle
- [x] Slash Command and variables (library chat: `/chat`, `/agent`, `/build`)
- [x] Adding more tools (tab groups, workspaces, background search)
- [x] Giving AI YouTube transcript
- [x] Tagging multiple tabs (`@` tab mentions in library chat)
- [x] Advanced LLM parameters (temperature, top-k, etc.)
- [x] Keyboard shortcut customization
- [x] Add more models (GPT-5, Gemini 2.5, DeepSeek R1, etc.)
- [ ] Build mode (library third mode, spec pending)

## 🐛 Bugs and potential issues (I am working on fixing them)

- In settings text encoding is broken (for chinese text).
- Styles in glance

## 🙏 Credits and Acknowledgements

- This mod is released through [Vertex Mods](https://github.com/Vertex-Mods/), and I, [Bibek Bhusal](https://github.com/BibekBhusal0), am the creator of this mod.
- **[natsumi-browser](https://github.com/greeeen-dev/natsumi-browser)**: For inspiration on the modern, floating UI styles in Findbar.
- **[Arc-2.0](https://github.com/YashjitPal/Arc-2.0)**: For inspiration for animation for URL bar.
- **[Arcline](https://github.com/ferrocyante/arcline)**: For implementation of pseudo background.
- **[aminomancer/uc.css.js](https://github.com/aminomancer/uc.css.js)**: The `_overrideFindbarMatchesDisplay` function in `findbar-ai.uc.js` is adapted from `JS/findbarMods.uc.js` under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).
- **[12th-devs/library-tweaks](https://github.com/12th-devs/library-tweaks)**: The BrowseBot Library section follows the native Library section contract (section classes, `zenLibrarySections` registration, `gZenLibrary.openTab`) demonstrated by this mod.
- **[12th-devs](https://github.com/12th-devs/)** for helping me in each step of developement, styling, and design.

## 📜 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
