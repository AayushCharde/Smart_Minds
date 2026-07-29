import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Crown, ChevronRight, Star, Medal, Award, User } from 'lucide-react';

const rankConfig = [
  { icon: Crown, gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  { icon: Medal, gradient: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
  { icon: Award, gradient: 'linear-gradient(135deg, #CD7F32, #B8860B)' },
];

function RadialScore({ score, size = 40, strokeWidth = 3, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

export default function TopCandidates({ candidates }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.accent;
    if (score >= 40) return theme.colors.warning;
    return theme.colors.danger;
  };

  const getInitials = (name) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getInitialColor = (name) => {
    const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#06B6D4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.colors.bgCard,
        boxShadow: theme.colors.cardShadow,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.warning}15` }}
          >
            <Star size={14} style={{ color: theme.colors.warning }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
              Top Candidates
            </h3>
            <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
              Highest scoring profiles
            </p>
          </div>
        </div>
      </div>

      {!candidates || candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: theme.colors.bgTertiary }}
          >
            <User size={20} style={{ color: theme.colors.textMuted }} />
          </div>
          <p className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
            No scored candidates yet
          </p>
          <p className="text-[10px] mt-1" style={{ color: theme.colors.textMuted }}>
            Match candidates against a job description to see rankings
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((c, i) => {
            const isExpanded = expanded === c.id;
            const scoreColor = getScoreColor(c.avg_score);
            const RankIcon = rankConfig[i]?.icon;
            const initColor = getInitialColor(c.name);

            return (
              <div key={c.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] group text-left"
                  style={{
                    backgroundColor: isExpanded ? `${theme.colors.accent}08` : theme.colors.bgTertiary,
                    border: `1px solid ${isExpanded ? `${theme.colors.accent}20` : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                  }}
                >
                  {/* Rank badge */}
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${initColor}40, ${initColor}20)`,
                        color: initColor,
                      }}
                    >
                      {getInitials(c.name)}
                    </div>
                    {RankIcon && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: rankConfig[i].gradient }}
                      >
                        <RankIcon size={8} style={{ color: '#FFF' }} />
                      </div>
                    )}
                  </div>

                  {/* Name + skills */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                      {c.name}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(c.skills || []).slice(0, 3).map((skill, j) => (
                        <span
                          key={j}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: theme.colors.tags[j % theme.colors.tags.length],
                            color: theme.colors.tagText[j % theme.colors.tagText.length],
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 flex items-center gap-2">
                    <RadialScore score={c.avg_score} color={scoreColor} />
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      style={{ color: theme.colors.textMuted }}
                    />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="mx-3 mt-1 mb-1 p-3 rounded-lg animate-slide-down"
                    style={{
                      backgroundColor: theme.colors.bgTertiary,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: theme.colors.textMuted }}>
                          All Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(c.skills || []).map((skill, j) => (
                            <span
                              key={j}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: theme.colors.tags[j % theme.colors.tags.length],
                                color: theme.colors.tagText[j % theme.colors.tagText.length],
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <p className="text-2xl font-bold" style={{ color: scoreColor }}>
                          {c.avg_score}%
                        </p>
                        <p className="text-[9px]" style={{ color: theme.colors.textMuted }}>
                          Avg Score
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
