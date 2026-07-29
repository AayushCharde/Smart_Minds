import { useAuth } from '@clerk/clerk-react';
import { useCallback, useRef } from 'react';

// In Docker (Nginx proxy): use relative path. In dev: use localhost:8000
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * API hook — provides authenticated fetch functions with:
 * - Automatic JWT Bearer token injection
 * - AbortController support for request cancellation
 * - Proper Content-Type handling for FormData vs JSON
 * - Structured error responses matching backend {success, data, error} format
 */
export function useApi() {
  const { getToken } = useAuth();
  // Track active AbortControllers for cleanup
  const controllersRef = useRef(new Set());

  /**
   * Standard API fetch — returns parsed JSON response.
   * Supports AbortController via options.signal for cancellation.
   */
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = await getToken();

    if (!token) {
      console.warn('[API] No auth token available — user may not be signed in');
      return { success: false, error: 'Not authenticated. Please sign in.' };
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    // Skip Content-Type for FormData — let browser set multipart boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      // Handle non-JSON responses (e.g. 502 from proxy)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        return { success: false, error: text || `HTTP ${res.status}` };
      }

      const data = await res.json();
      return data;
    } catch (err) {
      // Don't log aborted requests as errors
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }
      console.error(`[API] Request to ${url} failed:`, err);
      return { success: false, error: `Connection error: ${err.message}` };
    }
  }, [getToken]);

  /**
   * Stream fetch for SSE endpoints (e.g. /api/ask-stream).
   * Returns the raw Response so the caller can read the stream.
   * Supports AbortController via options.signal for stream cancellation.
   */
  const apiStreamFetch = useCallback(async (url, options = {}) => {
    const token = await getToken();

    if (!token) {
      throw new Error('Not authenticated. Please sign in.');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    return res;
  }, [getToken]);

  /**
   * Create an AbortController and register it for cleanup.
   * Call controller.abort() to cancel the request.
   */
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    controllersRef.current.add(controller);
    // Auto-remove when aborted or garbage-collected
    controller.signal.addEventListener('abort', () => {
      controllersRef.current.delete(controller);
    });
    return controller;
  }, []);

  /**
   * Cancel all active requests. Useful for component unmount cleanup.
   */
  const cancelAll = useCallback(() => {
    controllersRef.current.forEach(controller => {
      try { controller.abort(); } catch { /* already aborted */ }
    });
    controllersRef.current.clear();
  }, []);

  return { apiFetch, apiStreamFetch, createAbortController, cancelAll };
}
