import { apiClient } from '@/api/client';
import { toApiError } from '@/api/errors';
import type { ConciergeConfirmResponse, ConciergeTurnResponse, ConfirmationCard } from './types';

function toCard(raw: any): ConfirmationCard | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    title: String(raw.title ?? ''),
    subtitle: raw.subtitle ?? null,
    icon: String(raw.icon ?? 'sparkles'),
    lines: Array.isArray(raw.lines)
      ? raw.lines.map((line: any) => ({
          label: String(line.label ?? ''),
          value: String(line.value ?? ''),
          changeable: Boolean(line.changeable),
        }))
      : [],
    primary_label: String(raw.primary_label ?? 'Continue'),
    secondary_label: String(raw.secondary_label ?? 'Cancel'),
    confirmation_id: String(raw.confirmation_id ?? ''),
  };
}

function toTurn(raw: any): ConciergeTurnResponse {
  return {
    sessionId: String(raw.session_id ?? ''),
    replyText: String(raw.reply_text ?? ''),
    speakText: raw.speak_text ?? null,
    intent: raw.intent,
    confidence: Number(raw.confidence ?? 0),
    requiresConfirmation: Boolean(raw.requires_confirmation),
    card: toCard(raw.card),
    clientAction: raw.client_action ?? null,
    navigateTo: raw.navigate_to ?? null,
    answerBlocks: Array.isArray(raw.answer_blocks) ? raw.answer_blocks : [],
    quickActions: Array.isArray(raw.quick_actions)
      ? raw.quick_actions.map((a: any) => ({
          id: String(a.id ?? ''),
          label: String(a.label ?? ''),
          prompt: String(a.prompt ?? ''),
        }))
      : [],
  };
}

function toConfirm(raw: any): ConciergeConfirmResponse {
  return {
    success: Boolean(raw.success),
    replyText: String(raw.reply_text ?? ''),
    speakText: raw.speak_text ?? null,
    resultType: String(raw.result_type ?? 'info'),
    referenceId: raw.reference_id ? String(raw.reference_id) : null,
    summary: raw.summary && typeof raw.summary === 'object' ? raw.summary : {},
    navigateTo: raw.navigate_to ?? null,
  };
}

export async function sendConciergeTurn(input: {
  message: string;
  sessionId?: string | null;
  inputMode?: 'text' | 'voice';
}): Promise<ConciergeTurnResponse> {
  try {
    const response = await apiClient.post('/concierge/turn', {
      message: input.message,
      session_id: input.sessionId ?? null,
      input_mode: input.inputMode ?? 'text',
    });
    return toTurn(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function confirmConciergeAction(input: {
  confirmationId: string;
  sessionId?: string | null;
}): Promise<ConciergeConfirmResponse> {
  try {
    const response = await apiClient.post('/concierge/confirm', {
      confirmation_id: input.confirmationId,
      session_id: input.sessionId ?? null,
    });
    return toConfirm(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}
