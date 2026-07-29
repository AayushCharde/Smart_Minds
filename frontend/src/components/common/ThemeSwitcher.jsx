import { useState } from 'react';
import { Palette, Sun, Moon, ChevronUp, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, themeName, switchTheme, isDark, toggleDarkMode, themeOrder, themes: allThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group"
        style={{
          backgroundColor: theme.colors.bgTertiary,
          color: theme.colors.textSecondary,
          border: `1px solid ${isOpen ? theme.colors.accent + '40' : 'transparent'}`,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = theme.colors.bgHover;
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
        }}
      >
        <div className="flex items-center gap-2">
          <Palette size={13} style={{ color: theme.colors.accent }} />
          <span>{allThemes[themeName].name}</span>
        </div>
        <ChevronUp
          size={12}
          className="transition-transform duration-200"
          style={{
            color: theme.colors.textMuted,
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        />
      </button>

      {/* Theme Panel — slides up from the button */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-xl p-3 animate-slide-down z-50"
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.colors.dropShadow,
          }}
        >
          {/* Header with dark mode toggle */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.colors.textMuted }}
            >
              Appearance
            </span>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgTertiary}
            >
              {isDark ? <Sun size={10} /> : <Moon size={10} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {themeOrder.map((key) => {
              const t = allThemes[key];
              const isSelected = themeName === key;

              return (
                <button
                  key={key}
                  onClick={() => {
                    switchTheme(key);
                    setIsOpen(false);
                  }}
                  className="relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200 text-left group"
                  style={{
                    backgroundColor: isSelected
                      ? `${theme.colors.accent}12`
                      : 'transparent',
                    border: `1px solid ${isSelected ? `${theme.colors.accent}40` : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Mini preview swatch */}
                  <div
                    className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      background: t.colors.bgPrimary,
                      border: `1px solid ${t.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.secondary || t.colors.accent})`,
                      }}
                    />
                  </div>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span
                        className="text-[10px] font-semibold truncate"
                        style={{ color: isSelected ? theme.colors.accent : theme.colors.textPrimary }}
                      >
                        {t.name}
                      </span>
                      {isSelected && (
                        <Check size={9} style={{ color: theme.colors.accent }} />
                      )}
                    </div>
                    <span className="text-[8px]" style={{ color: theme.colors.textMuted }}>
                      {t.type === 'light' ? '☀' : '🌙'} {t.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
