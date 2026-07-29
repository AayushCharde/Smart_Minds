import { useTheme } from '../../context/ThemeContext';
import { Upload, ScanSearch, Target, Trophy } from 'lucide-react';

const stages = [
  { key: 'uploaded', label: 'Uploaded', icon: Upload, description: 'Resumes received' },
  { key: 'screened', label: 'Screened', icon: ScanSearch, description: 'AI-parsed profiles' },
  { key: 'matched', label: 'Matched', icon: Target, description: 'Scored against JDs' },
  { key: 'shortlisted', label: 'Top Rated', icon: Trophy, description: 'Score ≥ 70%' },
];

export default function PipelineOverview({ stats }) {
  const { theme } = useTheme();

  const totalResumes = stats?.total_resumes || 0;
  const topCandidates = stats?.top_candidates?.length || 0;
  const scoredCandidates = stats?.scored_candidates || 0;
  const strongMatches = stats?.strong_matches || 0;

  // Derive pipeline numbers from real data
  const stageValues = {
    uploaded: totalResumes,
    screened: totalResumes, // all uploaded resumes are auto-screened
    matched: scoredCandidates, // candidates scored against at least one JD
    shortlisted: strongMatches > 0 ? strongMatches : topCandidates,
  };

  const maxVal = Math.max(...Object.values(stageValues), 1);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.colors.bgCard,
        boxShadow: theme.colors.cardShadow,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.colors.textPrimary }}>
            Recruitment Pipeline
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
            Candidate journey overview
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, i) => {
          const value = stageValues[stage.key];
          const percentage = maxVal > 0 ? (value / maxVal) * 100 : 0;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${theme.colors.accent}${15 + i * 5 > 30 ? 30 : 15 + i * 5}`,
                  }}
                >
                  <Icon size={14} style={{ color: theme.colors.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stage.label}
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: theme.colors.accent }}>
                      {value}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="ml-11">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${theme.colors.accent}10` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(percentage, value > 0 ? 8 : 0)}%`,
                      background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.secondary || theme.colors.accent})`,
                      opacity: 0.8 + (i * 0.05),
                    }}
                  />
                </div>
              </div>

              {/* Connector line between stages */}
              {i < stages.length - 1 && (
                <div className="flex items-center ml-[18px] my-1">
                  <div className="w-px h-3" style={{ backgroundColor: `${theme.colors.accent}20` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
