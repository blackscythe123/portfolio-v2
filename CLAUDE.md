# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build system or package manager. All pages are self-contained HTML files served directly:

```bash
# Any static server works:
python -m http.server 8080
# Then open http://localhost:8080/ascii-bg.html
```

Or open HTML files directly in the browser via `file://`.

## Project Structure

Four standalone HTML pages — each is a single file with all CSS and JS inlined:

- `ascii-bg.html` — Home page: ASCII art canvas, gravity physics, typed prompt, page-tear transition to skills/projects
- `skills.html` — Skills page: galaxy image ASCII rendering, interactive skill cores, camera zoom-pan
- `projects.html` — Artifacts page: Genshin Impact–style artifact screen with golden 3D orbs orbiting the guardian character, Pretext obstacle-aware text columns, animated detail panel
- `cloth-tear.html` — Standalone WebGL demo: Three.js cloth simulation with GLSL shader tearing

Image assets (`galaxy*.webp/jpg`, `home-original.webp`, `guardian.webp`, etc.) live at the repo root and are referenced by relative path.

External dependencies load via CDN only: `@chenglou/pretext@0.1.4` (text measurement), Three.js r128 (cloth-tear only), Google Fonts.

## Core Animation Systems

### ASCII Canvas Rendering (ascii-bg.html, skills.html)
Images are downsampled to a character grid. Each pixel maps to a character via ITU-R luma (`0.299R + 0.587G + 0.114B`), indexed into a 9-char brightness string (`CHARS_SRC`). The original RGB is stored for per-pixel coloring.

Two synchronized layers render the same grid:
- `#visual` canvas — colored characters drawn with `fillText`
- `#selectable` pre element — transparent monospace text for accessibility/selection

Character width is measured once using `@chenglou/pretext` (falls back to measuring 50 X's on an `OffscreenCanvas`).

Heat distortion: each cell has a `heat` value decaying at `*= 0.82` per frame. Mouse proximity within `DIST_R=30px` injects heat and boosts RGB channels, causing character randomization.

### Page-Tear / Scroll-Curl Transition (ascii-bg.html → skills.html)
The transition is **not** a CSS animation — it's a custom canvas overlay:
1. Screenshot the live ASCII canvas via `createImageBitmap()`
2. Spawn a full-screen overlay canvas at `z-index: 99999`
3. A vertical cut line sweeps left-to-right; each strip behind the cut curls using the formula:
   `curl = (1 - (1 - s)^(2/3))^1.5` where `s = (cutX - x) / cutX` (astroid curve — hardcoded geometry, not physics simulation)
4. Top/bottom halves translate in opposite Y directions proportional to `curl * MAX_PEEL`
5. After `TOTAL_DURATION`, hard-redirect: `window.location.href = 'skills.html'`

Flag `isTearRunning` freezes grid updates during the transition.

### Skill Core Detection (skills.html)
Five skill cores are **discovered from the galaxy image at runtime** — not hardcoded positions. The algorithm finds 5 brightness peaks with minimum separation, excluding edge margins. The RGB at each peak becomes the core's theme color (falls back to a palette if the pixel is near-grayscale).

Camera zoom-pan: clicking a core sets `cam.targetScale = 3.5` and `cam.targetX/Y` to center it. The camera lerps at `0.05` per frame toward the target. Each frame, characters outside the visible viewport are skipped (frustum culling).

### WebGL Cloth Tear (cloth-tear.html)
Three.js with custom GLSL vertex + fragment shaders. The "bridging triangle discard" trick: vertices are assigned a `side` attribute (0 = above cut, 1 = below). Fragment shader discards pixels where interpolated `vSide` falls between 0 and 1 — this cleanly removes the polygons that would bridge the torn edges. The tear line uses multi-octave sine noise for irregular edges.

### Artifact Orbit System (projects.html)
Repos are rendered as golden 3D orbs on an elliptical orbit around the `guardian.webp` character (drawn cropped to top 84% so feet go off-screen). Each frame:
1. Orb position = `cx + cos(angle) * orbRx, cy + sin(angle) * orbRy` where `angle = angleOffset + elapsed * 0.20`
2. `drawGoldenOrb()` renders a sphere via two radial gradients (offset light source for 3D), two counter-rotating ellipse rings, and a specular highlight — all on the 2D canvas (no WebGL)
3. Labels use `layoutNextLine` in a loop, shrinking `maxWidth` each iteration when another orb occupies the same vertical band

Artifact state machine: `S.ORB → S.FLY → S.EQP → S.RET → S.ORB`. Flight uses a quadratic Bézier (`bQ()`) with ease-out cubic timing toward `handX/handY` (guardian's chest at ~50% screen width, 52% height).

Left (`#art-grid`) and right (`#detail-panel`) panels slide in on artifact selection using CSS `transform: translateX`. The detail panel renders Genshin-style stats (seeded HP/ATK/ER/CRIT derived from repo name hash) and lore text via `layoutWithLines`.

Left/right `drawCol()` text columns are hidden when the detail panel is open to avoid overlap.

## Navigation

Hard navigation only — no SPA router. `window.location.href` for all transitions. The entry animation on each page is a CSS curtain divide (`#cl` / `#cr` scale to 0) triggered by `document.body.classList.add('loaded')` after the page's primary image loads.
