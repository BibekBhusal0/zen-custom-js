export function startupFinish(callback) {
  if (document.readyState === "complete") callback();
  else window.addEventListener("load", callback, { once: true });
}
