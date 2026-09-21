import { PREFS } from "./utils/prefs.js";
import { browseBotLibraryLLM, MODES } from "./library-llm.js";
import { messageManagerAPI } from "./messageManager.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { parseMD } from "./utils/markdown.js";
import {
  toolStatusIcons,
  SEND_SVG,
  STOP_SVG,
  renderStreamText,
  extractErrorText,
  isProviderBalanceExhausted,
  setStreamingControls,
  attachChatMessageHandlers,
} from "./utils/chat.js";
import { browseBotFindbar } from "./findbar-ai.uc.js";
import { SettingsModal } from "./settings.js";
import { showToast } from "../utils/toast.js";
import { addPrefListener } from "../utils/pref.js";
import { fuzzyFilterSort } from "../utils/fuzzy.js";

const MODE_LABELS = { chat: "Chat", agent: "Agent", build: "Build" };
const SLASH_ITEMS = MODES.map((mode) => ({
  mode,
  title: `/${mode}`,
  description:
    mode === "chat"
      ? "Ask, no tools or page context"
      : mode === "agent"
        ? "Full browser tool-belt"
        : "Coming soon",
}));

function listTabs() {
  try {
    const tabs = gZenWorkspaces?.allStoredTabs || gBrowser?.tabs || [];
    return tabs
      .filter((tab) => tab && !tab.hidden && !tab.closing && !tab.hasAttribute("pending"))
      .map((tab) => ({
        tab,
        title: tab.label || tab.linkedBrowser?.currentURI?.spec || "Untitled",
        url: tab.linkedBrowser?.currentURI?.spec || "",
        icon: tab.image || "",
      }))
      .filter((t) => t.url && t.url !== "about:newtab" && t.url !== "about:blank");
  } catch {
    return [];
  }
}

function getLitHtml() {
  if (getLitHtml.tag !== undefined) return getLitHtml.tag;
  let tag = null;
  try {
    const lit = ChromeUtils.importESModule("chrome://global/content/vendor/lit.all.mjs");
    if (lit && typeof lit.html === "function") tag = lit.html;
  } catch {
    tag = null;
  }
  getLitHtml.tag = tag;
  return tag;
}

function libraryHostOf(sectionEl) {
  try {
    if (sectionEl?.library?.zenLibrarySections) return sectionEl.library;
  } catch {}
  try {
    return sectionEl?.closest?.("zen-library") || null;
  } catch {
    return null;
  }
}

function setLibraryWidth(sectionEl) {
  try {
    libraryHostOf(sectionEl)?.style.setProperty("--zen-library-content-width", "640px");
  } catch {}
}

function clearLibraryWidth(sectionEl) {
  try {
    libraryHostOf(sectionEl)?.style.removeProperty("--zen-library-content-width");
  } catch {}
}

