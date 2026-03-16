---
name: UI design direction — Anthropic-inspired refinement
description: Ongoing UI optimization applying Anthropic.com design philosophy to the editorial dark theme. Reference file at ~/Desktop/anthropic-ui-design-analysis.md
type: project
---

UI optimization in progress (started 2026-03-16) based on Anthropic.com design analysis.

**Why:** User wants to refine the existing editorial design language using Anthropic's principles — warm tones, restraint, generous whitespace, content-first.

**How to apply:**
- Do NOT switch to light theme — keep the dark editorial base but apply the principles
- Warm color temperature throughout (no pure #000/#fff)
- Cards: subtle background differences instead of heavy shadows/borders
- Buttons: restrained hover (slight darken, no big transforms)
- Typography: already good (Cormorant + Jost), maintain serif+sans pairing
- Animation: already restrained, keep fade-in + translate-up pattern
- Layout: generous section spacing, prose width constraints
- Reference: `~/Desktop/anthropic-ui-design-analysis.md`
- Multi-session effort — optimize globals + components first, then page-by-page
