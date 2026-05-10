---
name: yantric
description: Generate mandalas as PNGs via the Yantric local HTTP API. Use when the user asks for a mandala, kaleidoscope, yantra, radial pattern, or symmetric ornamental design. Requires `npm run api` to be running at http://127.0.0.1:5174.
---

# Yantric mandala API

A radial-symmetry drawing app exposes a local HTTP API at
`http://127.0.0.1:5174`. Send it a JSON `MandalaSpec`, get back a PNG.

## When to use this skill

The user wants a mandala, kaleidoscope, radial pattern, or any symmetric
ornamental design rendered as an image.

If the user has not started the API, tell them to run `npm run api` (or
`npm run dev:all` for API + UI) in the project root.

## The core idea: design ONE slice

The renderer multiplies every stroke around the canvas center by `slices`
copies (and again mirrored if `reflect` is true). **You write one stroke per
"petal"; you do not rotate it yourself.**

If you find yourself writing the same shape at multiple angles, stop — set
`slices` higher and write it once.

## Workflow

1. Decide canvas size (`1024 × 1024` is a good default) and `background`.
2. Pick `symmetryDefaults`:
   - `slices`: 6, 8, 12 are reliable starting points (4 feels sparse, 16+
     feels dense).
   - `reflect`: `false` for pinwheel/rotational; `true` for kaleidoscope
     mirror symmetry.
3. Sketch your motif in **one slice** — a wedge from the canvas center
   `(width/2, height/2)` outward toward an edge. Points should be in canvas
   coordinates (origin top-left, y grows down).
4. POST to `/api/render`. Iterate.

```bash
curl -sS -X POST http://127.0.0.1:5174/api/render \
  -H 'content-type: application/json' \
  --data-binary @spec.json \
  --output mandala.png
```

For agents that prefer JSON (e.g. to embed the PNG inline):

```bash
curl -sS -X POST 'http://127.0.0.1:5174/api/render?format=json' \
  -H 'content-type: application/json' \
  --data @spec.json
# -> { width, height, pngBase64 }
```

Validate without rendering: `POST /api/validate`.

## Spec format

```json
{
  "version": 1,
  "width": 1024,
  "height": 1024,
  "background": "#0f0f12",
  "symmetryDefaults": { "slices": 8, "reflect": false },
  "commands": [ /* stroke | airbrush | clear */ ]
}
```

### `stroke`

```json
{
  "type": "stroke",
  "kind": "pencil",
  "points": [{ "x": 512, "y": 512 }, { "x": 700, "y": 320 }],
  "style": { "color": "#f4f4f5", "width": 4, "opacity": 1 }
}
```

`kind`:
- `pencil` — opaque, sharp lines. Use for outlines and geometry.
- `marker` — translucent, smoothed curves. Use for soft accents.
- `brush` — soft circular stamps with falloff. Use for petals, glow.
- `eraser` — paints with the background color (handy after laying down
  blobs, to carve detail).

`style`:
- `color`: any CSS color string (`"#rrggbb"`, `"rgb(...)"`, named).
- `width`: positive number (pixels).
- `opacity`: optional, in `[0, 1]`. Defaults: pencil 1, brush 0.35,
  marker 0.5, eraser 1.

`symmetry` (optional if `symmetryDefaults` is set): `{ slices, reflect,
centerX?, centerY? }`. Different commands can use different counts —
layering 6-fold over 12-fold is a common trick.

### `airbrush`

```json
{
  "type": "airbrush",
  "dots": [{ "x": 700, "y": 400 }],
  "style": { "color": "#888", "width": 32, "opacity": 0.15 }
}
```

Each dot becomes a soft splatter sized `width / 8`. Good for atmosphere
and color washes.

### `clear`

```json
{ "type": "clear" }
```

Wipes the canvas at this point in the command list. The `background`
fills underneath at the start of each render.

## Common mistakes

- **Drawing all `slices` copies manually.** Don't. Write one stroke; the
  renderer rotates it.
- **Centering on `(0, 0)`.** The center is `(width/2, height/2)`, not the
  origin. The origin is the top-left corner.
- **Inverting Y.** Canvas Y grows down. A point with smaller `y` is higher
  on screen.
- **Hundreds of points per stroke.** Symmetry multiplies. 5–20 points is
  usually enough; the renderer interpolates smoothly.
- **`slices: 1`.** Valid, but disables symmetry — you draw the canvas
  literally.
- **Forgetting `version: 1`.** Required.

## Layering recipe

Strong mandalas usually layer:
1. **Background wash** — one or two `airbrush` commands with low opacity
   and a colorful `slices: 6–12`.
2. **Petals** — `brush` strokes from center outward, often with `reflect:
   true` for symmetry.
3. **Geometry** — `pencil` lines with a higher `slices` count (16 or 24)
   for crisp radial detail.
4. **Accents** — small `pencil` shapes at a different `slices` count to
   create rhythm.

## Worked example: a 6-petal flower

```json
{
  "version": 1,
  "width": 1024,
  "height": 1024,
  "background": "#fef3c7",
  "symmetryDefaults": { "slices": 6, "reflect": true },
  "commands": [
    {
      "type": "stroke",
      "kind": "brush",
      "points": [
        { "x": 512, "y": 512 },
        { "x": 560, "y": 420 },
        { "x": 600, "y": 320 },
        { "x": 580, "y": 220 },
        { "x": 512, "y": 180 }
      ],
      "style": { "color": "#ec4899", "width": 40, "opacity": 0.45 }
    },
    {
      "type": "stroke",
      "kind": "marker",
      "points": [
        { "x": 512, "y": 512 },
        { "x": 540, "y": 380 },
        { "x": 530, "y": 240 }
      ],
      "style": { "color": "#15803d", "width": 6, "opacity": 0.85 }
    },
    {
      "type": "stroke",
      "kind": "pencil",
      "points": [{ "x": 512, "y": 512 }, { "x": 700, "y": 380 }],
      "style": { "color": "#7c2d12", "width": 2, "opacity": 0.9 },
      "symmetry": { "slices": 24, "reflect": false, "centerX": 512, "centerY": 512 }
    }
  ]
}
```

The first command (`reflect: true`, `slices: 6`) draws 12 symmetric
petals. The second adds a stem inside each petal. The third overlays a
24-spoke radial fan in a different color to suggest stamen.

## Reference

- Full docs: `docs/api.md`
- Schema endpoint: `GET /api/schema`
- Example specs: `docs/examples/`
- Health check: `GET /api/health` returns `{ ok: true, version: 1 }`
