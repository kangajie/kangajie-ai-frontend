import { supabase } from '../lib/supabase';

/**
 * Chat sessions table operations
 * Table: chat_sessions
 * Columns: session_id (text/uuid), user_id (text), title (text), created_at (timestamptz)
 */

/**
 * Load user's chat sessions (Tampilkan semua riwayat percakapan tanpa terpotong)
 */
export async function loadSessions(userId) {
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('session_id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !sessions) {
    if (error) console.error('Error loading sessions:', error);
    return [];
  }

  return sessions;
}

/**
 * Save/upsert session title
 */
export async function saveSessionTitle(sessionId, userId, title) {
  const { error } = await supabase
    .from('chat_sessions')
    .upsert({
      session_id: sessionId,
      user_id: userId,
      title: title,
    }, { onConflict: 'session_id' });

  if (error) {
    console.error('Error saving session title:', error);
  }
}

/**
 * Delete a session and its history
 */
export async function deleteSession(sessionId, userId) {
  const supabaseClient = supabase;

  // Delete from chat_history first
  const { error: histError } = await supabaseClient
    .from('chat_history')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (histError) {
    console.error('Error deleting chat history:', histError);
  }

  // Delete from chat_sessions
  const { error: sessError } = await supabaseClient
    .from('chat_sessions')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (sessError) {
    console.error('Error deleting session:', sessError);
  }
}

/**
 * Chat history table operations
 * Table: chat_history
 * Columns: user_id, session_id, role ('user'|'ai'), message (text), created_at
 */

/**
 * Load messages for a session
 */
export async function loadSessionHistory(sessionId, userId) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading session history:', error);
    return [];
  }

  return data || [];
}

/**
 * Save a message to history
 */
export async function saveMessage(sessionId, userId, role, message) {
  const { error } = await supabase
    .from('chat_history')
    .insert([{
      user_id: userId,
      session_id: sessionId,
      role: role,
      message: message,
    }]);

  if (error) {
    console.error('Error saving message:', error);
  }
}

/**
 * Bulk save messages (for fork)
 */
export async function saveMessagesBulk(messages, sessionId, userId) {
  const rows = messages.map(m => ({
    user_id: userId,
    session_id: sessionId,
    role: m.role,
    message: m.message,
  }));

  const { error } = await supabase
    .from('chat_history')
    .insert(rows);

  if (error) {
    console.error('Error saving bulk messages:', error);
  }
}
