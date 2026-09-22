import { parseMD } from "./markdown.js";

// parseMD with convertHTML=false returns a string, not an element.
function renderStreamText(contentDiv, fullText) {
  try {
    contentDiv.innerHTML = parseMD(fullText, false);
  } catch (e) {
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
};
