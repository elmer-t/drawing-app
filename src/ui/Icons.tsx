import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12 5 5 9-11" />
    </Svg>
  );
}

export function PencilIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z" />
      <path d="m13.5 6.5 3 3" />
    </Svg>
  );
}

export function BrushIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.5 14.5 4 20l4 .5L13.5 15" />
      <path d="M21 3s-5 .5-9 4.5-4 7-4 7l3 3s3 0 7-4 4-9 4-9z" />
    </Svg>
  );
}

export function MarkerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14 3h6v6l-9 9-6-6 9-9z" />
      <path d="m7 16-4 4 4-1 1-3" />
    </Svg>
  );
}

export function AirbrushIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 8h7v8H9z" />
      <path d="M16 10h3v4h-3" />
      <path d="M9 9V6h3v3" />
      <circle cx="5" cy="9" r="0.6" fill="currentColor" />
      <circle cx="4" cy="13" r="0.6" fill="currentColor" />
      <circle cx="6" cy="14" r="0.6" fill="currentColor" />
    </Svg>
  );
}

export function BucketIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 11 12 4l7 7-7 7-7-7z" />
      <path d="M5 11h14" />
      <path d="M19 14c1.2 1.5 2 2.6 2 3.5a2 2 0 1 1-4 0c0-.9.8-2 2-3.5z" />
    </Svg>
  );
}

export function EraserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 3 3 16l5 5h6l8-8z" />
      <path d="M9 21h12" />
    </Svg>
  );
}

export function ZoomInIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="M11 8v6M8 11h6M20 20l-4.5-4.5" />
    </Svg>
  );
}

export function ZoomOutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="M8 11h6M20 20l-4.5-4.5" />
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

export function ActualSizeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h2v6M13 9h2v6M9 12h6" strokeWidth={1.4} />
    </Svg>
  );
}

export function SunIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
    </Svg>
  );
}

export function SystemIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}
