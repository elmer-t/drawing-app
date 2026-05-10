export type Point = { x: number; y: number };

export type Color = string;

export type StrokeStyle = {
  color: Color;
  width: number;
  opacity?: number;
};

export type SymmetryConfig = {
  slices: number;
  reflect: boolean;
  centerX: number;
  centerY: number;
};

export type StrokeKind = 'pencil' | 'brush' | 'marker' | 'eraser';

export type Command =
  | {
      type: 'stroke';
      kind: StrokeKind;
      points: Point[];
      style: StrokeStyle;
      symmetry: SymmetryConfig;
    }
  | {
      type: 'airbrush';
      dots: Point[];
      style: StrokeStyle;
      symmetry: SymmetryConfig;
    }
  | { type: 'clear' };
