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

  // A rough mapping for special keys.
  const KEYCODE_MAP = {
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
    enter: "VK_RETURN",
    escape: "VK_ESCAPE",
    delete: "VK_DELETE",
    backspace: "VK_BACK",
  };

  const keycode = KEYCODE_MAP[keyPart] || null;
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

  // Key or Keycode is added.
  const REVERSE_KEYCODE_MAP = {
    VK_F1: "F1",
    VK_F2: "F2",
    VK_F3: "F3",
    VK_F4: "F4",
    VK_F5: "F5",
    VK_F6: "F6",
    VK_F7: "F7",
    VK_F8: "F8",
    VK_F9: "F9",
    VK_F10: "F10",
    VK_F11: "F11",
    VK_F12: "F12",
    VK_RETURN: "Enter",
    VK_ESCAPE: "Escape",
    VK_DELETE: "Delete",
    VK_BACK: "Backspace",
  };

  if (shortcutObject.keycode) {
    parts.push(REVERSE_KEYCODE_MAP[shortcutObject.keycode] || shortcutObject.keycode);
  } else if (shortcutObject.key) {
    parts.push(shortcutObject.key.toUpperCase());
  }

  return parts.join("+");
}
