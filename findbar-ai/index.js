import { urlbarAI } from "./urlbar.uc.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import { PREFS } from "./utils/prefs.js";
import { startupFinish } from "../utils/startup-finish.js";
import { SettingsModal } from "./settings.js";
import { addPrefListener } from "../utils/pref.js";
import { registerShortcut } from "../utils/keyboard.js";

function setupCommandPaletteIntegration(retryCount = 0) {
  if (window.ZenCommandPalette) {
    PREFS.debugLog("Integrating with Zen Command Palette...");

    window.ZenCommandPalette.addCommands([
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
        command: () => SettingsModal.show(),
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
    ]);

    PREFS.debugLog("Zen Command Palette integration successful.");
  } else {
    PREFS.debugLog("Zen Command Palette not found, retrying in 1000ms");
    if (retryCount < 10) {
      setTimeout(() => setupCommandPaletteIntegration(retryCount + 1), 1000);
    } else {
      PREFS.debugError("Could not integrate with Zen Command Palette after 10 retries.");
    }
  }
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
}

function setupShortcuts() {
  registerFindbarShortcut();
  registerUrlBarShortcut();
  addPrefListener(PREFS.SHORTCUT_URLBAR, (val) => registerUrlBarShortcut(val.value));
  addPrefListener(PREFS.SHORTCUT_FINDBAR, (val) => registerFindbarShortcut(val.value));
}

function init() {
  // Init findbar-AI
  browseBotFindbar.init();
  addPrefListener(PREFS.ENABLED, (val) =>{
    browseBotFindbar.handleEnabledChange(val);
    registerFindbarShortcut()
  });
  window.browseBotFindbar = browseBotFindbar;

  // Init URL bar-AI
  urlbarAI.init();
  addPrefListener(PREFS.URLBAR_AI_ENABLED, (val) =>{
    urlbarAI.handlePrefChange()
    registerUrlBarShortcut(val)
  });

  setupShortcuts();
  setupCommandPaletteIntegration();
}

startupFinish(init);
