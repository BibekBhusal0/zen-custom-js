# Fixes

- Small windows (below 950px): the nav component's icon-only mode no longer fights the compact strip. Labels stay available in the hover flyout, icon positions match wide windows, and the sidebar can no longer be scrolled sideways into a state where its icons disappear.
- Rewrote the `about:addons` sidebar rules for Zen 1.21.9+: the old `.category` / `sidebar-footer` markup was replaced by a `categories-box` component rendering the same `moz-page-nav` used on the settings page, so the compact sidebar showed nothing. The sidebar shell now mirrors `preferences.css,` and the component's 40px `--page-nav-margin-inline-start` is zeroed so icons stay inside the collapsed strip.

# Others

# Contributes

Whole credit for this commit release goes to @nordstern
