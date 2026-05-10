import type { RefObject } from 'react';
import { computeCenter, computeFit } from '../canvas/viewport';
import { MAX_ZOOM, MIN_ZOOM, useStore } from '../state/store';
import {
  ActualSizeIcon,
  FitIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './Icons';

const ZOOM_STEP = 1.25;

type Props = {
  viewportRef: RefObject<HTMLDivElement | null>;
};

export function ZoomControls({ viewportRef }: Props) {
  const zoom = useStore((s) => s.zoom);
  const setView = useStore((s) => s.setView);

  function viewRect() {
    return viewportRef.current?.getBoundingClientRect();
  }

  function zoomBy(factor: number) {
    const rect = viewRect();
    const state = useStore.getState();
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoom * factor));
    if (!rect) {
      setView(next, state.panX, state.panY);
      return;
    }
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const ratio = next / state.zoom;
    setView(next, cx - (cx - state.panX) * ratio, cy - (cy - state.panY) * ratio);
  }

  function fit() {
    const rect = viewRect();
    if (!rect) return;
    const state = useStore.getState();
    const f = computeFit(rect.width, rect.height, state.width, state.height);
    setView(f.zoom, f.panX, f.panY);
  }

  function actualSize() {
    const rect = viewRect();
    const state = useStore.getState();
    if (!rect) {
      setView(1, state.panX, state.panY);
      return;
    }
    const c = computeCenter(rect.width, rect.height, state.width, state.height, 1);
    setView(1, c.panX, c.panY);
  }

  const pct = Math.round(zoom * 100);

  return (
    <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/95 px-1.5 py-1 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
      <IconBtn label="Zoom out" onClick={() => zoomBy(1 / ZOOM_STEP)}>
        <ZoomOutIcon size={16} />
      </IconBtn>
      <span className="tabular-nums text-xs px-2 min-w-[3.25rem] text-center text-zinc-600 dark:text-zinc-300 select-none">
        {pct}%
      </span>
      <IconBtn label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
        <ZoomInIcon size={16} />
      </IconBtn>
      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
      <IconBtn label="Zoom to fit" onClick={fit}>
        <FitIcon size={16} />
      </IconBtn>
      <IconBtn label="Actual size (1:1)" onClick={actualSize}>
        <ActualSizeIcon size={16} />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid place-items-center h-7 w-7 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition"
    >
      {children}
    </button>
  );
}
