import { parseMD } from "./markdown.js";
import { parseElement } from "../../utils/parse.js";

function messageCopyText(wrap) {
  return (wrap?.querySelector(".message-content")?.textContent || "").trim();
}

function flashActionIcon(btn, src, ms = 1200) {
  const img = btn?.querySelector("img");
  if (!img) return;
  const prev = img.getAttribute("src");
  img.setAttribute("src", src);
  setTimeout(() => {
    if (btn.isConnected) img.setAttribute("src", prev);
  }, ms);
}

async function copyChatMessage(wrap, btn) {
  const text = messageCopyText(wrap);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (btn) flashActionIcon(btn, "chrome://global/skin/icons/check.svg");
  } catch {}
}

function buildMessageActions({ regenerate = true } = {}) {
  const actions = parseElement(`<div class="bb-msg-actions"></div>`);
  const copyBtn = parseElement(
    `<button class="bb-msg-copy zenux-icon-btn" tooltiptext="Copy message"><img src="chrome://global/skin/icons/edit-copy.svg" width="14" height="14" alt="" /></button>`
  );
  actions.appendChild(copyBtn);
  if (regenerate) {
    const regenBtn = parseElement(
      `<button class="bb-msg-regen zenux-icon-btn" tooltiptext="Regenerate response"><img src="chrome://global/skin/icons/reload.svg" width="14" height="14" alt="" /></button>`
    );
    actions.appendChild(regenBtn);
  }
  return actions;
}

function attachMessageActions(wrap, { regenerate = true, onRegenerate } = {}) {
  if (!wrap || wrap.querySelector(":scope > .bb-msg-actions")) return;
  const actions = buildMessageActions({ regenerate });
  actions.querySelector(".bb-msg-copy")?.addEventListener("click", (e) => {
    e.stopPropagation();
    copyChatMessage(wrap, e.currentTarget);
  });
  if (regenerate) {
    actions.querySelector(".bb-msg-regen")?.addEventListener("click", (e) => {
      e.stopPropagation();
      onRegenerate?.(wrap, e.currentTarget);
    });
  }
  wrap.appendChild(actions);
}

// parseMD with convertHTML=false returns a string, not an element.
function renderStreamText(contentDiv, fullText) {
  try {
    contentDiv.innerHTML = parseMD(fullText, false);
  } catch {
    contentDiv.textContent = fullText + "\n\n[Error rendering markdown]";
  }
}

function extractErrorText(e) {
  let errorText = e?.message || String(e);
  try {
    const parsed = JSON.parse(e.message);
    errorText = parsed?.error?.message || parsed?.message || errorText;
  } catch {}
  return errorText;
}

function isProviderBalanceExhausted(provider, text) {
  return (
    provider?.name === "pollinations" &&
    typeof provider.isBalanceExhaustedText === "function" &&
    provider.isBalanceExhaustedText(text)
  );
}

function setStreamingControls({ sendBtn, stopBtn }, streaming, onIdle) {
  if (sendBtn) sendBtn.style.display = streaming ? "none" : "flex";
  if (stopBtn) stopBtn.style.display = streaming ? "flex" : "none";
  if (!streaming && onIdle) onIdle();
}

function openChatLink(href) {
  try {
    openTrustedLinkIn(href, "tab");
  } catch {}
}

async function copyChatCode(copyButton) {
  const codeEl = copyButton.closest(".zh-codeblock")?.querySelector("pre code");
  if (!codeEl) return;
  try {
    await navigator.clipboard.writeText(codeEl.textContent);
    copyButton.textContent = "Copied!";
  } catch {
    copyButton.textContent = "Copy failed";
  }
  setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1500);
}

function attachChatMessageHandlers(container, { onCitation } = {}) {
  container.addEventListener("click", async (e) => {
    const copyButton = e.target.closest?.(".zh-codeblock-copy");
    if (copyButton) {
      copyChatCode(copyButton);
      return;
    }
    if (onCitation) {
      const citation = e.target.closest?.(".citation-link");
      if (citation) {
        onCitation(citation, e);
        return;
      }
    }
    const anchor = e.target?.closest?.("a[href]");
    if (!anchor) return;
    e.preventDefault();
    openChatLink(anchor.href);
  });

  container.addEventListener("auxclick", (e) => {
    if (e.button === 1) {
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      e.preventDefault();
      openChatLink(anchor.href);
    }
  });

  container.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const copyButton = e.target.closest?.(".zh-codeblock-copy");
    if (copyButton) {
      e.preventDefault();
      copyChatCode(copyButton);
    }
  });
}

export {
  renderStreamText,
  extractErrorText,
  isProviderBalanceExhausted,
  setStreamingControls,
  openChatLink,
  copyChatCode,
  attachChatMessageHandlers,
  messageCopyText,
  copyChatMessage,
  buildMessageActions,
  attachMessageActions,
};
