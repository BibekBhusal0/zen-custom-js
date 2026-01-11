# Mod Publishing Workflow

This repository uses a GitHub Actions workflow to automate the publishing of mods to individual repositories in the [Vertex-Mods](https://github.com/Vertex-Mods) organization and to the Sine Store.

## Overview

The workflow (`.github/workflows/publish-mods.yml`) runs a Node.js script (`.github/scripts/publish.js`) that detects changes in mod versions and performs the following actions:

1.  **Builds** the mod (if it involves JavaScript).
2.  **Publishes** the mod to its dedicated repository under `Vertex-Mods`.
3.  **Creates a GitHub Release** in the dedicated repository (if release notes are provided).
4.  **Submits a Pull Request** to the Sine Store (for stable releases).

## How to Publish a Mod

To publish a new version of a mod:

1.  **Update `theme.json`**:
    - Increment the `"version"` field in the mod's `theme.json` file.
    - **Stable Release**: Use a standard version number (e.g., `"1.0.0"`).
    - **Beta Release**: Append `b` to the version number (e.g., `"1.0.0b"`).

2.  **Add Release Notes (Optional)**:
    - Edit the `release-notes.md` file in the mod's directory.
    - Add your release notes.
    - If this file exists and contains content, a GitHub Release will be created in the child repository.
    - After publishing, the workflow will automatically clear this file in the main repository.

3.  **Commit and Push**:
    - Commit your changes.
    - Push to the `main` branch.

4.  **Trigger the Workflow**:
    - Go to the **Actions** tab in the GitHub repository.
    - Select **Publish Mods**.
    - Click **Run workflow**.

## Configuration Options (`theme.json`)

The workflow respects the following keys in `theme.json`:

- **`"vertex": false`**: Skips the mod entirely. It will not be processed or published.
- **`"js": false`**: Skips the JavaScript build process. Useful for CSS-only mods. The mod will still be published, but no bundled JS files will be generated.
- **`"id"`**: Used to determine the build target and output filenames.
- **`"name"`**: Used to determine the child repository name (slugified).

## Beta vs. Stable Releases

- **Beta (`vX.Y.Zb`)**:
  - Published to the `beta` branch of the child repository.
  - JavaScript files are linked via raw GitHub URLs in `theme.json`.
  - A warning banner is added to `README.md`.
  - **No** Pull Request is created for the Sine Store.

- **Stable (`vX.Y.Z`)**:
  - Published to the `main` branch of the child repository.
  - JavaScript files are set to `true` in `theme.json` (implying local/bundled files).
  - A Pull Request is automatically created in the Sine Store repository to update the mod.

## BrowsBot Special Handling

The **BrowseBot** mod (`browse-bot`) has specific build logic:

- **Beta**: Builds a single bundled file (`browse-bot-all.uc.js`).
- **Stable**: Builds two separate files (`browse-bot.uc.js` and `vercel-ai-sdk.uc.js`).

## Sine Store Integration

For stable releases (and where `"js"` is not false), the workflow checks the configured Sine Store repository (`sineorg/store`).

- It creates a new branch `update-{mod-id}-{version}`.
- It copies the bundled scripts to the `mods/{mod-id}/` folder.
- It creates a Pull Request with the update details.

## Troubleshooting

- **Workflow Fails**: Check the Action logs. Common issues include missing secrets (`PAT_TOKEN`), build errors, or git conflicts.
- **Repo Creation Failed**: Ensure the `PAT_TOKEN` has `repo` and `delete_repo` (optional) permissions and the user has access to the `Vertex-Mods` organization.
- **No Changes Detected**: Ensure you incremented the version in `theme.json`. The workflow compares the current version with the version in the previous commit.
