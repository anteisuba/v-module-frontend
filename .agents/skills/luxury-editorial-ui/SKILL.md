---
name: luxury-editorial-ui
description: >
  Design and implement luxury editorial UI in the style of high-end hospitality and lifestyle brands
  (e.g. NOT A HOTEL, Aesop, The Line Hotel). Use this skill whenever the user wants to build pages,
  components, or layouts that should feel premium, minimal, and cinematic — including landing pages,
  hero sections, product showcases, creator profiles, public-facing pages, or any UI where the goal
  is refined elegance over utility density. Also trigger when the user says "luxury", "editorial",
  "minimal but high-end", "like a hotel website", or "scroll animation".
---

# Luxury Editorial UI

Build interfaces that feel like high-end hospitality and editorial design: cinematic, unhurried, and
precise. Every choice — spacing, type, motion, color — should communicate restraint and confidence.

## Design Language

### Color System

Use a near-black / warm-off-white foundation. Accent only with one muted tone.

```css
:root {
  --color-bg: #0d0d0b; /* near-black, slightly warm */
  --color-surface: #141410; /* card / section surfaces */
  --color-border: #2a2a26; /* hairline dividers */
  --color-text: #e8e4d9; /* warm off-white, never pure white */
  --color-muted: #7a7669; /* secondary labels, captions */
  --color-accent: #c9a96e; /* one gold/warm accent only */
}
```

Light variant (for interior pages or CMS):

```css
:root {
  --color-bg: #f5f2ec;
  --color-surface: #ffffff;
  --color-border: #ddd9d0;
  --color-text: #1a1a18;
  --color-muted: #8a8578;
  --color-accent: #9b7a3d;
}
```

**Rules:**

- Never use pure `#000000` or `#ffffff`
- No more than one accent color per page
- Avoid blue, purple, or any color that reads as "tech"

---

### Typography

Pair a **serif display** font with a **light sans-serif** body. Keep tracking loose on headings.

```css
/* Preferred stacks */
--font-display: "Cormorant Garamond", "Playfair Display", Georgia, serif;
--font-body: "Jost", "DM Sans", "Helvetica Neue", sans-serif;

/* Scale */
--text-hero: clamp(3.5rem, 8vw, 9rem); /* single-word or two-word headlines */
--text-title: clamp(2rem, 4vw, 4.5rem);
--text-section: clamp(1.25rem, 2vw, 2rem);
--text-body: 1rem;
--text-caption: 0.75rem;

/* Tracking */
--tracking-hero: 0.02em;
--tracking-label: 0.2em; /* uppercase labels, use sparingly */
```

**Rules:**

- Hero text: serif, thin weight (300), generous tracking
- Labels / eyebrows: uppercase sans-serif, letter-spacing 0.2em, small size
- Body: sans-serif, weight 300–400, line-height 1.7
- Never bold body text. Use size contrast instead of weight.

---

### Layout & Spacing

Think in **large units**. Sections breathe — they don't stack.

```css
--space-section: clamp(6rem, 12vw, 14rem); /* between major sections */
--space-block: clamp(2rem, 4vw, 5rem); /* within a section */
--space-gap: clamp(1rem, 2vw, 2rem); /* between items in a grid */

--max-prose: 680px; /* max width for body text columns */
--max-layout: 1400px; /* outer container */
```

**Layout rules:**

- Full-bleed images always, no rounded corners on hero images
- Text never centered except for single short headline moments
- Left-align most content; use right-alignment as a deliberate contrast tool
- Grid: prefer asymmetric (e.g. 5/7 split) over equal columns
- Section headers appear as small uppercase labels above the headline, not as the headline itself

---

## Scroll Animation System

Use `IntersectionObserver` with CSS custom properties. **No JavaScript animation libraries needed.**

### Core fade-up pattern

