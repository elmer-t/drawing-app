import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point } from '../commands/types';

/**
 * Converts a pointer event to canvas-space (logical pixel) coordinates.
 * Coordinates returned are in the same space as draw operations after
 * setupHiDPI applies its dpr scale to the context.
 */
export function pointerToCanvas(
  e: PointerEvent | ReactPointerEvent,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();
  const logicalWidth = parseFloat(canvas.style.width) || rect.width;
  const logicalHeight = parseFloat(canvas.style.height) || rect.height;
  const scaleX = logicalWidth / rect.width;
  const scaleY = logicalHeight / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

/**
 * Sets canvas internal size to logicalSize * devicePixelRatio, applies
 * matching CSS size, and scales the context. Call once on mount and on resize.
 * Returns the canvas's logical width/height.
 */
export function setupHiDPI(
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number,
): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return { width: logicalWidth, height: logicalHeight };
}
