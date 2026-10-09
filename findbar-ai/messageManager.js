import { PREFS } from "./utils/prefs.js";

async function frameScript() {
  const getUrlAndTitle = () => {
    return {
      url: content.location.href,
      title: content.document.title,
    };
  };

  const extractRelevantContent = () => {
    const clonedBody = content.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, img, video, audio, object, embed, applet, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());
    return clonedBody.innerHTML;
  };

  const extractTextContent = (trimWhiteSpace = true) => {
    const clonedBody = content.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, input, textarea, select, img, video, audio, object, embed, applet, form, button, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());

    clonedBody.querySelectorAll("br").forEach((br) => {
      br.replaceWith("\n");
    });

    const blockSelector =
      "p, div, li, h1, h2, h3, h4, h5, h6, tr, article, section, header, footer, aside, main, blockquote, pre";
    clonedBody.querySelectorAll(blockSelector).forEach((el) => {
      el.append("\n");
    });

    const textContent = clonedBody.textContent;

    if (trimWhiteSpace) {
      return textContent.replace(/\s+/g, " ").trim();
    }

    return textContent
      .replace(/[ \t\r\f\v]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n+/g, "\n")
      .trim();
  };

  async function getYouTubeTranscript() {
    const win = content;
    const doc = content.document;

    async function ensureBodyAvailable() {
      if (doc.body) return;
      await new Promise((resolve) => {
        const check = () => {
          if (doc.body) resolve();
          else win.setTimeout(check, 50);
        };
        check();
      });
    }

    function waitForSelectorWithObserver(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        ensureBodyAvailable()
          .then(() => {
            const el = doc.querySelector(selector);
            if (el) return resolve(el);

            const observer = new win.MutationObserver(() => {
              const el = doc.querySelector(selector);
              if (el) {
                observer.disconnect();
                resolve(el);
              }
            });

            observer.observe(doc.body, {
              childList: true,
              subtree: true,
            });

            win.setTimeout(() => {
              observer.disconnect();
              reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
          })
          .catch((e) => {
            reject(new Error(`waitForSelectorWithObserver failed: ${e.message}`));
          });
      });
    }

    const segmentSelector =
      "transcript-segment-view-model, ytd-transcript-segment-renderer .segment-text";
    const buttons = Array.from(doc.querySelectorAll('button[aria-label="Show transcript"]'));
    const button = buttons.find((b) => b.offsetParent !== null) || buttons[0];
    if (button) {
      try {
        button.click();
      } catch {}
    } else if (
      !doc.querySelector("ytd-transcript-renderer") &&
      !doc.querySelector(segmentSelector)
    ) {
      throw new Error('"Show transcript" button not found. Transcript may not be available.');
    }

    await waitForSelectorWithObserver(segmentSelector, 8000);

    const parseTranscriptSegments = () => {
      const modern = Array.from(doc.querySelectorAll("transcript-segment-view-model"))
        .map((seg) => {
          const time =
            seg.querySelector(".ytwTranscriptSegmentViewModelTimestamp")?.textContent.trim() || "";
          const text =
            seg.querySelector('span[role="text"]')?.textContent.trim().replace(/\s+/g, " ") || "";
          if (!text) return "";
          return time ? `[${time}] ${text}` : text;
        })
        .filter(Boolean)
        .join("\n");
      if (modern) return modern;
      return Array.from(doc.querySelectorAll("ytd-transcript-segment-renderer"))
        .map((row) => {
          const text = row.querySelector(".segment-text")?.textContent.trim() || "";
          const time = row.querySelector(".segment-timestamp")?.textContent.trim() || "";
          if (!text) return "";
          return time ? `[${time}] ${text}` : text;
        })
        .filter(Boolean)
        .join("\n");
    };
    const transcript = parseTranscriptSegments();
    if (!transcript) throw new Error("Transcript segments found, but all are empty.");
    return transcript;
  }

  const getYoutubeDescription = async () => {
    const descriptionContainer = content.document.querySelector("#description-inline-expander");
    if (descriptionContainer) {
      const expandButton =
        descriptionContainer.querySelector("#expand") ||
        descriptionContainer.querySelector("#expand-button") ||
        descriptionContainer.querySelector("tp-yt-paper-button#more");
      // Check if button is visible, as it's hidden when expanded
      if (expandButton && expandButton.offsetParent !== null) {
        expandButton.click();
        await new Promise((resolve) => content.setTimeout(resolve, 0));
      }
    }

    const selectors = [
      "#description-inline-expander .yt-core-attributed-string",
      "#description-inline-expander yt-attributed-string",
      "#description-item .yt-core-attributed-string",
      "#description-item yt-attributed-string",
      "#description .content",
      ".ytd-expandable-video-description-body-renderer .yt-core-attributed-string",
      "ytd-expander#description yt-attributed-string",
    ];
    for (const selector of selectors) {
      const text = content.document.querySelector(selector)?.textContent.trim();
      if (text) return text;
    }
    throw new Error(
      "No YouTube description found. This page may not be a YouTube video, or the description is empty."
    );
  };

  const handlers = {
    GetPageHTMLContent: () => {
      return {
        content: extractRelevantContent(),
        url: getUrlAndTitle().url,
        title: getUrlAndTitle().title,
      };
    },

    GetSelectedText: () => {
      const selection = content.getSelection();
      return {
        selectedText: selection.toString(),
        hasSelection: !selection.isCollapsed,
        ...getUrlAndTitle(),
      };
    },

    GetPageTextContent: ({ trimWhiteSpace }) => {
      return {
        textContent: extractTextContent(trimWhiteSpace),
        ...getUrlAndTitle(),
      };
    },

    ClickElement: ({ selector }) => {
      const element = content.document.querySelector(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found.`);
      }
      element.click();
      return { result: `Clicked element with selector "${selector}".` };
    },

    FillForm: ({ selector, value }) => {
      const element = content.document.querySelector(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found.`);
      }
      if (!("value" in element)) {
        throw new Error(
          `Element with selector "${selector}" is not an input element (<${element.tagName.toLowerCase()}>). Use a selector for an input, textarea, or select element.`
        );
      }
      try {
        element.focus();
      } catch {}
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return {
        result: `Filled element with selector "${selector}" with value "${value}".`,
      };
    },

    SeekVideo: ({ seconds }) => {
      const video = content.document.querySelector("video");
      if (!video) {
        throw new Error("No video element found on this page.");
      }
      video.currentTime = Math.max(0, Number(seconds) || 0);
      video.scrollIntoView({ block: "center" });
      return { result: `Seeked to ${seconds}s.` };
    },

    GetYoutubeTranscript: async () => {
      const transcript = await getYouTubeTranscript();
      return { transcript };
    },

    GetYoutubeDescription: async () => {
      const description = await getYoutubeDescription();
      return { description };
    },
  };

  addMessageListener("FindbarAI:Command", async function (msg) {
    const cmd = msg.data.command;
    const data = msg.data.data || {};
    const requestId = msg.data.requestId;
    try {
      const result = await handlers[cmd](data);
      sendAsyncMessage("FindbarAI:Result", { command: cmd, requestId, result });
    } catch (e) {
      sendAsyncMessage("FindbarAI:Result", {
        command: cmd,
        requestId,
        result: { error: e.message },
      });
    }
  });
}

