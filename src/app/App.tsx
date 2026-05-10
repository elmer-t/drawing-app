import { useEffect, useRef } from 'react';
import { Canvas } from '../canvas/Canvas';
import { Toolbar } from '../ui/Toolbar';
import { ColorControls } from '../ui/ColorControls';
import { BrushSizeControl } from '../ui/BrushSizeControl';
import { SymmetryControls } from '../ui/SymmetryControls';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ZoomControls } from '../ui/ZoomControls';
import { useStore } from '../state/store';

export function App() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const resolvedTheme = useStore((s) => s.resolvedTheme);
  const themeMode = useStore((s) => s.themeMode);
  const syncResolvedTheme = useStore((s) => s.syncResolvedTheme);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Watch system color-scheme changes when in 'system' mode.
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => syncResolvedTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode, syncResolvedTheme]);

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
    <div className="h-full flex flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="shrink-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="text-lg font-semibold mr-2">Mandala</h1>
          <Toolbar />
          <BrushSizeControl />
          <ColorControls />
          <SymmetryControls />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">
        <div
          ref={viewportRef}
          className="absolute inset-0 overflow-hidden bg-zinc-200/60 dark:bg-zinc-900/60"
        >
          <Canvas viewportRef={viewportRef} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <ZoomControls viewportRef={viewportRef} />
        </div>
      </main>
    </div>
  );
}
