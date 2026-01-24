<h1 align="center">Zen Browser UserScripts</h1>
<div align="center">
    <a href="https://zen-browser.app/">
        <img width="240" alt="zen-badge-dark" src="https://raw.githubusercontent.com/heyitszenithyt/zen-browser-badges/fb14dcd72694b7176d141c774629df76af87514e/light/zen-badge-light.png" />
    </a>
</div>

Personal customization userscripts and css files for enhancing browsing experience in Zen Browser.

## 🌟 Mods

### [Zen Command Palette](/command-palette)

Advanced command interface in browser built in URL bar.

https://github.com/user-attachments/assets/999167fa-aa3e-417c-94b5-e40c12e1897e

### [Findbar AI/BrowseBot](/findbar-ai)

Advanced AI functionality inside browser builtin findbar and URL bar.

https://github.com/user-attachments/assets/258d2643-6135-4b2b-accc-c1d59f3f76fc

### [Reopen Closed Tabs Menu](reopen-closed-tabs)

Menu to search through recently closed tabs (and active tabs too).

https://github.com/user-attachments/assets/be2880c6-21e5-42ce-b8ed-ed45dc1942ad

### [Keyboard Shortcuts Search](/settings-shortcuts-search)

Dynamic search and filter for browser settings shortcuts.

https://github.com/user-attachments/assets/01b14b7b-04a7-49d8-a719-83ad7fc8c603

### [Search Engine Select](/search-engine-select)

Quick search engine switching with advanced interaction modes.

https://github.com/user-attachments/assets/52a6b810-77ee-4a04-b239-8d59e01478ef

### [Floating Sidebar](/floating-sidebar)

Make sidebar floating also option to keep it in left or right.

https://github.com/user-attachments/assets/40e66251-236d-4766-a53d-dd22ecaa455e

## Compatibility

- Zen Browser (Primary Target)
- Might or might not work on other Firefox based browser

## ⚙️ Installation

### Easy Install via Sine (Recommended)

All scripts are also available through [Sine](https://github.com/CosmoCreeper/Sine).

If you want to install everything(all mods in this reop + some extra scripts) you can paste the repo link:

```md
https://github.com/BibekBhusal0/zen-custom-js
```

### Manual Install (`fx-autoconfig`)

For advanced users or those not using Sine or who are willing to contribute:

1.  **Setup `fx-autoconfig`**: If you haven't already, follow the setup instructions at [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

2.  **Clone this Repository**: Open a terminal, navigate to the `JS` directory created by `fx-autoconfig` inside your profile folder:

    ```bash
    cd /path/to/your/profile/chrome/JS
    git clone https://github.com/BibekBhusal0/zen-custom-js
    ```

3.  **Import the Script**: In your JS directory, create a new file `import.uc.mjs` , and import scripts you need. Here is example import file importing each script [import.uc.mjs](./import.uc.mjs).

4.  **Import the Styles**: In your `userChrome.css` file, import the styles of related script. Here is example userChrome file importing all styles [userChrome.css](./userChrome.css).

5.  **Restart Zen Browser**: Restart the browser for all changes to take effect. You might need to clear the startup cache from `about:support`.

## 🤝 Contribution

Whether you have ideas, design changes or even major code changes, help is always welcome. Mods gets better and better with each contribution, no matter how big or small!

If you'd like to get involved, see [CONTRIBUTING.md](./CONTRIBUTING.md) for the code structure, guidelines and best practices.

## 📜 License

This is licensed under MIT license. Check [License](LICENSE) for more details.
