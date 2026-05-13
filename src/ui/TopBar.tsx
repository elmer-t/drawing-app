import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { SymmetryMode } from '../commands/types';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';
import { BrushPreview } from './BrushPreview';
import {
  BrandMark,
  ExportIcon,
  ImportIcon,
  MonitorIcon,
  MoonIcon,
  NewIcon,
  RedoIcon,
  SavePngIcon,
  SunIcon,
  SymCyclicIcon,
  SymMirrorIcon,
  SymOffIcon,
  SymTileIcon,
  TargetIcon,
  TrashIcon,
  UndoIcon,
} from './Icons';
import type { ThemeMode } from '../state/store';
import { SPEC_VERSION, validateSpec, type MandalaSpec } from '../api/spec';

const SYM_OPTIONS = [
  { value: 'off' as SymmetryMode, label: 'Off', short: 'OFF', icon: SymOffIcon },
  { value: 'cyclic' as SymmetryMode, label: 'Cyclic', short: 'CYC', icon: SymCyclicIcon },
  { value: 'mirror' as SymmetryMode, label: 'Mirror', short: 'MIR', icon: SymMirrorIcon },
  { value: 'tile' as SymmetryMode, label: 'Tile', short: 'TIL', icon: SymTileIcon },
];

const THEME_OPTIONS = [
  { value: 'system' as ThemeMode, label: 'System', icon: MonitorIcon },
  { value: 'light' as ThemeMode, label: 'Light', icon: SunIcon },
  { value: 'dark' as ThemeMode, label: 'Dark', icon: MoonIcon },
];

