import { useTheme } from '../../context/ThemeContext';
import { Brain } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text }) {
  const { theme } = useTheme();
  const sizes = {
    sm: { spinner: 'w-5 h-5 border-2', icon: 0 },
    md: { spinner: 'w-10 h-10 border-[3px]', icon: 0 },
    lg: { spinner: 'w-14 h-14 border-4', icon: 20 },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <div
          className={`${s.spinner} rounded-full animate-spin`}
          style={{
            borderColor: `${theme.colors.accent}20`,
            borderTopColor: theme.colors.accent,
          }}
        />
        {s.icon > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={s.icon} style={{ color: theme.colors.accent, opacity: 0.6 }} />
          </div>
        )}
      </div>
      {text && (
        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
          {text}
        </p>
      )}
    </div>
  );
}
