import { streamText, generateText, generateObject, stepCountIs } from "ai";
import { browseBotFindbar } from "../findbar-ai.uc.js";
import { z } from "zod";
import { claude, gemini, grok, mistral, ollama, openai, perplexity } from "./providers.js";
import { getTools, getToolSystemPrompt, toolNameMapping, toolGroups } from "./tools.js";
import { messageManagerAPI } from "../messageManager.js";
import PREFS, { debugLog, debugError } from "../utils/prefs.js";

const citationSchema = z.object({
  answer: z.string().describe("The conversational answer to the user's query."),
  citations: z
    .array(
      z.object({
        id: z
          .number()
          .describe(
            "Unique identifier for the citation, corresponding to the marker in the answer text."
          ),
        source_quote: z
          .string()
          .describe(
            "The exact, verbatim quote from the source text that supports the information."
          ),
      })
    )
    .describe("An array of citation objects from the source text."),
});

/**
 * A base class for interacting with language models.
 * It handles provider management, history, and provides generic methods
 * for text generation, streaming, and object generation.
 */
class LLM {
  constructor() {
    this.history = [];
    this.AVAILABLE_PROVIDERS = {
      claude: claude,
      gemini: gemini,
      grok: grok,
      mistral: mistral,
      ollama: ollama,
      openai: openai,
      perplexity: perplexity,
    };
  }

  get llmProvider() {
    return PREFS.llmProvider;
  }

  get currentProvider() {
    return (
      this.AVAILABLE_PROVIDERS[this.llmProvider || "gemini"] || this.AVAILABLE_PROVIDERS["gemini"]
    );
  }

  setProvider(providerName) {
    if (this.AVAILABLE_PROVIDERS[providerName]) {
      PREFS.llmProvider = providerName;
      debugLog(`Switched LLM provider to: ${providerName}`);
    } else {
      debugError(`Provider "${providerName}" not found.`);
    }
  }

  async getSystemPrompt() {
    // Base implementation. Should be overridden by extending classes.
    return "";
  }

  async generateText(options) {
    const { prompt, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      ...rest,
    };

    const result = await generateText(config);

    // Only update history if it wasn't overridden in the options
    if (!rest.messages) {
      this.history.push(...result.response.messages);
    }
    return result;
  }

  async streamText(options) {
    const { prompt, onFinish, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const self = this;
    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      ...rest,
      async onFinish(result) {
        // Only update history if it wasn't overridden in the options
        if (!rest.messages) {
          self.history.push(...result.response.messages);
        }
        if (onFinish) onFinish(result);
      },
    };
    return streamText(config);
  }

  async generateTextWithCitations(options) {
    const { prompt, ...rest } = options;
    if (prompt) {
      this.history.push({ role: "user", content: prompt });
    }

    const config = {
      model: this.currentProvider.getModel(),
      system: await this.getSystemPrompt(),
      messages: this.history,
      schema: citationSchema,
      ...rest,
    };

    const { object } = await generateObject(config);

    // Only update history if it wasn't overridden in the options
    if (!rest.messages) {
      this.history.push({ role: "assistant", content: JSON.stringify(object) });
    }
    return object;
  }

  getHistory() {
    return [...this.history];
  }

  clearData() {
    debugLog("Clearing LLM history and system prompt.");
    this.history = [];
  }

  getLastMessage() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }
}

/**
 * An extended LLM class specifically for the BrowseBot Findbar.
 * It manages application-specific states like agentic, streaming, citations,
 * and constructs the appropriate system prompts.
 */
class BrowseBotLLM extends LLM {
  constructor() {
    super();
    this.systemInstruction = "";
  }

  get agenticMode() {
    return PREFS.agenticMode;
  }
  get streamEnabled() {
    return PREFS.streamEnabled;
  }
  get citationsEnabled() {
    return PREFS.citationsEnabled;
  }
  get maxToolCalls() {
    return PREFS.maxToolCalls;
  }

  async updateSystemPrompt() {
    debugLog("Updating system prompt...");
    this.systemInstruction = await this.getSystemPrompt();
  }