export function TopBar() {
  const tool = useStore((s) => s.activeTool);
  const brushSize = useStore((s) => s.brushSize);
  const setBrushSize = useStore((s) => s.setBrushSize);
  const foreground = useStore((s) => s.foreground);

  const symmetry = useStore((s) => s.symmetry);
  const setSymmetryMode = useStore((s) => s.setSymmetryMode);
  const setSymmetrySlices = useStore((s) => s.setSymmetrySlices);
  const setSymmetryTileUniform = useStore((s) => s.setSymmetryTileUniform);
  const centerPlacementActive = useStore((s) => s.centerPlacementActive);
  const setCenterPlacementActive = useStore((s) => s.setCenterPlacementActive);

  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);

  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clear = useStore((s) => s.clear);
  const canUndo = useStore((s) => s.commands.length > 0);
  const canRedo = useStore((s) => s.redoStack.length > 0);

  const loadSpec = useStore((s) => s.loadSpec);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [ioError, setIoError] = useState<string | null>(null);

  function exportSpec() {
    const state = useStore.getState();
    const spec: MandalaSpec = {
      version: SPEC_VERSION,
      width: state.width,
      height: state.height,
      background: state.background,
      symmetryDefaults: {
        mode: state.symmetry.mode,
        slices: state.symmetry.slices,
        tileW: state.symmetry.tileW,
        tileH: state.symmetry.tileH,
      },
      commands: state.commands,
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symmetrox-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File) {
    setIoError(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const result = validateSpec(raw);
      if (!result.ok) {
        const head = result.errors[0];
        setIoError(`${head.path || 'spec'}: ${head.message}`);
        return;
      }
      const { spec } = result;
      loadSpec({
        width: spec.width,
        height: spec.height,
        background: spec.background,
        commands: spec.commands,
        symmetryDefaults: spec.symmetryDefaults,
      });
    } catch (e) {
      setIoError(e instanceof Error ? e.message : String(e));
    }
  }

  function newDoc() {
    if (!window.confirm('Clear the canvas and start over?')) return;
    const state = useStore.getState();
    loadSpec({
      width: state.width,
      height: state.height,
      background: state.background,
      commands: [],
    });
  }

  function savePng() {
    // Canvas listens for this and snapshots its committed layer.
    window.dispatchEvent(new CustomEvent('symmetrox:save-png'));
  }

  function clearWithConfirm() {
    if (!window.confirm('Clear all strokes? This can be undone.')) return;
    clear();
  }

  const pointsLabel =
    symmetry.mode === 'mirror'
      ? 'AXES'
      : symmetry.mode === 'cyclic'
        ? 'FOLDS'
        : symmetry.mode === 'tile'
          ? 'TILE'
          : '';
  const pointsMax = 24;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <BrandMark size={20} />
        </span>
        <span className="brand-name">SYMMETROX</span>
      </div>

      <Divider />

      <div className="tb-group" role="group" aria-label="File">
        <ToolBtn label="New canvas" onClick={newDoc} hint="New canvas">
          <NewIcon size={16} />
        </ToolBtn>
        <ToolBtn
          label="Import"
          onClick={() => fileInputRef.current?.click()}
          hint={ioError ?? 'Import a JSON spec'}
        >
          <ImportIcon size={16} />
        </ToolBtn>
        <ToolBtn label="Save PNG" onClick={savePng} hint="Save canvas as PNG">
          <SavePngIcon size={16} />
        </ToolBtn>
        <ToolBtn label="Export JSON" onClick={exportSpec} hint="Export current canvas as JSON spec">
          <ExportIcon size={16} />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <Divider />

      <div className="tb-group" role="group" aria-label="Edit">
        <ToolBtn label="Undo" hint="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <UndoIcon size={16} />
        </ToolBtn>
        <ToolBtn label="Redo" hint="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <RedoIcon size={16} />
        </ToolBtn>
        <ToolBtn label="Clear" hint="Clear canvas" onClick={clearWithConfirm} danger>
          <TrashIcon size={16} />
        </ToolBtn>
      </div>

      <Divider />

      <div className="tb-group" aria-label="Brush">
        <BrushPreview size={brushSize} color={foreground} tool={tool} />
        <Stepper
          label="SIZE"
          value={brushSize}
          min={1}
          max={64}
          suffix="px"
          sliderWidth={88}
          onChange={setBrushSize}
        />
      </div>

      <Divider />

      <div className="tb-group" aria-label="Symmetry">
        <div className="tb-group-label">SYMMETRY</div>
        <Segmented
          value={symmetry.mode}
          options={SYM_OPTIONS}
          onChange={setSymmetryMode}
          ariaLabel="Symmetry mode"
        />
        {symmetry.mode === 'cyclic' || symmetry.mode === 'mirror' ? (
          <Stepper
            label={pointsLabel}
            value={symmetry.slices}
            min={2}
            max={pointsMax}
            sliderWidth={80}
            onChange={setSymmetrySlices}
          />
        ) : null}
        {symmetry.mode === 'tile' ? (
          <Stepper
            label={pointsLabel}
            value={symmetry.tileW}
            min={8}
            max={512}
            step={8}
            suffix="px"
            sliderWidth={80}
            onChange={setSymmetryTileUniform}
          />
        ) : null}
        {symmetry.mode !== 'off' ? (
          <ToolBtn
            label="Place center"
            hint="Click on canvas to set symmetry center"
            active={centerPlacementActive}
            onClick={() => setCenterPlacementActive(!centerPlacementActive)}
          >
            <TargetIcon size={16} />
          </ToolBtn>
        ) : null}
      </div>

      <div className="tb-spacer" />

      <div className="tb-group">
        <Segmented
          value={themeMode}
          options={THEME_OPTIONS}
          onChange={setThemeMode}
          size="sm"
          iconOnly
          ariaLabel="Theme"
        />
      </div>
    </header>
  );
}

function Divider() {
  return <span className="topbar-div" aria-hidden />;
}

function ToolBtn({
  label,
  hint,
  onClick,
  disabled,
  active,
  danger,
  children,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const cls = ['tb', active ? 'is-active' : '', danger ? 'is-danger' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={cls}
      title={hint ?? label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
