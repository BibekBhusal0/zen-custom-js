export function isNotEmptyTab() {
  return !window.gBrowser.selectedTab.hasAttribute("zen-empty-tab");
}
