/**
 * Creates a unique signature for a keyboard shortcut.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {string} A unique signature string.
 */
export function eventToShortcutSignature(event) {
  const modifiers = [];
  if (event.ctrlKey || event.metaKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  modifiers.push(normalizeKeyName(event.key));
  return modifiers.join("+");
}

/**
 * Creates a pretty name for shortcut
 * @param {shortcutStr} string - shortcut string.
 * @returns {string} Pretty name.
 */
export function getPrettyShortcut(shortcutStr) {
  if (!shortcutStr) return "";
  const pretty = shortcutStr
    .toLowerCase()
    .replace(/control/g, "⌘")
    .replace(/accel/g, "⌘")
    .replace(/ctrl/g, "⌘")
    .replace(/shift/g, "⇧")
    .replace(/option/g, "Alt")
    .replace(/alt/g, "Alt")
    .replace(/space/g, "␣")
    .replace(/spacebar/g, "␣")
    .replace(/enter/g, "↩")
    .replace(/arrowright/g, "→")
    .replace(/arrowleft/g, "←")
    .replace(/arrowup/g, "↑")
    .replace(/arrowdown/g, "↓");

  // Capatalize first letter
  return pretty ? pretty[0].toUpperCase() + pretty.slice(1) : "";
}

function normalizeKeyName(key) {
  if (!key) return "";
  const k = key.toLowerCase();
  if (k === " " || k === "space" || k === "spacebar") return "space";
  return k;
}

/**
 * Creates a unique signature for a shortcut string.
 * @param {string} shortcutStr - The shortcut string (e.g., "Ctrl+K").
 * @returns {string} A unique signature string.
 */
export function shortcutStringToSignature(shortcutStr) {
  if (!shortcutStr) return "";
  return shortcutStr
    .toLowerCase()
    .replace(/control/g, "ctrl")
    .replace(/option/g, "alt")
    .split("+")
    .map((s) => normalizeKeyName(s.trim()))
    .join("+");
}

/**
 * Parses a shortcut string into a normalized object.
 * @param {string} shortcutStr - The shortcut string (e.g., "Ctrl+Shift+K").
 * @returns {{key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean}}
 */
export function parseStringToShortcut(shortcutStr) {
  const parts = shortcutStr
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const keyPart = parts.pop();

  return {
    key: normalizeKeyName(keyPart),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("win"),
  };
}

/**
 * Checks if two shortcuts are equal (platform-aware).
 * @param {{key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean}} shortcut1
 * @param {{key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean}} shortcut2
 * @returns {boolean}
 */
export function shortcutsEqual(shortcut1, shortcut2) {
  const isMacOS = navigator.platform.indexOf("Mac") === 0;

  if (shortcut1.key !== shortcut2.key) {
    return false;
  }

  if (shortcut1.alt !== shortcut2.alt || shortcut1.shift !== shortcut2.shift) {
    return false;
  }

  if (isMacOS) {
    const ctrl1 = shortcut1.ctrl || shortcut1.meta;
    const ctrl2 = shortcut2.ctrl || shortcut2.meta;
    return ctrl1 === ctrl2;
  } else {
    const ctrl1 = shortcut1.ctrl || shortcut1.meta;
    const ctrl2 = shortcut2.ctrl || shortcut2.meta;
    return ctrl1 === ctrl2 && shortcut1.meta === shortcut2.meta;
  }
}

let _shortcuts = new Map();

/**
 * Checks for conflicts with Zen's native shortcuts.
 * @param {string} shortcutStr - The shortcut string to check.
 * @param {string} excludeId - The ID to exclude from conflict check (usually the current shortcut's ID).
 * @returns {{hasConflict: boolean, conflictInfo?: {shortcut: string, id: string}}}
 */
function checkZenConflict(shortcutStr, excludeId = null) {
  if (
    !window.gZenKeyboardShortcutsManager ||
    !window.gZenKeyboardShortcutsManager._currentShortcutList
  ) {
    return { hasConflict: false };
  }

  const parsed = parseStringToShortcut(shortcutStr);

  for (const shortcut of window.gZenKeyboardShortcutsManager._currentShortcutList) {
    if (shortcut.getID() === excludeId) {
      continue;
    }

    const zenShortcut = {
      key: shortcut.getKeyName()?.toLowerCase() || "",
      ctrl: shortcut.getModifiers().control || shortcut.getModifiers().accel,
      alt: shortcut.getModifiers().alt,
      shift: shortcut.getModifiers().shift,
      meta: shortcut.getModifiers().meta,
    };

    if (shortcutsEqual(parsed, zenShortcut)) {
      return {
        hasConflict: true,
        conflictInfo: {
          shortcut: shortcut.toDisplayString(),
          id: shortcut.getID(),
        },
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Handles keydown events and executes matching shortcuts.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleKeyDown(event) {
  const signature = eventToShortcutSignature(event);
  const shortcut = _shortcuts.get(signature);

  if (shortcut) {
    event.preventDefault();
    event.stopPropagation();
    shortcut.callback(event);
  }
}

/**
 * Initializes the registry and starts listening for keyboard events.
 */
export function initShortcutRegistry() {
  window.addEventListener("keydown", handleKeyDown, true);
}

/**
 * Destroys the registry and removes all event listeners.
 */
export function destroyShortcutRegistry() {
  window.removeEventListener("keydown", handleKeyDown, true);
  _shortcuts.clear();
}

/**
 * Registers a new keyboard shortcut.
 * @param {string} shortcutStr - The shortcut string (e.g., "Ctrl+Shift+K").
 * @param {string} id - A unique identifier for this shortcut.
 * @param {Function} callback - The function to execute when the shortcut is triggered.
 * @returns {boolean} True if registration was successful, false otherwise.
 */
export function registerShortcut(shortcutStr, id, callback) {
  if (!shortcutStr || !id || typeof callback !== "function") {
    console.error("registerShortcutInRegistry: Invalid arguments", { shortcutStr, id, callback });
    return false;
  }
  unregisterShortcutById(id);

  const signature = shortcutStringToSignature(shortcutStr);
  _shortcuts.set(signature, { id, callback, shortcutStr });
  return true;
}

/**
 * Unregisters a keyboard shortcut by its ID or shortcut string.
 * @param {string} identifier - The ID or shortcut string of the shortcut to unregister.
 * @returns {boolean} True if unregistration was successful, false otherwise.
 */
export function unregisterShortcut(identifier) {
  const signature = shortcutStringToSignature(identifier);
  const shortcut = _shortcuts.get(signature);

  if (!shortcut) {
    return false;
  }

  _shortcuts.delete(signature);
  return true;
}

/**
 * Unregisters a shortcut by its ID.
 * @param {string} id - The ID of the shortcut to unregister.
 * @returns {boolean} True if unregistration was successful, false otherwise.
 */
export function unregisterShortcutById(id) {
  for (const [signature, shortcut] of _shortcuts.entries()) {
    if (shortcut.id === id) {
      _shortcuts.delete(signature);
      return true;
    }
  }
  return false;
}

/**
 * Checks if a shortcut is registered.
 * @param {string} shortcutStr - The shortcut string to check.
 * @returns {boolean} True if the shortcut is registered, false otherwise.
 */
export function isShortcutRegistered(shortcutStr) {
  const signature = shortcutStringToSignature(shortcutStr);
  return _shortcuts.has(signature);
}

/**
 * Gets the ID of the shortcut registered for a given shortcut string.
 * @param {string} shortcutStr - The shortcut string.
 * @returns {string|null} The ID of the registered shortcut, or null if not found.
 */
export function getShortcutRegistrationId(shortcutStr) {
  const signature = shortcutStringToSignature(shortcutStr);
  const shortcut = _shortcuts.get(signature);
  return shortcut ? shortcut.id : null;
}

/**
 * Checks for conflicts with a given shortcut string.
 * @param {string} shortcutStr - The shortcut string to check.
 * @param {string} [excludeId] - An ID to exclude from conflict checking.
 * @returns {{hasConflict: boolean, conflicts: Array<{shortcut: string, id: string}>}}
 */
export function checkShortcutConflicts(shortcutStr, excludeId = null) {
  const conflicts = [];

  const existingShortcut = _shortcuts.get(shortcutStringToSignature(shortcutStr));
  if (existingShortcut && existingShortcut.id !== excludeId) {
    conflicts.push({ shortcut: shortcutStr, id: existingShortcut.id, source: "custom" });
  }

  const zenConflict = checkZenConflict(shortcutStr, excludeId);
  if (zenConflict.hasConflict) {
    conflicts.push({ ...zenConflict.conflictInfo, source: "zen" });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Gets all registered shortcuts.
 * @returns {Array<{id: string, shortcutStr: string, signature: string}>} An array of all registered shortcuts.
 */
export function getAllRegisteredShortcuts() {
  return Array.from(_shortcuts.entries()).map(([signature, shortcut]) => ({
    id: shortcut.id,
    shortcutStr: shortcut.shortcutStr,
    signature,
  }));
}

/**
 * Clears all registered shortcuts.
 */
export function clearAllShortcuts() {
  _shortcuts.clear();
}
