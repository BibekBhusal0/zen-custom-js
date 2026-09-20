import PREFS from "../utils/prefs.js";

let cache = { url: null, context: null };

export function getYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const u = new URL(String(url).trim());
    const host = u.hostname
      .replace(/^www\./, "")
      .replace(/^m\./, "")
      .replace(/^music\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

function decodeEntities(text) {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTimedXml(xml) {
  const segments = [];
  for (const m of String(xml).matchAll(/<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, " "));
    if (text) segments.push({ start: Math.floor(Number(m[1])), text });
  }
  return segments;
}

export function formatTimestamp(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

export function timestampToSeconds(stamp) {
  const raw = String(stamp).trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Math.floor(Number(raw));
  const parts = raw.split(":").map(Number);
  if (!parts.length || parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

function pickTrack(tracks, locale) {
  const base = String(locale || "en").split("-")[0];
  return (
    tracks.find((t) => t.languageCode === base) ||
    tracks.find((t) => (t.languageCode || "").startsWith(base)) ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0]
  );
}

async function fetchTranscript(videoId) {
  let locale = "en";
  try {
    locale = Services.locale.appLocaleAsBCP47 || navigator.language || "en";
  } catch {
    locale = "en";
  }
  const playerRes = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
      videoId,
    }),
  });
  if (!playerRes.ok) throw new Error(`Transcript unavailable (player: ${playerRes.status}).`);
  const player = await playerRes.json();
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) throw new Error("Transcript unavailable (no captions).");
  const track = pickTrack(tracks, locale);
  const capRes = await fetch(track.baseUrl);
  if (!capRes.ok) throw new Error(`Transcript unavailable (captions: ${capRes.status}).`);
  const segments = parseTimedXml(await capRes.text());
  if (!segments.length) throw new Error("Transcript unavailable (empty).");
  return segments;
}

export function formatTranscript(segments, limit = 0) {
  const lines = segments.map((s) => `[${formatTimestamp(s.start)}] ${s.text}`);
  let out = "";
  for (const line of lines) {
    if (limit > 0 && out.length + line.length + 1 > limit) {
      out += "\n\n[Transcript truncated.]";
      break;
    }
    out += (out ? "\n" : "") + line;
  }
  return out;
}

// Transcript with timestamps, or null when the page is not a watchable video.
// Throws when the video has no captions so callers fall back to page text.
export async function getVideoContext(url, limit = 0) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  if (cache.url === url && cache.limit === limit && cache.context) return cache.context;
  PREFS.debugLog("Fetching YouTube transcript via InnerTube:", videoId);
  let segments = null;
  try {
    segments = await fetchTranscript(videoId);
  } catch (e) {
    PREFS.debugLog("InnerTube transcript failed, trying page transcript.", e?.message);
    segments = await getPageTranscriptSegments();
  }
  if (!segments?.length) throw new Error("Transcript unavailable (empty).");
  const context = { videoId, segments, text: formatTranscript(segments, limit) };
  cache = { url, limit, context };
  return context;
}

async function getPageTranscriptSegments() {
  const { messageManagerAPI } = await import("../messageManager.js");
  const result = await messageManagerAPI.getYoutubeTranscript().catch(() => null);
  const lines = String(result?.transcript || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (m && timestampToSeconds(m[1]) !== null) {
      return { start: timestampToSeconds(m[1]), text: m[2] };
    }
    return { start: 0, text: line };
  });
}
