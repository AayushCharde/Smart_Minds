import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  Upload,
  Target,
  MessageSquare,
  Brain,
  Sparkles,
  User,
  LogOut,
  Settings,
  ChevronUp,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../common/ThemeSwitcher';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload & Screen', icon: Upload },
  { path: '/match', label: 'Job Matcher', icon: Target },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const initials = (user?.firstName?.[0] || email[0] || 'U').toUpperCase();

  // Close account menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut(() => navigate('/sign-in'));
  };

  const handleProfile = () => {
    openUserProfile();
    setAccountOpen(false);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30"
      style={{
        backgroundColor: theme.colors.bgSidebar,
        borderRight: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: theme.colors.gradientPrimary }}
        >
          <Brain size={18} color="#FFFFFF" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold tracking-tight" style={{ color: theme.colors.textPrimary }}>
            HireMinds
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
            style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accentText }}
          >
            <Sparkles size={8} />
            AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: theme.colors.textMuted }}>
          Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive ? theme.colors.bgActive : 'transparent',
                  color: isActive ? theme.colors.accentText : theme.colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                )}
                <Icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 space-y-3" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
        <ThemeSwitcher />

        {/* Account section with expandable menu */}
        <div ref={accountRef} className="relative">
          {/* Account menu popup — appears above the trigger */}
          {accountOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl overflow-hidden animate-slide-up z-50"
              style={{
                backgroundColor: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: `0 -8px 30px -6px rgba(0,0,0,0.2)`,
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.colors.border}40` }}>
                <p className="text-sm font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                  {user?.fullName || firstName}
                </p>
                <p className="text-[11px] truncate" style={{ color: theme.colors.textMuted }}>
                  {email}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Settings size={15} />
                  Manage Account
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                  style={{ color: theme.colors.danger }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.danger}08`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Account trigger button */}
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
            style={{
              backgroundColor: accountOpen ? theme.colors.bgActive : theme.colors.bgTertiary,
            }}
            onMouseEnter={(e) => {
              if (!accountOpen) e.currentTarget.style.backgroundColor = theme.colors.bgHover;
            }}
            onMouseLeave={(e) => {
              if (!accountOpen) e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
            }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
                color: '#FFFFFF',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                {firstName}
              </p>
              <p className="text-[10px] truncate" style={{ color: theme.colors.textMuted }}>
                {email || 'Account'}
              </p>
            </div>
            <ChevronUp
              size={14}
              className="flex-shrink-0 transition-transform duration-200"
              style={{
                color: theme.colors.textMuted,
                transform: accountOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
