# New Features

- Settings pages refreshed to match your Zen theme.
- Provider and model dropdowns are now searchable, show provider logos, and stay a consistent size. The AI setup screen's provider picker got the same treatment.
- New providers: DeepSeek and OpenRouter.
- YouTube videos now use a timestamped transcript. Citations on videos link to moments, click one to seek the video there.

# Changes

- The Vercel AI SDK and zod are gone. BrowseBot now ships a small dependency-free client, so installs are roughly ten times smaller and fully reviewable.
- Page content is sent as a conversation message instead of being embedded in the system prompt, which cuts repeated token spend on every reply.
- Model lists pruned to currently supported models, with updated defaults. Page and transcript size is now capped by a setting, unlimited by default.

# Fixes

- Shortcut fields now show readable key symbols.
- Chat markdown rendering no longer depends on the Sine runtime.
