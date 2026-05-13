# Handoff: Symmetrox — Drawing App UI Redesign

## Overview

Symmetrox is an in-browser symmetric / tiled drawing application (cyclic, mirror, and tile-grid symmetry modes), inspired by the dense tool-palette ergonomics of late-80s paint programs like DeluxePaint II. This handoff covers a complete UI redesign of the application chrome: the website-style top bar has been replaced with a single dense application strip of dedicated controls, the side rail has been upgraded with custom iconography plus an integrated color pot, and a monospaced status bar runs across the bottom. A live, working drawing engine is included for reference behavior.

## About the Design Files

The files in this bundle are **design references created in HTML** — a working prototype that demonstrates the intended look, interaction model, and drawing math. They are **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's existing environment** (React + Tailwind, Vue + Pinia, SolidJS, vanilla web components, etc.) using its established component patterns, design tokens, and state-management conventions. If no environment exists yet, choose the most appropriate framework for the project (React + TypeScript + Vite is a sensible default for a canvas-heavy single-page tool) and implement the design there.

The HTML/JSX in this bundle is structured around plain React with Babel-in-the-browser and CSS custom properties — useful for visual reference, not for shipping.

## Fidelity

**High-fidelity.** All colors, type scales, spacing, border radii, and interaction states are final. Recreate pixel-for-pixel using the target codebase's idiomatic component library. Use the exact hex / oklch token values listed below.

## Layout — Application Shell

The app is a three-row grid that fills the viewport:

```
+-------------------------------------------------------+
| Top App Strip                  height: 56px           |
+-------------------------------------------------------+
| Left  |                                               |
| Rail  |   Stage (scrollable canvas area, centered)    |
| 56px  |                                               |
|       |                                               |
+-------------------------------------------------------+
| Status Bar                     height: 30px           |
+-------------------------------------------------------+
```

CSS:
- `.app` is `display: grid; grid-template-rows: 56px 1fr 30px; grid-template-columns: minmax(0, 1fr); height: 100vh; width: 100vw; overflow: hidden;`
- The `minmax(0, 1fr)` column is critical — prevents the topbar's intrinsic min-content from blowing out the viewport when it's wide.
- `.workspace` (middle row) is `display: grid; grid-template-columns: 56px minmax(0, 1fr); min-width: 0;`

## Design Tokens

### Colors

CSS custom properties keyed by `data-theme` on `:root`.

**Dark theme (default):**
| Token            | Value                       | Use                                 |
|------------------|------------------------------|-------------------------------------|
| `--bg`           | `oklch(0.14 0.004 60)`       | App body background                 |
| `--bg-stage`     | `oklch(0.10 0.004 60)`       | Stage area (radial gradient center) |
| `--surface`      | `oklch(0.18 0.005 60)`       | Topbar / status / panels            |
| `--surface-2`    | `oklch(0.22 0.005 60)`       | Topbar gradient stop, hover state   |
| `--surface-3`    | `oklch(0.26 0.005 60)`       | Button default background           |
| `--fg`           | `oklch(0.96 0.003 70)`       | Primary text                        |
| `--fg-dim`       | `oklch(0.72 0.005 70)`       | Secondary text, icon idle           |
| `--fg-mute`      | `oklch(0.52 0.005 70)`       | Labels (SIZE, STROKE, etc.)         |
| `--hairline`     | `oklch(0.30 0.005 60)`       | Borders, dividers                   |
| `--hairline-strong` | `oklch(0.38 0.005 60)`    | Active borders, divider gradients   |

**Light theme:**
| Token            | Value                       |
|------------------|------------------------------|
| `--bg`           | `oklch(0.97 0.003 80)`       |
| `--bg-stage`     | `oklch(0.93 0.003 80)`       |
| `--surface`      | `oklch(1.00 0 0)`            |
| `--surface-2`    | `oklch(0.95 0.003 80)`       |
| `--surface-3`    | `oklch(0.91 0.003 80)`       |
| `--fg`           | `oklch(0.20 0.005 60)`       |
| `--fg-dim`       | `oklch(0.42 0.005 60)`       |
| `--fg-mute`      | `oklch(0.62 0.005 60)`       |
| `--hairline`     | `oklch(0.86 0.003 80)`       |
| `--hairline-strong` | `oklch(0.78 0.003 80)`    |

**Shared accent:**
| Token            | Value                            | Use                                |
|------------------|-----------------------------------|------------------------------------|
| `--accent`       | `oklch(0.72 0.16 60)`            | Active states, symmetry overlay    |
| `--accent-soft`  | `oklch(0.72 0.16 60 / 0.18)`     | Active button background           |
| `--danger`       | `oklch(0.65 0.18 25)`            | Clear/delete button hover          |

