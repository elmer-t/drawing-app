import { MAX_ZOOM, MIN_ZOOM } from '../state/store';

export function computeFit(
  viewW: number,
  viewH: number,
  canvasW: number,
  canvasH: number,
  margin = 0.92,
): { zoom: number; panX: number; panY: number } {
  const scale = Math.min(viewW / canvasW, viewH / canvasH) * margin;
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
  return {
    zoom: z,
    panX: (viewW - canvasW * z) / 2,
    panY: (viewH - canvasH * z) / 2,
  };
}

export function computeCenter(
  viewW: number,
  viewH: number,
  canvasW: number,
  canvasH: number,
  zoom = 1,
): { panX: number; panY: number } {
  return {
    panX: (viewW - canvasW * zoom) / 2,
    panY: (viewH - canvasH * zoom) / 2,
  };
}
