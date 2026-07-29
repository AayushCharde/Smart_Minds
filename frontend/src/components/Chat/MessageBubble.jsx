import { useState, memo } from 'react';
import { User, FileText, Sparkles, Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function FormattedContent({ text, color }) {
  // Simple markdown-like rendering for bold (**text**), bullet points, and numbered lists
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Empty line = spacing
        if (!trimmed) return <div key={i} className="h-1" />;

        // Bullet points
        if (/^[-*]\s/.test(trimmed)) {
          const content = trimmed.replace(/^[-*]\s/, '');
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color, opacity: 0.5 }} />
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }

        // Numbered lists
        if (/^\d+[.)]\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+[.)])\s(.*)/);
          if (match) {
            return (
              <div key={i} className="flex gap-2 pl-1">
                <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ opacity: 0.6 }}>{match[1]}</span>
                <span>{renderInlineFormatting(match[2])}</span>
              </div>
            );
          }
        }

        return <p key={i}>{renderInlineFormatting(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * MessageBubble — memoized chat message component.
 *
 * Memoized because the chat list can grow large and messages don't change
 * after they're rendered (content is immutable once streamed).
 */
const MessageBubble = memo(function MessageBubble({ message }) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — clipboard API may not be available
    }
  };

  return (
    <div
      className={`flex gap-3 animate-slide-up group ${isUser ? 'flex-row-reverse' : ''}`}
      role="article"
      aria-label={`${isUser ? 'You' : 'AI Assistant'}: ${message.content?.slice(0, 80) || ''}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{
          background: isUser
            ? `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`
            : `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.bgTertiary})`,
        }}
        aria-hidden="true"
      >
        {isUser ? (
          <User size={15} style={{ color: theme.colors.textOnAccent }} />
        ) : (
          <Sparkles size={15} style={{ color: theme.colors.accent }} />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-4 py-3 ${
            isUser ? 'rounded-tr-md' : 'rounded-tl-md'
          }`}
          style={{
            backgroundColor: isUser ? theme.colors.userBubble : theme.colors.aiBubble,
            color: isUser ? theme.colors.userBubbleText : theme.colors.aiBubbleText,
            boxShadow: isUser ? 'none' : `0 1px 4px ${theme.colors.border}30`,
          }}
        >
          {/* Copy button (AI messages only) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150"
              style={{
                backgroundColor: `${theme.colors.aiBubbleText}10`,
              }}
              title="Copy to clipboard"
              aria-label={copied ? 'Copied!' : 'Copy message to clipboard'}
            >
              {copied ? (
                <Check size={12} style={{ color: theme.colors.success }} />
              ) : (
                <Copy size={12} style={{ color: theme.colors.aiBubbleText, opacity: 0.5 }} />
              )}
            </button>
          )}

          {/* Content */}
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <FormattedContent
              text={message.content}
              color={theme.colors.aiBubbleText}
            />
          )}

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5"
              style={{ borderTop: `1px solid ${theme.colors.border}20` }}
              role="list"
              aria-label="Sources"
            >
              <span className="text-[10px] font-semibold mr-0.5 self-center" style={{ color: `${theme.colors.aiBubbleText}70` }}>
                Sources:
              </span>
              {message.sources.map((source, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                  style={{
                    backgroundColor: theme.colors.accentLight,
                    color: theme.colors.accentText,
                  }}
                  role="listitem"
                >
                  <FileText size={8} aria-hidden="true" />
                  {source.candidate_name || source.filename}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
