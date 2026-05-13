# Symmetrox

A browser-based drawing app where every stroke is mirrored around a center, turning ordinary marks into mandalas.

A single gesture becomes many: the canvas does the symmetry, and you focus on the line.

## What it does

- **Four symmetry modes**, inspired by Deluxe Paint II:
  - **Off** — no symmetry, draw plain strokes.
  - **Cyclic** — rotational copies around a center point (1–40 points).
  - **Mirror** — rotational copies plus a reflection at each step (kaleidoscope).
  - **Tile** — repeat your stroke across the canvas as a tile pattern (W × H pixels).
- **Place Center.** The symmetry center defaults to the canvas center, but you can place it anywhere with one click.
- **Six tools.** Pencil, brush, marker, airbrush, eraser, and fill bucket — all symmetry-aware.
- **Adjustable brush size and colors.** Foreground and background colors with sensible light/dark defaults.
- **Pan & zoom** the canvas without losing your place.
- **Undo / redo** backed by a command history (⌘Z / ⌘⇧Z, Ctrl on Windows/Linux).
- **Light / dark / system theme.** Background and foreground swap with the theme unless you've picked custom colors.

## How the symmetry works

A drawing isn't a stack of pixels — it's a list of *commands* (strokes, airbrush dots, fills, clears). When the canvas renders, it walks the command list and, for each one, applies a transform based on the symmetry mode: rotate around the center for cyclic/mirror, or translate across a tile grid for tile mode. The same draw call runs once per slice (or tile), so any tool you build automatically gets symmetry for free.

That's why undo/redo is exact: the canvas re-runs the commands, not a snapshot. And it's why changing the slice count after the fact would change the drawing — the symmetry isn't baked in.

## Tech stack

- **React 19** + **TypeScript**
- **Vite** for dev and build
- **Tailwind CSS** for styling
- **Zustand** for state (canvas size, tool, colors, symmetry config, command history, theme, viewport)
- HTML5 Canvas 2D for rendering

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other scripts:

```bash
npm run api        # local HTTP API for AI agents (http://127.0.0.1:5174)
npm run dev:all    # UI + API together
npm run build      # type-check + production build
npm run preview    # serve the production build locally
npm run lint       # eslint
```

## Agentic API

Symmetrox ships a local HTTP API that renders mandalas from JSON. AI tools post a
spec and get back a PNG. The same JSON round-trips through the UI's
Import / Export buttons.

See [`docs/api.md`](./docs/api.md) for the spec format and endpoints, and
[`.claude/skills/symmetrox/SKILL.md`](./.claude/skills/symmetrox/SKILL.md) for the
agent-facing skill file.

## Project layout

```
src/
  app/         App shell — header, layout, global keyboard shortcuts, theme effects
  api/         MandalaSpec types and validator (shared with the server)
  canvas/      Canvas component, viewport math, screen↔canvas coordinate mapping
  commands/    Command types and the replay/history machinery
  state/       Zustand store (single source of truth)
  symmetry/    withSymmetry — the rotation/reflection wrapper around any draw call
  tools/       Pencil, brush, marker, airbrush, eraser
  ui/          Toolbar, color/brush/symmetry/zoom/theme controls
server/        Headless render API (Node + @napi-rs/canvas)
docs/          API docs and example specs
```

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| Undo | ⌘Z / Ctrl+Z |
| Redo | ⌘⇧Z / Ctrl+Shift+Z (or ⌘Y / Ctrl+Y) |