  async getSystemPrompt() {
    let systemPrompt = `You are a helpful AI assistant integrated into Zen Browser, a minimal and modern fork of Firefox. Your primary purpose is to answer user questions based on the content of the current webpage.

## Your Instructions:
- Be concise, accurate, and helpful.`;

    if (this.agenticMode) {
      systemPrompt += `

## AGENTIC MODE ENABLED - TOOL USAGE:
You have access to browser functions. The user knows you have these abilities.
- **CRITICAL**: When you decide to call a tool, give short summary of what tool are you calling and why?
- Use tools when the user explicitly asks, or when it is the only logical way to fulfill their request (e.g., "search for...").
- When asked about your own abilities, describe the functions you can perform based on the tools listed below.
`;
      systemPrompt += await getToolSystemPrompt();
      systemPrompt += `
## More instructions for Running tools
- While running tool like \`openLink\` and \`newSplit\` make sure URL is valid.
- User will provide URL and title of current of webpage. If you need more context, use the \`getPageTextContent\` or \`getHTMLContent\` tools.
- When the user asks you to "read the current page", use the \`getPageTextContent()\` or \`getHTMLContent\` tool.
- If the user asks you to open a link by its text (e.g., "click the 'About Us' link"), you must first use \`getHTMLContent()\` to find the link's full URL, then use \`openLink()\` to open it.`;
    }

    if (this.citationsEnabled) {
      systemPrompt += `

## Citation Instructions
- **Output Format**: Your entire response **MUST** be a single, valid JSON object with two keys: \`"answer"\` and \`"citations"\`.
- **Answer**: The \`"answer"\` key holds the conversational text. Use Markdown Syntax for formatting like lists, bolding, etc.
- **Citations**: The \`"citations"\` key holds an array of citation objects.
- **When to Cite**: For any statement of fact that is directly supported by the provided page content, you **SHOULD** provide a citation. It is not mandatory for every sentence.
- **How to Cite**: In your \`"answer"\`, append a marker like \`[1]\`, \`[2]\`. Each marker must correspond to a citation object in the array.
- **CRITICAL RULES FOR CITATIONS**:
    1.  **source_quote**: This MUST be the **exact, verbatim, and short** text from the page content.
    2.  **Accuracy**: The \`"source_quote"\` field must be identical to the text on the page, including punctuation and casing.
    3.  **Multiple Citations**: If multiple sources support one sentence, format them like \`[1][2]\`, not \`[1,2]\`.
    4.  **Unique IDs**: Each citation object **must** have a unique \`"id"\` that matches its marker in the answer text.
    5.  **Short**: The source quote must be short no longer than one sentence and should not contain line brakes.
- **Do Not Cite**: Do not cite your own abilities, general greetings, or information not from the provided text. Make sure the text is from page text content not from page title or URL.
- **Tool Calls**: If you call a tool, you **must not** provide citations in the same turn.

### Citation Examples

Here are some examples demonstrating the correct JSON output format.

**Example 1: General Question with a List and Multiple Citations**
-   **User Prompt:** "What are the main benefits of using this library?"
-   **Your JSON Response:**
    \`\`\`json
    {
      "answer": "This library offers several key benefits:\n\n*   **High Performance**: It is designed to be fast and efficient for large-scale data processing [1].\n*   **Flexibility**: You can integrate it with various frontend frameworks [2].\n*   **Ease of Use**: The API is well-documented and simple to get started with [3].",
      "citations": [
        {
          "id": 1,
          "source_quote": "The new architecture provides significant performance gains, especially for large-scale data processing."
        },
        {
          "id": 2,
          "source_quote": "It is framework-agnostic, offering adapters for React, Vue, and Svelte."
        },
        {
          "id": 3,
          "source_quote": "Our extensive documentation and simple API make getting started a breeze."
        }
      ]
    }
    \`\`\`

**Example 2: A Sentence Supported by Two Different Sources**
-   **User Prompt:** "Tell me about the project's history."
-   **Your JSON Response:**
    \`\`\`json
    {
      "answer": "The project was initially created in 2021 [1] and later became open-source in 2022 [2].",
      "citations": [
        {
          "id": 1,
          "source_quote": "Development began on the initial prototype in early 2021."
        },
        {
          "id": 2,
          "source_quote": "We are proud to announce that as of September 2022, the project is fully open-source."
        }
      ]
    }
    \`\`\`

**Example 3: The WRONG way (What NOT to do)**
This is incorrect because it uses one citation \`[1]\` for three different facts. This is lazy and unhelpful.
-   **Your JSON Response (Incorrect):**
    \`\`\`json
    {
      "answer": "This project is a toolkit for loading custom JavaScript into the browser [1]. Its main features include a modern UI [1] and an API for managing hotkeys and notifications [1].",
      "citations": [
        {
          "id": 1,
          "source_quote": "...a toolkit for loading custom JavaScript... It has features like a modern UI... provides an API for hotkeys and notifications..."
        }
      ]
    }
    \`\`\`

**Example 4: The WRONG way (What NOT to do)**
This is incorrect because it uses one citation same id for all facts.
\`\`\`json
{
  "answer": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion [1]. It is built with Tiptap and Vercel AI SDK [1]. You can install it using npm [1]. Features include a slash menu, bubble menu, AI autocomplete, and image uploads [1].",
  "citations": [
    {
      "id": 1,
      "source_quote": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion."
    },
    {
      "id": 1,
      "source_quote": "Built with Tiptap + Vercel AI SDK."
    },
    {
      "id": 1,
      "source_quote": "Installation npm i novel"
    },
    {
      "id": 1,
      "source_quote": "Features Slash menu & bubble menu AI autocomplete (type ++ to activate, or select from slash menu) Image uploads (drag & drop / copy & paste, or select from slash menu)"
    }
  ]
}
\`\`\`

**Example 5: The correct format of previous example**
This example is correct, note that it contain unique \`id\`, and each in text citation match to each citation \`id\`.
\`\`\`json
{
  "answer": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion [1]. It is built with Tiptap and Vercel AI SDK [2]. You can install it using npm [3]. Features include a slash menu, bubble menu, AI autocomplete, and image uploads [4].",
  "citations": [
    {
      "id": 1,
      "source_quote": "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletion."
    },
    {
      "id": 2,
      "source_quote": "Built with Tiptap + Vercel AI SDK."
    },
    {
      "id": 3,
      "source_quote": "Installation npm i novel"
    },
    {
      "id": 4,
      "source_quote": "Features Slash menu & bubble menu AI autocomplete (type ++ to activate, or select from slash menu) Image uploads (drag & drop / copy & paste, or select from slash menu)"
    }
  ]
}
\`\`\`
`;
    }

    if (!this.agenticMode) {
      systemPrompt += `
- Strictly base all your answers on the webpage content provided below.
- If the user's question cannot be answered from the content, state that the information is not available on the page.

Here is the initial info about the current page:
`;
      const pageContext = await messageManagerAPI.getPageTextContent(!this.citationsEnabled);
      systemPrompt += JSON.stringify(pageContext);
    }
    return systemPrompt;
  }

