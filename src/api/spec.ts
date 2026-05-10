import type { Command, Point, StrokeKind, StrokeStyle, SymmetryConfig } from '../commands/types';

export const SPEC_VERSION = 1 as const;

export type MandalaSpec = {
  version: typeof SPEC_VERSION;
  width: number;
  height: number;
  background: string;
  /**
   * Optional defaults applied to any stroke/airbrush command that omits its
   * own `symmetry` field. The server fills these in before rendering.
   */
  symmetryDefaults?: { slices: number; reflect: boolean };
  commands: Command[];
};

export type ValidationError = { path: string; message: string };

export type ValidationResult =
  | { ok: true; spec: MandalaSpec }
  | { ok: false; errors: ValidationError[] };

const STROKE_KINDS: StrokeKind[] = ['pencil', 'brush', 'marker', 'eraser'];

export function validateSpec(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ path: '', message: 'spec must be an object' }] };
  }

  if (input.version !== SPEC_VERSION) {
    errors.push({ path: 'version', message: `expected ${SPEC_VERSION}, got ${JSON.stringify(input.version)}` });
  }
  const width = checkPositiveInt(input.width, 'width', errors);
  const height = checkPositiveInt(input.height, 'height', errors);
  if (typeof input.background !== 'string') {
    errors.push({ path: 'background', message: 'must be a CSS color string' });
  }

  let defaults: { slices: number; reflect: boolean } | undefined;
  if (input.symmetryDefaults !== undefined) {
    if (!isObject(input.symmetryDefaults)) {
      errors.push({ path: 'symmetryDefaults', message: 'must be an object' });
    } else {
      const slices = checkSlices(input.symmetryDefaults.slices, 'symmetryDefaults.slices', errors);
      const reflect = checkBool(input.symmetryDefaults.reflect, 'symmetryDefaults.reflect', errors);
      if (slices !== undefined && reflect !== undefined) {
        defaults = { slices, reflect };
      }
    }
  }

  const center = (width !== undefined && height !== undefined)
    ? { centerX: width / 2, centerY: height / 2 }
    : { centerX: 0, centerY: 0 };

  if (!Array.isArray(input.commands)) {
    errors.push({ path: 'commands', message: 'must be an array' });
    return { ok: false, errors };
  }

  const commands: Command[] = [];
  for (let i = 0; i < input.commands.length; i++) {
    const path = `commands[${i}]`;
    const cmd = validateCommand(input.commands[i], path, errors, defaults, center);
    if (cmd) commands.push(cmd);
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    spec: {
      version: SPEC_VERSION,
      width: width!,
      height: height!,
      background: input.background as string,
      symmetryDefaults: defaults,
      commands,
    },
  };
}

function validateCommand(
  raw: unknown,
  path: string,
  errors: ValidationError[],
  defaults: { slices: number; reflect: boolean } | undefined,
  center: { centerX: number; centerY: number },
): Command | null {
  if (!isObject(raw)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }
  const before = errors.length;
  switch (raw.type) {
    case 'stroke': {
      const kind = raw.kind;
      if (typeof kind !== 'string' || !STROKE_KINDS.includes(kind as StrokeKind)) {
        errors.push({ path: `${path}.kind`, message: `must be one of ${STROKE_KINDS.join(', ')}` });
      }
      const points = validatePoints(raw.points, `${path}.points`, errors);
      const style = validateStyle(raw.style, `${path}.style`, errors);
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center);
      if (errors.length !== before) return null;
      return { type: 'stroke', kind: kind as StrokeKind, points: points!, style: style!, symmetry: symmetry! };
    }
    case 'airbrush': {
      const dots = validatePoints(raw.dots, `${path}.dots`, errors);
      const style = validateStyle(raw.style, `${path}.style`, errors);
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center);
      if (errors.length !== before) return null;
      return { type: 'airbrush', dots: dots!, style: style!, symmetry: symmetry! };
    }
    case 'fill': {
      const point = validatePoint(raw.point, `${path}.point`, errors);
      if (typeof raw.color !== 'string') {
        errors.push({ path: `${path}.color`, message: 'must be a CSS color string' });
      }
      let tolerance = 32;
      if (raw.tolerance !== undefined) {
        if (typeof raw.tolerance !== 'number' || raw.tolerance < 0 || raw.tolerance > 255) {
          errors.push({ path: `${path}.tolerance`, message: 'must be a number in [0, 255]' });
        } else {
          tolerance = raw.tolerance;
        }
      }
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center);
      if (errors.length !== before) return null;
      return {
        type: 'fill',
        point: point!,
        color: raw.color as string,
        tolerance,
        symmetry: symmetry!,
      };
    }
    case 'clear':
      return { type: 'clear' };
    default:
      errors.push({ path: `${path}.type`, message: `must be "stroke" | "airbrush" | "fill" | "clear"` });
      return null;
  }
}

