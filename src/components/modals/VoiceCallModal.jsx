import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChat } from '../../services/chatApi';

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

export default function VoiceCallModal({
  isOpen,
  onClose,
  onVoiceCallEnd,
}) {
  // callState: 'idle' | 'listening' | 'thinking' | 'ai_speaking' | 'muted'
  const [callState, setCallState] = useState('listening');
  const [userTranscript, setUserTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showLog, setShowLog] = useState(false); // State untuk menampilkan/menyembunyikan teks log

  // Daftar riwayat obrolan lisan secara live di dalam kolom modal (TIDAK DISIMPAN ke chat utama)
  const [liveTranscript, setLiveTranscript] = useState([
    {
      id: 'init',
      sender: 'ai',
      text: 'Halo! Saya KangAjie AI. Silakan bicara langsung, saya merespons dengan suara alami tanpa menyimpan ke riwayat chat utama...',
    },
  ]);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  // Hapus semua ref VAD rumit, kembali ke sistem dasar
  const isListeningRef = useRef(false);
  const isModalOpenRef = useRef(isOpen);
  const isMutedRef = useRef(isMuted);
  const callStateRef = useRef('listening');
  const voiceHistoryRef = useRef([]); // Riwayat sementara khusus telepon untuk konteks AI
  const currentUtteranceRef = useRef(null); // Mencegah bug Chrome garbage collection speech
  const transcriptEndRef = useRef(null);
  const currentTurnRef = useRef(0); // Menandai giliran request agar bisa dibatalkan jika disela

  isModalOpenRef.current = isOpen;
  isMutedRef.current = isMuted;

  const updateState = (newState) => {
    callStateRef.current = newState;
    setCallState(newState);
  };

  // Timer panggilan (detik)
  useEffect(() => {
    if (!isOpen) return;
    setCallDuration(0);
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll kolom transcript ke bawah
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript, userTranscript]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Berbicara suara AI (Text to Speech) ───────────────────────────────────
  const speakAI = useCallback((text, onFinish) => {
    if (!('speechSynthesis' in window) || !isModalOpenRef.current) {
      if (onFinish) onFinish();
      return;
    }

    // Mic tetap aktif agar user bisa melakukan interupsi suara (Voice Activity Detection)

    window.speechSynthesis?.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    // MATIKAN MIC SAAT AI BICARA AGAR TIDAK DENGAR SUARANYA SENDIRI!
    const oldRec = recognitionRef.current;
    recognitionRef.current = null;
    isListeningRef.current = false;
    try {
      oldRec?.abort();
    } catch { }

    updateState('ai_speaking');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    currentUtteranceRef.current = utterance;

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

    utterance.onend = () => {
      // Pastikan onend berasal dari utterance aktif (mencegah bug onend palsu akibat cancel)
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current = null;
        updateState('listening');
        if (isModalOpenRef.current && onFinish) {
          onFinish();
        }
        // Nyalakan mic kembali setelah selesai bicara
        if (isModalOpenRef.current && !isMutedRef.current) {
           startListening();
        }
      }
    };

    utterance.onerror = () => {
      if (currentUtteranceRef.current === utterance) {
        currentUtteranceRef.current = null;
        if (isModalOpenRef.current && onFinish) {
          onFinish();
        }
      }
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  // ─── Mulai mendengarkan suara user (Web Speech API) ────────────────────────
  const startListening = useCallback(() => {
    if (!isModalOpenRef.current || isMutedRef.current || isListeningRef.current) {
      return;
    }
    isListeningRef.current = true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Maaf, browser Anda tidak mendukung pengenalan suara.');
      return;
    }

    // Hapus referensi sebelum abort() agar onend lama tidak lolos pengecekan (mencegah bug mic ganda!)
    const oldMic = recognitionRef.current;
    recognitionRef.current = null;
    try {
      oldMic?.abort();
    } catch { }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      if (isModalOpenRef.current && !isMutedRef.current) {
        if (callStateRef.current !== 'ai_speaking' && callStateRef.current !== 'thinking') {
          updateState('listening');
          setUserTranscript('');
        }
      }
    };

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        let t = event.results[i][0].transcript.trim();
        if (t) currentText += ' ' + t;
      }
      const trimmed = currentText.trim();
      if (!trimmed) return;

      setUserTranscript(trimmed);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(() => {
        if (isModalOpenRef.current && trimmed.length > 0) {
          handleVoiceTurn(trimmed);
        }
      }, 1000);
    };

    recognition.onerror = () => {
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        isListeningRef.current = false;
        // Hanya restart otomatis jika tidak sedang dimatikan secara manual (misal saat mikir/bicara)
        if (isModalOpenRef.current && !isMutedRef.current && callStateRef.current !== 'ai_speaking' && callStateRef.current !== 'thinking') {
          setTimeout(() => startListening(), 250);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch { }
  }, []);

  // ─── Kirim ucapan ke backend & langsung jawab dengan suara (TIDAK DISIMPAN) ───
  const handleVoiceTurn = async (userText) => {
    if (!userText || !isModalOpenRef.current) return;

    // Matikan mic sementara saat mikir
    const oldRec = recognitionRef.current;
    recognitionRef.current = null;
    isListeningRef.current = false;
    try {
      oldRec?.abort();
    } catch { }
    
    const turnId = Date.now();
    currentTurnRef.current = turnId;
    updateState('thinking');
    setUserTranscript('');

    // Tambahkan percakapan user ke kolom transcript
    setLiveTranscript((prev) => [
      ...prev,
      { id: Date.now() + '-user', sender: 'user', text: userText },
    ]);

    try {
      // Jika baru pertama kali bicara di sesi telepon ini, berikan instruksi kepribadian khusus telepon layaknya manusia
      let currentHistory = [...voiceHistoryRef.current];
      if (currentHistory.length === 0) {
        currentHistory = [
          {
            role: 'user',
            parts: [
              {
                text: '[INSTRUKSI KHUSUS MODE TELEPON / VOICE CALL]: Kita sedang mengobrol santai via telepon. Jadilah sosok yang SANGAT ASYIK, seru, humoris, dan penuh ekspresi! Wajib gunakan gaya bicara tongkrongan yang luwes dan natural. PERBANYAK sisipkan ekspresi suara seperti "hahaha", "hehehe", "wkwkwk", "hmm...", "ehem", "aduh", "wow!", atau "oh gitu ya" sesuai konteks obrolan. Jangan kaku seperti robot, hindari bahasa baku. Berikan reaksi emosional yang lebay atau antusias kalau ceritanya seru. Jawablah layaknya teman akrab (bestie) yang sedang asyik nongkrong dan teleponan. Boleh bercanda, meledek ringan, tertawa renyah, dan selalu lemparkan pertanyaan balik yang asyik agar obrolan kita hidup dan ngalir terus.',
              },
            ],
          },
          {
            role: 'model',
            parts: [
              {
                text: 'Hahaha, wkwkwk siap banget bos! Aku bakal ngobrol santai dan asyik banget sama kamu layaknya bestie yang lagi nongkrong. Hmm... kira-kira ada cerita seru apa nih hari ini? Cerita dong!',
              },
            ],
          },
        ];
      }

      const res = await sendChat({
        history: currentHistory,
        message: userText,
        userName: 'Teman',
      });

      // Jika turnId sudah berubah (karena user menekan interupsi saat AI sedang mikir), maka buang balasan ini!
      if (currentTurnRef.current !== turnId || !isModalOpenRef.current) return;

      const replyText = res?.reply || 'Maaf, saya tidak mendengarnya dengan jelas.';

      // Simpan di memori sementara sesi telepon saja (TIDAK DISIMPAN KE DATABASE / SUPABASE)
      voiceHistoryRef.current = [
        ...currentHistory,
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: replyText }] },
      ];

      // Tambahkan balasan AI ke kolom transcript
      setLiveTranscript((prev) => [
        ...prev,
        { id: Date.now() + '-ai', sender: 'ai', text: replyText },
      ]);

      // LANGSUNG JAWAB DALAM BENTUK SUARA SECARA OTOMATIS!
      speakAI(replyText, () => {
        if (isModalOpenRef.current && !isMutedRef.current) {
          updateState('listening');
          setTimeout(() => startListening(), 250);
        }
      });
    } catch (err) {
      console.error('Voice call send error:', err);
      if (isModalOpenRef.current) {
        const errorMsg = 'Maaf, jalur AI sedang padat sesaat. Silakan coba katakan kembali ya.';
        setLiveTranscript((prev) => [
          ...prev,
          { id: Date.now() + '-ai-err', sender: 'ai', text: errorMsg },
        ]);
        speakAI(errorMsg, () => {
          if (isModalOpenRef.current && !isMutedRef.current) {
            updateState('listening');
            setTimeout(() => startListening(), 250);
          }
        });
      }
    }
  };

  // ─── Efek buka & tutup modal ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      voiceHistoryRef.current = []; // Reset sesi telepon, mulai bersih
      setLiveTranscript([
        {
          id: 'init',
          sender: 'ai',
          text: 'Halo! Saya KangAjie AI. Silakan bicara langsung, saya merespons dengan suara alami tanpa menyimpan ke riwayat chat utama...',
        },
      ]);
      updateState('listening');
      setUserTranscript('');
      setIsMuted(false);
      startListening();
    } else {
      voiceHistoryRef.current = []; // Hapus riwayat telepon
      window.speechSynthesis?.cancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch { }
    }
    return () => {
      window.speechSynthesis?.cancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch { }
    };
  }, [isOpen]);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      
      if (currentUtteranceRef.current) {
        updateState('ai_speaking');
      } else {
        updateState('listening');
        startListening();
      }
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      
      if (currentUtteranceRef.current) {
        updateState('ai_speaking');
      } else {
        updateState('muted');
      }
      
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const oldRec = recognitionRef.current;
      recognitionRef.current = null;
      isListeningRef.current = false;
      try {
        oldRec?.stop();
      } catch { }
    }
  };

  const handleInterrupt = () => {
    currentTurnRef.current = Date.now(); // Batalkan antrean respons backend jika ada
    
    window.speechSynthesis?.cancel();
    currentUtteranceRef.current = null;
    
    // Hapus referensi agar event onend lama tidak memicu restart ganda
    const oldRec = recognitionRef.current;
    recognitionRef.current = null;
    isListeningRef.current = false;
    try {
      oldRec?.abort();
    } catch { }

    updateState('listening');
    setUserTranscript('');
    
    setTimeout(() => {
      if (isModalOpenRef.current && !isMutedRef.current && callStateRef.current === 'listening') {
        startListening();
      }
    }, 150);
  };

  const handleManualStart = () => {
    // Selalu paksa hentikan suara AI apapun statusnya agar pasti reset ke listening
    handleInterrupt();
  };

  const handleEndCall = () => {
    if (onVoiceCallEnd && liveTranscript.length > 0) {
      onVoiceCallEnd(liveTranscript);
    }
    
    // Reset transkrip untuk sesi berikutnya
    setLiveTranscript([]);
    voiceHistoryRef.current = [];
    window.speechSynthesis?.cancel();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch { }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0F10]/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 text-white animate-fade-in select-none overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-lg sm:text-xl font-bold tracking-tight shrink-0 bg-black/30 px-3 py-1 rounded-full border border-gray-800 backdrop-blur-md">
            KangAjie <span className="text-yellow-500">AI</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1A1C]/80 border border-[#2A2A2E] px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${callState === 'listening' ? 'bg-emerald-400 animate-ping' : callState === 'ai_speaking' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'} inline-block`} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide text-gray-200 uppercase hidden sm:inline-block">
              Voice Mode
            </span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1A1A1C]/80 px-3 py-1.5 rounded-full border border-[#2A2A2E] backdrop-blur-md">
            {formatDuration(callDuration)}
          </span>
        </div>

        <button
          onClick={handleEndCall}
          className="w-10 h-10 rounded-full bg-[#1A1A1C]/80 hover:bg-[#25252A] border border-[#2A2A2E] flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer backdrop-blur-md"
          title="Tutup layar telepon"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>

      {/* Center Animated Visualizer & Orb */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 max-w-xl mx-auto px-4 my-2 shrink-0">
        {/* Animated Visual Orb (Klik untuk bicara/potong) */}
        <div
          onClick={handleManualStart}
          className="relative mb-8 flex items-center justify-center cursor-pointer group"
          title="Klik lingkaran untuk bicara atau potong suara AI"
        >
          {/* Glowing Aura Rings */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              callState === 'ai_speaking'
                ? 'bg-yellow-500/30 blur-2xl animate-ping scale-[1.8]'
                : callState === 'listening'
                  ? 'bg-emerald-500/30 blur-2xl animate-ping scale-[1.5]'
                  : callState === 'thinking'
                    ? 'bg-purple-500/30 blur-2xl animate-spin scale-125'
                    : 'bg-gray-500/10 blur-xl scale-100'
            }`}
            style={{ animationDuration: callState === 'ai_speaking' ? '1.5s' : '2.5s' }}
          />
          {/* Second inner ring for depth */}
          <div
            className={`absolute -inset-4 rounded-full transition-all duration-500 ${
              callState === 'ai_speaking'
                ? 'bg-yellow-400/40 blur-xl animate-pulse scale-[1.3]'
                : callState === 'listening'
                  ? 'bg-emerald-400/40 blur-xl animate-pulse scale-[1.1]'
                  : 'opacity-0 scale-90'
            }`}
          />

          {/* Central Orb */}
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 flex items-center justify-center relative transition-all duration-500 shadow-2xl z-10 ${
                callState === 'ai_speaking'
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-yellow-200 scale-110 shadow-[0_0_50px_rgba(234,179,8,0.6)]'
                : callState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-500 to-green-300 border-emerald-200 scale-100 shadow-[0_0_40px_rgba(16,185,129,0.5)] group-hover:scale-105'
                  : callState === 'thinking'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 border-purple-300 scale-95 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                    : 'bg-[#1C1C20] border-gray-600 scale-90 hover:scale-95'
              }`}
          >
            {/* Center Icon */}
            {callState === 'ai_speaking' && (
              <i className="fa-solid fa-robot text-5xl sm:text-6xl text-black animate-bounce" />
            )}
            {callState === 'listening' && (
              <i className="fa-solid fa-microphone text-5xl sm:text-6xl text-black" style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            )}
            {callState === 'thinking' && (
              <i className="fa-solid fa-brain text-5xl sm:text-6xl text-white animate-pulse" />
            )}
            {callState === 'muted' && (
              <i className="fa-solid fa-microphone-slash text-5xl sm:text-6xl text-gray-500" />
            )}
          </div>
        </div>

        {/* State Status Text */}
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 mt-4 transition-colors duration-500 ${
          callState === 'ai_speaking' ? 'text-yellow-400' :
          callState === 'listening' ? 'text-emerald-400' :
          callState === 'thinking' ? 'text-purple-400' : 'text-gray-400'
        }`}>
          {callState === 'ai_speaking' && 'KangAjie AI Sedang Berbicara...'}
          {callState === 'listening' && 'Mendengarkan Anda...'}
          {callState === 'thinking' && 'Sedang Berpikir...'}
          {callState === 'muted' && 'Mikrofon Bisu'}
        </h2>
        <p className="text-sm text-gray-400 max-w-sm">
          {callState === 'ai_speaking' && 'Klik ikon tangan di bawah untuk menyela AI.'}
          {callState === 'listening' && 'Silakan bicara senatural mungkin, saya merespons.'}
          {callState === 'thinking' && 'Memproses ucapan Anda...'}
          {callState === 'muted' && 'Klik ikon mikrofon di bawah untuk mulai bicara.'}
        </p>
      </div>

      {/* Live Conversation Transcript Column (Semua Obrolan Telepon Ter-translate di Sini!) */}
      {showLog && (
        <div className="max-w-2xl w-full mx-auto bg-[#18181B]/85 border border-[#2A2A2E] rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur max-h-56 sm:max-h-64 overflow-y-auto space-y-3.5 z-10 my-2 scroll-smooth">
        {liveTranscript.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'
              } animate-fade-in`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-md ${item.sender === 'user'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}
            >
              {item.sender === 'user' ? 'Anda' : 'KangAjie AI'}
            </span>
            <p
              className={`text-sm sm:text-[15px] leading-relaxed rounded-xl px-3.5 py-2.5 max-w-[90%] ${item.sender === 'user'
                  ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-800/40'
                  : 'bg-[#222226] text-gray-200 border border-[#323238]'
                }`}
            >
              {item.text}
            </p>
          </div>
        ))}

        {/* Live speech in progress indicator */}
        {callState === 'listening' && userTranscript && (
          <div className="flex flex-col items-end animate-fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Anda (Sedang bicara...)
            </span>
            <p className="text-sm sm:text-[15px] leading-relaxed rounded-xl px-3.5 py-2.5 bg-emerald-950/40 text-emerald-300/80 border border-emerald-800/40 italic">
              "{userTranscript}"
            </p>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 z-10 pt-2 pb-4 shrink-0">
        {/* Toggle Log Button */}
        <button
          onClick={() => setShowLog(!showLog)}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg transition cursor-pointer border shadow-lg ${showLog
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
              : 'bg-[#1E1E22] hover:bg-[#2A2A30] text-gray-400 border-[#303036] hover:text-white'
            }`}
          title={showLog ? 'Sembunyikan Teks Log' : 'Tampilkan Teks Log'}
        >
          <i className="fa-solid fa-file-lines" />
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg transition cursor-pointer border shadow-lg ${isMuted
              ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
              : 'bg-[#1E1E22] hover:bg-[#2A2A30] text-gray-300 border-[#303036] hover:text-white'
            }`}
          title={isMuted ? 'Nyalakan Mikrofon' : 'Bisukan Mikrofon'}
        >
          <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`} />
        </button>

        {/* Manual Listen / Potong Suara button */}
        <button
          onClick={handleManualStart}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 flex items-center justify-center text-lg transition cursor-pointer shadow-lg"
          title="Potong Suara AI"
        >
          <i className="fa-solid fa-hand-paper" />
        </button>

        {/* Big Red Hang Up Button */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xl shadow-red-600/40 hover:scale-105 transition cursor-pointer"
          title="Akhiri Panggilan (End Call)"
        >
          <i className="fa-solid fa-phone-slash" />
        </button>
      </div>
    </div>
  );
}
