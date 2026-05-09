import { create } from 'zustand';
import type { Color, Command, SymmetryConfig } from '../commands/types';
import type { ToolName } from '../tools/types';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

type AppState = {
  width: number;
  height: number;

  activeTool: ToolName;

  foreground: Color;
  background: Color;
  brushSize: number;

  symmetry: SymmetryConfig;

  commands: Command[];
  redoStack: Command[];

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
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,

  activeTool: 'pencil',

  foreground: '#000000',
  background: '#ffffff',
  brushSize: 4,

  symmetry: {
    slices: 6,
    reflect: false,
    centerX: CANVAS_WIDTH / 2,
    centerY: CANVAS_HEIGHT / 2,
  },

  commands: [],
  redoStack: [],

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
