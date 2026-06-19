---
target: foraeldrehelte-mockup-light.html
total_score: 23
p0_count: 0
p1_count: 2
timestamp: 2026-06-17T18-48-46Z
slug: foraeldrehelte-mockup-light-html
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toast confirms both signup and cancellation; role-tab active state visible. No loading/pending state on confirm, but acceptable for a static demo. |
| 2 | Match Between System and Real World | 4 | n/a — Danish copy and domain terms (Afmeld, ledige pladser) match a parent's vocabulary exactly. |
| 3 | User Control and Freedom | 2 | Modal has Cancel + click-outside-to-close, but no Esc-key handler; cancel-signup uses a native `confirm()` instead of the app's own modal idiom. |
| 4 | Consistency and Standards | 2 | Button-color rule is now consistent (coral/navy/outline). New gap: a custom styled modal for "join" but the browser's native `confirm()` dialog for "cancel" — two different visual languages for the app's two key decisions. |
| 5 | Error Prevention | 2 | The 18+ checkbox now correctly defaults unchecked, but `confirmDemo()` has zero validation — empty name, empty/invalid email, and an unchecked eligibility box all silently succeed. |
| 6 | Recognition Rather Than Recall | 3 | Icons consistently paired with text labels. |
| 7 | Flexibility and Efficiency of Use | 1 | Still no keyboard shortcuts or Esc-to-close; acceptable for this app's scope but floor-level. |
| 8 | Aesthetic and Minimalist Design | 3 | Generally restrained now; the hero's gradient + radial glow is the one remaining decorative element with no informational payload. |
| 9 | Error Recovery | 1 | Because there's no validation, there's nothing to "recover" from — bad/missing input silently reports success, which is worse than a visible error. |
| 10 | Help and Documentation | 2 | n/a-ish — no help affordance, acceptable for a 3-field form. |
| **Total** | | **23/40** | **Acceptable band** (up from 18/40 last run) |

## Anti-Patterns Verdict

**Better — the specific AI-tells flagged last time are gone. Two new, smaller smells surfaced.**

**LLM assessment** (independent design-director read, blind to my scan):
- Confirmed resolved: no side-stripes, no gradient text, no glassmorphism, no hero-metric template, no identical card grids, no flat type scale, no em dashes.
- Still present: `.hero{background:linear-gradient(135deg,var(--navy-mid),var(--navy))}` plus a `::after` radial-gradient glow — reads as a templated "decorative hero band" with no functional payload on a utility tool, even though every color in it is on-palette now.
- `--shadow-soft: 0 0 5px #666666` on the modal is a directionless ambient blur — structurally still a "glow" shape, just on-palette instead of off-palette. The *color* was fixed; the *shape* of the effect wasn't reconsidered.
- New, more serious: it found that `cancelSignup()` unconditionally deletes `#mine-card` and `#mine-label`, not just the cancelled row — only "works" in this demo because there's exactly one signup. Real logic bug, not a style note.
- New: cancelling now opens a native browser `confirm()` dialog, visually unrelated to the rest of the app's styled-modal pattern.
- New: `confirmDemo()` performs no validation — the now-correctly-unchecked 18+ box can still be submitted unchecked with empty name/email and reports success anyway.

**Deterministic scan**: `detect.mjs` still fails the same way (`Error: bundled detector not found`) — confirmed not a one-off, this install is missing the bundled detector. Re-ran the manual token-fidelity scan that substituted for it last time:
- **0 off-palette hex colors** (was 7).
- **0 off-grid spacing values** (was 29, later corrected to 36 once directional margins were included).
- **0 em dashes** in visible copy (was 1).
- **0 side-stripe borders, 0 blur/backdrop-filter, 0 gradient-text** — all still clean.
- Only non-5-multiple dimension left is `991px`, the documented container-width token — expected, not a violation.
All of the previous run's deterministic findings are confirmed fixed. No regressions on token-fidelity.

**Visual overlays**: still unavailable this session (no browser-automation tool, no working interactive display for `screencapture`). Both assessments are source/logic-level, not pixel-rendered.

## Overall Impression

The fixes did what they said: token-fidelity is now perfect, the specific AI-tells (stripes, navy wings, off-palette glow, staggered entrance) are gone, and the score moved from 18 to 23. But the hardening pass traded one set of problems for a smaller, sharper one — it fixed the *symptom* (checkbox defaults, dead button) without fully thinking through the *behavior* (no validation, a logic bug that only "works" by accident, a jarring native dialog). That's a normal cost of fast, scoped fixes; worth one more pass specifically on the cancel/validation logic before calling this done.

