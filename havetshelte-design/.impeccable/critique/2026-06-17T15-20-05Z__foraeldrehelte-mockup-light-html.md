---
target: foraeldrehelte-mockup-light.html
total_score: 18
p0_count: 2
p1_count: 2
timestamp: 2026-06-17T15-20-05Z
slug: foraeldrehelte-mockup-light-html
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Toast confirms signup, but `.mine-cancel` ("Afmeld") has no JS handler at all — clicking it does nothing, silently. |
| 2 | Match Between System and Real World | 4 | n/a — Danish domain language (vagter, patrulje, venteliste) is correct and unforced. |
| 3 | User Control and Freedom | 1 | No Esc-key handler on the modal; "Afmeld" (leaving a shift) fires with zero confirmation despite being a socially costly, hard-to-undo action. |
| 4 | Consistency and Standards | 1 | Three join-button colors (coral/teal/navy) with no documented meaning, **plus** the file breaks its own documented token system: 7 invented hex colors and 29 spacing values off the 5px grid (see Anti-Patterns below). |
| 5 | Error Prevention | 1 | The "Jeg er 18+ år" eligibility checkbox is pre-checked (`<input type="checkbox" checked>`) — a real attestation gate defaults to true. No input validation on name/email. |
| 6 | Recognition Rather Than Recall | 3 | Icons consistently paired with text labels. |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard support anywhere — role tabs are mouse-only, no Esc-to-close. |
| 8 | Aesthetic and Minimalist Design | 1 | Side-stripes, a glow shadow, double navy "wing" shadows on the modal, and 5 border-radius tokens are all stacked onto a 5-card utility screen — visual machinery exceeds the content's real complexity. |
| 9 | Error Recovery | 0 | No error states exist anywhere — no failed-signup state, no handling for a shift filling up mid-form. |
| 10 | Help and Documentation | 4 | n/a — appropriately not needed for a utility this small. |
| **Total** | | **18/40** | **Poor band** (most real interfaces score 20-32) |

## Anti-Patterns Verdict

**Start here. Yes, this reads as AI-generated.**

**LLM assessment** (independent design-director read, blind to the scan below):

- `.modal{box-shadow:var(--shadow-soft),15px 0 0 var(--navy),-15px 0 0 var(--navy)}` — solid navy "wings" flanking the modal. Serves no function, isn't motivated by content, and looks like a rendering glitch on a white page. This is the single biggest "AI made this" tell.
- `.hub-event::before` (4px colored left stripe per type) plus `.ev-desc{border-left:3px solid var(--teal)}` — the explicitly-banned side-stripe-as-category-color crutch, used twice on the same screen.
- `--shadow-raised: 0 0 3px 1px rgb(94,158,214)` glow on `.mine-card` and on hover — a saturated blue that isn't even one of the project's own 20 tokens, the classic "make it pop" AI reflex.
- Staggered card fade-in (`animation-delay:0/80/160ms`) on static markup that never loads asynchronously — a stock AI list-reveal with no content reason.
- Five border-radius tokens (4/12/20/50/999px) with no visible rule for which component gets which — "more tokens" masquerading as "more systematic."
- Three buttons (`.he-cta`, `.join-btn`, `.btn-confirm`) all use the identical `opacity:.88` hover — the cheapest possible interaction state, copy-pasted three times.

**Deterministic scan**: the bundled `detect.mjs` entrypoint failed (`Error: bundled detector not found`) after a real invocation attempt, so a manual token-fidelity scan was run against this project's own documented palette and spacing-grid rules (`DESIGN.md`). This is the part the LLM review missed entirely:

- **7 invented hex colors**, none of the 20 tokens the project itself mandates: `#cdd8e6` (line 57), `#5a9a6e` (83), `#d9a73f` (103), `#7a4e07` (110, 170), `#2e5c3f` (116, 151, 156, 157), `#a9c2dd` (140), `#9fd4b4` (209).
- **29 spacing declarations violate the 5px grid**: `8px` ×9, `11px` ×5, `12px` ×5, `6px` ×3, `9px` ×2, `4px` ×2, `3px` ×2, `7px` ×1 — all in `padding`/`margin`/`gap`.
- **1 em dash in user-facing copy**: the toast reads "Tilmeldt — tak for hjælpen!" (line 379), against the project's own no-em-dash rule.
- Confirmed clean: no `blur`/`backdrop-filter` anywhere, no gradient-text (`background-clip:text`) anywhere — two of the absolute bans are genuinely not present.
- False positive note: `#666666` appears only inside `--shadow-soft`, which is a verbatim copy of the project's own documented shadow token string — not a new invented color, don't double-count it.

**Visual overlays**: not available this session. No browser-automation tool was exposed, and an OS-level `screencapture` fallback was attempted but only captured the bare desktop, not the rendered page — this sandbox has no interactive display session matching what you'd actually see in a browser. No live `[Human]`-tab overlay was generated; the findings above are from direct source/CSS inspection only.

## Overall Impression

