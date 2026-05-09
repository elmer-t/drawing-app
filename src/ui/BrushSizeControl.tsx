import { useStore } from '../state/store';

export function BrushSizeControl() {
  const brushSize = useStore((s) => s.brushSize);
  const setBrushSize = useStore((s) => s.setBrushSize);

  return (
    <label className="flex items-center gap-3 text-sm text-zinc-700">
      <span>Brush</span>
      <input
        type="range"
        min={1}
        max={64}
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        className="w-32"
      />
      <span className="tabular-nums w-8 text-right">{brushSize}px</span>
    </label>
  );
}
