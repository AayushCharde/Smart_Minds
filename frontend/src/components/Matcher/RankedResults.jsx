import { useState } from 'react';
import { Trophy, Medal, Award, Users, TrendingUp, Search, X, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ScoreCard from './ScoreCard';

function StatsBar({ rankings, theme }) {
  const avg = rankings.length > 0
    ? Math.round(rankings.reduce((s, r) => s + r.score, 0) / rankings.length)
    : 0;
  const strong = rankings.filter(r => r.score >= 80).length;
  const good = rankings.filter(r => r.score >= 50 && r.score < 80).length;
  const weak = rankings.filter(r => r.score < 50).length;

  const stats = [
    { label: 'Average', value: `${avg}%`, color: theme.colors.accent, icon: TrendingUp },
    { label: 'Strong', value: strong, color: theme.colors.success, icon: Trophy },
    { label: 'Good', value: good, color: theme.colors.warning, icon: Medal },
    { label: 'Review', value: weak, color: theme.colors.danger, icon: Award },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map(({ label, value, color, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-2 p-2.5 rounded-lg"
          style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={13} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color }}>{value}</p>
            <p className="text-[9px] uppercase tracking-wider font-medium leading-tight" style={{ color: theme.colors.textMuted }}>
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank, theme }) {
  const configs = {
    1: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', text: '#7C5C00' },
    2: { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', text: '#4A4A4A' },
    3: { bg: 'linear-gradient(135deg, #CD7F32, #B8690E)', text: '#FFFFFF' },
  };

  const config = configs[rank];

  if (config) {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm"
        style={{ background: config.bg, color: config.text }}
      >
        #{rank}
      </div>
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}
    >
      #{rank}
    </div>
  );
}

export default function RankedResults({ rankings, loading }) {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('score');

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.colors.accentLight }}
          >
            <Users size={18} className="animate-pulse" style={{ color: theme.colors.accent }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.colors.textPrimary }}>
              Scoring Candidates...
            </h3>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
              AI is analyzing each candidate against the job requirements
            </p>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-xl p-4 overflow-hidden"
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full skeleton-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="flex justify-between">
                  <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-16 rounded-md skeleton-shimmer" />
                </div>
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded skeleton-shimmer" />
                    <div className="flex-1 h-2 rounded-full skeleton-shimmer" />
                    <div className="h-2 w-8 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!rankings) {
    return (
      <div
        className="rounded-xl h-full flex flex-col items-center justify-center text-center p-8"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 animate-float"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.accent}15)`,
          }}
        >
          <Trophy size={32} style={{ color: theme.colors.accent }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
          Ready to Match
        </h3>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
          Select a job role and click "Analyze & Match" to see AI-powered candidate rankings with detailed scoring breakdowns.
        </p>
        <div className="flex gap-2 mt-5">
          {['Skills', 'Experience', 'Education', 'Certs'].map((label) => (
            <span
              key={label}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textMuted,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // No candidates
  if (rankings.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: theme.colors.bgTertiary }}
        >
          <Users size={22} style={{ color: theme.colors.textMuted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
          No candidates to rank
        </p>
        <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
          Upload some resumes first, then come back to match them
        </p>
      </div>
    );
  }

  // Filter and sort
  const filtered = searchText
    ? rankings.filter(r => r.candidate_name?.toLowerCase().includes(searchText.toLowerCase()))
    : rankings;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.candidate_name || '').localeCompare(b.candidate_name || '');
    return b.score - a.score;
  });

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.colors.accentLight }}
          >
            <Trophy size={18} style={{ color: theme.colors.accent }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.colors.textPrimary }}>
              Ranked Results
            </h3>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
              {rankings.length} candidate{rankings.length !== 1 ? 's' : ''} scored and ranked
            </p>
          </div>
        </div>

        <button
          onClick={() => setSortBy(sortBy === 'score' ? 'name' : 'score')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: theme.colors.bgTertiary,
            color: theme.colors.textSecondary,
            border: `1px solid ${theme.colors.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
        >
          <ArrowUpDown size={12} />
          {sortBy === 'score' ? 'By Score' : 'By Name'}
        </button>
      </div>

      {/* Stats */}
      <StatsBar rankings={rankings} theme={theme} />

      {/* Search filter */}
      {rankings.length > 3 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: theme.colors.bgInput,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <Search size={14} style={{ color: theme.colors.textMuted }} />
          <input
            type="text"
            placeholder="Filter candidates..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: theme.colors.textPrimary }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="p-0.5">
              <X size={13} style={{ color: theme.colors.textMuted }} />
            </button>
          )}
        </div>
      )}

      {/* Score Cards */}
      <div className="space-y-3 stagger-children">
        {sorted.map((ranking, i) => {
          const originalRank = rankings.findIndex(r => r.candidate_id === ranking.candidate_id) + 1;
          return (
            <ScoreCard
              key={ranking.candidate_id || i}
              ranking={ranking}
              rank={originalRank}
              rankBadge={<RankBadge rank={originalRank} theme={theme} />}
            />
          );
        })}
      </div>

      {filtered.length === 0 && searchText && (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            No candidates match "{searchText}"
          </p>
        </div>
      )}
    </div>
  );
}
