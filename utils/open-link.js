/**
 * Opens a URL in the requested destination.
 * Unavailable destinations fall back to a plain new tab.
 * @param {string} url - The URL to open.
 * @param {string} [where="new tab"] - Destination: "current tab", "new tab",
 * "background tab", "new window", "incognito"/"private", "glance",
 * "vsep"/"vsplit", "hsep"/"hsplit".
 * @returns {Promise<boolean>} True if opened as requested, false if a fallback tab was used.
 */
export async function openLink(url, where = "new tab") {
  if (!url) return false;
  const destination = where?.toLowerCase()?.trim();
  switch (destination) {
    case "current tab":
      openTrustedLinkIn(url, "current");
      return true;
    case "new tab":
      openTrustedLinkIn(url, "tab");
      return true;
    case "background tab":
      openTrustedLinkIn(url, "tab", { inBackground: true, relatedToCurrent: true });
      return true;
    case "new window":
      openTrustedLinkIn(url, "window");
      return true;
    case "incognito":
    case "private":
      window.openTrustedLinkIn(url, "window", { private: true });
      return true;
    case "glance": {
      const manager = window.gZenGlanceManager;
      if (manager?.openGlance) {
        try {
          const tabboxRect = gBrowser.tabbox?.getBoundingClientRect();
          const clickPosition = window.gZenUIManager?._lastClickPosition ?? {
            clientX: tabboxRect ? tabboxRect.width / 2 : window.innerWidth / 2,
            clientY: tabboxRect ? tabboxRect.height / 2 : window.innerHeight / 2,
          };
          manager.openGlance({
            url,
            ...clickPosition,
            width: 0,
            height: 0,
            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
          });
          return true;
        } catch {
          break;
        }
      }
      break;
    }
    case "vsep":
    case "vsplit":
    case "hsep":
    case "hsplit": {
      const splitter = window.gZenViewSplitter;
      if (!splitter) break;
      const sep = destination.startsWith("v") ? "vsep" : "hsep";
      const side = sep === "vsep" ? "right" : "bottom";
      const currentTab = gBrowser.selectedTab;
      const wasInGroup = !!currentTab?.splitView;
      await openTrustedLinkIn(url, "tab");
      const newTab = gBrowser.selectedTab;
      splitter.splitTabs([currentTab, newTab], sep, 1);
      const group = splitter._data.find((g) => g.tabs.includes(newTab));
      if (!group || group.gridType === sep) return true;
      if (!wasInGroup || group.tabs.length <= 2) {
        splitter.splitTabs([...group.tabs], sep, group.tabs.indexOf(newTab));
        return true;
      }
      const curNode = splitter.getSplitNodeFromTab(currentTab);
      const newNode = splitter.getSplitNodeFromTab(newTab);
      if (!curNode?.parent || !newNode?.parent || curNode === newNode) {
        splitter.splitTabs([...group.tabs], sep, group.tabs.indexOf(newTab));
        return true;
      }
      const oldParent = newNode.parent;
      oldParent.children.splice(oldParent.children.indexOf(newNode), 1);
      const restore = (oldParent.children.length + 1) / oldParent.children.length;
      oldParent.children.forEach((c) => (c.sizeInParent *= restore));
      splitter.splitIntoNode(curNode, newNode, side, 0.5);
      splitter.activateSplitView(group, true);
      return true;
    }
    default:
      break;
  }
  openTrustedLinkIn(url, "tab");
  return false;
}
