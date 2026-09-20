import { escapeXmlAttribute } from "../utils/parse.js";
import { eventToShortcutSignature, getPrettyShortcut } from "../utils/keyboard.js";

const MODIFIER_KEYS = ["Control", "Alt", "Shift", "Meta"];

export const sanitizeId = (str) => String(str ?? "").replace(/[^a-zA-Z0-9-_]/g, "-");

export const prefId = (prefKey) => `pref-${String(prefKey).toLowerCase().replace(/_/g, "-")}`;

/**
 * Shared settings shell for Zen mods. Renders markup only; all visuals
 * live in shared/settings-modal.css. Visibility is toggled with `hidden`,
 * `data-expanded` and state classes, never inline styles.
 */
export class ZenuxSettings {
  constructor(prefsClass) {
    this.PREFS = prefsClass;
    this.values = {};
    this._shortcutTarget = null;
    this._boundShortcutKeyDown = this._handleShortcutKeyDown.bind(this);
    this._boundEscapeToClose = null;
    this._onClose = null;
  }

  static shell({
    title,
    bodyHTML,
    tabs = null,
    closeId,
    saveId,
    overlayClass = "",
    overlayId = "",
    modalClass = "",
  }) {
    const tabsHTML = tabs
      ? `<div class="zenux-settings-tabs" role="tablist">${tabs
          .map(
            (tab) =>
              `<button class="zenux-settings-tab" role="tab" data-tab="${escapeXmlAttribute(tab.id)}">${escapeXmlAttribute(tab.label)}</button>`
          )
          .join("")}</div>`
      : "";
    return `
      <div class="zenux-settings-overlay ${escapeXmlAttribute(overlayClass)}"${overlayId ? ` id="${escapeXmlAttribute(overlayId)}"` : ""}>
        <div class="zenux-settings-modal ${escapeXmlAttribute(modalClass)}" role="dialog" aria-label="${escapeXmlAttribute(title)}">
          <div class="zenux-settings-header">
            <h3 class="zenux-settings-title">${escapeXmlAttribute(title)}</h3>
            <div class="zenux-settings-actions">
              <button id="${escapeXmlAttribute(closeId)}" class="zenux-btn-ghost" data-close>Close</button>
              <button id="${escapeXmlAttribute(saveId)}" class="zenux-btn-primary" data-save>Save</button>
            </div>
          </div>
          ${tabsHTML}
          <div class="zenux-settings-content">
            ${bodyHTML}
          </div>
        </div>
      </div>
    `;
  }

  static accordionSection({
    title,
    expanded = true,
    resetPrefs = [],
    before = "",
    body = "",
    after = "",
    id = "",
  }) {
    const reset = resetPrefs.filter(Boolean).join(",");
    return `
      <section class="zenux-settings-section zenux-settings-accordion" data-expanded="${expanded ? "true" : "false"}"${id ? ` id="${escapeXmlAttribute(id)}"` : ""}>
        <h4 class="zenux-settings-section-head" data-accordion-head>
          <span class="zenux-settings-section-title">${escapeXmlAttribute(title)}</span>
          ${
            reset
              ? `<button class="zenux-settings-reset zenux-icon-btn" data-reset-prefs="${escapeXmlAttribute(reset)}" title="Reset section" aria-label="Reset ${escapeXmlAttribute(title)}">
              <img src="chrome://global/skin/icons/reload.svg" />
            </button>`
              : ""
          }
          <img class="zenux-settings-chevron" src="chrome://global/skin/icons/arrow-down-12.svg" />
        </h4>
        <div class="zenux-settings-accordion-body">
          <div class="zenux-settings-accordion-inner">
            ${before}
            ${body}
            ${after}
          </div>
        </div>
      </section>
    `;
  }

  static checkboxRow(label, prefKey, { id = prefId(prefKey), checked = false } = {}) {
    return `
      <div class="zenux-setting-item">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)}</label>
        <input type="checkbox" id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}"${checked ? " checked" : ""} />
      </div>
    `;
  }

