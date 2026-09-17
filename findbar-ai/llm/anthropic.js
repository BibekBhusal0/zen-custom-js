function toAnthropicMessages(messages) {
  const systemParts = [];
  const out = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(typeof m.content === "string" ? m.content : "");
      continue;
    }
    if (m.role === "assistant") {
      const blocks = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const call of m.tool_calls || []) {
        let input = {};
        try {
          input = JSON.parse(call.function.arguments || "{}");
        } catch {
          input = {};
        }
        blocks.push({ type: "tool_use", id: call.id, name: call.function.name, input });
      }
      out.push({ role: "assistant", content: blocks });
      continue;
    }
    if (m.role === "tool") {
      out.push({
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: m.tool_call_id, content: String(m.content ?? "") },
        ],
      });
      continue;
    }
    out.push({ role: "user", content: typeof m.content === "string" ? m.content : "" });
  }
  return { system: systemParts.join("\n\n"), messages: out };
}

export function buildAnthropicBody({ system, messages, tools, sampling, stream }) {
  const { system: sys, messages: chat } = toAnthropicMessages([
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages,
  ]);
  const body = {
    model: sampling.model,
    max_tokens: sampling.maxTokens,
    stream: !!stream,
  };
  if (sys) body.system = sys;
  body.messages = chat;
  if (sampling.temperature !== undefined) body.temperature = sampling.temperature;
  if (sampling.topP !== undefined) body.top_p = sampling.topP;
  if (sampling.topK !== undefined) body.top_k = sampling.topK;
  if (tools?.length) {
    body.tools = Object.entries(tools).map(([name, t]) => ({
      name,
      description: t.description,
      input_schema: t.parameters,
    }));
    body.tool_choice = { type: "auto" };
  }
  return body;
}

export function anthropicHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
}

export function anthropicUrl() {
  return "https://api.anthropic.com/v1/messages";
}

function normalizeStop(reason) {
  if (reason === "tool_use") return "tool_calls";
  if (reason === "max_tokens") return "length";
  return "stop";
}

// Non-streaming response -> { text, toolCalls, finishReason }
export function parseAnthropicResponse(json) {
  const blocks = json.content || [];
  let text = "";
  const toolCalls = [];
  for (const b of blocks) {
    if (b.type === "text") text += b.text || "";
    else if (b.type === "tool_use") {
      toolCalls.push({ id: b.id, name: b.name, arguments: b.input || {} });
    }
  }
  return { text, toolCalls, finishReason: normalizeStop(json.stop_reason) };
}

// Streams Anthropic SSE, yielding { text } deltas. Returns final result via onDone.
export async function* streamAnthropicEvents(lines, onDone) {
  let text = "";
  const toolCalls = new Map();
  let stopReason = "stop";
  for await (const data of lines) {
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    if (json.type === "content_block_start" && json.content_block?.type === "tool_use") {
      toolCalls.set(json.index, {
        id: json.content_block.id,
        name: json.content_block.name,
        json: "",
      });
    } else if (json.type === "content_block_delta") {
      if (json.delta?.type === "text_delta" && json.delta.text) {
        text += json.delta.text;
        yield { text: json.delta.text };
      } else if (json.delta?.type === "input_json_delta" && json.delta.partial_json) {
        const entry = toolCalls.get(json.index);
        if (entry) entry.json += json.delta.partial_json;
      }
    } else if (json.type === "message_delta" && json.delta?.stop_reason) {
      stopReason = normalizeStop(json.delta.stop_reason);
    }
  }
  const calls = [];
  for (const entry of toolCalls.values()) {
    let args = {};
    try {
      args = JSON.parse(entry.json || "{}");
    } catch {
      args = {};
    }
    calls.push({ id: entry.id, name: entry.name, arguments: args });
  }
  onDone({ text, toolCalls: calls, finishReason: stopReason });
}
