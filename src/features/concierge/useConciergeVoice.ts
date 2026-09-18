import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import * as Speech from 'expo-speech';

type FinalHandler = (text: string) => void;

type NativeSpeechModule = {
  isRecognitionAvailable: () => boolean;
  requestMicrophonePermissionsAsync: () => Promise<{ granted: boolean }>;
  requestSpeechRecognizerPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  addListener: (event: string, listener: (payload: any) => void) => { remove: () => void };
};

/**
 * expo-speech-recognition crashes on import in Expo Go (no native binary).
 * Only require it when NativeModules already exposes the module.
 */
function loadNativeSpeechModule(): NativeSpeechModule | null {
  if (Platform.OS === 'web') return null;
  if (!(NativeModules as Record<string, unknown>).ExpoSpeechRecognition) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule: NativeSpeechModule;
    };
    return mod.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

const nativeSpeech = loadNativeSpeechModule();

type WebRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getWebRecognitionCtor(): (new () => WebRecognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => WebRecognition;
    webkitSpeechRecognition?: new () => WebRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Options = {
  onFinalTranscript: FinalHandler;
  language?: string;
};

export function useConciergeVoice({ onFinalTranscript, language = 'en-IN' }: Options) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const webRecRef = useRef<WebRecognition | null>(null);

  useEffect(() => {
    if (nativeSpeech) {
      try {
        setAvailable(nativeSpeech.isRecognitionAvailable());
        return;
      } catch {
        // fall through
      }
    }
    setAvailable(Boolean(getWebRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (!nativeSpeech) return;

    const subs = [
      nativeSpeech.addListener('start', () => {
        setListening(true);
        setVoiceError(null);
      }),
      nativeSpeech.addListener('end', () => setListening(false)),
      nativeSpeech.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript?.trim() ?? '';
        if (!transcript) return;
        if (event.isFinal) {
          setPartial('');
          setListening(false);
          onFinalRef.current(transcript);
        } else {
          setPartial(transcript);
        }
      }),
      nativeSpeech.addListener('error', (event) => {
        setListening(false);
        setPartial('');
        const code = String(event.error ?? '');
        if (code === 'aborted' || code === 'no-speech') {
          setVoiceError(null);
          return;
        }
        setVoiceError(
          code === 'not-allowed'
            ? 'Microphone permission is needed to talk to AgeWell Bot.'
            : 'I could not hear that clearly. Please try again or type your message.',
        );
      }),
    ];

    return () => {
      for (const sub of subs) sub.remove();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (!cleaned) return;
      Speech.stop();
      setSpeaking(true);
      Speech.speak(cleaned, {
        language,
        rate: 0.88,
        pitch: 1.0,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [language],
  );

  const stopListening = useCallback(() => {
    try {
      nativeSpeech?.stop();
    } catch {
      // ignore
    }
    try {
      webRecRef.current?.stop();
    } catch {
      // ignore
    }
    webRecRef.current = null;
    setListening(false);
  }, []);

  const startWebListening = useCallback(() => {
    const Ctor = getWebRecognitionCtor();
    if (!Ctor) {
      setVoiceError('Speech recognition is not available in this browser.');
      return;
    }
    const rec = new Ctor();
    webRecRef.current = rec;
    rec.lang = language;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      if (interim) setPartial(interim.trim());
      if (finalText.trim()) {
        setPartial('');
        setListening(false);
        onFinalRef.current(finalText.trim());
      }
    };
    rec.onerror = () => {
      setListening(false);
      setPartial('');
      setVoiceError('I could not hear that clearly. Please try again or type your message.');
    };
    rec.onend = () => setListening(false);
    setListening(true);
    setVoiceError(null);
    rec.start();
  }, [language]);

  const startListening = useCallback(async () => {
    setVoiceError(null);
    stopSpeaking();

    if (nativeSpeech) {
      try {
        if (!nativeSpeech.isRecognitionAvailable()) {
          setVoiceError('Voice input is not available on this device. Please type your message.');
          return;
        }
        const mic = await nativeSpeech.requestMicrophonePermissionsAsync();
        if (!mic.granted) {
          setVoiceError('Please allow microphone access to talk to AgeWell Bot.');
          return;
        }
        if (Platform.OS === 'ios') {
          const speechPerm = await nativeSpeech.requestSpeechRecognizerPermissionsAsync();
          if (!speechPerm.granted) {
            setVoiceError('Please allow speech recognition to talk to AgeWell Bot.');
            return;
          }
        }
        setPartial('');
        nativeSpeech.start({
          lang: language,
          interimResults: true,
          continuous: false,
          addsPunctuation: true,
        });
        return;
      } catch {
        // fall through
      }
    }

    if (Platform.OS === 'web') {
      startWebListening();
      return;
    }

    setVoiceError(
      'Voice listening needs a development build (npx expo run:android). Bot speaking and typing still work here.',
    );
  }, [language, startWebListening, stopSpeaking]);

  const toggleListening = useCallback(() => {
    if (listening) stopListening();
    else void startListening();
  }, [listening, startListening, stopListening]);

  return {
    available,
    listening,
    partial,
    speaking,
    voiceError,
    clearVoiceError: () => setVoiceError(null),
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