The accent is an amber/orange that nods to DeluxePaint's palette without being literal. **Theme + accent should be the only place vibrant color appears in the chrome** — keep the rest in neutral oklch grays.

### Typography

Two Google Fonts loaded together:
- **Geist** — UI labels, button text, brand name. Weights 400 / 500 / 600 / 700.
- **Geist Mono** — all numeric readouts (size px, zoom %, hex codes, status bar), all-caps small labels (SIZE, STROKE, TOOL), brand wordmark. Weights 400 / 500 / 600.

The all-caps mono labels use `font-size: 9–10px; font-weight: 600; letter-spacing: 0.14em; color: var(--fg-mute);` — this is the visual signature of the chrome.

### Spacing & Radii

| Token       | Value | Use                              |
|-------------|-------|----------------------------------|
| `--r-sm`    | 4px   | Buttons, segmented control       |
| `--r-md`    | 6px   | Rail tool buttons, brand mark    |
| `--r-lg`    | 8px   | Color popover                    |
| `--topbar-h` | 56px | Top app strip                    |
| `--status-h` | 30px | Bottom status bar                |
| `--rail-w`  | 56px  | Left tool rail                   |

Vertical button height in the top strip: **30px**. Stepper/segmented heights also **30px** so groups align. Status bar inner control height: **22px**.

## Screens / Views

There is one screen — the canvas workspace. Sections below.

### 1. Top App Strip (`.topbar`)

A single dense row, `height: 56px`, with a top-to-bottom gradient from `--surface-2` to `--surface` and a 1px `--hairline` bottom border. `display: flex; align-items: stretch; padding: 0 10px; overflow-x: auto; min-width: 0; width: 100%;` — overflow on narrow viewports scrolls horizontally (4px scrollbar).

Groups are separated by `.topbar-div`: a 1px wide column with `margin: 8px 8px; background: linear-gradient(to bottom, transparent, var(--hairline-strong) 30%, var(--hairline-strong) 70%, transparent);` — fades top/bottom so it doesn't visually touch the bar edges.

Left-to-right contents:

#### Brand (`.brand`)
- 28×28 square with `--surface-3` background, 1px `--hairline-strong` border, `--r-md` radius. Inside: an inline SVG mark (a five-point star with a dashed vertical axis through it) drawn in `--accent` color, 20×20, 1.6 stroke.
- Wordmark: "SYMMETROX" in Geist Mono, 11.5px, 600, `letter-spacing: 0.12em`, `color: var(--fg)`.

#### File group (`.group` containing 3 `.tb` buttons)
- New canvas, Import image, Export PNG.
- Each is a 30px-tall icon button, 1px `--hairline` border, `--surface-3` background, `--r-sm` radius, 16px icon.

#### Edit group
- Undo, Redo (disabled state when history empty: opacity 0.35), Clear (uses `.is-danger` variant — hover shows danger-tinted background and border).

#### Brush size group (`.group-brush`)
- **Brush preview tile**: 30×30 square with a checkerboard background (`repeating-conic-gradient`, 8px squares), 1px hairline border. Centered inside is a circle whose diameter matches the current brush size (clamped 2–28px). Color reflects current stroke color; marker tool gets 53% alpha to imply translucence.
- **Numeric stepper** (`.stepper`): 30px-tall pill containing `[ label ]  [ − ]  [ value px ]  [ + ]` arranged in an inline grid, with a thin range slider underneath spanning the full width.
  - Label: "SIZE" in mono, 9.5px, 600, 0.14em tracking, `--fg-mute`.
  - −/+ buttons: 18×18, 14px symbol, `--surface` background, 1px hairline.
  - Value: Geist Mono 12px 600 with the suffix ("px") slightly smaller and muted.
  - Range slider: 3px track in `--hairline-strong`, 10×10 thumb in `--accent` with a 2px `--surface-3` ring.

#### Symmetry group (`.group-sym`)
- Group label "SYMMETRY" in the standard mono micro-label style.
- **Segmented control** (`.seg`): pill with 2px inner padding, 4 buttons OFF / CYC / MIR / TIL.
  - Each button: 24px tall, 11px Geist Mono 600 letter-spacing 0.06em, 13px icon + 5px gap + label.
  - Active button: background `--surface`, color `--fg`, `box-shadow: 0 0 0 1px var(--hairline-strong), 0 1px 0 rgb(0 0 0 / 0.08)`.
