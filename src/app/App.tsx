import { useEffect } from 'react';
import { Canvas } from '../canvas/Canvas';
import { Toolbar } from '../ui/Toolbar';
import { ColorControls } from '../ui/ColorControls';
import { BrushSizeControl } from '../ui/BrushSizeControl';
import { SymmetryControls } from '../ui/SymmetryControls';
import { useStore } from '../state/store';

export function App() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="text-lg font-semibold text-zinc-900 mr-2">
            Mandala
          </h1>
          <Toolbar />
          <BrushSizeControl />
          <ColorControls />
          <SymmetryControls />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <Canvas />
      </main>
    </div>
  );
}
