import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSharedConversation } from '../services/shareApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from '../components/markdown/CodeBlock';
import ImageCard from '../components/markdown/ImageCard';

export default function SharePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isScrolledUp);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  }, []);

  // Load shared conversation
  useEffect(() => {
    const shareId = searchParams.get('id');

    if (!shareId) {
      setError('ID percakapan tidak ditemukan');
      setIsLoading(false);
      return;
    }

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        const data = await getSharedConversation(shareId);
        if (!data) {
          setError('Percakapan tidak ditemukan');
        } else {
          setConversation(data);
        }
      } catch (err) {
        console.error('Error loading shared conversation:', err);
        setError('Gagal memuat percakapan');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [searchParams]);

  // Fork conversation
  const handleFork = () => {
    if (conversation) {
      navigate('/?fork=' + searchParams.get('id'));
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0F0F10] flex items-center justify-center flex-col gap-3">
        <i className="fa-solid fa-circle-notch fa-spin text-yellow-500 text-3xl" />
        <span className="text-gray-400 text-sm">Memuat percakapan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0F0F10] flex items-center justify-center flex-col gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1C] border border-[#2A2A2E] flex items-center justify-center">
          <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-2xl" />
        </div>
        <h1 className="text-xl text-white font-bold">{error}</h1>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-screen bg-[#0F0F10] flex items-center justify-center">
        <h1 className="text-xl text-white">Percakapan tidak ditemukan</h1>
      </div>
    );
  }

  const messageCount = (conversation.messages || []).length;
  const createdDate = new Date(conversation.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="h-screen bg-[#0F0F10] flex flex-col text-gray-200 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F21] bg-[#0F0F10]/90 backdrop-blur sticky top-0 z-30 shrink-0">
        {/* Brand Logo (Clean, no title slash) */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-yellow-500 transition-colors">
              KangAjie <span className="text-yellow-500">AI</span>
            </span>
            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/20 font-semibold">
              Free-Tier
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition text-xs font-medium px-3 py-2 rounded-xl hover:bg-[#1A1A1C] hidden sm:block cursor-pointer"
          >
            Beranda
          </button>
          <button
            onClick={handleFork}
            id="btn-continue-fork"
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:brightness-110 transition text-sm flex items-center gap-2 shrink-0 cursor-pointer shadow-md shadow-yellow-500/10"
          >
            <i className="fa-solid fa-comments text-xs" />
            <span>Lanjutkan Chat</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Conversation Container */}
      <main
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-8 pb-16 relative scroll-smooth"
      >
        {/* Hero Card for Conversation Title */}
        <div className="max-w-3xl mx-auto mb-10 bg-gradient-to-b from-[#18181B] to-[#121214] border border-[#2A2A2E] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <i className="fa-solid fa-share-nodes text-[10px]" />
              Percakapan Publik
            </span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-400 text-xs">
              {messageCount} pesan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {conversation.title || 'Percakapan AI'}
          </h1>
          <p className="text-gray-400 text-xs mt-3 flex flex-wrap items-center gap-2">
            <span>Dibagikan menggunakan KangAjie AI</span>
            <span>•</span>
            <span>{createdDate}</span>
          </p>
        </div>

        {/* Message Bubbles Container */}
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
          {(conversation.messages || []).map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {/* AI avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1C] border border-[#2A2A2E] flex items-center justify-center shrink-0 mt-1 mr-3 shadow-sm">
                    <i className="fa-solid fa-robot text-yellow-500 text-xs" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] ${
                    isUser
                      ? 'bg-[#2A2A2E] text-white rounded-[20px] rounded-br-sm px-5 py-3.5 shadow-md text-sm'
                      : 'text-gray-200 flex-1 min-w-0'
                  }`}
                >
                  {isUser ? (
                    <div
                      className="markdown-body text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: msg.message }}
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none markdown-body text-[15px] leading-relaxed break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: CodeBlock,
                          img: ImageCard,
                        }}
                      >
                        {msg.message}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Blur Fade Overlay & Premium Action Card */}
        <div className="relative mt-2 pt-10 pb-8 bg-gradient-to-t from-[#0F0F10] via-[#0F0F10]/90 to-transparent z-10 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#18181B] via-[#1C1C20] to-[#18181B] border border-[#2A2A2E] shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 opacity-50 pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-[#25252A] border border-[#2F2F35] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <i className="fa-solid fa-robot text-yellow-500 text-xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Lanjutkan Percakapan Ini di KangAjie AI
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Anda dapat mendalami topik ini, mengajukan pertanyaan lanjutan, atau menyalin kode langsung dengan asisten AI.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleFork}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-yellow-500/20 flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-comments text-sm" />
                <span>Lanjutkan Percakapan</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-[#25252A] text-gray-200 hover:text-white hover:bg-[#2F2F35] font-semibold rounded-xl border border-[#35353C] transition cursor-pointer"
              >
                Beranda KangAjie AI
              </button>
            </div>
          </div>
        </div>

        <div ref={messagesEndRef} />

        {/* Floating Scroll to Bottom button - Frosted Glass (Glassmorphism) + Spring Animation */}
        {showScrollBottom && messageCount > 0 && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll ke bawah"
            title="Ke bawah (Akhir percakapan)"
            className="fixed left-1/2 -translate-x-1/2 bottom-8 z-50 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#18181B]/45 hover:bg-[#27272A]/75 text-gray-200 hover:text-yellow-400 border border-white/20 hover:border-yellow-500/70 shadow-[0_8px_32px_rgba(0,0,0,0.55)] hover:shadow-[0_0_20px_rgba(234,179,8,0.35)] flex items-center justify-center transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 cursor-pointer animate-scroll-pop group"
            style={{
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            <i className="fa-solid fa-arrow-down text-xs md:text-sm transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        )}
      </main>
    </div>
  );
}
