import type { Command } from './types';
import { withSymmetry } from '../symmetry/withSymmetry';

export function executeCommand(
  ctx: CanvasRenderingContext2D,
  cmd: Command,
): void {
  switch (cmd.type) {
    case 'pencil': {
      withSymmetry(ctx, cmd.symmetry, (c) => {
        c.strokeStyle = cmd.style.color;
        c.lineWidth = cmd.style.width;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        cmd.points.forEach((p, i) =>
          i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y),
        );
        c.stroke();
      });
      break;
    }
    case 'clear': {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
      break;
    }
  }
}
