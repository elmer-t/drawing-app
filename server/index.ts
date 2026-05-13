import http from 'node:http';
import { createCanvas } from '@napi-rs/canvas';
import { rerender } from '../src/commands/history';
import { validateSpec, SPEC_VERSION, type MandalaSpec } from '../src/api/spec';

const HOST = process.env.SYMMETROX_API_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SYMMETROX_API_PORT ?? 5174);
const MAX_BODY = 4 * 1024 * 1024; // 4 MB
const ALLOWED_ORIGIN = process.env.SYMMETROX_ALLOWED_ORIGIN ?? 'http://localhost:5173';

type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;

const routes: Record<string, Record<string, RouteHandler>> = {
  GET: {
    '/api/health': handleHealth,
    '/api/schema': handleSchema,
  },
  POST: {
    '/api/render': handleRender,
    '/api/validate': handleValidate,
  },
};

const server = http.createServer(async (req, res) => {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? HOST}`);
    const route = routes[req.method ?? '']?.[url.pathname];
    if (!route) {
      sendJson(res, 404, { error: `no route for ${req.method} ${url.pathname}` });
      return;
    }
    await route(req, res, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`symmetrox api listening on http://${HOST}:${PORT}`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/schema`);
  console.log(`  POST /api/validate`);
  console.log(`  POST /api/render   [?format=json]`);
});

function setCors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    total += buf.length;
    if (total > MAX_BODY) throw new Error(`request body exceeds ${MAX_BODY} bytes`);
    chunks.push(buf);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) throw new Error('empty request body');
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`invalid JSON: ${(err as Error).message}`, { cause: err });
  }
}

function handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
  sendJson(res, 200, { ok: true, version: SPEC_VERSION });
}

function handleSchema(_req: http.IncomingMessage, res: http.ServerResponse) {
  sendJson(res, 200, schema());
}

async function handleValidate(req: http.IncomingMessage, res: http.ServerResponse) {
  let raw: unknown;
  try {
    raw = await readJson(req);
  } catch (err) {
    sendJson(res, 400, { ok: false, errors: [{ path: '', message: (err as Error).message }] });
    return;
  }
  const result = validateSpec(raw);
  if (result.ok) sendJson(res, 200, { ok: true });
  else sendJson(res, 400, { ok: false, errors: result.errors });
}

async function handleRender(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  let raw: unknown;
  try {
    raw = await readJson(req);
  } catch (err) {
    sendJson(res, 400, { ok: false, errors: [{ path: '', message: (err as Error).message }] });
    return;
  }
  const result = validateSpec(raw);
  if (!result.ok) {
    sendJson(res, 400, { ok: false, errors: result.errors });
    return;
  }

  const png = renderSpecToPng(result.spec);
  const format = url.searchParams.get('format');
  if (format === 'json') {
    sendJson(res, 200, {
      width: result.spec.width,
      height: result.spec.height,
      pngBase64: png.toString('base64'),
    });
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', String(png.length));
  res.end(png);
}

function renderSpecToPng(spec: MandalaSpec): Buffer {
  const canvas = createCanvas(spec.width, spec.height);
  const ctx = canvas.getContext('2d');
  // The shared rendering code is typed against the DOM CanvasRenderingContext2D.
  // @napi-rs/canvas implements the same 2D API, so we cast across via unknown.
  rerender(ctx as unknown as CanvasRenderingContext2D, spec.commands, spec.background);
  return canvas.toBuffer('image/png');
}

function schema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'MandalaSpec',
    type: 'object',
    required: ['version', 'width', 'height', 'background', 'commands'],
    properties: {
      version: {
        enum: [1, 2],
        description: `current is ${SPEC_VERSION}; v1 is accepted and migrated`,
      },
      width: { type: 'integer', minimum: 1 },
      height: { type: 'integer', minimum: 1 },
      background: { type: 'string', description: 'CSS color or "transparent"' },
      symmetryDefaults: {
        type: 'object',
        description:
          'Optional defaults filled in for commands that omit `symmetry`. v2 shape: { mode, slices, tileW, tileH }. v1 shape `{ slices, reflect }` is migrated.',
        properties: {
          mode: { enum: ['off', 'cyclic', 'mirror', 'tile'] },
          slices: { type: 'integer', minimum: 1, maximum: 64 },
          tileW: { type: 'number', minimum: 2, maximum: 4096 },
          tileH: { type: 'number', minimum: 2, maximum: 4096 },
          // v1 legacy:
          reflect: { type: 'boolean' },
        },
      },
      commands: { type: 'array', items: { $ref: '#/$defs/Command' } },
    },
    $defs: {
      Point: {
        type: 'object',
        required: ['x', 'y'],
        properties: { x: { type: 'number' }, y: { type: 'number' } },
      },
      StrokeStyle: {
        type: 'object',
        required: ['color', 'width'],
        properties: {
          color: { type: 'string' },
          width: { type: 'number', exclusiveMinimum: 0 },
          opacity: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      Symmetry: {
        type: 'object',
        description:
          'Per-command symmetry. v2 fields: mode (off|cyclic|mirror|tile), slices, tileW, tileH, centerX, centerY. v1 `reflect: bool` is migrated to mode.',
        properties: {
          mode: { enum: ['off', 'cyclic', 'mirror', 'tile'] },
          slices: { type: 'integer', minimum: 1, maximum: 64 },
          tileW: { type: 'number', minimum: 2, maximum: 4096 },
          tileH: { type: 'number', minimum: 2, maximum: 4096 },
          centerX: { type: 'number' },
          centerY: { type: 'number' },
          // v1 legacy:
          reflect: { type: 'boolean' },
        },
      },
      Command: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'kind', 'points', 'style'],
            properties: {
              type: { const: 'stroke' },
              kind: { enum: ['pencil', 'brush', 'marker', 'eraser'] },
              points: { type: 'array', items: { $ref: '#/$defs/Point' } },
              style: { $ref: '#/$defs/StrokeStyle' },
              symmetry: { $ref: '#/$defs/Symmetry' },
            },
          },
          {
            type: 'object',
            required: ['type', 'dots', 'style'],
            properties: {
              type: { const: 'airbrush' },
              dots: { type: 'array', items: { $ref: '#/$defs/Point' } },
              style: { $ref: '#/$defs/StrokeStyle' },
              symmetry: { $ref: '#/$defs/Symmetry' },
            },
          },
          {
            type: 'object',
            required: ['type', 'point', 'color'],
            properties: {
              type: { const: 'fill' },
              point: { $ref: '#/$defs/Point' },
              color: { type: 'string' },
              tolerance: { type: 'number', minimum: 0, maximum: 255 },
              symmetry: { $ref: '#/$defs/Symmetry' },
            },
          },
          {
            type: 'object',
            required: ['type'],
            properties: { type: { const: 'clear' } },
          },
        ],
      },
    },
  };
}
