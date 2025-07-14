export class FindbarAIWindowManagerChild extends JSWindowActorChild {
  constructor() {
    super();
  }

  // handleEvent(event) {
  //   debugLog(`findbar: child handling event: ${event.type}`);
  //   if (event.type === "DOMContentLoaded") {
  //     this.sendAsyncMessage("FindbarAI:ContentLoaded", {
  //       url: this.document.location.href,
  //       title: this.document.title,
  //     });
  //   }
  // }

  debugLog(...args) {
    this.browsingContext.top.window.console.log("[findbar-ai] windowManager.js (Child):", ...args);
  }

  debugError(...args) {
    this.browsingContext.top.window.console.error(
      "[findbar-ai] windowManager.js (Child Error):",
      ...args
    );
  }

  async receiveMessage(message) {
    this.debugLog(`Received message: ${message.name}`);
    switch (message.name) {
      case "FindbarAI:GetPageHTMLContent":
        return {
          content: this.extractRelevantContent(),
          url: this.document.location.href,
          title: this.document.title,
        };

      case "FindbarAI:GetSelectedText":
        const selection = this.contentWindow.getSelection();
        return {
          selectedText: selection.toString(),
          hasSelection: !selection.isCollapsed,
        };

      case "FindbarAI:GetPageTextContent":
        return {
          textContent: this.extractTextContent(message?.data?.trimWhiteSpace),
          url: this.document.location.href,
          title: this.document.title,
        };

      case "FindbarAI:ClickElement":
        try {
          const { selector } = message.data;
          const element = this.document.querySelector(selector);
          if (!element) {
            return { error: `Element with selector "${selector}" not found.` };
          }
          element.click();
          return { result: `Clicked element with selector "${selector}".` };
        } catch (error) {
          this.debugError(`Error clicking element:`, error);
          return { error: `Failed to click element: ${error}` };
        }

      case "FindbarAI:FillForm":
        try {
          const { selector, value } = message.data;
          const element = this.document.querySelector(selector);
          if (!element) {
            return { error: `Element with selector "${selector}" not found.` };
          }
          element.value = value;
          element.dispatchEvent(new Event("input", { bubbles: true })); // Trigger input event for React and other frameworks
          return {
            result: `Filled element with selector "${selector}" with value "${value}".`,
          };
        } catch (error) {
          this.debugError(`Error filling form:`, error);
          return { error: `Failed to fill form: ${error}` };
        }

      case "FindbarAI:GetYoutubeTranscript":
        try {
          const transcript = await this.getYouTubeTranscript();
          return { transcript };
        } catch (err) {
          this.debugError("Transcript extraction failed:", err);
          return { error: err.message };
        }

      default:
        this.debugLog(`Unhandled message: ${message.name}`);
    }
  }

  async getYouTubeTranscript() {
    const win = this.browsingContext.top.window;
    const doc = this.document;

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
      this.debugLog("YouTube transcript extracted successfully.");
      return transcript;
    } catch (err) {
      this.debugError("Transcript extraction failed:", err);
      return { error: err.message };
    }
  }

  extractRelevantContent() {
    const clonedBody = this.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, img, video, audio, object, embed, applet, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());
    return clonedBody.innerHTML;
  }

  extractTextContent(trimWhiteSpace = true) {
    this.debugLog("extractTextContent called");
    const clonedBody = this.document.body.cloneNode(true);
    const elementsToRemove = clonedBody.querySelectorAll(
      "script, style, meta, noscript, iframe, svg, canvas, input, textarea, select, img, video, audio, object, embed, applet, form, button, link, head"
    );
    elementsToRemove.forEach((el) => el.remove());

    // Replace <br> elements with a newline character.
    clonedBody.querySelectorAll("br").forEach((br) => {
      br.replaceWith("\n");
    });

    // Append a newline to block-level elements to ensure separation.
    const blockSelector =
      "p, div, li, h1, h2, h3, h4, h5, h6, tr, article, section, header, footer, aside, main, blockquote, pre";
    clonedBody.querySelectorAll(blockSelector).forEach((el) => {
      el.append("\n");
    });

    const textContent = clonedBody.textContent;

    if (trimWhiteSpace) {
      return textContent.replace(/\s+/g, " ").trim();
    }

    // Preserve newlines, but clean up other whitespace.
    return textContent
      .replace(/[ \t\r\f\v]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n+/g, "\n")
      .trim();
  }
}
