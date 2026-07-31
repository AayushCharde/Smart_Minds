import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  RefreshCw,
  Server,
  Table2,
  LineChart,
  Zap,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../api';

const HISTORY_KEY = 'hireminds:llm-usage-history';
const HISTORY_MAX = 96;
const AUTO_REFRESH_MS = 60_000;

// ─── helpers ────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function formatReset(seconds) {
  if (seconds == null) return '—';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function quotaStatus(remaining, limit, theme) {
  if (remaining == null || !limit) {
    return { label: 'Unknown', color: theme.colors.textMuted, bg: theme.colors.bgTertiary, Icon: Info };
  }
  const frac = remaining / limit;
  if (frac >= 0.5)
    return { label: 'Healthy', color: theme.colors.success, bg: theme.colors.successBg, Icon: CheckCircle2 };
  if (frac >= 0.2)
    return { label: 'Running low', color: theme.colors.warning, bg: theme.colors.warningBg, Icon: AlertTriangle };
  return { label: 'Critical', color: theme.colors.danger, bg: theme.colors.dangerBg, Icon: AlertCircle };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendHistory(sample) {
  const history = [...loadHistory(), sample].slice(-HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* storage full — non-fatal */
  }
  return history;
}

// ─── Quota meter tile ───────────────────────────────────────────────

function QuotaMeter({ title, subtitle, icon: Icon, quota }) {
  const { theme } = useTheme();
  const { limit, remaining, used, reset_seconds: reset } = quota || {};
  const status = quotaStatus(remaining, limit, theme);
  const pct = remaining != null && limit ? Math.max(0, Math.min(100, (remaining / limit) * 100)) : 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.cardShadow,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.colors.accentLight }}
          >
            <Icon size={18} style={{ color: theme.colors.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{title}</p>
            <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>{subtitle}</p>
          </div>
        </div>
        {/* Status: icon + label, never color alone */}
        <span
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          <status.Icon size={12} />
          {status.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: theme.colors.textPrimary }}>
          {remaining != null ? fmt.format(remaining) : '—'}
        </span>
        <span className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
          of {limit != null ? fmt.format(limit) : '—'} remaining
        </span>
      </div>

      {/* Meter — thin track, rounded fill anchored left */}
      <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ backgroundColor: theme.colors.bgTertiary }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: status.color }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] tabular-nums" style={{ color: theme.colors.textSecondary }}>
          {remaining != null && limit ? `${pct.toFixed(1)}% left` : 'no data'}
          {used != null && ` · ${fmt.format(used)} used`}
        </span>
        <span className="text-[11px]" style={{ color: theme.colors.textMuted }}>
          resets in {formatReset(reset)}
        </span>
      </div>
    </div>
  );
}

// ─── Usage history — line chart with crosshair + table view ────────

const CHART_W = 620;
const CHART_H = 190;
const PAD = { top: 14, right: 14, bottom: 26, left: 40 };

