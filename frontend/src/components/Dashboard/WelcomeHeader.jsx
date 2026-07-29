import { useUser } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Sparkles, TrendingUp, Users, Briefcase, MessageSquare } from 'lucide-react';

export default function WelcomeHeader({ stats }) {
  const { theme } = useTheme();
  const { user } = useUser();

  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'there';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const summaryItems = [
    { icon: Users, value: stats?.total_resumes || 0, label: 'Candidates' },
    { icon: Briefcase, value: stats?.jobs_matched || 0, label: 'Jobs Matched' },
    { icon: MessageSquare, value: stats?.total_qas || 0, label: 'Questions' },
  ];

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden animate-fade-in"
      style={{
        background: theme.colors.gradientSubtle,
        border: `1px solid ${theme.colors.accent}20`,
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04] blur-3xl"
        style={{ background: theme.colors.accent }}
      />
      <div
        className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full opacity-[0.03] blur-3xl"
        style={{ background: theme.colors.secondary || theme.colors.accent }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Greeting */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.accent}15` }}
            >
              <Sparkles size={16} style={{ color: theme.colors.accent }} />
            </div>
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>
              {today}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.colors.textPrimary }}>
            {greeting()}, <span style={{ color: theme.colors.accent }}>{firstName}</span>
          </h1>
          <p className="text-sm max-w-md" style={{ color: theme.colors.textSecondary }}>
            Here's what's happening with your recruitment pipeline today.
          </p>
        </div>

        {/* Right: Mini summary pills */}
        <div className="flex items-center gap-3">
          {summaryItems.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.colors.cardShadow,
              }}
            >
              <Icon size={14} style={{ color: theme.colors.accent }} />
              <span className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                {value}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.colors.textMuted }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
