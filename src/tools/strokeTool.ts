import type { Tool, ToolContext } from './types';
import type { Point, StrokeKind } from '../commands/types';
import { withSymmetry } from '../symmetry/withSymmetry';
import { drawStroke } from '../commands/execute';

type StrokeToolOptions = {
  name: StrokeKind;
  cursor?: string;
  /** Resolves the stroke color from context (lets eraser use the background). */
  resolveColor?: (ctx: ToolContext) => string;
  /** Optional fixed opacity override. */
  opacity?: number;
};

export function createStrokeTool(opts: StrokeToolOptions): Tool {
  let points: Point[] = [];
  let active = false;

  function styleFor(ctx: ToolContext) {
    return {
      color: opts.resolveColor ? opts.resolveColor(ctx) : ctx.foreground,
      width: ctx.brushSize,
      opacity: opts.opacity,
    };
  }

  function renderPreview(ctx: ToolContext) {
    ctx.clearPreview();
    if (points.length === 0) return;
    withSymmetry(ctx.previewCtx, ctx.symmetry, (c) => {
      drawStroke(c, opts.name, points, styleFor(ctx));
    });
  }

  return {
    name: opts.name,
    cursor: opts.cursor ?? 'crosshair',

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
          type: 'stroke',
          kind: opts.name,
          points: [...points],
          style: styleFor(ctx),
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
