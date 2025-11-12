# Contributing

If you'd like to contribute, you can get started by reading this guide, where I will explain file structure and standards for the contribution. Thank you for considering a contribution!

## About This Project

This GitHub repo contains multiple mods made specifically for Zen Browser, which I made to solve specific problems I had or to enhance my browsing experience.

## Getting Started

### Prerequisites

- **Setup `fx-autoconfig`**: Follow the setup instructions at [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) (if you are using sine it is already installed).
- **Node.js & npm**: Only required if contributing to BrowseBot (for AI dependencies)

### Installation & Setup

1. Fork the repository on GitHub

2. Clone your fork locally inside the `js` folder of your profile:

   ```bash
   cd /path/to/your/profile/chrome/JS
   git clone https://github.com/your-username/zen-custom-js
   cd zen-custom-js
   ```

3. Install dependencies (only required if you are contributing to BrowseBot):

   ```bash
   npm install
   ```

4. **Import the Script**: In your JS directory, create a new file `import.uc.mjs` and import the scripts you need. See [import.uc.mjs](./import.uc.mjs) for an example importing each script.

5. **Import the Styles**: In your `userChrome.css` file, import the styles of the related script. See [userChrome.css](./userChrome.css) for an example importing all styles.

6. **Restart Zen Browser**: Restart the browser for all changes to take effect. You might need to clear the startup cache from `about:support`.

7. Create a new branch for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```

### File Structure

```
.
├── command-palette/
│   ├── README.md
│   ├── style.css
│   ├── preferences.json
│   ├── index.js
│   ├── theme.json
│   └── utils/
│       └── prefs.js
├── floating-sidebar/
│   ├── README.md
│   ├── index.js
│   ├── style.css
│   └── theme.json
├── utils/
│   ├── parse.js
│   └── favicon.js
├── dist/
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

Each mod is in its own directory. Some important files each mod contains are:

- **`README.md`**: Documentation for the mod
- **`style.css`**: Styles for the mod
- **`index.js`**: JavaScript for the mod (it is important to name this file `index.js` for bundling)
- **`theme.json`**: Metadata for Sine installation and fx-autoconfig header generation (see [fx-autoconfig documentation](https://github.com/MrOtherGuy/fx-autoconfig/tree/master?tab=readme-ov-file#script-scope))
- **`preferences.json`** (optional): Settings to adjust prefs for the mod (see [Sine preferences documentation](https://github.com/CosmoCreeper/Sine/wiki/Preferences))

> [!NOTE]
> If you define functions that could be potentially useful for other mods, they should be placed in the root `utils/` folder. This folder contains important functions used across multiple mods.

### When Contributing

- Keep mod-specific changes within that mod's directory
- Update the mod's README.md if you're adding new features or including new prefs
- Keep files focused and under 1.5k lines when possible

## Development Guidelines

### Code Practices

These are code practices I like to follow. I hope you can follow similar practices in your contributions as well:

#### DRY (Don't Repeat Yourself)

I hate having to write the same code multiple times (unless it's done to get LSP autocomplete). If code is being repeated, the task can be done better with loops or by defining a utility function. This makes code much easier to maintain and fix.

#### Modular Code

I like code to be modular and split into multiple files. Each file should be no more than 1,500 lines. Since Sine doesn't allow installing JS with multiple folders and imports, Rollup is used to bundle the files together.

#### Code Organization

- **Keep files focused**: Each file should have a single, clear responsibility
- **File size limit**: Avoid files longer than 1.5k lines. If a file grows too large, consider splitting it into smaller, logical modules
- **No rewrites**: Unless absolutely necessary, avoid rewriting existing working code. Focus on incremental improvements and fixes

### Formatting

I know formatting is important, but while writing code I want to focus on the logic rather than indentation or quote styles. This repo contains a workflow script that automatically formats code when pushed to GitHub.

**You don't need to worry about formatting!** Just write your code and let the automation handle it. Focus on functionality and readability rather than manual formatting.

If you are using Prettier, this repo also contains a [.prettierrc.json](./.prettierrc.json) file, so if you're using the Prettier extension for your IDE it should also format code properly as you work.


>[!Note]
> These are best practices I like to follow which are not strictly required but are highly recommended.

### Automation

I like to automate things whenever possible. This repo contains automation scripts for:

- **Code formatting**: Automatically formats code when pushed to GitHub
- **Timestamp updates**: Updates the `updatedAt` attribute in `theme.json` files when pushed
- **Header generation**: The fx-autoconfig header is generated based on `theme.json` (see [rollup.config.js](./rollup.config.js) for details)

### Build Scripts

Available npm scripts for development:

```bash
# Build all mods
npm run build

# Build specific mod
npm run build:browsebot
npm run build:palette
npm run build:reopen
npm run build:sidebar
npm run build:select
npm run build:search

# Development mode with watch (auto-rebuild on changes)
npm run dev                # Watch all mods
npm run dev:browsebot      # Watch specific mod
npm run dev:palette
npm run dev:reopen
npm run dev:sidebar
npm run dev:select
npm run dev:search

# Format code manually
npm run format
```

### Utility Functions You Should Be Using

#### `parseElement`

This utility makes DOM creation more readable. Instead of the verbose default approach:

```javascript
const button = document.createElement("button");
button.className = "your-class";
button.id = "your-id";
button.setAttribute("data-attribute", "your-attribute");
button.textContent = "Click Me";
```

Use `parseElement` for cleaner, more maintainable code:

```javascript
import { parseElement } from "../utils/parse.js";

const button = parseElement(
  `<button class="your-class" id="your-id" data-attribute="your-attribute">
    Click Me
  </button>`
);
```

## Opening a Pull Request

Pull request and commit names generally follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary):

```
<type>(<optional scope>): <present tense description>

feat(command-palette): add cool new feature
fix(search-engine-select): resolve memory leak issue
docs: add installation instructions
```

### Commit Types

- **`feat`**: A new feature
- **`fix`**: A bug fix
- **`docs`**: Documentation changes
- **`refactor`**: Code refactoring without changing functionality
- **`chore`**: Maintenance tasks, dependency updates, etc.

The scope is typically the mod that was changed. You can omit the scope if multiple mods or root-level files are substantially changed.

### PR Checklist

Before submitting your pull request:

- [ ] Test your changes thoroughly (more closely if it's vibecoded!)
- [ ] Update relevant documentation
- [ ] Follow the file size guidelines (under 1.5k lines per file)
- [ ] Use descriptive commit messages
- [ ] Don't worry about formatting (it's automated!)

Please be nice when discussing things in pull requests! 💙

## Questions or Issues?

If you have questions or run into issues:

- Open an issue for bugs or feature requests (issue templates available)
- Check existing issues to see if your question has been answered
- Feel free to ask for clarification in your PR

>[!Note]
> If mod is in beta version or is unreleased issues and bugs are expected,and docs might not be up-to-date you don't need to open issus for it.

## License

By contributing, you agree that your contributions will be licensed under the MIT license as the project (see [LICENSE](LICENSE) for more details).
