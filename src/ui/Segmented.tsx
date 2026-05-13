import type { ComponentType, SVGProps } from 'react';

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export type SegmentedOption<V extends string> = {
  value: V;
  label: string;
  /** Short label shown in the button when iconOnly is false (e.g. "OFF", "CYC"). */
  short?: string;
  icon?: IconCmp;
};

type Props<V extends string> = {
  value: V;
  options: SegmentedOption<V>[];
  onChange: (v: V) => void;
  size?: 'md' | 'sm';
  iconOnly?: boolean;
  ariaLabel?: string;
};

export function Segmented<V extends string>({
  value,
  options,
  onChange,
  size = 'md',
  iconOnly = false,
  ariaLabel,
}: Props<V>) {
  const cls = [
    'seg',
    `seg-${size}`,
    iconOnly ? 'seg-icononly' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => onChange(opt.value)}
            className={`seg-btn ${active ? 'is-on' : ''}`}
          >
            {Icon ? <Icon size={iconOnly ? 14 : 13} /> : null}
            {!iconOnly && (opt.short ?? opt.label)}
          </button>
        );
      })}
    </div>
  );
}
