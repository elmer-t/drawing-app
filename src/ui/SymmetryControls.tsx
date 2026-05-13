import { useStore } from '../state/store';
import type { SymmetryMode } from '../commands/types';

const MODES: { value: SymmetryMode; label: string; title: string }[] = [
  { value: 'off', label: 'Off', title: 'No symmetry' },
  { value: 'cyclic', label: 'Cyclic', title: 'Rotational copies around the center' },
  { value: 'mirror', label: 'Mirror', title: 'Rotational copies + reflections (kaleidoscope)' },
  { value: 'tile', label: 'Tile', title: 'Repeat across the canvas as a tile pattern' },
];

export function SymmetryControls() {
  const mode = useStore((s) => s.symmetry.mode);
  const slices = useStore((s) => s.symmetry.slices);
  const tileW = useStore((s) => s.symmetry.tileW);
  const tileH = useStore((s) => s.symmetry.tileH);
  const hasCustomCenter = useStore((s) => s.hasCustomCenter);
  const placementActive = useStore((s) => s.centerPlacementActive);
  const setSymmetryMode = useStore((s) => s.setSymmetryMode);
  const setSymmetrySlices = useStore((s) => s.setSymmetrySlices);
  const setSymmetryTileSize = useStore((s) => s.setSymmetryTileSize);
  const resetSymmetryCenter = useStore((s) => s.resetSymmetryCenter);
  const setCenterPlacementActive = useStore((s) => s.setCenterPlacementActive);

  const showSlices = mode === 'cyclic' || mode === 'mirror';
  const showTile = mode === 'tile';
  const showCenterControls = mode !== 'off' && mode !== 'tile';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        role="radiogroup"
        aria-label="Symmetry mode"
        className="inline-flex rounded border border-zinc-300 dark:border-zinc-600 overflow-hidden text-xs font-medium"
      >
        {MODES.map((m) => {
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={m.title}
              onClick={() => setSymmetryMode(m.value)}
              className={`px-2.5 py-1.5 transition border-r last:border-r-0 border-zinc-300 dark:border-zinc-600 ${
                active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {showSlices ? (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <span>Points</span>
          <input
            type="range"
            min={1}
            max={40}
            value={slices}
            onChange={(e) => setSymmetrySlices(Number(e.target.value))}
            className="w-28"
          />
          <span className="tabular-nums w-6 text-right">{slices}</span>
        </label>
      ) : null}

      {showTile ? (
        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <label className="flex items-center gap-1.5">
            <span>W</span>
            <input
              type="number"
              min={2}
              max={4096}
              value={tileW}
              onChange={(e) =>
                setSymmetryTileSize(
                  clampTile(Number(e.target.value)),
                  tileH,
                )
              }
              className="w-16 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 tabular-nums"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>H</span>
            <input
              type="number"
              min={2}
              max={4096}
              value={tileH}
              onChange={(e) =>
                setSymmetryTileSize(
                  tileW,
                  clampTile(Number(e.target.value)),
                )
              }
              className="w-16 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 tabular-nums"
            />
          </label>
        </div>
      ) : null}

      {showCenterControls ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCenterPlacementActive(!placementActive)}
            title="Click on the canvas to place the symmetry center"
            className={`px-2.5 py-1.5 rounded text-xs font-medium border transition ${
              placementActive
                ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
                : 'border-zinc-300 dark:border-zinc-600 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            {placementActive ? 'Click canvas…' : 'Place Center'}
          </button>
          {hasCustomCenter ? (
            <button
              type="button"
              onClick={resetSymmetryCenter}
              title="Reset symmetry center to canvas center"
              className="px-2 py-1.5 rounded text-xs font-medium border border-zinc-300 dark:border-zinc-600 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function clampTile(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.max(2, Math.min(4096, Math.round(n)));
}
