# Zen Command Palette

Zen Command Palette is a powerful, extensible command interface for Zen Browser, seamlessly integrated directly into the URL bar. Inspired by the command palettes in modern productivity tools like **Arc Browser**, **Raycast**, and **Vivaldi**, it provides a fast and efficient way to control your browser with just a few keystrokes.

https://github.com/user-attachments/assets/999167fa-aa3e-417c-94b5-e40c12e1897e

This project aims to be a modern and actively maintained alternative, building upon the ideas of existing modifications to create a more robust and user-friendly experience.

## Features

- **Seamless URL Bar Integration**: No new UI elements. The command palette appears naturally as you type in the address bar.
- **Smart Activation**: Appears when you type a query of sufficient length, or immediately with the `:` prefix. It intelligently stays out of the way when you're using a search engine one-off.
- **Exclusive Command Mode**: Start your query with a colon (`:`) to hide all other search suggestions and focus exclusively on commands.
- **Fuzzy Search & Smart Sorting**: Quickly find what you're looking for with a powerful fuzzy search that scores and sorts results, prioritizing the best matches.
- **Dynamic Commands**: Automatically generates commands for your installed search engines, extensions, workspaces, folders, and internal `about:` pages.
- **Sine Mod Management**: Find and uninstall your installed Sine mods directly from the command palette. _Note: Installing new mods is not currently supported as the required API is not exposed by Sine._
- **Extensible API**: Other user scripts and browser mods can easily add their own commands, making the palette a central hub for all your custom actions.
- **Highly Customizable**: Use the built-in settings page to change the number of results, when the palette appears, and which dynamic commands are loaded.

## Customization & Preferences

The Zen Command Palette can be configured via its own settings page. Simply type `:settings` in the command palette and select "Settings Shortcuts Search" to open it.

| Preference Key                               | Type    | Default | Description                                                               |
| -------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------- |
| `zen-command-palette.prefix-required`        | Boolean | `false` | If `true`, commands only appear when the query starts with `:`.           |
| `zen-command-palette.debug-mode`             | Boolean | `false` | Enables detailed logging in the Browser Console for troubleshooting.      |
| `zen-command-palette.max-commands`           | Integer | `3`     | The maximum number of command results to display at once (without `:`).   |
| `zen-command-palette.max-commands-prefix`    | Integer | `50`    | The maximum number of command results to display with the `:` prefix.     |
| `zen-command-palette.min-query-length`       | Integer | `3`     | Minimum characters needed to show commands (unless using the `:` prefix). |
| `zen-command-palette.min-score-threshold`    | Integer | `20`    | The minimum fuzzy-search score required for a command to be shown.        |
| `zen-command-palette.dynamic.about-pages`    | Boolean | `false` | Automatically generate commands for `about:` pages.                       |
| `zen-command-palette.dynamic.search-engines` | Boolean | `true`  | Automatically generate commands for your installed search engines.        |
| `zen-command-palette.dynamic.extensions`     | Boolean | `true`  | Automatically generate commands for extensions with an options page.      |
| `zen-command-palette.dynamic.workspaces`     | Boolean | `true`  | Automatically generate commands for switching/moving tabs to Workspaces.  |
| `zen-command-palette.dynamic.folders`        | Boolean | `true`  | Automatically generate commands for managing Folders.                     |
| `zen-command-palette.dynamic.sine-mods`      | Boolean | `true`  | Automatically generate commands for Installing/uninstalling sine mods.    |
| `zen-command-palette.dynamic.container-tabs` | Boolean | `true`  | Automatically generate commands for moving tabs between containers.       |
| `zen-command-palette.dynamic.active-tabs`    | Boolean | `true`  | Automatically generate commands for switching between active tabs.        |

## Available Commands

<details>
<summary>Click to view the full list of commands</summary>

### Tab Management
- Add to Essentials
- Clear Other Tabs
- Close Tab
- Duplicate Tab
- Move Tab Down
- Move Tab Up
- New Tab
- Next Tab
- Pin Tab
- Previous Tab
- Remove from Essentials
- Rename Tab
- Reopen Closed Tab
- Reset Pinned Tab
- Replace Pinned Tab URL with Current
- Show All Tabs Panel
- Toggle Mute Tab
- Unload Tab
- Unload other tabs
- Unpin Tab

### Window Management
- Close Window
- Maximize Window
- Minimize Window
- New Window
- Open Private Window
- Reopen Closed Window

### Navigation & History
- Go Back
- Go Forward
- Hard Reload (Skip Cache)
- Home
- Reload Page
- Stop Loading
- Bookmark All Tabs
- Bookmark This Page
- Search Bookmarks
- Search History
- Show All Bookmarks (Library)
- Show All History (Library)

### Zen Browser Features
- **Compact Mode**: 
  - Toggle Compact Mode
  - Toggle Floating Sidebar
  - Toggle Floating Toolbar
  - Toggle Sidebar
  - Toggle Toolbar
