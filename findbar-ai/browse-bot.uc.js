import { urlbarAI } from "./urlbar.uc.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import { PREFS, debugLog, debugError } from "./utils/prefs.js"
import { SettingsModal } from "./settings.js";

function setupCommandPaletteIntegration(retryCount = 0) {
  if (window.ZenCommandPalette) {
    debugLog('Integrating with Zen Command Palette...');

    window.ZenCommandPalette.addCommands([
      {
        key: "browsebot:summarize",
        label: "Summarize Page",
        command: () => {
          browseBotFindbar.expanded = true
          browseBotFindbar.sendMessage("Summarize the current page")
          browseBotFindbar.focusPrompt()
        },
        icon: "chrome://global/skin/icons/highlights.svg",
        tags: ["AI", "Summarize", "BrowseBot", ]
      },
      {
        key: "browsebot:settings",
        label: "Open BrowseBot Settings",
        command: () => SettingsModal.show(),
        icon: "chrome://global/skin/icons/settings.svg",
        tags: ["AI", "BrowseBot", "Settings", ]
      },
    ]);

    debugLog('Zen Command Palette integration successful.');
  } else {
    debugLog('Zen Command Palette not found, retrying in 1000ms');
    if (retryCount < 10) {
      setTimeout(() => setupCommandPaletteIntegration(retryCount + 1), 1000);
    } else {
      debugError('Could not integrate with Zen Command Palette after 10 retries.');
    }
  }
}

UC_API.Runtime.startupFinished().then(() => {
  // Init findbar-AI 
  browseBotFindbar.init();
  UC_API.Prefs.addListener(
    PREFS.ENABLED,
    browseBotFindbar.handleEnabledChange.bind(browseBotFindbar)
  );
  window.browseBotFindbar = browseBotFindbar;

  // Init URL bar-AI
  urlbarAI.init();
  urlbarAI._prefListener = UC_API.Prefs.addListener(
    PREFS.URLBAR_AI_ENABLED,
    urlbarAI.handlePrefChange.bind(urlbarAI)
  );

  setupCommandPaletteIntegration()
});
