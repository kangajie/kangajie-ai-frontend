import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { sendChat } from '../services/chatApi';
import { saveBase64ImageToPustaka } from '../services/pustakaApi';
import { IMAGE_EDIT_KEYWORDS } from '../lib/constants';

export function useChat() {
  const { user, isGuest } = useAuth();
  const {
    currentSessionId,
    saveSessionTitle,
    saveDataForSession,
    startNewChat,
    loadSession,
  } = useSessions();

  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // History in ref — always fresh, avoids stale closure
  const historyRef = useRef([]);
  const activeRequests = useRef(new Map());
  const lastImageRef = useRef(null);

  // Track which session was last loaded to detect changes
  const prevSessionIdRef = useRef(null);

  // ─── Load messages when session changes ───────────────────────────────────────
  useEffect(() => {
    // Only load if session actually changed
    if (!currentSessionId || currentSessionId === prevSessionIdRef.current) return;

    prevSessionIdRef.current = currentSessionId;
    setMessages([]);
    historyRef.current = [];
    lastImageRef.current = null;

    const load = async () => {
      try {
        const rows = await loadSession(currentSessionId);
        if (!rows || rows.length === 0) return; // New empty session

        // Build display messages — handle both text and stored image URLs
        const displayMsgs = rows.map((row, idx) => {
          const isAI = row.role === 'ai';
          const msg = row.message || '';

          // Detect if the stored message contains an image URL reference
          // Convention: AI image messages are stored as "[IMAGE_PUSTAKA]:url\ntext"
          let imageUrl = null;
          let displayText = msg;

          if (isAI && msg.startsWith('[IMAGE_PUSTAKA]:')) {
            const lines = msg.split('\n');
            imageUrl = lines[0].replace('[IMAGE_PUSTAKA]:', '').trim();
            displayText = lines.slice(1).join('\n').trim();
          }

          return {
            id: idx + 1,
            role: isAI ? 'ai' : 'user',
            text: displayText,
            rawText: displayText,
            isAnimated: false,
            sessionId: currentSessionId,
            sources: [],
            // If we have a stored image URL, render it
            editedImage: imageUrl || null,
            storedImageUrl: imageUrl || null,
          };
        });

        setMessages(displayMsgs);

        // Rebuild Gemini history (only text, no image data URLs)
        historyRef.current = rows.map(r => ({
          role: r.role === 'ai' ? 'model' : 'user',
          parts: [{ text: r.message || '' }],
        }));

      } catch (err) {
        console.error('Load history error:', err);
      }
    };

    load();
  }, [currentSessionId, loadSession]);

  // ─── Get user display name ────────────────────────────────────────────────────
  const getUserName = useCallback(() => {
    if (user?.email) {
      const n = user.email.split('@')[0];
      return n.charAt(0).toUpperCase() + n.slice(1);
    }
    return isGuest ? 'Sobat AI' : 'Teman';
  }, [user, isGuest]);

  // ─── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text, file = null) => {
    const trimmed = (text || '').trim();
    if (!trimmed && !file) return;

    if (!currentSessionId) {
      startNewChat();
      return;
    }

    // Prevent concurrent sends
    if (activeRequests.current.has(currentSessionId)) return;

    const sessionId = currentSessionId;
    const myHistory = [...historyRef.current];

    const controller = new AbortController();
    activeRequests.current.set(sessionId, { controller });
    setIsSending(true);

    try {
      // If first message → set temporary title
      if (myHistory.length === 0) {
        const tmpTitle = file && IMAGE_EDIT_KEYWORDS.test(trimmed)
          ? 'Mengedit foto...'
          : 'Menganalisis topik...';
        await saveSessionTitle(sessionId, tmpTitle);
      }

      // Build user display HTML
      let displayHtml = trimmed.replace(/\n/g, '<br>');
      if (file) {
        if (file.dataUrl?.startsWith('data:image/')) {
          displayHtml = `<img src="${file.dataUrl}" alt="Gambar" class="max-w-full rounded-lg my-2" /><br>${displayHtml}`;
        } else if (file.name) {
          displayHtml = `📎 <strong>${file.name}</strong><br>${displayHtml}`;
        }
      }

      // Show user message immediately
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'user',
        text: displayHtml,
        rawText: trimmed,
        isAnimated: false,
        sessionId,
      }]);

      // Update history ref immediately
      const newHistory = [...myHistory, { role: 'user', parts: [{ text: trimmed }] }];
      historyRef.current = newHistory;

      // Save user message to DB
      await saveDataForSession(sessionId, 'user', displayHtml);

      // Cek kelanjutan konteks gambar (jika user tidak upload gambar baru di pesan ini)
      let activeFile = file;
      if (file && file.dataUrl?.startsWith('data:image/')) {
        lastImageRef.current = file;
      } else if (!file && IMAGE_EDIT_KEYWORDS.test(trimmed)) {
        if (!lastImageRef.current) {
          // Cari dari riwayat pesan sebelumnya jika ada tag img base64
          for (let i = messages.length - 1; i >= 0; i--) {
            const mText = messages[i]?.text || '';
            const match = mText.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
            if (match && match[1]) {
              const dUrl = match[1];
              const mType = dUrl.match(/^data:(image\/[a-z0-9+-]+);/i)?.[1] || 'image/png';
              lastImageRef.current = { dataUrl: dUrl, mimeType: mType, name: 'prev_image.png' };
              break;
            }
          }
        }
        activeFile = lastImageRef.current;
      }

      // Waktu lokal user di browser saat pesan dikirim
      const now = new Date();
      const userTime = {
        date: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hour: now.getHours(),
      };

      // Build payload
      const payload = {
        history: newHistory,
        message: trimmed,
        fileData: activeFile?.dataUrl || null,
        mimeType: activeFile?.mimeType || null,
        fileName: activeFile?.name || null,
        userName: getUserName(),
        userTime,
      };

      // Call backend
      const data = await sendChat(payload, controller.signal);

      // ── Handle AI-generated image (editedImage) ──────────────────────────────
      let storedImageUrl = null;
      let savedImageDataUrl = null;

      if (data.editedImage) {
        savedImageDataUrl = data.editedImage.startsWith('data:')
          ? data.editedImage
          : `data:image/png;base64,${data.editedImage}`;

        // Auto-save to Pustaka FIRST so we have the permanent URL for history
        if (user) {
          try {
            const label = trimmed.slice(0, 40) || 'ai-generated';
            storedImageUrl = await saveBase64ImageToPustaka(user.id, savedImageDataUrl, label);
          } catch (err) {
            console.error('Auto-save to pustaka failed:', err);
          }
        }
      }

      // ── Show AI reply ─────────────────────────────────────────────────────────
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: data.reply,
        rawText: data.reply,
        isAnimated: true,
        sources: data.sources || [],
        editedImage: storedImageUrl || savedImageDataUrl || null,
        storedImageUrl: storedImageUrl || null,
        sessionId,
      }]);

      // Update history ref
      historyRef.current = [
        ...newHistory,
        { role: 'model', parts: [{ text: data.reply }] },
      ];

      // ── Save AI reply to DB ───────────────────────────────────────────────────
      // Selalu simpan dengan marker [IMAGE_PUSTAKA]:url supaya bisa dimuat kembali setelah reload/refresh!
      let messageToSave = data.reply;
      if (savedImageDataUrl) {
        const urlToSave = storedImageUrl || savedImageDataUrl;
        messageToSave = `[IMAGE_PUSTAKA]:${urlToSave}\n${data.reply}`;
      }

      await saveDataForSession(sessionId, 'ai', messageToSave);

      // Update session title from backend
      if (data.title) {
        await saveSessionTitle(sessionId, data.title);
      }

    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: `❌ **Gagal terhubung.** ${err.message || 'Coba lagi sebentar.'}\n\n*Pastikan backend berjalan dan coba kirim pesan lagi.*`,
        rawText: err.message || 'Gagal terhubung',
        isAnimated: false,
        sessionId,
      }]);
    } finally {
      activeRequests.current.delete(sessionId);
      setIsSending(false);
    }
  }, [currentSessionId, startNewChat, saveSessionTitle, saveDataForSession, getUserName, user]);

  // ─── Save Silent Interaction (Untuk menyinkronkan Voice Call Modal ke Chat Utama)
  const saveSilentInteraction = useCallback(async (userText, aiText) => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = startNewChat();
    }
    
    // Add to state instantly
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text: userText, rawText: userText, isAnimated: false, sessionId },
      { id: Date.now() + 1, role: 'ai', text: aiText, rawText: aiText, isAnimated: false, sessionId }
    ]);

    // Update internal history for future context
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: userText }] },
      { role: 'model', parts: [{ text: aiText }] }
    ];

    // Save to database
    try {
      if (historyRef.current.length <= 2) {
        await saveSessionTitle(sessionId, 'Telepon Suara');
      }
      await saveDataForSession(sessionId, 'user', userText);
      await saveDataForSession(sessionId, 'ai', aiText);
    } catch (err) {
      console.error('Failed saving voice interaction to DB:', err);
    }
  }, [currentSessionId, startNewChat, saveDataForSession, saveSessionTitle]);

  // ─── Stop ─────────────────────────────────────────────────────────────────────
  const stopGeneration = useCallback(() => {
    const sid = currentSessionId;
    if (!activeRequests.current.has(sid)) return;
    const { controller } = activeRequests.current.get(sid);
    controller.abort();
    activeRequests.current.delete(sid);
    setIsSending(false);
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'ai',
      text: '*Dihentikan oleh pengguna.*',
      rawText: '*Dihentikan oleh pengguna.*',
      isAnimated: false,
      sessionId: sid,
    }]);
  }, [currentSessionId]);

  // ─── Clear ────────────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
    startNewChat();
  }, [startNewChat]);

  return {
    messages,
    isSending,
    sendMessage,
    saveSilentInteraction,
    stopGeneration,
    clearChat,
  };
}
