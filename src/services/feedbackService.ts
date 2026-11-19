import { supabase } from '@/lib/supabaseClient';
import type { FeedbackCategory, FeedbackRow } from '@/types/database.types';

const SELECT_COLUMNS = 'id, user_id, category, subject, message, created_at';

function mapFeedback(row: Record<string, unknown>): FeedbackRow {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    category: row.category as FeedbackCategory,
    subject: row.subject ? String(row.subject) : null,
    message: String(row.message),
    created_at: String(row.created_at ?? ''),
  };
}

/**
 * Send a letter to the team. `subject` needs the progress migration; when the
 * column is missing the insert retries without it so feedback still works.
 */
export async function submitFeedback(
  userId: string,
  category: FeedbackCategory,
  subject: string,
  message: string,
): Promise<FeedbackRow> {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error('Feedback message cannot be empty.');
  }
  const trimmedSubject = subject.trim().slice(0, 120);

  const payload: Record<string, unknown> = {
    user_id: userId,
    category,
    message: trimmed,
  };
  if (trimmedSubject) payload.subject = trimmedSubject;

  const first = await supabase
    .from('feedback')
    .insert(payload)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  let result: {
    data: Record<string, unknown> | null;
    error: { message: string; code?: string } | null;
  } = {
    data: (first.data ?? null) as Record<string, unknown> | null,
    error: first.error,
  };

  if (result.error && payload.subject !== undefined) {
    // 42703 = undefined column, PGRST204 = unknown column in schema cache.
    if (result.error.code === '42703' || result.error.code === 'PGRST204') {
      delete payload.subject;
      const retry = await supabase
        .from('feedback')
        .insert(payload)
        .select('id, user_id, category, message, created_at')
        .maybeSingle();
      result = {
        data: (retry.data ?? null) as Record<string, unknown> | null,
        error: retry.error,
      };
    }
  }

  if (result.error) throw new Error(result.error.message);
  return mapFeedback((result.data ?? {
    id: '',
    user_id: userId,
    category,
    subject: trimmedSubject || null,
    message: trimmed,
    created_at: new Date().toISOString(),
  }) as Record<string, unknown>);
}

export async function listMyFeedback(userId: string): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!error && data) {
    return (data as Record<string, unknown>[]).map(mapFeedback);
  }

  // Older database without the subject column.
  const fallback = await supabase
    .from('feedback')
    .select('id, user_id, category, message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (fallback.error || !fallback.data) return [];
  return (fallback.data as Record<string, unknown>[]).map(mapFeedback);
}
