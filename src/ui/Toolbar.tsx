import { useStore } from '../state/store';

export function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clear = useStore((s) => s.clear);
  const canUndo = useStore((s) => s.commands.length > 0);
  const canRedo = useStore((s) => s.redoStack.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setActiveTool('pencil')}
        className={`px-3 py-1.5 rounded text-sm font-medium border transition ${
          activeTool === 'pencil'
            ? 'bg-zinc-900 text-white border-zinc-900'
            : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
        }`}
      >
        Pencil
      </button>

      <div className="w-px h-6 bg-zinc-300 mx-1" />

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Redo
      </button>
      <button
        type="button"
        onClick={clear}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
      >
        Clear
      </button>
    </div>
  );
}
