export type Theme = "light" | "dark" | "system";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.remove("light", "dark");
  root.classList.add(isDark ? "dark" : "light");
}

export function setTheme(theme: Theme): void {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}
