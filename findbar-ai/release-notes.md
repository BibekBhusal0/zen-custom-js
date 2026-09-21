# New Features

- BrowseBot Library section (needs a Zen build with the Library feature): a persistent AI panel that stays open across tab and workspace switches, with Chat, Agent, and Build (working on it) modes.
- Slash commands with autocomplete in library chat: `/chat`, `/agent`, `/build`. They switch modes, or switch and send the rest of the line.
- `@` tab mentions in library chat: reference any open tab and the AI gets its full page content, shown as chips with favicons.
- Per-surface system prompts: separate prompts for findbar, URL bar, and each library mode. Your old custom prompt moves to the findbar automatically.
- Code blocks in chat answers now have syntax highlighting, a language label, and a Copy button.
- Provider and model dropdowns now use fuzzy matching, same as the command palette.
- All dropdowns now always show the search box, no matter how short the list is.
- DeepSeek models updated to V4 Flash, V4 Pro, and V4 Flash Vision (Experimental). The retired `deepseek-chat` / `deepseek-reasoner` names migrate to V4 Flash automatically.
- Cerebras models updated: added Qwen 3.8 27B, removed Gemma 4 31B (no longer on Cerebras public endpoints).
- Settings pages refreshed to match your Zen theme.
- Provider and model dropdowns are now searchable, show provider logos, and stay a consistent size. The AI setup screen's provider picker got the same treatment.
- New providers: DeepSeek and OpenRouter.
- YouTube videos now use a timestamped transcript. Citations on videos link to moments, click one to seek the video there.

# Changes

- All browser tool calls now live in the Library agent mode; the findbar is page Q&A only and the URL bar handles search and navigation.
- New Library shortcut `Alt+Shift+A` toggles the panel, same as the command palette entry.
- Retired model and old key migrations removed.
- API keys are now encrypted with your OS credential store instead of being stored as plain text. Existing keys migrate automatically, no action needed.
- The mod is about 12x smaller now. No magic here, just removal: the Vercel AI SDK and zod were bloated, so they are gone, replaced by a small client written for this mod.
- Page content is sent as a conversation message instead of being embedded in the system prompt, which cuts repeated token spend on every reply.
- Model lists pruned to currently supported models, with updated defaults. Page and transcript size is now capped by a setting, unlimited by default.

# Breaking Changes

- Findbar agentic mode is removed. The findbar is page Q&A only; all tool calls moved to the Library agent mode. The `extension.browse-bot.findbar-ai.agentic-mode` preference is deleted.
- The shared `extension.browse-bot.custom-system-prompt` preference is replaced by per-surface prompts (findbar, URL bar, library chat/agent/build). Existing values migrate to the findbar prompt.

# Fixes

- Claude and Grok provider icons now use the model icons (claude.ai, grok.com) instead of the company logos.
- Dropdowns no longer leave empty space when the selected item has no icon.
- Shortcut fields now show readable key symbols.
- Chat markdown rendering no longer depends on the Sine runtime.
