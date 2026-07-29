import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Sparkles, Brain } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import ChatSidebar from './ChatSidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

function TypingIndicator({ theme, streamingText, thinkMode }) {
  return (
    <div className="flex gap-3 animate-slide-up">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.bgTertiary})`,
        }}
      >
        <Sparkles size={15} style={{ color: theme.colors.accent }} />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]"
        style={{
          backgroundColor: theme.colors.aiBubble,
          boxShadow: `0 1px 4px ${theme.colors.border}30`,
        }}
      >
        {streamingText ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: theme.colors.aiBubbleText }}>
            {streamingText}
            <span
              className="inline-block w-1.5 h-4 ml-0.5 rounded-sm align-middle"
              style={{
                backgroundColor: theme.colors.accent,
                animation: 'pulse-dot 1s infinite',
              }}
            />
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: theme.colors.accent,
                    animation: `pulse-dot 1.4s infinite ease-in-out both`,
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium" style={{ color: theme.colors.textMuted }}>
              {thinkMode ? 'Thinking deeply...' : 'Generating...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { theme } = useTheme();
  const { apiFetch, apiStreamFetch, createAbortController } = useApi();
  const { addToast } = useToast();
  const {
    conversations, loadConversations, removeConversation,
    setConversations, invalidateStats,
  } = useApp();
  const messagesEndRef = useRef(null);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [thinkMode, setThinkMode] = useState(false);  // Default: fast mode
  const abortRef = useRef(null);

  useEffect(() => {
    loadConversations();
    // Cancel any active stream on unmount
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, streamingText]);

  async function loadConversation(id) {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/conversations/${id}`);
      if (res.success) {
        setMessages(res.data.messages);
        setActiveConversationId(id);
      }
    } catch (err) {
      addToast('Failed to load conversation', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  async function handleDeleteConversation(id) {
    try {
      const res = await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.success) {
        removeConversation(id);
        if (activeConversationId === id) {
          handleNewChat();
        }
        invalidateStats();
        addToast('Conversation deleted', 'success');
      }
    } catch (err) {
      addToast('Failed to delete conversation', 'error');
    }
  }

  async function handleSend(question) {
    const userMessage = { role: 'user', content: question, sources: [] };
    setMessages(prev => [...prev, userMessage]);
    setSending(true);
    setStreamingText('');

    let streamSources = [];

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort();
    const controller = createAbortController();
    abortRef.current = controller;

    try {
      const res = await apiStreamFetch('/api/ask-stream', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          question,
          conversation_id: activeConversationId || undefined,
          think: thinkMode,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'sources') {
              streamSources = event.sources || [];
              if (event.conversation_id) {
                setActiveConversationId(event.conversation_id);
              }
            } else if (event.type === 'token') {
              fullText += event.token;
              setStreamingText(fullText);
            } else if (event.type === 'done') {
              const aiMessage = {
                role: 'assistant',
                content: fullText,
                sources: streamSources,
              };
              setMessages(prev => [...prev, aiMessage]);
              setStreamingText('');

              if (event.conversation_id) {
                setActiveConversationId(event.conversation_id);
              }

              await loadConversations(true);
              invalidateStats();
            } else if (event.type === 'error') {
              addToast(event.error || 'Streaming error', 'error');
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        addToast('Failed to send message: ' + err.message, 'error');
      }
    } finally {
      setSending(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }

  return (
    <div className="animate-fade-in -m-6 flex" style={{ height: 'calc(100vh - 73px)' }}>
      {/* Chat sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={loadConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      {/* Chat main area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.colors.bgSecondary }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 animate-float"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.accent}20)`,
                }}
              >
                <Brain size={32} style={{ color: theme.colors.accent }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                AI Resume Assistant
              </h3>
              <p className="text-sm max-w-sm leading-relaxed mb-1" style={{ color: theme.colors.textMuted }}>
                Ask me anything about your candidates! I can compare skills, find specific experience, summarize profiles, and more.
              </p>
              <div className="flex items-center gap-1.5 mb-5">
                <Sparkles size={11} style={{ color: theme.colors.accent }} />
                <span className="text-[11px] font-medium" style={{ color: theme.colors.accent }}>
                  Powered by AI with source citations
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-w-md justify-center">
                {[
                  'Who has Python experience?',
                  'Compare top candidates',
                  'Summarize all resumes',
                  'Who has the most certifications?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all duration-150"
                    style={{
                      backgroundColor: theme.colors.bgTertiary,
                      color: theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.accentLight;
                      e.currentTarget.style.color = theme.colors.accentText;
                      e.currentTarget.style.borderColor = theme.colors.accent;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                      e.currentTarget.style.color = theme.colors.textSecondary;
                      e.currentTarget.style.borderColor = theme.colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {sending && <TypingIndicator theme={theme} streamingText={streamingText} thinkMode={thinkMode} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          thinkMode={thinkMode}
          onToggleThink={() => setThinkMode(prev => !prev)}
        />
      </div>
    </div>
  );
}
