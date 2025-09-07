# Zen Command Palette

Zen Command Palette is a powerful, extensible command interface for Zen Browser, seamlessly integrated directly into the URL bar. Inspired by modern productivity tools like Raycast, it provides a fast and efficient way to control your browser with just a few keystrokes.

This project aims to be a modern and actively maintained alternative, building upon the ideas of existing modifications to create a more robust and user-friendly experience.

## Features

- **Seamless URL Bar Integration**: No new UI elements. The command palette appears naturally as you type in the address bar.
- **Exclusive Command Mode**: Start your query with a colon (`:`) to hide all other search suggestions and focus exclusively on commands.
- **Rich Command Display**: Each command is shown with a clear label and a relevant icon, similar to Raycast.
- **Extensible API**: Other user scripts and browser mods can easily add their own commands, making the palette a central hub for all your custom actions.
- **Comprehensive Command Set**: Comes with a wide range of built-in commands for managing tabs, windows, developer tools, and navigating browser features.

## Roadmap and Future Plans

This project is in active development with many features planned for the future:

- **Shortcut Key Display & Customization**:
  - Display associated keyboard shortcuts for commands directly in the results list.
  - Implement a settings panel (accessible via a command) to allow users to set and customize these shortcuts.
- **Smart Commands**:
  - Integrate a built-in calculator for performing quick math operations.
  - Add a currency converter for easy financial translations.
- **Expanded Browser Support**:
  - Once stable on Zen Browser, officially test and ensure compatibility with mainline Firefox and other popular forks.
- **UI/UX Enhancements**:
  - Continue to refine the appearance and responsiveness of the command results.
  - Explore options for theming and further visual customization.

## Browser Support

Currently, the Zen Command Palette is developed and tested exclusively for **Zen Browser**.

Support for other Firefox-based browsers is planned for a future release but is not currently a priority.

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
    condition: () => MyMod.isReady, // Optional, shows command only if true
  });
}
```

## Project Status & Disclaimer

**This project is in a very early stage of development.**

The entire list of commands has been directly adapted from the ZBar-Zen project. At this time, these commands have not been tested and are actively undergoing review.Users should expect that many commands may not function as intended or could cause errors.

Please feel free to open an issue to report any commands that are broken or working incorrectly.

## Credits and Acknowledgements

This project was heavily inspired by the work done on the **[ZBar-Zen](https://github.com/Darsh-A/ZBar-Zen)** command bar by **Darsh-A**. The comprehensive command list was copied from that project, providing a fantastic foundation for this palette. Thank you for your original contribution to the community.
