import type { ComponentType, SVGProps } from 'react';
import { useStore } from '../state/store';
import { TOOL_LIST } from '../tools';
import type { ToolName } from '../tools/types';
import { ColorPopover } from './ColorPopover';
import {
  BrushIcon,
  EraserIcon,
  EyedropIcon,
  FillIcon,
  MarkerIcon,
  PencilIcon,
  SprayIcon,
  SwapIcon,
} from './Icons';

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const TOOL_ICON: Record<ToolName, IconCmp> = {
  pencil: PencilIcon,
  brush: BrushIcon,
  marker: MarkerIcon,
  airbrush: SprayIcon,
  eraser: EraserIcon,
  eyedropper: EyedropIcon,
  bucket: FillIcon,
};

export function LeftRail() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);

  const foreground = useStore((s) => s.foreground);
  const background = useStore((s) => s.background);
  const setForeground = useStore((s) => s.setForeground);
  const setBackground = useStore((s) => s.setBackground);
  const swapColors = useStore((s) => s.swapColors);
  const recentColors = useStore((s) => s.recentColors);
  const addRecentColor = useStore((s) => s.addRecentColor);

  return (
    <aside className="leftrail" aria-label="Tools and colors">
      <div className="rail-tools" role="toolbar" aria-orientation="vertical">
        {TOOL_LIST.map((t) => {
          const Icon = TOOL_ICON[t.name];
          const active = activeTool === t.name;
          return (
            <button
              key={t.name}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={t.label}
              title={`${t.label} (${t.key})`}
              onClick={() => setActiveTool(t.name)}
              className={`rail-btn ${active ? 'is-active' : ''}`}
            >
              <Icon size={20} />
              <span className="rail-key">{t.key}</span>
            </button>
          );
        })}
      </div>

      <div className="rail-divider" aria-hidden />

      <div className="rail-colors" aria-label="Colors">
        <div className="color-pot">
          <ColorPopover
            title="Stroke color"
            value={foreground}
            recent={recentColors}
            anchor="right"
            wrapClassName="color-pot-chip is-fg"
            onChange={(c) => {
              setForeground(c);
              addRecentColor(c);
            }}
          >
            {({ toggle }) => (
              <button
                type="button"
                className="chip"
                onClick={toggle}
                aria-label={`Stroke color: ${foreground}`}
                title={`Stroke — ${foreground.toUpperCase()}`}
              >
                <span className="chip-sw" style={{ background: foreground }} />
              </button>
            )}
          </ColorPopover>
          <ColorPopover
            title="Paper color"
            value={background}
            recent={recentColors}
            anchor="right"
            wrapClassName="color-pot-chip is-bg"
            onChange={(c) => {
              setBackground(c);
              addRecentColor(c);
            }}
          >
            {({ toggle }) => (
              <button
                type="button"
                className="chip"
                onClick={toggle}
                aria-label={`Paper color: ${background}`}
                title={`Paper — ${background.toUpperCase()}`}
              >
                <span className="chip-sw" style={{ background }} />
              </button>
            )}
          </ColorPopover>
          <button
            type="button"
            className="rail-swap"
            onClick={swapColors}
            title="Swap colors (X)"
            aria-label="Swap stroke and paper colors"
          >
            <SwapIcon size={13} />
          </button>
        </div>
        <div className="rail-label">COLOR</div>
      </div>
    </aside>
  );
}
