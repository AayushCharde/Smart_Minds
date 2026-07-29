import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from '../../context/ThemeContext';

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue) || numericValue === 0) {
      setDisplay(0);
      return;
    }

    const startTime = performance.now();
    const isFloat = !Number.isInteger(numericValue);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * numericValue;

      setDisplay(isFloat ? parseFloat(current.toFixed(1)) : Math.round(current));

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

function MiniBar({ value, maxValue, color }) {
  const bars = 7;
  const normalized = maxValue > 0 ? value / maxValue : 0;

  return (
    <div className="flex items-end gap-[2px] h-5">
      {Array.from({ length: bars }).map((_, i) => {
        const barRatio = (i + 1) / bars;
        const isActive = barRatio <= normalized + 0.1;
        // Create a wave-like pattern
        const height = 20 + (i % 3 === 0 ? 60 : i % 3 === 1 ? 80 : 40);

        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-500"
            style={{
              height: `${height}%`,
              backgroundColor: isActive ? `${color}${60 + i * 5 > 99 ? 99 : 60 + i * 5}` : `${color}15`,
              transitionDelay: `${i * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

const StatCard = memo(function StatCard({ title, value, icon: Icon, color, subtitle, maxValue = 100 }) {
  const { theme } = useTheme();

  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace('%', '').replace('—', '0'))
    : value;

  const isPercentage = typeof value === 'string' && value.includes('%');
  const isDash = value === '—';

  return (
    <div
      className="relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group overflow-hidden cursor-default"
      style={{
        backgroundColor: theme.colors.bgCard,
        boxShadow: theme.colors.cardShadow,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Top gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}66, transparent)` }}
      />

      {/* Subtle background glow on hover */}
      <div
        className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 blur-2xl"
        style={{ background: color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundColor: `${color}12` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <MiniBar value={numericValue || 0} maxValue={maxValue} color={color} />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: theme.colors.textMuted }}>
          {title}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: theme.colors.textPrimary }}>
            {isDash ? '—' : <AnimatedNumber value={numericValue} />}
          </span>
          {isPercentage && !isDash && (
            <span className="text-sm font-semibold" style={{ color: theme.colors.textMuted }}>%</span>
          )}
        </div>

        {subtitle && (
          <p className="text-[10px] mt-1.5" style={{ color: theme.colors.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
});

export default StatCard;
