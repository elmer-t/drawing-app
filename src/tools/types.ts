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
  | 'eraser';
