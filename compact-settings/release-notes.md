# New Features

# Fixes

- Rewrote the about:addons sidebar rules for Zen 1.21.9+: the old `.category` / `sidebar-footer` markup was replaced by a `categories-box` component rendering the same `moz-page-nav` used on the settings page, so the compact sidebar showed nothing. The sidebar shell now mirrors preferences.css, and the component's 40px `--page-nav-margin-inline-start` is zeroed so icons stay inside the collapsed strip.

# Others

# Contributes
