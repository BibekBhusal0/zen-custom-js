import { PREFS } from "../utils/prefs.js";
import { Storage } from "../utils/storage.js";
import { ZenCommandPalette } from "../index.js";
import { showToast } from "../../utils/toast.js";
import { hmacCode, loadApprovedHashes, trustHash } from "../utils/trust.js";
import { confirmCodeExecution } from "../../utils/code-highlight.js";
import { openLink } from "../../utils/open-link.js";

export const commandChainUtils = {
  async openLink(params) {
    const { link, where = "new tab" } = params;
    if (!link) return;
    try {
      await openLink(link, where);
    } catch (e) {
      PREFS.debugError(`Command Chain: Failed to open link "${link}" in "${where}".`, e);
    }
  },
  async delay(params) {
    const { time = 50 } = params;
    if (!time) return;
    await new Promise((resolve) => setTimeout(resolve, time));
  },
  async showToast(params) {
    const { title, description } = params;
    if (!title || !description) return;

    try {
      showToast({ title: title, description: description });
    } catch (e) {
      PREFS.debugError("Failed to show toast:", e);
      alert([title, description], 0);
    }
  },
};

export async function generateCustomCommands() {
  const { customCommands } = await Storage.loadSettings();
  if (!customCommands || customCommands.length === 0) {
    return [];
  }

  return customCommands.map((cmd) => {
    let commandFunc;
    if (cmd.type === "js") {
      commandFunc = async () => {
        try {
          const approvedHashes = await loadApprovedHashes();
          const codeHash = await hmacCode(cmd.code);

          if (!approvedHashes[codeHash]) {
            const approved = await confirmCodeExecution({ name: cmd.name, code: cmd.code });
            if (!approved) return;
            await trustHash(codeHash);
          }

          const Cu = Components.utils;
          const sandbox = Cu.Sandbox(window, {
            sandboxPrototype: window,
            wantXrays: true,
          });
          Cu.evalInSandbox(cmd.code, sandbox);
        } catch (e) {
          try {
            showToast({
              title: `Custom command error: ${e.message}`,
              preset: 0,
            });
          } catch (toastError) {
            PREFS.debugError("Failed to show toast:", toastError);
          }
        }
      };
    } else if (cmd.type === "chain") {
      commandFunc = async () => {
        for (const step of cmd.commands) {
          if (typeof step === "string") {
            // It's a regular command key
            await new Promise((resolve) => setTimeout(resolve, 50));
            ZenCommandPalette.executeCommand(step);
          } else if (typeof step === "object" && step.action && commandChainUtils[step.action]) {
            // It's a utility function call
            await commandChainUtils[step.action](step.params || {});
          }
        }
      };
    }

    return {
      key: `custom:${cmd.id}`,
      label: cmd.name,
      command: commandFunc,
      icon:
        cmd.icon ||
        (cmd.type === "js"
          ? "chrome://browser/skin/zen-icons/source-code.svg"
          : "chrome://browser/skin/zen-icons/settings.svg"),
      tags: ["custom", cmd.name.toLowerCase()],
      allowIcons: true,
      allowShortcuts: true,
    };
  });
}
