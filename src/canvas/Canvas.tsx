import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useStore } from '../state/store';
import { setupHiDPI, pointerToCanvas } from './coordinates';
import { rerender } from '../commands/history';
import { createTool } from '../tools';
import type { Tool, ToolContext } from '../tools/types';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const setCanvasSize = useStore((s) => s.setCanvasSize);

  // Match the canvas to the available container size on mount and on resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(64, Math.floor(rect.width));
      const h = Math.max(64, Math.floor(rect.height));
      setCanvasSize(w, h);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setCanvasSize]);

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

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerDown(point, tctx);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerMove(point, tctx);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx || !previewRef.current) return;
    const point = pointerToCanvas(e, previewRef.current);
    tool.onPointerUp(point, tctx);
  }

  function handlePointerCancel() {
    const tool = toolRef.current;
    const tctx = getToolContext();
    if (!tool || !tctx) return;
    tool.onPointerCancel?.(tctx);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full shadow-lg ring-1 ring-zinc-300 dark:ring-zinc-700"
      style={{ background }}
    >
      <canvas
        ref={committedRef}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      <canvas
        ref={previewRef}
        className="absolute inset-0"
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}
