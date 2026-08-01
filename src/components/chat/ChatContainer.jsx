import { useState, useCallback } from 'react';
import MessageList from './MessageList';
import Composer from '../composer/Composer';
import EmptyState from './EmptyState';

export default function ChatContainer({
  messages,
  isSending,
  suggestions,
  suggestionsLoading,
  inputValue,
  onInputChange,
  onSubmit,
  onStop,
  onSuggestionClick,
  onEditMessage,
  messagesEndRef,
  onOpenVoiceCall,
}) {
  const hasMessages = messages.length > 0;
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Tampilkan tombol ↓ saat jarak ke dasar lebih dari 120px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isScrolledUp);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  }, [messagesEndRef]);

  return (
    <>
      {/* Chat messages area */}
      <div
        id="chat-container"
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-4 pb-6 scroll-smooth"
      >
        {!hasMessages ? (
          <EmptyState
            suggestions={suggestions}
            loading={suggestionsLoading}
            onUsePrompt={onSuggestionClick}
          />
        ) : (
          <MessageList
            messages={messages}
            isSending={isSending}
            onEditMessage={onEditMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button - Frosted Glass (Glassmorphism) + Spring Animation seperti ChatGPT */}
      {showScrollBottom && hasMessages && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll ke bawah"
          title="Ke bawah (Pesan terbaru)"
          className="absolute left-1/2 -translate-x-1/2 bottom-[125px] md:bottom-[135px] z-50 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#18181B]/45 hover:bg-[#27272A]/75 text-gray-200 hover:text-yellow-400 border border-white/20 hover:border-yellow-500/70 shadow-[0_8px_32px_rgba(0,0,0,0.55)] hover:shadow-[0_0_20px_rgba(234,179,8,0.35)] flex items-center justify-center transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 cursor-pointer animate-scroll-pop group"
          style={{
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <i className="fa-solid fa-arrow-down text-xs md:text-sm transition-transform duration-300 group-hover:translate-y-0.5" />
        </button>
      )}

      {/* Input composer */}
      <Composer
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        isSending={isSending}
        onStop={onStop}
        onOpenVoiceCall={onOpenVoiceCall}
      />
    </>
  );
}
