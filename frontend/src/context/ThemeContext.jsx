import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { themes, themeOrder, lightThemes, darkThemes } from '../themes/themes';

const ThemeContext = createContext();

const STORAGE_KEY = 'hireminds-theme';

export function ThemeProvider({ children }) {
  // ─── State ───
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes[saved]) return saved;

    // Auto-detect system preference for first-time users
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'midnight';
    }
    return 'aurora';
  });

  const theme = themes[themeName] || themes.aurora;

  // Track if this is the initial mount (skip transition on first load)
  const isInitialMount = useRef(true);

  // ─── Apply theme to DOM ───
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeName);

    const root = document.documentElement;
    const body = document.body;

    // Add smooth transition class only on theme switches (not initial load)
    if (!isInitialMount.current) {
      root.classList.add('theme-transitioning');
    }

    // Apply core colors to body
    body.style.backgroundColor = theme.colors.bgPrimary;
    body.style.color = theme.colors.textPrimary;

    // Set CSS custom properties so globals.css can use them dynamically
    root.style.setProperty('--scrollbar-thumb', theme.colors.scrollbarThumb);
    root.style.setProperty('--scrollbar-track', theme.colors.scrollbarTrack);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-light', theme.colors.accentLight);
    root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--skeleton-base', theme.colors.skeletonBase);
    root.style.setProperty('--skeleton-shine', theme.colors.skeletonShine);

    // Set data attributes for CSS selectors
    root.dataset.theme = themeName;
    root.dataset.themeType = theme.type;

    // Remove transition class after animation completes
    if (!isInitialMount.current) {
      const timer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 350);
      return () => clearTimeout(timer);
    }
    isInitialMount.current = false;
  }, [themeName, theme]);

  // ─── Listen for system preference changes ───
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = (e) => {
      // Only auto-switch if user hasn't explicitly chosen a theme
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setThemeName(e.matches ? 'midnight' : 'aurora');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ─── Theme switching ───
  const switchTheme = useCallback((name) => {
    if (themes[name]) {
      setThemeName(name);
    }
  }, []);

  // Cycle to next theme in the same type (light/dark)
  const cycleTheme = useCallback(() => {
    const currentType = theme.type;
    const pool = currentType === 'light' ? lightThemes : darkThemes;
    const currentIndex = pool.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % pool.length;
    setThemeName(pool[nextIndex]);
  }, [themeName, theme.type]);

  // Toggle between light and dark (picks first of the opposite type)
  const toggleDarkMode = useCallback(() => {
    if (theme.type === 'light') {
      setThemeName('midnight');
    } else {
      setThemeName('aurora');
    }
  }, [theme.type]);

  // ─── Context value (memoized) ───
  const value = useMemo(() => ({
    theme,
    themeName,
    switchTheme,
    cycleTheme,
    toggleDarkMode,
    themes,
    themeOrder,
    lightThemes,
    darkThemes,
    isDark: theme.type === 'dark',
  }), [theme, themeName, switchTheme, cycleTheme, toggleDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
