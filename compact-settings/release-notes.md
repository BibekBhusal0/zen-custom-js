# New Features

- Expanded sidebar flyout now has an elevation shadow and a smoother 180ms decelerate animation; `prefers-reduced-motion` disables the animation.
- Shared design tokens (`--cs-*` in userContent.css) keep the settings and add-ons sidebars in sync.

# Fixes

- Rewrote preferences.css for the Zen 1.21+ settings redesign: the old `vbox.navigation` / richlist markup was replaced by the shadow-DOM `<moz-page-nav>` component, so the mod had no effect on the settings page.
- about:addons sidebar rebuilt to match: labels no longer show clipped first letters when collapsed, footer settings/support links align with the category icon column, and the selected category keeps its accent icon while collapsed.

# Others

- Header divider on about:addons slimmed from 4px to 1px.

# Contributes
