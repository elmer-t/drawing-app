import { useStore } from '../state/store';

export function ColorControls() {
  const foreground = useStore((s) => s.foreground);
  const background = useStore((s) => s.background);
  const setForeground = useStore((s) => s.setForeground);
  const setBackground = useStore((s) => s.setBackground);

  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <span>Stroke</span>
        <input
          type="color"
          value={foreground}
          onChange={(e) => setForeground(e.target.value)}
          className="h-8 w-10 rounded border border-zinc-300 bg-white p-0.5"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <span>Background</span>
        <input
          type="color"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          className="h-8 w-10 rounded border border-zinc-300 bg-white p-0.5"
        />
      </label>
    </div>
  );
}
