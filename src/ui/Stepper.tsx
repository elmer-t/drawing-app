import type { ChangeEvent } from 'react';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Slider width in px (the inline-grid auto-sizes the value row independently). */
  sliderWidth?: number;
  onChange: (n: number) => void;
};

export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  sliderWidth = 96,
  onChange,
}: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const onSlider = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(e.target.value));

  return (
    <div className="stepper">
      <div className="stepper-label">{label}</div>
      <button
        type="button"
        className="stepper-mini"
        onClick={() => onChange(clamp(value - step))}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        −
      </button>
      <div className="stepper-val">
        <span>{value}</span>
        {suffix ? <span className="suf">{suffix}</span> : null}
      </div>
      <button
        type="button"
        className="stepper-mini"
        onClick={() => onChange(clamp(value + step))}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        +
      </button>
      <input
        type="range"
        className="stepper-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onSlider}
        style={{ width: sliderWidth }}
        aria-label={label}
      />
    </div>
  );
}
