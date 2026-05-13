import type { Tool } from './types';

export function createEyedropperTool(): Tool {
  return {
    name: 'eyedropper',
    cursor: 'crosshair',

    onPointerDown(p, ctx) {
      const hex = ctx.getColorAt(p);
      if (!hex) return;
      ctx.setForeground(hex);
      ctx.addRecentColor(hex);
      ctx.setActiveTool('pencil');
    },

    onPointerMove() {},
    onPointerUp() {},
  };
}
