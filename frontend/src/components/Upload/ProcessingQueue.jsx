import { CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ProcessingQueue({ items }) {
  const { theme } = useTheme();

  if (!items || items.length === 0) return null;

  const doneCount = items.filter(i => i.status === 'done').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const processingCount = items.filter(i => i.status === 'processing').length;

  return (
    <div
      className="rounded-xl p-4 animate-scale-in"
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.cardShadow,
      }}
    >
      {/* Header with progress summary */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
          Processing Queue
        </h3>
        <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
          {doneCount > 0 && (
            <span className="flex items-center gap-1" style={{ color: theme.colors.success }}>
              <CheckCircle size={12} /> {doneCount}
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1" style={{ color: theme.colors.danger }}>
              <AlertCircle size={12} /> {errorCount}
            </span>
          )}
          {processingCount > 0 && (
            <span className="flex items-center gap-1" style={{ color: theme.colors.accent }}>
              <Loader2 size={12} className="animate-spin" /> {processingCount}
            </span>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-1.5 rounded-full mb-3" style={{ backgroundColor: theme.colors.bgTertiary }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((doneCount + errorCount) / items.length) * 100}%`,
            background: errorCount > 0 && doneCount === 0
              ? theme.colors.danger
              : `linear-gradient(90deg, ${theme.colors.success}, ${theme.colors.accent})`,
          }}
        />
      </div>

      {/* File list */}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: item.status === 'done' ? `${theme.colors.success}08` :
                               item.status === 'error' ? `${theme.colors.danger}08` :
                               theme.colors.bgTertiary,
            }}
          >
            {item.status === 'processing' && (
              <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: theme.colors.accent }} />
            )}
            {item.status === 'done' && (
              <CheckCircle size={15} className="flex-shrink-0" style={{ color: theme.colors.success }} />
            )}
            {item.status === 'error' && (
              <AlertCircle size={15} className="flex-shrink-0" style={{ color: theme.colors.danger }} />
            )}
            <FileText size={13} className="flex-shrink-0" style={{ color: theme.colors.textMuted }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate font-medium" style={{ color: theme.colors.textPrimary }}>
                {item.filename}
              </p>
              {item.error && (
                <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.colors.danger }}>
                  {item.error}
                </p>
              )}
            </div>
            {item.status === 'done' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: theme.colors.success, backgroundColor: theme.colors.successBg }}>
                Done
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
