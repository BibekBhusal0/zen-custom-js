import { parseElement } from "../utils/parse.js";
import { startupFinish } from "../utils/startup-finish.js";
import { showToast } from "../utils/toast.js";

const STACK_ENTRY =
  "#zen-library-download-list > .zen-library-download-list-download";
const STACK_ACTION = ".download-rename-action";
const ROW_ACTION = ".download-rename-row-action";
const ROW_SHOW_BUTTON = '[data-l10n-id="library-downloads-show-button"]';
const ROW_SECTION = "zen-library-downloads-section";
const MENU = "menupopup.zen-library-downloads-menu";
const MENU_ACTION = "download-rename";
const RENAME_INPUT = ".download-rename-input";
const EDITING = "download-renaming";

let modules;
let downloadsList;
let scanTimer;

function loadModules() {
  modules ??= Promise.all([
    ChromeUtils.importESModule("resource://gre/modules/Downloads.sys.mjs"),
    ChromeUtils.importESModule("resource://gre/modules/DownloadHistory.sys.mjs"),
  ]).then(([downloads, history]) => ({
    Downloads: downloads.Downloads,
    DownloadHistory: history.DownloadHistory,
  }));
  return modules;
}

function sanitizeFileName(name) {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  return cleaned === "." || cleaned === ".." ? "" : cleaned;
}

async function availablePath(dir, fileName, oldPath) {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot) : "";
  for (let copy = 1; ; copy++) {
    const candidate = copy === 1 ? fileName : `${base} (${copy})${extension}`;
    const path = PathUtils.join(dir, candidate);
    if (path === oldPath || !(await IOUtils.exists(path))) {
      return path;
    }
  }
}

async function persistTarget(download, newPath) {
  download.target.path = newPath;
  try {
    await download.refresh();
  } catch (error) {
    console.warn("[download-rename] refresh failed", error);
  }
  download._notifyChange?.();

  const url = download.source?.url;
  if (!url || download.source?.isPrivate) {
    return;
  }
  try {
    const { DownloadHistory } = await loadModules();
    const targetUri = PathUtils.toFileURI(newPath);
    const pageInfo = await PlacesUtils.history.fetch(url);
    if (!pageInfo) {
      return;
    }
    await PlacesUtils.history.update({
      annotations: new Map([["downloads/destinationFileURI", targetUri]]),
      guid: pageInfo.guid,
      url: pageInfo.url,
    });
    await DownloadHistory.updateMetaData(download);
  } catch (error) {
    console.warn("[download-rename] history update failed", error);
  }
}

async function renameDownload(download, requestedName) {
  const oldPath = download.target?.path;
  if (!oldPath) {
    return;
  }
  const fileName = sanitizeFileName(requestedName);
  if (!fileName) {
    throw new Error("That is not a valid file name.");
  }
  if (fileName === PathUtils.filename(oldPath)) {
    return;
  }
  const newPath = await availablePath(
    PathUtils.parent(oldPath),
    fileName,
    oldPath
  );
  await IOUtils.move(oldPath, newPath, { noOverwrite: true });
  await persistTarget(download, newPath);
}

function beginRename(host, download) {
  if (!host || host.querySelector(`:scope > ${RENAME_INPUT}`)) {
    return;
  }

  const currentName = PathUtils.filename(download.target.path);
  const input = parseElement(
    `<input class="download-rename-input" type="text" spellcheck="false" aria-label="File name"/>`
  );
  input.value = currentName;

  host.classList.add(EDITING);
  host.insertBefore(input, host.firstElementChild);
  document.documentElement.setAttribute("zen-renaming-tab", "true");

  const stopMouseLeave = (event) => {
    if (event.target.closest("#zen-sidebar-foot-buttons")) {
      event.stopPropagation();
      event.preventDefault();
    }
  };
  document.addEventListener("mouseleave", stopMouseLeave, true);

  let done = false;
  const finish = (value) => {
    if (done) {
      return;
    }
    done = true;
    input.remove();
    host.classList.remove(EDITING);
    document.documentElement.removeAttribute("zen-renaming-tab");
    document.removeEventListener("mouseleave", stopMouseLeave, true);

    if (value === null || value.trim() === currentName) {
      return;
    }
    renameDownload(download, value).catch((error) => {
      console.error("[download-rename]", error);
      showToast({
        title: "Rename failed",
        description: error.message || String(error),
      });
    });
  };

  for (const type of ["click", "mousedown", "pointerdown", "dblclick"]) {
    input.addEventListener(type, (event) => event.stopPropagation());
  }
  input.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      finish(input.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(null);
    }
  });
  input.addEventListener("blur", () => finish(input.value));

  input.focus();
  const dot = currentName.lastIndexOf(".");
  input.setSelectionRange(0, dot > 0 ? dot : currentName.length);
}

