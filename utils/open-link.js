/**
 * Opens a URL in the requested destination.
 * Unavailable destinations fall back to a plain new tab.
 * @param {string} url - The URL to open.
 * @param {string} [where="new tab"] - Destination: "current tab", "new tab",
 * "background tab", "new window", "incognito"/"private", "glance", "vsplit"/"hsplit".
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
    case "vsplit":
    case "hsplit":
      if (window.gZenViewSplitter) {
        const sep = destination === "vsplit" ? "vsep" : "hsep";
        const tab1 = gBrowser.selectedTab;
        await openTrustedLinkIn(url, "tab");
        const tab2 = gBrowser.selectedTab;
        gZenViewSplitter.splitTabs([tab1, tab2], sep, 1);
        return true;
      }
      break;
    default:
      break;
  }
  openTrustedLinkIn(url, "tab");
  return false;
}
