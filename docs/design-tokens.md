# 1ST0P Design Tokens

## Purpose

This document defines the baseline design token system for 1ST0P across web surfaces.
It standardizes visual language for navigation, forms, application flows, trust states, and market views.

## Design Principles

- Keep the interface grayscale, minimal, and professional.
- Prioritize readability, hierarchy, and confidence over decoration.
- Make trust and status states clear without visual noise.
- Keep interactions consistent across lanes (Launch, Marketplace, Trade).

## Color Tokens

Use semantic token names in implementation (CSS variables, Tailwind config aliases, or component theme maps).

### Background

- `bg.canvas`: `#131417`
- `bg.surface`: `#18181b`
- `bg.surface-elevated`: `#202226`
- `bg.surface-muted`: `#27272a`
- `bg.overlay`: `rgba(10, 10, 12, 0.92)`

### Text

- `text.primary`: `#f4f4f5`
- `text.secondary`: `#d4d4d8`
- `text.muted`: `#a1a1aa`
- `text.subtle`: `#71717a`
- `text.inverse`: `#09090b`

### Border

- `border.default`: `rgba(255, 255, 255, 0.16)`
- `border.subtle`: `rgba(255, 255, 255, 0.10)`
- `border.strong`: `rgba(255, 255, 255, 0.24)`

### Brand Neutrals

- `brand.steel.100`: `#b6bbc4`
- `brand.steel.200`: `#9ca3af`
- `brand.steel.300`: `#4b5058`
- `brand.steel.400`: `#2f3238`
- `brand.paper`: `#f2f3f5`

### State Colors (Subtle)

Use low-saturation state accents only where status clarity is necessary.

- `state.info`: `#93c5fd`
- `state.success`: `#86efac`
- `state.warning`: `#fcd34d`
- `state.error`: `#fca5a5`

State colors should be used for badges, helper copy, and indicators, not full-page backgrounds.

## Typography Tokens

### Font Families

- `font.sans`: Geist, system sans-serif
- `font.mono`: Geist Mono, monospace

### Type Scale

- `type.display`: 48/56, weight 800-900
- `type.h1`: 36/44, weight 700-800
- `type.h2`: 30/38, weight 700
- `type.h3`: 24/32, weight 600-700
- `type.body-lg`: 18/28, weight 400-500
- `type.body`: 16/24, weight 400-500
- `type.body-sm`: 14/22, weight 400-500
- `type.caption`: 12/18, weight 500
- `type.micro`: 11/16, weight 500 (labels, status metadata)

### Typography Rules

- Use sentence case for most UI copy.
- Reserve uppercase tracking for small metadata labels only.
- Use monospace for addresses, hashes, IDs, and numeric technical readouts.

## Spacing Tokens

Spacing follows a consistent scale:

- `space.1`: 4
- `space.2`: 8
- `space.3`: 12
- `space.4`: 16
- `space.5`: 20
- `space.6`: 24
- `space.8`: 32
- `space.10`: 40
- `space.12`: 48
- `space.16`: 64

### Layout Defaults

- Global page horizontal padding: 16 mobile, 24 tablet+, 32 large desktop where needed.
- Major section vertical gap: 32-64.
- Card internal padding: 16-24.
- Form field vertical spacing: 12-16.

## Radius Tokens

- `radius.sm`: 8
- `radius.md`: 12
- `radius.lg`: 16
- `radius.xl`: 24
- `radius.2xl`: 28-32 (hero and high-level containers)
- `radius.pill`: 9999

## Shadow Tokens

- `shadow.sm`: `0 4px 12px rgba(0,0,0,0.16)`
- `shadow.md`: `0 8px 20px rgba(0,0,0,0.28)`
- `shadow.lg`: `0 16px 36px rgba(0,0,0,0.36)`
- `shadow.inset-soft`: `inset 0 1px 0 rgba(255,255,255,0.06)`

Use shadows sparingly; rely primarily on spacing + contrast + borders.

## Component State Tokens

### Interactive Base States

- `state.default`: neutral surface + subtle border
- `state.hover`: slightly brighter surface
- `state.active`: stronger border + darker fill
- `state.focus`: visible ring with neutral contrast
- `state.disabled`: reduced opacity + no elevation
- `state.loading`: fixed dimensions with skeleton or spinner

### Input and Form States

- `input.default`: `bg.surface` + `border.default`
- `input.focus`: `border.strong` + focus ring
- `input.error`: subtle error border + helper text using `state.error`
- `input.success`: subtle success border + helper text using `state.success`

### Status Badges (Trust Flows)

Recommended status set:

- `draft`
- `submitted`
- `under_review`
- `interview_required`
- `approved`
- `rejected`
- `active`
- `completed`
- `disputed`
- `refunded`

Badge styles should stay neutral-first, with minimal accent for exception states.

## Accessibility Baseline

- Body text contrast target: WCAG AA minimum.
- Interactive controls must have visible focus indication.
- Hover-only affordances must also be represented in focus/active states.
- Critical status should never rely on color alone; include icon or text.

## Current UI Alignment Notes

Current implementation already aligns with this baseline in key areas:

- Sticky global shell and context navigation use grayscale surfaces and subtle borders.
- Wallet connect button styling follows neutral palette and consistent radius/shadow.
- Major cards and sections use elevated dark surfaces with restrained contrast.

Areas to normalize in upcoming UI commits:

- Centralize token variables in a single theme source.
- Apply consistent typography scale to all headings and metadata labels.
- Normalize state badge styling across launch, marketplace, and trade flows.
