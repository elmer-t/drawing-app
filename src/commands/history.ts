import type { Command } from './types';
import { executeCommand } from './execute';

/**
 * Re-renders the entire committed canvas from a command list.
 * Clears first, then executes each command in order.
 */
export function rerender(
  ctx: CanvasRenderingContext2D,
  commands: Command[],
  background: string,
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  if (background && background !== 'transparent') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  for (const cmd of commands) {
    executeCommand(ctx, cmd);
  }
}
