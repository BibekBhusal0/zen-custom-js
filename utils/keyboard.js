const KEY_MAP = {
  f1: "VK_F1",
  f2: "VK_F2",
  f3: "VK_F3",
  f4: "VK_F4",
  f5: "VK_F5",
  f6: "VK_F6",
  f7: "VK_F7",
  f8: "VK_F8",
  f9: "VK_F9",
  f10: "VK_F10",
  f11: "VK_F11",
  f12: "VK_F12",
  f13: "VK_F13",
  f14: "VK_F14",
  f15: "VK_F15",
  f16: "VK_F16",
  f17: "VK_F17",
  f18: "VK_F18",
  f19: "VK_F19",
  f20: "VK_F20",
  f21: "VK_F21",
  f22: "VK_F22",
  f23: "VK_F23",
  f24: "VK_F24",
  tab: "VK_TAB",
  enter: "VK_RETURN",
  escape: "VK_ESCAPE",
  space: "VK_SPACE",
  arrowleft: "VK_LEFT",
  arrowright: "VK_RIGHT",
  arrowup: "VK_UP",
  arrowdown: "VK_DOWN",
  delete: "VK_DELETE",
  backspace: "VK_BACK",
  home: "VK_HOME",
  num_lock: "VK_NUMLOCK",
  scroll_lock: "VK_SCROLL",
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([key, value]) => [value, key])
);

/**
 * Parses a shortcut string (e.g., "Ctrl+Shift+K") into an object for a <key> element.
 * @param {string} str - The shortcut string.
 * @returns {{key: string|null, keycode: string|null, modifiers: string}}
 */
export function parseShortcutString(str) {
  if (!str) return {};
  const parts = str.split("+").map((p) => p.trim().toLowerCase());
  const keyPart = parts.pop();

  const modifiers = {
    accel: false,
    alt: false,
    shift: false,
    meta: false,
  };

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        modifiers.accel = true;
        break;
      case "alt":
      case "option":
        modifiers.alt = true;
        break;
      case "shift":
        modifiers.shift = true;
        break;
      case "cmd":
      case "meta":
      case "win":
        modifiers.meta = true;
        break;
    }
  }

  const keycode = KEY_MAP[keyPart] || null;
  const key = keycode ? null : keyPart;

  return {
    key: key,
    keycode: keycode,
    modifiers: Object.entries(modifiers)
      .filter(([, val]) => val)
      .map(([mod]) => mod)
      .join(","),
  };
}

/**
 * Converts a shortcut object (as returned by parseShortcutString) back into a human-readable string.
 * @param {{key: string|null, keycode: string|null, modifiers: string}} shortcutObject - The shortcut object.
 * @returns {string} The formatted shortcut string (e.g., "Ctrl+Shift+K").
 */
export function shortcutToString(shortcutObject) {
  if (!shortcutObject) return "";

  const parts = [];

  // Modifiers are added in a consistent order for display.
  const modifierMap = {
    accel: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    meta: "Meta",
  };

  if (shortcutObject.modifiers) {
    const mods = shortcutObject.modifiers.split(",").map((m) => m.trim());
    for (const mod of ["accel", "shift", "alt", "meta"]) {
      if (mods.includes(mod)) {
        parts.push(modifierMap[mod]);
      }
    }
  }

  if (shortcutObject.keycode) {
    const keyName = REVERSE_KEY_MAP[shortcutObject.keycode] || shortcutObject.keycode;
    parts.push(keyName.charAt(0).toUpperCase() + keyName.slice(1));
  } else if (shortcutObject.key) {
    parts.push(shortcutObject.key.toUpperCase());
  }

  return parts.join("+");
}

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
  modifiers.push(event.key.toLowerCase());
  return modifiers.join("+");
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
    .replace(/option/g, "alt");
}

/**
 * Parses a keyboard event into a normalized key name.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {{key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean}}
 */
