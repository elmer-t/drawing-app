export type Point = { x: number; y: number };

export type Color = string;

export type StrokeStyle = {
  color: Color;
  width: number;
  opacity?: number;
};

export type SymmetryMode = 'off' | 'cyclic' | 'mirror' | 'tile';

export type SymmetryConfig = {
  mode: SymmetryMode;
  slices: number;
  tileW: number;
  tileH: number;
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
  | {
      type: 'fill';
      point: Point;
      color: Color;
      tolerance: number;
      symmetry: SymmetryConfig;
    }
  | { type: 'clear' };
