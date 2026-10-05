# New Features

- Updated UI of the settings pages, now organized into tabs for `General`, `Surfaces`, `Models`, and `Prompts` with icons on every tab and section.
- Library panel for Zen builds with the Library feature. The panel stays open across tab and workspace switches. Press Alt+Shift+A to toggle it, same as the command palette entry.
  - `Chat` answers questions with no tools and no automatic page context.
  - `Agent` runs the full browser tool belt. It reads and organizes tabs, searches the web, manages bookmarks and workspaces, clicks and fills page elements, and reads YouTube transcripts.
  - `Build` styles the browser and builds Sine mods. Describe the look you want and it stages a live preview, then saves it as a mod.
  - Switch modes from the header buttons or with /chat, /agent and /build. Type text after the command to switch and send in one step.
  - Manage chats with /new, /delete, /close and /continue, or open saved chats from the history button in the header.
  - Type @ to pull any open tab into the conversation. The AI reads the full page.
- Provider and model pickers are searchable, show provider logos, keep a steady size, and match on partial text. All pickers always show the search box.
- Works out of the box with Pollinations, no API key needed. Also new are DeepSeek and OpenRouter. DeepSeek now offers V4 Flash, V4 Pro, and V4 Flash Vision Experimental. Old DeepSeek names move to V4 Flash on their own. Cerebras adds Qwen 3.8 27B and drops Gemma 4 31B. Perplexity, local models through Ollama, and any OpenAI compatible endpoint through Custom were already there and keep working.
- YouTube answers link to moments in the video. Click a citation to seek there.

# Changes

- The findbar answers questions about the page. The URL bar handles search and navigation. All browser tools live in the Library Agent mode.
- API keys are now stored encrypted with your OS credential store. Existing keys move over on their own.
- The download is about 12x smaller and loads faster. The Vercel AI SDK and zod are gone, replaced by a small client written for this mod.

# Breaking Changes

- Findbar agentic mode is gone. Use Library Agent mode for anything that touches the browser.
- The `extension.browse-bot.custom-system-prompt` pref is now split into separate prompts per surface: `extension.browse-bot.findbar-ai.system-prompt`, `extension.browse-bot.urlbar-ai.system-prompt`, and `extension.browse-bot.library-ai.chat-system-prompt`, `agent-system-prompt` and `build-system-prompt`. Your old prompt stays with the findbar.
- The `extension.browse-bot.findbar-ai.max-tool-calls` pref moved to `extension.browse-bot.library-ai.max-tool-calls`, now unlimited by default. The `extension.browse-bot.findbar-ai.conform-before-tool-call` pref moved to `extension.browse-bot.library-ai.confirm-before-tool-call` with the spelling fixed. Saved values move with them.

# Fixes

- Claude and Grok entries now show the right icons.
- Shortcut fields show readable key symbols.
- Chat markdown renders without the Sine runtime.
- Saving settings no longer pops the findbar open when you work in the library.
