# Symmetrox API

A local HTTP API that renders mandalas from JSON. Built for AI agents (and
humans) to produce mandalas without driving a browser.

The same JSON format the API consumes is round-trippable through the UI's
Import / Export buttons, so an agent's output can be opened, tweaked, and
re-saved by a human.

## Quickstart

```bash
npm install
npm run api          # starts http://127.0.0.1:5174
# or run the UI and the API together:
npm run dev:all
```

```bash
curl -X POST http://127.0.0.1:5174/api/render \
  -H 'content-type: application/json' \
  --data-binary @docs/examples/star.json \
  --output star.png
```

## Endpoints

| Method | Path             | Body / Query                         | Returns |
|--------|------------------|--------------------------------------|---------|
| GET    | `/api/health`    | —                                    | `{ ok, version }` |
| GET    | `/api/schema`    | —                                    | JSON Schema for `MandalaSpec` |
| POST   | `/api/validate`  | `MandalaSpec`                        | `{ ok }` or `{ ok: false, errors }` |
| POST   | `/api/render`    | `MandalaSpec`, `?format=png\|json`   | `image/png` (default) or `{ width, height, pngBase64 }` |

The server binds to `127.0.0.1` only. Override with `SYMMETROX_API_HOST` /
`SYMMETROX_API_PORT` env vars.

## The mandala spec

```jsonc
{
  "version": 2,
  "width": 1024,            // canvas pixels (positive integer)
  "height": 1024,
  "background": "#0f0f12",  // CSS color or "transparent"
  "symmetryDefaults": {     // optional; filled in for commands missing `symmetry`
    "mode": "cyclic",       // "off" | "cyclic" | "mirror" | "tile"
    "slices": 8,            // used by cyclic/mirror (1..64)
    "tileW": 128,           // used by tile (px)
    "tileH": 128
  },
  "commands": [ /* see below */ ]
}
```

> v1 specs (`{ slices, reflect }`) are still accepted — the server migrates
> them to v2 on the fly (`reflect: true` → `mode: "mirror"`, otherwise
> `mode: "cyclic"`).

### Symmetry modes

- **off** — no symmetry; the draw call runs once.
- **cyclic** — one stroke becomes `slices` rotated copies around `(centerX, centerY)`.
- **mirror** — like cyclic, plus a reflection at each step (`2 × slices` copies).
- **tile** — translation symmetry. The stroke repeats across the canvas every
  `tileW` pixels horizontally and `tileH` pixels vertically.

### Coordinates

Canvas coordinates: origin at top-left, x grows right, y grows **down**. The
canvas center is `(width / 2, height / 2)` — the default symmetry center,
unless you override `centerX` / `centerY` per-command.

### Commands

Drawings are an ordered list of commands replayed onto the canvas. You almost
never want to fan out the radial copies yourself — set the symmetry config and
let the renderer multiply each stroke.

#### `stroke` — pencil / brush / marker / eraser

```json
{
  "type": "stroke",
  "kind": "pencil",
  "points": [ { "x": 512, "y": 512 }, { "x": 600, "y": 400 } ],
  "style": { "color": "#f4f4f5", "width": 4, "opacity": 1 },
  "symmetry": { "mode": "cyclic", "slices": 8 }
}
```

- `kind`: `"pencil"` (opaque), `"brush"` (soft falloff stamps), `"marker"`
  (translucent smooth curve), `"eraser"` (paints with the background color).
- `points`: 1+ points sampled along the stroke.
- `style.opacity`: optional, defaults vary by kind (pencil 1, brush 0.35,
  marker 0.5, eraser 1).
- `symmetry`: optional if `symmetryDefaults` is set. `centerX` / `centerY`
  default to the canvas center. `tileW` / `tileH` default to 128.

#### `airbrush`

```json
{
  "type": "airbrush",
  "dots": [ { "x": 600, "y": 400 } ],
  "style": { "color": "#888", "width": 24, "opacity": 0.15 },
  "symmetry": { "mode": "mirror", "slices": 8 }
}
```

Each dot becomes a soft splatter sized from `style.width / 8`.

#### `fill` — flood bucket

```json
{
  "type": "fill",
  "point": { "x": 600, "y": 400 },
  "color": "#fbbf24",
  "tolerance": 32,
  "symmetry": { "mode": "cyclic", "slices": 8 }
}
```

The flood fill seed is duplicated across all symmetric copies of the seed point.

#### `clear`

```json
{ "type": "clear" }
```

Wipes the canvas to transparent at this point in the command list. The
`background` is re-painted underneath at the start of the render.

## Errors

```json
{
  "ok": false,
  "errors": [
    { "path": "commands[3].style.width", "message": "must be a positive number" }
  ]
}
```

`path` follows JSON Pointer-ish notation so agents can self-correct.

## Tips

- **Design one slice, not the whole mandala.** Draw your motif in the wedge
  from `(centerX, centerY)` outward; the renderer copies it.
- **Vary slices per command.** One stroke can use `slices: 6`, the next
  `slices: 12`. Layering different counts gives richer patterns.
- **Mirror for kaleidoscope.** `cyclic` → pinwheel/rotation. `mirror` →
  mirror-symmetric petals.
- **Tile for textile-style patterns.** Draw one motif inside a `tileW × tileH`
  region and it repeats across the canvas.
- **Move the center.** Off-center symmetry produces very different feeling
  compositions from concentric mandalas — set `centerX` / `centerY` per command.
- **Keep point counts modest.** 5–20 points per stroke is plenty; symmetry
  multiplies them.
- **Validate before rendering.** `POST /api/validate` is cheap and returns the
  same error format as `/api/render`.

## Examples

See [`docs/examples/`](./examples/) for runnable starter specs:

- `star.json` — geometric pencil star
- `flower.json` — soft brush flower with reflect on
- `rosette.json` — layered marker + airbrush