export function parseEventToShortcut(event) {
  return {
    key: event.key.toLowerCase(),
    ctrl: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
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
    key: keyPart?.toLowerCase() || "",
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

/**
 * A registry for managing keyboard shortcuts using event listeners.
 */
export class ShortcutRegistry {
  constructor() {
    this._shortcuts = new Map();
    this._boundHandler = this._handleKeyDown.bind(this);
  }

  /**
   * Initializes the registry and starts listening for keyboard events.
   * @param {EventTarget} [target=window] - The event target to attach listeners to.
   */
  init(target = window) {
    this._target = target;
    this._target.addEventListener("keydown", this._boundHandler, true);
  }

  /**
   * Destroys the registry and removes all event listeners.
   */
  destroy() {
    if (this._target) {
      this._target.removeEventListener("keydown", this._boundHandler, true);
    }
    this._shortcuts.clear();
  }

  /**
   * Handles keydown events and executes matching shortcuts.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  _handleKeyDown(event) {
    const signature = eventToShortcutSignature(event);
    const shortcut = this._shortcuts.get(signature);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.callback(event);
    }
  }

  /**
   * Checks for conflicts with Zen's native shortcuts.
   * @param {string} shortcutStr - The shortcut string to check.
   * @param {string} excludeId - The ID to exclude from conflict check (usually the current shortcut's ID).
   * @returns {{hasConflict: boolean, conflictInfo?: {shortcut: string, id: string}}}
   */
  _checkZenConflict(shortcutStr, excludeId = null) {
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
   * Registers a new keyboard shortcut.
   * @param {string} shortcutStr - The shortcut string (e.g., "Ctrl+Shift+K").
   * @param {string} id - A unique identifier for this shortcut.
   * @param {Function} callback - The function to execute when the shortcut is triggered.
   * @returns {boolean} True if registration was successful, false otherwise.
   */
  register(shortcutStr, id, callback) {
    if (!shortcutStr || !id || typeof callback !== "function") {
      console.error("ShortcutRegistry.register: Invalid arguments", { shortcutStr, id, callback });
      return false;
    }

    const signature = shortcutStringToSignature(shortcutStr);
    this._shortcuts.set(signature, { id, callback, shortcutStr });
    return true;
  }

  /**
   * Unregisters a keyboard shortcut by its ID or shortcut string.
   * @param {string} identifier - The ID or shortcut string of the shortcut to unregister.
   * @returns {boolean} True if unregistration was successful, false otherwise.
   */
  unregister(identifier) {
    const signature = shortcutStringToSignature(identifier);
    const shortcut = this._shortcuts.get(signature);

    if (!shortcut) {
      return false;
    }

    this._shortcuts.delete(signature);
    return true;
  }

  /**
   * Unregisters a shortcut by its ID.
   * @param {string} id - The ID of the shortcut to unregister.
   * @returns {boolean} True if unregistration was successful, false otherwise.
   */
  unregisterById(id) {
    for (const [signature, shortcut] of this._shortcuts.entries()) {
      if (shortcut.id === id) {
        this._shortcuts.delete(signature);
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
  isRegistered(shortcutStr) {
    const signature = shortcutStringToSignature(shortcutStr);
    return this._shortcuts.has(signature);
  }

  /**
   * Gets the ID of the shortcut registered for a given shortcut string.
   * @param {string} shortcutStr - The shortcut string.
   * @returns {string|null} The ID of the registered shortcut, or null if not found.
   */
  getRegistrationId(shortcutStr) {
    const signature = shortcutStringToSignature(shortcutStr);
    const shortcut = this._shortcuts.get(signature);
    return shortcut ? shortcut.id : null;
  }

  /**
   * Checks for conflicts with a given shortcut string.
   * @param {string} shortcutStr - The shortcut string to check.
   * @param {string} [excludeId] - An ID to exclude from conflict checking.
   * @returns {{hasConflict: boolean, conflicts: Array<{shortcut: string, id: string}>}}
   */
  checkConflicts(shortcutStr, excludeId = null) {
    const conflicts = [];

    const existingShortcut = this._shortcuts.get(shortcutStringToSignature(shortcutStr));
    if (existingShortcut && existingShortcut.id !== excludeId) {
      conflicts.push({ shortcut: shortcutStr, id: existingShortcut.id, source: "custom" });
    }

    const zenConflict = this._checkZenConflict(shortcutStr, excludeId);
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
  getAllShortcuts() {
    return Array.from(this._shortcuts.entries()).map(([signature, shortcut]) => ({
      id: shortcut.id,
      shortcutStr: shortcut.shortcutStr,
      signature,
    }));
  }

  /**
   * Clears all registered shortcuts.
   */
  clear() {
    this._shortcuts.clear();
  }
}
