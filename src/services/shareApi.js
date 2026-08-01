import { supabase } from '../lib/supabase';

/**
 * Shared conversations table operations
 * Table: shared_conversations
 * Columns: share_id (auto PK), title, messages (jsonb), created_at
 */

/**
 * Share a session
 * Returns share_id
 */
export async function shareSession(sessionId, title, messages, userId) {
  const { data, error } = await supabase
    .from('shared_conversations')
    .insert([{
      title: title,
      messages: messages,
    }])
    .select('share_id')
    .single();

  if (error) {
    console.error('Error sharing session:', error);
    throw error;
  }

  return data?.share_id || null;
}

/**
 * Get shared conversation by share_id
 */
export async function getSharedConversation(shareId) {
  const { data, error } = await supabase
    .from('shared_conversations')
    .select('share_id, title, messages, created_at')
    .eq('share_id', shareId)
    .single();

  if (error) {
    console.error('Error fetching shared conversation:', error);
    return null;
  }

  return data;
}
