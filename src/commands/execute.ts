import type { Command, Point, StrokeKind, StrokeStyle, SymmetryConfig } from './types';
import { withSymmetry } from '../symmetry/withSymmetry';

export function executeCommand(
  ctx: CanvasRenderingContext2D,
  cmd: Command,
): void {
  switch (cmd.type) {
    case 'stroke': {
      withSymmetry(ctx, cmd.symmetry, (c) => {
        drawStroke(c, cmd.kind, cmd.points, cmd.style);
      });
      break;
    }
    case 'airbrush': {
      withSymmetry(ctx, cmd.symmetry, (c) => {
        drawAirbrush(c, cmd.dots, cmd.style);
      });
      break;
    }
    case 'fill': {
      fillRegion(ctx, cmd.point, cmd.color, cmd.tolerance, cmd.symmetry);
      break;
    }
    case 'clear': {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
      break;
    }
  }
}

export function drawStroke(
  c: CanvasRenderingContext2D,
  kind: StrokeKind,
  points: Point[],
  style: StrokeStyle,
): void {
  if (points.length === 0) return;

  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = style.color;
  c.lineWidth = style.width;

  switch (kind) {
    case 'pencil':
      c.globalAlpha = style.opacity ?? 1;
      tracePolyline(c, points);
      c.stroke();
      break;

    case 'marker':
      c.globalAlpha = style.opacity ?? 0.5;
      traceSmooth(c, points);
      c.stroke();
      break;

    case 'brush':
      drawBrushStamps(c, points, style);
      break;

    case 'eraser':
      // Eraser is committed as a stroke painted with the captured background
      // color. This keeps the command list deterministic and makes eraser
      // strokes survive a re-render without special compositing.
      c.globalAlpha = 1;
      tracePolyline(c, points);
      c.stroke();
      break;
  }

  c.restore();
}

function tracePolyline(c: CanvasRenderingContext2D, points: Point[]): void {
  c.beginPath();
  if (points.length === 1) {
    const p = points[0];
    c.arc(p.x, p.y, 0.01, 0, Math.PI * 2);
    return;
  }
  points.forEach((p, i) =>
    i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y),
  );
}

function traceSmooth(c: CanvasRenderingContext2D, points: Point[]): void {
  c.beginPath();
  if (points.length < 3) {
    tracePolyline(c, points);
    return;
  }
  c.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    c.quadraticCurveTo(a.x, a.y, mx, my);
  }
  const last = points[points.length - 1];
  c.lineTo(last.x, last.y);
}

function drawBrushStamps(
  c: CanvasRenderingContext2D,
  points: Point[],
  style: StrokeStyle,
): void {
  const radius = Math.max(style.width / 2, 1);
  const spacing = Math.max(radius * 0.25, 1);
  const opacity = style.opacity ?? 0.35;

  const stamp = (x: number, y: number) => {
    const grad = c.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, withAlpha(style.color, opacity));
    grad.addColorStop(0.6, withAlpha(style.color, opacity * 0.6));
    grad.addColorStop(1, withAlpha(style.color, 0));
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
  };

  if (points.length === 1) {
    stamp(points[0].x, points[0].y);
    return;
  }

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      stamp(a.x + dx * t, a.y + dy * t);
    }
  }
}

