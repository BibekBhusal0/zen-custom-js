<h1 align="center">Search Engine Select</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

Search Engine Select is a user script for **Zen Browser** that adds a floating UI to switch search engines directly from a search results page. This script provides an easy and intuitive way to quickly perform the same search on different engines.

https://github.com/user-attachments/assets/52a6b810-77ee-4a04-b239-8d59e01478ef

## 🌟 Features

- Automatically detects the current search engine and search term.
- A floating UI that can be repositioned vertically by dragging.
- Quick search engine switching with various interaction modes:
  - **Left-click:** Search in the current tab.
  - **Right-click:** Open search in a background tab.
  - **Ctrl+Click:** Open in a new tab and create a Split View.
  - **Alt+Click:** Open search in a Glance view.
- Favicon support with Google Favicon API fallback.
- Responsive pop-up menu that opens above or below the UI to stay on screen.

## ⚙️ Installation Guide

1. Install latest version of [Sine](https://github.com/CosmoCreeper/Sine) (if you haven't already).
2. Restart Zen Browser.
3. Open settings and go to the `Sine` tab.
4. Search for Search Engine Select.
5. Click Install.
6. A toast for restart should appear — click on that to restart Zen.

## 🎨 Customization & Preferences

You can customize the script's behavior via `about:config`.

| Preference                                         | Type    | Default | Description                                                                       |
| -------------------------------------------------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `extension.search-engine-select.enabled`           | Boolean | `true`  | Toggles the entire feature on or off in real-time (no need to restart).           |
| `extension.search-engine-select.remember-position` | Boolean | `true`  | If `true`, the vertical position of the UI will be saved between sessions.        |
| `extension.search-engine-select.y-coor`            | String  | `"60%"` | Stores the last y coordinate position. This is managed automatically.             |
| `extension.search-engine-select.debug-mode`        | Boolean | `false` | Set to `true` to enable detailed logging in the Browser Console (`Ctrl+Shift+J`). |

## 🙏 Credits and Acknowledgements

This mod is released through [Vertex Mods](https://github.com/Vertex-Mods/), and I, [Bibek Bhusal](https://github.com/BibekBhusal0), am the creator of this mod.

## 📜 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