## What's Working

- Button color now carries real meaning (coral=free, navy=paid, outline=waitlist) — a glance tells you the commitment type.
- The pill pattern (type badges, spots-pill, cap-open/cap-full) reuses one shape with only color/text varying — restrained, not over-designed.
- `prefers-reduced-motion` is correctly implemented and untouched across all three fix passes.

## Priority Issues

- **[P1] `cancelSignup()` deletes the whole "Mine tilmeldinger" section, not just the cancelled item.** Lines unconditionally remove `#mine-card` and `#mine-label` regardless of whether other signups exist. **Why it matters**: only appears to work because the demo hardcodes one item; breaks the instant a second signup exists. **Fix**: remove only the clicked `.mine-item`, then check `if (!document.querySelector('.mine-item'))` before removing the card/label. **Suggested command**: `/impeccable harden`
- **[P1] No validation in the signup confirm flow.** Empty name, empty/invalid email, and an unchecked 18+ box all silently report "Tilmeldt." **Why it matters**: the checkbox exists specifically as an eligibility gate — letting it submit unchecked defeats the point of fixing the pre-checked default. **Fix**: block `closeModal()`/`showToast()` until name is non-empty, email contains "@", and (for this slot) the checkbox is checked. **Suggested command**: `/impeccable harden`
- **[P2] Mixed dialog idioms.** Signup uses the app's own styled `.modal`; cancellation uses the browser's native `confirm()`. **Why it matters**: two visually unrelated patterns for the app's two most consequential actions undermines heuristic #4 (Consistency). **Fix**: reuse the existing `.modal` markup for a lightweight cancel-confirmation instead of `window.confirm`. **Suggested command**: `/impeccable polish`
- **[P2] Hero gradient + radial glow may be the last unmotivated decoration.** `.hero`'s `linear-gradient` and `::after` radial glow have no informational payload on a 5-card utility screen — debatable whether this is "AI hero template" residue or legitimate on-brand styling (the project's own DESIGN.md explicitly endorses "gradient accents used thoughtfully for emphasis," and it mirrors havetshelte.dk's actual hero treatment). **Fix, if pursued**: flatten to solid `--navy` background, drop the `::after`. **Suggested command**: `/impeccable quieter`
- **[P3] No Esc-key handler on the modal**, despite click-outside-to-close existing. **Fix**: add a `keydown` listener for `Escape`. **Suggested command**: `/impeccable harden`

## Persona Red Flags

- **Jordan (Confused First-Timer)**: hits a grey native `confirm()` popup when cancelling — visually disconnected from the rest of the app, may read as a browser warning rather than a normal in-app action, causing hesitation at exactly the moment she needs reassurance.
- **Riley (Stress Tester)**: submits the join form with blank fields or an unchecked 18+ box — it succeeds anyway with a cheerful "Tilmeldt." A feature that appears to work but produces wrong results is Riley's top red flag. Also finds the cancel-deletes-everything bug immediately by adding a second signup.
- **Casey (Distracted Mobile)**: `.modal` has no `max-height`/`overflow-y`, so on a small viewport with an on-screen keyboard covering two text inputs, the confirm button could be pushed out of reach with no scroll affordance.

## Minor Observations

- "Søndagsvagter i klubhuset" is hardcoded in both the mine-item and the modal title — fine for a static mockup, would need to be dynamic in a real build.
- `.he-type.task` pill (`rgba(244,218,166,.6)` bg + `var(--text)`) reads slightly lower-contrast than the other two type pills — worth a quick contrast check.
- If joining a 200kr paid slot needs no confirmation step at all, but cancelling a free shift now requires one, the friction is arguably backwards relative to financial risk.

## Questions to Consider

- If cancelling needed a confirmation guard, shouldn't committing to a 200kr paid slot get at least as much friction as the free one?
- Is the hero gradient earning its place, or is it the last "make it feel designed" reflex — would a flat navy bar with the same copy lose anything a real parent would notice?
- The 18+ checkbox is presented as a gate but isn't enforced — should unchecked submission be blocked outright, or is "trust the parent" the actual intended design, in which case is a checkbox the right affordance at all?
