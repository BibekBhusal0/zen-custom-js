import { urlbarAI } from "./urlbar.uc.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import { PREFS } from "./utils/prefs.js"


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
});

