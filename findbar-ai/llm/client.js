import {
  buildAnthropicBody,
  anthropicHeaders,
  anthropicUrl,
  parseAnthropicResponse,
  streamAnthropicEvents,
} from "./anthropic.js";

const RETRYABLE = [429, 500, 502, 503, 504];

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isNetworkError(err) {
  return err?.name === "TypeError" || /network|fetch|failed|timeout|connection|refused/i.test(err?.message || "");
}

// POST with retry. Returns the Response; throws friendly errors when !ok.
async function postChat(url, headers, body, signal, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
      if (res.ok) return res;
      if (RETRYABLE.includes(res.status) && attempt < attempts - 1) {
        await res.text().catch(() => "");
        await sleep(Math.min(1000 * 2 ** attempt, 10000), signal);
        continue;
      }
      const bodyText = await res.text().catch(() => "");
      throw Object.assign(new Error(bodyText || res.statusText), { friendly: true });
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      if (err?.friendly) throw err;
      if (isNetworkError(err) && attempt < attempts - 1) {
        lastError = err;
        await sleep(Math.min(1000 * 2 ** attempt, 10000), signal);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("Request failed after retries");
}

function cleanMessage(m) {
  const out = { role: m.role, content: typeof m.content === "string" ? m.content : "" };
  if (m.tool_calls) out.tool_calls = m.tool_calls;
  if (m.tool_call_id) out.tool_call_id = m.tool_call_id;
  if (m.name) out.name = m.name;
  return out;
}

function openAIBody(provider, system, messages, tools, stream, sampling, jsonMode) {
  const clean = messages.map(cleanMessage);
  const body = {
    model: provider.model,
    messages: system ? [{ role: "system", content: system }, ...clean] : clean,
    stream,
  };
  if (sampling.temperature !== undefined) body.temperature = sampling.temperature;
  if (sampling.topP !== undefined) body.top_p = sampling.topP;
  if (sampling.maxTokens !== undefined) body.max_tokens = sampling.maxTokens;
  if (provider.kind !== "gemini") {
    if (sampling.frequencyPenalty !== undefined) body.frequency_penalty = sampling.frequencyPenalty;
    if (sampling.presencePenalty !== undefined) body.presence_penalty = sampling.presencePenalty;
  }
  if (tools) {
    body.tools = Object.entries(tools).map(([name, t]) => ({
      type: "function",
      function: { name, description: t.description, parameters: t.parameters },
    }));
    body.tool_choice = "auto";
  }
  if (jsonMode) body.response_format = { type: "json_object" };
  return body;
}

function openAIHeaders(provider) {
  const headers = { "Content-Type": "application/json", ...provider.extraHeaders };
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;
  return headers;
}

// Gemini's compat layer reports "stop" for streaming tool calls; every other
// OpenAI-shaped endpoint reports "tool_calls". Normalize on the evidence.
function normalizeFinish(finishReason, toolCalls) {
  if (finishReason === "stop" && toolCalls.length) return "tool_calls";
  return finishReason || "stop";
}

function parseToolCalls(rawCalls) {
  const calls = [];
  for (const c of rawCalls || []) {
    let args = {};
    try {
      args = JSON.parse(c.function?.arguments || "{}");
    } catch {
      args = {};
    }
    calls.push({ id: c.id, name: c.function?.name, arguments: args });
  }
  return calls;
}

async function completeOpenAI(provider, system, messages, tools, sampling, jsonMode, signal) {
  const res = await postChat(
    provider.baseURL,
    openAIHeaders(provider),
    openAIBody(provider, system, messages, tools, false, sampling, jsonMode),
    signal
  );
  const json = await res.json();
  if (json.error) throw Object.assign(new Error(JSON.stringify(json.error)), { friendly: true });
  const choice = json.choices?.[0] || {};
  const msg = choice.message || {};
  const toolCalls = parseToolCalls(msg.tool_calls);
  return {
    text: typeof msg.content === "string" ? msg.content : "",
    toolCalls,
    finishReason: normalizeFinish(choice.finish_reason, toolCalls),
  };
}

async function completeAnthropic(provider, system, messages, tools, sampling, signal) {
  const res = await postChat(
    anthropicUrl(),
    anthropicHeaders(provider.apiKey),
    buildAnthropicBody({ system, messages, tools, sampling: { ...sampling, model: provider.model }, stream: false }),
    signal
  );
  return parseAnthropicResponse(await res.json());
}

async function* sseDataLines(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
  if (buf.trim().startsWith("data:")) yield buf.trim().slice(5).trim();
}

// Streams one assistant step. Yields text deltas, resolves tool calls.
async function* streamStep(provider, system, messages, tools, sampling, signal, onDone) {
  if (provider.kind === "anthropic") {
    const res = await postChat(
      anthropicUrl(),
      anthropicHeaders(provider.apiKey),
      buildAnthropicBody({ system, messages, tools, sampling: { ...sampling, model: provider.model }, stream: true }),
      signal
    );
    yield* streamAnthropicEvents(sseDataLines(res), onDone);
    return;
  }
  const res = await postChat(
    provider.baseURL,
    openAIHeaders(provider),
    openAIBody(provider, system, messages, tools, true, sampling, false),
    signal
  );
  let text = "";
  const callsByIndex = new Map();
  let finishReason = "stop";
  for await (const data of sseDataLines(res)) {
    if (data === "[DONE]") break;
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    if (json.error) throw Object.assign(new Error(JSON.stringify(json.error)), { friendly: true });
    const choice = json.choices?.[0] || {};
    const delta = choice.delta || {};
    if (typeof delta.content === "string" && delta.content) {
      text += delta.content;
      yield { text: delta.content };
    }
    for (const tc of delta.tool_calls || []) {
      const idx = tc.index ?? 0;
      if (!callsByIndex.has(idx)) callsByIndex.set(idx, { id: tc.id, name: tc.function?.name, args: "" });
      const entry = callsByIndex.get(idx);
      if (tc.id) entry.id = tc.id;
      if (tc.function?.name) entry.name = tc.function.name;
      if (tc.function?.arguments) entry.args += tc.function.arguments;
    }
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }
  const toolCalls = [];
  for (const entry of callsByIndex.values()) {
    let args = {};
    try {
      args = JSON.parse(entry.args || "{}");
    } catch {
      args = {};
    }
    if (entry.name) toolCalls.push({ id: entry.id, name: entry.name, arguments: args });
  }
  onDone({ text, toolCalls, finishReason: normalizeFinish(finishReason, toolCalls) });
}

async function executeToolCall(tools, call) {
  const tool = tools[call.name];
  if (!tool) return JSON.stringify({ error: `Unknown tool "${call.name}".` });
  try {
    const result = await tool.execute(call.arguments || {});
    return typeof result === "string" ? result : JSON.stringify(result ?? {});
  } catch (err) {
    return JSON.stringify({ error: err?.message || String(err) });
  }
}

// Runs the agentic loop. Returns { text, response: { messages } } where messages
// are the new history entries in plain OpenAI shape (string content throughout).
async function runLoop({ provider, system, messages, tools, maxSteps, sampling = {}, jsonMode, abortSignal, onTextDelta }) {
  if (jsonMode && tools) throw new Error("jsonMode and tools cannot be combined.");
  const convo = [...messages];
  const added = [];
  let text = "";
  const steps = Math.max(1, maxSteps || 1);
  for (let step = 0; step < steps; step++) {
    const streaming = !!onTextDelta;
    let stepResult;
    if (streaming) {
      let collected = "";
      const toolCalls = [];
      let finishReason = "stop";
      const gen = streamStep(provider, system, convo, tools, sampling, abortSignal, (done) => {
        collected = done.text;
        toolCalls.push(...done.toolCalls);
        finishReason = done.finishReason;
      });
      for await (const chunk of gen) {
        onTextDelta(chunk.text);
      }
      stepResult = { text: collected, toolCalls, finishReason };
    } else if (provider.kind === "anthropic") {
      stepResult = await completeAnthropic(provider, system, convo, tools, sampling, abortSignal);
    } else {
      stepResult = await completeOpenAI(provider, system, convo, tools, sampling, jsonMode, abortSignal);
    }
    text = stepResult.text;
    if (!stepResult.toolCalls.length) {
      added.push({ role: "assistant", content: text });
      break;
    }
    const assistantMsg = {
      role: "assistant",
      content: text || "",
      tool_calls: stepResult.toolCalls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: JSON.stringify(c.arguments || {}) },
      })),
    };
    convo.push(assistantMsg);
    added.push(assistantMsg);
    for (const call of stepResult.toolCalls) {
      const result = await executeToolCall(tools, call);
      const toolMsg = { role: "tool", tool_call_id: call.id, content: String(result) };
      convo.push(toolMsg);
      added.push(toolMsg);
    }
    if (step === steps - 1) text = "";
  }
  return { text, response: { messages: added } };
}

export async function generateText(options) {
  return runLoop({ ...options, onTextDelta: null });
}

// Returns { textStream, text }. The two are independent: text resolves from the
// pump, not by consuming textStream, so using both never splits chunks.
export function streamText(options) {
  const seen = [];
  let outcome = null;
  const waiters = new Set();
  const wake = () => {
    for (const w of [...waiters]) w();
    waiters.clear();
  };
  async function* textStream() {
    let i = 0;
    for (;;) {
      while (i < seen.length) yield seen[i++];
      if (outcome) {
        if (outcome.error) throw outcome.error;
        return;
      }
      await new Promise((resolve) => waiters.add(resolve));
    }
  }
  const text = (async () => {
    try {
      const result = await runLoop({
        ...options,
        onTextDelta: (delta) => {
          seen.push(delta);
          wake();
        },
      });
      outcome = { result };
      if (options.onFinish) await options.onFinish(result);
      wake();
      return result.text;
    } catch (error) {
      outcome = { error };
      wake();
      throw error;
    }
  })();
  return { textStream: textStream(), text };
}
