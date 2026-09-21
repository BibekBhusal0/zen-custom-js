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

    if (!doc.querySelector("ytd-transcript-renderer")) {
      const button = doc.querySelector('button[aria-label="Show transcript"]');
      if (!button)
        throw new Error('"Show transcript" button not found. Transcript may not be available.');
      button.click();
      await waitForSelectorWithObserver("ytd-transcript-renderer", 5000);
    }

    await waitForSelectorWithObserver("ytd-transcript-segment-renderer .segment-text", 5000);

    const rows = Array.from(doc.querySelectorAll("ytd-transcript-segment-renderer"));
    if (!rows.length) throw new Error("Transcript segments found, but all are empty.");

    const transcript = rows
      .map((row) => {
        const text = row.querySelector(".segment-text")?.textContent.trim() || "";
        const time = row.querySelector(".segment-timestamp")?.textContent.trim() || "";
        if (!text) return "";
        return time ? `[${time}] ${text}` : text;
      })
      .filter(Boolean)
      .join("\n");
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
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const desc = content.document.querySelector(
      "#description-inline-expander .yt-core-attributed-string, #description .content, .ytd-expandable-video-description-body-renderer .yt-core-attributed-string"
    );
    return desc ? desc.textContent.trim() : "Description not found.";
  };

  const getYoutubeComments = (count = 10) => {
    const comments = Array.from(
      content.document.querySelectorAll("ytd-comment-thread-renderer #content-text")
    ).slice(0, count);
    if (comments.length === 0) return ["No comments found or they are not loaded yet."];
    return comments.map((c) => c.textContent.trim());
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
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
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

    GetYoutubeComments: ({ count }) => {
      return { comments: getYoutubeComments(count) };
    },
  };

  addMessageListener("FindbarAI:Command", async function (msg) {
    const cmd = msg.data.command;
    const data = msg.data.data || {};
    try {
      const result = await handlers[cmd](data);
      sendAsyncMessage("FindbarAI:Result", { command: cmd, result });
    } catch (e) {
      sendAsyncMessage("FindbarAI:Result", { command: cmd, result: { error: e.message } });
    }
  });
}

const frameScriptText = `(${frameScript})();`;
const frameScriptURL = "data:application/javascript;charset=utf-8," + encodeURIComponent(frameScriptText);

const ensureFrameScript = (browser) => {
  if (!browser?.messageManager || browser._findbarAIInjected) return;
  browser.messageManager.loadFrameScript(frameScriptURL, false);
  browser._findbarAIInjected = true;
};

const sendToBrowser = (browser, cmd, data = {}) => {
  ensureFrameScript(browser);
  const mm = browser.messageManager;
  if (!mm) return Promise.reject(new Error("No message manager available."));
  return new Promise((resolve, reject) => {
    const listener = (msg) => {
      if (msg.data.command === cmd) {
        mm.removeMessageListener("FindbarAI:Result", listener);
        if (msg.data.result && msg.data.result.error) {
          reject(new Error(msg.data.result.error));
        } else {
          resolve(msg.data.result);
        }
      }
    };
    mm.addMessageListener("FindbarAI:Result", listener);
    mm.sendAsyncMessage("FindbarAI:Command", { command: cmd, data });
  });
};

export const messageManagerAPI = {
  send(cmd, data = {}) {
    if (!gBrowser || !gBrowser.selectedBrowser) {
      PREFS.debugError("No message manager available.");
      return Promise.reject(new Error("No message manager available."));
    }
    return sendToBrowser(gBrowser.selectedBrowser, cmd, data);
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

  async getHTMLContent() {
    return this.send("GetPageHTMLContent").catch((error) => {
      PREFS.debugError("Failed to get page HTML content:", error);
      return {};
    });
  },

  async getSelectedText() {
    return this.send("GetSelectedText")
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

  async getPageTextContent(trimWhiteSpace = true) {
    return this.send("GetPageTextContent", { trimWhiteSpace }).catch((error) => {
      PREFS.debugError("Failed to get page text content:", error);
      return this.getUrlAndTitle();
    });
  },

  async clickElement(selector) {
    return this.send("ClickElement", { selector }).catch((error) => {
      PREFS.debugError(`Failed to click element with selector "${selector}":`, error);
      return { error: `Failed to click element with selector "${selector}".` };
    });
  },

  async fillForm(selector, value) {
    return this.send("FillForm", { selector, value }).catch((error) => {
      PREFS.debugError(`Failed to fill form with selector "${selector}":`, error);
      return { error: `Failed to fill form with selector "${selector}".` };
    });
  },

  async seekVideo(seconds) {
    return this.send("SeekVideo", { seconds }).catch((error) => {
      PREFS.debugError(`Failed to seek video to ${seconds}s:`, error);
      return { error: `Failed to seek video.` };
    });
  },

  async getYoutubeTranscript() {
    return this.send("GetYoutubeTranscript").catch((error) => {
      PREFS.debugError("Failed to get youtube transcript:", error);
      return { error: `Failed to get youtube transcript: ${error.message}` };
    });
  },

  async getYoutubeDescription() {
    return this.send("GetYoutubeDescription").catch((error) => {
      PREFS.debugError("Failed to get youtube description:", error);
      return { error: `Failed to get youtube description: ${error.message}` };
    });
  },

  async getYoutubeComments(count) {
    return this.send("GetYoutubeComments", { count }).catch((error) => {
      PREFS.debugError("Failed to get youtube comments:", error);
      return { error: `Failed to get youtube comments: ${error.message}` };
    });
  },
};