function mountPanel(host) {
  const ui = parseElement(`
    <div class="bb-library">
      <div class="bb-library-header">
        <div class="bb-mode-switch">
          ${MODES.map(
            (mode) =>
              `<span class="bb-mode ${PREFS.libraryMode === mode ? " is-active" : ""}" data-mode="${mode}">${MODE_LABELS[mode]}</span>`
          ).join("")}
        </div>
        <div class="bb-header-actions">
          <button class="zenux-icon-btn" data-action="clear" tooltiptext="Clear chat"><img src="chrome://global/skin/icons/delete.svg" /></button>
          <button class="zenux-icon-btn" data-action="settings" tooltiptext="BrowseBot settings"><img src="chrome://global/skin/icons/settings.svg" /></button>
        </div>
      </div>
      <div class="bb-library-messages ai-chat-messages"></div>
      <div class="bb-refs-bar"></div>
      <div class="bb-library-composer ai-chat-input-group">
        <div class="bb-library-popup" hidden></div>
        <textarea class="bb-library-input zenux-input" placeholder="Ask anything…  ( / for modes, @ for tabs )" rows="2"></textarea>
        <button class="bb-send-btn send-btn zenux-btn-primary">${SEND_SVG}</button>
        <button class="bb-stop-btn stop-btn zenux-btn-primary" style="display: none;">${STOP_SVG}</button>
      </div>
    </div>`);

  const state = {
    host,
    pendingRefs: [],
    abortController: null,
    streaming: false,
    popupIndex: 0,
    popupKind: null,
    popupItems: [],
    popupToken: null,
    destroyed: false,
  };
  host._bbCleanup = () => {
    state.destroyed = true;
    clearLibraryWidth(host);
    state.abortController?.abort();
  };

  const messagesEl = ui.querySelector(".bb-library-messages");
  const input = ui.querySelector(".bb-library-input");
  const sendBtn = ui.querySelector(".bb-send-btn");
  const stopBtn = ui.querySelector(".bb-stop-btn");
  const popup = ui.querySelector(".bb-library-popup");
  const refsBar = ui.querySelector(".bb-refs-bar");
  const modeButtons = [...ui.querySelectorAll(".bb-mode")];

  const scrollDown = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const focusPrompt = () => {
    if (!state.destroyed) setTimeout(() => input.focus(), 10);
  };

  function addMessage(role, content, refs = []) {
    const type = role === "user" ? "user" : role === "error" ? "error" : "ai";
    const wrap = parseElement(`<div class="chat-message chat-message-${type}"></div>`);
    const contentDiv = parseElement(`<div class="message-content"></div>`);
    contentDiv.appendChild(parseMD(content || ""));
    wrap.appendChild(contentDiv);
    insertRefChips(contentDiv, refs);
    messagesEl.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function insertRefChips(contentDiv, refs) {
    if (!refs || refs.length === 0) return;
    const sorted = [...refs].sort((a, b) => b.title.length - a.title.length);
    const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const startNode of textNodes) {
      if (startNode.parentElement?.closest?.("pre, code")) continue;
      let node = startNode;
      for (;;) {
        let best = null;
        for (const ref of sorted) {
          const token = `@${ref.title}`;
          const idx = node.textContent.indexOf(token);
          if (idx !== -1 && (!best || idx < best.idx)) best = { ref, idx, token };
        }
        if (!best) break;
        const parent = node.parentNode;
        if (!parent) break;
        parent.insertBefore(document.createTextNode(node.textContent.slice(0, best.idx)), node);
        parent.insertBefore(refChip(best.ref, false), node);
        const after = document.createTextNode(node.textContent.slice(best.idx + best.token.length));
        parent.replaceChild(after, node);
        node = after;
      }
    }
  }

  function refChip(ref, removable) {
    const chip = parseElement(
      `<span class="bb-ref-chip">${ref.icon ? `<img src="${escapeXmlAttribute(ref.icon)}" />` : ""}<span>${escapeXmlAttribute(ref.title)}</span>${removable ? `<span class="bb-ref-remove"><img src="chrome://global/skin/icons/close.svg" /></span>` : ""}</span>`
    );
    for (const img of chip.querySelectorAll("img")) {
      img.addEventListener("error", () => img.remove());
    }
    if (removable) {
      chip.querySelector(".bb-ref-remove")?.addEventListener("mousedown", (e) => {
        e.preventDefault();
        state.pendingRefs = state.pendingRefs.filter((r) => r.tab !== ref.tab);
        input.value = input.value.split(`@${ref.title}`).join("").replace(/ {2,}/g, " ");
        renderChips();
        input.focus();
      });
    }
    return chip;
  }

  function renderChips() {
    refsBar.replaceChildren();
    for (const ref of state.pendingRefs) refsBar.appendChild(refChip(ref, true));
  }

  function syncPendingRefs() {
    const before = state.pendingRefs.length;
    state.pendingRefs = state.pendingRefs.filter((r) => input.value.includes(`@${r.title}`));
    if (state.pendingRefs.length !== before) renderChips();
  }

  function renderHistory() {
    messagesEl.innerHTML = "";
    const history = browseBotLibraryLLM.getHistory();
    if (history.length === 0) {
      const empty = parseElement(
        `<div class="zenux-empty">Ask anything. Type <b>/</b> to switch modes, <b>@</b> to reference tabs.</div>`
      );
      messagesEl.appendChild(empty);
      return;
    }
    for (const msg of history) {
      if (msg.pageContext) continue;
      if (msg.role === "user" && String(msg.content).startsWith("Referenced tabs")) continue;
      if (msg.role !== "user" && msg.role !== "assistant") continue;
      if (msg.role === "assistant" && !String(msg.content).trim()) continue;
      addMessage(msg.role, String(msg.content));
    }
  }

  function setMode(mode) {
    if (!MODES.includes(mode)) return;
    PREFS.libraryMode = mode;
    modeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.mode === mode));
    hidePopup();
  }

  modeButtons.forEach((btn) => btn.addEventListener("click", () => setMode(btn.dataset.mode)));

  ui.querySelector('[data-action="clear"]').addEventListener("click", () => {
    if (state.streaming) state.abortController?.abort();
    browseBotLibraryLLM.clearData();
    state.pendingRefs = [];
    renderChips();
    renderHistory();
    input.focus();
  });

  ui.querySelector('[data-action="settings"]').addEventListener("click", () => SettingsModal.show());

  attachChatMessageHandlers(messagesEl);

  function hidePopup() {
    popup.hidden = true;
    popup.innerHTML = "";
    state.popupKind = null;
    state.popupItems = [];
    state.popupIndex = 0;
    state.popupToken = null;
  }

  function tokenBeforeCaret() {
    const caret = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, caret);
    const slash = before.match(/(^|\s)\/(\w*)$/);
    if (slash) return { kind: "slash", filter: slash[2].toLowerCase(), start: caret - slash[2].length - 1 };
    const at = before.match(/(^|\s)@([^@\n]*)$/);
    if (at) return { kind: "at", filter: at[2].toLowerCase(), start: caret - at[2].length - 1 };
    return null;
  }

  function paintPopupItems() {
    popup.querySelectorAll(".bb-popup-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === state.popupIndex);
      if (i === state.popupIndex) el.scrollIntoView({ block: "nearest" });
    });
  }

  function refreshPopup() {
    const token = tokenBeforeCaret();
    if (!token) {
      hidePopup();
      return;
    }
    let items;
    if (token.kind === "slash") {
      items = SLASH_ITEMS.filter((item) => item.mode.startsWith(token.filter));
    } else {
      items = fuzzyFilterSort(listTabs(), token.filter, (t) => [t.title, t.url]).slice(0, 8);
    }
    if (items.length === 0) {
      hidePopup();
      return;
    }
    state.popupKind = token.kind;
    state.popupItems = items;
    state.popupIndex = 0;
    state.popupToken = token;
    popup.innerHTML = "";
    items.forEach((item, i) => {
      const isTab = token.kind === "at";
      const el = parseElement(
        `<div class="bb-popup-item${i === 0 ? " is-active" : ""}" data-index="${i}">
          ${isTab && item.icon ? `<img class="bb-popup-icon" src="${escapeXmlAttribute(item.icon)}" />` : ""}
          <span class="bb-popup-title">${escapeXmlAttribute(item.title)}</span>
          <span class="bb-popup-desc">${escapeXmlAttribute(isTab ? item.url : item.description)}</span>
        </div>`
      );
      if (isTab && item.icon) {
        const img = el.querySelector(".bb-popup-icon");
        img?.addEventListener("error", () => img.remove());
      }
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        applyPopupItem(i);
      });
      popup.appendChild(el);
    });
    popup.hidden = false;
  }

  function movePopup(delta) {
    if (popup.hidden || state.popupItems.length === 0) return;
    const n = state.popupItems.length;
    state.popupIndex = (state.popupIndex + delta + n) % n;
    paintPopupItems();
  }

  function applyPopupItem(index = state.popupIndex) {
    const token = state.popupToken || tokenBeforeCaret();
    const item = state.popupItems[index];
    if (!token || !item) return false;
    const caret = input.selectionStart ?? input.value.length;
    const head = input.value.slice(0, token.start);
    const after = input.value.slice(caret);
    if (state.popupKind === "slash") {
      setMode(item.mode);
      input.value = "";
    } else {
      state.pendingRefs = state.pendingRefs.filter((r) => r.tab !== item.tab);
      state.pendingRefs.push({ tab: item.tab, title: item.title, url: item.url, icon: item.icon });
      input.value = `${head}@${item.title} ${after}`;
      renderChips();
    }
    hidePopup();
    input.focus();
    return true;
  }

  input.addEventListener("input", () => {
    syncPendingRefs();
    refreshPopup();
  });
  input.addEventListener("click", refreshPopup);
  input.addEventListener("blur", () => setTimeout(hidePopup, 150));

  input.addEventListener("keydown", (e) => {
    if (!popup.hidden) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        movePopup(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        movePopup(-1);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyPopupItem();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hidePopup();
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  function setStreaming(streaming) {
    state.streaming = streaming;
    setStreamingControls({ sendBtn, stopBtn, input }, streaming, focusPrompt);
  }

  sendBtn.addEventListener("click", handleSend);
  stopBtn.addEventListener("click", () => {
    state.abortController?.abort();
  });

  function createLoadingIndicator() {
    return parseElement(
      `<div class="chat-message chat-message-loading"><div class="message-content">Loading...</div></div>`
    );
  }

  async function resolveRefs(text) {
    const refs = [];
    for (const pending of state.pendingRefs) {
      if (!text.includes(`@${pending.title}`)) continue;
      const page = await messageManagerAPI.getPageTextContentForTab(pending.tab).catch(() => null);
      refs.push({
        title: pending.title,
        url: page?.url || pending.url,
        icon: pending.icon || "",
        text: page?.textContent?.trim() ? page.textContent : `(No readable text extracted from this tab.)`,
      });
    }
    return refs;
  }

  async function handleSend() {
    let text = input.value.trim();
    if (!text || state.streaming) return;

    const slash = text.match(/^\/(\w+)\s*([\s\S]*)$/);
    if (slash && MODES.includes(slash[1].toLowerCase())) {
      setMode(slash[1].toLowerCase());
      const rest = slash[2].trim();
      input.value = "";
      hidePopup();
      if (!rest) {
        focusPrompt();
        return;
      }
      text = rest;
    }

    const refs = await resolveRefs(text);
    let prompt = text;
    for (const ref of refs) {
      prompt = prompt.split(`@${ref.title}`).join(ref.title);
    }

    addMessage("user", text, refs);
    input.value = "";
    state.pendingRefs = [];
    draft.text = "";
    draft.refs = [];
    renderChips();
    hidePopup();

    state.abortController = new AbortController();
    setStreaming(true);

    const aiWrap = parseElement(
      `<div class="chat-message chat-message-ai">
        <div class="tool-calls-container"></div>
        <div class="message-content"><div class="markdown-body"></div></div>
      </div>`
    );
    const toolBox = aiWrap.querySelector(".tool-calls-container");
    const contentDiv = aiWrap.querySelector(".markdown-body");
    messagesEl.appendChild(aiWrap);
    scrollDown();

    const updateToolCallUI = (toolName, status, errorMsg = null) => {
      toolBox
        .querySelectorAll('.tool-call-status[data-status="loading"]')
        .forEach((item) => item.remove());
      const toolDiv = parseElement(`
        <div class="tool-call-status" data-tool-name="${escapeXmlAttribute(toolName)}" data-status="${status}">
          <span class="tool-call-icon">${toolStatusIcons[status] || ""}</span>
          <span class="tool-call-name">${escapeXmlAttribute(toolName)}</span>
          ${status === "error" && errorMsg ? `<span class="tool-call-error">${escapeXmlAttribute(String(errorMsg))}</span>` : ""}
          ${status === "declined" ? `<span class="tool-call-error">Declined by user</span>` : ""}
        </div>`);
      toolBox.appendChild(toolDiv);
      scrollDown();
    };

    try {
      const resultPromise = browseBotLibraryLLM.sendMessage(prompt, {
        refs,
        abortSignal: state.abortController.signal,
        confirmTool: (names) => browseBotFindbar.createToolConfirmationDialog(names),
        onToolStatus: updateToolCallUI,
      });

      if (!PREFS.streamEnabled) {
        const loadingIndicator = createLoadingIndicator();
        messagesEl.appendChild(loadingIndicator);
        scrollDown();
        try {
          const result = await resultPromise;
          if (loadingIndicator.parentNode) loadingIndicator.remove();
          if (isProviderBalanceExhausted(browseBotLibraryLLM.currentProvider, result.text)) {
            contentDiv.appendChild(
              parseMD(
                `${result.text}\n\n*Pollinations ran out of free credits. Add a free API key in BrowseBot settings, then try again.*`
              )
            );
          } else if (result.text.trim() === "" && toolBox.querySelector(".tool-call-status")) {
            contentDiv.appendChild(parseMD("*(Tool actions performed)*"));
          } else if (result.text.trim() === "" && !toolBox.querySelector(".tool-call-status")) {
            aiWrap.remove();
          } else {
            contentDiv.appendChild(parseMD(result.text));
          }
        } finally {
          if (loadingIndicator.parentNode) loadingIndicator.remove();
          scrollDown();
        }
      } else {
        const loadingIndicator = createLoadingIndicator();
        messagesEl.appendChild(loadingIndicator);
        scrollDown();

        const result = await resultPromise;
        let fullText = "";
        try {
          for await (const delta of result.textStream) {
            if (loadingIndicator.parentNode) loadingIndicator.remove();
            fullText += delta;
            renderStreamText(contentDiv, fullText);
            scrollDown();
          }
          try {
            const finalText = await result.text;
            if (typeof finalText === "string") fullText = finalText;
          } catch (e) {
            PREFS.debugError("Failed to resolve final stream text:", e.message);
          }
          renderStreamText(contentDiv, fullText);
          if (isProviderBalanceExhausted(browseBotLibraryLLM.currentProvider, fullText)) {
            contentDiv.appendChild(
              parseMD(
                "\n\n*Pollinations ran out of free credits. Add a free API key in BrowseBot settings, then try again.*"
              )
            );
          } else if (fullText.trim() === "" && toolBox.querySelector(".tool-call-status")) {
            contentDiv.innerHTML = "";
            contentDiv.appendChild(parseMD("*(Tool actions performed)*"));
          } else if (fullText.trim() === "" && !toolBox.querySelector(".tool-call-status")) {
            aiWrap.remove();
          }
        } finally {
          if (loadingIndicator.parentNode) loadingIndicator.remove();
        }
      }
    } catch (e) {
      if (e?.name === "AbortError") {
        PREFS.debugLog("Streaming aborted by user.");
        if (contentDiv.textContent.trim()) {
          contentDiv.appendChild(parseMD("_Stopped_"));
        } else {
          aiWrap.remove();
        }
      } else {
        PREFS.debugError("Library send failed:", e);
        aiWrap.remove();
        addMessage("error", extractErrorText(e));
      }
    } finally {
      if (!state.destroyed) setStreaming(false);
      state.abortController = null;
      scrollDown();
    }
  }

  renderHistory();
  restoreDraft();
  setLibraryWidth(host);
  try {
    const libHost = libraryHostOf(host);
    if (libHost) ensureTabPatched(libHost);
  } catch {}
  host.appendChild(ui);
  setTimeout(() => {
    try {
      if (host.isConnected) input.focus();
    } catch {}
  }, 50);
}

class BrowseBotLibrarySectionElement extends HTMLElement {
  constructor() {
    super();
    this._mounted = false;
    this._library = null;
  }
  set library(value) {
    this._library = value;
  }
  get library() {
    return this._library;
  }
  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    try {
      this.classList.add("zen-library-section");
    } catch {}
    try {
      this.dataset.section = "browsebot";
    } catch {}
    try {
      mountPanel(this);
    } catch (e) {
      PREFS.debugError("BrowseBot library mount failed:", e);
    }
  }
  disconnectedCallback() {
    try {
      this._bbCleanup?.();
    } catch {}
  }
}

if (!customElements.get("zen-library-browsebot-section")) {
  try {
    customElements.define("zen-library-browsebot-section", BrowseBotLibrarySectionElement);
  } catch (e) {
    PREFS.debugError("Failed to define library section element:", e);
  }
}

class BrowseBotLibrarySection {
  static render(library) {
    try {
      const html = getLitHtml();
      if (html) {
        return html`<zen-library-browsebot-section class="zen-library-section" data-section="browsebot" .library=${library}></zen-library-browsebot-section>`;
      }
    } catch {}
    const el = document.createElement("zen-library-browsebot-section");
    try {
      el.library = library;
    } catch {}
    return el;
  }
}
BrowseBotLibrarySection.id = "browsebot";
BrowseBotLibrarySection.label = "library-browsebot-section-title";
window.ZenLibraryBrowseBotSection = BrowseBotLibrarySection;

const observedHosts = new WeakSet();
let libraryObserver = null;

function findSectionTab(host) {
  try {
    const root = host.shadowRoot || host;
    return root?.querySelector?.(`.zen-library-tab[data-section="${"browsebot"}"]`) || null;
  } catch {
    return null;
  }
}

function patchTab(host) {
  const tab = findSectionTab(host);
  if (!tab) return false;
  try {
    const label = tab.querySelector?.("label");
    if (label && label.textContent !== "AI") {
      label.textContent = "AI";
      label.removeAttribute("data-l10n-id");
    }
    const labelDone =
      !tab.querySelector?.("label") || tab.querySelector("label").textContent === "AI";
    return !!labelDone;
  } catch {
    return false;
  }
}

function ensureTabPatched(host, attempts = 40) {
  try {
    if (patchTab(host)) return;
  } catch {}
  if (attempts > 0) {
    setTimeout(() => {
      try {
        if (host.isConnected) ensureTabPatched(host, attempts - 1);
      } catch {}
    }, 250);
  }
}

function ensureSection(host) {
  if (!host?.isConnected) return false;
  observeHost(host);
  const sections = host.zenLibrarySections;
  if (!sections || typeof sections !== "object") return false;
  if (!PREFS.libraryEnabled) {
    if (sections["browsebot"] === BrowseBotLibrarySection) {
      delete sections["browsebot"];
      if (host.activeTab === "browsebot") host.activeTab = "history";
      try {
        host.requestUpdate?.();
      } catch {}
      return true;
    }
    return false;
  }
  let changed = false;
  if (sections["browsebot"] !== BrowseBotLibrarySection) {
    sections["browsebot"] = BrowseBotLibrarySection;
    changed = true;
  }
  ensureTabPatched(host);
  if (changed) {
    try {
      host.requestUpdate?.();
    } catch {}
  }
  return changed;
}

function observeHost(host) {
  let root = null;
  try {
    root = host.shadowRoot || host;
  } catch {
    return;
  }
  if (host._bbObservedRoot === root) return;
  host._bbObservedRoot = root;
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      ensureSection(host);
    });
  });
  try {
    observer.observe(root, { childList: true, subtree: true });
  } catch {
    host._bbObservedRoot = null;
  }
}

