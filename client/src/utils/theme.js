const THEME_KEY = "theme";

const applyTheme = (dark) => {
  const root = typeof document !== "undefined" ? document.documentElement : null;
  if (!root) return;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
};

export const getTheme = () => {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(THEME_KEY) : null;
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
};

export const applySavedTheme = () => applyTheme(getTheme());

export const setTheme = (dark) => {
  window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  applyTheme(dark);
};