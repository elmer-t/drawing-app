import { useEffect, useRef, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { useStore } from '../state/store';
import { TOOL_LIST } from '../tools';
import type { ToolName } from '../tools/types';
import {
  AirbrushIcon,
  BrushIcon,
  CheckIcon,
  ChevronDownIcon,
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
};

export function ToolMenu() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const ActiveIcon = TOOL_ICON[activeTool];
  const activeLabel =
    TOOL_LIST.find((t) => t.name === activeTool)?.label ?? activeTool;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
      >
        <ActiveIcon size={16} />
        <span>{activeLabel}</span>
        <ChevronDownIcon size={14} className="opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 z-20 w-44 rounded-md border border-zinc-200 bg-white shadow-lg dark:bg-zinc-900 dark:border-zinc-700 py-1"
        >
          {TOOL_LIST.map((tool) => {
            const Icon = TOOL_ICON[tool.name];
            const active = tool.name === activeTool;
            return (
              <button
                key={tool.name}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setActiveTool(tool.name);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{tool.label}</span>
                {active && <CheckIcon size={14} className="opacity-80" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
