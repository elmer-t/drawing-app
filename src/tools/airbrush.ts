import type { Tool, ToolContext } from './types';
import type { Point } from '../commands/types';
import { withSymmetry } from '../symmetry/withSymmetry';

const SPRAY_DENSITY = 8; // dots per pointer event

export function createAirbrushTool(): Tool {
  let dots: Point[] = [];
  let active = false;
  let lastPoint: Point | null = null;
  let timer: number | null = null;

  function spray(center: Point, radius: number) {
    for (let i = 0; i < SPRAY_DENSITY; i++) {
      const angle = Math.random() * Math.PI * 2;
      // sqrt for uniform distribution within circle
      const r = Math.sqrt(Math.random()) * radius;
      dots.push({
        x: center.x + Math.cos(angle) * r,
        y: center.y + Math.sin(angle) * r,
      });
    }
  }

  function renderPreview(ctx: ToolContext) {
    ctx.clearPreview();
    if (dots.length === 0) return;
    const radius = Math.max(ctx.brushSize / 8, 0.5);
    withSymmetry(ctx.previewCtx, ctx.symmetry, (c) => {
      c.save();
      c.fillStyle = ctx.foreground;
      c.globalAlpha = 0.15;
      for (const d of dots) {
        c.beginPath();
        c.arc(d.x, d.y, radius, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    });
  }

  function startTimer(ctx: ToolContext) {
    if (timer !== null) return;
    timer = window.setInterval(() => {
      if (!active || !lastPoint) return;
      spray(lastPoint, ctx.brushSize);
      renderPreview(ctx);
    }, 40);
  }

  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  return {
    name: 'airbrush',
    cursor: 'crosshair',

    onPointerDown(p, ctx) {
      dots = [];
      active = true;
      lastPoint = p;
      spray(p, ctx.brushSize);
      renderPreview(ctx);
      startTimer(ctx);
    },

    onPointerMove(p, ctx) {
      if (!active) return;
      lastPoint = p;
      spray(p, ctx.brushSize);
      renderPreview(ctx);
    },

    onPointerUp(_p, ctx) {
      if (!active) return;
      active = false;
      stopTimer();
      if (dots.length > 0) {
        ctx.commit({
          type: 'airbrush',
          dots: [...dots],
          style: {
            color: ctx.foreground,
            width: ctx.brushSize,
            opacity: 0.15,
          },
          symmetry: ctx.symmetry,
        });
      }
      dots = [];
      lastPoint = null;
      ctx.clearPreview();
    },

    onPointerCancel(ctx) {
      active = false;
      stopTimer();
      dots = [];
      lastPoint = null;
      ctx.clearPreview();
    },
  };
}
