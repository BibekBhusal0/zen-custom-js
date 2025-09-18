<h1 align="center">Zen Command Palette</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

https://github.com/user-attachments/assets/999167fa-aa3e-417c-94b5-e40c12e1897e

**Zen Command Palette** is a powerful, extensible command interface for Zen Browser, seamlessly integrated directly into the URL bar. Inspired by the command palettes in modern productivity tools like **Arc Browser**, **Raycast**, and **Vivaldi**, it provides a fast and efficient way to control your browser with just a few keystrokes.

## 🌟 Features

- ⚡ **Feels Native**: Utilizes the browser's URL bar for a seamless experience.
- 🔍 **Fuzzy Search & Smart Sorting**: Effortlessly locate what you need with a robust fuzzy search feature.
- 🔄 **Dynamic Commands**: Automatically generates commands for your installed search engines, extensions, workspaces, folders, and internal `about:` pages.
- 🛠️ **Extensible API**: User scripts and browser modifications can easily add their own commands, making the palette a central hub for all your custom actions.
- 🎨 **Highly Customizable**: Offers customizable keyboard shortcuts, widgets, icons, dynamic commands, and more.

## ⚙️ Installation Guide

1. Install latest version of [Sine](https://github.com/CosmoCreeper/Sine) (if you haven't already).
2. Restart Zen Browser.
3. Open settings and go to the `Sine` tab.
4. Search for Zen Command Palette.
5. Click Install.
6. A toast for restart should appear — click on that to restart Zen.
7. Feel productive !

## 🎨 Customization & Preferences

The Zen Command Palette can be configured via its own settings. Simply type `: Command palette configure` in the command palette and you will see commands like `Command Palette: Configure Settings` run the command which will open settings Popup. Which will allow configuration like keyboard shortcut, icon, hiding commands and creating toolbar icon.

https://github.com/user-attachments/assets/bdd87f58-f6f7-480c-8ffe-1150d571f482

> [!Note]
> You can press delete/blackspace to remove the shortcut key. Changing shortcut key from menu this will not replace/remove existing shortcut keys they have to be done from Zen Settings.

Here are all Preferences which can be configured from `about:config` (also from settings UI)

| Preference Key                                         | Type    | Default                             | Description                                                                  |
| ------------------------------------------------------ | ------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `zen-command-palette.prefix-required`                  | Boolean | `false`                             | If `true`, commands only appear when the query starts with `:`.              |
| `zen-command-palette.debug-mode`                       | Boolean | `false`                             | Enables detailed logging in the Browser Console for troubleshooting.         |
| `zen-command-palette.max-commands`                     | Integer | `3`                                 | The maximum number of command results to display at once (without `:`).      |
| `zen-command-palette.max-commands-prefix`              | Integer | `50`                                | The maximum number of command results to display with the `:` prefix.        |
| `zen-command-palette.min-query-length`                 | Integer | `3`                                 | Minimum characters needed to show commands (unless using the `:` prefix).    |
| `zen-command-palette.min-score-threshold`              | Integer | `150`                               | The minimum fuzzy-search score required for a command to be shown.           |
| `zen-command-palette.dynamic.about-pages`              | Boolean | `false`                             | Automatically generate commands for `about:` pages.                          |
| `zen-command-palette.dynamic.search-engines`           | Boolean | `true`                              | Automatically generate commands for your installed search engines.           |
| `zen-command-palette.dynamic.extensions`               | Boolean | `false`                             | Automatically generate commands for extensions with an options page.         |
| `zen-command-palette.dynamic.extension-uninstall`      | Boolean | `false`                             | Automatically generate commands for uninstalling extension                   |
| `zen-command-palette.dynamic.extension-enable-disable` | Boolean | `false`                             | Automatically generate commands for enabling/disabling extensions.           |
| `zen-command-palette.dynamic.workspaces`               | Boolean | `true`                              | Automatically generate commands for switching/moving tabs to Workspaces.     |
| `zen-command-palette.dynamic.folders`                  | Boolean | `true`                              | Automatically generate commands for managing Folders.                        |
| `zen-command-palette.dynamic.sine-mods`                | Boolean | `true`                              | Automatically generate commands for uninstalling sine mods.                  |
| `zen-command-palette.dynamic.container-tabs`           | Boolean | `false`                             | Automatically generate commands for moving tabs between containers.          |
| `zen-command-palette.dynamic.active-tabs`              | Boolean | `false`                             | Automatically generate commands for switching between active tabs.           |
| `zen-command-palette.dynamic.unload-tab`               | Boolean | `false`                             | Automatically generate commands for unloading active tabs.                   |
| `zen-command-palette.settings-file-path`               | String  | `chrome/zen-commands-settings.json` | Path to the file storing user customizations (hidden commands, icons, etc.). |

## 📋 Available Commands

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
  - Rotate Split Orientation
  - Split Grid
  - Split Horizontal
  - Split Vertical
  - Swap Split Tabs
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
- Minimize Memory Usage
- Quit Browser
- Restart Browser
- Toggle Work Offline

### Command Palette

- Command Palette: Configure Commands
- Command Palette: Help
- Command Palette: Preferences

### Dynamic Commands

- **About Pages**: `Open about:[page-name]` (e.g., "Open about:config").
- **Search Engines**: `Search with: [Engine Name]` to change the default search engine for the next search.
- **Extension Options**: `Extension Options: [Addon Name]` to open the options page for an extension.
- **Container Tabs**: `Open Tab in: [Container Name]` to move the current tab to a different container.
- **Active Tabs**: `Switch to Tab: [Tab Title]` to quickly switch to any open tab, even across workspaces.
- **Unload Tabs**: `Unload Tab: [Tab Title]` to quickly unload tab (to save memory).
- **Workspaces**: `Switch to workspace: [Workspace Name]` and `Move Tab to Workspace: [Workspace Name]`.
- **Sine Mods**: `Uninstall Sine Mod: [Mod Name]`.
- **Folders**: `Delete Folder: [Folder Name]` and `Move Tab to Folder: [Folder Name]`.
- **Addons**: `Enable Extension: [Addon Name]`, `Disable Extension: [Addon Name]`, and `Uninstall Extension: [Addon Name]`.

</details>

## 🔧 Extensibility

Adding your own commands from other scripts is straightforward. The `ZenCommandPalette` object is exposed on the `window`, allowing you to use its API to add both static and dynamic commands. I encourage all mod creators to incorporate this into their own mods (especially ones with JS).

### Other mods which support Command Palette
- [Quick Tabs](https://github.com/Darsh-A/Quick-Tabs/) 

### Adding a Static Command

Static commands are added once and are always available, unless their `condition` evaluates to false.

```javascript
// Example from another .uc.js file
if (window.ZenCommandPalette) {
  window.ZenCommandPalette.addCommand({
    key: "open-reddit",
    label: "Open Reddit",
    command: () => {
      // Your mod's reload logic here. This function is executed when the command is selected.
      // It can be synchronous or asynchronous
      openTrustedLinkIn("https://reddit.com", "tab");
    },
    icon: "https://www.redditstatic.com/shreddit/assets/favicon/64x64.png", // Optional: URL to an icon.
    tags: ["reddit", "memes", "social"], // Optional: Extra keywords for fuzzy search.
    condition: () => true, // Optional: A function that returns a boolean. The command only appears if it returns true.
  });
}
```

If you omit the `command` function, the palette will attempt to execute a built-in `<command>` element on the main browser window with an `id` that matches the `key`.

### Adding a Dynamic Command Provider

For commands that change based on application state (e.g., a list of open tabs), you can add a dynamic provider. This is a function that gets called when the palette is opened for the first time. The results are cached for performance and the cache is cleared when the URL bar is closed.

```javascript
// Example from another .uc.js file
if (window.ZenCommandPalette) {
  const generateMyDynamicCommands = async () => {
    // This function should return a Promise that resolves to an array of command objects.
    const items = getMyModItems(); // Get the current state
    return items.map((item) => ({
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

## ❓ FAQ

I am not making up the questions. I have been asked these questions in reddit and discord muliple times.

<details>
<summary><h3>Why did I made a mod, not contribute to the browser</h3></summary>
I tried building the browser multiple times, but I don't have proper resources to do it.
</details>

<details>
<summary><h3>Will this feature be natively available in Zen browser.</h3></summary>
Depends on how zen team prioritize things. I know that this is in their roadmap, so one day it will be available. I will maintain this project until command palette is natively supported in Zen.

This project has gotten enough attention that creator of zen has contacted me. Some functions from this project are used in Zen Browser which might mean command palette will be available sooner than we think. I am absolutely grateful to be contributor of Zen Browser and would love to help any way I can to make Zen a better Browser.

UPDATE: it is now available in beta version but it has limited number of commands whereas my project has 100 commands.

</details>

## 🙏 Credits and Acknowledgements

Thanks to [12th-devs](https://github.com/12th-devs/) and [CompTechGuy](https://github.com/Comp-Tech-Guy) for finding out issues and recommending new features.

Special thanks to [ferrocyante](https://github.com/ferrocyante) that I don't have to go through pain of writing CSS.

Special thanks to [Darsh-A](https://github.com/Darsh-A/) entire command list is adapted from her project **[ZBar-Zen](https://github.com/Darsh-A/ZBar-Zen)**. This will not have been possible without command list from [Darsh-A](https://github.com/Darsh-A/).

## 📜 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
