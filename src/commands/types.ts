export type Point = { x: number; y: number };

export type Color = string;

export type StrokeStyle = {
  color: Color;
  width: number;
};

export type SymmetryConfig = {
  slices: number;
  reflect: boolean;
  centerX: number;
  centerY: number;
};

export type Command =
  | {
      type: 'pencil';
      points: Point[];
      style: StrokeStyle;
      symmetry: SymmetryConfig;
    }
  | { type: 'clear' };
