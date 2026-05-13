import { useEffect, useRef } from 'react';
import { Canvas } from '../canvas/Canvas';
import { TopBar } from '../ui/TopBar';
import { LeftRail } from '../ui/LeftRail';
import { StatusBar } from '../ui/StatusBar';
import { useStore } from '../state/store';
import { TOOL_LIST } from '../tools';

const TOOL_KEY_MAP = new Map(
  TOOL_LIST.map((t) => [t.key.toLowerCase(), t.name] as const),
);

export function App() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const resolvedTheme = useStore((s) => s.resolvedTheme);
  const themeMode = useStore((s) => s.themeMode);
  const syncResolvedTheme = useStore((s) => s.syncResolvedTheme);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const setBrushSize = useStore((s) => s.setBrushSize);
  const swapColors = useStore((s) => s.swapColors);
  const centerPlacementActive = useStore((s) => s.centerPlacementActive);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Drive both data-theme (CSS tokens) and .dark (any leftover Tailwind dark: classes).
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => syncResolvedTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode, syncResolvedTheme]);

  // Global keyboard shortcuts (single-key tool switching, undo/redo, brush size, swap).
  useEffect(() => {
    function isEditable(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
      );
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isEditable(e.target)) return;
      const meta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (meta && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta) return;

      if (key === '[') {
        e.preventDefault();
        const cur = useStore.getState().brushSize;
        setBrushSize(Math.max(1, cur - 1));
        return;
      }
      if (key === ']') {
        e.preventDefault();
        const cur = useStore.getState().brushSize;
        setBrushSize(Math.min(64, cur + 1));
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        swapColors();
        return;
      }

      const tool = TOOL_KEY_MAP.get(key);
      if (tool) {
        e.preventDefault();
        setActiveTool(tool);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, setActiveTool, setBrushSize, swapColors]);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace">
        <LeftRail />
        <main ref={viewportRef} className="stage">
          <Canvas viewportRef={viewportRef} />
          {centerPlacementActive ? (
            <div className="placing-hint" role="status">
              CLICK ON THE CANVAS TO SET CENTER · ESC TO CANCEL
            </div>
          ) : null}
        </main>
      </div>
      <StatusBar viewportRef={viewportRef} />
    </div>
  );
}
