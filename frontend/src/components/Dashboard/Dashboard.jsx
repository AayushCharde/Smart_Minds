import { useEffect } from 'react';
import { FileText, Trophy, TrendingUp, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import WelcomeHeader from './WelcomeHeader';
import StatCard from './StatCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import TopCandidates from './TopCandidates';
import PipelineOverview from './PipelineOverview';
import SkillsCloud from './SkillsCloud';
import LoadingSpinner from '../common/LoadingSpinner';

export default function Dashboard() {
  const { theme } = useTheme();
  const { stats, statsLoading, loadStats, candidates, loadCandidates } = useApp();

  useEffect(() => {
    loadStats();
    loadCandidates();
  }, []);

  if (statsLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Welcome Header ─── */}
      <WelcomeHeader stats={stats} />

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total Resumes"
          value={stats?.total_resumes || 0}
          icon={FileText}
          color={theme.colors.accent}
          maxValue={Math.max(stats?.total_resumes || 0, 20)}
          subtitle="Candidates in pool"
        />
        <StatCard
          title="Strong Matches"
          value={stats?.strong_matches || 0}
          icon={Trophy}
          color={theme.colors.secondary || theme.colors.accent}
          maxValue={Math.max(stats?.total_resumes || 0, 10)}
          subtitle="Candidates scoring 80%+"
        />
        <StatCard
          title="Avg Match Score"
          value={stats?.avg_match_score ? `${stats.avg_match_score}%` : '—'}
          icon={TrendingUp}
          color={theme.colors.success}
          maxValue={100}
          subtitle="Across all matches"
        />
        <StatCard
          title="Total Q&As"
          value={stats?.total_qas || 0}
          icon={HelpCircle}
          color={theme.colors.warning}
          maxValue={Math.max(stats?.total_qas || 0, 20)}
          subtitle="AI-powered queries"
        />
      </div>

      {/* ─── Quick Actions ─── */}
      <div>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
          style={{ color: theme.colors.textMuted }}
        >
          <span className="w-5 h-px" style={{ backgroundColor: theme.colors.border }} />
          Quick Actions
          <span className="flex-1 h-px" style={{ backgroundColor: theme.colors.border }} />
        </h2>
        <QuickActions />
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          <RecentActivity activities={stats?.recent_activity || []} />
          <SkillsCloud candidates={candidates} />
        </div>

        {/* Right Column - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <TopCandidates candidates={stats?.top_candidates || []} />
          <PipelineOverview stats={stats} />
        </div>
      </div>
    </div>
  );
}
