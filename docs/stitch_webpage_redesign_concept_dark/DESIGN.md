---
name: Climate Ledger Dark
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff7886'
  on-tertiary-container: '#780021'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
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
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  metric-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
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
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style
This design system defines an institutional, high-precision carbon accounting and verification interface. It bridges the authority of cryptographic climate-fintech with the clarity of real-time geospatial intelligence. The visual tone is technical, unassailable, and luminous—engineered for environmental analysts, corporate auditors, and decentralized governance participants who require immediate confidence in ecological data integrity.

The design movement combines **technical minimalism** and **refined dark glassmorphism**. Visual weight is established through deep abyss-grade slate surfaces, microscopic 1px luminous edge borders, translucent overlays, and deliberate neon status highlights. It completely avoids decorative skeuomorphism, prioritizing mathematical density, crisp geometric data readouts, and unmistakable auditability.

## Colors
The palette is built upon a high-contrast dark foundation engineered for low-light command desks and continuous audit workflows:

- **Surface & Canvas (`#0B0F17`, `#111827`, `#1E293B`)**: The deepest foundation `#0B0F17` forms the background canvas. Elevated container panels sit at `#111827`, overlaid with subtle alpha levels (`rgba(17, 24, 39, 0.75)` to `rgba(30, 41, 59, 0.65)`) for layered depth.
- **Primary Emerald (`#10B981`, `#059669`)**: Signals verified states, positive ecological claims, attestation confirmations, and primary actions. Glows at `rgba(16, 185, 129, 0.2)` against dark surfaces.
- **Secondary Amber/Gold (`#F59E0B`, `#D97706`)**: Denotes assets under review, minted credits issued (`CTC`), and pending multisig transactions.
- **Tertiary Coral/Rose (`#F43F5E`, `#E11D48`)**: Explicitly identifies anomalies, high-risk variance, flagged fraud attempts, and destructive actions.
- **Data Accents (`#38BDF8`)**: Soft cyan used strictly for telemetry markers, confidence progress bars, and coordinate metadata.
- **Borders & Dividers**: `rgba(255, 255, 255, 0.08)` for standard card edges, rising to `rgba(16, 185, 129, 0.3)` on hover or active verification states.

## Typography
Typography is paired to separate mathematical structure from narrative context. Headings utilize **Plus Jakarta Sans** for modern geometric authority, tight tracking, and confident character shaping. Numerical readouts, metric panels, body descriptions, and ledger tables rely on **Inter** to ensure maximum readability under dense tabular conditions.

All upper-case tracking (such as column headers, metric categories, and micro status pills) uses `0.04em` to `0.06em` letter spacing for legibility on ultra-dark backdrops. Tabular figures (`tnum`) must be enforced on all financial units, metric counters, coordinate numbers, and ledger records to prevent character jitter during real-time streaming updates.

## Layout & Spacing
The layout follows a fluid 12-column responsive grid structure centered within a maximum canvas width of `1440px`.

- **Desktop (1024px+)**: 12 columns, `1.25rem` (20px) gutters, `2rem` (32px) margins. Metric ribbons span across 3-column or 4-column equal blocks. Geospatial displays, review queues, and submission forms distribute across asymmetric 7:5 or 6:6 layouts.
- **Tablet (768px - 1023px)**: 8 columns, `1rem` (16px) gutters, `1.5rem` (24px) margins. Data metrics collapse to 2x2 grid configurations.
- **Mobile (<768px)**: 4 columns, `0.75rem` (12px) gutters, `1rem` (16px) margins. Form inputs, review cards, and ledger tables reflow into single-column stacked blocks with horizontal scrolling enabled for wide tabular feeds.

Inner panel layouts rely on compact vertical rhythms using `space-xs` (4px) and `space-sm` (8px) for related metadata clusters, and `space-lg` (24px) for distinct card content modules.

## Elevation & Depth
Depth is created through frosted transparency, surface tone stepping, and luminous edge lighting rather than standard diffuse drop shadows:

