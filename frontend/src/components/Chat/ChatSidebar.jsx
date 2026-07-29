import { useState } from 'react';
import { Plus, MessageSquare, Trash2, MessagesSquare, Search, X, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');

  // Filter conversations by search
  const convList = conversations || [];
  const filtered = searchText
    ? convList.filter(c =>
        (c.title || 'New conversation').toLowerCase().includes(searchText.toLowerCase())
      )
    : convList;

  // Group by relative date
  const grouped = {};
  const now = new Date();
  filtered.forEach(conv => {
    if (!conv.updated_at) {
      if (!grouped['Older']) grouped['Older'] = [];
      grouped['Older'].push(conv);
      return;
    }
    const date = new Date(conv.updated_at);
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    let label;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else if (diffDays < 7) label = 'This Week';
    else label = 'Older';
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(conv);
  });

  return (
    <div
      className="w-[260px] h-full flex flex-col flex-shrink-0"
      style={{
        backgroundColor: theme.colors.bgTertiary,
        borderRight: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Header */}
      <div className="p-3 space-y-2.5">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
            color: theme.colors.textOnAccent,
          }}
        >
          <Plus size={16} />
          New Chat
        </button>

        {/* Search (show when there are conversations) */}
        {convList.length > 2 && (
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.bgInput,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <Search size={13} style={{ color: theme.colors.textMuted }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: theme.colors.textPrimary }}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="p-0.5">
                <X size={11} style={{ color: theme.colors.textMuted }} />
              </button>
            )}
          </div>
        )}

        {/* Conversation count */}
        {convList.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>
              {convList.length} conversation{convList.length !== 1 ? 's' : ''}
            </span>
            {searchText && filtered.length !== convList.length && (
              <span className="text-[10px]" style={{ color: theme.colors.accent }}>
                {filtered.length} found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([dateLabel, convs]) => (
            <div key={dateLabel} className="mb-3">
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5"
                style={{ color: theme.colors.textMuted }}
              >
                {dateLabel}
              </p>
              <div className="space-y-0.5">
                {convs.map(conv => {
                  const isActive = activeId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className="group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        backgroundColor: isActive ? theme.colors.bgActive : 'transparent',
                      }}
                      onClick={() => onSelect(conv.id)}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      )}
                      <MessageSquare
                        size={14}
                        style={{ color: isActive ? theme.colors.accent : theme.colors.textMuted }}
                        className="flex-shrink-0"
                      />
                      <span
                        className="text-sm truncate flex-1"
                        style={{
                          color: isActive ? theme.colors.accentText : theme.colors.textSecondary,
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {conv.title || 'New conversation'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:opacity-70 flex-shrink-0 transition-opacity"
                        style={{ backgroundColor: `${theme.colors.danger}15` }}
                      >
                        <Trash2 size={11} style={{ color: theme.colors.danger }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-float"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.accent}15)`,
              }}
            >
              <MessagesSquare size={22} style={{ color: theme.colors.accent }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.textPrimary }}>
              {searchText ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: theme.colors.textMuted }}>
              {searchText
                ? `No conversations match "${searchText}"`
                : 'Start a new chat to ask questions about your candidates'}
            </p>
            {!searchText && (
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-medium" style={{ color: theme.colors.accent }}>
                <Sparkles size={10} />
                AI-powered resume Q&A
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
