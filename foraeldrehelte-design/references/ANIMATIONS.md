# Animation Reference

> Cinematic motion design extracted from live DOM. Follow these specs exactly to recreate the experience.

## Motion Technology Stack

Pure CSS animations — no external animation libraries detected.

## Scroll Journey

The page is **2,157px** tall. Each frame below shows what the user sees at that scroll depth.

> **Use these screenshots to understand WHAT animates, WHEN it animates, and HOW it moves.**

### 0% — Top / Hero
Scroll position: 0px

![Scroll 0%](../screens/scroll/scroll-000.png)

### 17% — Opening Section
Scroll position: 214px

![Scroll 17%](../screens/scroll/scroll-017.png)

### 33% — First Feature Section
Scroll position: 415px

![Scroll 33%](../screens/scroll/scroll-033.png)

### 50% — Mid-Page
Scroll position: 629px

![Scroll 50%](../screens/scroll/scroll-050.png)

### 67% — Lower Content
Scroll position: 842px

![Scroll 67%](../screens/scroll/scroll-067.png)

### 83% — Near Footer
Scroll position: 1,043px

![Scroll 83%](../screens/scroll/scroll-083.png)

### 100% — Bottom / Footer
Scroll position: 1,257px

![Scroll 100%](../screens/scroll/scroll-100.png)

## CSS Keyframes (1 extracted)

### `@keyframes fadeIn`

```css
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

> Opacity fade

## Motion Tokens (CSS Variables)

### Easing Tokens

```css
--ease-out: ease-out;
--ease: ease-in-out;
```

## Global Transition Declarations

These `transition` values were extracted from CSS rules across the site:

```css
transition: box-shadow var(--dur-base) var(--ease),border-color var(--dur-base) var(--ease);
transition: opacity var(--dur-fast) var(--ease);
transition: all var(--dur-fast) var(--ease);
transition: transform var(--dur-slow) var(--ease);
```

## How to Recreate This Motion Design

### Step 2 — Scroll-Reveal Pattern

Elements that animate into view follow this pattern:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease-out,
              transform 0.6s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 3 — Key Motion Principles

- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

### Step 4 — Scroll Journey Reference

Match what happens at each scroll position:

- **0%** (`0px`) → `screens/scroll/scroll-000.png`
- **17%** (`214px`) → `screens/scroll/scroll-017.png`
- **33%** (`415px`) → `screens/scroll/scroll-033.png`
- **50%** (`629px`) → `screens/scroll/scroll-050.png`
- **67%** (`842px`) → `screens/scroll/scroll-067.png`
- **83%** (`1043px`) → `screens/scroll/scroll-083.png`
- **100%** (`1257px`) → `screens/scroll/scroll-100.png`

