import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { SPEC_VERSION, validateSpec, type MandalaSpec } from '../api/spec';

export function IO() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportSpec = () => {
    const { width, height, background, commands, symmetry } = useStore.getState();
    const spec: MandalaSpec = {
      version: SPEC_VERSION,
      width,
      height,
      background,
      symmetryDefaults: {
        mode: symmetry.mode,
        slices: symmetry.slices,
        tileW: symmetry.tileW,
        tileH: symmetry.tileH,
      },
      commands,
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symmetrox-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const result = validateSpec(raw);
      if (!result.ok) {
        const head = result.errors[0];
        setError(`${head.path || 'spec'}: ${head.message}`);
        return;
      }
      const { spec } = result;
      useStore.getState().loadSpec({
        width: spec.width,
        height: spec.height,
        background: spec.background,
        commands: spec.commands,
        symmetryDefaults: spec.symmetryDefaults,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title={error ?? 'Load a mandala JSON spec'}
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
      >
        Import
      </button>
      <button
        type="button"
        onClick={exportSpec}
        title="Save current canvas as a mandala JSON spec"
        className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
      >
        Export
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = '';
        }}
      />
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
