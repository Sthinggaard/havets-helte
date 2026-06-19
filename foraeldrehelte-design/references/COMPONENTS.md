# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Hub Event** | unknown | 3× | `.hub-event` |
| **He Head** | unknown | 3× | `.he-head` |
| **He Title** | unknown | 3× | `.he-title` |
| **He Foot** | unknown | 3× | `.he-foot` |
| **He Cta** | unknown | 3× | `.he-cta` |
| **Info Chip** | badge | 3× | `.info-chip` |
| **Shift Section** | unknown | 3× | `.shift-section` |
| **Shift Header** | unknown | 3× | `.shift-header` |

## Badges & Chips

### Info Chip

**Instances found:** 3

**CSS classes:** `.info-chip`

**HTML structure:**

```html
<div class="info-chip"><i class="ti ti-calendar"></i>Hver søndag i juni</div>
```

**Base styles (from design tokens):**

```css
.info-chip {
  background: #ffffff;
  border-radius: 20px 20px 0px 0px;
  padding: 3px 5px;
  font-size: 12px;
}```

## Other Components

### Hub Event

**Instances found:** 3

**CSS classes:** `.hub-event`

**HTML structure:**

```html
<a class="hub-event" href="#"> <div class="he-head"> <div class="he-title">Søndagsvagter i klubhuset</div> <span class="he-type timed">Vagter</span> </div> <div class="he-meta"> <span><i class="ti ti-calendar"></i>Hver søndag i juni</span> <span><i class="ti ti-map-pin"></i>Klubhuset, havnen</span> </div> <div class="he-desc">Hold åbent og hold øje med de yngste men…</div> <div class="he-foot"> <span class="he-spots-pill">3 ledige pladser</span> <span class="he-cta">Find en vagt</span> </div> </a>
```

**Base styles (from design tokens):**

```css
.hub-event {
  background: #ffffff;
  padding: 5px;
}```

### He Head

**Instances found:** 3

**CSS classes:** `.he-head`

**HTML structure:**

```html
<div class="he-head"> <div class="he-title">Søndagsvagter i klubhuset</div> <span class="he-type timed">Vagter</span> </div>
```

**Base styles (from design tokens):**

```css
.he-head {
  background: #ffffff;
  padding: 5px;
}```

### He Title

**Instances found:** 3

**CSS classes:** `.he-title`

**HTML structure:**

```html
<div class="he-title">Søndagsvagter i klubhuset</div>
```

**Base styles (from design tokens):**

```css
.he-title {
  background: #ffffff;
  padding: 5px;
}```

### He Foot

**Instances found:** 3

**CSS classes:** `.he-foot`

**HTML structure:**

```html
<div class="he-foot"> <span class="he-spots-pill">3 ledige pladser</span> <span class="he-cta">Find en vagt<i class="ti ti-arrow-right"></i></span> </div>
```

**Base styles (from design tokens):**

```css
.he-foot {
  background: #ffffff;
  padding: 5px;
}```

### He Cta

**Instances found:** 3

**CSS classes:** `.he-cta`

**HTML structure:**

```html
<span class="he-cta">Find en vagt<i class="ti ti-arrow-right"></i></span>
```

**Base styles (from design tokens):**

```css
.he-cta {
  background: #ffffff;
  padding: 5px;
}```

### Shift Section

**Instances found:** 3

**CSS classes:** `.shift-section`

**HTML structure:**

```html
<div class="shift-section"> <div class="shift-header"> <div class="shift-time"><i class="ti ti-clock"></i>10:00 – 12:00</div> <span class="shift-cap cap-open">1 ledig</span> </div> <div class="signups-list"> <div class="signup-row"><div class="signup-av">MJ</div>Mette Jensen<span style="margin-left:auto;font-size:11px">18+</span></div> </div> <button class="join-btn" onclick="openModal()">+ Meld dig på</button> </div>
```

**Base styles (from design tokens):**

```css
.shift-section {
  background: #ffffff;
  padding: 5px;
}```

### Shift Header

**Instances found:** 3

**CSS classes:** `.shift-header`

**HTML structure:**

```html
<div class="shift-header"> <div class="shift-time"><i class="ti ti-clock"></i>10:00 – 12:00</div> <span class="shift-cap cap-open">1 ledig</span> </div>
```

**Base styles (from design tokens):**

```css
.shift-header {
  background: #ffffff;
  padding: 5px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#337ab7` for all interactive/active states

