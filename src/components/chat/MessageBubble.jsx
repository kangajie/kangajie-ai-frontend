import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from '../markdown/CodeBlock';
import ImageCard from '../markdown/ImageCard';
import Sources from '../markdown/Sources';

const cleanTextForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' Kode program disembunyikan. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#*~_`>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function MessageBubble({ message, isUser, onEdit, onFillInput }) {
  const isAI = !isUser;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Safe text for edit button (matching HTML escape logic)
  const getSafeText = () => {
    if (!isUser || !message.rawText) return '';
    return message.rawText
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  };

  const handleEdit = useCallback(() => {
    const editHandler = onEdit || onFillInput;
    if (editHandler && message.rawText) {
      editHandler(message.rawText);
    }
  }, [onEdit, onFillInput, message.rawText]);

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('Maaf, browser Anda tidak mendukung fitur suara (Text-to-Speech).');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(message.text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice =
      voices.find(
        (v) =>
          v.lang.includes('id') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Microsoft') ||
            v.name.includes('Gadis') ||
            v.name.includes('Andika'))
      ) ||
      voices.find((v) => v.lang.includes('id-ID') || v.lang.includes('id_ID') || v.lang.includes('id')) ||
      voices.find((v) => v.name.toLowerCase().includes('indonesia'));

    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [message.text, isSpeaking]);

  const handleCopy = useCallback(() => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [message.text]);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  // AI message layout: avatar + prose
  if (isAI) {
    return (
      <div className="msg-row max-w-3xl mx-auto w-full px-4 md:px-6 flex justify-start mb-8 fade-in group/msg">
        <div className="w-full flex gap-3 md:gap-4 items-start">
          {/* Robot avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1A1A1C] border border-[#2A2A2E] flex items-center justify-center shrink-0 mt-0.5">
            <i className="fa-solid fa-robot text-yellow-500 text-xs" />
          </div>
          {/* Prose content */}
          <div className="prose prose-invert text-gray-200 flex-1 min-w-0 overflow-hidden break-words">
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: CodeBlock,
                  img: ImageCard,
                }}
              >
                {message.text}
              </ReactMarkdown>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <Sources sources={message.sources} />
              )}

              {/* Edited / AI-generated image */}
              {(message.editedImage || message.storedImageUrl) && (
                <div className="mt-4 rounded-xl overflow-hidden border border-[#2A2A2E] max-w-[560px]">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#141416',
                      borderBottom: '1px solid #2A2A2E',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#9ca3af',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                      }}
                    >
                      <i className="fa-solid fa-image" style={{ color: '#eab308', fontSize: '9px' }} />
                      Hasil Edit Foto
                      {message.storedImageUrl && (
                        <span style={{ color: '#4ade80', fontSize: '9px', fontWeight: 400 }}>
                          <i className="fa-solid fa-check mr-1" />Tersimpan di Pustaka
                        </span>
                      )}
                    </span>
                    <a
                      href={message.storedImageUrl || message.editedImage}
                      download={`KangAjie-Edit-${Date.now()}.png`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#9ca3af',
                        fontSize: '11px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.color = '#eab308'; e.currentTarget.style.background = 'rgba(234,179,8,.08)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <i className="fa-solid fa-download" style={{ fontSize: '9px' }} />
                      Simpan PNG
                    </a>
                  </div>
                  <img
                    src={message.storedImageUrl || message.editedImage}
                    alt="Foto yang diedit"
                    style={{ width: '100%', display: 'block', maxHeight: '600px', objectFit: 'contain', background: '#0d0d0f' }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* AI Action Bar - Dengarkan Suara AI (Read Aloud) & Salin Teks */}
              <div className="flex items-center gap-2 mt-4 pt-2.5 border-t border-[#2A2A2E]/50 not-prose">
                {/* Tombol Dengarkan Suara AI (TTS / Live Voice) */}
                <button
                  onClick={handleSpeak}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSpeaking
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-sm animate-pulse'
                      : 'bg-[#1A1A1C] hover:bg-[#25252A] text-gray-400 hover:text-white border border-[#2A2A2E]'
                  }`}
                  title={
                    isSpeaking
                      ? 'Berhenti bicara'
                      : 'Dengarkan suara AI berbicara (Read Aloud / Text to Speech)'
                  }
                >
                  <i
                    className={`fa-solid ${
                      isSpeaking ? 'fa-volume-high animate-bounce' : 'fa-volume-low'
                    } text-xs`}
                  />
                  <span>{isSpeaking ? 'Berbicara...' : 'Dengarkan'}</span>
                </button>

                {/* Tombol Salin */}
                <button
                  onClick={handleCopy}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isCopied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'bg-[#1A1A1C] hover:bg-[#25252A] text-gray-400 hover:text-white border border-[#2A2A2E]'
                  }`}
                  title="Salin jawaban AI"
                >
                  <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'} text-xs`} />
                  <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User message layout: right-aligned bubble
  return (
    <div className="msg-row max-w-3xl mx-auto w-full px-4 md:px-6 flex justify-end mb-8 fade-in group/msg">
      <div className="msg-user-bubble relative max-w-[80%] sm:max-w-[75%] md:max-w-[65%]">
        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover/msg:opacity-100 absolute -left-8 top-2 text-gray-500 hover:text-white transition"
        >
          <i className="fa-solid fa-pencil text-xs" />
        </button>
        {/* Bubble */}
        <div className="prose prose-invert bg-[#2A2A2E] rounded-[18px] px-4 py-3 text-white min-w-0 overflow-hidden break-words">
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
        </div>
      </div>
    </div>
  );
}
