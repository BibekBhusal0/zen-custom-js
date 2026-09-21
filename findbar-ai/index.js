import { urlbarAI } from "./urlbar.uc.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import { browseBotLibrary, initBrowseBotLibrary } from "./library.uc.js";
import { PREFS } from "./utils/prefs.js";
import { startupFinish } from "../utils/startup-finish.js";
import { SettingsModal } from "./settings.js";
import { addPrefListener } from "../utils/pref.js";
import { initShortcutRegistry, registerShortcut } from "../utils/keyboard.js";
import { addCommands } from "../utils/command-palete.js";
import { ensureApiKeysLoaded } from "./utils/secure.js";

function setupCommandPaletteIntegration() {
  addCommands([
    {
      key: "browsebot:summarize",
      label: "Summarize Page",
      command: () => {
        browseBotFindbar.expanded = true;
        browseBotFindbar.sendMessage(PREFS.contextMenuCommandNoSelection);
        browseBotFindbar.focusPrompt();
      },
      condition: () => PREFS.enabled,
      icon: "chrome://global/skin/icons/highlights.svg",
      tags: ["AI", "Summarize", "BrowseBot", "findbar"],
    },
    {
      key: "browsebot:settings",
      label: "Open BrowseBot Settings",
      command: () => SettingsModal.toggle(),
      icon: "chrome://global/skin/icons/settings.svg",
      tags: ["AI", "BrowseBot", "Settings"],
    },
    {
      key: "browsebot:urlbarAi",
      label: "Toggle URL bar AI mode",
      command: () => urlbarAI.toggleAIMode(),
      condition: () => urlbarAI.enabled,
      icon: "chrome://global/skin/icons/highlights.svg",
      tags: ["AI", "BrowseBot", "URL", "Command"],
    },
    {
      key: "browsebot:expand-findbar",
      label: "Expand findbar AI",
      command: () => (browseBotFindbar.expanded = true),
      condition: () => PREFS.enabled,
      icon: "chrome://global/skin/icons/highlights.svg",
      tags: ["AI", "BrowseBot", "findbar"],
    },
    {
      key: "browsebot:open-library",
      label: "Open BrowseBot Library",
      command: () => browseBotLibrary.open(),
      condition: () => PREFS.libraryEnabled,
      icon: "chrome://global/skin/icons/highlights.svg",
      tags: ["AI", "BrowseBot", "Library"],
    },
  ]);
}

function registerUrlBarShortcut(value = PREFS.shortcutUrlbar) {
  if (!urlbarAI.enabled) return;
  registerShortcut(value, "toggle-url-bar-ai", () => {
    urlbarAI.toggleAIMode();
  });
}
function registerFindbarShortcut(value = PREFS.shortcutFindbar) {
  if (!browseBotFindbar.enabled) return;
  registerShortcut(value, "toggle-findbar-ai-bar", () => {
    browseBotFindbar.expanded = !browseBotFindbar.expanded;
  });
  initShortcutRegistry();
}

function setupShortcuts() {
  registerFindbarShortcut();
  registerUrlBarShortcut();
  addPrefListener(PREFS.SHORTCUT_URLBAR, (val) => registerUrlBarShortcut(val.value));
  addPrefListener(PREFS.SHORTCUT_FINDBAR, (val) => registerFindbarShortcut(val.value));
}

async function init() {
  // Decrypt cached API keys and migrate any legacy plaintext keys to
  // OSKeyStore encryption before the UI reads them.
  try {
    await ensureApiKeysLoaded();
  } catch (e) {
    PREFS.debugError("Could not load encrypted API keys:", e);
  }
  // Init findbar-AI
  browseBotFindbar.init();
  addPrefListener(PREFS.ENABLED, (val) => {
    browseBotFindbar.handleEnabledChange(val);
    registerFindbarShortcut();
  });
  window.browseBotFindbar = browseBotFindbar;

  // Init URL bar-AI
  urlbarAI.init();
  addPrefListener(PREFS.URLBAR_AI_ENABLED, (val) => {
    urlbarAI.handlePrefChange();
    registerUrlBarShortcut(val);
  });

  // Init Library AI (no-op on Zen builds without the Library feature).
  // Its shortcut is a direct keydown listener (see library.uc.js), not the
  // shared registry, so it works like the native library shortcuts.
  initBrowseBotLibrary();

  setupShortcuts();
  setupCommandPaletteIntegration();
}

startupFinish(init);