function drawAirbrush(
  c: CanvasRenderingContext2D,
  dots: Point[],
  style: StrokeStyle,
): void {
  const radius = Math.max(style.width / 8, 0.5);
  c.save();
  c.fillStyle = withAlpha(style.color, style.opacity ?? 0.15);
  for (const d of dots) {
    c.beginPath();
    c.arc(d.x, d.y, radius, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function fillRegion(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string,
  tolerance: number,
  symmetry: SymmetryConfig,
): void {
  const transform = ctx.getTransform();
  const scale = transform.a || 1;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  if (w === 0 || h === 0) return;

  const target = parseColor(ctx, color);
  if (!target) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  for (const seed of symmetricPoints(point, symmetry)) {
    const sx = Math.round(seed.x * scale);
    const sy = Math.round(seed.y * scale);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
    scanlineFill(image, sx, sy, target, tolerance);
  }
  ctx.putImageData(image, 0, 0);
  ctx.restore();
}

function symmetricPoints(p: Point, sym: SymmetryConfig): Point[] {
  const { slices, reflect, centerX, centerY } = sym;
  const out: Point[] = [];
  const dx = p.x - centerX;
  const dy = p.y - centerY;
  for (let i = 0; i < slices; i++) {
    const a = (i * 2 * Math.PI) / slices;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    out.push({
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    });
    if (reflect) {
      // Rotate by `a`, then mirror across the local X axis (the seam axis).
      out.push({
        x: centerX + (-dx) * cos - dy * sin,
        y: centerY + (-dx) * sin + dy * cos,
      });
    }
  }
  return out;
}

type RGBA = [number, number, number, number];

function scanlineFill(
  image: ImageData,
  startX: number,
  startY: number,
  target: RGBA,
  tolerance: number,
): void {
  const { width: w, height: h, data } = image;
  const idx = (x: number, y: number) => (y * w + x) * 4;
  const startIdx = idx(startX, startY);
  const src: RGBA = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  if (
    src[0] === target[0] &&
    src[1] === target[1] &&
    src[2] === target[2] &&
    src[3] === target[3]
  ) {
    return;
  }

  const matches = (x: number, y: number) => {
    const i = idx(x, y);
    if (
      data[i] === target[0] &&
      data[i + 1] === target[1] &&
      data[i + 2] === target[2] &&
      data[i + 3] === target[3]
    ) {
      return false;
    }
    return (
      Math.abs(data[i] - src[0]) <= tolerance &&
      Math.abs(data[i + 1] - src[1]) <= tolerance &&
      Math.abs(data[i + 2] - src[2]) <= tolerance &&
      Math.abs(data[i + 3] - src[3]) <= tolerance
    );
  };

  const setPixel = (x: number, y: number) => {
    const i = idx(x, y);
    data[i] = target[0];
    data[i + 1] = target[1];
    data[i + 2] = target[2];
    data[i + 3] = target[3];
  };

  if (!matches(startX, startY)) return;

  const stack: number[] = [startX, startY];
  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    let lx = x;
    while (lx >= 0 && matches(lx, y)) lx--;
    lx++;
    let rx = x;
    while (rx < w && matches(rx, y)) rx++;
    rx--;
    let spanAbove = false;
    let spanBelow = false;
    for (let i = lx; i <= rx; i++) {
      setPixel(i, y);
      if (y > 0) {
        if (matches(i, y - 1)) {
          if (!spanAbove) {
            stack.push(i, y - 1);
            spanAbove = true;
          }
        } else {
          spanAbove = false;
        }
      }
      if (y < h - 1) {
        if (matches(i, y + 1)) {
          if (!spanBelow) {
            stack.push(i, y + 1);
            spanBelow = true;
          }
        } else {
          spanBelow = false;
        }
      }
    }
  }
}

function parseColor(
  ctx: CanvasRenderingContext2D,
  color: string,
): RGBA | null {
  const direct = parseColorString(color);
  if (direct) return direct;
  // Round-trip through the canvas to normalize named/hsl/etc CSS colors.
  // Both the DOM canvas and @napi-rs/canvas return either "#rrggbb" (alpha=1)
  // or "rgba(r, g, b, a)" from fillStyle.
  const prev = ctx.fillStyle;
  ctx.fillStyle = '#000000';
  ctx.fillStyle = color;
  const normalized = ctx.fillStyle;
  ctx.fillStyle = prev;
  if (typeof normalized !== 'string') return null;
  return parseColorString(normalized);
}

function parseColorString(raw: string): RGBA | null {
  const s = raw.trim().toLowerCase();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) : 255;
      if ([r, g, b, a].every((n) => Number.isFinite(n))) return [r, g, b, a];
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
      if ([r, g, b, a].every((n) => Number.isFinite(n))) return [r, g, b, a];
    }
    return null;
  }
  const m = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
  );
  if (m) {
    const r = clamp255(Number(m[1]));
    const g = clamp255(Number(m[2]));
    const b = clamp255(Number(m[3]));
    const a = m[4] !== undefined
      ? clamp255(Math.round(Number(m[4]) * 255))
      : 255;
    return [r, g, b, a];
  }
  return null;
}

function clamp255(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function withAlpha(color: string, alpha: number): string {
  // Accepts #rgb / #rrggbb. Falls back to the original color if unparseable.
  const a = Math.max(0, Math.min(1, alpha));
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const expand = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
    if (expand.length === 6) {
      const r = parseInt(expand.slice(0, 2), 16);
      const g = parseInt(expand.slice(2, 4), 16);
      const b = parseInt(expand.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  return color;
}