- **Folds/Axes/Grid stepper**: same stepper component, label changes by mode ("FOLDS" for cyclic, "AXES" for mirror, "GRID" for tile). Max value: 24 for cyclic/mirror, 8 for tile. Hidden when mode is OFF.
- **Place Center button**: 30px square icon button (crosshair icon). When toggled active, shows a centered toast inside the canvas reading `CLICK ON THE CANVAS TO SET CENTER · ESC TO CANCEL` in mono with the accent background.

#### Theme switcher (right-aligned via `flex: 1` spacer)
- Compact segmented control, `.seg-icononly` modifier: 24px × 22px per button, icons only (no labels). Three options: System (monitor icon), Light (sun), Dark (moon).

### 2. Left Rail (`.leftrail`)

`width: 56px`, full height between topbar and statusbar. Background: `linear-gradient(to right, var(--surface-2), var(--surface))`. 1px `--hairline` right border. `padding: 8px 6px;` `display: flex; flex-direction: column;`.

Two zones separated by a `.rail-divider` (1px high, `--hairline`, 10px vertical margin, 4px horizontal margin):

#### Tools (`.rail-tools`)
Vertical stack of 44×44 tool buttons (`gap: 2px`). For each tool:
- Default: transparent background, `--fg-dim` icon, 1px transparent border.
- Hover: `--surface-3` background, `--fg` icon.
- Active: `--surface` background, `--hairline-strong` border, `--accent` icon, `inset 0 0 0 1px var(--accent)` shadow.
- Keyboard hint badge in bottom-right corner: 8.5px Geist Mono 600, `--fg-mute`, 0.7 opacity.

Tools (in order): Pencil (P), Brush (B), Marker (M), Spray (S), Eraser (E), Eyedropper (I), Fill (F).

Icons are **custom 24×24 SVGs**, 1.6 stroke, round caps/joins. They are intentionally chunkier and more geometric than Lucide. See `icons.jsx` in the bundle for exact path data. **Do not substitute generic icon libraries** — re-implement these as SVG components in the target codebase.

#### Color pot (`.rail-colors`)
A classic foreground/background color pair, vertically stacked:
- 44×44 `.color-pot` container.
- Foreground (stroke color) chip: 26×26, `--r-sm` radius, 1.5px border in `--chip-ring`, positioned at top-left, z-index 2.
- Background (paper color) chip: 26×26, identical styling, positioned at bottom-right, z-index 1 (sits behind FG). The two chips overlap by 8px.
- Swap button (`.rail-swap`): 18×18 circle, top-right corner, 1px `--hairline-strong` border, `--surface` background, recycle/swap SVG. Hover: `--accent` color and border. Keyboard shortcut: **X**.
- Mono label "COLOR" below the pot, 9px, `--fg-mute`.

Clicking a chip opens the **color popover** to the right of the rail (`.chip-pop-right` modifier): `bottom: -4px; top: auto; left: calc(100% + 14px);` so it extends upward, never below the viewport edge. The popover is 196px wide, `--surface` background with `--hairline-strong` border, `--r-md` radius, 10px padding, and a soft drop shadow.

### Color popover contents (top to bottom)
1. **Title row**: "STROKE COLOR" or "PAPER COLOR" — mono, 10px, 0.14em tracking, `--fg-mute`.
2. **Curated palette grid**: `display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px;` — 24 fixed swatches arranged in 4 rows of 6: base grays, warm tones, cool tones, accents. Each swatch is a square (`aspect-ratio: 1`), 1px hairline border, 2px radius. Hover: `transform: scale(1.12)`. Active match: `box-shadow: 0 0 0 2px var(--accent), 0 0 0 3px var(--surface)`.
3. **Recent colors** (if any): "RECENT" label, then a tighter 8-column grid of the last 8 unique colors used.
4. **Hex input row**: pill-shaped field with a mono "#" prefix, monospace input for the 6-char hex, and a 18×18 live preview chip on the right. Pressing Enter or blur commits.

### Palette values (exact)
```
Row 1: #0a0a0a #3a3a3a #6a6a6a #a8a8a8 #dcdcdc #ffffff
Row 2: #7a1f1f #c0392b #e74c3c #f39c12 #f1c40f #fff2a8
Row 3: #0e3a5e #1e6bb8 #2ecc71 #27ae60 #16a085 #1abc9c
Row 4: #4a148c #7b1fa2 #c2185b #e91e63 #ff5e9c #ff8fb8
```

### 3. Stage (`.stage`)

The scrollable canvas area. Background: `radial-gradient(ellipse at center, var(--bg-stage), var(--bg) 90%)` — a subtle vignette so the canvas paper feels lit from behind.