function validatePoint(raw: unknown, path: string, errors: ValidationError[]): Point | null {
  if (!isObject(raw) || typeof raw.x !== 'number' || typeof raw.y !== 'number') {
    errors.push({ path, message: 'must be { x: number, y: number }' });
    return null;
  }
  if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y)) {
    errors.push({ path, message: 'x and y must be finite' });
    return null;
  }
  return { x: raw.x, y: raw.y };
}

function validatePoints(raw: unknown, path: string, errors: ValidationError[]): Point[] | null {
  if (!Array.isArray(raw)) {
    errors.push({ path, message: 'must be an array of points' });
    return null;
  }
  const out: Point[] = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i];
    if (!isObject(p) || typeof p.x !== 'number' || typeof p.y !== 'number') {
      errors.push({ path: `${path}[${i}]`, message: 'must be { x: number, y: number }' });
      continue;
    }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      errors.push({ path: `${path}[${i}]`, message: 'x and y must be finite' });
      continue;
    }
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

function validateStyle(raw: unknown, path: string, errors: ValidationError[]): StrokeStyle | null {
  if (!isObject(raw)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }
  if (typeof raw.color !== 'string') {
    errors.push({ path: `${path}.color`, message: 'must be a CSS color string' });
  }
  if (typeof raw.width !== 'number' || !(raw.width > 0)) {
    errors.push({ path: `${path}.width`, message: 'must be a positive number' });
  }
  if (raw.opacity !== undefined && (typeof raw.opacity !== 'number' || raw.opacity < 0 || raw.opacity > 1)) {
    errors.push({ path: `${path}.opacity`, message: 'must be a number in [0, 1]' });
  }
  if (typeof raw.color !== 'string' || typeof raw.width !== 'number') return null;
  return {
    color: raw.color,
    width: raw.width,
    opacity: raw.opacity as number | undefined,
  };
}

function validateSymmetry(
  raw: unknown,
  path: string,
  errors: ValidationError[],
  defaults: { slices: number; reflect: boolean } | undefined,
  center: { centerX: number; centerY: number },
): SymmetryConfig | null {
  if (raw === undefined) {
    if (!defaults) {
      errors.push({ path, message: 'required when symmetryDefaults is not set' });
      return null;
    }
    return { slices: defaults.slices, reflect: defaults.reflect, centerX: center.centerX, centerY: center.centerY };
  }
  if (!isObject(raw)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }
  const slices = raw.slices ?? defaults?.slices;
  const reflect = raw.reflect ?? defaults?.reflect ?? false;
  const slicesOk = checkSlices(slices, `${path}.slices`, errors);
  const reflectOk = checkBool(reflect, `${path}.reflect`, errors);
  const centerX = typeof raw.centerX === 'number' ? raw.centerX : center.centerX;
  const centerY = typeof raw.centerY === 'number' ? raw.centerY : center.centerY;
  if (slicesOk === undefined || reflectOk === undefined) return null;
  return { slices: slicesOk, reflect: reflectOk, centerX, centerY };
}

function checkPositiveInt(v: unknown, path: string, errors: ValidationError[]): number | undefined {
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) {
    errors.push({ path, message: 'must be a positive integer' });
    return undefined;
  }
  return v;
}

function checkSlices(v: unknown, path: string, errors: ValidationError[]): number | undefined {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 64) {
    errors.push({ path, message: 'must be an integer in [1, 64]' });
    return undefined;
  }
  return v;
}

function checkBool(v: unknown, path: string, errors: ValidationError[]): boolean | undefined {
  if (typeof v !== 'boolean') {
    errors.push({ path, message: 'must be a boolean' });
    return undefined;
  }
  return v;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
