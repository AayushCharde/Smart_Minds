import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, LayoutDashboard, Upload, Target, MessageSquare,
  User, FileText, X, ArrowRight, MessagesSquare,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

const pageConfig = {
  '/': { title: 'Dashboard', icon: LayoutDashboard, description: 'Overview of your recruitment pipeline' },
  '/upload': { title: 'Upload & Screen', icon: Upload, description: 'Upload and parse candidate resumes' },
  '/match': { title: 'Job Matcher', icon: Target, description: 'Score candidates against job descriptions' },
  '/chat': { title: 'AI Chat', icon: MessageSquare, description: 'Ask questions about your candidates' },
};

const quickNav = [
  { type: 'page', title: 'Dashboard', path: '/', icon: LayoutDashboard, description: 'Overview & analytics' },
  { type: 'page', title: 'Upload & Screen', path: '/upload', icon: Upload, description: 'Upload resumes' },
  { type: 'page', title: 'Job Matcher', path: '/match', icon: Target, description: 'Match candidates to jobs' },
  { type: 'page', title: 'AI Chat', path: '/chat', icon: MessageSquare, description: 'Ask about candidates' },
];

function HighlightMatch({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-transparent font-bold" style={{ color: 'inherit' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function TopBar() {
  const { theme } = useTheme();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { candidates, conversations, loadCandidates, loadConversations } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'there';
  const currentPage = pageConfig[location.pathname] || pageConfig['/'];
  const PageIcon = currentPage.icon;

  useEffect(() => {
    loadCandidates();
    loadConversations();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const results = [];

    quickNav.forEach(page => {
      if (page.title.toLowerCase().includes(q) || page.description.toLowerCase().includes(q)) {
        results.push(page);
      }
    });

    (candidates || []).forEach(c => {
      const match =
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.skills?.some(s => s.toLowerCase().includes(q)) ||
        c.phone?.toLowerCase().includes(q);
      if (match) {
        results.push({
          type: 'candidate',
          id: c.id,
          title: c.name || 'Unknown',
          description: c.skills?.slice(0, 3).join(', ') || c.email || 'No details',
          path: `/candidate/${c.id}`,
        });
      }
    });

    (conversations || []).forEach(conv => {
      if ((conv.title || 'New conversation').toLowerCase().includes(q)) {
        results.push({
          type: 'conversation',
          id: conv.id,
          title: conv.title || 'New conversation',
          description: 'Chat conversation',
          path: '/chat',
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, candidates, conversations]);

  useEffect(() => { setSelectedIndex(0); }, [searchResults]);

  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleResultClick(searchResults[selectedIndex]);
    }
  };

  const handleResultClick = (result) => {
    if (!result) return;
    navigate(result.path);
    setSearchQuery('');
    setIsSearchOpen(false);
    inputRef.current?.blur();
  };

  const getResultIcon = (result) => {
    if (result.type === 'page') { const Icon = result.icon; return <Icon size={14} />; }
    if (result.type === 'candidate') return <User size={14} />;
    if (result.type === 'conversation') return <MessagesSquare size={14} />;
    return <FileText size={14} />;
  };

  const getTypeLabel = (type) => {
    if (type === 'page') return 'Page';
    if (type === 'candidate') return 'Candidate';
    if (type === 'conversation') return 'Chat';
    return '';
  };

  const getTypeColor = (type) => {
    if (type === 'page') return theme.colors.accent;
    if (type === 'candidate') return theme.colors.success;
    if (type === 'conversation') return theme.colors.warning;
    return theme.colors.textMuted;
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-3"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: theme.colors.accentLight }}
        >
          <PageIcon size={14} style={{ color: theme.colors.accent }} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight" style={{ color: theme.colors.textPrimary }}>
            {currentPage.title}
          </p>
          <p className="text-[10px] leading-tight" style={{ color: theme.colors.textMuted }}>
            {greeting()}, <span className="font-medium">{firstName}</span>
          </p>
        </div>
      </div>

      {/* Center: Search — single clean border */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-6">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: theme.colors.bgInput,
            border: `1.5px solid ${isFocused ? theme.colors.accent : theme.colors.border}`,
          }}
        >
          <Search size={15} style={{ color: isFocused ? theme.colors.accent : theme.colors.textMuted }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search candidates, chats, pages..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => { setIsFocused(true); setIsSearchOpen(true); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleSearchKeyDown}
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: theme.colors.textPrimary }}
          />
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="p-0.5 rounded"
            >
              <X size={13} style={{ color: theme.colors.textMuted }} />
            </button>
          ) : (
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline-block"
              style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}
            >
              /
            </kbd>
          )}
        </div>

        {/* Results dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden animate-slide-down z-50"
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: `0 12px 40px -8px rgba(0,0,0,0.25)`,
              maxHeight: '380px',
              overflowY: 'auto',
            }}
          >
            {searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.colors.border}40` }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>↑↓ navigate · ↵ select</span>
                </div>
                {searchResults.map((result, i) => {
                  const isSelected = i === selectedIndex;
                  const typeColor = getTypeColor(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id || result.path}-${i}`}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100"
                      style={{
                        backgroundColor: isSelected ? `${theme.colors.accent}10` : 'transparent',
                        borderBottom: i < searchResults.length - 1 ? `1px solid ${theme.colors.border}20` : 'none',
                      }}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isSelected ? `${typeColor}20` : theme.colors.bgTertiary, color: isSelected ? typeColor : theme.colors.textMuted }}>
                        {getResultIcon(result)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: isSelected ? theme.colors.accent : theme.colors.textPrimary }}>
                          <HighlightMatch text={result.title} query={searchQuery} />
                        </p>
                        <p className="text-[11px] truncate" style={{ color: theme.colors.textMuted }}>{result.description}</p>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
                        style={{ backgroundColor: `${typeColor}12`, color: typeColor }}>
                        {getTypeLabel(result.type)}
                      </span>
                      {isSelected && <ArrowRight size={12} className="flex-shrink-0" style={{ color: theme.colors.accent }} />}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="flex flex-col items-center py-8 px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: theme.colors.bgTertiary }}>
                  <Search size={18} style={{ color: theme.colors.textMuted }} />
                </div>
                <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>No results for "{searchQuery}"</p>
                <p className="text-[11px] mt-1" style={{ color: theme.colors.textMuted }}>Try searching by candidate name, skill, or page name</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: AI Ready indicator + Notification only (NO user avatar — it's in sidebar) */}
      <div className="flex items-center gap-2">
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ backgroundColor: `${theme.colors.success}08`, border: `1px solid ${theme.colors.success}15` }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.success, boxShadow: `0 0 4px ${theme.colors.success}60` }} />
          <span className="text-[10px] font-medium" style={{ color: theme.colors.success }}>AI Ready</span>
        </div>
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: theme.colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
