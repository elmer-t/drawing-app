import { useStore } from '../state/store';
import { ToolMenu } from './ToolMenu';
import { IO } from './IO';

export function Toolbar() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clear = useStore((s) => s.clear);
  const canUndo = useStore((s) => s.commands.length > 0);
  const canRedo = useStore((s) => s.redoStack.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolMenu />

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Redo
      </button>
      <button
        type="button"
        onClick={clear}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
      >
        Clear
      </button>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      <IO />
    </div>
  );
}
