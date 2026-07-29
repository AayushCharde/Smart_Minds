import { Upload, Target, MessageSquare, Clock, Activity, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const typeConfig = {
  upload: { icon: Upload, label: 'Upload', gradient: ['#2563EB', '#06B6D4'] },
  match: { icon: Target, label: 'Match', gradient: ['#7C3AED', '#EC4899'] },
  question: { icon: MessageSquare, label: 'Chat', gradient: ['#059669', '#34D399'] },
};

function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentActivity({ activities }) {
  const { theme } = useTheme();

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
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.accent}15` }}
          >
            <Activity size={14} style={{ color: theme.colors.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
              Recent Activity
            </h3>
            <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
              Latest actions in your pipeline
            </p>
          </div>
        </div>
        {activities?.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
          >
            {activities.length} events
          </span>
        )}
      </div>

      {!activities || activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: theme.colors.bgTertiary }}
          >
            <Activity size={22} style={{ color: theme.colors.textMuted }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: theme.colors.textMuted }}>
            No recent activity
          </p>
          <p className="text-xs mt-1 max-w-[200px]" style={{ color: theme.colors.textMuted }}>
            Start by uploading resumes to build your talent pipeline
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, i) => {
            const config = typeConfig[activity.type] || { icon: Clock, label: 'Event', gradient: ['#6B7280', '#9CA3AF'] };
            const Icon = config.icon;
            const relTime = getRelativeTime(activity.timestamp);

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group cursor-default"
                style={{ animationDelay: `${i * 40}ms` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.accent}06`;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Icon with gradient background */}
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${config.gradient[0]}20, ${config.gradient[1]}20)`,
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: config.gradient[0] }}
                    />
                  </div>
                  {/* Timeline connector */}
                  {i < activities.length - 1 && (
                    <div
                      className="absolute left-1/2 top-full w-px h-2 -translate-x-1/2"
                      style={{ backgroundColor: theme.colors.border }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.colors.textPrimary }}>
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background: `linear-gradient(135deg, ${config.gradient[0]}15, ${config.gradient[1]}15)`,
                        color: config.gradient[0],
                      }}
                    >
                      {config.label}
                    </span>
                    <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                      {relTime}
                    </span>
                  </div>
                </div>

                {/* Arrow indicator on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ArrowUpRight size={14} style={{ color: theme.colors.textMuted }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
