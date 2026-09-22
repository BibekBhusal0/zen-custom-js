import { PREFS } from "./utils/prefs.js";
import { browseBotLibraryLLM, MODES } from "./library-llm.js";
import { messageManagerAPI } from "./messageManager.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { icons } from "../utils/icon.js";
import { parseMD } from "./utils/markdown.js";
import {
  renderStreamText,
  extractErrorText,
  isProviderBalanceExhausted,
  setStreamingControls,
  attachChatMessageHandlers,
} from "./utils/chat.js";
import { SettingsModal } from "./settings.js";
import { showToast } from "../utils/toast.js";
import { addPrefListener } from "../utils/pref.js";
import { fuzzyFilterSort } from "../utils/fuzzy.js";
import {
  clearPreviewCSS,
  clearStagedJS,
  getPreviewCSS,
  getPreviewState,
  getStagedJS,
} from "./utils/build-preview.js";
import { buildAuthor } from "./llm/build-tools.js";
import { createSineMod } from "./utils/sine-mods.js";
import { highlightCode } from "../utils/code-highlight.js";

const MODE_LABELS = { chat: "Chat", agent: "Agent", build: "Build" };
const SLASH_ITEMS = MODES.map((mode) => ({
  mode,
  title: `/${mode}`,
  description:
    mode === "chat"
      ? "Ask, no tools or page context"
      : mode === "agent"
        ? "Full browser tool-belt"
        : "Style the browser, preview live, ship Sine mods",
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

let widthGuardTimer = null;

function startWidthGuard() {
  stopWidthGuard();
  widthGuardTimer = setInterval(() => {
    try {
      const host = document.querySelector("zen-library");
      if (!host || host.activeTab !== "browsebot" || !PREFS.libraryEnabled) return;
      if (host.style.getPropertyValue("--zen-library-content-width") !== "640px") {
        host.style.setProperty("--zen-library-content-width", "640px");
      }
    } catch {}
  }, 500);
}

function stopWidthGuard() {
  try {
    clearInterval(widthGuardTimer);
  } catch {}
  widthGuardTimer = null;
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
      <div class="bb-build-bar" hidden>
        <span class="bb-build-status"></span>
        <button class="bb-build-create zenux-btn-primary">Create Mod</button>
        <button class="bb-build-clear zenux-btn-ghost">Clear</button>
      </div>
      <div class="bb-library-composer ai-chat-input-group">
        <div class="bb-library-popup" hidden></div>
        <textarea class="bb-library-input zenux-input" placeholder="Ask anything…  ( / for modes, @ for tabs )" rows="2"></textarea>
        <button class="bb-send-btn send-btn zenux-btn-primary">${icons.send}</button>
        <button class="bb-stop-btn stop-btn zenux-btn-primary" style="display: none;">${icons.stop}</button>
      </div>
    </div>`);

  const state = {
    host,
    pendingRefs: [],
    abortController: null,
    streaming: false,
    toolConfirmationDialog: null,
    popupIndex: 0,
    popupKind: null,
    popupItems: [],
    popupToken: null,
    destroyed: false,
  };
  host._bbCleanup = () => {
    state.destroyed = true;
    stopWidthGuard();
    clearLibraryWidth(host);
    state.abortController?.abort();
    state.toolConfirmationDialog?.remove();
    state.toolConfirmationDialog = null;
  };

  const messagesEl = ui.querySelector(".bb-library-messages");
  const input = ui.querySelector(".bb-library-input");
  const sendBtn = ui.querySelector(".bb-send-btn");
  const stopBtn = ui.querySelector(".bb-stop-btn");
  const popup = ui.querySelector(".bb-library-popup");
  const refsBar = ui.querySelector(".bb-refs-bar");
  const clearBtn = ui.querySelector('[data-action="clear"]');
  const modeButtons = [...ui.querySelectorAll(".bb-mode")];
  const buildBar = ui.querySelector(".bb-build-bar");
  const buildStatus = ui.querySelector(".bb-build-status");

  function refreshBuildBar() {
    if (!buildBar) return;
    const isBuild = PREFS.libraryMode === "build";
    const { cssChars, jsChars } = getPreviewState();
    const hasPreview = cssChars > 0 || jsChars > 0;
    buildBar.hidden = !(isBuild && hasPreview);
    if (buildStatus) {
      const parts = [];
      if (cssChars > 0) parts.push(`${cssChars} chars CSS`);
      if (jsChars > 0) parts.push(`${jsChars} chars JS`);
      buildStatus.textContent = parts.length ? `Staged: ${parts.join(" + ")}` : "";
    }
  }

  function openCreateModModal() {
    const { cssChars, jsChars } = getPreviewState();
    if (cssChars === 0 && jsChars === 0) {
      showToast({
        title: "Nothing staged",
        description: "Ask Build mode to preview CSS or JS first.",
      });
      return;
    }
    const overlay = parseElement(`
      <div class="bb-create-mod-overlay">
        <div class="bb-create-mod-modal">
          <h3>Create Sine Mod</h3>
          <p class="bb-create-mod-hint">Staged: ${cssChars} chars CSS${jsChars ? `, ${jsChars} chars JS` : ""}. Saved with the staged preview.</p>
          <label>Name<input class="zenux-input" data-field="name" placeholder="e.g. Cyberpunk UI" /></label>
          <label>Description<input class="zenux-input" data-field="description" placeholder="What does this mod do?" /></label>
          <label>Author (optional)<input class="zenux-input" data-field="author" placeholder="${escapeXmlAttribute(buildAuthor())}" /></label>
          <span class="bb-create-mod-error"></span>
          <div class="bb-create-mod-actions">
            <button class="zenux-btn-ghost" data-action="cancel">Cancel</button>
            <button class="zenux-btn-primary" data-action="save">Create Mod</button>
          </div>
        </div>
      </div>`);
    const nameInput = overlay.querySelector('[data-field="name"]');
    const descInput = overlay.querySelector('[data-field="description"]');
    const authorInput = overlay.querySelector('[data-field="author"]');
    const errorEl = overlay.querySelector(".bb-create-mod-error");
    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", close);
    overlay.querySelector('[data-action="save"]').addEventListener("click", async () => {
      const name = nameInput.value.trim() || "BrowseBot Mod";
      const description = descInput.value.trim();
      const author = authorInput.value.trim() || buildAuthor();
      const saveBtn = overlay.querySelector('[data-action="save"]');
      saveBtn.disabled = true;
      try {
        const created = await createSineMod({
          name,
          description,
          css: getPreviewCSS(),
          js: getStagedJS(),
          author,
        });
        close();
        addMessage(
          "ai",
          `Created mod **${created.name}** (id: \`${created.id}\`, ${created.files.length} files verified at \`${created.dir}\`) and registered it with Sine — reopen Settings → Sine Mods to see it. Your live preview is still applied; restart the browser if the script doesn't take effect.`
        );
        showToast({
          title: "Mod created",
          description: `${created.name} — see Sine Mods settings`,
        });
        refreshBuildBar();
      } catch (e) {
        PREFS.debugError("Create mod from UI failed:", e);
        if (errorEl) errorEl.textContent = `Failed: ${e?.message || e}`;
        saveBtn.disabled = false;
      }
    });
    document.body.appendChild(overlay);
    setTimeout(() => nameInput.focus(), 20);
  }

  ui.querySelector(".bb-build-create")?.addEventListener("click", openCreateModModal);
  ui.querySelector(".bb-build-clear")?.addEventListener("click", () => {
    clearPreviewCSS();
    clearStagedJS();
    refreshBuildBar();
  });

  const scrollDown = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const focusPrompt = () => {
    if (!state.destroyed) setTimeout(() => input.focus(), 10);
  };

  function createToolConfirmationDialog(toolNames, detail = {}) {
    return new Promise((resolve) => {
      const { toolName, args } = detail;
      let previewHtml = "";
      if (toolName === "runChromeJS" && args?.code) {
        const codeEl = parseElement(`<pre class="zenux-code-confirm-code"><code></code></pre>`);
        codeEl.querySelector("code").innerHTML = highlightCode(
          String(args.code).slice(0, 4000),
          "javascript"
        );
        previewHtml = codeEl.outerHTML;
      } else if (toolName === "createMod") {
        const label = [args?.name, args?.description].filter(Boolean).join(" — ").slice(0, 200);
        if (label) previewHtml = `<p class="tool-confirm-detail">${escapeXmlAttribute(label)}</p>`;
      } else if (toolName === "updateModFile" && args?.modId) {
        previewHtml = `<p class="tool-confirm-detail">${escapeXmlAttribute(`${args.modId} / ${args.file || ""}`)}</p>`;
      }
      const dialog = parseElement(`
        <div class="tool-confirmation-dialog">
          <div class="tool-confirmation-content">
            <p>Allow AI to do following tasks: ${toolNames?.join(", ")}?</p>
            ${previewHtml}
            <div class="buttons">
              <button class="not-again zenux-btn-ghost">Don't ask again</button>
              <div class="right-side-buttons">
                <button class="confirm-tool zenux-btn-success">Yes</button>
                <button class="cancel-tool zenux-btn-danger">No</button>
              </div>
            </div>
          </div>
        </div>
      `);
      state.toolConfirmationDialog = dialog;

      const removeDialog = () => {
        dialog.remove();
        state.toolConfirmationDialog = null;
      };

      dialog.querySelector(".confirm-tool").addEventListener("click", () => {
        removeDialog();
        resolve(true);
      });

      dialog.querySelector(".cancel-tool").addEventListener("click", () => {
        removeDialog();
        resolve(false);
      });

      dialog.querySelector(".not-again").addEventListener("click", () => {
        removeDialog();
        PREFS.conformation = false;
        resolve(true);
      });

      document.body.appendChild(dialog);
    });
  }

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
    clearBtn.hidden = history.length === 0;
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
    refreshBuildBar();
  }

  modeButtons.forEach((btn) => btn.addEventListener("click", () => setMode(btn.dataset.mode)));

  clearBtn.addEventListener("click", () => {
    if (state.streaming) state.abortController?.abort();
    browseBotLibraryLLM.clearData();
    state.pendingRefs = [];
    renderChips();
    renderHistory();
    input.focus();
  });

  ui.querySelector('[data-action="settings"]').addEventListener("click", () =>
    SettingsModal.show()
  );

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
    if (slash)
      return { kind: "slash", filter: slash[2].toLowerCase(), start: caret - slash[2].length - 1 };
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
      `<div class="chat-message chat-message-loading"><div class="message-content">${icons.toolLoading}Loading...</div></div>`
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
        text: page?.textContent?.trim()
          ? page.textContent
          : `(No readable text extracted from this tab.)`,
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
    clearBtn.hidden = false;
    input.value = "";
    state.pendingRefs = [];
    renderChips();
    hidePopup();

    state.abortController = new AbortController();
    setStreaming(true);

    let aiWrap = parseElement(
      `<div class="chat-message chat-message-ai">
        <div class="message-content"><div class="markdown-body"></div></div>
      </div>`
    );
    let contentDiv = aiWrap.querySelector(".markdown-body");
    messagesEl.appendChild(aiWrap);
    scrollDown();

    const toolEntries = [];
    const toolRows = new Map();
    let toolGen = 0;
    let shownGen = 0;
    let segmentText = "";
    const clearToolEntries = () => {
      for (const el of toolEntries.splice(0)) el.remove();
      toolRows.clear();
    };
    const startSegment = () => {
      aiWrap = parseElement(
        `<div class="chat-message chat-message-ai">
          <div class="message-content"><div class="markdown-body"></div></div>
        </div>`
      );
      contentDiv = aiWrap.querySelector(".markdown-body");
      messagesEl.appendChild(aiWrap);
      shownGen = toolGen;
      segmentText = "";
    };
    const updateToolCallUI = (toolName, status) => {
      toolGen++;
      let row = toolRows.get(toolName);
      if (!row) {
        const el = parseElement(`
          <div class="tool-call-status" data-tool-name="${escapeXmlAttribute(toolName)}" data-status="${status}">
            <span class="tool-call-icon"></span>
            <span class="tool-call-name">${escapeXmlAttribute(toolName)}</span>
            <span class="tool-call-count" hidden></span>
            <span class="tool-call-declined" hidden>Declined</span>
          </div>`);
        row = { el, count: 0 };
        toolRows.set(toolName, row);
        toolEntries.push(el);
        messagesEl.appendChild(el);
      }
      row.el.dataset.status = status;
      row.el.querySelector(".tool-call-icon").innerHTML =
        icons["tool" + status[0].toUpperCase() + status.slice(1)] || "";
      if (status !== "loading") row.count++;
      row.el.querySelector(".tool-call-declined").hidden = status !== "declined";
      const countEl = row.el.querySelector(".tool-call-count");
      if (row.count > 1) {
        countEl.textContent = `x ${row.count}`;
        countEl.hidden = false;
      }
      scrollDown();
    };
    try {
      const resultPromise = browseBotLibraryLLM.sendMessage(prompt, {
        refs,
        abortSignal: state.abortController.signal,
        confirmTool: (names, detail) => createToolConfirmationDialog(names, detail),
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
          } else if (result.text.trim() === "" && toolGen > 0) {
            contentDiv.appendChild(parseMD("*(Tool actions performed)*"));
          } else if (result.text.trim() === "" && toolGen === 0) {
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
        try {
          for await (const delta of result.textStream) {
            if (loadingIndicator.parentNode) loadingIndicator.remove();
            if (toolGen !== shownGen) startSegment();
            segmentText += delta;
            renderStreamText(contentDiv, segmentText);
            scrollDown();
          }
          try {
            const finalText = await result.text;
            if (typeof finalText === "string") segmentText = finalText;
          } catch (e) {
            PREFS.debugError("Failed to resolve final stream text:", e.message);
          }
          renderStreamText(contentDiv, segmentText);
          if (isProviderBalanceExhausted(browseBotLibraryLLM.currentProvider, segmentText)) {
            contentDiv.appendChild(
              parseMD(
                "\n\n*Pollinations ran out of free credits. Add a free API key in BrowseBot settings, then try again.*"
              )
            );
          } else if (segmentText.trim() === "" && toolGen > 0) {
            contentDiv.innerHTML = "";
            contentDiv.appendChild(parseMD("*(Tool actions performed)*"));
          } else if (segmentText.trim() === "" && toolGen === 0) {
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
      clearToolEntries();
      refreshBuildBar();
      scrollDown();
    }
  }

  renderHistory();
  refreshBuildBar();
  setLibraryWidth(host);
  startWidthGuard();
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
        return html`<zen-library-browsebot-section
          class="zen-library-section"
          data-section="browsebot"
          .library=${library}></zen-library-browsebot-section>`;
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

function aiIconNode() {
  try {
    const node = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<path class="bb-library-tab-icon-shape" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.427 8.084C12.801 5.843 12.323 4 11 4S9.2 5.843 8.573 8.084c-.254.91-.382 1.366-.753 1.737c-.37.37-.826.498-1.736.752C3.843 11.2 2 11.677 2 13s1.843 1.8 4.084 2.427c.91.254 1.366.381 1.736.752c.371.371.499.826.753 1.737C9.2 20.157 9.678 22 11 22s1.8-1.843 2.427-4.084c.255-.91.382-1.366.753-1.737c.37-.37.826-.498 1.736-.752C18.157 14.8 20 14.323 20 13s-1.843-1.8-4.084-2.427c-.91-.254-1.366-.382-1.736-.752c-.371-.371-.498-.826-.753-1.737M19.5 2.938V4.5m0 0v1.563m0-1.563h-1.25m1.25 0h1.25m1.25 0l-.452-.15c-.698-.233-1.047-.35-1.298-.6c-.25-.25-.367-.6-.6-1.298L19.5 2l-.15.452c-.233.698-.35 1.047-.6 1.298c-.25.25-.6.367-1.298.6L17 4.5l.452.15c.698.233 1.047.35 1.298.6c.25.25.367.6.6 1.298L19.5 7l.15-.452c.233-.698.35-1.047.6-1.298c.25-.25.6-.367 1.298-.6z" />
</svg>`,
      "image/svg+xml"
    ).documentElement;
    if (!node || node.localName !== "svg") return null;
    node.removeAttribute("xmlns");
    node.setAttribute("class", "bb-library-tab-icon");
    return node;
  } catch {
    return null;
  }
}

function findSectionTab(host) {
  try {
    const root = host.shadowRoot || host;
    return root?.querySelector?.(`.zen-library-tab[data-section="browsebot"]`) || null;
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
    const iconBox = tab.querySelector?.(".zen-library-tab-icon");
    if (iconBox && !iconBox.querySelector(".bb-library-tab-icon")) {
      const icon = aiIconNode();
      if (icon) iconBox.replaceChildren(icon);
    }
    const labelDone =
      !tab.querySelector?.("label") || tab.querySelector("label").textContent === "AI";
    const iconDone =
      !tab.querySelector?.(".zen-library-tab-icon") ||
      !!tab.querySelector(".zen-library-tab-icon").querySelector(".bb-library-tab-icon");
    return !!(labelDone && iconDone);
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
  try {
    if (host.activeTab === "browsebot" && PREFS.libraryEnabled) {
      if (host.style.getPropertyValue("--zen-library-content-width") !== "640px") {
        host.style.setProperty("--zen-library-content-width", "640px");
      }
    }
  } catch {}
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
    if (--attempts > 0) {
      setTimeout(tick, 100);
    } else {
      PREFS.debugLog("Library: gave up setting section tab, host or section missing.");
    }
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
  PREFS.debugLog("Library: init.");
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
      const open = isLibraryOpen();
      PREFS.debugLog(`Library: toggle, open=${open}, tab=${host?.activeTab}.`);
      if (open && host?.activeTab === "browsebot") {
        PREFS.debugLog("Library: toggle closing.");
        return closeLibrary();
      }
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
      const open = isLibraryOpen();
      PREFS.debugLog(`Library: open, open=${open}, tab=${host?.activeTab}.`);
      if (open && host?.activeTab === "browsebot") return true;
      if (!open && !hasLibraryFeature()) return showLibraryMissing();
      if (!open) clickLibraryButton();
      setSectionTabSoon();
      return true;
    } catch (e) {
      PREFS.debugError("Could not open Zen Library:", e);
    }
    return showLibraryMissing();
  },
};

window.browseBotLibrary = browseBotLibrary;
