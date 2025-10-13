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
