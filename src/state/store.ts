import { create } from 'zustand';
import type { Color, Command, SymmetryConfig } from '../commands/types';
import type { ToolName } from '../tools/types';

export type Theme = 'light' | 'dark';

const DEFAULT_BACKGROUND: Record<Theme, Color> = {
  light: '#ffffff',
  dark: '#0f0f12',
};

const DEFAULT_FOREGROUND: Record<Theme, Color> = {
  light: '#111111',
  dark: '#f4f4f5',
};

const INITIAL_WIDTH = 1024;
const INITIAL_HEIGHT = 1024;
const INITIAL_THEME: Theme = detectInitialTheme();

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage?.getItem('mandala.theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

type AppState = {
  width: number;
  height: number;

  theme: Theme;

  activeTool: ToolName;

  foreground: Color;
  background: Color;
  brushSize: number;

  symmetry: SymmetryConfig;

  commands: Command[];
  redoStack: Command[];

  setCanvasSize: (w: number, h: number) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

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

export const useStore = create<AppState>((set) => ({
  width: INITIAL_WIDTH,
  height: INITIAL_HEIGHT,

  theme: INITIAL_THEME,

  activeTool: 'pencil',

  foreground: DEFAULT_FOREGROUND[INITIAL_THEME],
  background: DEFAULT_BACKGROUND[INITIAL_THEME],
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

  setTheme: (t) =>
    set((s) => {
      window.localStorage?.setItem('mandala.theme', t);
      const prevDefaultBg = DEFAULT_BACKGROUND[s.theme];
      const prevDefaultFg = DEFAULT_FOREGROUND[s.theme];
      return {
        theme: t,
        // Only swap the canvas/stroke colors if the user hasn't customised
        // them away from the previous theme's defaults.
        background:
          s.background === prevDefaultBg ? DEFAULT_BACKGROUND[t] : s.background,
        foreground:
          s.foreground === prevDefaultFg ? DEFAULT_FOREGROUND[t] : s.foreground,
      };
    }),

  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light';
      window.localStorage?.setItem('mandala.theme', next);
      const prevDefaultBg = DEFAULT_BACKGROUND[s.theme];
      const prevDefaultFg = DEFAULT_FOREGROUND[s.theme];
      return {
        theme: next,
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
