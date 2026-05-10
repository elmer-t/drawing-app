import type { Command, Point, StrokeKind, StrokeStyle } from './types';
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
