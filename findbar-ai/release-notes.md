# New Features

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

- API keys are now encrypted with your OS credential store instead of being stored as plain text. Existing keys migrate automatically, no action needed.
- The mod is about 12x smaller now. No magic here, just removal: the Vercel AI SDK and zod were bloated, so they are gone, replaced by a small client written for this mod.
- Page content is sent as a conversation message instead of being embedded in the system prompt, which cuts repeated token spend on every reply.
- Model lists pruned to currently supported models, with updated defaults. Page and transcript size is now capped by a setting, unlimited by default.

# Fixes

- Claude and Grok provider icons now use the model icons (claude.ai, grok.com) instead of the company logos.
- Dropdowns no longer leave empty space when the selected item has no icon.
- Shortcut fields now show readable key symbols.
- Chat markdown rendering no longer depends on the Sine runtime.
