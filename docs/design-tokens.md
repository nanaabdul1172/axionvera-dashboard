# Dashboard Design Tokens

The dashboard design token system centralizes visual decisions in `src/tokens.json` and generates runtime CSS custom properties in `src/styles/theme.css` with `npm run generate-theme`.

## Token hierarchy

- `themes.light` and `themes.dark` contain semantic color tokens for backgrounds, text, borders, brand color, statuses, and overlays.
- `base` contains theme-independent primitives for the Axion palette, typography, spacing, radius, shadows, z-index, transitions, and component sizing.
- Generated CSS variables use `--token-*` names, for example `--token-color-background-primary` and `--token-spacing-4`.
- Compatibility aliases such as `--color-bg-primary`, `--background-primary`, and `--text-primary` keep existing Tailwind utilities working during migration.

## Theme architecture

`ThemeProvider` resolves `light`, `dark`, or `system` preferences, writes the resolved value to `document.documentElement[data-theme]`, and persists workspace or legacy local-storage preferences. Because all semantic tokens are CSS variables, switching themes updates components at runtime without remounting the app.

## Component usage

Prefer semantic Tailwind utilities backed by tokens:

```tsx
<div className="rounded-2xl border border-border-primary bg-background-primary text-text-primary" />
```

For values that are not exposed as Tailwind utilities, use token CSS variables directly:

```tsx
<div className="duration-[--token-transition-duration-base] shadow-[var(--token-shadow-lg)]" />
```

For TypeScript code, import token helpers from `src/tokens`:

```ts
import { cssVar, resolveToken } from '@/tokens';

const focusColor = resolveToken('color.border.focus', 'dark');
const spacing = cssVar('spacing.4');
```

## Migration approach

1. Add or update tokens in `src/tokens.json`.
2. Run `npm run generate-theme`.
3. Replace hardcoded component values with semantic utilities or `--token-*` variables.
4. Add or update token resolution tests in `tests/theme`.
