import { useStore } from '../state/store';
import { TOOL_LIST } from '../tools';

export function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clear = useStore((s) => s.clear);
  const canUndo = useStore((s) => s.commands.length > 0);
  const canRedo = useStore((s) => s.redoStack.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TOOL_LIST.map((tool) => {
        const active = activeTool === tool.name;
        return (
          <button
            key={tool.name}
            type="button"
            onClick={() => setActiveTool(tool.name)}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition ${
              active
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700'
            }`}
          >
            {tool.label}
          </button>
        );
      })}

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
    </div>
  );
}
