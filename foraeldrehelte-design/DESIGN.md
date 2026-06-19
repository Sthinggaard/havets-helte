# Foraeldrehelte DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 17 · Fonts: 2 · Components: 6
> Icon library: not detected · State: not detected
> Primary theme: light · Dark mode toggle: no · Motion: subtle

---

## 1. Visual Theme & Atmosphere

This is a **light-themed** interface with a cool, approachable feel. The light background emphasizes content clarity. Typography pairs **Helvetica Neue** for body text with **Arial** for display/headings, creating clear visual hierarchy through type contrast. Spacing follows a **5px base grid** (standard density), with scale: 5, 10, 15, 20, 25, 30, 35, 40px. The primary accent color **#ea636f** (coral) anchors interactive elements (buttons, links, focus rings). Motion is subtle — smooth transitions (150-300ms) ease state changes without drawing attention.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| background | `#f6f6f6` | background | Page background, darkest surface |
| surface | `#ffffff` | surface | Card and panel backgrounds |
| border-soft | `#e9e9e9` | surface | Card and panel backgrounds |
| text | `#232323` | text-primary | Headings and body text |
| muted | `#7c7c7c` | text-muted | Captions, placeholders, secondary info |
| accent | `#ea636f` | accent | CTAs, links, focus rings, active states |
| accent | `#146e88` | accent | CTAs, links, focus rings, active states |
| danger | `#ea636f` | danger | Error states, destructive actions |
| success | `#c9e1bd` | success | Success states, positive indicators |
| warning | `#f4daa6` | warning | Warning states, caution indicators |
| info | `#0f4172` | info | Informational highlights |
| unknown | `#000000` | unknown | Palette color |
| unknown | `#003366` | unknown | Palette color |
| unknown | `#6ebccd` | unknown | Palette color |
| border | `#cbcbcb` | unknown | Palette color |
| unknown | `#2c98b7` | unknown | Palette color |
| unknown | `#000f1e` | unknown | Palette color |

### CSS Variable Tokens

```css
--muted: #7c7c7c;
--border: #cbcbcb;
--border-soft: #e9e9e9;
--accent: #337ab7;
```


---

## 3. Typography Rules

**Font Stack:**
- **Arial** — Heading 1, Heading 2, Heading 3
- **Helvetica Neue** — Body, Caption

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Arial | clamp(30px,7vw,40px) | 700 |
| Heading 2 | Arial | 20px | 700 |
| Heading 3 | Arial | 18px | 700 |
| Body | Helvetica Neue | 17px | 400 |
| Caption | Helvetica Neue | 16px | 400 |

**Typographic Rules:**
- Limit to 2 font families max per screen
- Use **Arial** for body/UI text, **Helvetica Neue** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Data Display (3)

**Card** — `html`

**Badge** — `html`

**List** — `html`

### Data Input (2)

**Button** — `html`
- Variants: `paid`, `waitlist`, `cancel`, `confirm`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Overlay (1)

**Modal** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 5px
- **Spacing scale:** 5, 10, 15, 20, 25, 30, 35, 40, 60
- **Border radius:** 4px, 12px, 20px 20px 0px 0px, 50px, 999px
- **Max content width:** 991px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 2.5-5px | Tight: related items within a group |
| 10px | Medium: between groups |
| 15-20px | Wide: between sections |
| 30px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Flat — subtle depth hints

- `rgba(0, 0, 0, 0.08) 0px 2px 2px 0px`

### Raised — cards, buttons, interactive elements

- `var(--shadow-flat)`
- `var(--shadow-soft)`
- `rgb(102, 102, 102) 0px 0px 5px 0px`

### Floating — dropdowns, popovers, modals

- `0-2px 10px rgba(0,0,0,.05)`
- `rgba(0, 0, 0, 0.05) 0px -2px 10px 0px`



---

## 7. Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without demanding attention.

### CSS Animations

- `@keyframes fadeIn`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#ea636f` for interactive elements (buttons, links, focus rings)
- Use `#f6f6f6` as the primary page background
- Pair **Arial** (body) with **Helvetica Neue** (display) — these are the only allowed fonts
- Follow the **5px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: 4px, 12px, 20px 20px 0px 0px, 50px, 999px
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Arial and Helvetica Neue
- Don't use arbitrary spacing values — stick to multiples of 5px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

No breakpoints detected. Consider adding responsive breakpoints to the design system.

---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #ffffff
Border: 1px solid var(--border)
Radius: 4px
Padding: 20px
Font: Arial
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ea636f, text white
Ghost: bg transparent, border var(--border)
Padding: 10px 20px
Radius: 4px
Hover: opacity 0.9 or lighter shade
Focus: ring with #ea636f
```

### Build a Page Layout

```
Background: #f6f6f6
Max-width: 991px, centered
Grid: 5px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #ffffff
Label: #7c7c7c (muted, 12px, uppercase)
Value: #232323 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #f6f6f6
Input border: 1px solid var(--border)
Focus: border-color #0f4172
Label: #7c7c7c 12px
Spacing: 20px between fields
Radius: 4px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Arial, type scale from Section 3
4. Spacing: 5px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```
