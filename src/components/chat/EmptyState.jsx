import { useAuth } from '../../context/AuthContext';
import { FALLBACK_SUGGESTIONS } from '../../lib/constants';

export default function EmptyState({ suggestions, loading, onUsePrompt }) {
  const { user, isGuest } = useAuth();

  // Get user name same as HTML
  let name = 'Sobat';
  if (!isGuest && user) {
    const n = user.email.split('@')[0];
    name = n.charAt(0).toUpperCase() + n.slice(1);
  }

  const displaySuggestions =
    suggestions && suggestions.length === 4 ? suggestions : FALLBACK_SUGGESTIONS;

  return (
    <div id="empty-state" className="flex flex-col items-center justify-center h-full fade-in px-5 text-center">
      {/* Robot icon box — matches HTML exactly */}
      <div className="w-16 h-16 bg-[#1A1A1C] rounded-2xl flex items-center justify-center shadow-xl mb-4 border border-[#2A2A2E]">
        <i className="fa-solid fa-robot text-3xl text-yellow-500" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        Halo, <span className="text-yellow-500">{name}</span>!
      </h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
        Saya siap membantu dengan informasi terkini dari internet,
        <br className="hidden sm:block" />
        {' '}riset, kode, analisis, dan banyak lagi.
      </p>

      {/* Suggestion grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {displaySuggestions.map((s, index) => (
          <button
            key={index}
            onClick={() => onUsePrompt(s.text)}
            data-prompt={s.text}
            className="suggestion-btn"
          >
            <i
              className={`fa-solid ${s.icon}`}
              style={{ color: s.color, fontSize: '15px' }}
            />
            <span className="text-sm leading-snug">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
