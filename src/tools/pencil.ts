import type { Tool, ToolContext } from './types';
import type { Point } from '../commands/types';
import { withSymmetry } from '../symmetry/withSymmetry';

export function createPencilTool(): Tool {
  let points: Point[] = [];
  let active = false;

  function renderPreview(ctx: ToolContext) {
    ctx.clearPreview();
    if (points.length === 0) return;
    withSymmetry(ctx.previewCtx, ctx.symmetry, (c) => {
      c.strokeStyle = ctx.foreground;
      c.lineWidth = ctx.brushSize;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      points.forEach((p, i) =>
        i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y),
      );
      c.stroke();
    });
  }

  return {
    name: 'pencil',
    cursor: 'crosshair',

    onPointerDown(p, ctx) {
      points = [p];
      active = true;
      renderPreview(ctx);
    },

    onPointerMove(p, ctx) {
      if (!active) return;
      points.push(p);
      renderPreview(ctx);
    },

    onPointerUp(_p, ctx) {
      if (!active) return;
      active = false;
      if (points.length > 0) {
        ctx.commit({
          type: 'pencil',
          points: [...points],
          style: { color: ctx.foreground, width: ctx.brushSize },
          symmetry: ctx.symmetry,
        });
      }
      points = [];
      ctx.clearPreview();
    },

    onPointerCancel(ctx) {
      active = false;
      points = [];
      ctx.clearPreview();
    },
  };
}
