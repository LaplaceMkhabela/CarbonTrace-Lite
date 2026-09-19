---
name: Climate Precision Pristine
colors:
  surface: '#faf8fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf8fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#3d4a3c'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#6d7b6b'
  outline-variant: '#bccbb8'
  surface-tint: '#006e28'
  primary: '#006e28'
  on-primary: '#ffffff'
  primary-container: '#34c759'
  on-primary-container: '#004d1a'
  inverse-primary: '#53e16f'
  secondary: '#885200'
  on-secondary: '#ffffff'
  secondary-container: '#fd9d06'
  on-secondary-container: '#653c00'
  tertiary: '#c0000a'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff8e80'
  on-tertiary-container: '#890005'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#72fe88'
  primary-fixed-dim: '#53e16f'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531c'
  secondary-fixed: '#ffddbb'
  secondary-fixed-dim: '#ffb868'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#673d00'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#faf8fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
  canvas-base: '#F5F5F7'
  canvas-subtle: '#FBFBFD'
  surface-glass: rgba(255, 255, 255, 0.82)
  surface-solid: '#FFFFFF'
  text-primary: '#1D1D1F'
  text-secondary: '#86868B'
  text-tertiary: '#A1A1A6'
  border-hairline: rgba(0, 0, 0, 0.06)
  border-subtle: '#E5E5EA'
  accent-emerald: '#10B981'
  accent-mint: '#34C759'
  accent-telemetry: '#007AFF'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.03em
  metric-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style
This design system defines an ultra-refined, light appearance interface for carbon attestation, ecological asset management, and climate-fintech auditing. Directly informed by Apple’s Human Interface Guidelines (macOS Sonoma, Sequoia, and iOS 18), the aesthetic captures pristine clarity, engineering precision, and calm institutional authority. The environment speaks to ESG compliance executives, institutional sustainability auditors, and capital allocators who demand immaculate optical ergonomics, legible statistical readouts, and immediate trust.

The visual approach merges **Apple HIG minimalism** with **optical glassmorphism**. The canvas avoids clinical stark white in favor of soft off-white foundational fields (`#F5F5F7` and `#FBFBFD`). Content is held inside floating, frosted glass containers (`rgba(255, 255, 255, 0.82)`) with microscopic hairline strokes and diffused ambient shadows. The interface prioritizes spacious typographic breathing room, effortless hierarchy, and focused emerald accents—creating a native, pro-grade desktop application atmosphere.

## Colors
The palette balances neutral Apple system grays with luminous ecological accents:

- **Canvas & Backdrops**: `#F5F5F7` acts as the foundational desktop canvas, while `#FBFBFD` is used for recessed content cavities and grouped tool areas. 
- **Surfaces & Glass**: Cards, sidebars, and contextual sheets utilize high-transmission frosted surfaces (`rgba(255, 255, 255, 0.82)` to `rgba(255, 255, 255, 0.94)`) combined with backdrop blur. Solid `#FFFFFF` is used for high-emphasis popovers and active nested widgets.
- **System Typography**: Text colors follow the HIG trio: `#1D1D1F` for primary text and high-weight figures; `#86868B` for secondary labels, table headers, and structural metadata; `#A1A1A6` for micro-captions and disabled items.
- **Accents & States**:
  - *Primary Emerald/Mint (`#34C759` / `#10B981`)*: Used for verified environmental attestations, valid audit certificates, active toggles, and primary CTAs.
  - *Secondary Amber (`#FF9F0A`)*: Reserved for pending carbon credits, queue validation, and audit warnings.
  - *Tertiary Crimson (`#FF3B30`)*: Applied exclusively to carbon discrepancies, anomaly spikes, and destructive operations.
  - *Telemetry Blue (`#007AFF`)*: Drives geospatial pins, external ledger hyperlinks, and temporal range filters.
- **Borders & Dividers**: Hairline separations use `rgba(0, 0, 0, 0.06)` or `#E5E5EA`, ensuring structure without visual noise.

## Typography
The typographic hierarchy establishes clear distinction between narrative content and high-precision data display:

- **Display & Numerical Highlights**: **Plus Jakarta Sans** provides a modern, geometric character set. Its tight tracking and refined letterforms give metric displays and ledger headers an authoritative, Apple-like executive feel.
- **Narrative & Data Cells**: **Inter** handles running text, metadata rows, and dense financial matrices. Tabular figures (`font-feature-settings: 'tnum' 1`) must be enabled on all numerical outputs, token balances, timestamps, and geographic coordinates to maintain horizontal alignment during data refreshes.
- **Tracking & Proportion**: Micro-labels, table category headers, and state capsules apply slight positive letter-spacing (`0.02em` to `0.04em`) to ensure legibility against subtle gray backgrounds. Headings tighten systematically from `-0.015em` to `-0.03em` as font size scales up.

## Layout & Spacing
The layout follows a fluid-responsive 12-column grid constrained to an Apple-style maximum width of `1440px`, flanked by generous canvas margins:

- **Desktop (1024px+)**: 12 columns with `1.25rem` (20px) gutters and `2rem` (32px) margins. Panels split naturally along 8:4 (Ledger and Inspector), 6:6 (Equi-spaced Verification queues), or 3-column metric cards.
- **Tablet (768px - 1023px)**: 8 columns with `1rem` (16px) gutters and `1.5rem` (24px) canvas margins. Metric modules wrap into 2x2 grids, while secondary inspector drawers slide into overlaid bottom-sheets or side-sheets.
- **Mobile (<768px)**: 4 columns with `0.75rem` (12px) gutters and `1rem` (16px) margins. Views reflow into single vertical stacks. Tabular views remain full-fidelity with horizontal kinetic scrolling.

