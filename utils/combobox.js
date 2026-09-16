import { parseElement, escapeXmlAttribute, xulImage } from "./parse.js";

export function createCombobox({
  id = "",
  extraClass = "",
  items = [],
  value = "",
  placeholder = "Select…",
  searchable = true,
  searchPlaceholder = "Search…",
  attrs = {},
} = {}) {
  const attrString = Object.entries(attrs)
    .map(([key, val]) => `${key}="${escapeXmlAttribute(String(val))}"`)
    .join(" ");

  const root = parseElement(
    `<div class="zenux-combobox ${extraClass}"${id ? ` id="${id}"` : ""}${
      attrString ? ` ${attrString}` : ""
    } tabindex="0" role="combobox" aria-expanded="false" aria-haspopup="listbox">
      <span class="zenux-combobox-label"></span>
    </div>`
  );

  const iconEl = xulImage("", "zenux-combobox-icon");
  const markerEl = xulImage(
    "chrome://global/skin/icons/arrow-down-12.svg",
    "zenux-combobox-marker"
  );

  const popup = parseElement(
    `<div class="zenux-combobox-popup" hidden>
      <input type="text" class="zenux-combobox-search zenux-input" placeholder="${escapeXmlAttribute(
        searchPlaceholder
      )}" aria-label="${escapeXmlAttribute(searchPlaceholder)}" />
      <div class="zenux-combobox-list" role="listbox"></div>
    </div>`
  );

  const labelEl = root.querySelector(".zenux-combobox-label");
  root.insertBefore(iconEl, labelEl);
  root.appendChild(markerEl);
  const searchEl = popup.querySelector(".zenux-combobox-search");
  const listEl = popup.querySelector(".zenux-combobox-list");

  let currentItems = [];
  let currentValue = value ?? "";
  let isOpen = false;

  function syncDisplay() {
    const selected = currentItems.find((item) => item.value === currentValue);
    if (selected) {
      labelEl.textContent = selected.label;
      labelEl.classList.remove("is-placeholder");
      if (selected.image) iconEl.setAttribute("src", selected.image);
      else iconEl.removeAttribute("src");
    } else {
      labelEl.textContent = placeholder;
      labelEl.classList.add("is-placeholder");
      iconEl.removeAttribute("src");
    }
    root.setAttribute("aria-label", labelEl.textContent);
  }

  function syncListSelection() {
    listEl.querySelectorAll(".zenux-combobox-item").forEach((el) => {
      el.setAttribute("aria-selected", String(el.dataset.value === currentValue));
    });
  }

  function visibleItems() {
    return [...listEl.querySelectorAll(".zenux-combobox-item:not([hidden])")];
  }

  function highlight(el) {
    listEl.querySelectorAll(".zenux-combobox-item.is-highlighted").forEach((item) => {
      item.classList.remove("is-highlighted");
    });
    if (el) {
      el.classList.add("is-highlighted");
      el.scrollIntoView({ block: "nearest" });
    }
  }

  function renderList(filter = "") {
    const query = filter.toLowerCase().trim();
    listEl.innerHTML = "";
    let firstVisible = null;
    for (const item of currentItems) {
      if (query && !(item.label || "").toLowerCase().includes(query)) continue;
      const itemEl = parseElement(
        `<div class="zenux-combobox-item" role="option" data-value="${escapeXmlAttribute(
          item.value
        )}" aria-selected="${item.value === currentValue}">
          <span></span>
        </div>`
      );
      itemEl.insertBefore(xulImage(item.image || "", "zenux-combobox-item-icon"), itemEl.firstChild);
      itemEl.querySelector("span").textContent = item.label;
      itemEl.addEventListener("click", () => select(item.value));
      itemEl.addEventListener("mousemove", () => highlight(itemEl));
      listEl.appendChild(itemEl);
      firstVisible ??= itemEl;
    }
    if (!firstVisible) {
      listEl.appendChild(parseElement(`<div class="zenux-combobox-no-results">No results</div>`));
    }
    highlight(firstVisible);
  }

  function positionPopup() {
    const rect = root.getBoundingClientRect();
    popup.style.minWidth = `${rect.width}px`;
    popup.style.maxWidth = `${Math.max(rect.width, 320)}px`;
    popup.hidden = false;
    const height = Math.min(popup.offsetHeight, 280);
    const below = window.innerHeight - rect.bottom - 8;
    popup.style.left = `${Math.min(rect.left, window.innerWidth - popup.offsetWidth - 8)}px`;
    if (below >= height || below >= rect.top) {
      popup.style.top = `${rect.bottom + 4}px`;
      popup.style.bottom = "";
      popup.style.maxHeight = `${Math.min(280, below)}px`;
    } else {
      popup.style.bottom = `${window.innerHeight - rect.top + 4}px`;
      popup.style.top = "";
      popup.style.maxHeight = `${Math.min(280, rect.top - 8)}px`;
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    root.setAttribute("aria-expanded", "true");
    searchEl.value = "";
    renderList("");
    document.documentElement.appendChild(popup);
    positionPopup();
    if (searchEl.hidden) {
      root.focus();
    } else {
      searchEl.focus();
    }
  }

  function close(refocus = false) {
    if (!isOpen) return;
    isOpen = false;
    root.setAttribute("aria-expanded", "false");
    popup.remove();
    if (refocus) root.focus();
  }

  function select(nextValue) {
    currentValue = nextValue ?? "";
    syncDisplay();
    syncListSelection();
    close();
    root.dispatchEvent(new Event("command", { bubbles: true }));
  }

  root.addEventListener("click", (event) => {
    if (event.target === searchEl) return;
    if (isOpen) close();
    else open();
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
  });

  searchEl.addEventListener("input", () => renderList(searchEl.value));

  searchEl.addEventListener("keydown", (event) => {
    const items = visibleItems();
    const index = items.findIndex((el) => el.classList.contains("is-highlighted"));
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      highlight(items[(index + 1) % items.length] ?? null);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlight(items[(index - 1 + items.length) % items.length] ?? null);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = items[index] ?? items[0];
      if (target) select(target.dataset.value);
    }
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (isOpen && !popup.contains(event.target) && !root.contains(event.target)) close();
    },
    true
  );

  document.addEventListener(
    "scroll",
    (event) => {
      if (isOpen && !popup.contains(event.target)) close();
    },
    true
  );

  window.addEventListener("resize", () => close());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) close(true);
  });

  Object.defineProperty(root, "value", {
    get: () => currentValue,
    set: (next) => {
      currentValue = next ?? "";
      syncDisplay();
      syncListSelection();
    },
    configurable: true,
  });

  root.setItems = (nextItems) => {
    currentItems = nextItems ?? [];
    searchEl.hidden = !searchable || currentItems.length < 8;
    syncDisplay();
    if (isOpen) renderList(searchEl.value);
  };

  root.setItems(items);
  return root;
}
