import type { Tool } from './types';

const DEFAULT_TOLERANCE = 32;

export function createBucketTool(): Tool {
  return {
    name: 'bucket',
    cursor: 'crosshair',

    onPointerDown(p, ctx) {
      ctx.commit({
        type: 'fill',
        point: p,
        color: ctx.foreground,
        tolerance: DEFAULT_TOLERANCE,
        symmetry: ctx.symmetry,
      });
    },

    onPointerMove() {},
    onPointerUp() {},
  };
}
