# havetshelte DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 20 · Fonts: 2 · Components: 8
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: no · Motion: subtle

## Visual Reference

**Match this design exactly** — study colors, fonts, spacing, and component shapes before writing any UI code.

![havetshelte Homepage](../screenshots/homepage.png)

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a neutral tone. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **Arial** for display/headings with **Helvetica Neue** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **5px base grid** (standard density), with scale: 5, 10, 15, 20, 25, 30, 35, 40px. Motion is subtle — smooth transitions (150-300ms) ease state changes without drawing attention.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| background | `#333333` | background | Page background, darkest surface |
| surface | `#000000` | surface | Card and panel backgrounds |
| theme-color | `#ffffff` | text-primary | Headings and body text |
| text-muted | `#7c7c7c` | text-muted | Captions, placeholders, secondary info |
| border | `#454545` | border | Dividers, card borders, outlines |
| danger | `#ea636f` | danger | Error states, destructive actions |
| success | `#c9e1bd` | success | Success states, positive indicators |
| warning | `#f4daa6` | warning | Warning states, caution indicators |
| info | `#003366` | info | Informational highlights |
| unknown | `#337ab7` | unknown | Palette color |
| unknown | `#0f4172` | unknown | Palette color |
| unknown | `#f6f6f6` | unknown | Palette color |
| unknown | `#e9e9e9` | unknown | Palette color |
| unknown | `#2c98b7` | unknown | Palette color |
| unknown | `#cbcbcb` | unknown | Palette color |
| unknown | `#f9c9bf` | unknown | Palette color |
| unknown | `#146e88` | unknown | Palette color |
| unknown | `#232323` | unknown | Palette color |
| unknown | `#6ebccd` | unknown | Palette color |
| unknown | `#555555` | unknown | Palette color |


---

## 3. Typography Rules

**Font Stack:**
- **Helvetica Neue** — Heading 1, Heading 2, Heading 3
- **Arial** — Body, Caption

**Font Sources:**

```css
@font-face {
  font-family: "Alfa Slab One";
  src: url("https://fonts.gstatic.com/s/alfaslabone/v21/6NUQ8FmMKwSEKjnm5-4v-4Jh2dJhfg.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Enriqueta";
  src: url("https://fonts.gstatic.com/s/enriqueta/v19/goksH6L7AUFrRvV44HVjTEqn.ttf") format("truetype");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Helvetica Neue | 50px | 700 |
| Heading 2 | Helvetica Neue | 46px | 700 |
| Heading 3 | Helvetica Neue | 40px | 700 |
| Body | Arial | 20px | 400 |
| Caption | Arial | 22px | 400 |

**Typographic Rules:**
- Limit to 2 font families max per screen
- Use **Helvetica Neue** for body/UI text, **Arial** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Display (1)

**Badge** — `html`

### Data Input (1)

**Button** — `html`
- Animation: 

### Overlay (1)

**Modal** — `html`

### Media (3)

**Image** — `html`

**Icon** — `html`

**Map/Canvas** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 5px
- **Spacing scale:** 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60
- **Border radius:** 0px 2px 2px 0px, 0.1em, .12em, 1em, 2px, 2px 0px 0px 2px, 3px, 4px, 6px, 7px, 10em, 12px, 20px, 50px, 999px
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

- `inset 1px 1px 1px #ccc`
- `0 2px 2px rgba(0,0,0,0.2)`

### Raised — cards, buttons, interactive elements

- `0 0 3px 1px rgb(94,158,214)`
- `0 0 5px #666666`
- `0 2px 2px 0 rgba(0,0,0,0.14),0 1px 5px 0 rgba(0,0,0,0.12),0 3px 1px -2px rgba(0,0,0,0.2)`

### Floating — dropdowns, popovers, modals

- `15px 0 0#036,-15px 0 0#036`
- `rgb(0, 51, 102) 15px 0px 0px 0px, rgb(0, 51, 102) -15px 0px 0px 0px`

### Z-Index Scale

`1, 2, 3, 5, 6, 10, 20, 30, 100, 1000, 1260, 9999`



---

## 7. Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without demanding attention.

### CSS Animations

- `@keyframes fa-spin`
- `@keyframes animate-stripes`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#333333` as the primary page background
- Pair **Helvetica Neue** (body) with **Arial** (display) — these are the only allowed fonts
- Follow the **5px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: 0px 2px 2px 0px, 0.1em, .12em, 1em, 2px
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Helvetica Neue and Arial
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

| Name | Value | Source |
|---|---|---|
| md | 48em | css |
| lg | 60em | css |
| xs | 480px | css |
| sm | 600px | css |
| md | 767px | css |
| md | 768px | css |
| lg | 991px | css |
| lg | 992px | css |
| xl | 1026px | css |
| xl | 1199px | css |
| xl | 1200px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #000000
Border: 1px solid #454545
Radius: 4px
Padding: 20px
Font: Helvetica Neue
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg var(--accent), text white
Ghost: bg transparent, border #454545
Padding: 10px 20px
Radius: 4px
Hover: opacity 0.9 or lighter shade
Focus: ring with var(--accent)
```

### Build a Page Layout

```
Background: #333333
Max-width: 991px, centered
Grid: 5px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #000000
Label: #7c7c7c (muted, 12px, uppercase)
Value: #ffffff (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #333333
Input border: 1px solid #454545
Focus: border-color var(--accent)
Label: #7c7c7c 12px
Spacing: 20px between fields
Radius: 4px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Helvetica Neue, type scale from Section 3
4. Spacing: 5px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```