Internal component spacing follows an 8pt spatial grid: `space-xs` (4px) for inline metadata badges; `space-sm` (8px) for input internal padding and label separation; `space-md` (16px) for standard panel padding; and `space-lg` (24px) for module sectioning.

## Elevation & Depth
Depth relies on frosted translucent surfaces, subtle hairline contours, and ultra-diffused ambient drop shadows, matching macOS Sequoia and iOS 18:

- **Level 0 (Canvas)**: Non-elevated off-white field (`#F5F5F7`).
- **Level 1 (Frosted Glass Cards & Panels)**: Background `rgba(255, 255, 255, 0.82)` with `backdrop-filter: blur(20px) saturate(180%)`. Outlined with a 1px border `rgba(0, 0, 0, 0.06)`. Elevated by an ambient shadow: `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)`.
- **Level 2 (Hovered Cards & Segmented Containers)**: Background `rgba(255, 255, 255, 0.92)` with `backdrop-filter: blur(24px)`. Elevated with `box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)`.
- **Level 3 (Modals, Popovers, & Dropdown Sheets)**: Solid or near-solid `#FFFFFF` (96% opacity) with `backdrop-filter: blur(32px)`. Outlined with `rgba(0, 0, 0, 0.08)` and elevated by `box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.10), 0 4px 12px rgba(0, 0, 0, 0.04)`.
- **Focus & Selection Rims**: Instead of heavy shadows, interactive focus displays an Apple-standard outer glow ring: `box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.25), 0 1px 2px rgba(0, 0, 0, 0.05)`.

## Shapes
The shape language implements Apple-style squircle-like geometry (`roundedness: 2`):

- **Controls & Micro Elements (Inputs, Buttons, Segmented Tabs)**: `0.5rem` (8px) to `0.625rem` (10px) radius for precise fingertip or cursor targeting.
- **Containers & Glass Cards**: `1rem` (16px) radius (`rounded-lg`), establishing smooth, modern framing across dashboard widgets.
- **Overlays, Large Drawers, & Modals**: `1.25rem` to `1.5rem` (20px to 24px) radius (`rounded-xl`).
- **Capsules & Status Badges**: Full pill radius (`9999px`) for system chips, pill tabs, and attestation tags.

## Components

### Buttons
- **Primary CTA**: Solid Apple emerald `#34C759` (or refined `#10B981`), text `#FFFFFF`, font `label-md`. Subtle top inner highlight (`inset 0 1px 0.5px rgba(255, 255, 255, 0.35)`). Hover shifts background to `#2EB04E`. Pressed state scales subtly to `0.985`.
- **Secondary / Standard**: Frosted white `rgba(255, 255, 255, 0.85)`, border 1px `rgba(0, 0, 0, 0.08)`, text `#1D1D1F`. Hover transitions to solid `#FFFFFF` with `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)`.
- **Ghost / Tertiary**: Transparent background, text `#1D1D1F`, hover surface `rgba(0, 0, 0, 0.04)`.

### Form Inputs & Selectors
- **Input Fields**: Crisp background `#FFFFFF` (or `rgba(255, 255, 255, 0.7)`), height 40px, border 1px `rgba(0, 0, 0, 0.12)`, text `#1D1D1F`, placeholder `#A1A1A6`, radius `0.5rem` (8px). 
- **Focus**: Border `#34C759` with a soft outer ring `box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.2)`.
- **Segmented Controls (iOS / macOS Style)**: Encapsulated track in `#E5E5EA` with `0.5rem` radius, padding 2px. Active tab is an elevated white pill (`#FFFFFF`, `box-shadow: 0 1px 3px rgba(0,0,0,0.12)`).

### Status Chips & Badges
- **Pill Badges**: Height 22px, padding `0 10px`, radius `9999px`, font `label-sm`.
  - *Verified / Compliant*: Surface `rgba(52, 199, 89, 0.12)`, text `#248A3D`, 1px hairline border `rgba(52, 199, 89, 0.22)`. Features a 6px solid emerald status dot.
  - *Pending / Escrow*: Surface `rgba(255, 159, 10, 0.12)`, text `#B26A00`, 1px border `rgba(255, 159, 10, 0.22)`.
  - *Anomaly / Non-compliant*: Surface `rgba(255, 59, 48, 0.12)`, text `#D70015`, 1px border `rgba(255, 59, 48, 0.22)`.

### Cards & Ledger Tables
- **Cards**: Background `rgba(255, 255, 255, 0.82)`, `backdrop-filter: blur(20px)`, border 1px `rgba(0, 0, 0, 0.06)`, radius `1rem` (16px), padding `space-md` (16px) to `space-lg` (24px).
- **Data Ledger**: Header row styled with `label-sm` in `#86868B`, 1px hairline bottom border `rgba(0, 0, 0, 0.06)`. Data rows feature `body-sm` text with tabular figures. Alternating or hover interaction uses `rgba(0, 0, 0, 0.02)` with smooth 150ms transitions.

### Verification Progress Bar & Visualizers
- Track height 4px to 6px, background `#E5E5EA`, rounded to `9999px`. Indicator bar fills with `#34C759` for verified percentages and `#FF9F0A` for pending tranches.