Inside is `.canvas-wrap`: `min-width: 100%; min-height: 100%; display: grid; place-items: center; padding: 32px;`. This makes the canvas center when smaller than the stage, and scroll when larger.

The canvas itself (`.canvas-stage`) is a positioned div containing two stacked `<canvas>` elements (base + live stroke layer) plus an overlay SVG for the symmetry guides. It carries the shadow:
- Dark: `box-shadow: 0 30px 60px -20px rgb(0 0 0 / .6), 0 0 0 1px oklch(0.35 0.005 60);`
- Light: `box-shadow: 0 24px 48px -16px rgb(0 0 0 / .18), 0 0 0 1px oklch(0.78 0.003 80);`

#### Symmetry overlay
A non-interactive SVG layer drawn on top of the canvas in the active accent color. Contents depend on mode:
- **Cyclic**: N rays from center, each 60px long, evenly spaced.
- **Mirror**: N mirror axes, 160px long, passing through center.
- **Tile**: Vertical and horizontal grid lines dividing the canvas into N×N cells.
- **All modes**: A 9px ring + 2px dot at the symmetry center, with four 9px tick marks forming a crosshair around it.

Stroke style: `stroke-width: 1; stroke-dasharray: 4 4; opacity: 0.6;` for axes; `stroke-dasharray: 2 4; opacity: 0.4;` for tile grid; solid 1.5 for the ring/crosshair.

### 4. Status Bar (`.statusbar`)

`height: 30px`. Background: `linear-gradient(to top, var(--surface-2), var(--surface))`. 1px `--hairline` top border. Left-to-right blocks separated by 1px `--hairline` vertical borders:

| Block | Label (mono 9px) | Value (mono 11px 600) | Example |
|-------|------------------|------------------------|---------|
| TOOL  | TOOL             | tool name (uppercase)  | PENCIL  |
| SIZE  | SIZE             | current brush size     | 4px     |
| SYM   | SYM              | mode · count           | CYCLIC · 6 |
| CANVAS | CANVAS          | canvas WxH             | 1600×1000 |
| XY    | XY               | live mouse coords      | 1295, 483 |

After a flex spacer, a `.zoom-row` on the right with four 22px icon buttons (`.tb-xs`): zoom out, current zoom % readout (mono 11px 600, 42px min-width centered), zoom in, 1:1 reset, fit-to-screen.

## Interactions & Behavior

### Drawing flow
- `pointerdown` on the live canvas starts a stroke; a points array is initialized with the canvas-space coordinate.
- `pointermove` appends points; the live layer redraws on every frame using quadratic-curve smoothing between consecutive points (midpoint control-point technique).
- `pointerup` (or `pointercancel`) commits the live stroke to the strokes array and clears the redo stack.

### Tool behaviors
| Tool | Implementation |
|------|----------------|
| Pencil | `lineWidth = size * 0.7`, source-over, full alpha |
| Brush  | `lineWidth = size * 1.1`, source-over, full alpha |
| Marker | `lineWidth = size * 1.6`, source-over, **alpha 0.55** |
| Spray  | At each path point, scatter `density = max(2, size*0.6)` dots within a radius of `size`, each dot a 0.6-radius filled arc. No stroke. |
| Eraser | `globalCompositeOperation = "destination-out"`, normal stroke path |
| Eyedropper | `getImageData(1,1)` at click, convert to hex, set stroke color, push to recent, auto-switch back to pencil |
| Fill   | 4-way flood fill with 4-unit tolerance on RGBA; result committed as an image-type stroke (full canvas snapshot) |

### Symmetry math
Each stroke is replayed N times per render, with N transforms applied around the symmetry center. Transforms are `{rot, sx, sy, tx, ty}` applied as `translate(center) → rotate → scale → translate(-center)`. See `getTransforms` in `canvas.jsx` for the exact derivation per mode.

Critical: **image-type strokes (imports, fill snapshots) bypass symmetry** — they're drawn once at full canvas size.

### State & undo
- `strokes`: ordered array of stroke objects, each `{tool, color, size, points: [{x,y}, ...]}` (or `{tool: "image", img, w, h, fit?}` for raster snapshots).
- `redoStack`: same structure; any new stroke clears the redo stack.
- Undo pops the last stroke into redo. Redo pushes the first redo entry back into strokes.
- Clear prompts for confirmation and wipes both stacks.

### Keyboard shortcuts
| Key       | Action                          |
|-----------|----------------------------------|
| P/B/M/S/E/I/F | Switch tool                  |
| `[` / `]` | Decrease / increase brush size  |
| X         | Swap stroke ↔ paper colors      |
| ⌘Z / Ctrl+Z | Undo                          |
| ⇧⌘Z / Ctrl+Y | Redo                         |
| Esc       | Cancel "place center" mode (TODO — wire if missing) |

