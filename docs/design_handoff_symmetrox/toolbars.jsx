// Top app bar, left tool rail, status bar -- the dense tool-palette chrome.
const { useState: useStateT, useRef: useRefT, useEffect: useEffectT } = React;

// Compact icon button used throughout the chrome.
function ToolBtn({ icon: I, label, active, disabled, onClick, danger, wide, children, hint }) {
  return (
    <button
      className={`tb ${active ? "is-active" : ""} ${danger ? "is-danger" : ""} ${wide ? "is-wide" : ""}`}
      onClick={onClick} disabled={disabled} title={hint || label}
      aria-label={label}
    >
      {I && <I size={16} />}
      {children}
    </button>
  );
}

// Segmented control (used for symmetry mode + theme).
function Segmented({ value, options, onChange, size = "md", iconOnly = false }) {
  return (
    <div className={`seg seg-${size} ${iconOnly ? "seg-icononly" : ""}`} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`seg-btn ${value === opt.value ? "is-on" : ""}`}
          onClick={() => onChange(opt.value)}
          title={opt.label}
          aria-checked={value === opt.value}
          role="radio"
        >
          {opt.icon ? <opt.icon size={iconOnly ? 14 : 13} /> : null}
          {!iconOnly && (opt.short || opt.label)}
        </button>
      ))}
    </div>
  );
}

// Dense numeric stepper with slider underneath for fine control.
function NumStepper({ label, value, min, max, step = 1, onChange, suffix, width = 96 }) {
  return (
    <div className="stepper">
      <div className="stepper-label">{label}</div>
      <button className="stepper-mini" onClick={() => onChange(Math.max(min, value - step))} aria-label="decrease">−</button>
      <div className="stepper-val">
        <span className="num">{value}</span>{suffix && <span className="suf">{suffix}</span>}
      </div>
      <button className="stepper-mini" onClick={() => onChange(Math.min(max, value + step))} aria-label="increase">+</button>
      <input
        type="range"
        className="stepper-range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width }}
      />
    </div>
  );
}

// Color chip + popover with curated palette + hex input.
const PALETTE = [
  // row 1 — base
  "#0a0a0a", "#3a3a3a", "#6a6a6a", "#a8a8a8", "#dcdcdc", "#ffffff",
  // row 2 — warm
  "#7a1f1f", "#c0392b", "#e74c3c", "#f39c12", "#f1c40f", "#fff2a8",
  // row 3 — cool
  "#0e3a5e", "#1e6bb8", "#2ecc71", "#27ae60", "#16a085", "#1abc9c",
  // row 4 — accent
  "#4a148c", "#7b1fa2", "#c2185b", "#e91e63", "#ff5e9c", "#ff8fb8",
];

