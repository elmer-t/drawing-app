import { useStore } from '../state/store';

export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="px-3 py-1.5 rounded text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}
