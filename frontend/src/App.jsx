import { lazy, Suspense } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// ─── Lazy-loaded page components (code splitting) ───────────────────
// Each page is loaded on-demand, reducing the initial bundle size.
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const UploadPage = lazy(() => import('./components/Upload/UploadPage'));
const CandidateDetail = lazy(() => import('./components/Upload/CandidateDetail'));
const MatcherPage = lazy(() => import('./components/Matcher/MatcherPage'));
const ChatPage = lazy(() => import('./components/Chat/ChatPage'));

// ─── Suspense fallback ──────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
        <span className="text-sm opacity-50">Loading...</span>
      </div>
    </div>
  );
}

// ─── Clerk Appearance — dark theme matching HireMinds brand ────────
const clerkAppearance = {
  variables: {
    colorPrimary: '#06B6D4',
    colorBackground: '#0F172A',
    colorText: '#E2E8F0',
    colorTextSecondary: '#94A3B8',
    colorInputBackground: '#1E293B',
    colorInputText: '#E2E8F0',
    borderRadius: '0.75rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '400px',
    },
    card: {
      backgroundColor: '#1E293B',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      borderRadius: '1rem',
      boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.5)',
    },
    headerTitle: {
      color: '#F1F5F9',
      fontWeight: '700',
      fontSize: '1.25rem',
    },
    headerSubtitle: {
      color: '#94A3B8',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
      border: 'none',
      borderRadius: '0.75rem',
      fontWeight: '600',
      padding: '0.625rem 1rem',
      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
    },
    formFieldInput: {
      backgroundColor: '#0F172A',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      borderRadius: '0.75rem',
      color: '#E2E8F0',
    },
    formFieldLabel: {
      color: '#94A3B8',
      fontWeight: '500',
      fontSize: '0.8125rem',
    },
    footerActionLink: {
      color: '#06B6D4',
      fontWeight: '600',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#0F172A',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      borderRadius: '0.75rem',
      color: '#E2E8F0',
    },
    dividerLine: {
      backgroundColor: 'rgba(148, 163, 184, 0.15)',
    },
    dividerText: {
      color: '#64748B',
    },
    identityPreviewEditButton: {
      color: '#06B6D4',
    },
    formResendCodeLink: {
      color: '#06B6D4',
    },
    otpCodeFieldInput: {
      backgroundColor: '#0F172A',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      color: '#E2E8F0',
    },
    alert: {
      borderRadius: '0.75rem',
    },
  },
};

// ─── Auth Page ─────────────────────────────────────────────────────
function AuthPage({ children }) {
  const features = [
    { icon: '🧠', title: 'AI-Powered Parsing', desc: 'Auto-extract skills, experience & education from any resume' },
    { icon: '🎯', title: 'Smart Matching', desc: 'Score candidates against job descriptions with 4-criteria AI' },
    { icon: '💬', title: 'Resume Q&A', desc: 'Chat with AI about your candidates using RAG technology' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Pipeline overview, skills cloud & real-time hiring insights' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0B1120' }}>
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background effects */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.06) 0%, transparent 40%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a4 4 0 0 1 4-4z" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
                <circle cx="17" cy="10" r="2" />
                <path d="M21 21v-2a3 3 0 0 0-2-2.83" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">HireMinds</h1>
              <p className="text-xs text-cyan-400 font-semibold tracking-wide">AI-POWERED RECRUITMENT</p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 -mt-8">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Hire Smarter.<br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Match Faster.
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Transform your recruitment workflow with AI that parses resumes, scores candidates, and answers your hiring questions.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { val: '50+', label: 'Resumes/batch' },
            { val: '4', label: 'Scoring criteria' },
            { val: '<15s', label: 'Match time' },
            { val: '8', label: 'Themes' },
          ].map(({ val, label }) => (
            <div key={label}>
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Auth form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a4 4 0 0 1 4-4z" />
              <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
              <circle cx="17" cy="10" r="2" />
              <path d="M21 21v-2a3 3 0 0 0-2-2.83" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">HireMinds</span>
        </div>

        <div className="w-full max-w-sm relative z-10">
          {children}
        </div>

        <p className="text-xs text-slate-600 mt-8 text-center relative z-10">
          Powered by AI · Secure · Fast
        </p>
      </div>
    </div>
  );
}

// ─── Routes ────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in/*" element={
          <SignedOut>
            <AuthPage>
              <SignIn
                routing="path"
                path="/sign-in"
                appearance={clerkAppearance}
                signUpUrl="/sign-up"
              />
            </AuthPage>
          </SignedOut>
        } />
        <Route path="/sign-up/*" element={
          <SignedOut>
            <AuthPage>
              <SignUp
                routing="path"
                path="/sign-up"
                appearance={clerkAppearance}
                signInUrl="/sign-in"
              />
            </AuthPage>
          </SignedOut>
        } />
        <Route path="/*" element={
          <>
            <SignedIn>
              <AppProvider>
                <Layout>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/candidate/:id" element={<CandidateDetail />} />
                        <Route path="/match" element={<MatcherPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </Layout>
              </AppProvider>
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
