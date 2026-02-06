# Contributing

If you'd like to contribute, you can get started by reading this guide, where I will explain file structure and standards for the contribution. Thank you for considering a contribution!

## About this Project

This GitHub repo contains multiple mods made specifically for Zen Browser, which I made to solve specific problems I had or to enhance my browsing experience.

## Opening an Issue

If you have questions or feature ideas or run into issues you can open an issue.

Before opening issue make sure to check all issues if similar issues has been created previously or not. If you are reporting bug or giving feature recommendation I suggest you use issues template.

> [!Note]
> If mod is in beta/unreleased version, issues, and bugs are expected, and docs might not be up-to-date. You don't need to open issues for it.

## Getting Started

### Prerequisites

- **Bun**: Install [Bun](https://bun.sh/).
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
   bun install
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
│   ├── release-notes.md
│   └── utils/
│       └── prefs.js
├── floating-sidebar/
│   ├── README.md
│   ├── index.js
│   ├── style.css
│   ├── theme.json
│   └── release-notes.md
├── utils/
│   ├── parse.js
│   └── favicon.js
├── templates/
│   ├── CONTRIBUTING.template.md
│   ├── config.template.yml
│   ├── pull_request_template.template.md
│   ├── close-pull-requests.template.yml
│   └── release-notes.template.md
├── .github/
│   ├── scripts/
│   │   └── publish.js
│   └── workflows/
│       ├── publish-mods.yml
│       └── format-code.yml
├── dist/
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

Each mod is in its own directory. Some important files each mod contains are:

- **`README.md`**: Documentation for the mod
- **`style.css`**: Styles for the mod
- **`index.js`**: JavaScript for the mod (it is important to name this file `index.js` for bundling)
- **`theme.json`**: Metadata for Sine installation. Fx-autoconfig header is also dynamically generated from this file (see [fx-autoconfig documentation](https://github.com/MrOtherGuy/fx-autoconfig/tree/master?tab=readme-ov-file#script-scope))
- **`preferences.json`** (optional): Settings to adjust prefs for the mod (see [Sine preferences documentation](https://github.com/CosmoCreeper/Sine/wiki/Preferences))
- **`release-notes.md`** (optional): Release notes for the next version. Used by automation to create GitHub releases

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

### Linting

This project uses ESLint to maintain code quality and catch common errors. A GitHub Actions workflow will automatically check for linting errors on every pull request.

It's a good practice to run the linter locally before submitting your changes:

```bash
npm run lint
```

This will help you find and fix issues before they are caught by the CI.

> [!Note]
> These are best practices I like to follow which are not strictly required but are highly recommended.

### Build Scripts

Available bun scripts for development:

```bash
# Build all mods
bun run build

# Build specific mod
bun run build:browsebot
bun run build:palette
bun run build:reopen
bun run build:sidebar
bun run build:select
bun run build:search

# Development mode with watch (auto-rebuild on changes)
bun run dev                    # Only watches browse-bot
bun run dev:browsebot            # Watch specific mod
bun run dev:palette
bun run dev:reopen
bun run dev:sidebar
bun run dev:select
bun run dev:search

# Other commands
bun run format                 # Format code with Prettier
bun run lint                   # Run ESLint
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

## Publishing

This repository uses GitHub Actions workflows to automate publishing and maintenance tasks.

### Automated Publishing Workflow

The publishing workflow automatically handles releasing mods to individual repositories when you update versions.

#### How It Works

1. **Version Detection**: The workflow monitors the `version` field in each mod's `theme.json` file
2. **Automatic Publishing**: When a version changes, the mod is automatically published to its individual repository under the `Vertex-Mods` organization
3. **Beta vs Stable Releases**:
   - Versions ending with `b` (e.g., `1.0.1b`) → published to `beta` branch
   - Standard versions (e.g., `1.0.1`) → published to `main` branch with release tag
4. **Release Notes**: If `release-notes.md` contains actual content (not just the template), a GitHub release is created automatically

#### Updating a Mod

To publish a new version:

1. **Update `theme.json`**: Increment the `version` field

```json
{
  "version": "1.0.1" // or "1.0.1b" for beta
}
```

2. **Add Release Notes** (optional): Edit `release-notes.md` in the mod folder

```markdown
# New Features

- Added feature X
- Improved feature Y

# Fixes

- Fixed bug Z

# Others

- Updated documentation

# Contributors

Thanks to @username for their contributions!
```

3. **Push to Main**: Commit and push your changes to the main branch

```bash
   git add .
   git commit -m "feat(mod-name): version 1.0.1"
   git push
```

4. **Manual Trigger**: You can also manually run the workflow from the Actions tab

#### What Gets Published

Each individual mod repository contains:

- Bundled JavaScript files (if `js` is not `false`)
- Filtered `theme.json` (only specific keys)
- `README.md` with updated links
- `CONTRIBUTING.md` generated from template
- `LICENSE` file
- `.github/` folder with:
  - Issue templates that redirect to main repo
  - PR template that warns contributors
  - Auto-close workflow for PRs

#### Special Configuration

In `theme.json`, you can use these flags:

- **`"js": false`**: Skip JavaScript bundling (CSS-only mods)
- **`"vertex": false`**: Skip automation entirely for this mod

### Other Automation

- **Code Formatting**: Automatically formats code on push using Prettier
- **Timestamp Updates**: Updates `updatedAt` in `theme.json` files
- **Header Generation**: Fx-autoconfig headers are generated from `theme.json` metadata

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

If you’re feeling a bit nerdy, feel free to use emojis in your commit messages! 🎉 This tool makes it easy: [Devmoji](https://github.com/folke/devmoji).

### PR Checklist

Before submitting your pull request:

- [ ] Test your changes thoroughly (more closely if it's vibecoded!)
- [ ] Update relevant documentation
- [ ] Use descriptive commit messages
- [ ] Don't worry about formatting (it's automated!)

Please be nice when discussing things in pull requests! 💙

## License

By contributing, you agree that your contributions will be licensed under the MIT license as the project (see [LICENSE](LICENSE) for more details).
