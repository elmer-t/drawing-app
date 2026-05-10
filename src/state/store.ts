import { create } from 'zustand';
import type { Color, Command, SymmetryConfig } from '../commands/types';
import type { ToolName } from '../tools/types';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const DEFAULT_BACKGROUND: Record<ResolvedTheme, Color> = {
  light: '#ffffff',
  dark: '#0f0f12',
};

const DEFAULT_FOREGROUND: Record<ResolvedTheme, Color> = {
  light: '#111111',
  dark: '#f4f4f5',
};

const INITIAL_WIDTH = 1024;
const INITIAL_HEIGHT = 1024;

const INITIAL_MODE: ThemeMode = detectInitialThemeMode();
const INITIAL_RESOLVED: ResolvedTheme = resolveTheme(INITIAL_MODE);

function detectInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage?.getItem('yantric.themeMode');
  if (stored === 'system' || stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'system';
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

type AppState = {
  width: number;
  height: number;

  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;

  zoom: number;
  panX: number;
  panY: number;

  activeTool: ToolName;

  foreground: Color;
  background: Color;
  brushSize: number;

  symmetry: SymmetryConfig;

  commands: Command[];
  redoStack: Command[];

  setCanvasSize: (w: number, h: number) => void;
  setThemeMode: (m: ThemeMode) => void;
  syncResolvedTheme: () => void;

  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setView: (zoom: number, panX: number, panY: number) => void;

  setActiveTool: (name: ToolName) => void;
  setForeground: (c: Color) => void;
  setBackground: (c: Color) => void;
  setBrushSize: (n: number) => void;
  setSymmetrySlices: (n: number) => void;
  setSymmetryReflect: (b: boolean) => void;

  pushCommand: (c: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

export const useStore = create<AppState>((set, get) => ({
  width: INITIAL_WIDTH,
  height: INITIAL_HEIGHT,

  themeMode: INITIAL_MODE,
  resolvedTheme: INITIAL_RESOLVED,

  zoom: 1,
  panX: 0,
  panY: 0,

  activeTool: 'pencil',

  foreground: DEFAULT_FOREGROUND[INITIAL_RESOLVED],
  background: DEFAULT_BACKGROUND[INITIAL_RESOLVED],
  brushSize: 4,

  symmetry: {
    slices: 6,
    reflect: false,
    centerX: INITIAL_WIDTH / 2,
    centerY: INITIAL_HEIGHT / 2,
  },

  commands: [],
  redoStack: [],

  setCanvasSize: (w, h) =>
    set((s) => ({
      width: w,
      height: h,
      symmetry: {
        ...s.symmetry,
        centerX: w / 2,
        centerY: h / 2,
      },
    })),

  setThemeMode: (mode) =>
    set((s) => {
      window.localStorage?.setItem('yantric.themeMode', mode);
      const next = resolveTheme(mode);
      const prevDefaultBg = DEFAULT_BACKGROUND[s.resolvedTheme];
      const prevDefaultFg = DEFAULT_FOREGROUND[s.resolvedTheme];
      return {
        themeMode: mode,
        resolvedTheme: next,
        background:
          s.background === prevDefaultBg
            ? DEFAULT_BACKGROUND[next]
            : s.background,
        foreground:
          s.foreground === prevDefaultFg
            ? DEFAULT_FOREGROUND[next]
            : s.foreground,
      };
    }),

  syncResolvedTheme: () => {
    const s = get();
    if (s.themeMode !== 'system') return;
    const next = resolveTheme('system');
    if (next === s.resolvedTheme) return;
    const prevDefaultBg = DEFAULT_BACKGROUND[s.resolvedTheme];
    const prevDefaultFg = DEFAULT_FOREGROUND[s.resolvedTheme];
    set({
      resolvedTheme: next,
      background:
        s.background === prevDefaultBg
          ? DEFAULT_BACKGROUND[next]
          : s.background,
      foreground:
        s.foreground === prevDefaultFg
          ? DEFAULT_FOREGROUND[next]
          : s.foreground,
    });
  },

  setZoom: (z) => set({ zoom: clampZoom(z) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setView: (zoom, panX, panY) => set({ zoom: clampZoom(zoom), panX, panY }),

  setActiveTool: (name) => set({ activeTool: name }),
  setForeground: (c) => set({ foreground: c }),
  setBackground: (c) => set({ background: c }),
  setBrushSize: (n) => set({ brushSize: n }),

  setSymmetrySlices: (n) =>
    set((s) => ({ symmetry: { ...s.symmetry, slices: n } })),
  setSymmetryReflect: (b) =>
    set((s) => ({ symmetry: { ...s.symmetry, reflect: b } })),

  pushCommand: (c) =>
    set((s) => ({ commands: [...s.commands, c], redoStack: [] })),

  undo: () =>
    set((s) => {
      if (s.commands.length === 0) return s;
      const last = s.commands[s.commands.length - 1];
      return {
        commands: s.commands.slice(0, -1),
        redoStack: [...s.redoStack, last],
      };
    }),

  redo: () =>
    set((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        commands: [...s.commands, next],
        redoStack: s.redoStack.slice(0, -1),
      };
    }),

  clear: () =>
    set((s) => ({
      commands: [...s.commands, { type: 'clear' }],
      redoStack: [],
    })),
}));

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

function clampZoom(z: number): number {
  if (Number.isNaN(z)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}