const frameScriptText = `(${frameScript})();`;
const frameScriptURL =
  "data:application/javascript;charset=utf-8," + encodeURIComponent(frameScriptText);

const ensureFrameScript = (browser) => {
  if (!browser?.messageManager || browser._findbarAIInjected) return;
  browser.messageManager.loadFrameScript(frameScriptURL, false);
  browser._findbarAIInjected = true;
};

let requestCounter = 0;

function isYouTubeWatchUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(String(url).trim());
    const host = u.hostname
      .replace(/^www\./, "")
      .replace(/^m\./, "")
      .replace(/^music\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0].length > 0;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return !!u.searchParams.get("v");
      return /^\/(embed|shorts|live|v)\/[^/?]+/.test(u.pathname);
    }
  } catch {
    return false;
  }
  return false;
}

// Tool executors prepend the LLM's args object, so find opts by shape instead of position.
function pickOpts(...args) {
  for (const a of args) {
    if (a && typeof a === "object" && ("signal" in a || "timeout" in a)) return a;
  }
  return undefined;
}

const sendToBrowser = (browser, cmd, data = {}, opts = {}) => {
  const { timeout = 15000, signal } = opts || {};
  ensureFrameScript(browser);
  const mm = browser.messageManager;
  if (!mm) return Promise.reject(new Error("No message manager available."));
  if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  const requestId = `${Date.now().toString(36)}-${requestCounter++}`;
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      mm.removeMessageListener("FindbarAI:Result", listener);
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const settle = (fn, val) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(val);
    };
    const onAbort = () => settle(reject, new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => {
      settle(
        reject,
        new Error(
          `Timed out waiting for a page response (${cmd}, ${timeout}ms). The tab may be unloaded, still loading, or on a page that blocks content scripts.`
        )
      );
    }, timeout);
    const listener = (msg) => {
      const d = msg.data || {};
      // Older injected scripts omit requestId; accept those by command.
      if (d.requestId !== undefined && d.requestId !== requestId) return;
      if (d.command !== cmd) return;
      if (d.result && d.result.error) {
        settle(reject, new Error(d.result.error));
      } else {
        settle(resolve, d.result);
      }
    };
    mm.addMessageListener("FindbarAI:Result", listener);
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      mm.sendAsyncMessage("FindbarAI:Command", { command: cmd, data, requestId });
    } catch (e) {
      settle(reject, e);
    }
  });
};

