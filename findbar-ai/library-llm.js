import { LLM } from "./llm/index.js";
import { getTools, getToolSystemPrompt, toolNameMapping } from "./llm/tools.js";
import { BUILD_NO_CONFIRM, getBuildSystemPrompt } from "./llm/build-tools.js";
import { getInstalledMods, isBrowseBotAuthor } from "./utils/sine-mods.js";
import { messageManagerAPI } from "./messageManager.js";
import PREFS from "./utils/prefs.js";

const MODES = ["chat", "agent", "build"];

function truncate(text, limit) {
  if (!limit || limit <= 0) return text;
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "\n\n[Content truncated.]";
}

class BrowseBotLibraryLLM extends LLM {
  get mode() {
    return PREFS.libraryMode;
  }

  get isAgent() {
    return this.mode === "agent";
  }

  get isBuild() {
    return this.mode === "build";
  }

  async getSystemPrompt() {
    let systemPrompt = "";

    const modePrompt = PREFS.librarySystemPromptFor(this.mode);
    if (modePrompt) {
      systemPrompt = modePrompt + "\n\n";
    }

    systemPrompt += `You are a helpful AI assistant integrated into the Zen Browser Library (BrowseBot).
Be concise, accurate, and helpful.`;

    if (this.isBuild) {
      systemPrompt += "\n\n" + (await getBuildSystemPrompt());
      systemPrompt += await getToolSystemPrompt(["build"]);
      return systemPrompt;
    }

    if (this.isAgent) {
      const { url, title } = messageManagerAPI.getUrlAndTitle();
      systemPrompt += `

## AGENTIC MODE ENABLED - TOOL USAGE:
You have access to browser functions. The user knows you have these abilities.
- **CRITICAL**: When you decide to call a tool, give short summary of what tool are you calling and why?
- Use tools when the user explicitly asks, or when it is the only logical way to fulfill their request (e.g., "search for...").
- When asked about your own abilities, describe the functions you can perform based on the tools listed below.
- Current page: "${title}" (${url})
- If the user references tabs with @mentions, their full page content is provided as a separate message. Base answers about those tabs on that content.
`;
      systemPrompt += await getToolSystemPrompt();
      systemPrompt += `
## More instructions for Running tools
- While running tool like \`openLink\` and \`newSplit\` make sure URL is valid.
- When user asks you to manage tabs (close/group/move tabs) do it smartly: first read tabs and take action, don't ask too many questions for confirmation.
- If the user asks you to open a link by its text (e.g., "click the 'About Us' link"), you must first use \`getHTMLContent()\` to find the link's full URL, then use \`openLink()\` to open it.
- **Never** mention tabId, folderId, or workspaceId to the user. Refer to tabs, folders, and workspaces by name, not id.`;
    } else {
      systemPrompt += `

## Chat Mode:
- You have no tools and no automatic context of the current page.
- The user can reference tabs with @mentions. Referenced tabs arrive as a separate message with their full page content.
- If a question cannot be answered from the conversation, say so honestly.`;
    }

    return systemPrompt;
  }

  attachTabRefs(refs) {
    if (!refs || refs.length === 0) return;
    const limit = 0; // Library never truncates tab context.
    const blocks = refs.map(
      (ref) => `=== ${ref.title} (${ref.url}) ===\n${truncate(ref.text, limit)}`
    );
    this.history.push({
      role: "user",
      content: `Referenced tabs (full page content):\n\n${blocks.join("\n\n")}`,
    });
  }

  async sendMessage(prompt, { refs = [], abortSignal, confirmTool, onToolStatus } = {}) {
    PREFS.debugLog(`libraryLLM (${this.mode}): Sending prompt: "${prompt}"`);
    this.attachTabRefs(refs);

    if (!this.isAgent && !this.isBuild) {
      if (PREFS.streamEnabled) {
        return super.streamText({ prompt, abortSignal });
      }
      return super.generateText({ prompt, abortSignal });
    }

    if (this.isBuild) {
      return this.sendBuildMessage(prompt, { abortSignal, confirmTool, onToolStatus });
    }

    const shouldToolBeCalled = async (toolName, args) => {
      if (onToolStatus) onToolStatus(toolName, "loading", null, args);
      if (PREFS.confirmation) {
        const friendlyName = toolNameMapping[toolName] || toolName;
        const confirmed = confirmTool
          ? await confirmTool([friendlyName], { toolName, args })
          : true;
        if (!confirmed) {
          PREFS.debugLog(`Tool execution for '${toolName}' cancelled by user.`);
          if (onToolStatus) onToolStatus(toolName, "declined", null, args);
          return false;
        }
      }
      return true;
    };

    const afterToolCall = (toolName, result, args) => {
      if (onToolStatus)
        onToolStatus(toolName, result?.error ? "error" : "success", result?.error, args);
    };

    const tools = getTools(null, { shouldToolBeCalled, afterToolCall });

    const commonConfig = {
      prompt,
      tools,
      maxSteps: PREFS.maxToolCalls > 0 ? PREFS.maxToolCalls : Infinity,
      abortSignal,
    };

    if (PREFS.streamEnabled) {
      return super.streamText(commonConfig);
    }
    return super.generateText(commonConfig);
  }

  async sendBuildMessage(prompt, { abortSignal, confirmTool, onToolStatus } = {}) {
    const shouldToolBeCalled = async (toolName, args) => {
      if (onToolStatus) onToolStatus(toolName, "loading", null, args);
      if (BUILD_NO_CONFIRM.has(toolName)) return true;
      if (toolName === "updateModFile" && args?.modId) {
        try {
          const mods = await getInstalledMods();
          if (isBrowseBotAuthor(mods?.[args.modId]?.author)) return true;
        } catch {}
      }
      if (!PREFS.confirmation) return true;
      const friendlyName = toolNameMapping[toolName] || toolName;
      const confirmed = confirmTool ? await confirmTool([friendlyName], { toolName, args }) : true;
      if (!confirmed) {
        PREFS.debugLog(`Build tool '${toolName}' declined by user.`);
        if (onToolStatus) onToolStatus(toolName, "declined", null, args);
        return false;
      }
      return true;
    };

    const afterToolCall = (toolName, result, args) => {
      if (onToolStatus)
        onToolStatus(toolName, result?.error ? "error" : "success", result?.error, args);
    };

    const tools = getTools(["build"], { shouldToolBeCalled, afterToolCall });

    const commonConfig = {
      prompt,
      tools,
      maxSteps: PREFS.maxToolCalls > 0 ? PREFS.maxToolCalls : Infinity,
      abortSignal,
    };

    if (PREFS.streamEnabled) {
      return super.streamText(commonConfig);
    }
    return super.generateText(commonConfig);
  }
}

export { BrowseBotLibraryLLM, MODES };

const browseBotLibraryLLM = new BrowseBotLibraryLLM();
window.browseBotLibraryLLM = browseBotLibraryLLM;
export { browseBotLibraryLLM };
