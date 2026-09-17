# New Features

- Provider and model dropdowns now use fuzzy matching, same as the command palette.
- All dropdowns now always show the search box, no matter how short the list is.
- Settings pages refreshed to match your Zen theme.
- Provider and model dropdowns are now searchable, show provider logos, and stay a consistent size. The AI setup screen's provider picker got the same treatment.
- New providers: DeepSeek and OpenRouter.
- YouTube videos now use a timestamped transcript. Citations on videos link to moments, click one to seek the video there.

# Changes

- The mod is about 12x smaller now. No magic here, just removal: the Vercel AI SDK and zod were bloated, so they are gone, replaced by a small client written for this mod.
- Page content is sent as a conversation message instead of being embedded in the system prompt, which cuts repeated token spend on every reply.
- Model lists pruned to currently supported models, with updated defaults. Page and transcript size is now capped by a setting, unlimited by default.

# Fixes

- Dropdowns no longer leave empty space when the selected item has no icon.
- Shortcut fields now show readable key symbols.
- Chat markdown rendering no longer depends on the Sine runtime.