export const messageManagerAPI = {
  send(cmd, data = {}, opts) {
    if (!gBrowser || !gBrowser.selectedBrowser) {
      PREFS.debugError("No message manager available.");
      return Promise.reject(new Error("No message manager available."));
    }
    return sendToBrowser(gBrowser.selectedBrowser, cmd, data, opts);
  },

  async getPageTextContentForTab(tab, trimWhiteSpace = true) {
    const browser = tab?.linkedBrowser;
    if (!browser?.messageManager) return null;
    try {
      const result = await sendToBrowser(browser, "GetPageTextContent", { trimWhiteSpace });
      return {
        textContent: result?.textContent || "",
        url: result?.url || browser.currentURI?.spec || "",
        title: result?.title || tab.label || "",
      };
    } catch (error) {
      PREFS.debugError("Failed to get page text content for tab:", error);
      return null;
    }
  },

  getUrlAndTitle() {
    return {
      url: gBrowser.currentURI.spec,
      title: gBrowser.selectedBrowser.contentTitle,
    };
  },

  async getHTMLContent(...rest) {
    return this.send("GetPageHTMLContent", {}, pickOpts(...rest)).catch((error) => {
      PREFS.debugError("Failed to get page HTML content:", error);
      return {};
    });
  },

  async getSelectedText(...rest) {
    return this.send("GetSelectedText", {}, pickOpts(...rest))
      .then((result) => {
        if (!result || !result.hasSelection) {
          return this.getUrlAndTitle();
        }
        return result;
      })
      .catch((error) => {
        PREFS.debugError("Failed to get selected text:", error);
        return this.getUrlAndTitle();
      });
  },

  async getPageTextContent(trimWhiteSpace = true, ...rest) {
    return this.send(
      "GetPageTextContent",
      { trimWhiteSpace },
      pickOpts(trimWhiteSpace, ...rest)
    ).catch((error) => {
      PREFS.debugError("Failed to get page text content:", error);
      return this.getUrlAndTitle();
    });
  },

  async clickElement(selector, ...rest) {
    return this.send("ClickElement", { selector }, pickOpts(selector, ...rest)).catch((error) => {
      PREFS.debugError(`Failed to click element with selector "${selector}":`, error);
      return { error: `Failed to click element with selector "${selector}".` };
    });
  },

  async fillForm(selector, value, ...rest) {
    return this.send("FillForm", { selector, value }, pickOpts(selector, value, ...rest)).catch(
      (error) => {
        PREFS.debugError(`Failed to fill form with selector "${selector}":`, error);
        return { error: `Failed to fill form with selector "${selector}".` };
      }
    );
  },

  async seekVideo(seconds) {
    return this.send("SeekVideo", { seconds }).catch((error) => {
      PREFS.debugError(`Failed to seek video to ${seconds}s:`, error);
      return { error: `Failed to seek video.` };
    });
  },

  currentUrlIsYouTubeVideo() {
    try {
      return isYouTubeWatchUrl(this.getUrlAndTitle().url);
    } catch {
      return false;
    }
  },

  async getYoutubeTranscript(...rest) {
    if (!this.currentUrlIsYouTubeVideo()) {
      return {
        error:
          "Current page is not a YouTube video. Only use this tool on youtube.com/watch pages.",
      };
    }
    return this.send("GetYoutubeTranscript", {}, { timeout: 25000, ...pickOpts(...rest) }).catch(
      (error) => {
        PREFS.debugError("Failed to get youtube transcript:", error);
        return { error: `Failed to get youtube transcript: ${error.message}` };
      }
    );
  },

  async getYoutubeDescription(...rest) {
    if (!this.currentUrlIsYouTubeVideo()) {
      return {
        error:
          "Current page is not a YouTube video. Only use this tool on youtube.com/watch pages.",
      };
    }
    return this.send("GetYoutubeDescription", {}, pickOpts(...rest)).catch((error) => {
      PREFS.debugError("Failed to get youtube description:", error);
      return { error: `Failed to get youtube description: ${error.message}` };
    });
  },
};
