import { useState, useRef, memo } from 'react';
import { Send, Sparkles, CornerDownLeft, Brain, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ChatInput = memo(function ChatInput({ onSend, disabled, thinkMode, onToggleThink }) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const charCount = message.length;

  return (
    <div
      className="p-4"
      style={{ borderTop: `1px solid ${theme.colors.border}` }}
    >
      {/* Suggestions row when empty */}
      {!message && !disabled && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <Sparkles size={12} className="flex-shrink-0" style={{ color: theme.colors.textMuted }} />
          {[
            'Who has the most experience?',
            'Compare top two candidates',
            'List all skills found',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setMessage(suggestion);
                textareaRef.current?.focus();
              }}
              className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-all duration-150 whitespace-nowrap"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textMuted,
                border: `1px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accentLight;
                e.currentTarget.style.color = theme.colors.accentText;
                e.currentTarget.style.borderColor = theme.colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                e.currentTarget.style.color = theme.colors.textMuted;
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div
          className="flex items-end gap-2 rounded-xl transition-all duration-200 p-1"
          style={{
            backgroundColor: theme.colors.bgInput,
            border: `1px solid ${isFocused ? theme.colors.borderFocus : theme.colors.border}`,
            boxShadow: isFocused ? `0 0 0 3px ${theme.colors.accent}10` : 'none',
          }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything about your candidates..."
            aria-label="Message input"
            rows={1}
            className="flex-1 px-3 py-2 text-sm outline-none resize-none max-h-32 bg-transparent"
            style={{ color: theme.colors.textPrimary }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          <div className="flex items-center gap-1.5 pr-1 pb-1">
            {/* Thinking mode toggle */}
            <button
              type="button"
              onClick={onToggleThink}
              title={thinkMode ? 'Thinking mode: ON — deeper reasoning, slower' : 'Thinking mode: OFF — fast direct answers'}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
              style={{
                backgroundColor: thinkMode ? `${theme.colors.accent}15` : theme.colors.bgTertiary,
                color: thinkMode ? theme.colors.accent : theme.colors.textMuted,
                border: `1px solid ${thinkMode ? `${theme.colors.accent}40` : theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                if (thinkMode) {
                  e.currentTarget.style.backgroundColor = `${theme.colors.accent}25`;
                } else {
                  e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                  e.currentTarget.style.borderColor = theme.colors.textMuted;
                }
              }}
              onMouseLeave={(e) => {
                if (thinkMode) {
                  e.currentTarget.style.backgroundColor = `${theme.colors.accent}15`;
                } else {
                  e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }
              }}
            >
              {thinkMode ? (
                <>
                  <Brain size={13} />
                  <span>Think</span>
                </>
              ) : (
                <>
                  <Zap size={13} />
                  <span>Fast</span>
                </>
              )}
              {/* Status dot */}
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: thinkMode ? theme.colors.accent : theme.colors.success,
                }}
              />
            </button>

            {/* Keyboard shortcut hint */}
            {message.trim() && (
              <div
                className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                style={{ color: theme.colors.textMuted }}
              >
                <CornerDownLeft size={10} />
                Enter
              </div>
            )}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              aria-label="Send message"
              className="p-2 rounded-lg transition-all duration-200 disabled:opacity-30 hover:shadow-sm"
              style={{
                background: message.trim() && !disabled
                  ? `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`
                  : theme.colors.bgTertiary,
                color: message.trim() && !disabled
                  ? theme.colors.textOnAccent
                  : theme.colors.textMuted,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
            {disabled ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.colors.accent }} />
                {thinkMode ? 'AI is thinking deeply...' : 'Generating fast response...'}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Shift+Enter for new line
                <span style={{ color: theme.colors.border }}>·</span>
                {thinkMode ? 'Deep reasoning mode' : 'Fast response mode'}
              </span>
            )}
          </span>
          {charCount > 0 && (
            <span
              className="text-[10px] tabular-nums"
              style={{ color: charCount > 500 ? theme.colors.warning : theme.colors.textMuted }}
            >
              {charCount}
            </span>
          )}
        </div>
      </form>
    </div>
  );
});

export default ChatInput;
