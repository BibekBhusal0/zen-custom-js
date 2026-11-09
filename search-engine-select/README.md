<h1 align="center">Search Engine Select</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

Search Engine Select is a user script for **Zen Browser** that adds a floating UI to switch search engines directly from a search results page. This script provides an easy and intuitive way to quickly perform the same search on different engines.

https://github.com/user-attachments/assets/52a6b810-77ee-4a04-b239-8d59e01478ef

## 🌟 Features

- **Auto-Detection**: Automatically detects the current search engine and search term on supported results pages.
- **Vertical Dragging**: Reposition the UI anywhere along the right side of your screen.
- **Smart Switching**: Quick search engine switching with various interaction modes:
  - **Left-click:** Search in the current tab.
  - **Right-click:** Open search in a background tab.
  - **Ctrl+Click:** Open in a new tab and create a Split View.
  - **Alt+Click:** Open search in a Glance view.
- **Highly Customizable**: Change the size and theme of the switcher to match your Zen setup.
- **Command Palette Integration**: Re-run the current page's search term in any other engine from [Zen Command Palette](https://github.com/Vertex-Mods/Zen-Command-Palette).

## ⌘ Command Palette Integration

If [Zen Command Palette](https://github.com/Vertex-Mods/Zen-Command-Palette) is installed, this mod adds a `Search current search term in <engine>` command for every visible search engine. Pick one and the term this mod detected on the current page is searched in that engine right away, in the current tab.

A command only shows up when the current page has a detected search term and the engine is not the one already in use — the switcher itself handles that one. The commands are registered as a dynamic command provider with the mod's own `extension.search-engine-select.palette-commands` preference, so you can disable them from the mod's settings (or from the palette's "Dynamic Commands" section) without touching anything else. Each command shows the engine name as a pretty chip (with its icon when the palette can render it) and can be given custom icons and shortcuts in the palette's command settings.

### How this differs from the palette's built-in search engine commands

The palette's built-in `Search with: <engine>` command only changes the URL bar's search engine mode. It does not know about a search term, so after running it you still type the term and press Enter.

Search Engine Select's `Search current search term in <engine>` commands use the term already detected on the page and perform the whole search in one step. That is why they only appear on a search results page (or anywhere the mod detected a term). The built-in commands are left untouched, so you can use either style: switch the engine first, or search the current term directly.

## ⚙️ Installation Guide

1. Install latest version of [Sine](https://github.com/CosmoCreeper/Sine) (if you haven't already).
2. Restart Zen Browser.
3. Open settings and go to the `Sine` tab.
4. Search for Search Engine Select.
5. Click Install.
6. A toast for restart should appear - click on that to restart Zen.

## 🎨 Customization & Preferences

You can customize the script's behavior via `about:config`.

| Preference                                         | Type    | Default    | Description                                                                                     |
| -------------------------------------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `extension.search-engine-select.enabled`           | Boolean | `true`     | Toggles the entire feature on or off.                                                           |
| `extension.search-engine-select.palette-commands`  | Boolean | `true`     | Shows the `Search current search term in <engine>` commands in Zen Command Palette.             |
| `extension.search-engine-select.remember-position` | Boolean | `true`     | Saves the vertical position of the UI.                                                          |
| `extension.search-engine-select.size`              | String  | `"normal"` | UI Scale (`small`, `normal`, `large`).                                                          |
| `extension.search-engine-select.theme`             | String  | `"dark"`   | Visual style (`dark`, `light`, `amoled`).                                                       |
| `extension.search-engine-select.autohide`          | String  | `"off"`    | Hide until hover (`off`, `translucent`, `hidden`). The switcher is always hidden in fullscreen. |
| `extension.search-engine-select.debug-mode`        | Boolean | `false`    | Enables detailed logging in the Browser Console (`Ctrl+Shift+J`).                               |

## 🙏 Credits and Acknowledgements

This mod is released through [Vertex Mods](https://github.com/Vertex-Mods/), and I, [Bibek Bhusal](https://github.com/BibekBhusal0), am the creator of this mod.

## 📜 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
