# Design

Canonical visual direction for the Forældrehelte / Havets Helte app. Derived from
`foraeldrehelte-mockup-light.html`, which applies havetshelte.dk's light theme to the product.
The mockup is the source of truth for look and feel; this file is the implementable contract.

Where the mockup's raw values fail the accessibility floor in `PRODUCT.md` (older, less
tech-confident leaders on a phone), this file specifies the corrected value and marks it
**[a11y floor]**. Build to the values here, not to the mockup's literal CSS.

## Register

product. Design serves the task (oprette vagter, melde sig på, tjekke fremmøde), it is not the product.

## Color

Strategy: **restrained**. Tinted-neutral surfaces, navy as the structural color, and a single
warm accent (coral) reserved for the primary action. Teal is a secondary/status accent, gold is
a category tint only. Never more than the one coral CTA per view.

These are the havetshelte light roles (same 20 hex values as the dark variant, light mapping).

```css
:root {
  /* Surfaces */
  --bg:          #f6f6f6;  /* app background */
  --surface:     #ffffff;  /* sheets, cards, modals */
  --row-bg:      #f6f6f6;  /* inset rows, input fields */

  /* Ink */
  --text:        #232323;  /* body + headings */
  --muted:       #6a6a6a;  /* [a11y floor] secondary text. Mockup #7c7c7c fails AA (~4.0:1); this is ~4.7:1 on #fff */
  --navy:        #003366;  /* brand structural color, primary surfaces (tabs, avatars) */
  --navy-mid:    #0f4172;  /* hero gradient stop, icon accents */

  /* Lines */
  --border:      #cbcbcb;  /* input + emphasized borders */
  --border-soft: #e9e9e9;  /* card + divider borders */

  /* Status + accents */
  --success:     #c9e1bd;
  --warning:     #f4daa6;  /* gold; price + task category tints only */
  --coral:       #ea636f;  /* PRIMARY ACTION ONLY (join, confirm, CTA) */
  --accent:      #337ab7;
  --teal:        #2c98b7;  /* secondary accent, section-label icons */
  --teal-deep:   #146e88;  /* event-category text */
  --teal-light:  #6ebccd;  /* on-navy accent text only */
}
```

Rules:
- **Coral is sacred.** It marks the one thing the user is meant to do (Meld dig på, Tilmeld, Meld
  mig på). Do not use it for borders, links, or decoration. Destructive/cancel uses a coral
  *outline/hover*, never a coral fill.
- `--teal-light` only on navy. It fails contrast on white.
- Category badges: `timed` -> navy tint, `task` -> gold tint, `event` -> teal tint. These three,
  no others.
