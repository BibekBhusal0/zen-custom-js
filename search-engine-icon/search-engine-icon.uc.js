import { googleFaviconAPI } from "../utils/favicon.js";
import { startupFinish } from "../utils/startup-finish.js";

let currentEngine = null;

async function updateFavicon() {
  const component = document.getElementById("urlbar-search-mode-indicator-title");
  if (!component) return false;
  const engineName = component.innerText;
  if (engineName === currentEngine) return false;
  currentEngine = engineName;
  const engine = await Services.search.getEngineByName(engineName);
  if (!engine) return false;
  const submissionUrl = engine.getSubmission("test_query").uri.spec;
  if (!submissionUrl) return false;
  const faviconURL = googleFaviconAPI(submissionUrl);
  const fallback = "chrome://branding/content/icon32.png";

  const setImage = (url) => {
    component.style.backgroundImage = `url('${url}')`;
    component.style.backgroundRepeat = "no-repeat";
    component.style.backgroundSize = "16px 16px";
    component.style.paddingLeft = "18px";
    component.style.backgroundPosition = "left center";
  };

  try {
    const img = new Image();
    img.onload = () => setImage(faviconURL);
    img.onerror = () => setImage(fallback);
    img.src = faviconURL;
  } catch (e) {
    setImage(fallback);
  }
  return true;
}

function observeSearchModeIndicator() {
  const component = document.getElementById("urlbar-search-mode-indicator-title");
  if (!component) return;

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "characterData" || mutation.type === "childList") {
        updateFavicon();
      }
    });
  });

  observer.observe(component, {
    subtree: true,
    characterData: true,
    childList: true,
  });
}

startupFinish(observeSearchModeIndicator);
