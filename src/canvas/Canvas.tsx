import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { MIN_ZOOM, MAX_ZOOM, useStore } from '../state/store';
import { setupHiDPI, pointerToCanvas } from './coordinates';
import { computeFit } from './viewport';
import { rerender } from '../commands/history';
import { createTool } from '../tools';
import type { Tool, ToolContext } from '../tools/types';

type Props = {
  viewportRef: RefObject<HTMLDivElement | null>;
};

export function Canvas({ viewportRef }: Props) {
  const committedRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const toolRef = useRef<Tool | null>(null);

  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const activeTool = useStore((s) => s.activeTool);
  const foreground = useStore((s) => s.foreground);
  const background = useStore((s) => s.background);
  const brushSize = useStore((s) => s.brushSize);
  const symmetry = useStore((s) => s.symmetry);
  const commands = useStore((s) => s.commands);
  const pushCommand = useStore((s) => s.pushCommand);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const setView = useStore((s) => s.setView);
  const setPan = useStore((s) => s.setPan);

  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const panStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const didFitRef = useRef(false);

  useEffect(() => {
    if (committedRef.current) setupHiDPI(committedRef.current, width, height);
    if (previewRef.current) setupHiDPI(previewRef.current, width, height);
  }, [width, height]);

  useEffect(() => {
    toolRef.current = createTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    const ctx = committedRef.current?.getContext('2d');
    if (!ctx) return;
    rerender(ctx, commands, background);
  }, [commands, background, width, height]);

  // Auto fit-to-screen on first measurable layout.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || didFitRef.current) return;
    const tryFit = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const fit = computeFit(rect.width, rect.height, width, height);
      setView(fit.zoom, fit.panX, fit.panY);
      didFitRef.current = true;
      return true;
    };
    if (tryFit()) return;
    const ro = new ResizeObserver(() => {
      if (tryFit()) ro.disconnect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, setView, viewportRef]);

  // Track Space key for pan mode.
  useEffect(() => {
    function isEditable(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
      );
    }
    function onDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !isEditable(e.target)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.code === 'Space') setSpaceHeld(false);
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Wheel: pan by default, zoom around cursor when modifier is held.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      const state = useStore.getState();
      const rect = el!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.0015);
        const nextZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, state.zoom * factor),
        );
        const ratio = nextZoom / state.zoom;
        const nextPanX = mx - (mx - state.panX) * ratio;
        const nextPanY = my - (my - state.panY) * ratio;
        state.setView(nextZoom, nextPanX, nextPanY);
      } else {
        e.preventDefault();
        state.setPan(state.panX - e.deltaX, state.panY - e.deltaY);
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef]);

  function getToolContext(): ToolContext | null {
    const previewCtx = previewRef.current?.getContext('2d');
    if (!previewCtx) return null;
    return {
      canvasWidth: width,
      canvasHeight: height,
      foreground,
      background,
      brushSize,
      symmetry,
      previewCtx,
      commit: pushCommand,
      clearPreview: () => {
        previewCtx.save();
        previewCtx.setTransform(1, 0, 0, 1, 0, 0);
        previewCtx.clearRect(
          0,
          0,
          previewCtx.canvas.width,
          previewCtx.canvas.height,
        );
        previewCtx.restore();
      },
    };
  }

  function isPanGesture(e: ReactPointerEvent<HTMLCanvasElement>) {
    return e.button === 1 || spaceHeld;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (isPanGesture(e)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      panStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panX,
        startPanY: panY,
      };
      setPanning(true);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerDown(point, tctx);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const pan = panStateRef.current;
    if (pan && pan.pointerId === e.pointerId) {
      setPan(
        pan.startPanX + (e.clientX - pan.startX),
        pan.startPanY + (e.clientY - pan.startY),
      );
      return;
    }
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerMove(point, tctx);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    const pan = panStateRef.current;
    if (pan && pan.pointerId === e.pointerId) {
      panStateRef.current = null;
      setPanning(false);
      return;
    }
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerUp(point, tctx);
  }

  function handlePointerCancel() {
    if (panStateRef.current) {
      panStateRef.current = null;
      setPanning(false);
      return;
    }
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx) return;
    tool.onPointerCancel?.(tctx);
  }

  const cursor = panning
    ? 'grabbing'
    : spaceHeld
      ? 'grab'
      : 'crosshair';

  return (
    <div
      className="absolute top-0 left-0 origin-top-left will-change-transform"
      style={{
        width,
        height,
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        background,
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      }}
    >
      <canvas
        ref={committedRef}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      <canvas
        ref={previewRef}
        className="absolute inset-0"
        style={{ touchAction: 'none', cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}

