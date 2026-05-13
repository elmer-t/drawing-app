import type { ToolName } from '../tools/types';

type Props = {
  size: number;
  color: string;
  tool: ToolName;
};

/**
 * Small 30x30 checkerboard tile with a circle whose diameter tracks the
 * current brush size (clamped 2-28px). Marker is rendered with reduced
 * alpha to hint at its translucence.
 */
export function BrushPreview({ size, color, tool }: Props) {
  const d = Math.min(28, Math.max(2, size));
  const isTransparent = tool === 'marker' || tool === 'airbrush';
  return (
    <div className="brush-prev" title={`Brush — ${size}px`}>
      <span
        style={{
          width: d,
          height: d,
          background: isTransparent ? `${color}88` : color,
          borderRadius: '50%',
          display: 'block',
        }}
      />
    </div>
  );
}
