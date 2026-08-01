import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  loadSessions as apiLoadSessions,
  saveSessionTitle as apiSaveSessionTitle,
  deleteSession as apiDeleteSession,
  loadSessionHistory,
  saveMessage,
  saveMessagesBulk,
} from '../services/sessionsApi';
import { generateId } from '../lib/utils';

const SessionsContext = createContext(null);

export function SessionsProvider({ children }) {
  const { user, isGuest } = useAuth();

  const [sessions, setSessions] = useState([]);          // logged-in user sessions
  const [guestSessions, setGuestSessions] = useState([]); // guest in-memory sessions
  const [guestHistory, setGuestHistory] = useState([]);   // guest in-memory messages
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [newReplyDots, setNewReplyDots] = useState(new Set());

  const userRef = useRef(user);
  const isGuestRef = useRef(isGuest);
  userRef.current = user;
  isGuestRef.current = isGuest;

  // ─── Display sessions (unified) ──────────────────────────────────────────────
  const displaySessions = isGuest ? guestSessions : sessions;

  // ─── Refresh sessions from DB ─────────────────────────────────────────────────
  const refreshSessions = useCallback(async () => {
    const u = userRef.current;
    if (!u || isGuestRef.current) return;
    const data = await apiLoadSessions(u.id);
    setSessions(data || []);
  }, []);

  // ─── Load sidebar history ─────────────────────────────────────────────────────
  const loadSidebarHistory = useCallback(async () => {
    const u = userRef.current;
    const guest = isGuestRef.current;
    if (guest) {
      // guest: nothing to load from DB, guestSessions already in state
    } else if (u) {
      await refreshSessions();
    }
  }, [refreshSessions]);

  // ─── Load session messages ────────────────────────────────────────────────────
  const loadSession = useCallback(async (sessionId) => {
    const u = userRef.current;
    const guest = isGuestRef.current;
    if (guest) {
      return guestHistory.filter(h => h.session_id === sessionId);
    } else if (u) {
      return await loadSessionHistory(sessionId, u.id);
    }
    return [];
  }, [guestHistory]);

  // ─── Save session title ───────────────────────────────────────────────────────
  const saveSessionTitle = useCallback(async (sessionId, title) => {
    const u = userRef.current;
    const guest = isGuestRef.current;

    if (guest) {
      setGuestSessions(prev => {
        const idx = prev.findIndex(s => s.session_id === sessionId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], title };
          return updated;
        }
        return [{ session_id: sessionId, title, created_at: new Date().toISOString() }, ...prev];
      });
    } else if (u) {
      await apiSaveSessionTitle(sessionId, u.id, title);
      // Refresh sidebar: update title in-place without full reload for speed
      setSessions(prev => {
        const idx = prev.findIndex(s => s.session_id === sessionId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], title };
          return updated;
        }
        // If not found, fetch from DB
        refreshSessions();
        return prev;
      });
    }
  }, [refreshSessions]);

  // ─── Save message to DB/state ─────────────────────────────────────────────────
  const saveDataForSession = useCallback(async (sessionId, role, message) => {
    const u = userRef.current;
    const guest = isGuestRef.current;
    if (guest) {
      setGuestHistory(prev => [
        ...prev,
        { session_id: sessionId, role, message, created_at: new Date().toISOString() },
      ]);
    } else if (u) {
      await saveMessage(sessionId, u.id, role, message);
    }
  }, []);

  // ─── Start new chat (Lazy: tidak buat di DB/sidebar sampai ada pesan) ────────
  const startNewChat = useCallback(() => {
    const newId = generateId();
    setCurrentSessionId(newId);
    setActiveSessionId(newId);
    setNewReplyDots(new Set());
    // Tidak menyimpan percakapan kosong ke database atau guestSessions
    return newId;
  }, []);

  // ─── Set active session (history click) ──────────────────────────────────────
  const setActiveSession = useCallback((sessionId) => {
    setCurrentSessionId(sessionId);
    setActiveSessionId(sessionId);
    setNewReplyDots(prev => {
      const s = new Set(prev);
      s.delete(sessionId);
      return s;
    });
  }, []);

  // ─── Delete session (Optimistic & Cepat) ──────────────────────────────────────
  const deleteSession = useCallback(async (sessionId) => {
    if (!window.confirm('Hapus percakapan ini?')) return;

    const u = userRef.current;
    const guest = isGuestRef.current;

    // Langsung hapus seketika dari tampilan UI (Optimistic update)
    setSessions(prev => prev.filter(s => s.session_id !== sessionId));
    setGuestSessions(prev => prev.filter(s => s.session_id !== sessionId));
    setGuestHistory(prev => prev.filter(h => h.session_id !== sessionId));

    if (u) {
      apiDeleteSession(sessionId, u.id).then(() => {
        refreshSessions();
      });
    }

    // If deleted was current → start new draft session
    setCurrentSessionId(prev => {
      if (prev === sessionId) {
        const newId = generateId();
        setActiveSessionId(newId);
        return newId;
      }
      return prev;
    });
  }, [refreshSessions]);

  // ─── Add new reply dot ────────────────────────────────────────────────────────
  const addNewReplyDot = useCallback((sessionId) => {
    setNewReplyDots(prev => new Set(prev).add(sessionId));
  }, []);

  // ─── Fork session from share ──────────────────────────────────────────────────
  const forkSession = useCallback(async (shareId, title, messages) => {
    const newId = generateId();
    const u = userRef.current;
    const guest = isGuestRef.current;

    if (u) {
      await saveMessagesBulk(messages, newId, u.id);
      await apiSaveSessionTitle(newId, u.id, title || 'Percakapan Baru');
      await refreshSessions();
    } else {
      setGuestHistory(messages.map(m => ({
        session_id: newId,
        role: m.role,
        message: m.message,
        created_at: new Date().toISOString(),
      })));
      setGuestSessions(prev => [
        { session_id: newId, title: title || 'Percakapan Baru', created_at: new Date().toISOString() },
        ...prev,
      ]);
    }

    setCurrentSessionId(newId);
    setActiveSessionId(newId);
    return newId;
  }, [refreshSessions]);

  const value = {
    // State
    sessions: displaySessions,
    rawSessions: sessions,
    guestSessions,
    guestHistory,
    currentSessionId,
    activeSessionId,
    newReplyDots,
    isGuest,
    // Actions
    loadSidebarHistory,
    loadSession,
    saveSessionTitle,
    saveDataForSession,
    startNewChat,
    setActiveSession,
    deleteSession,
    addNewReplyDot,
    forkSession,
    refreshSessions,
  };

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}

// Custom hook
export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error('useSessions must be used within SessionsProvider');
  return ctx;
}
