import { useState } from 'react';
import { Target, Sparkles, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import JDInput from './JDInput';
import RankedResults from './RankedResults';

export default function MatcherPage() {
  const { theme } = useTheme();
  const { apiFetch } = useApi();
  const { addToast } = useToast();
  const {
    matcherResults, setMatcherResults,
    matcherJobTitle, setMatcherJobTitle,
    matcherJobDesc, setMatcherJobDesc,
    invalidateStats,
  } = useApp();
  const [loading, setLoading] = useState(false);

  async function handleAnalyze({ title, description }) {
    setLoading(true);
    setMatcherResults(null);

    try {
      const res = await apiFetch('/api/match', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });

      if (res.success) {
        setMatcherResults(res.data.rankings);
        invalidateStats();
        addToast(`Scored ${res.data.rankings.length} candidates`, 'success');
      } else {
        addToast(res.error || 'Matching failed', 'error');
      }
    } catch (err) {
      addToast('Matching failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
            }}
          >
            <Target size={20} color="#FFFFFF" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                Job Matcher
              </h1>
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: theme.colors.accentLight,
                  color: theme.colors.accentText,
                }}
              >
                <Sparkles size={9} />
                AI-Powered
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
              Score and rank candidates against a job description
            </p>
          </div>
        </div>

        {/* Quick tip */}
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: theme.colors.bgTertiary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <Zap size={13} style={{ color: theme.colors.warning }} />
          <span className="text-[11px]" style={{ color: theme.colors.textMuted }}>
            Select a preset role or paste a custom JD
          </span>
        </div>
      </div>

      <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 240px)' }}>
        {/* Left panel - JD Input */}
        <div className="w-2/5 flex-shrink-0">
          <JDInput
            onAnalyze={handleAnalyze}
            loading={loading}
            initialTitle={matcherJobTitle}
            initialDescription={matcherJobDesc}
            onTitleChange={setMatcherJobTitle}
            onDescriptionChange={setMatcherJobDesc}
          />
        </div>

        {/* Right panel - Results */}
        <div className="flex-1 overflow-y-auto">
          <RankedResults rankings={matcherResults} loading={loading} />
        </div>
      </div>
    </div>
  );
}