  parseModelResponseText(responseText) {
    let answer = responseText;
    let citations = [];

    if (PREFS.citationsEnabled) {
      try {
        // Find the JSON part of the response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        const parsedContent = JSON.parse(jsonString);

        if (typeof parsedContent.answer === "string") {
          answer = parsedContent.answer;
          if (Array.isArray(parsedContent.citations)) {
            citations = parsedContent.citations;
          }
        } else {
          // Parsed JSON but 'answer' field is missing or not a string.
          debugLog("AI response JSON missing 'answer' field or not a string:", parsedContent);
        }
      } catch (e) {
        // JSON parsing failed, keep rawText as answer.
        debugError("Failed to parse AI message content as JSON:", e, "Raw Text:", responseText);
      }
    }
    return { answer, citations };
  }

  async sendMessage(prompt, abortSignal) {
    debugLog("Current history before sending:", this.history);

    if (this.citationsEnabled) {
      const object = await super.generateTextWithCitations({
        prompt,
        abortSignal,
      });

      if (browseBotFindbar?.findbar) {
        browseBotFindbar.findbar.history = this.getHistory();
      }
      return object;
    }

    if (!this.agenticMode) {
      if (this.streamEnabled) {
        const self = this;
        const streamResult = await super.streamText({ prompt, abortSignal });
        (async () => {
          await streamResult.text;
          if (browseBotFindbar?.findbar) {
            browseBotFindbar.findbar.history = self.getHistory();
          }
        })();
        return streamResult;
      } else {
        const result = await super.generateText({ prompt, abortSignal });
        if (browseBotFindbar?.findbar) {
          browseBotFindbar.findbar.history = this.getHistory();
        }
        return result;
      }
    }

    const shouldToolBeCalled = async (toolName) => {
      browseBotFindbar._createOrUpdateToolCallUI(
        browseBotFindbar._currentAIMessageDiv,
        toolName,
        "loading"
      );
      if (PREFS.conformation) {
        const friendlyName = toolNameMapping[toolName] || toolName;
        const confirmed = await browseBotFindbar.createToolConfirmationDialog([friendlyName]);
        if (!confirmed) {
          debugLog(`Tool execution for '${toolName}' cancelled by user.`);
          browseBotFindbar._createOrUpdateToolCallUI(
            browseBotFindbar._currentAIMessageDiv,
            toolName,
            "declined"
          );
          return false;
        }
      }
      return true;
    };

    const afterToolCall = (toolName, result) => {
      const status = result.error ? "error" : "success";
      browseBotFindbar._createOrUpdateToolCallUI(
        browseBotFindbar._currentAIMessageDiv,
        toolName,
        status,
        result.error
      );
    };

    const findbarToolGroups = Object.keys(toolGroups).filter(
      (group) => group !== "bookmarks" && group !== "misc"
    );
    const tools = getTools(findbarToolGroups, { shouldToolBeCalled, afterToolCall });

    const commonConfig = {
      prompt,
      tools,
      stopWhen: stepCountIs(this.maxToolCalls),
      abortSignal,
    };

    if (this.streamEnabled) {
      const self = this;
      return super.streamText({
        ...commonConfig,
        onFinish: () => {
          if (browseBotFindbar?.findbar) {
            browseBotFindbar.findbar.history = self.getHistory();
          }
        },
      });
    } else {
      const result = await super.generateText(commonConfig);
      if (browseBotFindbar?.findbar) {
        browseBotFindbar.findbar.history = this.getHistory();
      }
      return result;
    }
  }

  clearData() {
    super.clearData();
    this.systemInstruction = "";
  }
}

const browseBotFindbarLLM = new BrowseBotLLM();
window.browseBotFindabrLLM = browseBotFindbarLLM;
export { LLM, browseBotFindbarLLM };
