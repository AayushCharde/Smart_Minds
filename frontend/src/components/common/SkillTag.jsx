import { useTheme } from '../../context/ThemeContext';

export default function SkillTag({ skill, index = 0 }) {
  const { theme } = useTheme();
  const colorIndex = index % theme.colors.tags.length;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide"
      style={{
        backgroundColor: theme.colors.tags[colorIndex],
        color: theme.colors.tagText[colorIndex],
      }}
    >
      {skill}
    </span>
  );
}