- **Workspaces**: 
  - Change Workspace Icon
  - Change Workspace Name
  - Create New Workspace
  - Delete Workspace
  - Next Workspace
  - Previous Workspace
  - Reorder Workspaces
- **Folders**: 
  - Create New Folder
  - Remove Tab from Folder
- **Split View**: 
  - Split Grid
  - Split Horizontal
  - Split Vertical
  - Unsplit View
- **Glance**:
  - Close Glance
  - Expand Glance
  - Split Glance
- **Themes**: 
  - Open Theme Picker
- **UI**: 
  - Copy Current URL
  - Copy Current URL as Markdown
  - Toggle Sidebar Width
  - Toggle Tabs on Right

### Find & Search
- Find in Page
- Find Next
- Find Previous
- Translate Page

### View & Display
- Toggle Fullscreen
- Zoom In
- Zoom Out
- Reset Zoom
- View Page Info
- View Page Source

### Media & Files
- Open File
- Print Page
- Save Page As...
- Take Screenshot
- Toggle Picture-in-Picture
- View Downloads

### System & Application
- Clear Recent History...
- Clear Startup Cache
- Customize Toolbar...
- Manage Extensions
- Quit Browser
- Restart Browser
- Toggle Work Offline

### Dynamic Commands
- **About Pages**: `Open about:[page-name]` (e.g., "Open about:config").
- **Search Engines**: `Search with: [Engine Name]` to change the default search engine for the next search.
- **Extension Options**: `Extension Options: [Addon Name]` to open the options page for an extension.
- **Container Tabs**: `Open Tab in: [Container Name]` to move the current tab to a different container.
- **Active Tabs**: `Switch to Tab: [Tab Title]` to quickly switch to any open tab, even across workspaces.
- **Workspaces**: `Switch to workspace: [Workspace Name]` and `Move Tab to Workspace: [Workspace Name]`.
- **Sine Mods**: `Install Sine Mod: [Mod Name]` and `Uninstall Sine Mod: [Mod Name]`.
- **Folders**: `Delete Folder: [Folder Name]` and `Move Tab to Folder: [Folder Name]`.

</details>

## Extensibility

Adding your own commands from other scripts is straightforward. The `ZenCommandPalette` object is exposed on the `window`, allowing you to use its API to add both static and dynamic commands.

### Adding a Static Command

Static commands are added once and are always available, unless their `condition` evaluates to false.

```javascript
// Example from another .uc.js file
if (window.ZenCommandPalette) {
  window.ZenCommandPalette.addCommand({
    key: "my-mod:reload",
    label: "Reload My Custom Mod",
    command: () => {
      // Your mod's reload logic here. This function is executed when the command is selected.
      // It can be synchronous or return a Promise.
      console.log("Reloading My Custom Mod!");
    },
    icon: "chrome://browser/skin/reload.svg", // Optional: Path to an icon.
    tags: ["my mod", "custom", "reload"],    // Optional: Extra keywords for fuzzy search.
    condition: () => MyMod.isReady,          // Optional: A function that returns a boolean. The command only appears if it returns true.
  });
}
```

If you omit the `command` function, the palette will attempt to execute a built-in `<command>` element on the main browser window with an `id` that matches the `key`.

### Adding a Dynamic Command Provider

For commands that change based on application state (e.g., a list of open tabs), you can add a dynamic provider. This is a function that gets called each time the palette is opened.

```javascript
// Example from another .uc.js file
if (window.ZenCommandPalette) {
  const generateMyDynamicCommands = async () => {
    // This function should return a Promise that resolves to an array of command objects.
    const items = getMyModItems(); // Get the current state
    return items.map(item => ({
      key: `my-mod:do-thing:${item.id}`,
      label: `Do Thing with ${item.name}`,
      command: () => doThingWith(item.id),
      tags: [item.name],
    }));
  };

  // The second argument is a preference key. If provided, the provider will only run
  // if that preference is set to true. If omitted, it will always run.
  window.ZenCommandPalette.addDynamicCommandsProvider(
    generateMyDynamicCommands,
    "my-mod.commands.enabled" // Example preference key
  );
}
```

## Project Status & Disclaimer

**This project is in a very early stage of development.**

While the core functionality is solid, the command list was originally adapted from another project and has been progressively tested and fixed.

If you encounter any bugs or commands that are not working, please first check if an issue already exists. If not, please report it here:

- **[https://github.com/BibekBhusal0/zen-custom-js/issues/19](https://github.com/BibekBhusal0/zen-custom-js/issues/19)**

## Credits and Acknowledgements

This project was heavily inspired by the work done on the **[ZBar-Zen](https://github.com/Darsh-A/ZBar-Zen)** command bar by **Darsh-A**. The initial comprehensive command list was adapted from that project, providing a fantastic foundation for this palette. The `clearTabs` function was also adapted from another one of her repositories, **[Ai-TabGroups-ZenBrowser](https://github.com/Darsh-A/Ai-TabGroups-ZenBrowser/blob/main/clear.uc.js)**. Thank you for your original creators I am just a copy-cat.