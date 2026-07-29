import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trash2, Search, User, X, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SkillTag from '../common/SkillTag';

export default function CandidateTable({ candidates, onDelete }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterText, setFilterText] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = candidates.filter(c => {
    const text = filterText.toLowerCase();
    if (!text) return true;
    return (
      c.name?.toLowerCase().includes(text) ||
      c.skills?.some(s => s.toLowerCase().includes(text)) ||
      c.email?.toLowerCase().includes(text)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const mul = sortOrder === 'asc' ? 1 : -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * mul;
    }
    return String(aVal || '').localeCompare(String(bVal || '')) * mul;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div>
      {/* Filter bar */}
      <div
        className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl"
        style={{
          backgroundColor: theme.colors.bgInput,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <Search size={16} style={{ color: theme.colors.textMuted }} />
        <input
          type="text"
          placeholder="Filter by name, skill, email..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1"
          style={{ color: theme.colors.textPrimary }}
        />
        {filterText && (
          <button onClick={() => setFilterText('')} className="p-0.5">
            <X size={14} style={{ color: theme.colors.textMuted }} />
          </button>
        )}
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}>
          {filtered.length} / {candidates.length}
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: theme.colors.bgTertiary }}>
                {[
                  { key: 'name', label: 'Candidate' },
                  { key: 'skills', label: 'Skills' },
                  { key: 'experience_years', label: 'Experience' },
                  { key: 'education', label: 'Education' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: theme.colors.textMuted }}
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon field={key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: theme.colors.bgTertiary }}
                      >
                        <User size={20} style={{ color: theme.colors.textMuted }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
                        {filterText ? 'No matching candidates' : 'No candidates yet'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        {filterText ? 'Try a different search term' : 'Upload resumes to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-t cursor-pointer transition-colors group"
                    style={{ borderColor: theme.colors.borderLight }}
                    onClick={() => navigate(`/candidate/${c.id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: theme.colors.tags[idx % theme.colors.tags.length],
                            color: theme.colors.tagText[idx % theme.colors.tagText.length],
                          }}
                        >
                          {(c.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{c.name}</p>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-60" style={{ color: theme.colors.textMuted }} />
                          </div>
                          <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.skills || []).slice(0, 3).map((skill, j) => (
                          <SkillTag key={j} skill={skill} index={j} />
                        ))}
                        {(c.skills || []).length > 3 && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}
                          >
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textPrimary }}
                      >
                        {c.experience_years} yrs
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: theme.colors.textPrimary }}>
                        {typeof c.education === 'string' ? c.education : c.education?.degree || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDelete?.(c.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          style={{ backgroundColor: `${theme.colors.danger}10` }}
                          title="Delete"
                        >
                          <Trash2 size={13} style={{ color: theme.colors.danger }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
