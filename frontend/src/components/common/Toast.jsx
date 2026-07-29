import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, entering: true }]);
    // Start exit animation before removal
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, entering: false } : t));
    }, duration - 300);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, entering: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  const { theme } = useTheme();

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  const colors = {
    success: { bg: theme.colors.successBg, text: theme.colors.success, border: theme.colors.success },
    error: { bg: theme.colors.dangerBg, text: theme.colors.danger, border: theme.colors.danger },
    info: { bg: theme.colors.accentLight, text: theme.colors.accent, border: theme.colors.accent },
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const c = colors[toast.type] || colors.info;
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl min-w-[320px] max-w-[440px]"
            style={{
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}20`,
              boxShadow: `0 8px 24px ${c.border}15`,
              animation: toast.entering ? 'slideUp 250ms ease-out' : 'fadeOut 250ms ease-in forwards',
            }}
          >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
