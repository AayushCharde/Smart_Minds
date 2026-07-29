import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { useApi } from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { apiFetch } = useApi();

  // ─── Candidates ───
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const candidatesFetchRef = useRef(null);

  const loadCandidates = useCallback(async (force = false) => {
    if (candidatesLoading && !force) return candidates;
    if (candidatesLoaded && !force) return candidates;

    // Deduplicate concurrent calls
    if (candidatesFetchRef.current && !force) return candidatesFetchRef.current;

    const promise = (async () => {
      setCandidatesLoading(true);
      setCandidatesError(null);
      try {
        const res = await apiFetch('/api/candidates');
        if (res.success) {
          setCandidates(res.data);
          setCandidatesLoaded(true);
          return res.data;
        }
        setCandidatesError(res.error || 'Failed to load candidates');
      } catch (err) {
        console.error('Failed to load candidates:', err);
        setCandidatesError(err.message);
      } finally {
        setCandidatesLoading(false);
        candidatesFetchRef.current = null;
      }
      return candidates;
    })();

    candidatesFetchRef.current = promise;
    return promise;
  }, [apiFetch, candidates, candidatesLoaded, candidatesLoading]);

  const addCandidate = useCallback((candidate) => {
    setCandidates(prev => {
      if (prev.find(c => c.id === candidate.id)) return prev;
      return [...prev, candidate];
    });
  }, []);

  const removeCandidate = useCallback((candidateId) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
  }, []);

  // ─── Stats ───
  const [stats, setStats] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const statsFetchRef = useRef(null);

  const loadStats = useCallback(async (force = false) => {
    if (statsLoading && !force) return stats;
    if (statsLoaded && !force) return stats;
    if (statsFetchRef.current && !force) return statsFetchRef.current;

    const promise = (async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const res = await apiFetch('/api/stats');
        if (res.success) {
          setStats(res.data);
          setStatsLoaded(true);
          return res.data;
        }
        setStatsError(res.error || 'Failed to load stats');
      } catch (err) {
        console.error('Failed to load stats:', err);
        setStatsError(err.message);
      } finally {
        setStatsLoading(false);
        statsFetchRef.current = null;
      }
      return stats;
    })();

    statsFetchRef.current = promise;
    return promise;
  }, [apiFetch, stats, statsLoaded, statsLoading]);

  // ─── Conversations ───
  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const convFetchRef = useRef(null);

  const loadConversations = useCallback(async (force = false) => {
    if (conversationsLoading && !force) return conversations;
    if (conversationsLoaded && !force) return conversations;
    if (convFetchRef.current && !force) return convFetchRef.current;

    const promise = (async () => {
      setConversationsLoading(true);
      setConversationsError(null);
      try {
        const res = await apiFetch('/api/conversations');
        if (res.success) {
          setConversations(res.data);
          setConversationsLoaded(true);
          return res.data;
        }
        setConversationsError(res.error || 'Failed to load conversations');
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setConversationsError(err.message);
      } finally {
        setConversationsLoading(false);
        convFetchRef.current = null;
      }
      return conversations;
    })();

    convFetchRef.current = promise;
    return promise;
  }, [apiFetch, conversations, conversationsLoaded, conversationsLoading]);

  const removeConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Matcher results (persisted across navigation) ───
  const [matcherResults, setMatcherResults] = useState(null);
  const [matcherJobTitle, setMatcherJobTitle] = useState('');
  const [matcherJobDesc, setMatcherJobDesc] = useState('');

  // ─── Invalidation helpers ───
  const invalidateStats = useCallback(() => {
    setStatsLoaded(false);
  }, []);

  const invalidateCandidates = useCallback(() => {
    setCandidatesLoaded(false);
  }, []);

  const invalidateAll = useCallback(() => {
    setCandidatesLoaded(false);
    setStatsLoaded(false);
    setConversationsLoaded(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Candidates
    candidates, candidatesLoaded, candidatesLoading, candidatesError,
    loadCandidates, addCandidate, removeCandidate, setCandidates,
    // Stats
    stats, statsLoaded, statsLoading, statsError, loadStats, invalidateStats,
    // Conversations
    conversations, conversationsLoaded, conversationsLoading, conversationsError,
    loadConversations, setConversations, removeConversation,
    // Matcher
    matcherResults, setMatcherResults,
    matcherJobTitle, setMatcherJobTitle,
    matcherJobDesc, setMatcherJobDesc,
    // Utils
    invalidateAll, invalidateCandidates,
  }), [
    candidates, candidatesLoaded, candidatesLoading, candidatesError,
    loadCandidates, addCandidate, removeCandidate,
    stats, statsLoaded, statsLoading, statsError, loadStats, invalidateStats,
    conversations, conversationsLoaded, conversationsLoading, conversationsError,
    loadConversations, removeConversation,
    matcherResults, matcherJobTitle, matcherJobDesc,
    invalidateAll, invalidateCandidates,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
