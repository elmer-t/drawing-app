// Symmetrox — main app
const { useState: useS, useEffect: useE, useRef: useR, useCallback: useCb, useMemo } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "canvasW": 1600,
  "canvasH": 1000,
  "strokeColor": "#e91e63",
  "canvasColor": "#0a0a0a",
  "tool": "pencil",
  "brushSize": 4,
  "symMode": "cyclic",
  "symPoints": 6
}/*EDITMODE-END*/;

function App() {
  // --- state ---
  const [tool, setTool] = useS(DEFAULTS.tool);
  const [brushSize, setBrushSize] = useS(DEFAULTS.brushSize);
  const [strokeColor, setStrokeColor] = useS(DEFAULTS.strokeColor);
  const [canvasColor, setCanvasColor] = useS(DEFAULTS.canvasColor);
  const [theme, setTheme] = useS("dark");
  const [placingCenter, setPlacingCenter] = useS(false);

  const [symMode, setSymMode] = useS(DEFAULTS.symMode);
  const [symPoints, setSymPoints] = useS(DEFAULTS.symPoints);
  const [symCenter, setSymCenter] = useS({ x: DEFAULTS.canvasW / 2, y: DEFAULTS.canvasH / 2 });

  const [dims] = useS({ w: DEFAULTS.canvasW, h: DEFAULTS.canvasH });
  const [zoomRaw, setZoomRaw] = useS(1);
  const [strokes, setStrokes] = useS([]);
  const [redo, setRedo] = useS([]);
  const [liveStroke, setLiveStroke] = useS(null);
  const [coords, setCoords] = useS({ x: 0, y: 0 });
  const [recentColors, setRecentColors] = useS([]);

  const canvasElRef = useR(null);
  const stageRef = useR(null);

  const sym = { mode: symMode, points: symPoints, center: symCenter };

  // --- theme application ---
  useE(() => {
    const root = document.documentElement;
    const apply = () => {
      const effective = theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
      root.setAttribute("data-theme", effective);
    };
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  // --- fit-to-screen zoom ---
  useE(() => {
    if (zoomRaw !== "fit") return;
    const fit = () => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      const pad = 80;
      const z = Math.min((r.width - pad) / dims.w, (r.height - pad) / dims.h, 1);
      setZoomRaw(Math.max(0.1, z));
    };
    fit();
  }, [zoomRaw, dims]);

  // initial fit
  useE(() => {
    const t = setTimeout(() => setZoomRaw("fit"), 30);
    return () => clearTimeout(t);
  }, []);

  const zoom = typeof zoomRaw === "number" ? zoomRaw : 1;

  // --- pointer flow ---
  const onPointerDown = (p, e) => {
    if (placingCenter) {
      setSymCenter({
        x: Math.max(0, Math.min(dims.w, p.x)),
        y: Math.max(0, Math.min(dims.h, p.y)),
      });
      setPlacingCenter(false);
      return;
    }

    if (tool === "eyedrop") {
      const c = canvasElRef.current;
      if (c) {
        const ctx = c.getContext("2d");
        try {
          const d = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
          const hex = "#" + [d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, "0")).join("");
          setStrokeColor(hex);
          pushRecent(hex);
        } catch (err) { /* CORS-safe canvas, should be fine */ }
        setTool("pencil");
      }
      return;
    }

    if (tool === "fill") {
      const c = canvasElRef.current;
      if (c) {
        floodFillCanvas(c, Math.floor(p.x), Math.floor(p.y), strokeColor);
        // we sidestep stroke history for fills by replacing the base canvas snapshot
        // (kept simple: push as a 'snapshot' stroke pulling current bitmap)
        commitSnapshot(c);
      }
      return;
    }

    setLiveStroke({ tool, color: strokeColor, size: brushSize, points: [p] });
  };

  const onPointerMove = (p, e) => {
    setCoords(p);
    if (!liveStroke) return;
    setLiveStroke((s) => ({ ...s, points: [...s.points, p] }));
  };

  const onPointerUp = (p, e) => {
    if (!liveStroke) return;
    setStrokes((arr) => [...arr, liveStroke]);
    setRedo([]);
    setLiveStroke(null);
    pushRecent(strokeColor);
  };

  const pushRecent = (c) => {
    setRecentColors((r) => {
      const out = [c, ...r.filter((x) => x.toLowerCase() !== c.toLowerCase())];
      return out.slice(0, 8);
    });
  };

  // --- "fill" needs to read pixels then write a snapshot stroke ---
  // We model fill as a special stroke type that captures the pre-fill image
  // and the post-fill image; for simplicity, just store as a pre-rendered layer.
  const snapshots = useR([]);
  const commitSnapshot = (c) => {
    // Quick & dirty: persist the painted result as a new "image" stroke.
    const img = new Image();
    img.src = c.toDataURL();
    img.onload = () => {
      setStrokes((arr) => [...arr, { tool: "image", img, w: dims.w, h: dims.h }]);
      setRedo([]);
    };
  };

  // --- undo / redo / clear ---
  const onUndo = () => {
    if (strokes.length === 0) return;
    setRedo((r) => [strokes[strokes.length - 1], ...r]);
    setStrokes((arr) => arr.slice(0, -1));
  };
  const onRedo = () => {
    if (redo.length === 0) return;
    setStrokes((arr) => [...arr, redo[0]]);
    setRedo((r) => r.slice(1));
  };
  const onClear = () => {
    if (strokes.length === 0) return;
    if (window.confirm("Clear the canvas? This cannot be undone.")) {
      setStrokes([]); setRedo([]);
    }
  };

  // --- export / import ---
  const onExport = () => {
    const c = canvasElRef.current;
    if (!c) return;
    const link = document.createElement("a");
    link.download = `symmetrox-${Date.now()}.png`;
    link.href = c.toDataURL("image/png");
    link.click();
  };
  const onImport = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        setStrokes((arr) => [...arr, { tool: "image", img, w: dims.w, h: dims.h, fit: true }]);
      };
      img.src = url;
    };
    inp.click();
  };

  // --- keyboard shortcuts ---
  useE(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); onUndo(); }
      else if (meta && (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); onRedo(); }
      else if (e.key === "[") setBrushSize((s) => Math.max(1, s - 1));
      else if (e.key === "]") setBrushSize((s) => Math.min(64, s + 1));
      else if (e.key.toLowerCase() === "x") { const s = strokeColor; setStrokeColor(canvasColor); setCanvasColor(s); }
      else {
        const map = { p: "pencil", b: "brush", m: "marker", s: "spray", e: "eraser", i: "eyedrop", f: "fill" };
        const t = map[e.key.toLowerCase()];
        if (t) setTool(t);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [strokes, redo]);

  // --- aggregator for top bar ---
  const app = { tool, brushSize, strokeColor, canvasColor, placingCenter };
  const set = {
    brushSize: setBrushSize,
    strokeColor: setStrokeColor,
    canvasColor: setCanvasColor,
    swap: () => { const s = strokeColor; setStrokeColor(canvasColor); setCanvasColor(s); },
    toggleCenterPlace: () => setPlacingCenter((v) => !v),
    newDoc: () => {
      if (strokes.length === 0 || window.confirm("Start a new canvas? Current work will be discarded.")) {
        setStrokes([]); setRedo([]); setSymCenter({ x: dims.w / 2, y: dims.h / 2 });
      }
    },
  };
  const setSym = {
    mode: setSymMode,
    points: setSymPoints,
  };

  return (
    <div className="app">
      <TopBar
        app={app} set={set}
        sym={sym} setSym={setSym}
        theme={theme} setTheme={setTheme}
        onUndo={onUndo} onRedo={onRedo}
        canUndo={strokes.length > 0}
        canRedo={redo.length > 0}
        onClear={onClear}
        onExport={onExport}
        onImport={onImport}
        recentColors={recentColors}
        onRecent={pushRecent}
      />
      <main className="workspace">
        <LeftRail
          tool={tool} setTool={setTool}
          strokeColor={strokeColor} canvasColor={canvasColor}
          onStroke={setStrokeColor} onCanvas={setCanvasColor}
          onSwap={() => { const s = strokeColor; setStrokeColor(canvasColor); setCanvasColor(s); }}
          recentColors={recentColors} onRecent={pushRecent}
        />
        <section className="stage" ref={stageRef}>
          <DrawCanvas
            width={dims.w}
            height={dims.h}
            canvasColor={canvasColor}
            theme={theme}
            strokes={strokes}
            liveStroke={liveStroke}
            sym={sym}
            zoom={zoom}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            showCenter={symMode !== "off" || placingCenter}
            onCanvasReady={(c) => { canvasElRef.current = c; }}
          />
          {placingCenter && (
            <div className="placing-hint">CLICK ON THE CANVAS TO SET CENTER · ESC TO CANCEL</div>
          )}
        </section>
      </main>
      <StatusBar
        app={app} sym={sym}
        zoom={zoom} setZoom={setZoomRaw}
        coords={coords} dims={dims}
      />
    </div>
  );
}

// --- helpers ---
function floodFillCanvas(canvas, sx, sy, fillHex) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const i0 = (sy * w + sx) * 4;
  const tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
  const [fr, fg, fb] = hexToRgb(fillHex);
  if (tr === fr && tg === fg && tb === fb) return;
  const stack = [[sx, sy]];
  const tol = 4;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    if (Math.abs(d[i] - tr) > tol || Math.abs(d[i + 1] - tg) > tol ||
        Math.abs(d[i + 2] - tb) > tol || Math.abs(d[i + 3] - ta) > tol) continue;
    d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(img, 0, 0);
}
function hexToRgb(h) {
  const m = h.replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
