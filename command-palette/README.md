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
- ⌨️ **Custom Commands**: Make your own commands with custom JS or chaining other commands.

## ⚙️ Installation Guide

1. Install latest version of [Sine](https://github.com/CosmoCreeper/Sine) (if you haven't already).
2. Restart Zen Browser.
3. Open settings and go to the `Sine` tab.
4. Search for Zen Command Palette.
5. Click Install.
6. A toast for restart should appear — click on that to restart Zen.
7. Feel productive !

## 🎨 Customization & Preferences

The Zen Command Palette can be configured via its own settings. Simply type `: Command palette configure` in the command palette and you will see commands like `Command Palette: Configure Settings` run the command which will open settings Popup. Which will allow adding more commands and configuration like keyboard shortcut, icon, hiding commands, creating toolbar icon.

### Creating Toolbar icons

https://github.com/user-attachments/assets/bdd87f58-f6f7-480c-8ffe-1150d571f482

> [!Note]
> In current version it don't need restart to get the toolbar icon.

### Making custom commands

https://github.com/user-attachments/assets/71dae23a-bb0c-4a04-add6-450d344751a0

> [!Note]
> Custom commands and shortcut keys are stored in JSON file here is [this](../zen-commands-settings.json) is my custom commands and shortcut keys.

> [!Note]
> You can press delete/blackspace to remove the shortcut key. Changing shortcut key from menu this will not replace/remove existing shortcut keys they have to be done from Zen Settings.

Here are all Preferences which can be configured from `about:config` (also from settings UI)

| Preference Key                                         | Type    | Default                             | Description                                                                  |
| ------------------------------------------------------ | ------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `zen-command-palette.prefix`                           | string  | `:`                                 | Prefix after entering which commands will appear                             |
| `zen-command-palette.prefix-required`                  | Boolean | `false`                             | If `true`, commands only appear when the query starts with Preifx.           |
| `zen-command-palette.debug-mode`                       | Boolean | `false`                             | Enables detailed logging in the Browser Console for troubleshooting.         |
| `zen-command-palette.max-commands`                     | Integer | `3`                                 | The maximum number of command results to display at once (without prefix).   |
| `zen-command-palette.max-commands-prefix`              | Integer | `50`                                | The maximum number of command results to display with the prefix.            |
| `zen-command-palette.min-query-length`                 | Integer | `3`                                 | Minimum characters needed to show commands (unless using the prefix).        |
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

> [!Note]
> Some commands have been removed due to multiple reasons you can full list of those command in this [file](./removed_commands.js).

### Native Commands

Some commands that were previously part of this mod are now natively available in Zen Browser. To avoid duplication, they have been removed from the default command list. They can be modified/hidden from settings.

The following commands are now native:

- Pin/Unpin/Next/Previous/Close Tab
- Add/Remove from Essentials
- New/Next/Previous Workspace
- Reload/Hard Reload
- New / Private Window
- And More ...

### Zen Browser Features

- **Compact Mode**:
  - Toggle Floating Sidebar
  - Toggle Floating Toolbar
  - Toggle Sidebar
  - Toggle Toolbar
- **Workspaces**:
  - Create New Workspace
  - Change Workspace Name
  - Change Workspace Icon
  - Delete Workspace
  - Reorder Workspaces
- **Split View**:
  - Unsplit View
  - Swap Split Tabs
  - Rotate Split Orientation
- **Glance**:
  - Close Glance
  - Expand Glance
  - Split Glance
- **Folders**:
  - Remove Tab from Folder
  - Rename Current Folder
- **Other**:
  - Toggle Sidebar Width
  - Copy Current URL as Markdown
  - Toggle Single toolbar mode

### Tab Management

- New Tab
- Duplicate Tab
- Rename Tab
- Move Tab Up
- Move Tab Down
- Move Tab to New Window
- Toggle Mute Tab
- Show All Tabs Panel
- Reopen Closed Tab
- Unload Tab
- Unload other tabs
- Replace Pinned Tab URL with Current
- Reset Pinned Tab

### Window Management

- Close Window
- Minimize Window
- Maximize Window
- Reopen Closed Window

### Navigation & History

- Go Back
- Go Forward
- Home
- Search History
- Show All History (Library)

### Bookmarks

- Bookmark This Page
- Bookmark All Tabs
- Toggle Bookmark Bar
- Search Bookmarks
- Show All Bookmarks (Library)

### Find & Search

- Find Next
- Find Previous
- Translate Page

### View & Display

- Toggle Fullscreen
- Toggle Reader Mode
- Zoom In
- Zoom Out
- Reset Zoom
- View Page Source
- View Page Info

### Developer Tools

- Toggle web toolbox
- Open Browser Toolbox
- Open Browser Console
- Toggle Responsive Design Mode
- Open web inspector
- Open web console

### Media & Files

- Toggle Picture-in-Picture
- View Downloads
- Save Page As...
- Print Page
- Open File

### System & Application

- Clear Recent History...
- Customize Toolbar...
- Quit Browser
- Restart Browser
- Clear Startup Cache
- Minimize Memory Usage
- Create New Profile

### Command Palette

- Command Palette: Configure Commands
- Command Palette: Preferences
- Command Palette: Help
- Command Palette: Custom Commands

### Tidy Tabs

- Clear Other Tabs
- Sort Tabs

### Advanced Tab Groups

- Collapse all groups
- Expand all groups

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

- [Advanced Tab Groups](https://github.com/12th-devs/Advanced-Tab-Groups)
- [AI Tab Groups](https://github.com/Darsh-A/Ai-TabGroups-ZenBrowser/)
- [Quick Tabs](https://github.com/Darsh-A/Quick-Tabs/)
- [Reopen Closed Tabs Menu](https://github.com/Vertex-Mods/Reopen-Closed-Tabs-Menu)
- [Browse Bot](https://github.com/BibekBhusal0/zen-custom-js/tree/dev/findbar-ai)

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
<summary><h3>What is difference between this and native zen command bar (released recently)</h3></summary>
Zen command bar don't contain too much commands to optimize for performance, this mod contain 100+ static commands. And on top of it, this provides API making easy for user to add more commands. Already 4 other mods (1 unreleased version) support the command palette.

Another Benifit of this mod, is that this allows setting custom keymaps to commands, and allow adding them as toolbar icons.

</details>

## 🙏 Credits and Acknowledgements

This mod is released through [Vertex Mods](https://github.com/Vertex-Mods/), and I, [Bibek Bhusal](https://github.com/BibekBhusal0), am the creator of this mod.

Thanks to [12th-devs](https://github.com/12th-devs/) and [CompTechGuy](https://github.com/Comp-Tech-Guy) for finding out issues and recommending new features.

Thanks to [Bliwi](https://github.com/Bliwi) for adding commands for Advanced Tab Groups.

Special thanks to [ferrocyante](https://github.com/ferrocyante) that I don't have to go through pain of writing CSS.

Special thanks to [Darsh-A](https://github.com/Darsh-A/) entire command list is adapted from her project **[ZBar-Zen](https://github.com/Darsh-A/ZBar-Zen)**. This will not have been possible without command list from [Darsh-A](https://github.com/Darsh-A/).

## 📜 License

This is licensed under MIT license. Check [License](../LICENSE) for more details.
