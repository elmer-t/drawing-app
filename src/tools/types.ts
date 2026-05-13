import type { Color, Command, Point, SymmetryConfig } from '../commands/types';

export type ToolContext = {
  canvasWidth: number;
  canvasHeight: number;

  foreground: Color;
  background: Color;
  brushSize: number;
  symmetry: SymmetryConfig;

  previewCtx: CanvasRenderingContext2D;

  commit: (command: Command) => void;
  clearPreview: () => void;

  /** Reads the committed-canvas pixel at the given canvas-space point. */
  getColorAt: (point: Point) => string | null;
  /** Sets the active foreground (stroke) color. */
  setForeground: (c: Color) => void;
  /** Adds a color to the recent-colors list. */
  addRecentColor: (c: Color) => void;
  /** Switches the active tool. Used by Eyedropper to return to the previous tool. */
  setActiveTool: (name: ToolName) => void;
};

export interface Tool {
  name: string;
  cursor?: string;
  onPointerDown(point: Point, ctx: ToolContext): void;
  onPointerMove(point: Point, ctx: ToolContext): void;
  onPointerUp(point: Point, ctx: ToolContext): void;
  onPointerCancel?(ctx: ToolContext): void;
}

export type ToolName =
  | 'pencil'
  | 'brush'
  | 'marker'
  | 'airbrush'
  | 'eraser'
  | 'bucket'
  | 'eyedropper';
