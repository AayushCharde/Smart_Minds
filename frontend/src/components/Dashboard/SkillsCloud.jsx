import { useMemo, memo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Zap, BarChart3 } from 'lucide-react';

const SkillsCloud = memo(function SkillsCloud({ candidates }) {
  const { theme } = useTheme();

  // Memoize skill aggregation — only recompute when candidates change
  const { sortedSkills, maxCount } = useMemo(() => {
    const skillMap = {};
    (candidates || []).forEach(c => {
      const skills = c.skills || [];
      skills.forEach(skill => {
        const normalized = skill.trim().toLowerCase();
        if (normalized.length < 2) return;
        if (!skillMap[normalized]) {
          skillMap[normalized] = { name: skill.trim(), count: 0 };
        }
        skillMap[normalized].count += 1;
      });
    });

    const sorted = Object.values(skillMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      sortedSkills: sorted,
      maxCount: sorted.length > 0 ? sorted[0].count : 1,
    };
  }, [candidates]);

  // Size classes based on relative frequency
  const getSizeStyle = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return { fontSize: '13px', fontWeight: 700, px: 12, py: 6 };
    if (ratio > 0.4) return { fontSize: '11px', fontWeight: 600, px: 10, py: 5 };
    return { fontSize: '10px', fontWeight: 500, px: 8, py: 4 };
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.colors.bgCard,
        boxShadow: theme.colors.cardShadow,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.secondary || theme.colors.accent}15` }}
          >
            <Zap size={14} style={{ color: theme.colors.secondary || theme.colors.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
              Skills Overview
            </h3>
            <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>
              Top skills across your talent pool
            </p>
          </div>
        </div>
        {sortedSkills.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}
          >
            {sortedSkills.length} skills
          </span>
        )}
      </div>

      {sortedSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: theme.colors.bgTertiary }}
          >
            <BarChart3 size={18} style={{ color: theme.colors.textMuted }} />
          </div>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            Upload resumes to see skill analytics
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Skills cloud">
          {sortedSkills.map((skill, i) => {
            const sizeStyle = getSizeStyle(skill.count);
            const colorIndex = i % theme.colors.tags.length;

            return (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 rounded-lg transition-all duration-200 hover:scale-105 cursor-default animate-scale-in"
                style={{
                  backgroundColor: theme.colors.tags[colorIndex],
                  color: theme.colors.tagText[colorIndex],
                  fontSize: sizeStyle.fontSize,
                  fontWeight: sizeStyle.fontWeight,
                  padding: `${sizeStyle.py}px ${sizeStyle.px}px`,
                  animationDelay: `${i * 30}ms`,
                  animationFillMode: 'both',
                }}
                role="listitem"
              >
                {skill.name}
                <span
                  className="opacity-60 text-[9px] ml-0.5"
                  style={{ fontWeight: 400 }}
                >
                  {skill.count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default SkillsCloud;
