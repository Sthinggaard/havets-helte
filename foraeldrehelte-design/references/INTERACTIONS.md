# Interaction Reference

> Micro-interactions extracted from live DOM. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Link | 1 | default, hover, focus |

## Transition System

These transition declarations were extracted from interactive elements:

```css
transition: all;
transition: opacity 0.15s ease-in-out;
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Log ud`

**States:**

- Default: `../screens/states/button-1-default.png`
- Hover: `../screens/states/button-1-hover.png`
- Focus: `../screens/states/button-1-focus.png`

**On focus:**

```css
/* outline: rgb(124, 124, 124) none 3px → */ outline: rgb(0, 95, 204) auto 1px;
/* outline-color: rgb(124, 124, 124) → */ outline-color: rgb(0, 95, 204);
```

**Transition:** `all`

### Button 2 — `Afmeld`

**States:**

- Default: `../screens/states/button-2-default.png`
- Hover: `../screens/states/button-2-hover.png`
- Focus: `../screens/states/button-2-focus.png`

**On hover:**

```css
/* color: rgb(124, 124, 124) → */ color: rgb(234, 99, 111);
/* border-color: rgb(203, 203, 203) → */ border-color: rgb(234, 99, 111);
/* outline: rgb(124, 124, 124) none 3px → */ outline: rgb(234, 99, 111) none 3px;
/* outline-color: rgb(124, 124, 124) → */ outline-color: rgb(234, 99, 111);
```

**On focus:**

```css
/* outline: rgb(124, 124, 124) none 3px → */ outline: rgb(0, 95, 204) auto 1px;
/* outline-color: rgb(124, 124, 124) → */ outline-color: rgb(0, 95, 204);
```

**Transition:** `all`

### Button 3 — `+ Meld dig på`

**States:**

- Default: `../screens/states/button-3-default.png`
- Hover: `../screens/states/button-3-hover.png`
- Focus: `../screens/states/button-3-focus.png`

**On hover:**

```css
/* opacity: 1 → */ opacity: 0.88;
```

**On focus:**

```css
/* outline: rgb(255, 255, 255) none 3px → */ outline: rgb(0, 95, 204) auto 1px;
/* outline-color: rgb(255, 255, 255) → */ outline-color: rgb(0, 95, 204);
```

**Transition:** `opacity 0.15s ease-in-out`

## Link Interactions

### Link 1 — `Leder-login`

**States:**

- Default: `../screens/states/link-1-default.png`
- Hover: `../screens/states/link-1-hover.png`
- Focus: `../screens/states/link-1-focus.png`

**On hover:**

```css
/* color: rgb(124, 124, 124) → */ color: rgb(0, 51, 102);
/* border-color: rgb(124, 124, 124) → */ border-color: rgb(0, 51, 102);
/* outline: rgb(124, 124, 124) none 3px → */ outline: rgb(0, 51, 102) none 3px;
/* outline-color: rgb(124, 124, 124) → */ outline-color: rgb(0, 51, 102);
```

**On focus:**

```css
/* outline: rgb(124, 124, 124) none 3px → */ outline: rgb(0, 95, 204) auto 1px;
/* outline-color: rgb(124, 124, 124) → */ outline-color: rgb(0, 95, 204);
```

**Transition:** `all`

## Interaction Rules

- Accent color `#337ab7` is used for focus rings, active states, and hover highlights
- Hover effects use **opacity** changes, not color shifts
- Hover effects include **color transitions** — use the extracted values, not approximations
- Focus states use **outline** (not box-shadow) — always match the extracted focus ring
- Transition durations in use: `0.15s`
- Always respect `prefers-reduced-motion` — set all transitions to `0s` when enabled

