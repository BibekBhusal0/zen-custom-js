import { debugError } from "./utils/prefs.js";

function frameScript() {
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
      return new Promise(async (resolve, reject) => {
        try {
          await ensureBodyAvailable();
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
        } catch (e) {
          reject(new Error(`waitForSelectorWithObserver failed: ${e.message}`));
        }
      });
    }

    try {
      if (!doc.querySelector("ytd-transcript-renderer")) {
        const button = doc.querySelector('button[aria-label="Show transcript"]');
        if (!button)
          throw new Error('"Show transcript" button not found — transcript may not be available.');
        button.click();
        await waitForSelectorWithObserver("ytd-transcript-renderer", 5000);
      }

      await waitForSelectorWithObserver("ytd-transcript-segment-renderer .segment-text", 5000);

      const segments = Array.from(
        doc.querySelectorAll("ytd-transcript-segment-renderer .segment-text")
      );
      if (!segments.length) throw new Error("Transcript segments found, but all are empty.");

      const transcript = segments
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .join("\n");
      return transcript;
    } catch (err) {
      throw err;
    }
  }

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

    GetYoutubeTranscript: async () => {
      const transcript = await getYouTubeTranscript();
      return { transcript };
    },
  };

  addMessageListener("FindbarAI:Command", async function(msg) {
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

let currentMessageManager = null;

const updateMessageManager = () => {
  if (gBrowser && gBrowser.selectedBrowser) {
    const mm = gBrowser.selectedBrowser.messageManager;
    if (mm !== currentMessageManager) {
      currentMessageManager = mm;
      if (!gBrowser.selectedBrowser._findbarAIInjected) {
        const scriptText = `(${frameScript})();`;
        mm.loadFrameScript(
          "data:application/javascript;charset=utf-8," + encodeURIComponent(scriptText),
          false
        );
        gBrowser.selectedBrowser._findbarAIInjected = true;
      }
    }
  }
};

export const messageManagerAPI = {
  send(cmd, data = {}) {
    updateMessageManager();
    if (!currentMessageManager) {
      debugError("No message manager available.");
      return Promise.reject(new Error("No message manager available."));
    }

    return new Promise((resolve, reject) => {
      const listener = (msg) => {
        if (msg.data.command === cmd) {
          currentMessageManager.removeMessageListener("FindbarAI:Result", listener);
          if (msg.data.result && msg.data.result.error) {
            reject(new Error(msg.data.result.error));
          } else {
            resolve(msg.data.result);
          }
        }
      };
      currentMessageManager.addMessageListener("FindbarAI:Result", listener);
      currentMessageManager.sendAsyncMessage("FindbarAI:Command", { command: cmd, data });
    });
  },

  getUrlAndTitle() {
    return {
      url: gBrowser.currentURI.spec,
      title: gBrowser.selectedBrowser.contentTitle,
    };
  },

  async getHTMLContent() {
    try {
      return await this.send("GetPageHTMLContent");
    } catch (error) {
      debugError("Failed to get page HTML content:", error);
      return {};
    }
  },

  async getSelectedText() {
    try {
      const result = await this.send("GetSelectedText");
      if (!result || !result.hasSelection) {
        return this.getUrlAndTitle();
      }
      return result;
    } catch (error) {
      debugError("Failed to get selected text:", error);
      return this.getUrlAndTitle();
    }
  },

  async getPageTextContent(trimWhiteSpace = true) {
    try {
      return await this.send("GetPageTextContent", { trimWhiteSpace });
    } catch (error) {
      debugError("Failed to get page text content:", error);
      return this.getUrlAndTitle();
    }
  },

  async clickElement(selector) {
    try {
      return await this.send("ClickElement", { selector });
    } catch (error) {
      debugError(`Failed to click element with selector "${selector}":`, error);
      return { error: `Failed to click element with selector "${selector}".` };
    }
  },

  async fillForm(selector, value) {
    try {
      return await this.send("FillForm", { selector, value });
    } catch (error) {
      debugError(`Failed to fill form with selector "${selector}":`, error);
      return { error: `Failed to fill form with selector "${selector}".` };
    }
  },

  async getYoutubeTranscript() {
    try {
      return await this.send("GetYoutubeTranscript");
    } catch (error) {
      debugError("Failed to get youtube transcript:", error);
      return { error: `Failed to get youtube transcript: ${error.message}` };
    }
  },
};
