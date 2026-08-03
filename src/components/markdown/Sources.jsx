export default function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;

  const getDomain = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  };

  return (
    <div className="mt-5 pt-4 border-t border-[#1F1F21]">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-yellow-500/10 border border-yellow-500/20 shrink-0">
          <i className="fa-solid fa-globe text-yellow-500" style={{ fontSize: '9px' }} />
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '.05em', textTransform: 'uppercase' }}>
          Sumber Internet
        </span>
        <span style={{ fontSize: '10px', color: '#4b5563' }}>• {sources.length} referensi</span>
      </div>

      <div className="sources-grid">
        {sources.map((s, index) => {
          const domain = getDomain(s.url);
          let displayTitle = s.title || domain;
          // Hapus embel-embel vertexaisearch atau Google Search yang tidak relevan
          if (displayTitle.toLowerCase().replace(/\s+/g, '').includes('vertexai') || displayTitle.toLowerCase().includes('google search')) {
            displayTitle = domain;
          }
          const safeTitle = displayTitle.replace(/"/g, '&quot;').replace(/</g, '&lt;');
          const faviconFallback = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect width=%2216%22 height=%2216%22 rx=%223%22 fill=%22%23333%22/><text x=%228%22 y=%2212%22 text-anchor=%22middle%22 font-size=%2210%22 fill=%22%23888%22>?</text></svg>";

          return (
            <a
              key={index}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                background: '#141416',
                border: '1px solid #2A2A2E',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all .15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(234,179,8,.35)'; e.currentTarget.style.background = '#1A1A1C'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2A2A2E'; e.currentTarget.style.background = '#141416'; }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt=""
                style={{ width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0, marginTop: '1px' }}
                onError={(e) => { e.target.src = faviconFallback; }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="line-clamp-2" style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: 500, lineHeight: 1.4 }}>
                  {displayTitle}
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '8px' }} />
                  {domain}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