```css
/* Base state — elements start hidden and shifted down */
.reveal {
  opacity: 0;
  transform: translateY(2.5rem);
  transition:
    opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Stagger children */
.reveal:nth-child(1) {
  transition-delay: 0s;
}
.reveal:nth-child(2) {
  transition-delay: 0.12s;
}
.reveal:nth-child(3) {
  transition-delay: 0.24s;
}
.reveal:nth-child(4) {
  transition-delay: 0.36s;
}

/* Triggered state */
.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
// Intersection observer — trigger once, never reverse
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target); // fire once only
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
```

### Parallax image overlay (CSS only)

```css
.parallax-section {
  position: relative;
  overflow: hidden;
  height: 100svh;
}

.parallax-section__image {
  position: absolute;
  inset: -15%; /* oversized so it has room to move */
  background-size: cover;
  background-position: center;
  will-change: transform;
}

/* Drive with JS scroll handler or CSS scroll-driven animations */
@supports (animation-timeline: scroll()) {
  .parallax-section__image {
    animation: parallax-move linear both;
    animation-timeline: scroll(root);
    animation-range: entry 0% exit 100%;
  }

  @keyframes parallax-move {
    from {
      transform: translateY(-8%);
    }
    to {
      transform: translateY(8%);
    }
  }
}
```

### Line wipe (for horizontal dividers)

```css
.line-wipe {
  width: 0;
  height: 1px;
  background: var(--color-border);
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.line-wipe.in-view {
  width: 100%;
}
```

### Text character reveal (for hero headings)

```javascript
// Split text into spans, stagger with CSS delay
function splitReveal(el) {
  const words = el.textContent.trim().split(" ");
  el.innerHTML = words
    .map(
      (w, i) =>
        `<span class="word" style="transition-delay:${i * 0.08}s">${w}</span>`,
    )
    .join(" ");
}
```

---

## Component Patterns

### Hero Section

```html
<section class="hero">
  <div class="hero__image">
    <!-- Full-bleed vertical image -->
  </div>
  <div class="hero__content">
    <p class="eyebrow reveal">Property Name</p>
    <h1 class="hero__title reveal">Exceptional<br />Locations.</h1>
    <p class="hero__sub reveal">One line of supporting text, no more.</p>
  </div>
</section>
```

```css
.hero {
  position: relative;
  height: 100svh;
  display: grid;
  align-items: flex-end;
  padding: 4rem clamp(1.5rem, 5vw, 5rem);
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: var(--tracking-hero);
  color: var(--color-text);
}

.eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-caption);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 1rem;
}
```

### Card Grid (Property / Content listing)

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-gap);
}

.card__image {
  aspect-ratio: 3 / 4; /* portrait, like NOT A HOTEL */
  overflow: hidden;
}

.card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.card:hover .card__image img {
  transform: scale(1.04);
}

.card__label {
  margin-top: 1rem;
  font-size: var(--text-caption);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--color-muted);
}

.card__title {
  font-family: var(--font-display);
  font-size: var(--text-section);
  font-weight: 300;
}
```

### Navigation

```css
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem clamp(1.5rem, 5vw, 5rem);
  mix-blend-mode: difference; /* inverts against image or dark bg */
  z-index: 100;
}

.nav__logo {
  font-family: var(--font-body);
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.nav__links {
  display: flex;
  gap: 2.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

---

## Checklist Before Delivering

- [ ] No pure black or white — warm near-tones only
- [ ] At most one accent color, used sparingly
- [ ] Serif display font for all headings
- [ ] All scroll animations use `transition` + `IntersectionObserver`, not keyframe loops
- [ ] Images are full-bleed, no border-radius on hero/card images
- [ ] Section spacing feels generous — if in doubt, add more
- [ ] No box shadows on cards — use border or empty space instead
- [ ] Hover states are slow (0.6s+) and subtle (scale ≤ 1.04)
- [ ] Mobile: reduce hero font to `clamp(2.5rem, 10vw, 4rem)`, keep section padding

## What to Avoid

- Rounded cards (`border-radius` > 4px on image containers)
- Drop shadows or glows
- Gradient text effects
- Bouncy or spring animations
- Bright accent colors (red, blue, neon)
- Centered body text blocks
- Icon-heavy UI
- Any element that looks like a SaaS dashboard
