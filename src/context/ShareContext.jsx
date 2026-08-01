import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSessions } from './SessionsContext';
import { shareSession, getSharedConversation } from '../services/shareApi';

const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const { user, requireAuthOrRedirect } = useAuth();
  const { currentSessionId, sessions, loadSession } = useSessions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Share current session (from header) ──────────────────────────────────────
  const shareCurrentSession = useCallback(async (currentMessages = []) => {
    if (!user) {
      requireAuthOrRedirect('Harap Login terlebih dahulu untuk membagikan percakapan.');
      return;
    }
    if (!currentSessionId) return;

    const sessionMessages = (currentMessages || [])
      .filter(m => m.sessionId === currentSessionId)
      .map(m => ({
        role: m.role,
        message: m.rawText || m.text || '',
        created_at: new Date().toISOString(),
      }));

    if (sessionMessages.length === 0) {
      alert('Tidak ada pesan untuk dibagikan');
      return;
    }

    setIsLoading(true);
    try {
      const session = sessions.find(s => s.session_id === currentSessionId);
      const title = session?.title || 'Percakapan';
      const shareId = await shareSession(currentSessionId, title, sessionMessages, user.id);
      if (shareId) {
        setShareLink(`${window.location.origin}/share?id=${shareId}`);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Share error:', err);
      alert('Gagal membagikan percakapan');
    } finally {
      setIsLoading(false);
    }
  }, [user, requireAuthOrRedirect, currentSessionId, sessions]);

  // ─── Share specific session (from sidebar HistoryItem) ────────────────────────
  const shareSpecificSession = useCallback(async (sessionId, title) => {
    if (!user) {
      requireAuthOrRedirect('Harap Login terlebih dahulu untuk membagikan percakapan.');
      return;
    }

    setIsLoading(true);
    try {
      // Load messages dari DB
      const rows = await loadSession(sessionId);
      if (!rows || rows.length === 0) {
        alert('Tidak ada pesan untuk dibagikan');
        return;
      }

      const sessionMessages = rows.map(r => ({
        role: r.role,
        message: r.message || '',
        created_at: r.created_at || new Date().toISOString(),
      }));

      const shareId = await shareSession(sessionId, title || 'Percakapan', sessionMessages, user.id);
      if (shareId) {
        setShareLink(`${window.location.origin}/share?id=${shareId}`);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Share specific error:', err);
      alert('Gagal membagikan percakapan');
    } finally {
      setIsLoading(false);
    }
  }, [user, requireAuthOrRedirect, loadSession]);

  // ─── Fork a shared conversation ───────────────────────────────────────────────
  const forkSession = useCallback(async (shareId) => {
    try {
      const data = await getSharedConversation(shareId);
      if (data) return { title: data.title, messages: data.messages || [] };
    } catch (err) {
      console.error('Fork error:', err);
    }
    return null;
  }, []);

  const copyShareLink = useCallback(() => {
    if (shareLink) navigator.clipboard.writeText(shareLink).catch(console.error);
  }, [shareLink]);

  const closeShareModal = useCallback(() => {
    setIsModalOpen(false);
    setShareLink('');
  }, []);

  const value = {
    isModalOpen,
    shareLink,
    isLoading,
    shareCurrentSession,
    shareSpecificSession,
    copyShareLink,
    closeShareModal,
    forkSession,
  };

  return (
    <ShareContext.Provider value={value}>
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const ctx = useContext(ShareContext);
  if (!ctx) throw new Error('useShare must be used within ShareProvider');
  return ctx;
}
