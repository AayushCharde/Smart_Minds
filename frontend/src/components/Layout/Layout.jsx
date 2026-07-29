import { useTheme } from '../../context/ThemeContext';
import { ToastProvider } from '../common/Toast';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }) {
  const { theme } = useTheme();

  return (
    <ToastProvider>
      <div
        className="min-h-screen"
        style={{ backgroundColor: theme.colors.bgPrimary }}
      >
        <Sidebar />
        <div className="ml-[240px] flex flex-col min-h-screen">
          <TopBar />
          <main
            className="flex-1 p-6"
            style={{ backgroundColor: theme.colors.bgSecondary }}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
