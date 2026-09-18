import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components';
import { Icon, type IconName } from '@/components/ui';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/api/errors';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { confirmConciergeAction, sendConciergeTurn } from './api';
import { resolveConciergeHref } from './safeRoutes';
import { useConciergeVoice } from './useConciergeVoice';
import type { ConciergeConfirmResponse, ConciergeTurnResponse, ConfirmationCard } from './types';

type ChatRole = 'bot' | 'user' | 'system';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  card?: ConfirmationCard | null;
  blocks?: Record<string, unknown>[];
  status?: 'placing' | 'done';
};

const SUGGESTIONS = [
  'What can you help me with?',
  'I need my medicines',
  'Call my care manager',
  'Book a companion',
  'I need a doctor visit',
  'Get groceries',
  'Help with house maintenance',
];

function iconForCard(name: string): IconName {
  const map: Record<string, IconName> = {
    medkit: 'medkit',
    cart: 'cart-outline',
    call: 'call-outline',
    people: 'people',
    car: 'car-outline',
    home: 'home',
    sparkles: 'sparkles',
  };
  return map[name] ?? 'sparkles';
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const WELCOME_TEXT =
  'Namaste! I am AgeWell Bot. I can talk with you and help with all membership services — medicines, care manager, companion, doctor, groceries, transport, home help, and more. What do you need today?';

export function CareConciergeScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: WELCOME_TEXT,
    },
  ]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, busy, scrollToEnd]);

  const push = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const runTurnRef = useRef<(message: string, inputMode?: 'text' | 'voice') => Promise<void>>(async () => {});

  const {
    listening,
    partial,
    speaking,
    voiceError,
    clearVoiceError,
    toggleListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useConciergeVoice({
    onFinalTranscript: (text) => {
      void runTurnRef.current(text, 'voice');
    },
  });

  useEffect(() => {
    if (!voiceEnabled) return;
    const timer = setTimeout(() => speak(WELCOME_TEXT), 500);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
    // Speak welcome once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maybeSpeak = useCallback(
    (text: string) => {
      if (voiceEnabled) speak(text);
    },
    [speak, voiceEnabled],
  );

  const handleClientAction = useCallback((response: ConciergeTurnResponse) => {
    if (response.clientAction === 'open_sos') {
      const text = `${response.replyText}\n\nTap below if you need Emergency Support.`;
      push({
        id: newId('sos'),
        role: 'bot',
        text,
      });
      maybeSpeak(response.speakText || response.replyText);
      return 'sos';
    }
    if (response.clientAction === 'navigate' && response.navigateTo) {
      const href = resolveConciergeHref(response.navigateTo);
      push({
        id: newId('nav'),
        role: 'bot',
        text: response.replyText,
      });
      maybeSpeak(response.speakText || response.replyText);
      if (href) {
        setTimeout(() => router.push(href), 450);
        return 'nav';
      }
      push({
        id: newId('nav-miss'),
        role: 'bot',
        text: 'I could not open that screen. Try saying the service name again, or open it from Services.',
      });
      return 'nav-miss';
    }
    return null;
  }, [maybeSpeak, push]);

  const runTurn = useCallback(
    async (message: string, inputMode: 'text' | 'voice' = 'text') => {
      const trimmed = message.trim();
      if (!trimmed || busy) return;

      stopListening();
      stopSpeaking();
      push({ id: newId('user'), role: 'user', text: trimmed });
      setBusy(true);
      try {
        const response = await sendConciergeTurn({
          message: trimmed,
          sessionId,
          inputMode,
        });
        setSessionId(response.sessionId);

        const action = handleClientAction(response);
        if (action) {
          return;
        }

        push({
          id: newId('bot'),
          role: 'bot',
          text: response.replyText,
          card: response.requiresConfirmation ? response.card : null,
          blocks: response.answerBlocks?.length ? response.answerBlocks : undefined,
        });
        maybeSpeak(response.speakText || response.replyText);
      } catch (err) {
        const errText = getApiErrorMessage(err) || 'Sorry, I could not reply just now. Please try again.';
        push({
          id: newId('err'),
          role: 'bot',
          text: errText,
        });
        maybeSpeak(errText);
      } finally {
        setBusy(false);
      }
    },
    [busy, handleClientAction, maybeSpeak, push, sessionId, stopListening, stopSpeaking],
  );

  runTurnRef.current = runTurn;

  const onConfirm = useCallback(
    async (card: ConfirmationCard) => {
      if (!card.confirmation_id || confirmingId) return;
      setConfirmingId(card.confirmation_id);
      stopSpeaking();
      push({
        id: newId('placing'),
        role: 'system',
        text: 'Placing your request…',
        status: 'placing',
      });
      try {
        const result: ConciergeConfirmResponse = await confirmConciergeAction({
          confirmationId: card.confirmation_id,
          sessionId,
        });
        push({
          id: newId('done'),
          role: 'bot',
          text: result.replyText,
          status: 'done',
        });
        maybeSpeak(result.speakText || result.replyText);
      } catch (err) {
        const errText = getApiErrorMessage(err) || 'That request could not be completed. Please try again.';
        push({
          id: newId('err'),
          role: 'bot',
          text: errText,
        });
        maybeSpeak(errText);
      } finally {
        setConfirmingId(null);
      }
    },
    [confirmingId, maybeSpeak, push, sessionId, stopSpeaking],
  );

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'system') {
      return (
        <View style={styles.systemRow}>
          {item.status === 'placing' ? <ActivityIndicator color={familyHome.green} /> : null}
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
        {!isUser ? (
          <View style={styles.botAvatar}>
            <Icon name="sparkles" size={16} color={familyHome.white} />
          </View>
        ) : null}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>

          {item.blocks?.map((block, index) => (
            <View key={`${item.id}-b-${index}`} style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{String(block.title ?? 'Update')}</Text>
              {block.status ? <Text style={styles.statusPill}>{String(block.status)}</Text> : null}
              {block.detail ? <Text style={styles.cardSub}>{String(block.detail)}</Text> : null}
              {block.remaining != null ? (
                <Text style={styles.cardSub}>
                  Used {String(block.used ?? 0)}
                  {block.limit != null ? ` / ${String(block.limit)}` : ''}
                  {` · Remaining ${String(block.remaining)}`}
                </Text>
              ) : null}
            </View>
          ))}

          {item.card ? (
            <View style={styles.inlineCard}>
              <View style={styles.cardHead}>
                <View style={styles.cardIcon}>
                  <Icon name={iconForCard(item.card.icon)} size={18} color={familyHome.green} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{item.card.title}</Text>
                  {item.card.subtitle ? <Text style={styles.cardSub}>{item.card.subtitle}</Text> : null}
                </View>
              </View>
              {item.card.lines.map((line) => (
                <View key={`${line.label}-${line.value}`} style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{line.label}</Text>
                  <Text style={styles.lineValue}>{line.value}</Text>
                </View>
              ))}
              <PrimaryButton
                label={item.card.primary_label}
                onPress={() => void onConfirm(item.card!)}
                loading={confirmingId === item.card.confirmation_id}
                disabled={Boolean(confirmingId)}
              />
              <Pressable
                onPress={() =>
                  push({
                    id: newId('cancel'),
                    role: 'bot',
                    text: 'No problem. Tell me what else you need — I am still here.',
                  })
                }
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>{item.card.secondary_label}</Text>
              </Pressable>
            </View>
          ) : null}

          {item.text.includes('Emergency Support') && item.role === 'bot' ? (
            <Pressable style={styles.sosInline} onPress={() => router.push('/(tabs)/sos' as Href)}>
              <Icon name="siren" size={18} color={familyHome.white} />
              <Text style={styles.sosInlineText}>Open SOS</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const composer = (
    <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {listening || partial ? (
        <View style={styles.listeningBanner}>
          <ActivityIndicator color={familyHome.green} />
          <Text style={styles.listeningText}>
            {partial ? `Hearing: “${partial}”` : 'Listening… speak now'}
          </Text>
          <Pressable onPress={stopListening} accessibilityRole="button" accessibilityLabel="Stop listening">
            <Text style={styles.stopListen}>Stop</Text>
          </Pressable>
        </View>
      ) : null}
      {voiceError ? (
        <Pressable onPress={clearVoiceError} style={styles.voiceErrorBanner}>
          <Text style={styles.voiceErrorText}>{voiceError}</Text>
        </Pressable>
      ) : null}
      <View style={styles.composer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop listening' : 'Talk to AgeWell Bot'}
          onPress={toggleListening}
          disabled={busy}
          style={[styles.micBtn, listening && styles.micBtnActive, busy && styles.sendDisabled]}
        >
          <Icon name="mic" size={22} color={listening ? familyHome.white : familyHome.green} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={listening ? 'Listening…' : 'Ask AgeWell Bot anything…'}
          placeholderTextColor={familyHome.muted}
          style={styles.input}
          editable={!busy && !listening}
          multiline
          onSubmitEditing={() => {
            const msg = draft;
            setDraft('');
            void runTurn(msg);
          }}
          blurOnSubmit={false}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={busy || !draft.trim() || listening}
          onPress={() => {
            const msg = draft;
            setDraft('');
            void runTurn(msg);
          }}
          style={[styles.sendBtn, (!draft.trim() || busy || listening) && styles.sendDisabled]}
        >
          {busy ? (
            <ActivityIndicator color={familyHome.white} />
          ) : (
            <Icon name="arrow-forward" size={18} color={familyHome.white} />
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={familyHome.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>AgeWell Bot</Text>
          <Text style={styles.headerSub}>
            {listening ? 'Listening…' : speaking ? 'Speaking…' : 'Voice + chat · all services'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceEnabled ? 'Mute bot voice' : 'Unmute bot voice'}
          onPress={() => {
            if (voiceEnabled) stopSpeaking();
            setVoiceEnabled((v) => !v);
          }}
          style={styles.backBtn}
        >
          <Icon
            name={voiceEnabled ? 'volume-high' : 'volume-mute'}
            size={22}
            color={voiceEnabled ? familyHome.green : familyHome.muted}
          />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((prompt) => (
              <Pressable
                key={prompt}
                style={styles.chip}
                disabled={busy}
                onPress={() => void runTurn(prompt)}
              >
                <Text style={styles.chipText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        }
      />

      {Platform.OS === 'web' ? (
        <View style={styles.composerShell}>{composer}</View>
      ) : (
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }} style={styles.composerShell}>
          {composer}
        </KeyboardStickyView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7FAF7' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: familyHome.white,
    borderBottomWidth: 1,
    borderBottomColor: familyHome.border,
  },
  backBtn: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { alignItems: 'center' },
  headerTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 18 },
  headerSub: { ...typography.caption, color: familyHome.muted, marginTop: 2 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: 'row', marginBottom: spacing.sm, maxWidth: '100%' },
  rowBot: { justifyContent: 'flex-start', paddingRight: spacing.xl },
  rowUser: { justifyContent: 'flex-end', paddingLeft: spacing.xl },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxWidth: '92%',
    gap: spacing.sm,
  },
  bubbleBot: {
    backgroundColor: familyHome.white,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderTopLeftRadius: 6,
  },
  bubbleUser: {
    backgroundColor: familyHome.green,
    borderTopRightRadius: 6,
  },
  bubbleText: { ...typography.body, color: familyHome.text, fontSize: 16, lineHeight: 24 },
  bubbleTextUser: { color: familyHome.white },
  inlineCard: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.bodyStrong, color: familyHome.text, fontSize: 16 },
  cardSub: { ...typography.caption, color: familyHome.muted, lineHeight: 18 },
  lineRow: { gap: 2 },
  lineLabel: { ...typography.caption, color: familyHome.muted },
  lineValue: { ...typography.body, color: familyHome.text, fontSize: 15, lineHeight: 21 },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { ...typography.bodyStrong, color: familyHome.muted },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: familyHome.greenSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    ...typography.caption,
    color: familyHome.greenDark,
    fontWeight: '600',
  },
  sosInline: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: familyHome.red,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sosInlineText: { ...typography.bodyStrong, color: familyHome.white },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  systemText: { ...typography.caption, color: familyHome.muted },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: familyHome.border,
    backgroundColor: familyHome.white,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: familyHome.text, fontWeight: '600' },
  composerShell: { backgroundColor: familyHome.white },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: familyHome.border,
    backgroundColor: familyHome.white,
    paddingTop: spacing.sm,
  },
  listeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: familyHome.greenSoft,
  },
  listeningText: { ...typography.caption, color: familyHome.greenDark, flex: 1, fontWeight: '600' },
  stopListen: { ...typography.bodyStrong, color: familyHome.green, fontSize: 14 },
  voiceErrorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: familyHome.orangeSoft,
  },
  voiceErrorText: { ...typography.caption, color: familyHome.text, lineHeight: 18 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: familyHome.white,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: familyHome.green,
  },
  micBtnActive: {
    backgroundColor: familyHome.green,
    borderColor: familyHome.green,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    ...typography.body,
    color: familyHome.text,
    backgroundColor: '#F5F7F5',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
