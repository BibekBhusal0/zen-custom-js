# New Features

- Settings tabs and sections now have native icons.
- Custom JS commands get syntax highlighting, plus a confirmation dialog showing the full code on first run.
- Settings commands search now uses the same fuzzy matching as the palette, with results sorted by relevance.
- All dropdowns in settings are now searchable, show icons, match on partial text, and stay sorted by relevance.
- Updated UI of the settings pages.
- Pressing Tab now shows command palette commands.

# New Commands

- Switch profiles without leaving the palette, for example `Switch to Profile: Work`.
- Trigger extension buttons and run extension commands, for example `Trigger Extension: uBlock Origin` or `uBlock Origin: Open dashboard`. Both live under Dynamic Commands in settings and can be turned off there.
- Quick Split opens split views and glance previews from the palette. Type site names with a separator between them and pick the result.
  - `github | youtube` opens the two sites side by side.
  - `github - youtube` stacks them top to bottom. `_` works the same as `-`.
  - `github | youtube - reddit` mixes both into a grid.
  - `+github` opens the site in a glance overlay instead of a split.
  - `| github` splits GitHub with the tab you are on. A separator at the start or end pulls in the current tab.
  - Each part can be a keyword, a link, or a plain search term. Keywords open their fixed site, links open as typed, and anything else searches through your Quick Split search engine.
  - Pick the search engine and manage keywords in the palette settings, in the Quick Split section. `-` and `_` need spaces around them.

# Demo
Quick split idea might be complicated to understand so for it I prepared short video demonstrate, hope it helps understand how it woks.

https://github.com/user-attachments/assets/9b45ee05-3cd0-4ec5-a737-4c88de4e666c

# Fixes

- Fallback command icons now use the native Zen bolt icon.
- Updated UI of command icons. Extension icons now always render at the right size and match the theme.
- Prefix mode style similar to animation.

# Breaking Changes

- Removed the Extension Options commands. The Extensions toggle now triggers extensions and runs their commands instead of opening options pages.
