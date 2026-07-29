import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Briefcase, GraduationCap, Award,
  FileText, Sparkles, Calendar, MapPin, Download, Trash2, Brain,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import SkillTag from '../common/SkillTag';

function InfoCard({ icon: Icon, label, value, color, theme }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: theme.colors.bgTertiary, border: `1px solid ${theme.colors.border}40` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color || theme.colors.accent}15` }}
        >
          <Icon size={13} style={{ color: color || theme.colors.accent }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { apiFetch } = useApi();
  const { addToast } = useToast();
  const { removeCandidate, invalidateStats } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/candidates/${id}`);
        if (res.success) {
          setCandidate(res.data);
        } else {
          addToast(res.error || 'Candidate not found', 'error');
          navigate('/upload');
        }
      } catch (err) {
        addToast('Failed to load candidate', 'error');
        navigate('/upload');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    try {
      const res = await apiFetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.success) {
        removeCandidate(id);
        invalidateStats();
        addToast('Candidate deleted', 'success');
        navigate('/upload');
      } else {
        addToast(res.error || 'Failed to delete', 'error');
      }
    } catch {
      addToast('Failed to delete candidate', 'error');
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg skeleton-shimmer" />
          <div className="h-5 w-40 rounded skeleton-shimmer" />
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl skeleton-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded skeleton-shimmer" />
              <div className="h-3 w-64 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-4 rounded skeleton-shimmer" style={{ width: `${90 - i * 15}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const education = typeof candidate.education === 'string'
    ? candidate.education
    : candidate.education?.degree || null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: theme.colors.bgTertiary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgTertiary}
          >
            <ArrowLeft size={18} style={{ color: theme.colors.textSecondary }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
              Candidate Profile
            </h1>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Detailed candidate information
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: theme.colors.danger, backgroundColor: `${theme.colors.danger}08`, border: `1px solid ${theme.colors.danger}20` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.danger}15`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.danger}08`}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* Main profile card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        {/* Accent header bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentHover}, ${theme.colors.secondary || theme.colors.accent})` }} />

        <div className="p-6">
          {/* Profile header */}
          <div className="flex items-start gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
                color: '#FFFFFF',
              }}
            >
              {(candidate.name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                {candidate.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: theme.colors.textMuted }}>
                {candidate.email || 'No email available'}
              </p>
              {candidate.filename && (
                <div className="flex items-center gap-1.5 mt-2">
                  <FileText size={12} style={{ color: theme.colors.textMuted }} />
                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>{candidate.filename}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <InfoCard icon={Mail} label="Email" value={candidate.email} color={theme.colors.accent} theme={theme} />
            <InfoCard icon={Phone} label="Phone" value={candidate.phone} color={theme.colors.success} theme={theme} />
            <InfoCard icon={Briefcase} label="Experience" value={candidate.experience_years ? `${candidate.experience_years} years` : null} color={theme.colors.warning} theme={theme} />
            <InfoCard icon={GraduationCap} label="Education" value={education} color={theme.colors.secondary || theme.colors.accent} theme={theme} />
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} style={{ color: theme.colors.accent }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                  Summary
                </h3>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: theme.colors.bgTertiary, border: `1px solid ${theme.colors.border}40` }}
              >
                <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  {candidate.summary}
                </p>
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: theme.colors.accent }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                Skills
              </h3>
              {candidate.skills?.length > 0 && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}
                >
                  {candidate.skills.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills || []).length > 0 ? (
                candidate.skills.map((skill, j) => (
                  <SkillTag key={j} skill={skill} index={j} />
                ))
              ) : (
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>No skills extracted</p>
              )}
            </div>
          </div>

          {/* Certifications */}
          {candidate.certifications?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Award size={14} style={{ color: theme.colors.warning }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                  Certifications
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {candidate.certifications.map((cert, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: `${theme.colors.warning}12`, color: theme.colors.warning, border: `1px solid ${theme.colors.warning}20` }}
                  >
                    <Award size={11} />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw text (collapsible) */}
          {candidate.raw_text && (
            <RawTextSection rawText={candidate.raw_text} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
}

function RawTextSection({ rawText, theme }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={14} style={{ color: theme.colors.textMuted }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
            Raw Resume Text
          </h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: theme.colors.accent, backgroundColor: theme.colors.accentLight }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded && (
        <div
          className="p-4 rounded-xl overflow-auto max-h-96 animate-slide-down"
          style={{ backgroundColor: theme.colors.bgTertiary, border: `1px solid ${theme.colors.border}40` }}
        >
          <pre
            className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
            style={{ color: theme.colors.textSecondary }}
          >
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
