import { VivaLanguage } from '../types/viva';

export interface VoiceSelectionInfo {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  label: string;
}

const KNOWN_INDIAN_MALE_KEYWORDS = [
  'rishi',
  'prabhat',
  'madhur',
  'hemant',
  'ravi',
  'aarav',
  'arjun',
  'rohan',
  'male',
  'google hindi',
];

const KNOWN_FEMALE_KEYWORDS = [
  'veena',
  'heera',
  'neerja',
  'swara',
  'kalpana',
  'lekha',
  'samantha',
  'victoria',
  'zira',
  'female',
  'aria',
  'karen',
];

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function selectIndianMaleVoice(language: VivaLanguage): VoiceSelectionInfo {
  const targetLang = language === 'hindi' ? 'hi-IN' : 'en-IN';

  if (!isSpeechSynthesisSupported()) {
    return { voice: null, lang: targetLang, label: targetLang };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return { voice: null, lang: targetLang, label: targetLang };
  }

  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    const langLower = (voice.lang || '').toLowerCase().replace('_', '-');
    const nameLower = (voice.name || '').toLowerCase();
    let score = 0;

    if (language === 'hindi') {
      if (langLower === 'hi-in') score += 60;
      else if (langLower.startsWith('hi')) score += 45;
      else if (langLower === 'en-in') score += 20;
    } else {
      if (langLower === 'en-in') score += 60;
      else if (langLower.endsWith('-in')) score += 35;
      else if (langLower.startsWith('en')) score += 15;
    }

    if (KNOWN_INDIAN_MALE_KEYWORDS.some((kw) => nameLower.includes(kw))) {
      score += 30;
    }
    if (KNOWN_FEMALE_KEYWORDS.some((kw) => nameLower.includes(kw))) {
      score -= 18;
    }
    if (nameLower.includes('google') || nameLower.includes('microsoft') || nameLower.includes('natural')) {
      score += 8;
    }

    return score;
  };

  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  const best = sorted[0] ?? null;

  return {
    voice: best,
    lang: best?.lang || targetLang,
    label: best ? `${best.name} (${best.lang})` : targetLang,
  };
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakExaminerText(
  text: string,
  language: VivaLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }
): VoiceSelectionInfo {
  const targetLang = language === 'hindi' ? 'hi-IN' : 'en-IN';
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options?.onEnd?.();
    return { voice: null, lang: targetLang, label: targetLang };
  }

  window.speechSynthesis.cancel();

  const selection = selectIndianMaleVoice(language);
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = selection.voice?.lang || targetLang;
  if (selection.voice) {
    utterance.voice = selection.voice;
  }

  // Natural composed Indian male professor cadence
  utterance.rate = language === 'hindi' ? 0.94 : 0.96;
  const isAlreadyMale =
    selection.voice &&
    KNOWN_INDIAN_MALE_KEYWORDS.some((kw) => selection.voice!.name.toLowerCase().includes(kw));
  utterance.pitch = isAlreadyMale ? 0.96 : 0.86;
  utterance.volume = 1;

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') {
      options?.onEnd?.();
      return;
    }
    options?.onError?.('Audio playback could not start in this browser.');
    options?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return selection;
}

// Browser Speech-to-Text (SpeechRecognition / webkitSpeechRecognition)
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

export interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function createSpeechRecognizer(
  lang: 'en-IN' | 'hi-IN',
  callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onFinalTranscript: (transcript: string) => void;
    onInterimTranscript: (interim: string) => void;
    onError: (message: string) => void;
  }
): SpeechRecognitionInstance | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => callbacks.onStart?.();
  recognition.onend = () => callbacks.onEnd?.();

  recognition.onresult = (event) => {
    let interim = '';
    let finalChunk = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? '';
      if (result.isFinal) {
        finalChunk += text;
      } else {
        interim += text;
      }
    }

    callbacks.onInterimTranscript(interim.trim());
    if (finalChunk.trim()) {
      callbacks.onFinalTranscript(finalChunk.trim());
    }
  };

  recognition.onerror = (event) => {
    switch (event.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        callbacks.onError('Microphone permission was denied. Allow mic access in your browser or type your answer.');
        break;
      case 'no-speech':
        callbacks.onError('No speech detected. Try speaking closer to your microphone or type your answer.');
        break;
      case 'audio-capture':
        callbacks.onError('No working microphone was detected on this device.');
        break;
      case 'network':
        callbacks.onError('Speech recognition needs an active network connection. You can type your answer instead.');
        break;
      case 'aborted':
        break;
      default:
        callbacks.onError('Voice input paused unexpectedly. You can resume speaking or type your answer.');
    }
  };

  return recognition;
}