function attachHost(host) {
  if (!host) return;
  if (!observedHosts.has(host)) observedHosts.add(host);
  ensureSection(host);
}

function connectExistingHosts() {
  let hosts = [];
  try {
    hosts = Array.from(document.querySelectorAll?.("zen-library") || []);
  } catch {
    hosts = [];
  }
  for (const host of hosts) attachHost(host);
}

function watchForHosts() {
  connectExistingHosts();
  if (libraryObserver) return;
  libraryObserver = new MutationObserver(connectExistingHosts);
  try {
    libraryObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch {
    libraryObserver = null;
  }
}

function hasLibraryFeature() {
  try {
    return !!(
      document.querySelector("zen-library") ||
      customElements.get("zen-library") ||
      document.getElementById("zen-library-button")
    );
  } catch {
    return false;
  }
}

function libraryShortcutHit(e) {
  if (e.defaultPrevented) return false;
  const target = e.composedPath ? e.composedPath()[0] : e.target;
  const name = target?.localName?.toLowerCase?.() || "";
  if (name === "input" || name === "textarea" || target?.isContentEditable) return false;
  let pref = null;
  try {
    pref = parseStringToShortcut(PREFS.shortcutLibrary || "");
  } catch {
    return false;
  }
  if (!pref?.key) return false;
  if (!!(pref.ctrl || pref.meta) !== !!(e.ctrlKey || e.metaKey)) return false;
  if (!!pref.alt !== !!e.altKey) return false;
  if (!!pref.shift !== !!e.shiftKey) return false;
  const key = (e.key || "").toLowerCase();
  if (key && key === pref.key) return true;
  if (pref.key.length === 1) {
    const upper = pref.key.toUpperCase();
    return e.code === `Key${upper}` || e.code === `Digit${upper}`;
  }
  return false;
}

function watchLibraryShortcut() {
  if (watchLibraryShortcut.done) return;
  watchLibraryShortcut.done = true;
  window.addEventListener(
    "keydown",
    (e) => {
      if (!PREFS.libraryEnabled) return;
      if (!libraryShortcutHit(e)) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      PREFS.debugLog("Library shortcut hit, toggling.");
      browseBotLibrary.toggle();
    },
    true
  );
}

function libraryCtor() {
  try {
    return customElements.get("zen-library") || null;
  } catch {
    return null;
  }
}

function isLibraryOpen() {
  try {
    const Ctor = libraryCtor();
    if (Ctor && typeof Ctor.isLibraryOpen === "boolean") return Ctor.isLibraryOpen;
    if (typeof window.gZenLibrary?._isOpen === "boolean") return window.gZenLibrary._isOpen;
    const host = document.querySelector("zen-library");
    if (host && !host.hidden) {
      const cs = getComputedStyle(host);
      if (cs.display !== "none" && cs.visibility !== "hidden") return true;
    }
  } catch {}
  return false;
}

function clickLibraryButton() {
  try {
    document.getElementById("zen-library-button")?.click?.();
    return true;
  } catch {
    return false;
  }
}

function setSectionTab() {
  try {
    const h = document.querySelector("zen-library");
    if (!h) return false;
    ensureSection(h);
    if (!h.zenLibrarySections?.["browsebot"]) return false;
    if (h.activeTab !== "browsebot") h.activeTab = "browsebot";
    h.requestUpdate?.();
    return true;
  } catch {
    return false;
  }
}

function setSectionTabSoon() {
  let attempts = 15;
  const tick = () => {
    if (setSectionTab()) return;
    if (--attempts > 0) setTimeout(tick, 100);
  };
  tick();
}

function closeLibrary() {
  try {
    if (typeof window.gZenLibrary?.close === "function") {
      window.gZenLibrary.close();
      return true;
    }
  } catch {}
  return clickLibraryButton();
}

function showLibraryMissing() {
  try {
    showToast({
      title: "Zen Library not available",
      description: "BrowseBot Library needs a Zen version with the Library feature.",
    });
  } catch {}
  return false;
}

export function initBrowseBotLibrary() {
  if (!customElements.get("zen-library")) {
    try {
      customElements
        .whenDefined("zen-library")
        .then(watchForHosts)
        .catch(() => {});
    } catch {}
  } else {
    watchForHosts();
  }
  watchLibraryShortcut();
  addPrefListener(PREFS.LIBRARY_ENABLED, () => connectExistingHosts());
}

export const browseBotLibrary = {
  get enabled() {
    return PREFS.libraryEnabled;
  },
  get mode() {
    return PREFS.libraryMode;
  },
  setMode(mode) {
    PREFS.libraryMode = mode;
  },
  toggle() {
    if (!PREFS.libraryEnabled) return false;
    try {
      connectExistingHosts();
    } catch {}
    try {
      const host = document.querySelector("zen-library");
      if (isLibraryOpen() && host?.activeTab === "browsebot") return closeLibrary();
      return this.open();
    } catch (e) {
      PREFS.debugError("Could not toggle Zen Library:", e);
    }
    return showLibraryMissing();
  },
  open() {
    if (!PREFS.libraryEnabled) return false;
    try {
      connectExistingHosts();
    } catch {}
    try {
      const host = document.querySelector("zen-library");
      if (isLibraryOpen() && host?.activeTab === "browsebot") return true;
      if (!isLibraryOpen() && !hasLibraryFeature()) return showLibraryMissing();
      if (!isLibraryOpen()) clickLibraryButton();
      setSectionTabSoon();
      return true;
    } catch (e) {
      PREFS.debugError("Could not open Zen Library:", e);
    }
    return showLibraryMissing();
  },
};

window.browseBotLibrary = browseBotLibrary;
