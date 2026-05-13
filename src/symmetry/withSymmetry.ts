import type { SymmetryConfig } from '../commands/types';

export function withSymmetry(
  ctx: CanvasRenderingContext2D,
  config: SymmetryConfig,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
): void {
  switch (config.mode) {
    case 'off': {
      drawFn(ctx);
      return;
    }
    case 'cyclic':
    case 'mirror': {
      const { slices, centerX, centerY } = config;
      const angleStep = (2 * Math.PI) / slices;
      const reflect = config.mode === 'mirror';
      for (let i = 0; i < slices; i++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * angleStep);
        ctx.translate(-centerX, -centerY);
        drawFn(ctx);
        ctx.restore();

        if (reflect) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(i * angleStep);
          ctx.scale(-1, 1);
          ctx.translate(-centerX, -centerY);
          drawFn(ctx);
          ctx.restore();
        }
      }
      return;
    }
    case 'tile': {
      const { tileW, tileH } = config;
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      if (tileW <= 0 || tileH <= 0) {
        drawFn(ctx);
        return;
      }
      // Iterate enough offsets in both directions to cover the entire canvas
      // regardless of where the user is drawing. The canvas clips off-screen
      // draws, so a generous range is cheap and keeps the math simple.
      const nMax = Math.ceil(w / tileW) + 1;
      const mMax = Math.ceil(h / tileH) + 1;
      for (let n = -nMax; n <= nMax; n++) {
        for (let m = -mMax; m <= mMax; m++) {
          ctx.save();
          ctx.translate(n * tileW, m * tileH);
          drawFn(ctx);
          ctx.restore();
        }
      }
      return;
    }
  }
}