- **Level 0 (Canvas Base)**: Solid `#0B0F17`.
- **Level 1 (Structural Cards & Map Underlay)**: Background `#111827` rendered at `80%` opacity with a `16px` backdrop blur (`backdrop-filter: blur(16px)`). Edges are defined by a 1px inner or outer border using `rgba(255, 255, 255, 0.07)`.
- **Level 2 (Active Elements & Interactive Modals)**: Background `#1E293B` at `90%` opacity with `24px` backdrop blur. Edges feature high-precision hairline borders (`rgba(255, 255, 255, 0.12)`).
- **Luminous Edge Focus**: Focused inputs, flagged cards, and verified highlights replace heavy drop shadows with focused neon edge glows:
  - Verified: `box-shadow: 0 0 0 1px #10B981, 0 4px 20px -2px rgba(16, 185, 129, 0.25)`
  - Flagged: `box-shadow: 0 0 0 1px #F43F5E, 0 4px 20px -2px rgba(244, 63, 94, 0.25)`
  - Review / Pending: `box-shadow: 0 0 0 1px #F59E0B, 0 4px 20px -2px rgba(245, 158, 11, 0.25)`

## Shapes
The design system adopts a balanced, contemporary rounded corner profile (`roundedness: 2`):
- **Base Components (Inputs, Buttons, Badges)**: `0.5rem` (8px) border radius for crisp operational efficiency.
- **Card Containers & Modal Dialogs**: `0.75rem` to `1rem` (12px to 16px) for softened content encapsulation without appearing juvenile.
- **Status Pills & Micro Indicators**: Fully rounded pill shapes (`9999px`) reserved strictly for status labels, confidence score tags, and filter toggles.

## Components

### Buttons & Interactive Triggers
- **Primary Action (Attest / Verify / Submit)**: Solid `#10B981` surface with `#042F2E` or `#061C14` high-contrast bold text. Hover shifts to `#059669` with a subtle `rgba(16, 185, 129, 0.4)` perimeter glow.
- **Secondary / Ghost**: Deep navy background `#1E293B` with 1px border `rgba(255, 255, 255, 0.12)`, text `#F3F4F6`. Hover adds `rgba(255, 255, 255, 0.05)` surface brightness.
- **Icon Buttons**: Centered 16px glyphs nested within 36px/40px touch boundaries with subtle `0.5rem` radius.

### Form Inputs & Textareas
- Base background sits at `#0F172A` with a 1px border of `rgba(255, 255, 255, 0.1)`. Text color `#F9FAFB`, placeholder text `#64748B`.
- Numeric stepping, date selectors, and coordinate inputs feature discrete monospace coordinate labels and subtle custom dark calendar/arrow SVG adornments.
- Focus state triggers a clean 1px border in `#10B981` along with a subtle ambient teal glow.

### Status Chips & Badges
- **Structure**: Pill-shaped (`rounded-full`), height of 22px, padding `0 10px`, font `label-sm`.
- **Variants**:
  - *Verified*: Background `rgba(16, 185, 129, 0.12)`, text `#34D399`, 1px border `rgba(16, 185, 129, 0.25)`. Accompanied by a 6px glowing emerald dot.
  - *Under Review / Partial*: Background `rgba(245, 158, 11, 0.12)`, text `#FBBF24`, 1px border `rgba(245, 158, 11, 0.25)`.
  - *Flagged / Anomaly*: Background `rgba(244, 63, 94, 0.12)`, text `#FB7185`, 1px border `rgba(244, 63, 94, 0.25)`.

### Data Cards & Metric Displays
- Built with frosted translucent surfaces (`rgba(17, 24, 39, 0.7)`), 1px border in `rgba(255, 255, 255, 0.06)`, padding `space-md` (16px) to `space-lg` (24px).
- Metric titles use `label-sm` in uppercase slate (`#94A3B8`). Values are displayed prominently with `metric-lg` using contextual accent coloring (`#10B981` for verified counts, `#F59E0B` for CTC token volume, `#F43F5E` for active anomalies).

### Tables & Data Ledger
- Table header row uses subtle background `rgba(255, 255, 255, 0.02)` with `1px` bottom border `rgba(255, 255, 255, 0.06)`, text styled with `label-sm` in `#64748B`.
- Row cells display `body-sm` or `body-md` typography. Interactive rows exhibit a smooth hover state to `rgba(255, 255, 255, 0.03)` with a transitioning 2px left border accent indicating row state.
- Inline confidence meters feature a slim 4px track (`#1E293B`) filled with neon cyan (`#38BDF8`) or emerald (`#10B981`) based on statistical thresholds.

### Geospatial / Map Surface
- Choropleth or coordinate maps exist on `#090D14` with country/hex geometries tinted in `#1E293B` and borders at `#0F172A`.
- Active nodes deploy animated concentric pulses matching claim status: emerald (verified), amber (pending), and coral (anomaly). Marker size scales logarithmically with metric quantity.