import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { useChat } from '../hooks/useChat';
import { useSuggestions } from '../hooks/useSuggestions';
import { useShare } from '../hooks/useShare';
import AppShell from '../components/layout/AppShell';
import ChatContainer from '../components/chat/ChatContainer';
import ShareModal from '../components/modals/ShareModal';
import ResetPasswordModal from '../components/modals/ResetPasswordModal';
import PustakaModal from '../components/modals/PustakaModal';
import VoiceCallModal from '../components/modals/VoiceCallModal';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const { user, isGuest, isLoading: authLoading, showResetPasswordModal, setShowResetPasswordModal } = useAuth();

  // SessionsContext — shared singleton state
  const { currentSessionId, loadSidebarHistory, forkSession, startNewChat } = useSessions();

  // Chat
  const { messages, isSending, sendMessage, stopGeneration } = useChat();

  // Suggestions
  const { suggestions, isLoading: suggestionsLoading } = useSuggestions();

  // Share
  const {
    isModalOpen: isShareModalOpen,
    shareLink,
    closeShareModal,
    forkSession: shareForkSession,
    shareCurrentSession,
  } = useShare();

  // Local input state
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputValueRef = useRef('');
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  inputValueRef.current = inputValue;

  // ─── Redirect if not authenticated ───────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      navigate('/login');
    }
  }, [authLoading, user, isGuest, navigate]);

  // ─── Handle fork from share link ─────────────────────────────────────────────
  const hasForkedRef = useRef(false);
  useEffect(() => {
    const forkId = searchParams.get('fork');
    const pendingFork = localStorage.getItem('pendingFork');

    if (forkId && !hasForkedRef.current) {
      hasForkedRef.current = true;
      if (!user && !isGuest) {
        localStorage.setItem('pendingFork', forkId);
        navigate('/login');
        return;
      }
      (async () => {
        try {
          const data = await shareForkSession(forkId);
          if (data) await forkSession(forkId, data.title, data.messages);
          else startNewChat();
          localStorage.removeItem('pendingFork');
        } catch {
          startNewChat();
        } finally {
          navigate('/', { replace: true });
        }
      })();
    } else if (pendingFork && user && !hasForkedRef.current) {
      hasForkedRef.current = true;
      (async () => {
        try {
          const data = await shareForkSession(pendingFork);
          if (data) await forkSession(pendingFork, data.title, data.messages);
          localStorage.removeItem('pendingFork');
        } catch {
        } finally {
          navigate('/', { replace: true });
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, isGuest]);

  // ─── Load sessions when auth ready ───────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (user || isGuest)) {
      loadSidebarHistory();
    }
  }, [authLoading, user, isGuest, loadSidebarHistory]);

  // ─── Create initial session ───────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (user || isGuest) && !currentSessionId) {
      startNewChat();
    }
  }, [authLoading, user, isGuest, currentSessionId, startNewChat]);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e, file = null) => {
    if (e?.preventDefault) e.preventDefault();
    const text = inputValueRef.current;
    if (!text.trim() && !file) return;
    setInputValue('');
    inputValueRef.current = '';
    const ta = document.getElementById('msg-input');
    if (ta) ta.style.height = 'auto';
    await sendMessage(text, file);
  }, [sendMessage]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setInputValue(val);
    inputValueRef.current = val;
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  // Click suggestion card (Welcome screen) → send directly
  const handleSuggestionClick = useCallback((text) => {
    if (!text?.trim()) return;
    sendMessage(text);
  }, [sendMessage]);

  // Click edit button on a sent user message → populate textarea for editing (NO auto send)
  const handleEditMessage = useCallback((text) => {
    if (!text?.trim()) return;
    setInputValue(text);
    inputValueRef.current = text;
    setTimeout(() => {
      const ta = document.getElementById('msg-input');
      if (ta) {
        ta.focus();
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }
    }, 50);
  }, []);

  const handleShareClick = useCallback(() => {
    if (currentSessionId) shareCurrentSession(messagesRef.current);
  }, [currentSessionId, shareCurrentSession]);

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <i className="fa-solid fa-circle-notch fa-spin text-yellow-500 text-3xl" />
          <span className="text-gray-400 text-sm">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {({ toggleSidebar }) => (
        <>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center px-4 py-3 md:px-6 md:py-4 border-b border-[#1F1F21] bg-[#0F0F10]/90 backdrop-blur z-30 shrink-0 gap-3">

            {/* Hamburger (mobile) */}
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-yellow-500 md:hidden transition shrink-0 p-1"
              aria-label="Buka sidebar"
            >
              <i className="fa-solid fa-bars text-lg" />
            </button>

            {/* Brand */}
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
              <span id="header-title" className="text-base font-bold text-white shrink-0">
                KangAjie <span className="text-yellow-500">AI</span>
              </span>
              <span className="hidden sm:inline shrink-0 bg-yellow-500/10 text-yellow-500 text-[9px] px-2 py-0.5 rounded-full border border-yellow-500/20 font-bold">
                Free-Tier
              </span>
            </div>

            {/* Share button */}
            {currentSessionId && !isGuest && messages.length > 0 && (
              <button
                id="header-share-btn"
                onClick={handleShareClick}
                title="Bagikan percakapan ini"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-white border border-[#2A2A2E] hover:border-yellow-500/40 rounded-xl text-xs transition"
              >
                <i className="fa-solid fa-share-nodes text-[10px]" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
            )}

            {/* Live Voice Call (Telepon AI) button */}
            <button
              id="header-voice-call-btn"
              onClick={() => setIsVoiceCallOpen(true)}
              title="Mulai panggilan suara langsung dengan KangAjie AI (Voice Mode)"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/15 to-yellow-500/15 hover:from-emerald-500/25 hover:to-yellow-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <i className="fa-solid fa-phone-volume text-xs" />
              <span className="hidden sm:inline">Telepon AI</span>
            </button>
          </div>

          {/* ── Chat Area ──────────────────────────────────────────────────── */}
          <ChatContainer
            messages={messages}
            isSending={isSending}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onStop={stopGeneration}
            onSuggestionClick={handleSuggestionClick}
            onEditMessage={handleEditMessage}
            messagesEndRef={messagesEndRef}
            onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
          />

          {/* ── Modals ─────────────────────────────────────────────────────── */}
          <ShareModal isOpen={isShareModalOpen} shareLink={shareLink} onClose={closeShareModal} />
          <PustakaModal />
          <ResetPasswordModal isOpen={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)} />
          <VoiceCallModal
            isOpen={isVoiceCallOpen}
            onClose={() => setIsVoiceCallOpen(false)}
          />
        </>
      )}
    </AppShell>
  );
}
