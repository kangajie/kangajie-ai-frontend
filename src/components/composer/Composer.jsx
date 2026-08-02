import { useCallback, useRef, useState, useEffect } from 'react';
import { useFileAttachment } from '../../hooks/useFileAttachment';
import FilePreview from './FilePreview';

export default function Composer({ value, onChange, onSubmit, isSending, onStop, composerRef, onOpenVoiceCall }) {
  const {
    currentFile,
    preview,
    fileInputRef,
    clearFile,
    handlePaste,
    handleFileSelect,
    triggerFileUpload,
  } = useFileAttachment();

  // Expose clearFile ke parent via composerRef
  if (composerRef) {
    composerRef.current = { clearFile };
  }

  // ─── Web Speech API (Voice to Text) ──────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Maaf, browser Anda tidak mendukung fitur Voice to Text (Web Speech API). Gunakan Google Chrome atau Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Bahasa Indonesia natural
      recognition.continuous = true;
      recognition.interimResults = true;

      const baseText = value || '';
      const space = baseText && !baseText.endsWith(' ') ? ' ' : '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript.trim();
          if (!text) continue;

          if (res.isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + text;
          } else {
            // Pada mobile (Android/iOS Chrome), ambil interim terbaru saja agar tidak menempel & menggandakan teks
            interimTranscript = text;
          }
        }

        const combined = [finalTranscript, interimTranscript].filter(Boolean).join(' ');

        // Bersihkan duplikasi kata berurutan akibat bug pengulangan di mesin speech HP
        const cleanTranscript = combined
          .split(/\s+/)
          .filter((word, idx, arr) => word.toLowerCase() !== (arr[idx - 1] || '').toLowerCase())
          .join(' ');

        if (cleanTranscript) {
          onChange({ target: { value: baseText + space + cleanTranscript } });

          // Auto resize textarea
          setTimeout(() => {
            const ta = document.getElementById('msg-input');
            if (ta) {
              ta.style.height = 'auto';
              ta.style.height = `${ta.scrollHeight}px`;
            }
          }, 10);
        }
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }, [isListening, value, onChange]);

  // Ensure recognition stops when sending
  useEffect(() => {
    if (isSending && isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isSending, isListening]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (!isSending) {
      onSubmit(e, currentFile);
      // Clear file attachment segera setelah submit
      clearFile();
    }
  }, [isSending, onSubmit, currentFile, clearFile, isListening]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      onSubmit(e, currentFile);
      // Clear file attachment
      clearFile();
    }
  }, [isSending, onSubmit, currentFile, clearFile, isListening]);

  const handleFileClick = useCallback((e) => {
    e.preventDefault();
    if (!isSending) {
      triggerFileUpload();
    }
  }, [isSending, triggerFileUpload]);

  return (
    <div
      className="input-area-wrap w-full bg-[#0F0F10] pt-2 px-3 md:px-4 z-40 shrink-0"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto relative">
        {/* File preview — absolute above input */}
        {preview && (
          <FilePreview preview={preview} onClear={clearFile} />
        )}

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className={`flex items-end gap-2 bg-[#1A1A1C] p-2 rounded-[26px] border ${
            isListening
              ? 'border-red-500/60 shadow-lg shadow-red-500/15'
              : 'border-[#2A2A2E]'
          } shadow-2xl focus-within:border-yellow-500/50 transition-all w-full`}
        >
          {/* Hidden file input */}
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.yaml,.yml,.md,.xls,.xlsx,.ppt,.pptx,.zip,.7z"
          />

          {/* + button (attach file) */}
          <button
            type="button"
            onClick={handleFileClick}
            disabled={isSending}
            className="text-gray-400 hover:text-yellow-500 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition hover:bg-yellow-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Lampirkan file"
          >
            <i className="fa-solid fa-plus text-lg" />
          </button>

          {/* Textarea */}
          <textarea
            id="msg-input"
            value={value}
            rows={1}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Tanyakan apapun...'}
            disabled={isSending}
            className="flex-1 bg-transparent border-none text-white focus:ring-0 py-3 px-2 outline-none resize-none max-h-40 text-[15px] placeholder-gray-600 disabled:opacity-60"
          />

          {/* Voice to Text Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isSending}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
              isListening
                ? 'text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40 animate-pulse'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              isListening
                ? 'Mendengarkan suara... (Klik untuk berhenti)'
                : 'Bicara langsung dengan suara (Voice to Text)'
            }
          >
            <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-base`} />
          </button>

          {/* Action Button (Telepon AI or Send/Stop) */}
          {(!value.trim() && !currentFile && !isSending) ? (
            // Telepon AI (Live Call Modal) Button
            onOpenVoiceCall && (
              <button
                type="button"
                onClick={onOpenVoiceCall}
                disabled={isSending}
                className="text-black bg-white hover:bg-yellow-500 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-lg cursor-pointer"
                title="Mulai Mode Telepon (Live Voice Call AI)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18"></path>
                  <path d="M17 7v10"></path>
                  <path d="M22 10v4"></path>
                  <path d="M7 7v10"></path>
                  <path d="M2 10v4"></path>
                </svg>
              </button>
            )
          ) : (
            // Send / Stop button
            !isSending ? (
              <button
                type="submit"
                id="send-btn"
                className="text-black bg-white hover:bg-yellow-500 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-lg cursor-pointer"
                title="Kirim pesan"
              >
                <i className="fa-solid fa-arrow-up text-sm font-bold" />
              </button>
            ) : (
              <button
                type="button"
                id="stop-btn"
                onClick={onStop}
                className="text-white bg-red-500 hover:bg-red-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-lg animate-pulse cursor-pointer"
                title="Hentikan"
              >
                <i className="fa-solid fa-square text-sm" />
              </button>
            )
          )}
        </form>

        {/* Footer text */}
        <p className="text-center text-[10px] text-gray-500 mt-3 mb-1 px-4 leading-tight shrink-0">
          KangAjie AI dapat membuat kesalahan, Mohon Dimaafkan Yah.
        </p>
      </div>
    </div>
  );
}
