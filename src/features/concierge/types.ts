export type ConciergeIntent =
  | 'chat'
  | 'emergency'
  | 'care_manager_call'
  | 'request_service'
  | 'medicine_order'
  | 'grocery_order'
  | 'companion_visit'
  | 'transport'
  | 'home_service'
  | 'order_status'
  | 'membership_usage'
  | 'navigate'
  | 'clarify'
  | 'escalate_human';

export type ConciergeCardLine = {
  label: string;
  value: string;
  changeable?: boolean;
};

export type ConfirmationCard = {
  title: string;
  subtitle?: string | null;
  icon: string;
  lines: ConciergeCardLine[];
  primary_label: string;
  secondary_label: string;
  confirmation_id: string;
};

export type ConciergeQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export type ConciergeTurnResponse = {
  sessionId: string;
  replyText: string;
  speakText?: string | null;
  intent: ConciergeIntent;
  confidence: number;
  requiresConfirmation: boolean;
  card?: ConfirmationCard | null;
  clientAction?: string | null;
  navigateTo?: string | null;
  answerBlocks: Record<string, unknown>[];
  quickActions: ConciergeQuickAction[];
};

export type ConciergeConfirmResponse = {
  success: boolean;
  replyText: string;
  speakText?: string | null;
  resultType: string;
  referenceId?: string | null;
  summary: Record<string, unknown>;
  navigateTo?: string | null;
};
