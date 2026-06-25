# Accessibility Guide — Axionvera Dashboard

## Standards

This project targets **WCAG 2.1 Level AA** compliance.

---

## Audit Findings (2026-06-24)

### Issues Resolved

| Area | Issue | Fix Applied |
|------|-------|-------------|
| Color contrast | `--color-text-secondary` failed on secondary backgrounds | Darkened to `#334155` (light) / `#e2e8f0` (dark) |
| Color contrast | `--color-border-primary` too faint in light mode | Changed to `#cbd5e1` |
| Focus visibility | No global `:focus-visible` rule | Added to `globals.css` with 2px outline |
| ThemeToggle | Static `aria-label` didn't reflect current state | Dynamic: "Switch to light/dark mode" |
| Navbar | Wallet dropdown had no Escape key handler | Added `keydown` listener; returns focus to trigger |
| Navbar | External links had no screen-reader indication | Added `(opens in new tab)` via `.sr-only` span |
| Sidebar | Duplicate `menuItems` const (compile error) | Removed duplicate; kept complete definition |
| Sidebar | Icon SVGs were not marked decorative | Added `aria-hidden="true"` to all nav icons |
| FormInput | Required `*` had no screen-reader text | Added `.sr-only` "(required)" span |
| TransactionHistory | Redundant `aria-label` on selects with visible `<label>` | Removed redundant attributes |
| TransactionHistory | Table rendered `filteredTransactions`, ignoring sort | Now renders `sortedTransactions` |
| TransactionHistory | Results count not announced on filter change | Added `aria-live="polite"` |
| Skeletons | Loading placeholders gave no screen-reader indication | Added `role="status"` and `.sr-only` text |
| CreateProposalModal | No `role="dialog"`, no focus trap, no close button label | Full dialog pattern: focus trap, `aria-labelledby`, Escape key, labelled close |
| TransactionSimulationPreview | No `role="dialog"`, no focus trap | Full dialog pattern applied |
| ProposalCard | Button had no accessible label | `aria-label` includes title, status, and user vote |
| ProposalCard | Vote distribution bar was read by screen readers | Added `aria-hidden="true"` to decorative bar |
| ProposalList | Filter/sort selects had no labels | Added visible `sr-only` labels with `htmlFor` |
| ProposalList | Search input was `type="text"` | Changed to `type="search"` |
| ProposalList | Empty-state and search icons announced | Added `aria-hidden="true"` |
| ProposalDetail | Back button had no label | `aria-label="Back to proposals list"` |
| ProposalDetail | Vote buttons had no descriptive labels | Added `aria-label` and `aria-busy` |
| ProposalDetail | Vote status updates not announced | Wrapped in `aria-live="polite"` region |
| ProposalDetail | Show/hide votes button missing state | Added `aria-expanded` and `aria-label` |
| SecuritySettingsForm | Password strength bars conveyed no text | Added `aria-valuemin/max/now` on progressbar; `.sr-only` requirement summary |
| AnalyticsMetrics | Six decorative SVG icons missing `aria-hidden` | Added `aria-hidden="true"` to all |
| 404 page | Decorative SVGs missing `aria-hidden` | Fixed |
| 500 page | Details toggle missing `type`, `aria-expanded`, `aria-controls` | Fixed; details panel gets matching `id` |

---

## Patterns in Use

### Modal / Dialog Pattern
Both `CreateProposalModal` and `TransactionSimulationPreview` implement:
- `role="dialog"` + `aria-modal="true"` on the panel
- `aria-labelledby` pointing to the dialog title `id`
- Focus trapped inside while open (Tab/Shift+Tab cycle within focusable elements)
- Escape key closes the dialog and restores focus to the trigger element

### Focus Management
- Sidebar already had a full focus trap with Escape support.
- Global `:focus-visible` outline ensures keyboard users always see a visible indicator without affecting mouse users.

### Live Regions
- `aria-live="polite"` is used for: filter result counts, vote status messages.
- `role="status"` is used for skeleton loaders.
- `role="alert"` is used for error messages (immediate announcement).

### Screen-Reader-Only Text (`.sr-only`)
Used via the `.sr-only` CSS class (defined in `globals.css`) for:
- Required field markers `*` → "(required)"
- External link indicators → "(opens in new tab)"
- Skeleton loading descriptions
- Password strength requirement summaries

---

## Testing Checklist

### Keyboard Navigation
- [ ] Tab through every page — all interactive elements reachable
- [ ] Shift+Tab reverses correctly
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate dropdown menus

### Screen Reader (NVDA / VoiceOver)
- [ ] All images have descriptive `alt` text
- [ ] All icon-only buttons have `aria-label`
- [ ] Form fields announce their labels and error messages
- [ ] Loading states are announced
- [ ] Modal titles are read on open
- [ ] Live region updates are announced without interruption

### Color Contrast
Run [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) against:
- `--color-text-secondary` (#334155) on `--color-bg-primary` (#ffffff) → ≥ 7:1 ✓
- `--color-text-secondary` (#e2e8f0) on `--color-bg-primary` (#020617) in dark mode → ≥ 7:1 ✓

### Automated Tooling
Integrate one of these into CI for ongoing coverage:
- [axe-core](https://github.com/dequelabs/axe-core) via `@axe-core/react`
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright axe](https://playwright.dev/docs/accessibility-testing)

---

## Out of Scope

- Full design overhaul
- Backend compliance systems
- Legal certification (VPAT, Section 508 formal audit)