function UsageHistoryChart({ history }) {
  const { theme } = useTheme();
  const [view, setView] = useState('chart'); // 'chart' | 'table'
  const [hover, setHover] = useState(null); // sample index
  const svgRef = useRef(null);

  const points = useMemo(
    () =>
      history
        .filter((s) => s.reqRemaining != null && s.reqLimit)
        .map((s) => ({ ...s, pct: (s.reqRemaining / s.reqLimit) * 100 })),
    [history],
  );

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
  const y = (pct) => PAD.top + innerH - (pct / 100) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 1
      ? `${linePath} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
      : '';

  const onMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const idx = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const timeLabel = (t) =>
    new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
          Daily requests remaining over time
        </p>
        <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>
          Sampled each time usage is checked · kept locally in your browser
        </p>
      </div>
      <button
        onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
        style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.bgTertiary }}
        title={view === 'chart' ? 'View as table' : 'View as chart'}
      >
        {view === 'chart' ? <Table2 size={13} /> : <LineChart size={13} />}
        {view === 'chart' ? 'Table' : 'Chart'}
      </button>
    </div>
  );

  if (points.length < 2) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        {header}
        <div
          className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl"
          style={{ backgroundColor: theme.colors.bgSecondary }}
        >
          <Activity size={20} style={{ color: theme.colors.textMuted }} />
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            History builds up as usage is checked — refresh a couple of times to see the trend.
          </p>
        </div>
      </div>
    );
  }

  const h = hover != null ? points[hover] : null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.cardShadow,
      }}
    >
      {header}

      {view === 'table' ? (
        <div className="max-h-64 overflow-y-auto rounded-xl" style={{ border: `1px solid ${theme.colors.borderLight}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: theme.colors.bgSecondary }}>
                {['Time', 'Requests left', '% of day', 'Tokens/min left'].map((th) => (
                  <th key={th} className="text-left font-semibold px-3 py-2" style={{ color: theme.colors.textSecondary }}>
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.t} style={{ borderTop: `1px solid ${theme.colors.borderLight}` }}>
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: theme.colors.textSecondary }}>
                    {new Date(p.t).toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: theme.colors.textPrimary }}>
                    {fmt.format(p.reqRemaining)}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: theme.colors.textPrimary }}>
                    {p.pct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: theme.colors.textPrimary }}>
                    {p.tokRemaining != null ? fmt.format(p.tokRemaining) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto cursor-crosshair"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label="Line chart of remaining daily LLM requests over time"
          >
            {/* Recessive gridlines + y labels */}
            {[0, 25, 50, 75, 100].map((g) => (
              <g key={g}>
                <line
                  x1={PAD.left} x2={CHART_W - PAD.right} y1={y(g)} y2={y(g)}
                  stroke={theme.colors.borderLight} strokeWidth="1"
                />
                <text x={PAD.left - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill={theme.colors.textMuted}>
                  {g}%
                </text>
              </g>
            ))}

            {/* Area + line (single series — the title names it, no legend) */}
            <path d={areaPath} fill={theme.colors.accent} opacity="0.08" />
            <path d={linePath} fill="none" stroke={theme.colors.accent} strokeWidth="2" strokeLinejoin="round" />

            {/* Latest point — direct label */}
            <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].pct)} r="4"
              fill={theme.colors.accent} stroke={theme.colors.bgCard} strokeWidth="2" />
            <text
              x={Math.min(x(points.length - 1) + 7, CHART_W - PAD.right - 2)}
              y={y(points[points.length - 1].pct) - 8}
              textAnchor="end" fontSize="10" fontWeight="600" fill={theme.colors.textSecondary}
            >
              {points[points.length - 1].pct.toFixed(1)}%
            </text>

            {/* Crosshair + hover marker */}
            {h && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={CHART_H - PAD.bottom}
                  stroke={theme.colors.textMuted} strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={x(hover)} cy={y(h.pct)} r="4.5"
                  fill={theme.colors.accent} stroke={theme.colors.bgCard} strokeWidth="2" />
              </g>
            )}

            {/* x-axis time labels — first and last only */}
            <text x={PAD.left} y={CHART_H - 8} fontSize="9" fill={theme.colors.textMuted}>
              {timeLabel(points[0].t)}
            </text>
            <text x={CHART_W - PAD.right} y={CHART_H - 8} textAnchor="end" fontSize="9" fill={theme.colors.textMuted}>
              {timeLabel(points[points.length - 1].t)}
            </text>
          </svg>

          {/* Tooltip */}
          {h && (
            <div
              className="absolute pointer-events-none px-3 py-2 rounded-xl text-[11px] leading-relaxed shadow-lg"
              style={{
                left: `${(x(hover) / CHART_W) * 100}%`,
                top: 0,
                transform: `translateX(${hover > points.length / 2 ? '-108%' : '8%'})`,
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textSecondary,
              }}
            >
              <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                {new Date(h.t).toLocaleString()}
              </p>
              <p>
                Requests left: <span className="font-semibold tabular-nums" style={{ color: theme.colors.textPrimary }}>
                  {fmt.format(h.reqRemaining)} ({h.pct.toFixed(1)}%)
                </span>
              </p>
              {h.tokRemaining != null && (
                <p>
                  Tokens/min left: <span className="font-semibold tabular-nums" style={{ color: theme.colors.textPrimary }}>
                    {fmt.format(h.tokRemaining)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme } = useTheme();
  const { apiFetch } = useApi();
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch('/api/llm-usage');
    if (res.success) {
      setUsage(res.data);
      setHistory(
        appendHistory({
          t: Date.now(),
          reqRemaining: res.data.requests_per_day?.remaining ?? null,
          reqLimit: res.data.requests_per_day?.limit ?? null,
          tokRemaining: res.data.tokens_per_minute?.remaining ?? null,
          tokLimit: res.data.tokens_per_minute?.limit ?? null,
        }),
      );
    } else {
      setError(res.error || 'Could not fetch usage');
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    fetchUsage();
    timerRef.current = setInterval(fetchUsage, AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchUsage]);

  const rateLimited = usage?.status === 'rate_limited';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>Settings</h1>
          <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
            LLM provider quota — live from {usage?.provider || 'the provider'}'s rate-limit headers
          </p>
        </div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all disabled:opacity-60"
          style={{ backgroundColor: theme.colors.accent, color: theme.colors.textOnAccent }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-2.5 text-xs font-medium px-4 py-3 rounded-xl"
          style={{ color: theme.colors.danger, backgroundColor: theme.colors.dangerBg }}
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Rate limited banner */}
      {rateLimited && (
        <div
          className="flex items-center gap-2.5 text-xs font-medium px-4 py-3 rounded-xl"
          style={{ color: theme.colors.warning, backgroundColor: theme.colors.warningBg }}
        >
          <AlertTriangle size={15} />
          Provider is rate-limiting right now
          {usage?.retry_after_seconds != null && ` — retry in ${formatReset(usage.retry_after_seconds)}`}.
        </div>
      )}

      {/* Provider card */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.cardShadow,
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.colors.accentLight }}
          >
            <Server size={18} style={{ color: theme.colors.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>LLM Provider</p>
            <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>Free tier · OpenAI-compatible API</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Provider', value: usage?.provider || '—', icon: Server },
            { label: 'Model', value: usage?.model || '—', icon: Cpu },
            {
              label: 'Status',
              value: rateLimited ? 'Rate limited' : usage ? 'Connected' : '—',
              icon: rateLimited ? AlertTriangle : CheckCircle2,
              color: rateLimited ? theme.colors.warning : usage ? theme.colors.success : undefined,
            },
            {
              label: 'Last checked',
              value: usage?.checked_at ? new Date(usage.checked_at).toLocaleTimeString() : '—',
              icon: Activity,
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: theme.colors.textMuted }}>
                {label}
              </p>
              <p className="flex items-center gap-1.5 text-xs font-semibold break-all" style={{ color: color || theme.colors.textPrimary }}>
                <Icon size={13} style={{ color: color || theme.colors.textMuted, flexShrink: 0 }} />
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quota meters */}
      <div className="grid sm:grid-cols-2 gap-5">
        <QuotaMeter
          title="Requests today"
          subtitle="Free-tier daily request quota"
          icon={Gauge}
          quota={usage?.requests_per_day}
        />
        <QuotaMeter
          title="Tokens this minute"
          subtitle="Free-tier tokens-per-minute quota"
          icon={Zap}
          quota={usage?.tokens_per_minute}
        />
      </div>

      {/* History */}
      <UsageHistoryChart history={history} />

      {/* Footnote */}
      <p className="flex items-center gap-1.5 text-[11px] px-1" style={{ color: theme.colors.textMuted }}>
        <Info size={12} />
        Numbers come straight from the provider's rate-limit headers. Each check performs a 1-token probe
        ({usage?.probe_cost_tokens ?? '~40'} tokens) — negligible against the daily quota. Auto-refreshes every minute
        while this page is open.
      </p>
    </div>
  );
}
