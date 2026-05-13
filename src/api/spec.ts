import type {
  Command,
  Point,
  StrokeKind,
  StrokeStyle,
  SymmetryConfig,
  SymmetryMode,
} from '../commands/types';

export const SPEC_VERSION = 2 as const;
const ACCEPTED_VERSIONS = [1, 2] as const;
type SpecVersion = (typeof ACCEPTED_VERSIONS)[number];

export const DEFAULT_TILE_W = 128;
export const DEFAULT_TILE_H = 128;

export type SymmetryDefaults = {
  mode: SymmetryMode;
  slices: number;
  tileW: number;
  tileH: number;
};

export type MandalaSpec = {
  version: typeof SPEC_VERSION;
  width: number;
  height: number;
  background: string;
  /**
   * Optional defaults applied to any stroke/airbrush/fill command that omits
   * its own `symmetry` field. The server fills these in before rendering.
   */
  symmetryDefaults?: SymmetryDefaults;
  commands: Command[];
};

export type ValidationError = { path: string; message: string };

export type ValidationResult =
  | { ok: true; spec: MandalaSpec }
  | { ok: false; errors: ValidationError[] };

const STROKE_KINDS: StrokeKind[] = ['pencil', 'brush', 'marker', 'eraser'];
const SYMMETRY_MODES: SymmetryMode[] = ['off', 'cyclic', 'mirror', 'tile'];

export function validateSpec(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ path: '', message: 'spec must be an object' }] };
  }

  const version = checkVersion(input.version, errors);
  const width = checkPositiveInt(input.width, 'width', errors);
  const height = checkPositiveInt(input.height, 'height', errors);
  if (typeof input.background !== 'string') {
    errors.push({ path: 'background', message: 'must be a CSS color string' });
  }

  let defaults: SymmetryDefaults | undefined;
  if (input.symmetryDefaults !== undefined) {
    if (!isObject(input.symmetryDefaults)) {
      errors.push({ path: 'symmetryDefaults', message: 'must be an object' });
    } else {
      defaults = parseSymmetryDefaults(
        input.symmetryDefaults,
        'symmetryDefaults',
        errors,
        version,
      );
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
    const cmd = validateCommand(input.commands[i], path, errors, defaults, center, version);
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
  defaults: SymmetryDefaults | undefined,
  center: { centerX: number; centerY: number },
  version: SpecVersion | undefined,
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
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center, version);
      if (errors.length !== before) return null;
      return { type: 'stroke', kind: kind as StrokeKind, points: points!, style: style!, symmetry: symmetry! };
    }
    case 'airbrush': {
      const dots = validatePoints(raw.dots, `${path}.dots`, errors);
      const style = validateStyle(raw.style, `${path}.style`, errors);
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center, version);
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
      const symmetry = validateSymmetry(raw.symmetry, `${path}.symmetry`, errors, defaults, center, version);
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

function parseSymmetryDefaults(
  raw: Record<string, unknown>,
  path: string,
  errors: ValidationError[],
  version: SpecVersion | undefined,
): SymmetryDefaults | undefined {
  // v1 had { slices, reflect }; map reflect -> mode and fill in tile defaults.
  if (version === 1 && raw.mode === undefined) {
    const slices = checkSlices(raw.slices, `${path}.slices`, errors);
    const reflect = checkBool(raw.reflect, `${path}.reflect`, errors);
    if (slices === undefined || reflect === undefined) return undefined;
    return {
      mode: reflect ? 'mirror' : 'cyclic',
      slices,
      tileW: DEFAULT_TILE_W,
      tileH: DEFAULT_TILE_H,
    };
  }
  // v2 (or v1 with explicit mode for round-trips)
  const mode = checkMode(raw.mode, `${path}.mode`, errors);
  const slices = raw.slices !== undefined
    ? checkSlices(raw.slices, `${path}.slices`, errors)
    : 6;
  const tileW = raw.tileW !== undefined
    ? checkTileDim(raw.tileW, `${path}.tileW`, errors)
    : DEFAULT_TILE_W;
  const tileH = raw.tileH !== undefined
    ? checkTileDim(raw.tileH, `${path}.tileH`, errors)
    : DEFAULT_TILE_H;
  if (mode === undefined || slices === undefined || tileW === undefined || tileH === undefined) return undefined;
  return { mode, slices, tileW, tileH };
}

function validateSymmetry(
  raw: unknown,
  path: string,
  errors: ValidationError[],
  defaults: SymmetryDefaults | undefined,
  center: { centerX: number; centerY: number },
  version: SpecVersion | undefined,
): SymmetryConfig | null {
  if (raw === undefined) {
    if (!defaults) {
      errors.push({ path, message: 'required when symmetryDefaults is not set' });
      return null;
    }
    return {
      mode: defaults.mode,
      slices: defaults.slices,
      tileW: defaults.tileW,
      tileH: defaults.tileH,
      centerX: center.centerX,
      centerY: center.centerY,
    };
  }
  if (!isObject(raw)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }

  // v1 per-command: { slices, reflect } -> derive mode.
  let mode: SymmetryMode | undefined;
  if (raw.mode === undefined && version === 1) {
    const reflectRaw = raw.reflect ?? defaults?.mode === 'mirror';
    const reflect = checkBool(reflectRaw, `${path}.reflect`, errors);
    if (reflect === undefined) return null;
    mode = reflect ? 'mirror' : 'cyclic';
  } else {
    mode = raw.mode !== undefined
      ? checkMode(raw.mode, `${path}.mode`, errors)
      : defaults?.mode ?? 'cyclic';
  }
  if (mode === undefined) return null;

  const slicesRaw = raw.slices ?? defaults?.slices ?? 6;
  const slices = checkSlices(slicesRaw, `${path}.slices`, errors);
  const tileW = raw.tileW !== undefined
    ? checkTileDim(raw.tileW, `${path}.tileW`, errors)
    : defaults?.tileW ?? DEFAULT_TILE_W;
  const tileH = raw.tileH !== undefined
    ? checkTileDim(raw.tileH, `${path}.tileH`, errors)
    : defaults?.tileH ?? DEFAULT_TILE_H;
  const centerX = typeof raw.centerX === 'number' ? raw.centerX : center.centerX;
  const centerY = typeof raw.centerY === 'number' ? raw.centerY : center.centerY;

  if (slices === undefined || tileW === undefined || tileH === undefined) return null;
  return { mode, slices, tileW, tileH, centerX, centerY };
}

function checkVersion(v: unknown, errors: ValidationError[]): SpecVersion | undefined {
  if (typeof v !== 'number' || !ACCEPTED_VERSIONS.includes(v as SpecVersion)) {
    errors.push({
      path: 'version',
      message: `expected one of ${ACCEPTED_VERSIONS.join(', ')}, got ${JSON.stringify(v)}`,
    });
    return undefined;
  }
  return v as SpecVersion;
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

function checkTileDim(v: unknown, path: string, errors: ValidationError[]): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 2 || v > 4096) {
    errors.push({ path, message: 'must be a finite number in [2, 4096]' });
    return undefined;
  }
  return v;
}

function checkMode(v: unknown, path: string, errors: ValidationError[]): SymmetryMode | undefined {
  if (typeof v !== 'string' || !SYMMETRY_MODES.includes(v as SymmetryMode)) {
    errors.push({ path, message: `must be one of ${SYMMETRY_MODES.join(', ')}` });
    return undefined;
  }
  return v as SymmetryMode;
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
