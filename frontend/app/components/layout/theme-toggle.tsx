import { useEffect, useState } from "react";
import { type Theme, applyTheme, getStoredTheme, setTheme } from "../../lib/theme";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];
const THEME_ICONS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "🖥️",
};
const THEME_LABELS: Record<Theme, string> = {
  light: "ライトモード",
  dark: "ダークモード",
  system: "システム設定",
};

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const handleClick = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    setThemeState(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
      title={THEME_LABELS[theme]}
      data-testid="theme-toggle"
    >
      <span>{THEME_ICONS[theme]}</span>
      <span className="hidden sm:inline">{THEME_LABELS[theme]}</span>
    </button>
  );
}
