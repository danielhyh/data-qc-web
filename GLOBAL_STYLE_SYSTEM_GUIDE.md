# Global Style System Implementation Guide

## Overview
This project centralizes all global styling in `src/styles/index.scss`, which loads the shared CSS variable tokens (`var.css`), theme overrides, and Element Plus integrations. The entry file (`src/main.ts`) imports this stylesheet so the rules apply application-wide.【F:src/styles/index.scss†L1-L5】【F:src/main.ts†L18-L20】

The global system is designed around reusable design tokens, typography scales, interaction polish, and theme-specific mixins that can be carried into other projects. This document explains how to adopt the same setup.

## Core Design Tokens
All foundational CSS variables live in `src/styles/var.css`. They expose:

- **Radius scale** – five border radius levels for component consistency.【F:src/styles/var.css†L4-L9】
- **Layout metrics** – menu widths, header heights, padding, and shadows for structural elements such as the sidebar, header, and tabs.【F:src/styles/var.css†L11-L68】
- **Tech aesthetic colors** – a unified gradient pair, layered background gradients, light-surface colors, and hover/active transparencies.【F:src/styles/var.css†L70-L100】
- **Effects** – shared shadows and transition timing used across components.【F:src/styles/var.css†L102-L108】

Always reference these variables when building new components so light/dark themes stay in sync.

## Typography System
The typography scale is declared inside `index.scss` on the `:root` selector. It defines the font families, seven font sizes, multiple line-heights, weight tokens, and letter-spacing utilities.【F:src/styles/index.scss†L48-L90】

Global element resets then apply:

- Base font smoothing and size for `html`/`body` with brand text color.【F:src/styles/index.scss†L92-L109】
- Heading classes `.h1`–`.h6` that align with semantic headings `h1`–`h6`. They set size, weight, spacing, and color tokens so you can mix semantic and utility usage.【F:src/styles/index.scss†L111-L160】
- Utility classes for font sizes (`.text-xs`…`.text-xl`), weights (`.font-light`…`.font-bold`), and colors (`.text-primary`, `.text-secondary`, `.text-tertiary`, `.text-brand`).【F:src/styles/index.scss†L168-L230】
- Monospace helpers for numeric/metric displays using tabular figures.【F:src/styles/index.scss†L232-L240】

Reuse these utilities instead of redefining typography in new screens.

## Interaction & Polish
Key global enhancements include:

- Gradient scrollbars, thin scrollbar mode, and hover transitions for consistent micro-interactions.【F:src/styles/index.scss†L279-L305】
- A universal easing curve applied to all transitions for smooth motion.【F:src/styles/index.scss†L435-L438】
- Tech-themed link styling and muted text helpers for subtle emphasis.【F:src/styles/index.scss†L251-L266】
- `nprogress` recoloring so route changes align with the Element Plus primary tone.【F:src/styles/index.scss†L22-L38】

## Element Plus Integration Layer
`index.scss` overrides Element Plus components to match the global tokens:

- Standardized radii for cards, dialogs, popovers, inputs, dropdowns, and pickers.【F:src/styles/index.scss†L306-L433】
- Dropdown, cascader, autocomplete, and color picker panels share spacing, hover, and selected states grounded in the tech palette.【F:src/styles/index.scss†L333-L433】
- Table styling upgrades adjust typography hierarchy, padding, hover highlighting, fixed column behavior, and zebra striping, ensuring data grids look polished by default.【F:src/styles/index.scss†L440-L600】

When creating custom Element Plus themes elsewhere, start by copying these overrides and reusing the same CSS variables.

## Theme Mixins and Component Patterns
Two theme files provide reusable mixins:

- **tech-theme.scss** introduces dark/tech mixins such as `@mixin glass-effect`, `@mixin tech-card`, and `@mixin tech-button` for frosted glass surfaces, animated gradients, and neon accents. It also applies dark-mode overrides for buttons, tables, forms, menus, tabs, pagination, status tags, and loading shimmer effects.【F:src/styles/tech-theme.scss†L3-L188】【F:src/styles/tech-theme.scss†L236-L389】
- **tech-theme-light.scss** mirrors the same structure for light mode, offering `tech-card-light` and `tech-button-light` mixins plus comprehensive Element Plus customizations (tables, forms, menus, pagination, tags, progress, etc.).【F:src/styles/tech-theme-light.scss†L3-L399】【F:src/styles/tech-theme-light.scss†L402-L632】

For new projects, import these files after `var.css` and call the mixins inside component-scoped styles or new utility classes to guarantee stylistic parity.

## Custom Component Blueprints
Both theme files define ready-to-use patterns for repeated UI:

- **Statistic cards** – gradient header strip, large numeric value with gradient fill, and supporting label/icon placement.【F:src/styles/tech-theme.scss†L194-L234】【F:src/styles/tech-theme-light.scss†L513-L557】
- **Search containers** – pill-shaped inputs with icon alignment and focus transitions.【F:src/styles/tech-theme.scss†L236-L272】【F:src/styles/tech-theme-light.scss†L560-L597】
- **Status tags** – rounded chips with color-coded borders across success/warning/error/info states for both themes.【F:src/styles/tech-theme.scss†L358-L388】【F:src/styles/tech-theme-light.scss†L601-L632】

Use these structures as drop-in snippets when reproducing analytics dashboards or filter bars.

## Adoption Checklist for New Projects
1. Copy `src/styles` into the new project and adjust paths as needed.
2. Import `@/styles/index.scss` from the application entry point (e.g., `main.ts`).【F:src/main.ts†L18-L20】
3. Ensure Element Plus (or another component library) uses the same namespace variables if applicable; update `variables.scss` or the exported namespace tokens when integrating with CSS modules.【F:src/styles/global.module.scss†L1-L6】
4. Maintain the CSS variable definitions in `var.css` as the single source of truth. If additional tokens are required, add them there and reuse across SCSS files to keep light/dark parity.
5. When introducing new component patterns, build them as mixins or utility classes so they can be shared across both tech-theme files.

Following this structure allows any AI or developer to recreate the cohesive “tech” visual language in future projects without re-implementing styles from scratch.
