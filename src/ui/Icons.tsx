import type { ReactNode, SVGProps } from 'react';

/**
 * Custom icon set transcribed from the design handoff bundle.
 * All icons share a 24x24 viewBox, currentColor stroke, 1.6 stroke width,
 * and round caps/joins for a slightly hand-tuned, chunky look.
 */

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({
  size = 18,
  children,
  strokeWidth = 1.6,
  viewBox = '0 0 24 24',
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---------- Left rail tools ------------------------------------------------ */

export function PencilIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20l3-.6L19.4 7l-2.4-2.4L4.6 17 4 20z" />
      <path d="M15.5 6.5l2 2" />
      <path d="M6.5 17.5l1.5 1.5" />
    </Svg>
  );
}

export function BrushIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 4.5l5.5 5.5L11 18.5c-1.5 1.5-4 1.5-5.5 0s-1.5-4 0-5.5L14 4.5z" />
      <path d="M3.5 20.5c1-.5 2-.5 3 0" />
    </Svg>
  );
}

export function MarkerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3.5h6l1.5 4.5v3H7.5v-3L9 3.5z" />
      <path d="M9.5 11v6.5l2.5 3 2.5-3V11" />
      <path d="M7.5 11h9" />
    </Svg>
  );
}

export function SprayIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 7.5h6v9h-6z" />
      <path d="M10 10h6" />
      <path d="M12 4.5h2" />
      <circle cx="5" cy="6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="4" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="15" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="3" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Kept as an alias of SprayIcon so existing imports still resolve. */
export const AirbrushIcon = SprayIcon;

export function EraserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 4.5l5.5 5.5-8.5 8.5h-5L3 15.5 14 4.5z" />
      <path d="M9 9.5l5.5 5.5" />
    </Svg>
  );
}

export function EyedropIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 3.5l6.5 6.5-2.5 2.5-2-2L8 19l-3.5.5L5 16l8-8-2-2L14 3.5z" />
    </Svg>
  );
}

export function FillIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 11.5L11.5 4l8 8-7.5 7.5c-.8.8-2.2.8-3 0L4 14.5c-.8-.8-.8-2.2 0-3z" />
      <path d="M4 11.5h15" />
      <path
        d="M20 17c-.7 1.5-1.5 2.5-1.5 3.5 0 1 .7 1.5 1.5 1.5s1.5-.5 1.5-1.5c0-1-.8-2-1.5-3.5z"
        fill="currentColor"
      />
    </Svg>
  );
}

/** Alias for the previous BucketIcon name used elsewhere. */
export const BucketIcon = FillIcon;

export function TargetIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Top bar -------------------------------------------------------- */

export function UndoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 9h11a5 5 0 010 10H8" />
      <path d="M8 5L4 9l4 4" />
    </Svg>
  );
}

export function RedoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 9H9a5 5 0 000 10h7" />
      <path d="M16 5l4 4-4 4" />
    </Svg>
  );
}

export function NewIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M12 11v6M9 14h6" />
    </Svg>
  );
}

export function ImportIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v12" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 17v3h16v-3" />
    </Svg>
  );
}

export function ExportIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 17V5" />
      <path d="M8 9l4-4 4 4" />
      <path d="M4 17v3h16v-3" />
    </Svg>
  );
}

export function SavePngIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v7" />
      <path d="M8.5 12l3.5 3.5L15.5 12" />
    </Svg>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 7h14" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

/* ---------- Theme ---------------------------------------------------------- */

export function SunIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </Svg>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" />
    </Svg>
  );
}

export function MonitorIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
    </Svg>
  );
}

/** Alias kept for the prior `SystemIcon` export name. */
export const SystemIcon = MonitorIcon;

/* ---------- Symmetry mode glyphs ------------------------------------------ */

export function SymOffIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function SymCyclicIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4l1.7 4.5M20 12l-4.5 1.7M12 20l-1.7-4.5M4 12l4.5-1.7" />
      <path d="M17.7 6.3l-3.2 3.2M17.7 17.7l-3.2-3.2M6.3 17.7l3.2-3.2M6.3 6.3l3.2 3.2" />
    </Svg>
  );
}

export function SymMirrorIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v18" strokeDasharray="2 2" />
      <path d="M5 8l5 4-5 4z" fill="currentColor" />
      <path d="M19 8l-5 4 5 4z" fill="currentColor" fillOpacity="0.3" />
    </Svg>
  );
}

export function SymTileIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </Svg>
  );
}

/* ---------- View / zoom ---------------------------------------------------- */

export function ZoomInIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5M11 8v6M8 11h6" />
    </Svg>
  );
}

export function ZoomOutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5M8 11h6" />
    </Svg>
  );
}

export function FitIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </Svg>
  );
}

export function HundredIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        1:1
      </text>
    </Svg>
  );
}

/** Alias for the prior `ActualSizeIcon` name. */
export const ActualSizeIcon = HundredIcon;

/* ---------- Misc ----------------------------------------------------------- */

export function SwapIcon(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={1.8}>
      <path d="M7 4L4 7l3 3" />
      <path d="M4 7h11a3 3 0 013 3v1" />
      <path d="M17 20l3-3-3-3" />
      <path d="M20 17H9a3 3 0 01-3-3v-1" />
    </Svg>
  );
}

export function BrandMark(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3l3 5.5 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-7L3 9.5l6-1L12 3z" />
      <path d="M12 3v18" strokeDasharray="2 2" opacity="0.5" />
    </Svg>
  );
}
