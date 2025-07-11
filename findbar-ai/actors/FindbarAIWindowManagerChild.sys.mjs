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
          content: this.document.documentElement.outerHTML,
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

      default:
        this.debugLog(`Unhandled message: ${message.name}`);
    }
  }

  extractTextContent(trimWhiteSpace = true) {
    this.debugLog("extractTextContent called");
    const clonedDocument = this.document.cloneNode(true);
    const elementsToRemove = clonedDocument.querySelectorAll(
      "script, style, noscript, iframe, svg, canvas, input, textarea, select"
    );
    elementsToRemove.forEach((el) => el.remove());

    // Replace <br> elements with a newline character.
    clonedDocument.querySelectorAll("br").forEach((br) => {
      br.replaceWith("\n");
    });

    // Append a newline to block-level elements to ensure separation.
    const blockSelector =
      "p, div, li, h1, h2, h3, h4, h5, h6, tr, article, section, header, footer, aside, main, blockquote, pre";
    clonedDocument.querySelectorAll(blockSelector).forEach((el) => {
      el.append("\n");
    });

    const textContent = clonedDocument.body.textContent;

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
