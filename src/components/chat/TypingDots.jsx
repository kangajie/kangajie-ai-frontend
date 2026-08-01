export default function TypingDots({ statusLabel }) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 md:px-6 mb-6 fade-in">
      <div className="flex gap-3 md:gap-4 items-center">
        {/* Robot avatar — same as AI message */}
        <div className="w-8 h-8 rounded-full bg-[#1A1A1C] border border-yellow-500/30 flex items-center justify-center shrink-0 animate-pulse">
          <i className="fa-solid fa-robot text-yellow-500 text-xs" />
        </div>
        {/* Dots */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#141416] rounded-2xl border border-[#2A2A2E]">
          <span className="typing-dot w-1.5 h-1.5 bg-yellow-500 rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-yellow-500 rounded-full" style={{ animationDelay: '.2s' }} />
          <span className="typing-dot w-1.5 h-1.5 bg-yellow-500 rounded-full" style={{ animationDelay: '.4s' }} />
          {statusLabel && (
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>{statusLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
