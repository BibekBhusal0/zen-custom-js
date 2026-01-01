# Code Assistant Context

This document provides context for the code assistant to understand the project structure, conventions, and goals.

## Project Overview

This is a collection of user scripts and CSS modifications for the [Zen Browser](https://zen-browser.app/), a Firefox-based browser. The project enhances the browsing experience with features like a command palette, AI integration in the findbar, and UI tweaks.

The project is structured as a monorepo, with each feature residing in its own directory. It uses Node.js and Rollup to bundle and manage the scripts.

### Key Technologies

*   **JavaScript (ESM)**: The core language for the user scripts.
*   **CSS**: For styling the custom UI elements.
*   **Rollup.js**: To bundle multiple script files into a single `.uc.js` file for each mod.
*   **Node.js/npm**: For managing dependencies and running build scripts.
*   **GitHub Actions**: For automating builds, formatting, and publishing.

## Building and Running

The project uses `npm` scripts for building and development.

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Build Scripts

*   **Build all mods**:
    ```bash
    npm run build
    ```
*   **Build a specific mod** (e.g., the command palette):
    ```bash
    npm run build:palette
    ```
*   **Development mode with auto-rebuild**:
    ```bash
    npm run dev
    ```
*   **Development mode for a specific mod**:
    ```bash
    npm run dev:palette
    ```

The bundled files are placed in the `dist/` directory.

## Development Conventions

### File Structure

Each mod is a self-contained unit within its own directory (e.g., `command-palette/`, `findbar-ai/`). A typical mod directory includes:

*   `index.js`: The main entry point for the script.
*   `style.css`: Styles for the mod.
*   `theme.json`: Metadata for the mod, including its name, version, and description. This file is also used to generate the UserScript header.
*   `preferences.json`: (Optional) Default settings for the mod.
*   `README.md`: Documentation for the mod.

### Code Style

*   **Formatting**: The project uses Prettier for automatic code formatting. A GitHub Action enforces this, so you don't need to worry about it during development.
*   **Modularity**: Code should be modular and split into multiple files where appropriate. Rollup handles the bundling.
*   **DRY (Don't Repeat Yourself)**: Avoid code duplication. Use utility functions for common tasks.
*   **Utility Functions**: Reusable functions are located in the `utils/` directory. The `parseElement` function in `utils/parse.js` is particularly useful for creating DOM elements from strings.

### Commits and Pull Requests

*   **Conventional Commits**: Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat(command-palette): add new feature`).
*   **Pull Requests**: Before submitting a pull request, ensure your changes have been tested and any relevant documentation has been updated.

### Publishing

The project uses GitHub Actions to automate the publishing of mods to separate repositories and the Sine Store. The workflow is triggered by changes to the `version` field in a mod's `theme.json` file.
