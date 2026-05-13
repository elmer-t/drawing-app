import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const PALETTE: readonly string[] = [
  // Row 1 — base grays
  '#0a0a0a', '#3a3a3a', '#6a6a6a', '#a8a8a8', '#dcdcdc', '#ffffff',
  // Row 2 — warm
  '#7a1f1f', '#c0392b', '#e74c3c', '#f39c12', '#f1c40f', '#fff2a8',
  // Row 3 — cool
  '#0e3a5e', '#1e6bb8', '#2ecc71', '#27ae60', '#16a085', '#1abc9c',
  // Row 4 — accent
  '#4a148c', '#7b1fa2', '#c2185b', '#e91e63', '#ff5e9c', '#ff8fb8',
];

type Anchor = 'down' | 'right';

type Props = {
  title: string;
  value: string;
  recent: string[];
  /** Render-prop trigger; receives a click handler and the popover ref to attach. */
  children: (api: {
    toggle: () => void;
    isOpen: boolean;
    triggerRef: (el: HTMLElement | null) => void;
  }) => ReactNode;
  anchor?: Anchor;
  /** Optional extra class on the wrapping `.chip-wrap` div (for layout placement). */
  wrapClassName?: string;
  onChange: (hex: string) => void;
};

/**
 * Color chip popover with the curated palette, optional recent colors,
 * and a hex input. The trigger element is rendered by the consumer via
 * a render prop so the popover can sit next to any custom chip layout
 * (rail color pot, topbar swatches, etc.).
 */
export function ColorPopover({
  title,
  value,
  recent,
  onChange,
  anchor = 'down',
  wrapClassName,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value.replace(/^#/, ''));
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setHex(value.replace(/^#/, ''));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function commitHex(raw: string) {
    const h = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(h)) {
      onChange(h.toLowerCase());
    }
  }

  function pick(c: string) {
    onChange(c);
  }

  const lower = value.toLowerCase();

  return (
    <div
      className={wrapClassName ? `chip-wrap ${wrapClassName}` : 'chip-wrap'}
      ref={wrapRef}
    >
      {children({
        toggle: () => setOpen((v) => !v),
        isOpen: open,
        triggerRef: (el) => {
          triggerRef.current = el;
        },
      })}
      {open ? (
        <div className={`chip-pop chip-pop-${anchor}`} role="dialog" aria-label={title}>
          <div className="chip-pop-title">{title}</div>
          <div className="chip-grid">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip-swatch ${c.toLowerCase() === lower ? 'is-on' : ''}`}
                style={{ background: c }}
                onClick={() => pick(c)}
                title={c.toUpperCase()}
                aria-label={c}
              />
            ))}
          </div>
          {recent.length > 0 ? (
            <>
              <div className="chip-pop-sub">RECENT</div>
              <div className="chip-grid chip-grid-recent">
                {recent.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    className={`chip-swatch ${c.toLowerCase() === lower ? 'is-on' : ''}`}
                    style={{ background: c }}
                    onClick={() => pick(c)}
                    title={c.toUpperCase()}
                    aria-label={c}
                  />
                ))}
              </div>
            </>
          ) : null}
          <div className="chip-pop-sub">HEX</div>
          <div className="hex-row">
            <span className="hex-prefix">#</span>
            <input
              className="hex-input"
              value={hex}
              maxLength={6}
              spellCheck={false}
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => commitHex(hex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitHex(hex);
                }
              }}
              aria-label="Hex color"
            />
            <span
              className="hex-preview"
              style={{ background: `#${hex}` }}
              aria-hidden
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
