# Zen Command Palette

Zen Command Palette is a powerful, extensible command interface for Zen Browser, seamlessly integrated directly into the URL bar. Inspired by the command palettes in modern productivity tools like **Arc Browser**, **Raycast**, and **Vivaldi**, it provides a fast and efficient way to control your browser with just a few keystrokes.

This project aims to be a modern and actively maintained alternative, building upon the ideas of existing modifications to create a more robust and user-friendly experience.

## Features

- **Seamless URL Bar Integration**: No new UI elements. The command palette appears naturally as you type in the address bar.
- **Smart Activation**: Appears when you type a query of 4+ characters, or immediately with the `:` prefix. It intelligently stays out of the way when you're using a search engine one-off.
- **Exclusive Command Mode**: Start your query with a colon (`:`) to hide all other search suggestions and focus exclusively on commands.
- **Fuzzy Search & Smart Sorting**: Quickly find what you're looking for with a powerful fuzzy search that scores and sorts results, prioritizing the best matches.
- **Dynamic Commands**: Automatically generates commands for your installed search engines, extensions, workspaces, and internal `about:` pages.
- **Extensible API**: Other user scripts and browser mods can easily add their own commands, making the palette a central hub for all your custom actions.
- **Highly Customizable**: Use `about:config` to change the number of results, when the palette appears, and which dynamic commands are loaded.

## Customization & Preferences

The Zen Command Palette can be configured via `about:config`. Enter `about:config` in your URL bar, and then search for the preference keys listed below to change their values.

| Preference Key                                 | Type    | Default | Description                                                              |
| ---------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------ |
| `zen-command-palette.debug-mode`               | Boolean | `true`  | Enables detailed logging in the Browser Console for troubleshooting.     |
| `zen-command-palette.max-commands`             | Integer | `3`     | The maximum number of command results to display at once.                |
| `zen-command-palette.min-query-length`         | Integer | `4`     | Minimum characters needed to show commands (unless using the `:` prefix). |
| `zen-command-palette.dynamic.about-pages`      | Boolean | `true`  | Automatically generate commands for `about:` pages.                      |
| `zen-command-palette.dynamic.search-engines`   | Boolean | `true`  | Automatically generate commands for your installed search engines.       |
| `zen-command-palette.dynamic.extensions`       | Boolean | `true`  | Automatically generate commands for extensions with an options page.     |
| `zen-command-palette.dynamic.workspaces`       | Boolean | `true`  | Automatically generate commands for switching between Zen Workspaces.    |

## Available Commands

<details>
<summary>Click to view the full list of commands</summary>

### Tab Management
- Duplicate Tab
- Clear Other Tabs
- Move Tab Left / Right
- Close Tab
- Toggle Mute Tab
- Pin / Unpin Tab
- Next / Previous Tab
- Show All Tabs Panel
- Add to / Remove from Essentials
- Replace Pinned Tab URL with Current
- Reset Pinned Tab
- Reopen Closed Tab

### Window Management
- New Window
- Close Window
- Minimize Window
- Open Private Window
- Reopen Closed Window

### Navigation & History
- Go Back / Forward
- Stop Loading
- Reload Page / Hard Reload
- Bookmark This Page / All Tabs
- Search Bookmarks / History
- Show All Bookmarks / History (Library)

### Zen Browser Features
- **Compact Mode**: Toggle Compact Mode, Floating Sidebar, or Floating Toolbar
- **Workspaces**: Next/Previous Workspace, Change Tab's Workspace, Delete Workspace, Change Icon, Create New Workspace, Reorder Workspaces
- **Split View**: Set Grid, Vertical, or Horizontal Split; Unsplit View
- **Themes**: Open Theme Picker
- **UI**: Toggle Tabs on Right, Toggle Sidebar Width, Copy Current URL (and as Markdown)

### Find & Search
- Find in Page
- Find Next / Previous
- Translate Page

### View & Display
- Toggle Fullscreen
- Zoom In / Out / Reset

### Media & Files
- Toggle Picture-in-Picture
- Take Screenshot
- View Downloads
- Save Page As...
- Print Page
- Open File

### Dynamic Commands
- **About Pages**: Automatically generated commands to open any of Firefox's internal `about:` pages (e.g., `about:config`, `about:addons`).
- **Search Engines**: Automatically generated commands to switch the URL bar's current search engine to any of your installed engines (e.g., "Search with: Google").
- **Extension Options**: Automatically generated commands to open the options page for any of your installed extensions that have one.
- **Workspaces**: Automatically generated commands to switch to any of your other Zen Workspaces.

</details>

## Extensibility

Adding your own commands from other scripts is straightforward. The `ZenCommandPalette` object is exposed on the `window`, allowing you to use its API.

Here is an example of how another script can add a command:

```javascript
// Example from another .uc.js file
if (window.ZenCommandPalette) {
  window.ZenCommandPalette.addCommand({
    key: "my-mod:reload",
    label: "Reload My Custom Mod",
    command: () => {
      // Your mod's reload logic here
      console.log("Reloading My Custom Mod!");
    },
    icon: "chrome://browser/skin/reload.svg", // Optional icon
    tags: ["my mod", "custom", "reload"],   // Optional tags for fuzzy search
    condition: () => MyMod.isReady, // Optional, shows command only if true
  });
}
```

## Project Status & Disclaimer

**This project is in a very early stage of development.**

While the core functionality is solid, the command list was originally adapted from another project and has been progressively tested and fixed. There may still be commands that do not function as intended.

If you encounter any bugs or commands that are not working, please first check if an issue already exists. If not, please report it here:
- **[https://github.com/BibekBhusal0/zen-custom-js/issues/19](https://github.com/BibekBhusal0/zen-custom-js/issues/19)**

## Credits and Acknowledgements

This project was heavily inspired by the work done on the **[ZBar-Zen](https://github.com/Darsh-A/ZBar-Zen)** command bar by **Darsh-A**. The initial comprehensive command list was adapted from that project, providing a fantastic foundation for this palette. The `clearTabs` function was also adapted from another one of her repositories, **[Ai-TabGroups-ZenBrowser](https://github.com/Darsh-A/Ai-TabGroups-ZenBrowser/blob/main/clear.uc.js)**. Thank you for your original creators I am just a copy-cat.
