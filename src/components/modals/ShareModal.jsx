import { useState, useCallback } from 'react';

export default function ShareModal({ isOpen, shareLink, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink]);

  if (!isOpen) return null;

  return (
    /* Overlay — matches HTML: bg-black/80 z-[60] backdrop-blur-sm */
    <div
      id="share-modal"
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm px-4"
    >
      <div className="bg-[#141415] border border-[#2A2A2E] p-6 rounded-2xl w-full max-w-md shadow-2xl relative fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <i className="fa-solid fa-share-nodes text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bagikan Percakapan</h3>
            <p className="text-xs text-gray-500">Siapapun dengan link ini bisa melihat percakapan</p>
          </div>
        </div>

        {/* Link input + copy button */}
        <div className="flex gap-2">
          <input
            id="share-link-input"
            readOnly
            type="text"
            value={shareLink}
            onClick={(e) => e.target.select()}
            className="flex-1 px-3 py-2.5 bg-[#1A1A1C] border border-[#2A2A2E] rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 truncate cursor-pointer"
          />
          <button
            id="copy-share-btn"
            onClick={handleCopy}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap flex items-center gap-2"
          >
            {copied ? (
              <><i className="fa-solid fa-check text-green-300" /> Disalin!</>
            ) : (
              <><i className="fa-regular fa-copy" /> Salin</>
            )}
          </button>
        </div>

        {/* Info */}
        <p className="text-[11px] text-gray-600 mt-3 flex items-start gap-1.5">
          <i className="fa-solid fa-circle-info mt-0.5 shrink-0" />
          <span>Link ini bersifat publik. Siapapun yang punya link bisa membaca isi percakapan ini.</span>
        </p>
      </div>
    </div>
  );
}
