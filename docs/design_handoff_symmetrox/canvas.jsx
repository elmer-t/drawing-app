// Drawing canvas with cyclic / mirror / tile symmetry.
// Strokes are stored as plain objects; canvas re-renders by replaying them.

const { useRef, useEffect, useState, useCallback } = React;

// Generate the list of transforms to apply per stroke given symmetry mode.
// Each transform is {rot, sx, sy, tx, ty} applied around the center.
function getTransforms(mode, points, center, w, h) {
  const out = [];
  if (mode === "off") return [{ rot: 0, sx: 1, sy: 1, tx: 0, ty: 0 }];

  if (mode === "cyclic") {
    const n = Math.max(2, Math.round(points));
    for (let i = 0; i < n; i++) {
      out.push({ rot: (Math.PI * 2 * i) / n, sx: 1, sy: 1, tx: 0, ty: 0 });
    }
    return out;
  }

  if (mode === "mirror") {
    // 'points' selects 1..4 mirror axes (h, v, both, plus rotational)
    const n = Math.max(2, Math.round(points));
    // pair each rotation with its reflection -> 2*N strokes
    for (let i = 0; i < n; i++) {
      const rot = (Math.PI * 2 * i) / n;
      out.push({ rot, sx: 1, sy: 1, tx: 0, ty: 0 });
      out.push({ rot, sx: -1, sy: 1, tx: 0, ty: 0 });
    }
    return out;
  }

  if (mode === "tile") {
    const n = Math.max(1, Math.round(points));
    const cw = w / n;
    const ch = h / n;
    // tile relative offsets from center
    for (let yi = 0; yi < n; yi++) {
      for (let xi = 0; xi < n; xi++) {
        const cx = cw * (xi + 0.5);
        const cy = ch * (yi + 0.5);
        out.push({
          rot: 0, sx: 1, sy: 1,
          tx: cx - center.x,
          ty: cy - center.y,
        });
      }
    }
    return out;
  }

  return [{ rot: 0, sx: 1, sy: 1, tx: 0, ty: 0 }];
}

function applyTransform(ctx, center, t) {
  ctx.translate(center.x + t.tx, center.y + t.ty);
  ctx.rotate(t.rot);
  ctx.scale(t.sx, t.sy);
  ctx.translate(-center.x, -center.y);
}

