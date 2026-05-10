import type { ComponentType, SVGProps } from 'react';
import { useStore, type ThemeMode } from '../state/store';
import { MoonIcon, SunIcon, SystemIcon } from './Icons';

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const OPTIONS: { mode: ThemeMode; label: string; Icon: IconCmp }[] = [
  { mode: 'system', label: 'System', Icon: SystemIcon },
  { mode: 'light', label: 'Light', Icon: SunIcon },
  { mode: 'dark', label: 'Dark', Icon: MoonIcon },
];

export function ThemeToggle() {
  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = themeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            aria-label={label}
            onClick={() => setThemeMode(mode)}
            className={`grid place-items-center h-7 w-7 rounded-full transition ${
              active
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
