import { PREFS } from "../utils/prefs.js";

function sessionsDir() {
  const dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
  dir.append("browsebot-chats");
  return dir.path;
}

function sessionPath(id) {
  const safe = String(id).replace(/[^a-z0-9_-]/gi, "") || "chat";
  return `${sessionsDir()}/${safe}.json`;
}

async function readJSON(path) {
  if (typeof IOUtils.readJSON === "function") return IOUtils.readJSON(path);
  return JSON.parse(await IOUtils.readUTF8(path));
}

async function writeJSON(path, obj) {
  if (typeof IOUtils.writeJSON === "function") return IOUtils.writeJSON(path, obj);
  return IOUtils.writeUTF8(path, JSON.stringify(obj));
}

async function ensureDir(path) {
  try {
    if (typeof IOUtils.makeDirectory === "function") {
      await IOUtils.makeDirectory(path, { createAncestors: true, ignoreExisting: true });
      return;
    }
  } catch {}
  const dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
  dir.initWithPath(path);
  if (!dir.exists()) dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
}

export function isSessionMessage(m) {
  return (
    !!m &&
    (m.role === "user" || m.role === "assistant") &&
    m.content !== undefined &&
    m.content !== null
  );
}

export function newSession(mode) {
  const now = Date.now();
  return {
    id: `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    mode,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function sessionTitle(messages) {
  const first = messages.find((m) => m.role === "user");
  const text = String(first?.content ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 48) || "Untitled chat";
}

export async function loadSessions() {
  try {
    let children = [];
    try {
      children = await IOUtils.getChildren(sessionsDir());
    } catch {
      return [];
    }
    const out = [];
    for (const child of children) {
      if (!String(child).endsWith(".json")) continue;
      try {
        const s = await readJSON(child);
        if (!s || typeof s.id !== "string" || !Array.isArray(s.messages)) continue;
        const messages = s.messages.filter(isSessionMessage);
        if (messages.length === 0) continue;
        out.push({ ...s, messages });
      } catch {}
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (e) {
    PREFS.debugError("Failed to list chat sessions:", e);
    return [];
  }
}

export async function upsertSession(session) {
  await ensureDir(sessionsDir());
  await writeJSON(sessionPath(session.id), {
    ...session,
    messages: session.messages.filter(isSessionMessage),
    updatedAt: Date.now(),
  });
}

export async function deleteSession(id) {
  if (!id) return;
  try {
    await IOUtils.remove(sessionPath(id));
  } catch (e) {
    PREFS.debugLog("Failed to delete chat session:", e);
  }
}