function ColorChip({ label, value, onChange, anchor = "down", recent = [], onRecent, size = "md" }) {
  const [open, setOpen] = useStateT(false);
  const [hex, setHex] = useStateT(value);
  const wrapRef = useRefT(null);

  useEffectT(() => { setHex(value); }, [value]);
  useEffectT(() => {
    if (!open) return;
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const commit = (h) => {
    if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(h)) {
      onChange(h);
      onRecent && onRecent(h);
    }
  };

  return (
    <div className={`chip-wrap chip-wrap-${size}`} ref={wrapRef}>
      <button
        className={`chip chip-${size}`}
        style={{ "--c": value }}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${value}`}
        title={`${label} — ${value.toUpperCase()}`}
      >
        <span className="chip-sw" />
      </button>
      {open && (
        <div className={`chip-pop chip-pop-${anchor}`}>
          <div className="chip-pop-title">{label}</div>
          <div className="chip-grid">
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`chip-swatch ${c.toLowerCase() === value.toLowerCase() ? "is-on" : ""}`}
                style={{ background: c }}
                onClick={() => { onChange(c); onRecent && onRecent(c); }}
                title={c.toUpperCase()}
              />
            ))}
          </div>
          {recent.length > 0 && (
            <>
              <div className="chip-pop-sub">RECENT</div>
              <div className="chip-grid chip-grid-recent">
                {recent.map((c, i) => (
                  <button
                    key={i}
                    className="chip-swatch"
                    style={{ background: c }}
                    onClick={() => onChange(c)}
                  />
                ))}
              </div>
            </>
          )}
          <div className="chip-pop-sub">HEX</div>
          <div className="hex-row">
            <span className="hex-prefix">#</span>
            <input
              className="hex-input"
              value={hex.replace(/^#/, "")}
              onChange={(e) => setHex("#" + e.target.value)}
              onBlur={() => commit(hex)}
              onKeyDown={(e) => e.key === "Enter" && commit(hex)}
              maxLength={6}
              spellCheck={false}
            />
            <div className="hex-preview" style={{ background: hex }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Brush size preview — a dot that scales with current brush size.
function BrushPreview({ size, color, tool }) {
  const d = Math.min(28, Math.max(2, size));
  return (
    <div className="brush-prev" title={`Brush — ${size}px`}>
      <span
        className="brush-prev-dot"
        style={{
          width: d, height: d,
          background: tool === "marker" ? `${color}88` : color,
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

// Top application strip --- single dense row with grouped sections.
function TopBar({
  app, set, sym, setSym, theme, setTheme,
  onUndo, onRedo, canUndo, canRedo, onClear, onExport, onImport,
  recentColors, onRecent,
}) {
  const symModeOptions = [
    { value: "off", label: "Off", short: "OFF", icon: SymOffIcon },
    { value: "cyclic", label: "Cyclic", short: "CYC", icon: SymCyclicIcon },
    { value: "mirror", label: "Mirror", short: "MIR", icon: SymMirrorIcon },
    { value: "tile", label: "Tile", short: "TIL", icon: SymTileIcon },
  ];
  const themeOptions = [
    { value: "system", label: "System", icon: MonitorIcon },
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
  ];

  const pointsLabel = sym.mode === "tile" ? "GRID"
    : sym.mode === "cyclic" ? "FOLDS"
    : sym.mode === "mirror" ? "AXES"
    : "—";
  const pointsMax = sym.mode === "tile" ? 8 : 24;

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3l3 5.5 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-7L3 9.5l6-1L12 3z" />
            <path d="M12 3v18" strokeDasharray="2 2" opacity="0.5"/>
          </svg>
        </span>
        <span className="brand-name">SYMMETROX</span>
      </div>

      <Divider />

      {/* File group */}
      <div className="group">
        <ToolBtn icon={NewIcon} label="New" hint="New canvas" onClick={() => set.newDoc()} />
        <ToolBtn icon={ImportIcon} label="Import" hint="Import image" onClick={onImport} />
        <ToolBtn icon={ExportIcon} label="Export" hint="Export PNG" onClick={onExport} />
      </div>

      <Divider />

      {/* Edit group */}
      <div className="group">
        <ToolBtn icon={UndoIcon} label="Undo" hint="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo} />
        <ToolBtn icon={RedoIcon} label="Redo" hint="Redo (⇧⌘Z)" disabled={!canRedo} onClick={onRedo} />
        <ToolBtn icon={TrashIcon} label="Clear" hint="Clear canvas" danger onClick={onClear} />
      </div>

      <Divider />

      {/* Brush size */}
      <div className="group group-brush">
        <BrushPreview size={app.brushSize} color={app.strokeColor} tool={app.tool} />
        <NumStepper
          label="SIZE" value={app.brushSize}
          min={1} max={64}
          onChange={(v) => set.brushSize(v)}
          suffix="px" width={88}
        />
      </div>

      <Divider />

      {/* Symmetry */}
      <div className="group group-sym">
        <div className="group-label">SYMMETRY</div>
        <Segmented
          value={sym.mode}
          options={symModeOptions}
          onChange={(m) => setSym.mode(m)}
        />
        {sym.mode !== "off" && (
          <NumStepper
            label={pointsLabel}
            value={sym.points}
            min={2} max={pointsMax}
            onChange={(v) => setSym.points(v)}
            width={80}
          />
        )}
        {sym.mode !== "off" && (
          <ToolBtn
            icon={TargetIcon}
            label="Place center"
            hint="Click on canvas to set symmetry center"
            active={app.placingCenter}
            onClick={() => set.toggleCenterPlace()}
          />
        )}
      </div>

      <div className="spacer" />

      {/* Theme — compact icon-only */}
      <div className="group">
        <Segmented
          value={theme}
          options={themeOptions}
          onChange={setTheme}
          size="sm"
          iconOnly
        />
      </div>
    </header>
  );
}

function Divider() { return <span className="topbar-div" aria-hidden="true" />; }

// Left tool rail
function LeftRail({ tool, setTool, strokeColor, canvasColor, onStroke, onCanvas, onSwap, recentColors, onRecent }) {
  const tools = [
    { id: "pencil", icon: PencilIcon, label: "Pencil", key: "P" },
    { id: "brush", icon: BrushIcon, label: "Brush", key: "B" },
    { id: "marker", icon: MarkerIcon, label: "Marker", key: "M" },
    { id: "spray", icon: SprayIcon, label: "Spray", key: "S" },
    { id: "eraser", icon: EraserIcon, label: "Eraser", key: "E" },
    { id: "eyedrop", icon: EyedropIcon, label: "Eyedropper", key: "I" },
    { id: "fill", icon: FillIcon, label: "Fill", key: "F" },
  ];
  return (
    <aside className="leftrail">
      <div className="rail-tools">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`rail-btn ${tool === t.id ? "is-active" : ""}`}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            aria-label={t.label}
            aria-pressed={tool === t.id}
          >
            <t.icon size={20} />
            <span className="rail-key">{t.key}</span>
          </button>
        ))}
      </div>

      <div className="rail-divider" aria-hidden="true" />

      {/* Color pot — classic FG/BG with swap */}
      <div className="rail-colors" aria-label="Colors">
        <div className="color-pot">
          <div className="color-pot-stack">
            <ColorChip
              label="Stroke color"
              value={strokeColor}
              onChange={onStroke}
              recent={recentColors}
              onRecent={onRecent}
              anchor="right"
              size="rail"
            />
            <ColorChip
              label="Paper color"
              value={canvasColor}
              onChange={onCanvas}
              recent={recentColors}
              onRecent={onRecent}
              anchor="right"
              size="rail-back"
            />
          </div>
          <button className="rail-swap" onClick={onSwap} title="Swap colors (X)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4L4 7l3 3"/><path d="M4 7h11a3 3 0 013 3v1"/>
              <path d="M17 20l3-3-3-3"/><path d="M20 17H9a3 3 0 01-3-3v-1"/>
            </svg>
          </button>
        </div>
        <div className="rail-label">COLOR</div>
      </div>
    </aside>
  );
}

// Bottom status bar
function StatusBar({ app, sym, zoom, setZoom, coords, dims }) {
  const fmt = (n) => Math.round(n).toString().padStart(4, " ");
  return (
    <footer className="statusbar">
      <div className="status-block">
        <span className="status-k">TOOL</span>
        <span className="status-v">{app.tool.toUpperCase()}</span>
      </div>
      <div className="status-block">
        <span className="status-k">SIZE</span>
        <span className="status-v">{app.brushSize}px</span>
      </div>
      <div className="status-block">
        <span className="status-k">SYM</span>
        <span className="status-v">
          {sym.mode.toUpperCase()}{sym.mode !== "off" ? ` · ${sym.points}` : ""}
        </span>
      </div>
      <div className="status-block">
        <span className="status-k">CANVAS</span>
        <span className="status-v">{dims.w}×{dims.h}</span>
      </div>
      <div className="status-block">
        <span className="status-k">XY</span>
        <span className="status-v">{fmt(coords.x)},{fmt(coords.y)}</span>
      </div>

      <div className="status-spacer" />

      <div className="zoom-row">
        <button className="tb tb-xs" onClick={() => setZoom(zoom / 1.25)} title="Zoom out"><ZoomOutIcon size={14}/></button>
        <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
        <button className="tb tb-xs" onClick={() => setZoom(zoom * 1.25)} title="Zoom in"><ZoomInIcon size={14}/></button>
        <button className="tb tb-xs" onClick={() => setZoom(1)} title="Reset zoom"><HundredIcon size={14}/></button>
        <button className="tb tb-xs" onClick={() => setZoom("fit")} title="Fit"><FitIcon size={14}/></button>
      </div>
    </footer>
  );
}

Object.assign(window, { TopBar, LeftRail, StatusBar });
