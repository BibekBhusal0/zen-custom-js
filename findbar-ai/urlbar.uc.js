import { LLM } from "./llm/index.js";

const urlBarLLM = new LLM();
urlBarLLM.debugError
urlBarLLM.godMode = true
urlBarLLM.streamEnabled = false
urlBarLLM.citationsEnabled = false
urlBarLLM.persistChat = false
urlBarLLM.getSystemPrompt = async function() {
  return `You are an AI integrated with Zen Browser URL bar, designed to assist users in browsing the web effectively. 

Your primary responsibilities include:
1. Making tool calls in each response based on user input.
2. If the user does not provide specific commands, perform a search using the provided terms. You are permitted to correct any grammar or spelling mistakes and refine user queries for better accuracy.
3. If a URL is provided, open it directly.

Your goal is to ensure a seamless and user-friendly browsing experience.`;
}
urlBarLLM.send = function (prompt) {
  urlBarLLM.sendMessage(prompt)
  urlBarLLM.clearData()
}


window.browseBotURLBarLLM = urlBarLLM
