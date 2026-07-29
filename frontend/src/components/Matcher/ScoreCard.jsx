import { useTheme } from '../../context/ThemeContext';
import MatchBadge from '../common/MatchBadge';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Target, Briefcase, GraduationCap, Award } from 'lucide-react';

function RadialProgress({ value, size = 60, strokeWidth = 5, color }) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 150);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`${color}15`} strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

function AnimatedBar({ value, max, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((value / max) * 100), 100 + delay);
    return () => clearTimeout(timer);
  }, [value, max, delay]);

  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}12` }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          transition: 'width 700ms ease-out',
        }}
      />
    </div>
  );
}

const criteriaConfig = [
  { key: 'skills_score', label: 'Skills Match', max: 40, icon: Target },
  { key: 'experience_score', label: 'Experience', max: 25, icon: Briefcase },
  { key: 'education_score', label: 'Education', max: 20, icon: GraduationCap },
  { key: 'certification_score', label: 'Certifications', max: 15, icon: Award },
];

export default function ScoreCard({ ranking, rank, rankBadge }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const scoreColor = ranking.score >= 80
    ? theme.colors.success
    : ranking.score >= 50
      ? theme.colors.warning
      : theme.colors.danger;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg group"
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.cardShadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${scoreColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      {/* Score accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}50)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          {rankBadge && <div className="flex-shrink-0">{rankBadge}</div>}

          {/* Radial score */}
          <RadialProgress value={ranking.score} color={scoreColor} />

          {/* Name + badge + criteria bars */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-bold truncate" style={{ color: theme.colors.textPrimary }}>
                {ranking.candidate_name}
              </h4>
              <MatchBadge badge={ranking.badge} />
            </div>

            {/* Criteria bars */}
            <div className="space-y-1.5">
              {criteriaConfig.map(({ key, label, max, icon: Icon }, i) => {
                const score = ranking[key] || 0;
                const barColor = (score / max) >= 0.75 ? theme.colors.success
                  : (score / max) >= 0.45 ? theme.colors.warning
                  : theme.colors.danger;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={10} className="flex-shrink-0" style={{ color: theme.colors.textMuted }} />
                    <span className="text-[10px] w-[70px] truncate" style={{ color: theme.colors.textMuted }}>
                      {label}
                    </span>
                    <div className="flex-1">
                      <AnimatedBar value={score} max={max} color={barColor} delay={i * 100} />
                    </div>
                    <span className="text-[10px] font-bold w-9 text-right tabular-nums" style={{ color: theme.colors.textSecondary }}>
                      {score}/{max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expandable AI Analysis */}
        {ranking.explanation && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.colors.border}40` }}>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: theme.colors.accent }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Sparkles size={12} />
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide' : 'View'} AI Analysis
            </button>
            {expanded && (
              <div
                className="mt-2 p-3 rounded-lg animate-slide-down"
                style={{
                  backgroundColor: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}30`,
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  {ranking.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
