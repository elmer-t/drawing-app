import { useStore } from '../state/store';

export function SymmetryControls() {
  const slices = useStore((s) => s.symmetry.slices);
  const reflect = useStore((s) => s.symmetry.reflect);
  const setSymmetrySlices = useStore((s) => s.setSymmetrySlices);
  const setSymmetryReflect = useStore((s) => s.setSymmetryReflect);

  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
        <span>Slices</span>
        <input
          type="range"
          min={1}
          max={24}
          value={slices}
          onChange={(e) => setSymmetrySlices(Number(e.target.value))}
          className="w-32"
        />
        <span className="tabular-nums w-6 text-right">{slices}</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={reflect}
          onChange={(e) => setSymmetryReflect(e.target.checked)}
        />
        <span>Reflect</span>
      </label>
    </div>
  );
}