Inputs (`<input>`) must early-return from the keydown handler so typing in the hex field doesn't trigger tool shortcuts.

### Theme switching
`document.documentElement.setAttribute("data-theme", "light"|"dark")`. System mode reads `prefers-color-scheme` and listens for changes. Persist user choice to `localStorage` in production.

### Fit-to-screen zoom
On mount and when the user clicks "fit", compute:
```
z = min((stageWidth - 80) / canvasW, (stageHeight - 80) / canvasH, 1)
```
The 80px padding is the canvas-wrap `padding: 32px` doubled plus a small safety margin.

## State Variables (suggested)

```ts
type Tool = "pencil" | "brush" | "marker" | "spray" | "eraser" | "eyedrop" | "fill";
type SymMode = "off" | "cyclic" | "mirror" | "tile";

interface AppState {
  tool: Tool;
  brushSize: number;        // 1..64
  strokeColor: string;      // hex
  canvasColor: string;      // hex
  theme: "system" | "light" | "dark";
  placingCenter: boolean;

  symMode: SymMode;
  symPoints: number;        // 2..24 (cyclic/mirror), 1..8 (tile)
  symCenter: { x: number; y: number };

  canvasW: number;          // 1600 default
  canvasH: number;          // 1000 default
  zoom: number | "fit";

  strokes: Stroke[];
  redoStack: Stroke[];
  liveStroke: Stroke | null;
  recentColors: string[];   // last 8 unique
  coords: { x: number; y: number };  // for status bar XY readout
}
```

## Responsive Behavior

This is a workstation tool, not a mobile experience. Optimize for ≥ 1280px wide. The top strip scrolls horizontally below that. Below ~900px wide, consider hiding the brand wordmark or collapsing the file group into a "..." menu — but those breakpoints are out of scope here.

## Assets

- **Fonts**: Geist + Geist Mono via Google Fonts CDN. Self-host in the target codebase per its asset pipeline.
- **Icons**: All custom inline SVGs — see `icons.jsx`. Re-implement as a typed icon component set in the target codebase. **Do not substitute with Lucide / Heroicons** — the hand-tuned proportions are part of the visual identity.
- **No raster assets.** The brand mark is also SVG.

## Files

In this handoff bundle:

| File              | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| `Symmetrox.html`  | Entry document — contains all CSS in a `<style>` block.      |
| `icons.jsx`       | All 22 custom SVG icons used in the chrome.                  |
| `toolbars.jsx`    | TopBar, LeftRail, StatusBar, Segmented, NumStepper, ColorChip, BrushPreview. |
| `app.jsx`         | App state, pointer handling, undo/redo, fill, import/export, keyboard shortcuts. |
| `canvas.jsx`      | DrawCanvas component, symmetry transform math, stroke renderer, flood fill. |
| `screenshots/`    | Reference renders of key states. See section below.          |

## Screenshots

Reference captures in `screenshots/`. All taken at a narrow preview viewport (~924px) so the top strip overflows horizontally with a scrollbar — at a real workstation width (≥ 1280px) the topbar groups all fit on a single row without scrolling.

| File                          | Shows                                                              |
|-------------------------------|--------------------------------------------------------------------|
| `01-dark-default.png`         | Dark theme, empty canvas, 6-fold cyclic symmetry guides visible. Tool rail with active Pencil + color pot at the bottom. |
| `02-dark-drawing.png`         | Dark theme mid-stroke — illustrates how cyclic symmetry replicates the user's path live as they draw. |
| `03-color-popover.png`        | Stroke-color popover opened to the right of the rail. Shows the 24-swatch curated grid; "RECENT" and the hex input row appear beneath when applicable. |

> The light theme is a straight token swap — every surface gets the light `--bg/--surface/--fg/--hairline` values; component geometry is identical. Verify implementation by toggling `[data-theme="light"]` on the root. The canvas "paper" color is user-controlled and independent of UI theme.

Run the prototype locally (open `Symmetrox.html` in a browser) to inspect any state these stills don't cover — drawing math, hover/active states, mirror & tile symmetry overlays, place-center toast, etc.

## Open questions / nice-to-haves (not blocking)

- Persistence of strokes to `localStorage` across reloads.
- Save/Open project format (e.g. JSON of strokes).
- Pressure sensitivity from the Pointer Events `pressure` property.
- Multi-layer support — currently one layer.
- A custom HSL/HSV color picker in addition to the curated palette.
- A "Symmetry preview" mode that shows the symmetric reflection of the cursor before any stroke is drawn.
