import { getSearchEngineFavicon } from "../utils/favicon.js";
import { startupFinish } from "../utils/startup-finish.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { PREFS } from "./utils/prefs.js";
import { addPrefListener } from "../utils/pref.js";

const SearchEngineSwitcher = {
  _container: null,
  _engineSelect: null,
  _engineOptions: null,
  _dragHandle: null,
  _engineCache: [],
  _currentSearchInfo: null,
  _isDragging: false,
  _startY: 0,
  _initialTop: 0,
  _boundListeners: {},
  _progressListener: null,

  async init() {
    if (!PREFS.enabled) {
      PREFS.debugLog("Initialization aborted: feature is disabled.");
      return;
    }
    PREFS.debugLog("Initializing...");
    await this.buildEngineRegexCache();
    this.createUI();
    this.attachEventListeners();
    this.updateSwitcherVisibility();
  },

  destroy() {
    this._container?.remove();
    this.removeEventListeners();
    this._container = null;
    this._engineSelect = null;
    this._engineOptions = null;
    this._dragHandle = null;
    PREFS.debugLog("Destroyed successfully.");
  },

  async buildEngineRegexCache() {
    PREFS.debugLog("Building engine regex cache...");
    this._engineCache = [];
    const engines = await Services.search.getVisibleEngines();
    const PLACEHOLDER = "SEARCH_TERM_PLACEHOLDER_E6A8D";

    for (const engine of engines) {
      try {
        const submission = engine.getSubmission(PLACEHOLDER);
        if (!submission) continue;

        let regexString = submission.uri.spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const placeholderRegex = PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regexString = regexString.replace(placeholderRegex, "([^&]*)");

        this._engineCache.push({
          engine,
          regex: new RegExp(`^${regexString}`),
        });
      } catch (e) {
        PREFS.debugError(`Failed to process engine ${engine.name}`, e);
      }
    }
  },

  matchUrl(url) {
    if (!url) return null;
    for (const item of this._engineCache) {
      const match = url.match(item.regex);
      if (match && match[1]) {
        try {
          const term = decodeURIComponent(match[1].replace(/\+/g, " "));
          PREFS.debugLog(`Matched: Engine='${item.engine.name}', Term='${term}'`);
          return { engine: item.engine, term };
        } catch {
          continue;
        }
      }
    }
    return null;
  },

  updateSwitcherVisibility() {
    const url = gBrowser.selectedBrowser.currentURI.spec;
    const newSearchInfo = this.matchUrl(url);

    if (newSearchInfo) {
      this._currentSearchInfo = newSearchInfo;
      this._show();
    }
  },

  _show() {
    if (!this._container) return;
    this._container.style.display = "flex";
    this.updateSelectedEngineDisplay();
    this.handleSplitOrGlance();
  },

  _hide() {
    if (!this._container) return;
    this._container.style.display = "none";
    if (this._engineOptions) {
      this._engineOptions.style.display = "none";
      this._container.classList.remove("options-visible");
    }
  },

  updateSelectedEngineDisplay() {
    if (!this._currentSearchInfo || !this._engineSelect) return;
    const { engine } = this._currentSearchInfo;
    const img = parseElement("<img>");
    img.src = getSearchEngineFavicon(engine);
    const nameSpan = parseElement(`<span>${escapeXmlAttribute(engine.name)}</span>`);
    this._engineSelect.replaceChildren(img, nameSpan);
  },

  handleEnabledChange(pref) {
    if (pref.value) this.init();
    else this.destroy();
  },

  handleTabSelect() {
    this._hide();
    this.updateSwitcherVisibility();
    this.handleSplitOrGlance();
    if (gBrowser.selectedTab?.hasAttribute("zen-glance-tab")) {
      setTimeout(() => this.updatePosition(), 500);
    }
  },

  onLocationChange(browser) {
    if (browser === gBrowser.selectedBrowser) {
      this.updateSwitcherVisibility();
    }
  },

  handleSplitOrGlance() {
    if (!this._container) return;

    const isVerticalSplit =
      window.gZenViewSplitter?.currentView >= 0 &&
      window.gZenViewSplitter._data[window.gZenViewSplitter.currentView]?.gridType === "vsep";

    const isGlance = gBrowser.selectedTab?.hasAttribute("zen-glance-tab");
    if (!isVerticalSplit && !isGlance) {
      this._container.style.removeProperty("--ses-pane-x");
      this._container.style.removeProperty("--ses-pane-width");
      this._container.classList.remove("in-split-view");
      return;
    }
    this.updatePosition()
    this._container.classList.add("in-split-view");
  },

  updatePosition () {
    const activeBrowser = gBrowser.selectedBrowser;
    if (!activeBrowser || !this._container) {
      this._container.style.removeProperty("--ses-pane-x");
      this._container.style.removeProperty("--ses-pane-width");
      return;
    }


    const rect = activeBrowser.getBoundingClientRect();
    this._container.style.setProperty("--ses-pane-x", `${rect.x}px`);
    this._container.style.setProperty("--ses-pane-width", `${rect.width}px`);
  },

  async handleURLBarKey(event) {
    if (event.key !== "Enter") return;

    let engine;
    const term = gURLBar.value.trim();
    if (!term) return;

    try {
      const engineName = document
        .getElementById("urlbar-search-mode-indicator-title")
        .innerText.trim();
      engine = await Services.search.getEngineByName(engineName);
    } catch {
      PREFS.debugLog("Search indicator not found. Using default engine.");
      engine = await Services.search.getDefault();
    }

    if (engine && term) {
      PREFS.debugLog(`URL bar search detected. Engine: ${engine.name}, Term: ${term}`);
      this._currentSearchInfo = { engine, term };
      this._show();
    }
  },

  async handleEngineClick(event, newEngine) {
    event.preventDefault();
    event.stopPropagation();

    if (newEngine.name === this._currentSearchInfo?.engine.name) {
      PREFS.debugLog(`Clicked on same engine ('${newEngine.name}'). Closing menu.`);
      this._engineOptions.style.display = "none";
      this._container.classList.remove("options-visible");
      return;
    }

    if (!this._currentSearchInfo?.term) return;

    const term = this._currentSearchInfo.term;
    const newUrl = newEngine.getSubmission(term).uri.spec;
    let actionTaken = false;

    if (event.button === 0 && event.ctrlKey && !event.altKey && !event.shiftKey) {
      PREFS.debugLog("Action: Split View");
      if (window.gZenViewSplitter) {
        const previousTab = gBrowser.selectedTab;
        await openTrustedLinkIn(newUrl, "tab");
        const currentTab = gBrowser.selectedTab;
        gZenViewSplitter.splitTabs([currentTab, previousTab], "vsep", 1);
      } else {
        openTrustedLinkIn(newUrl, "tab");
      }
      actionTaken = true;
    } else if (event.button === 0 && event.altKey) {
      PREFS.debugLog("Action: Glance");
      if (window.gZenGlanceManager) {
        window.gZenGlanceManager.openGlance({
          url: newUrl,
        });
      } else {
        openTrustedLinkIn(newUrl, "tab");
      }
      actionTaken = true;
    } else if (event.button === 1) {
      PREFS.debugLog("Action: Background Tab");
      openTrustedLinkIn(newUrl, "tab", {
        inBackground: true,
        relatedToCurrent: true,
      });
    } else if (event.button === 0) {
      PREFS.debugLog("Action: Current Tab");
      openTrustedLinkIn(newUrl, "current");
      actionTaken = true;
    }

    if (actionTaken) {
      this.updateSelectedEngineDisplay();
    }

    this._engineOptions.style.display = "none";
    this._container.classList.remove("options-visible");
  },

  toggleOptions(event) {
    event.stopPropagation();
    const shouldOpen = this._engineOptions.style.display !== "block";
    if (shouldOpen) {
      const containerRect = this._container.getBoundingClientRect();
      this._engineOptions.classList.toggle("popup-below", containerRect.top < 220);
      this._engineOptions.classList.toggle("popup-above", containerRect.top >= 220);
      this._engineOptions.style.display = "block";
      this._container.classList.add("options-visible");
    } else {
      this._engineOptions.style.display = "none";
      this._container.classList.remove("options-visible");
    }
  },

  hideOptionsOnClickOutside() {
    this._engineOptions.style.display = "none";
    this._container.classList.remove("options-visible");
  },

  createUI() {
    const container = parseElement(`
      <div id="search-engine-switcher-container" style="top: ${PREFS.yCoor};">
        <div id="ses-engine-select"></div>
        <div id="ses-drag-handle"></div>
        <div id="ses-engine-options"></div>
      </div>
    `);
    this._container = container;
    this._engineSelect = container.querySelector("#ses-engine-select");
    this._dragHandle = container.querySelector("#ses-drag-handle");
    this._engineOptions = container.querySelector("#ses-engine-options");
    document.documentElement.append(this._container);
    this.populateEngineList();
  },

  async populateEngineList() {
    this._engineOptions.innerHTML = "";
    const engines = await Services.search.getVisibleEngines();
    engines.forEach((engine) => {
      const option = parseElement(`
        <div class="ses-engine-option" title="Search with ${escapeXmlAttribute(engine.name)}">
          <span>${escapeXmlAttribute(engine.name)}</span>
        </div>
      `);
      const img = parseElement("<img>");
      img.src = getSearchEngineFavicon(engine);
      option.prepend(img);
      option.addEventListener("mousedown", (e) => this.handleEngineClick(e, engine));
      this._engineOptions.append(option);
    });
  },

  startDrag(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this._isDragging = true;
    this._container.classList.add("is-dragging");
    this._dragHandle.style.cursor = "grabbing";
    this._startY = e.clientY;
    this._initialTop = this._container.offsetTop;
    document.addEventListener("mousemove", this._boundListeners.doDrag);
    document.addEventListener("mouseup", this._boundListeners.stopDrag);
  },

  doDrag(e) {
    if (!this._isDragging) return;
    e.preventDefault();
    let newTop = this._initialTop + (e.clientY - this._startY);
    const maxTop = window.innerHeight - this._container.offsetHeight - 10;
    newTop = Math.max(10, Math.min(newTop, maxTop));
    this._container.style.top = `${newTop}px`;
  },

  stopDrag() {
    if (!this._isDragging) return;
    this._isDragging = false;
    this._container.classList.remove("is-dragging");
    this._dragHandle.style.cursor = "grab";
    if (PREFS.rememberPosition) {
      PREFS.yCoor = this._container.style.top;
    }
    document.removeEventListener("mousemove", this._boundListeners.doDrag);
    document.removeEventListener("mouseup", this._boundListeners.stopDrag);
  },

  attachEventListeners() {
    this._progressListener = {
      onLocationChange: this.onLocationChange.bind(this),
      QueryInterface: ChromeUtils.generateQI([
        "nsIWebProgressListener",
        "nsISupportsWeakReference",
      ]),
    };

    this._boundListeners.handleTabSelect = this.handleTabSelect.bind(this);
    this._boundListeners.handleURLBarKey = this.handleURLBarKey.bind(this);
    this._boundListeners.toggleOptions = this.toggleOptions.bind(this);
    this._boundListeners.hideOptionsOnClickOutside = this.hideOptionsOnClickOutside.bind(this);
    this._boundListeners.startDrag = this.startDrag.bind(this);
    this._boundListeners.doDrag = this.doDrag.bind(this);
    this._boundListeners.stopDrag = this.stopDrag.bind(this);
    this._boundListeners.onSplitViewActivated = this.handleSplitOrGlance.bind(this);
    this._boundListeners.onSplitViewDeactivated =
      this.handleSplitOrGlance.bind(this);
    this._boundListeners.onCompactModeToggled = this.updatePosition.bind(this);
    this._boundListeners.onResize = this.updatePosition.bind(this);

    gBrowser.tabContainer.addEventListener("TabSelect", this._boundListeners.handleTabSelect);
    gBrowser.addTabsProgressListener(this._progressListener);
    gURLBar.inputField.addEventListener("keydown", this._boundListeners.handleURLBarKey);
    this._engineSelect.addEventListener("click", this._boundListeners.toggleOptions);
    document.addEventListener("click", this._boundListeners.hideOptionsOnClickOutside);
    this._dragHandle.addEventListener("mousedown", this._boundListeners.startDrag);

    window.addEventListener(
      "ZenViewSplitter:SplitViewActivated",
      this._boundListeners.onSplitViewActivated
    );
    window.addEventListener(
      "ZenViewSplitter:SplitViewDeactivated",
      this._boundListeners.onSplitViewDeactivated
    );
    window.addEventListener("ZenCompactMode:Toggled", this._boundListeners.onCompactModeToggled);
    window.addEventListener("resize", this._boundListeners.onResize);
  },

  removeEventListeners() {
    gBrowser.tabContainer.removeEventListener("TabSelect", this._boundListeners.handleTabSelect);
    if (this._progressListener) {
      gBrowser.removeTabsProgressListener(this._progressListener);
      this._progressListener = null;
    }
    gURLBar.inputField.removeEventListener("keydown", this._boundListeners.handleURLBarKey);
    this._engineSelect?.removeEventListener("click", this._boundListeners.toggleOptions);
    document.removeEventListener("click", this._boundListeners.hideOptionsOnClickOutside);
    this._dragHandle?.removeEventListener("mousedown", this._boundListeners.startDrag);
    document.removeEventListener("mousemove", this._boundListeners.doDrag);
    document.removeEventListener("mouseup", this._boundListeners.stopDrag);

    window.removeEventListener(
      "ZenViewSplitter:SplitViewActivated",
      this._boundListeners.onSplitViewActivated
    );
    window.removeEventListener(
      "ZenViewSplitter:SplitViewDeactivated",
      this._boundListeners.onSplitViewDeactivated
    );
    window.removeEventListener("ZenCompactMode:Toggled", this._boundListeners.onCompactModeToggled);
    window.removeEventListener("resize", this._boundListeners.onResize);

    this._boundListeners = {};
  },
};

function init() {
  const handleEnabledChange = (pref) => {
    SearchEngineSwitcher.handleEnabledChange(pref);
  };

  PREFS.setInitialPrefs();

  if (PREFS.enabled) SearchEngineSwitcher.init();

  addPrefListener(PREFS.ENABLED, handleEnabledChange);
}
startupFinish(init);
