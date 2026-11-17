import { supabase } from '@/lib/supabaseClient';
import type { FeedbackCategory, FeedbackRow } from '@/types/database.types';

function mapFeedback(row: Record<string, unknown>): FeedbackRow {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    category: row.category as FeedbackCategory,
    message: String(row.message),
    created_at: String(row.created_at ?? ''),
  };
}

export async function submitFeedback(
  userId: string,
  category: FeedbackCategory,
  message: string,
): Promise<FeedbackRow> {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error('Feedback message cannot be empty.');
  }

  const { data, error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, category, message: trimmed })
    .select('id, user_id, category, message, created_at')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapFeedback((data ?? {
    id: '',
    user_id: userId,
    category,
    message: trimmed,
    created_at: new Date().toISOString(),
  }) as Record<string, unknown>);
}

export async function listMyFeedback(userId: string): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, user_id, category, message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapFeedback);
}
