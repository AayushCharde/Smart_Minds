import { TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MatchBadge({ badge }) {
  const { theme } = useTheme();

  const config = {
    strong: {
      bg: theme.colors.successBg,
      text: theme.colors.success,
      label: 'Strong',
      Icon: TrendingUp,
    },
    good: {
      bg: theme.colors.warningBg,
      text: theme.colors.warning,
      label: 'Good',
      Icon: Minus,
    },
    weak: {
      bg: theme.colors.dangerBg,
      text: theme.colors.danger,
      label: 'Weak',
      Icon: TrendingDown,
    },
  };

  const { bg, text, label, Icon } = config[badge] || config.weak;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{ backgroundColor: bg, color: text }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
