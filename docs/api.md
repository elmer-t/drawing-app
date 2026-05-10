# Yantric API

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

The server binds to `127.0.0.1` only. Override with `YANTRIC_API_HOST` /
`YANTRIC_API_PORT` env vars.

## The mandala spec

```jsonc
{
  "version": 1,
  "width": 1024,            // canvas pixels (positive integer)
  "height": 1024,
  "background": "#0f0f12",  // CSS color or "transparent"
  "symmetryDefaults": { "slices": 8, "reflect": false }, // optional
  "commands": [ /* see below */ ]
}
```

### Coordinates

Canvas coordinates: origin at top-left, x grows right, y grows **down**. The
canvas center is `(width / 2, height / 2)` — your symmetry center, unless you
override per-command.

### Commands

Drawings are an ordered list of commands replayed onto the canvas. You almost
never want to fan out the radial copies yourself — set `slices` and let the
renderer multiply each stroke. One stroke in the spec becomes `slices` strokes
on the canvas (or `2 × slices` if `reflect` is true).

#### `stroke` — pencil / brush / marker / eraser

```json
{
  "type": "stroke",
  "kind": "pencil",
  "points": [ { "x": 512, "y": 512 }, { "x": 600, "y": 400 } ],
  "style": { "color": "#f4f4f5", "width": 4, "opacity": 1 },
  "symmetry": { "slices": 8, "reflect": false }
}
```

- `kind`: `"pencil"` (opaque), `"brush"` (soft falloff stamps), `"marker"`
  (translucent smooth curve), `"eraser"` (paints with the background color).
- `points`: 1+ points sampled along the stroke.
- `style.opacity`: optional, defaults vary by kind (pencil 1, brush 0.35,
  marker 0.5, eraser 1).
- `symmetry`: optional if `symmetryDefaults` is set. `centerX` / `centerY`
  default to the canvas center.

#### `airbrush`

```json
{
  "type": "airbrush",
  "dots": [ { "x": 600, "y": 400 } ],
  "style": { "color": "#888", "width": 24, "opacity": 0.15 },
  "symmetry": { "slices": 8, "reflect": true }
}
```

Each dot becomes a soft splatter sized from `style.width / 8`.

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
- **Reflect for kaleidoscope.** Off → pinwheel/rotation. On → mirror-symmetric
  petals.
- **Keep point counts modest.** 5–20 points per stroke is plenty; symmetry
  multiplies them.
- **Validate before rendering.** `POST /api/validate` is cheap and returns the
  same error format as `/api/render`.

## Examples

See [`docs/examples/`](./examples/) for runnable starter specs:

- `star.json` — geometric pencil star
- `flower.json` — soft brush flower with reflect on
- `rosette.json` — layered marker + airbrush