The color *strategy* is right — light surface, navy for structure, coral as the one deliberate accent — that part of the brief was executed well. But the file is dressed in unmotivated decoration (stripe accents, a glow shadow, navy modal wings, staggered reveals) that reads exactly like default LLM "polish," and it doesn't even consistently follow the design system it claims to use: 7 off-palette colors and 29 off-grid spacing values undercut the "every value traces to a token" promise. The biggest opportunity is twofold: strip the ornamentation that isn't load-bearing, and fix the two actually-broken interactions (a dead cancel button, a pre-checked eligibility box) that matter more than any visual flourish.

## What's Working

- **Navy/coral pairing is a real brand decision, not generic SaaS blue.** `--text:#232323` on `--surface:#fff` gives solid body contrast, and reserving coral for primary actions while navy carries structure (nav, headings, focus) is legible and on-brief.
- **`prefers-reduced-motion` is actually implemented** (`@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`) — most mockups skip this; it's a genuine accessibility detail.
- **Role-tab + shift-panel progressive disclosure** is a sound pattern for an event with multiple time slots, better than a flat list of every shift at once.

## Priority Issues

- **[P0] Pre-checked age-eligibility checkbox.** `<input type="checkbox" checked>Jeg er 18+ år` defaults to true. Why it matters: this is a real eligibility/liability gate (an adult supervising children), and a careless click submits a false attestation by default. Fix: default unchecked; require the parent to actively confirm.
- **[P0] "Afmeld" (cancel) button does nothing.** `.mine-cancel` has no event handler. Why it matters: a parent trying to back out of a commitment gets silent failure — they may believe they cancelled when they didn't, or conclude the page is broken. Fix: wire it to a confirm step that mirrors the existing signup-confirmation pattern, then fire the toast.
- **[P1] Decorative AI-tell ornamentation.** The modal's navy side-shadows (line ~193 `box-shadow`), the `.hub-event::before`/`.ev-desc` stripe accents (lines 103/130), and the off-palette glow shadow (`rgb(94,158,214)`, not one of the 20 tokens) are the exact "looks AI-made" signals you asked to remove. Fix: delete the navy box-shadow layers on the modal (keep `--shadow-soft` or a plain 1px border), replace stripe accents with a labeled badge or icon, and either retire the glow shadow or recolor it to an actual palette token.
- **[P1] Token-system drift.** 7 hex colors and 29 spacing values in this file aren't from the project's own documented palette/5px-grid, directly contradicting the "no invented colors / no arbitrary spacing" rules this design system states for itself. Fix: pass every `padding`/`margin`/`gap` through the 5/10/15/20/25/30/35/40/45/50/55/60 scale, and swap the 7 off-palette hexes (lines 57, 83, 103, 110, 116, 140, 151, 156, 157, 170, 209) for the nearest of the 20 documented tokens.
- **[P2] Arbitrary, non-semantic button colors.** Coral/teal/navy-mid are used for "join" actions across three demo blocks with no stated rule (price? type? urgency?). Fix: pick one rule — e.g. color = action cost (free = coral, paid = navy, waitlist = outline) — and apply it consistently everywhere a join action appears.

## Persona Red Flags

- **Jordan (Confused First-Timer)**: the colored stripe + badge system (blue/yellow/teal) is never explained, so Jordan has to guess what "Vagter" vs "Opgaver" vs "Event" mean beyond the label text — and could click past the pre-checked 18+ box without registering it's an attestation.
- **Riley (Stress Tester)**: clicking "Afmeld" does nothing and gives no error — Riley flags this as a dead control immediately. The "Fuldt" (full) hub-event card still renders an identically-styled clickable CTA ("Se opgaver"), inviting a click into a dead end with no visual difference from an open one.
- **Casey (Distracted Mobile)**: primary CTAs (`.he-cta`) sit at the bottom-right of variable-height cards — on a long description, that target can land outside comfortable one-handed thumb reach. A half-filled modal form has no draft persistence if Casey gets interrupted mid-signup.

## Minor Observations

- `--shadow-raised`'s glow color (`rgb(94,158,214)`) isn't one of the 20 declared tokens — it's a leftover from the dark-theme variant that never got remapped for light.
- Five border-radius tokens (4/12/20/50px + pill) exist with no visible rule for which component should get which size.
- `.signup-row` background (`rgba(201,225,189,.25)`) on white is a very faint pastel — borderline contrast for the "confirmed" meaning it's meant to carry.
- The topbar's "Leder-login" link has no active/current-page state and feels structurally disconnected from the rest of the page.
- One em dash slipped into user-facing copy (toast, line 379) against the project's own no-em-dash rule.

## Questions to Consider

- If the stripe/badge system exists to distinguish "Vagter / Opgaver / Event," would one consistent badge — no duplicate left-border — communicate the same thing with half the visual machinery?
- Cancelling a shift affects other parents relying on the schedule. Should the UI show *who* benefits from the slot at the moment of cancellation, not just silently remove a row (once the button is wired up at all)?
- This is a genuinely a 5-card utility screen. If every shadow, stripe, and extra radius token were deleted, would any real information be lost — or just decoration?
