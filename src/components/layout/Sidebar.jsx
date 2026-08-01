import { useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSessions } from '../../context/SessionsContext';
import { useShare } from '../../hooks/useShare';
import { usePustaka } from '../../hooks/usePustaka';
import HistoryItem from '../sidebar/HistoryItem';
import ProfileButton from '../sidebar/ProfileButton';

export default function Sidebar({ collapsed, mobileOpen, onToggle, onCloseMobile }) {
  const { user, isGuest, requireAuthOrRedirect } = useAuth();
  const {
    sessions,
    activeSessionId,
    newReplyDots,
    loadSidebarHistory,
    loadSession,
    startNewChat,
    setActiveSession,
    deleteSession,
  } = useSessions();
  const { openPustakaModal } = usePustaka();
  const { shareSpecificSession } = useShare();

  // Sync collapsed/mobileOpen classes to the #sidebar element
  useEffect(() => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (mobileOpen) {
      sidebar.classList.add('mobile-open');
      sidebar.classList.remove('collapsed');
    } else if (collapsed) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('mobile-open');
    } else {
      sidebar.classList.remove('collapsed', 'mobile-open');
    }
  }, [collapsed, mobileOpen]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    onCloseMobile();
  }, [startNewChat, onCloseMobile]);

  const handlePustakaClick = useCallback(() => {
    if (requireAuthOrRedirect('Harap Login terlebih dahulu untuk mengakses Pustaka. Login sekarang?')) {
      openPustakaModal();
    }
    onCloseMobile();
  }, [requireAuthOrRedirect, openPustakaModal, onCloseMobile]);

  // Load sessions when user changes
  useEffect(() => {
    if (user || isGuest) {
      loadSidebarHistory();
    }
  }, [user, isGuest, loadSidebarHistory]);

  // Handle share click from HistoryItem
  const handleShareSession = useCallback(async (session) => {
    try {
      // Load messages for this session from DB
      const rows = await loadSession(session.session_id);
      if (!rows || rows.length === 0) {
        alert('Tidak ada pesan untuk dibagikan');
        return;
      }
      await shareSpecificSession(session.session_id, session.title, rows);
    } catch (err) {
      console.error('Share error:', err);
      alert('Gagal membagikan percakapan');
    }
  }, [loadSession, shareSpecificSession]);

  return (
    <aside
      id="sidebar"
      className="bg-[#0F0F10] border-r border-[#1F1F21] flex flex-col h-full max-h-[100dvh] min-h-0 overflow-hidden flex-shrink-0"
    >
      {/* Header: "Dashboard" label + bars button */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-transparent header-content">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hide-on-collapsed flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-yellow-500" /> Dashboard
        </span>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-yellow-500 p-2 rounded-full hover:bg-yellow-500/10 transition cursor-pointer flex-shrink-0"
          title="Menu"
        >
          <i className="fa-solid fa-bars text-xl" />
        </button>
      </div>

      {/* Chat Baru button */}
      <div className="px-4 py-4 shrink-0 sidebar-padding flex justify-center">
        <button
          onClick={handleNewChat}
          className="chat-btn-wrapper flex items-center gap-3 w-full px-4 py-3.5 bg-[#1A1A1C] hover:bg-[#252528] rounded-xl text-sm text-gray-200 transition border border-[#2A2A2E] hover:border-yellow-500/50 group cursor-pointer shadow-lg active:scale-95 overflow-hidden whitespace-nowrap"
        >
          <div className="chat-btn-icon w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500 transition shrink-0">
            <i className="fa-solid fa-plus text-yellow-500 text-[10px] group-hover:text-black" />
          </div>
          <span className="font-semibold hide-on-collapsed group-hover:text-white">Chat Baru</span>
        </button>
      </div>

      {/* Pustaka button - hidden for guests */}
      {!isGuest && (
        <div className="px-4 pb-2 shrink-0 sidebar-padding flex justify-center hide-on-guest" id="pustaka-btn-container">
          <button
            onClick={handlePustakaClick}
            className="chat-btn-wrapper flex items-center gap-3 w-full px-4 py-2.5 bg-[#1A1A1C] hover:bg-[#252528] rounded-xl text-sm text-gray-400 transition border border-[#2A2A2E] hover:border-blue-500/50 group cursor-pointer shadow-sm active:scale-95 overflow-hidden whitespace-nowrap"
          >
            <div className="chat-btn-icon w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 transition shrink-0">
              <i className="fa-solid fa-book-open text-blue-500 text-[10px] group-hover:text-white" />
            </div>
            <span className="font-semibold hide-on-collapsed group-hover:text-white">Pustaka</span>
          </button>
        </div>
      )}

      {/* History list - SATU-SATUNYA KONTANER YANG BERSIFAT SCROLLABLE */}
      <div
        className="history-scroll-container flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 overscroll-contain"
        style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="px-2 py-2 text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider sticky top-0 bg-[#0F0F10] z-10 border-b border-white/5 hide-on-collapsed">
          Riwayat
        </div>
        <div id="history-list" className="space-y-0.5 pb-4 hide-on-collapsed">
          {sessions.length === 0 ? (
            <p className="text-center text-gray-600 text-xs py-4">Belum ada percakapan</p>
          ) : (
            sessions.map((session) => (
              <HistoryItem
                key={session.session_id}
                session={session}
                isActive={activeSessionId === session.session_id}
                hasNewReply={newReplyDots.has(session.session_id)}
                isGuest={isGuest}
                onClick={() => {
                  setActiveSession(session.session_id);
                  onCloseMobile();
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteSession(session.session_id);
                }}
                onShare={() => handleShareSession(session)}
              />
            ))
          )}
        </div>
      </div>

      {/* Profile section - DIKUNCI DI PALING BAWAH TANPA MENINDIH RIWAYAT */}
      <div className="p-4 border-t border-[#1F1F21] bg-[#0F0F10] sidebar-padding flex justify-center shrink-0">
        <ProfileButton />
      </div>
    </aside>
  );
}