  static numberRow(label, prefKey, { min, max, step, tooltip, value, id = prefId(prefKey) } = {}) {
    const info = tooltip ? ZenuxSettings.infoIcon(tooltip) : "";
    const attrs = [
      min !== undefined ? `min="${escapeXmlAttribute(String(min))}"` : "",
      max !== undefined ? `max="${escapeXmlAttribute(String(max))}"` : "",
      step !== undefined ? `step="${escapeXmlAttribute(String(step))}"` : "",
      value !== undefined && value !== null ? `value="${escapeXmlAttribute(String(value))}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `
      <div class="zenux-setting-item">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)} ${info}</label>
        <input type="number" class="zenux-input" id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}" ${attrs} />
      </div>
    `;
  }

  static textRow(
    label,
    prefKey,
    { placeholder = "", password = false, maxlength, value, id = prefId(prefKey) } = {}
  ) {
    return `
      <div class="zenux-setting-item">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)}</label>
        <input type="${password ? "password" : "text"}" class="zenux-input" id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}" placeholder="${escapeXmlAttribute(placeholder)}"${maxlength ? ` maxlength="${maxlength}"` : ""}${value !== undefined && value !== null ? ` value="${escapeXmlAttribute(String(value))}"` : ""} />
      </div>
    `;
  }

  static textareaRow(
    label,
    prefKey,
    { placeholder = "", rows = 3, value, id = prefId(prefKey) } = {}
  ) {
    return `
      <div class="zenux-setting-item zenux-setting-item-stacked">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)}</label>
        <textarea class="zenux-input" id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}" rows="${rows}" placeholder="${escapeXmlAttribute(placeholder)}">${value !== undefined && value !== null ? escapeXmlAttribute(String(value)) : ""}</textarea>
      </div>
    `;
  }

  static selectRow(label, prefKey, options = {}, { id = prefId(prefKey), value } = {}) {
    const optionsHTML = Object.entries(options)
      .map(
        ([optionValue, optionLabel]) =>
          `<option value="${escapeXmlAttribute(optionValue)}"${value !== undefined && value !== null && String(optionValue) === String(value) ? " selected" : ""}>${escapeXmlAttribute(optionLabel)}</option>`
      )
      .join("");
    return `
      <div class="zenux-setting-item">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)}</label>
        <select id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}">
          ${optionsHTML}
        </select>
      </div>
    `;
  }

  static shortcutRow(label, prefKey, { id = prefId(prefKey), value } = {}) {
    return `
      <div class="zenux-setting-item">
        <label for="${escapeXmlAttribute(id)}">${escapeXmlAttribute(label)}</label>
        <input type="text" id="${escapeXmlAttribute(id)}" data-pref="${escapeXmlAttribute(prefKey)}" readonly placeholder="Click to set" class="zenux-input zenux-shortcut-input"${value ? ` value="${escapeXmlAttribute(String(value))}"` : ""} />
      </div>
    `;
  }

  static infoIcon(tooltip) {
    return `<span class="zenux-settings-info" data-tooltip="${escapeXmlAttribute(tooltip)}"><img src="chrome://global/skin/icons/info.svg" /></span>`;
  }

  static warning(text, id = "") {
    return `<div class="zenux-settings-warning"${id ? ` id="${escapeXmlAttribute(id)}"` : ""}>${escapeXmlAttribute(text)}</div>`;
  }

  static providerGroup({ id, title, headerAfter = "", body = "", hidden = false }) {
    return `
      <div class="zenux-settings-provider-group"${id ? ` id="${escapeXmlAttribute(id)}"` : ""}${hidden ? " hidden" : ""}>
        <div class="zenux-settings-provider-head">
          <h5>${escapeXmlAttribute(title)}</h5>
          ${headerAfter}
        </div>
        ${body}
      </div>
    `;
  }

  /**
   * Build a `data-pref` row from a descriptor, with the current pref value
   * already applied, so callers never touch the control afterwards.
   * Descriptor: { key, label, type, ...row options }.
   * Types: "bool" (alias "checkbox"), "number", "text" (aliases "char",
   * "password" via `password: true`), "textarea", "select" (`options`),
   * "shortcut" (stored raw, displayed pretty).
   */
  prefRow(item) {
    const current = this.PREFS.getPref(item.key);
    const type = item.type || "bool";
    switch (type) {
      case "bool":
      case "checkbox":
        return ZenuxSettings.checkboxRow(item.label, item.key, {
          id: item.id,
          checked: Boolean(current),
        });
      case "number":
        return ZenuxSettings.numberRow(item.label, item.key, {
          id: item.id,
          value: current ?? "",
          min: item.min,
          max: item.max,
          step: item.step,
          tooltip: item.tooltip,
        });
      case "password":
        return ZenuxSettings.textRow(item.label, item.key, {
          id: item.id,
          value: current ?? "",
          placeholder: item.placeholder,
          maxlength: item.maxlength,
          password: true,
        });
      case "textarea":
        return ZenuxSettings.textareaRow(item.label, item.key, {
          id: item.id,
          value: current ?? "",
          placeholder: item.placeholder,
          rows: item.rows,
        });
      case "select":
        return ZenuxSettings.selectRow(item.label, item.key, item.options || {}, {
          id: item.id,
          value: current ?? "",
        });
      case "shortcut":
        return ZenuxSettings.shortcutRow(item.label, item.key, {
          id: item.id,
          value: getPrettyShortcut(current),
        });
      case "char":
      case "text":
      default:
        return ZenuxSettings.textRow(item.label, item.key, {
          id: item.id,
          value: current ?? "",
          placeholder: item.placeholder,
          maxlength: item.maxlength,
        });
    }
  }

  /**
   * Build an accordion section from row descriptors. Reset prefs default to
   * the item keys; pass `resetPrefs` explicitly to override (or [] for none).
   */
  prefAccordion({ title, items, expanded = true, resetPrefs, before = "", after = "" }) {
    return ZenuxSettings.accordionSection({
      title,
      expanded,
      resetPrefs: resetPrefs ?? items.map((item) => item.key),
      before,
      body: items.map((item) => this.prefRow(item)).join(""),
      after,
    });
  }

  controlValue(control) {
    if (control.type === "checkbox") return control.checked;
    if (control.type === "number") {
      const parsed = Number(control.value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return control.value;
  }

  applyValueToControl(control, value) {
    if (control.type === "checkbox") {
      control.checked = Boolean(value);
    } else if (
      typeof control.setItems === "function" ||
      control.classList.contains("zenux-combobox")
    ) {
      control.value = value ?? "";
    } else {
      control.value = value ?? "";
    }
  }

  syncFromPrefs(root) {
    root.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      if (control.classList.contains("zenux-shortcut-input")) {
        control.value = getPrettyShortcut(this.PREFS.getPref(prefKey));
      } else {
        this.applyValueToControl(control, this.PREFS.getPref(prefKey));
      }
      this.values[prefKey] = this.PREFS.getPref(prefKey);
    });
  }

  saveToPrefs() {
    for (const [prefKey, value] of Object.entries(this.values)) {
      try {
        this.PREFS.setPref(prefKey, value);
      } catch (e) {
        this.PREFS.debugError(`Error saving pref for ${prefKey}:`, e);
      }
    }
  }

  resetPrefsIn(root, prefsToReset, onPrefChange) {
    for (const prefKey of prefsToReset) {
      if (!prefKey) continue;
      let defVal = this.PREFS.defaultValues[prefKey];
      const control = root.querySelector(`[data-pref="${prefKey}"]`);
      if (defVal === undefined) {
        if (!control) continue;
        defVal = control.type === "checkbox" ? false : control.type === "number" ? 0 : "";
      }
      this.values[prefKey] = defVal;
      if (control) {
        if (control.classList.contains("zenux-shortcut-input")) {
          control.value = getPrettyShortcut(defVal);
        } else {
          this.applyValueToControl(control, defVal);
        }
      }
      if (typeof onPrefChange === "function") onPrefChange(prefKey, defVal);
    }
  }

  attachAccordion(root) {
    root.querySelectorAll(".zenux-settings-accordion").forEach((section) => {
      section.addEventListener("click", (event) => {
        if (event.target.closest("[data-reset-prefs]")) return;
        if (section.dataset.expanded === "false") {
          section.dataset.expanded = "true";
          return;
        }
        if (event.target.closest("[data-accordion-head]")) {
          section.dataset.expanded = "false";
        }
      });
    });
  }

  attachResetButtons(root, onPrefChange) {
    root.querySelectorAll("[data-reset-prefs]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        this.resetPrefsIn(root, String(btn.dataset.resetPrefs || "").split(","), onPrefChange);
      });
    });
  }

  attachPrefTracking(root, onPrefChange) {
    root.querySelectorAll("[data-pref]").forEach((control) => {
      const prefKey = control.dataset.pref;
      if (control.classList.contains("zenux-shortcut-input")) return;
      if (control.classList.contains("zenux-combobox")) {
        control.addEventListener("command", (event) => {
          this.values[prefKey] = event.target.value;
          if (typeof onPrefChange === "function") onPrefChange(prefKey, this.values[prefKey]);
        });
      } else {
        control.addEventListener("change", (event) => {
          this.values[prefKey] = this.controlValue(event.target);
          if (typeof onPrefChange === "function") onPrefChange(prefKey, this.values[prefKey]);
        });
      }
    });
  }

  attachDismiss(overlay, onClose) {
    this._onClose = onClose;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) this.close();
    });
    overlay.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });
    this._boundEscapeToClose = (event) => {
      if (event.key === "Escape") this.close();
    };
    window.addEventListener("keydown", this._boundEscapeToClose);
  }

  close() {
    window.removeEventListener("keydown", this._boundShortcutKeyDown, true);
    if (this._boundEscapeToClose) {
      window.removeEventListener("keydown", this._boundEscapeToClose);
      this._boundEscapeToClose = null;
    }
    this._shortcutTarget = null;
    if (typeof this._onClose === "function") {
      const callback = this._onClose;
      this._onClose = null;
      callback();
    }
  }

  switchTab(root, tabId) {
    root.querySelectorAll("[data-tab-content]").forEach((el) => {
      el.hidden = el.dataset.tabContent !== tabId;
    });
    root.querySelectorAll("[data-tab]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.tab === tabId);
    });
  }

  attachTabs(root, initialTab = null) {
    const tabs = [...root.querySelectorAll("[data-tab]")];
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(root, tab.dataset.tab));
    });
    if (initialTab) this.switchTab(root, initialTab);
    else if (tabs.length) this.switchTab(root, tabs[0].dataset.tab);
  }

  attachShortcutInputs(root) {
    root.querySelectorAll(".zenux-shortcut-input[data-pref]").forEach((input) => {
      input.addEventListener("focus", (event) => {
        this._shortcutTarget = event.target;
        event.target.classList.add("is-recording");
        event.target.placeholder = "Press keys...";
        window.addEventListener("keydown", this._boundShortcutKeyDown, true);
      });
      input.addEventListener("blur", () => this._stopShortcutRecording());
      input.addEventListener("keydown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });
  }

  _stopShortcutRecording() {
    if (!this._shortcutTarget) return;
    this._shortcutTarget.classList.remove("is-recording");
    this._shortcutTarget.placeholder = "Click to set";
    this._shortcutTarget = null;
    window.removeEventListener("keydown", this._boundShortcutKeyDown, true);
  }

  _handleShortcutKeyDown(event) {
    if (!this._shortcutTarget) return;
    event.preventDefault();
    event.stopPropagation();

    const target = this._shortcutTarget;
    const prefKey = target.dataset.pref;

    if (event.key === "Escape") {
      target.value = getPrettyShortcut(this.values[prefKey] ?? this.PREFS.getPref(prefKey));
      this._stopShortcutRecording();
      target.blur();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      target.value = "";
      this.values[prefKey] = "";
      this._stopShortcutRecording();
      target.blur();
      return;
    }

    if (MODIFIER_KEYS.includes(event.key)) return;

    const shortcut = eventToShortcutSignature(event);
    target.value = getPrettyShortcut(shortcut);
    this.values[prefKey] = shortcut;
    this._stopShortcutRecording();
    target.blur();
  }
}

/**
 * Standalone recorder for inputs that are not bound to a boolean/string pref
 * (e.g. per-command shortcuts). Shares the same key handling and CSS classes.
 */
export function attachStandaloneShortcutRecorder(
  input,
  { initialValue = "", onCommit, onClearConflict } = {}
) {
  const boundKeyDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      input.value = getPrettyShortcut(initialValue);
      stop();
      input.blur();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      input.value = "";
      onCommit("");
      stop();
      input.blur();
      return;
    }

    if (MODIFIER_KEYS.includes(event.key)) return;

    const shortcut = eventToShortcutSignature(event);
    input.value = getPrettyShortcut(shortcut);
    onCommit(shortcut);
    stop();
    input.blur();
  };

  function stop() {
    input.classList.remove("is-recording");
    input.placeholder = input.dataset.placeholder || "Set Shortcut";
    window.removeEventListener("keydown", boundKeyDown, true);
    if (typeof onClearConflict === "function") onClearConflict();
  }

  input.addEventListener("focus", () => {
    input.classList.add("is-recording");
    input.placeholder = "Press keys...";
    window.addEventListener("keydown", boundKeyDown, true);
  });
  input.addEventListener("keydown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  return { stop };
}