function injectStackButtons() {
  for (const entry of document.querySelectorAll(STACK_ENTRY)) {
    if (entry.querySelector(STACK_ACTION)) {
      continue;
    }
    const nativeAction = entry.querySelector(".zen-library-download-action");
    if (!nativeAction) {
      continue;
    }
    const button = nativeAction.cloneNode(false);
    button.className = "toolbarbutton-1 no-squircles download-rename-action";
    button.removeAttribute("data-l10n-id");
    button.setAttribute("tooltiptext", "Rename");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (entry.download?.target?.path) {
        beginRename(
          entry.querySelector(".zen-library-download-list-title-container"),
          entry.download
        );
      }
    });
    entry.insertBefore(button, nativeAction);
  }
}

function pathFromRow(row) {
  const src = row.querySelector(".zen-library-row-icon")?.getAttribute("src");
  if (!src) {
    return null;
  }
  if (src.startsWith("moz-icon:")) {
    const raw = src.slice("moz-icon:".length).split("?")[0].replace(/^\/\//, "");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  try {
    return Services.io.newURI(src).QueryInterface(Ci.nsIFileURL).file.path;
  } catch {
    return null;
  }
}

async function downloadForRow(row) {
  const path = pathFromRow(row);
  if (!path) {
    return null;
  }
  const { Downloads } = await loadModules();
  downloadsList ??= await Downloads.getList(Downloads.ALL);
  const downloads = await downloadsList.getAll();
  return downloads.find((download) => download.target?.path === path) ?? null;
}

async function startRowRename(row) {
  const download = await downloadForRow(row);
  if (!download?.target?.path || !row.isConnected) {
    return;
  }
  beginRename(row.querySelector(".zen-library-row-text"), download);
}

function injectRowButtons(section) {
  for (const row of section.querySelectorAll(".zen-library-row")) {
    const actions = row.querySelector(".zen-library-row-actions");
    if (!actions) {
      continue;
    }
    const showButton = actions.querySelector(ROW_SHOW_BUTTON);
    const existing = actions.querySelector(ROW_ACTION);

    if (!showButton) {
      existing?.remove();
      continue;
    }
    if (existing) {
      continue;
    }

    const button = showButton.cloneNode(true);
    button.className = "toolbarbutton-1 download-rename-row-action";
    button.removeAttribute("data-l10n-id");
    button.setAttribute("tooltiptext", "Rename");
    const icon = button.querySelector(".toolbarbutton-icon");
    if (icon) {
      icon.src = "chrome://global/skin/icons/edit.svg";
    }
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      startRowRename(row);
    });
    actions.appendChild(button);
  }
}

function injectMenu() {
  const menu = document.querySelector(MENU);
  if (!menu || menu.querySelector(`[data-action="${MENU_ACTION}"]`)) {
    return;
  }

  const item = parseElement(
    `<menuitem data-action="${MENU_ACTION}" label="Rename…"/>`,
    "xul"
  );
  const show = menu.querySelector('[data-action="show"]');
  if (show) {
    show.after(item);
  } else {
    menu.prepend(item);
  }

  menu.addEventListener("popupshowing", () => {
    const row = document.querySelector(".zen-library-row[menu-open]");
    item.disabled = !row?.querySelector(ROW_SHOW_BUTTON);
  });
  item.addEventListener("command", () => {
    const row = document.querySelector(".zen-library-row[menu-open]");
    window.setTimeout(() => row && startRowRename(row), 0);
  });
}

function scan() {
  injectStackButtons();
  const section = document.querySelector(ROW_SECTION);
  if (section) {
    injectRowButtons(section);
  }
  injectMenu();
}

function scheduleScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scan, 80);
}

function isRelevant(record) {
  const target = record.target;
  if (target.nodeType === 1) {
    if (
      target.closest(
        `#zen-sidebar-foot-buttons, #zen-library-panel, #mainPopupSet, ${ROW_SECTION}`
      )
    ) {
      return true;
    }
  }
  return [...record.addedNodes].some(
    (node) =>
      node.nodeType === 1 &&
      node.matches?.(
        `${ROW_SECTION}, .zen-library-download-list-download, .zen-library-row, ${MENU}`
      )
  );
}

startupFinish(() => {
  scan();
  new MutationObserver((records) => {
    if (records.some(isRelevant)) {
      scheduleScan();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
});
