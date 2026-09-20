/* Tiny dependency-free syntax highlighter. Emits `pl-*` classes themed by markdown.css. */
import { parseElement, escapeXmlAttribute } from "./parse.js";

const JS_KEYWORDS = new Set(
  "break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return static super switch throw try typeof var void while with yield async await of from as get set constructor".split(
    " "
  )
);

const PY_KEYWORDS = new Set(
  "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None".split(
    " "
  )
);

const CSS_AT_RULES = new Set(
  ["media", "import", "keyframes", "font-face", "supports", "charset", "namespace"].map(
    (r) => `@${r}`
  )
);

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function span(cls, raw) {
  return `<span class="${cls}">${escapeHtml(raw)}</span>`;
}

/* Gaps between regex matches pass through raw, so escape them here. */
function tokenize(code, re, classify) {
  const src = String(code);
  const rx = new RegExp(re.source, "g");
  let out = "";
  let last = 0;
  let m;
  while ((m = rx.exec(src)) !== null) {
    out += escapeHtml(src.slice(last, m.index));
    out += classify(m);
    last = m.index + m[0].length;
    if (m[0].length === 0) rx.lastIndex++;
  }
  out += escapeHtml(src.slice(last));
  return out;
}

const JS_RE =
  /(\/\*[\s\S]*?(?:\*\/|$))|(\/\/[^\n]*)|(`(?:[^`\\]|\\.)*(?:`|$))|('(?:[^'\\\n]|\\.)*(?:'|$))|("(?:[^"\\\n]|\\.)*(?:"|$))|\b(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b|\b([A-Za-z_$][\w$]*)(?=\s*\()|\b([A-Za-z_$][\w$]*)\b/g;

const JS_CONSTANTS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity",
  "this",
  "super",
]);

function highlightJS(code) {
  return tokenize(code, JS_RE, (m) => {
    const [full, blockComment, lineComment, tpl, sq, dq, num, call, word] = m;
    if (blockComment ?? lineComment) return span("pl-c", full);
    if (tpl ?? sq ?? dq) return span("pl-s", full);
    if (num) return span("pl-c1", full);
    if (call) {
      if (JS_KEYWORDS.has(call)) return span("pl-k", full);
      if (JS_CONSTANTS.has(call)) return span("pl-c1", full);
      return span("pl-en", full);
    }
    if (word) {
      if (JS_KEYWORDS.has(word)) return span("pl-k", full);
      if (JS_CONSTANTS.has(word)) return span("pl-c1", full);
      if (/^[A-Z]/.test(word)) return span("pl-en", full);
      return escapeHtml(full);
    }
    return escapeHtml(full);
  });
}

const PY_RE =
  /(#[^\n]*)|('''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$))|('(?:[^'\\\n]|\\.)*(?:'|$))|("(?:[^"\\\n]|\\.)*(?:"|$))|\b(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?j?)\b|\b([A-Za-z_]\w*)\b/g;

function highlightPython(code) {
  return tokenize(code, PY_RE, (m) => {
    const [full, comment, triple, sq, dq, num, word] = m;
    if (comment) return span("pl-c", full);
    if (triple ?? sq ?? dq) return span("pl-s", full);
    if (num) return span("pl-c1", full);
    if (word) {
      if (PY_KEYWORDS.has(word)) return span("pl-k", full);
      if (/^[A-Z]/.test(word)) return span("pl-en", full);
      return escapeHtml(full);
    }
    return escapeHtml(full);
  });
}

const MARKUP_RE =
  /(<!--[\s\S]*?(?:-->|$))|(<\/?[A-Za-z][\w:.-]*|\/?>)|([A-Za-z_:][\w:.-]*)(?=\s*=\s*["'])|('(?:[^'\\]|\\.)*(?:'|$))|("(?:[^"\\]|\\.)*(?:"|$))/g;

function highlightMarkup(code) {
  return tokenize(code, MARKUP_RE, (m) => {
    const [full, comment, tag, attr, sq, dq] = m;
    if (comment) return span("pl-c", full);
    if (tag) return span("pl-ent", full);
    if (attr) return span("pl-c1", full);
    if (sq ?? dq) return span("pl-s", full);
    return escapeHtml(full);
  });
}

const CSS_RE =
  /(\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\]|\\.)*(?:"|$))|('(?:[^'\\]|\\.)*(?:'|$))|(@[\w-]+)|(#(?:[\da-fA-F]{3,8})\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b)|([A-Za-z-][\w-]*)(?=\s*:)/g;

function highlightCSS(code) {
  return tokenize(code, CSS_RE, (m) => {
    const [full, comment, dq, sq, at, hex, num, prop] = m;
    if (comment) return span("pl-c", full);
    if (dq ?? sq) return span("pl-s", full);
    if (at) return CSS_AT_RULES.has(at) ? span("pl-k", full) : span("pl-en", full);
    if (hex ?? num) return span("pl-c1", full);
    if (prop) return span("pl-c1", full);
    return escapeHtml(full);
  });
}

const GENERIC_RE =
  /(\/\*[\s\S]*?(?:\*\/|$))|(\/\/[^\n]*|#[^\n]*)|(`(?:[^`\\]|\\.)*(?:`|$))|('(?:[^'\\\n]|\\.)*(?:'|$))|("(?:[^"\\\n]|\\.)*(?:"|$))|\b(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;

function highlightGeneric(code) {
  return tokenize(code, GENERIC_RE, (m) => {
    const [full, blockComment, lineComment, tpl, sq, dq, num] = m;
    if (blockComment ?? lineComment) return span("pl-c", full);
    if (tpl ?? sq ?? dq) return span("pl-s", full);
    if (num) return span("pl-c1", full);
    return escapeHtml(full);
  });
}

const LANG_ALIASES = {
  js: "js",
  javascript: "js",
  jsx: "js",
  ts: "js",
  typescript: "js",
  tsx: "js",
  mjs: "js",
  cjs: "js",
  json: "js",
  jsonc: "js",
  py: "python",
  python: "python",
  html: "markup",
  xml: "markup",
  svg: "markup",
  css: "css",
};

export function highlightCode(code, lang) {
  const normalized = String(lang || "")
    .trim()
    .toLowerCase();
  const kind = LANG_ALIASES[normalized] || (normalized ? "generic" : "js");
  if (kind === "js") return highlightJS(code);
  if (kind === "python") return highlightPython(code);
  if (kind === "markup") return highlightMarkup(code);
  if (kind === "css") return highlightCSS(code);
  return highlightGeneric(code);
}

/* Highlighted editing: backdrop pre synced behind a transparent textarea. */
export function attachCodeEditor(textarea, { language = "javascript" } = {}) {
  if (!textarea?.parentNode) return () => {};
  const wrap = parseElement(`<div class="zenux-code-editor"></div>`);
  const pre = parseElement(
    `<pre class="zenux-code-backdrop" aria-hidden="true"><code></code></pre>`
  );
  const codeEl = pre.querySelector("code");
  textarea.before(wrap);
  wrap.appendChild(pre);
  wrap.appendChild(textarea);

  const update = () => {
    codeEl.innerHTML = highlightCode(`${textarea.value || ""}\n`, language);
  };
  const syncScroll = () => {
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  };
  const onInput = () => {
    update();
    syncScroll();
  };
  textarea.addEventListener("input", onInput);
  textarea.addEventListener("scroll", syncScroll);
  update();

  return () => {
    textarea.removeEventListener("input", onInput);
    textarea.removeEventListener("scroll", syncScroll);
    wrap.before(textarea);
    wrap.remove();
  };
}

const WARNING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/></svg>`;

/* Confirm dialog showing the full highlighted code. Resolves true on confirm. */
export function confirmCodeExecution({ name = "", code = "", language = "javascript" } = {}) {
  return new Promise((resolve) => {
    const title = name ? `Run "${name}"?` : "Run custom JS command?";
    const overlay = parseElement(`
      <div class="zenux-code-confirm-overlay">
        <div class="zenux-code-confirm-modal" role="dialog" aria-modal="true">
          <div class="zenux-code-confirm-head">${WARNING_SVG}<h3>${escapeXmlAttribute(title)}</h3></div>
          <div class="zenux-code-confirm-body">
            <p>This will execute the following JavaScript in the browser chrome context.</p>
            <div class="zenux-code-confirm-warning">${WARNING_SVG}<span>Only proceed if you trust the source of this command. Malicious code can compromise your browser.</span></div>
            <pre class="zenux-code-confirm-code"><code>${highlightCode(code, language)}</code></pre>
          </div>
          <div class="zenux-code-confirm-actions">
            <button class="zenux-btn-ghost" data-action="cancel">Cancel</button>
            <button class="zenux-btn-primary" data-action="run">Run Command</button>
          </div>
        </div>
      </div>
    `);

    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown, true);
      resolve(value);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        done(false);
      }
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) done(false);
      const action = e.target.closest?.("[data-action]")?.dataset.action;
      if (action === "run") done(true);
      else if (action === "cancel") done(false);
    });
    document.addEventListener("keydown", onKeyDown, true);
    document.documentElement.appendChild(overlay);
    overlay.querySelector('[data-action="cancel"]')?.focus();
  });
}

export { escapeHtml };
