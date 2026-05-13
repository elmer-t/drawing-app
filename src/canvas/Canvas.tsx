import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { MIN_ZOOM, MAX_ZOOM, useStore } from '../state/store';
import { setupHiDPI, pointerToCanvas } from './coordinates';
import { computeFit } from './viewport';
import { rerender } from '../commands/history';
import { createTool } from '../tools';
import type { Tool, ToolContext } from '../tools/types';
import { SymmetryOverlay } from '../ui/SymmetryOverlay';

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
  const centerPlacementActive = useStore((s) => s.centerPlacementActive);
  const setSymmetryCenter = useStore((s) => s.setSymmetryCenter);
  const setCenterPlacementActive = useStore((s) => s.setCenterPlacementActive);
  const setPointer = useStore((s) => s.setPointer);
  const setForeground = useStore((s) => s.setForeground);
  const addRecentColor = useStore((s) => s.addRecentColor);
  const setActiveTool = useStore((s) => s.setActiveTool);

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

  // Space-to-pan modifier.
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

  // Reads a pixel from the committed layer at canvas-space coordinates.
  // Eyedropper uses this; pixel coords need to be scaled by DPR.
  function getColorAt(p: { x: number; y: number }): string | null {
    const c = committedRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const t = ctx.getTransform();
    const dpr = t.a || 1;
    const px = Math.max(0, Math.min(c.width - 1, Math.round(p.x * dpr)));
    const py = Math.max(0, Math.min(c.height - 1, Math.round(p.y * dpr)));
    const data = ctx.getImageData(px, py, 1, 1).data;
    const [r, g, b, a] = [data[0], data[1], data[2], data[3]];
    if (a === 0) return background;
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

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
      getColorAt,
      setForeground,
      addRecentColor,
      setActiveTool,
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
    // Only the primary (left) mouse button draws — otherwise right-click
    // would leave a dot before the OS context menu shows.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (centerPlacementActive && previewRef.current) {
      const point = pointerToCanvas(e, previewRef.current);
      setSymmetryCenter(point.x, point.y);
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
    if (previewRef.current) {
      setPointer(pointerToCanvas(e, previewRef.current));
    }
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

  function handlePointerLeave() {
    setPointer(null);
  }

  // Save PNG: TopBar fires the event; we snapshot the committed canvas.
  useEffect(() => {
    function onSave() {
      const committed = committedRef.current;
      if (!committed) return;
      const url = committed.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `symmetrox-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.addEventListener('symmetrox:save-png', onSave);
    return () => window.removeEventListener('symmetrox:save-png', onSave);
  }, []);

  // Escape cancels center placement.
  useEffect(() => {
    if (!centerPlacementActive) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCenterPlacementActive(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [centerPlacementActive, setCenterPlacementActive]);

  const cursor = panning
    ? 'grabbing'
    : spaceHeld
      ? 'grab'
      : 'crosshair';

  return (
    <div
      className="canvas-stage"
      style={{
        width,
        height,
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: 'top left',
        background,
        willChange: 'transform',
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
        onPointerLeave={handlePointerLeave}
      />
      <SymmetryOverlay
        symmetry={symmetry}
        canvasWidth={width}
        canvasHeight={height}
      />
    </div>
  );
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}
