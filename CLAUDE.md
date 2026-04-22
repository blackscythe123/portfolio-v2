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
- `projects.html` — Cosmos page: real geodesic-raytraced black hole (see `blackhole.md`) with 6 planets on different orbital inclinations. ASCII text starfield, warp intro, auto-tour camera (play/pause), Genshin-style detail panel.
- `cloth-tear.html` — Standalone WebGL demo: Three.js cloth simulation with GLSL shader tearing

Image assets (`galaxy*.webp/jpg`, `home-original.webp`, `guardian.webp`, etc.) live at the repo root and are referenced by relative path.

External dependencies load via CDN only: `@chenglou/pretext` (text measurement), Three.js r128 (cloth-tear only), Three.js r0.158.0 via importmap (projects.html), Google Fonts.

## Black hole renderer

`projects.html` uses the real geodesic raytracer from `./threejs-blackhole/` (cloned from https://github.com/vlwkaos/threejs-blackhole.git).

**Read `blackhole.md` before touching projects.html.** It documents the shader architecture, coordinate system (Schwarzschild units), all uniforms, texture paths, default config values, and the compositing pattern for adding planets on top of the raytraced background.

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

### Cosmos / Black Hole System (projects.html)
See `blackhole.md` for the full shader and rendering details. Summary:
- Black hole rendered via real geodesic raytracing GLSL on a `PlaneGeometry(2,2)` — `renderOrder=-1000`, `depthTest=false`
- 6 planet meshes (Three.js spheres) added to same scene, rendered on top via higher renderOrder
- Shader uniforms driven by an `Observer` class (Schwarzschild-unit orbital camera): `cam_pos`, `cam_dir`, `cam_vel`, `fov`
- Tour state machine: `IDLE → TRAVEL → INSPECT → PAUSED` — camera eases to each planet, orbits slowly, advances after 5.5s
- Genshin-style detail panel slides in from right on planet selection

## Navigation

Hard navigation only — no SPA router. `window.location.href` for all transitions. The entry animation on each page is a CSS curtain divide (`#cl` / `#cr` scale to 0) triggered by `document.body.classList.add('loaded')` after the page's primary image loads.
