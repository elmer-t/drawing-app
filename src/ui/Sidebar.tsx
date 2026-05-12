import type { ComponentType, SVGProps } from 'react';
import { useStore } from '../state/store';
import { TOOL_LIST } from '../tools';
import type { ToolName } from '../tools/types';
import {
  AirbrushIcon,
  BrushIcon,
  BucketIcon,
  EraserIcon,
  MarkerIcon,
  PencilIcon,
} from './Icons';

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const TOOL_ICON: Record<ToolName, IconCmp> = {
  pencil: PencilIcon,
  brush: BrushIcon,
  marker: MarkerIcon,
  airbrush: AirbrushIcon,
  eraser: EraserIcon,
  bucket: BucketIcon,
};

export function Sidebar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);

  return (
    <aside
      role="toolbar"
      aria-label="Drawing tools"
      aria-orientation="vertical"
      className="shrink-0 w-12 flex flex-col items-center gap-1 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-r border-zinc-200 dark:border-zinc-800"
    >
      {TOOL_LIST.map((tool) => {
        const Icon = TOOL_ICON[tool.name];
        const active = tool.name === activeTool;
        return (
          <button
            key={tool.name}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={tool.label}
            title={tool.label}
            onClick={() => setActiveTool(tool.name)}
            className={`grid place-items-center h-9 w-9 rounded transition ${
              active
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </aside>
  );
}