function drawPathOnce(ctx, stroke) {
  const { tool, color, size, points } = stroke;
  if (!points || points.length === 0) return;

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "spray") {
    // render spray as scattered dots accumulated at each point
    for (const p of points) {
      const density = Math.max(2, size * 0.6);
      for (let i = 0; i < density; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * size;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  if (tool === "marker") {
    ctx.globalAlpha = 0.55;
  } else {
    ctx.globalAlpha = 1;
  }

  ctx.lineWidth = size;
  if (tool === "pencil") ctx.lineWidth = Math.max(1, size * 0.7);
  if (tool === "brush") ctx.lineWidth = size * 1.1;
  if (tool === "marker") ctx.lineWidth = size * 1.6;

  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawStrokeWithSymmetry(ctx, stroke, sym, w, h) {
  // Image strokes (from import / fill snapshot) bypass symmetry.
  if (stroke.tool === "image" && stroke.img) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    if (stroke.fit) {
      const r = Math.min(w / stroke.img.width, h / stroke.img.height);
      const iw = stroke.img.width * r, ih = stroke.img.height * r;
      ctx.drawImage(stroke.img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    } else {
      ctx.drawImage(stroke.img, 0, 0, w, h);
    }
    ctx.restore();
    return;
  }
  const transforms = getTransforms(sym.mode, sym.points, sym.center, w, h);
  for (const t of transforms) {
    ctx.save();
    applyTransform(ctx, sym.center, t);
    drawPathOnce(ctx, stroke);
    ctx.restore();
  }
}

function DrawCanvas({
  width, height, canvasColor, theme,
  strokes, liveStroke, sym, zoom,
  onPointerDown, onPointerMove, onPointerUp,
  showCenter, onCanvasReady,
}) {
  const baseRef = useRef(null);
  const liveRef = useRef(null);
  const wrapRef = useRef(null);

  // Redraw committed strokes whenever they change or canvas size/sym changes.
  useEffect(() => {
    const c = baseRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    for (const s of strokes) {
      drawStrokeWithSymmetry(ctx, s, sym, width, height);
    }
    onCanvasReady && onCanvasReady(c);
  }, [strokes, width, height, canvasColor, sym.mode, sym.points, sym.center.x, sym.center.y]);

  // Redraw live stroke layer on every change
  useEffect(() => {
    const c = liveRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    if (liveStroke) drawStrokeWithSymmetry(ctx, liveStroke, sym, width, height);
  }, [liveStroke, width, height, sym.mode, sym.points, sym.center.x, sym.center.y]);

  // Pointer handling -- convert to canvas-space coordinates.
  const toCanvas = (e) => {
    const r = liveRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * width,
      y: ((e.clientY - r.top) / r.height) * height,
    };
  };

  const onDown = (e) => {
    e.preventDefault();
    liveRef.current.setPointerCapture(e.pointerId);
    onPointerDown(toCanvas(e), e);
  };
  const onMove = (e) => {
    onPointerMove(toCanvas(e), e);
  };
  const onUp = (e) => {
    onPointerUp(toCanvas(e), e);
  };

  const displayW = width * zoom;
  const displayH = height * zoom;

  return (
    <div ref={wrapRef} className="canvas-wrap">
      <div className="canvas-stage" style={{ width: displayW, height: displayH }}>
        <canvas
          ref={baseRef}
          width={width} height={height}
          style={{ width: displayW, height: displayH }}
          className="canvas-base"
        />
        <canvas
          ref={liveRef}
          width={width} height={height}
          style={{ width: displayW, height: displayH }}
          className="canvas-live"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {showCenter && (
          <CenterMarker
            x={sym.center.x * zoom}
            y={sym.center.y * zoom}
            mode={sym.mode}
            points={sym.points}
            w={width * zoom}
            h={height * zoom}
          />
        )}
      </div>
    </div>
  );
}

function CenterMarker({ x, y, mode, points, w, h }) {
  // visual indicator of symmetry center + axes / cells
  const lines = [];
  if (mode === "cyclic") {
    const n = Math.max(2, Math.round(points));
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      lines.push({ x1: x, y1: y, x2: x + Math.cos(a) * 60, y2: y + Math.sin(a) * 60 });
    }
  } else if (mode === "mirror") {
    const n = Math.max(2, Math.round(points));
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * i) / n;
      lines.push({
        x1: x - Math.cos(a) * 80, y1: y - Math.sin(a) * 80,
        x2: x + Math.cos(a) * 80, y2: y + Math.sin(a) * 80,
      });
    }
  }
  return (
    <svg className="center-overlay" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {mode === "tile" && (() => {
        const n = Math.max(1, Math.round(points));
        const cw = w / n, ch = h / n;
        const els = [];
        for (let i = 1; i < n; i++) {
          els.push(<line key={`v${i}`} x1={cw * i} y1={0} x2={cw * i} y2={h} className="center-grid" />);
          els.push(<line key={`h${i}`} x1={0} y1={ch * i} x2={w} y2={ch * i} className="center-grid" />);
        }
        return els;
      })()}
      {lines.map((l, i) => (
        <line key={i} {...l} className="center-axis" />
      ))}
      <circle cx={x} cy={y} r={9} className="center-ring" />
      <circle cx={x} cy={y} r={2} className="center-dot" />
      <line x1={x - 14} y1={y} x2={x - 5} y2={y} className="center-cross" />
      <line x1={x + 5} y1={y} x2={x + 14} y2={y} className="center-cross" />
      <line x1={x} y1={y - 14} x2={x} y2={y - 5} className="center-cross" />
      <line x1={x} y1={y + 5} x2={x} y2={y + 14} className="center-cross" />
    </svg>
  );
}

Object.assign(window, { DrawCanvas, getTransforms });
