import type { RefObject } from 'react';
import { MAX_ZOOM, MIN_ZOOM, useStore } from '../state/store';
import { TOOL_LIST } from '../tools';
import { computeCenter, computeFit } from '../canvas/viewport';
import { FitIcon, HundredIcon, ZoomInIcon, ZoomOutIcon } from './Icons';

const ZOOM_STEP = 1.25;

type Props = {
  viewportRef: RefObject<HTMLDivElement | null>;
};

export function StatusBar({ viewportRef }: Props) {
  const tool = useStore((s) => s.activeTool);
  const brushSize = useStore((s) => s.brushSize);
  const symmetry = useStore((s) => s.symmetry);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const pointer = useStore((s) => s.pointer);
  const zoom = useStore((s) => s.zoom);
  const setView = useStore((s) => s.setView);

  const toolLabel = (
    TOOL_LIST.find((t) => t.name === tool)?.label ?? tool
  ).toUpperCase();

  const symLabel =
    symmetry.mode === 'off'
      ? 'OFF'
      : symmetry.mode === 'tile'
        ? `TILE · ${symmetry.tileW}px`
        : `${symmetry.mode.toUpperCase()} · ${symmetry.slices}`;

  const xy = pointer
    ? `${pad(pointer.x)}, ${pad(pointer.y)}`
    : `   −,    −`;

  function zoomBy(factor: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
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
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const state = useStore.getState();
    const f = computeFit(rect.width, rect.height, state.width, state.height);
    setView(f.zoom, f.panX, f.panY);
  }

  function actualSize() {
    const rect = viewportRef.current?.getBoundingClientRect();
    const state = useStore.getState();
    if (!rect) {
      setView(1, state.panX, state.panY);
      return;
    }
    const c = computeCenter(rect.width, rect.height, state.width, state.height, 1);
    setView(1, c.panX, c.panY);
  }

  return (
    <footer className="statusbar">
      <Block k="TOOL" v={toolLabel} />
      <Block k="SIZE" v={`${brushSize}px`} />
      <Block k="SYM" v={symLabel} />
      <Block k="CANVAS" v={`${width}×${height}`} />
      <Block k="XY" v={xy} />

      <div className="status-spacer" />

      <div className="zoom-row">
        <button
          type="button"
          className="tb tb-xs"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOutIcon size={14} />
        </button>
        <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="tb tb-xs"
          onClick={() => zoomBy(ZOOM_STEP)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomInIcon size={14} />
        </button>
        <button
          type="button"
          className="tb tb-xs"
          onClick={actualSize}
          title="Actual size (1:1)"
          aria-label="Actual size"
        >
          <HundredIcon size={14} />
        </button>
        <button
          type="button"
          className="tb tb-xs"
          onClick={fit}
          title="Fit to screen"
          aria-label="Fit to screen"
        >
          <FitIcon size={14} />
        </button>
      </div>
    </footer>
  );
}

function Block({ k, v }: { k: string; v: string }) {
  return (
    <div className="status-block">
      <span className="status-k">{k}</span>
      <span className="status-v">{v}</span>
    </div>
  );
}

function pad(n: number): string {
  return Math.round(n).toString().padStart(4, ' ');
}
