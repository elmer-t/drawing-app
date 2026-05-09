import type { SymmetryConfig } from '../commands/types';

export function withSymmetry(
  ctx: CanvasRenderingContext2D,
  config: SymmetryConfig,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
): void {
  const { slices, reflect, centerX, centerY } = config;
  const angleStep = (2 * Math.PI) / slices;

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
}
