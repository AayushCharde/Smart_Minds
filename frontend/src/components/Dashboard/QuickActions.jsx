import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Upload, Target, MessageSquare, ArrowRight } from 'lucide-react';

const actions = [
  {
    label: 'Upload Resumes',
    desc: 'Parse & index new candidate profiles with AI',
    icon: Upload,
    path: '/upload',
    gradient: ['#2563EB', '#06B6D4'],
  },
  {
    label: 'Match Candidates',
    desc: 'Score your talent pool against job descriptions',
    icon: Target,
    path: '/match',
    gradient: ['#7C3AED', '#EC4899'],
  },
  {
    label: 'Ask AI',
    desc: 'Chat with your resume database using RAG',
    icon: MessageSquare,
    path: '/chat',
    gradient: ['#059669', '#34D399'],
  },
];

export default function QuickActions() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map(({ label, desc, icon: Icon, path, gradient }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="relative group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
          style={{
            backgroundColor: theme.colors.bgCard,
            boxShadow: theme.colors.cardShadow,
            border: `1px solid ${theme.colors.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${gradient[0]}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
        >
          {/* Background gradient glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500"
            style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
          />

          {/* Icon */}
          <div
            className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: `linear-gradient(135deg, ${gradient[0]}15, ${gradient[1]}15)`,
            }}
          >
            <Icon size={20} style={{ color: gradient[0] }} />
          </div>

          {/* Text */}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
                {label}
              </span>
              <ArrowRight
                size={13}
                className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                style={{ color: gradient[0] }}
              />
            </div>
            <p className="text-[11px] mt-0.5 leading-tight" style={{ color: theme.colors.textMuted }}>
              {desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