- `#fff` / near-black `#232323` are inherited brand values; keep them, do not re-tint. (This is the
  one deliberate exception to the usual "tint every neutral" rule, per PRODUCT.md "genbrug
  designsystemet".)

## Typography

```css
--font-body:    "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
```

Body and display are the same family. **Hierarchy comes from size and weight, never from a second
typeface.** (The mockup's `--font-display: Arial` is a no-op against Helvetica body; do not rely on
it for contrast.) Weight contrast must be >=1.25 in effect: pair 400/600 body against 700 headings.

Scale (mobile-first, px):
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| hero-title | clamp(30, 7vw, 40) | 700 | Page hero only |
| event-title | 17 | 600 | Card / event titles |
| shift-time | 15 | 600 | Row primary |
| body | 13-15 | 400-500 | Descriptions, rows |
| label | 13 | 600, **`--text`** | **[a11y floor]** Form labels. Mockup uses 12px muted; bump size + ink for legibility |
| section-label | 12 | 700, uppercase, .08em | Section headers (with teal icon) |
| meta / sub | 12 | 400 | Times, locations, counts (color `--muted`) |

- Cap body measure at 65-75ch.
- Labels are visible text above the field, never placeholder-only (PRODUCT.md).

## Spacing & Radius

```css
--radius-sm:  4px;   /* rows, inputs, cards, buttons (default) */
--radius-md:  12px;  /* event hub cards */
--radius-lg:  20px;  /* content sheet top corners */
--radius-pill:999px; /* badges, chips, status pills, the coral CTA */
```

- **One card radius per role.** Cards = `--radius-sm`, hub event cards = `--radius-md`. Do not mix
  4px and 12px within the same list. (Drop the mockup's `--radius-xl: 50px`; the modal uses
  `--radius-md`, not a 50px blob.)
- Spacing rhythm in multiples of 5px: 5 / 10 / 15 / 20 / 30 / 40. Vary section gaps (40px above a
  section-label) against tight in-card gaps (10px). Avoid uniform padding everywhere.

## Elevation

```css
--shadow-flat: 0 2px 2px rgba(0,0,0,.08);   /* resting cards, chips */
--shadow-lift: 0 8px 18px rgba(0,0,0,.10);  /* hover, modal */
```

- Flat and quiet. Cards rest on `--border-soft`, not on shadow.
- **No even-glow shadows** (`0 0 Npx`), no heavy `0 14px 34px` drops. Replace any glow with
  `--shadow-flat`/`--shadow-lift`.
- **No glassmorphism.** No `backdrop-filter`/blur on chips, hero text, or nav. The hero is a solid
  navy gradient; text sits directly on it.

## Hero

```css
background: linear-gradient(135deg, var(--navy-mid), var(--navy));
```

Optional single radial-glow overlay top-right (`rgba(110,188,205,.18)`), pointer-events none.
Centered: uppercase teal-light badge, white title, teal-light one-line description. No card, no blur.

## Motion

```css
--dur-fast:150ms; --dur-base:200ms; --dur-slow:300ms;
```

- Ease-out only. No bounce, no elastic. Transition `opacity`, `border-color`, `box-shadow`,
  `transform`. Never transition layout properties.
- Honor `@media (prefers-reduced-motion: reduce)` (kills all transition/animation).

## Components

**Buttons / interactive (all)**
- `min-height: 44px`, `min-width: 44px` hit area. **[a11y floor]** Applies to cancel/afmeld, CTAs,
  role tabs, type filters, logout. This is non-negotiable for the phone-in-hand context.
- Primary: coral fill, white text, `--radius-pill` or `--radius-sm`, hover `opacity:.88`.
- Paid variant: `--navy-mid` fill. Waitlist: dashed border, transparent, navy ink.
- Disabled: `--border-soft` fill, `--muted` text, `not-allowed`.

**Focus** **[a11y floor]**
```css
:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
```
Every input, button, tab, and link gets a visible ring. Never `outline:none` with only a
border-color change (the mockup's input focus is invisible; override it).

**Inputs**
- `--row-bg` fill, `--border` 1px, `--radius-sm`, `font-size:15px` (prevents iOS zoom).
- Label above (13px/600/`--text`). Error text below in `--coral`, naming the exact fix
  ("Sæt kryds i 18+", not "Felt påkrævet").

**Event hub card** (`a.hub-event`)
- `--surface`, `--border-soft`, `--radius-md`, padding 20px. Whole card is the link.
- Head: title (17/600) + category badge (pill). Meta row (calendar/pin icons, muted).
  Description (13, muted). Foot: spots pill + arrow CTA. The foot CTA is decorative text+arrow,
  not a separate button (the card is the target).

**Status pills**
- Open: success tint. Full: `--row-bg` + muted. Always state the number ("3 ledige pladser",
  "2 på listen"), never a bare dot.

**Role tabs**
- Equal-width, `--border-soft` default, active = navy fill + white. 44px min height.

**Modal**
- `--surface`, `--radius-md`, `--shadow-lift`, max-width 420px. Title (navy/700) + sub. Overlay
  `rgba(0,15,30,.55)`. Use for low-friction signup (name, email, 18+ only).
- **No native `confirm()`/`alert()`.** Cancel/afmeld confirmation uses this same styled modal.

**Toast**
- Bottom-center pill, navy fill, white text, success-tinted check icon. Auto-dismiss ~3s. For
  confirmations ("Tilmeldt. Tak for hjælpen!").

## Anti-references (do not build)

- Generic "AI SaaS dashboard": uniform icon+heading+text card grids, gradient hero metrics.
- Side-stripe accent borders. Gradient text. Decorative glassmorphism. Even-glow shadows.
- Cold enterprise density (Jira/SAP). Warmth comes from clarity and good copy, not decoration.
- A second typeface used as "display". A second accent competing with coral.
