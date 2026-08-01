export default function HistoryItem({
  session,
  isActive,
  hasNewReply,
  onClick,
  onDelete,
  onShare,
  isGuest,
}) {
  const title = session.title || 'Percakapan Baru';

  // Format relative timestamp
  const getTimeLabel = () => {
    if (!session.created_at) return '';
    try {
      const d = new Date(session.created_at);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      if (diffMin < 1) return 'Baru saja';
      if (diffMin < 60) return `${diffMin}m`;
      if (diffHr < 24) return `${diffHr}j`;
      if (diffDay === 1) return 'Kemarin';
      if (diffDay < 7) return `${diffDay}h`;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div
      data-session={session.session_id}
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer 
        transition-all duration-150 group mb-0.5
        ${isActive
          ? 'bg-yellow-500/10 border border-yellow-500/20 text-white'
          : 'border border-transparent hover:bg-[#1A1A1C] hover:border-[#2A2A2E] text-gray-400 hover:text-gray-200'
        }
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-yellow-500 rounded-full" />
      )}

      {/* Icon */}
      <i className={`fa-regular fa-message text-[9px] shrink-0 ${isActive ? 'text-yellow-500' : 'text-gray-600 group-hover:text-gray-400'}`} />

      {/* Title + time */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          {hasNewReply && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 animate-pulse" />
          )}
          <span className={`sidebar-label text-xs font-medium truncate block flex-1 transition ${isActive ? 'text-white' : ''}`}>
            {title}
          </span>
          <span className="text-[9px] text-gray-600 shrink-0 group-hover:opacity-0 transition-opacity">
            {getTimeLabel()}
          </span>
        </div>
      </div>

      {/* Action buttons — appear on hover, replace timestamp */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        {/* Share button — only for logged-in users */}
        {!isGuest && onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="p-1.5 rounded-lg hover:bg-yellow-500/20 hover:text-yellow-400 transition text-gray-600"
            title="Bagikan percakapan"
          >
            <i className="fa-solid fa-share-nodes text-[9px]" />
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(e); }}
          className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition text-gray-600"
          title="Hapus percakapan"
        >
          <i className="fa-solid fa-trash text-[9px]" />
        </button>
      </div>
    </div>
  );
}
