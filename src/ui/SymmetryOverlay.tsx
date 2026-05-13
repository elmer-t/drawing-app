import type { SymmetryConfig } from '../commands/types';

type Props = {
  symmetry: SymmetryConfig;
  canvasWidth: number;
  canvasHeight: number;
};

/**
 * Non-interactive SVG overlay drawn on top of the canvas in the active
 * accent color. Sizes are in canvas-space; the parent transform handles
 * pan + zoom. Shows:
 *  - cyclic: N rays from center
 *  - mirror: N full mirror axes
 *  - tile: grid lines at tileW / tileH spacing across the canvas
 *  - all: a ring + dot at the symmetry center with a small crosshair
 */
export function SymmetryOverlay({ symmetry, canvasWidth, canvasHeight }: Props) {
  const { mode, slices, centerX, centerY, tileW, tileH } = symmetry;
  if (mode === 'off') return null;

  return (
    <svg
      className="sym-overlay"
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      aria-hidden
    >
      {mode === 'cyclic' ? <CyclicRays cx={centerX} cy={centerY} n={slices} /> : null}
      {mode === 'mirror' ? <MirrorAxes cx={centerX} cy={centerY} n={slices} /> : null}
      {mode === 'tile' ? (
        <TileGrid w={canvasWidth} h={canvasHeight} tw={tileW} th={tileH} />
      ) : null}
      <CenterCrosshair cx={centerX} cy={centerY} />
    </svg>
  );
}

function CyclicRays({ cx, cy, n }: { cx: number; cy: number; n: number }) {
  const len = 60;
  const rays = [];
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    const x2 = cx + Math.cos(a) * len;
    const y2 = cy + Math.sin(a) * len;
    rays.push(<line key={i} x1={cx} y1={cy} x2={x2} y2={y2} className="sym-axis" />);
  }
  return <>{rays}</>;
}

function MirrorAxes({ cx, cy, n }: { cx: number; cy: number; n: number }) {
  const half = 80;
  const lines = [];
  // For mirror, the N "axes" each cover a slice — show full axis lines
  // through the center, spaced evenly over 180 degrees.
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const dx = Math.cos(a) * half;
    const dy = Math.sin(a) * half;
    lines.push(
      <line
        key={i}
        x1={cx - dx}
        y1={cy - dy}
        x2={cx + dx}
        y2={cy + dy}
        className="sym-axis"
      />,
    );
  }
  return <>{lines}</>;
}

function TileGrid({ w, h, tw, th }: { w: number; h: number; tw: number; th: number }) {
  if (tw <= 0 || th <= 0) return null;
  const verticals = [];
  for (let x = tw; x < w; x += tw) {
    verticals.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} className="sym-grid" />);
  }
  const horizontals = [];
  for (let y = th; y < h; y += th) {
    horizontals.push(<line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} className="sym-grid" />);
  }
  return (
    <>
      {verticals}
      {horizontals}
    </>
  );
}

function CenterCrosshair({ cx, cy }: { cx: number; cy: number }) {
  const r = 9;
  const t = 9;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="sym-ring" />
      <circle cx={cx} cy={cy} r={2} className="sym-dot" />
      <line x1={cx - r - t} y1={cy} x2={cx - r - 2} y2={cy} className="sym-cross" />
      <line x1={cx + r + 2} y1={cy} x2={cx + r + t} y2={cy} className="sym-cross" />
      <line x1={cx} y1={cy - r - t} x2={cx} y2={cy - r - 2} className="sym-cross" />
      <line x1={cx} y1={cy + r + 2} x2={cx} y2={cy + r + t} className="sym-cross" />
    </g>
  );
}
