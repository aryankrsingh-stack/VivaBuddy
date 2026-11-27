import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Mic,
  MicOff,
  Send,
  SkipForward,
  Clock,
  Loader2,
  AlertCircle,
  UserRound,
} from 'lucide-react';
import { VivaLanguage, VivaQuestion } from '../types/viva';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakExaminerText,
  SpeechRecognitionInstance,
  stopSpeaking,
} from '../utils/speech';

interface ExaminerStepProps {
  subjectTitle: string;
  question: VivaQuestion;
  questionIndex: number;
  totalQuestions: number;
  language: VivaLanguage;
  timerSeconds: number | null;
  isEvaluating: boolean;
  error: string | null;
  onToggleTimer: (seconds: number | null) => void;
  onSubmitAnswer: (answer: string, skipped: boolean, timeSpentSeconds: number) => void;
}

function formatClock(sec: number): string {
  const safe = Math.max(0, sec);
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function ExaminerStep({
  subjectTitle,
  question,
  questionIndex,
  totalQuestions,
  language,
  timerSeconds,
  isEvaluating,
  error,
  onToggleTimer,
  onSubmitAnswer,
}: ExaminerStepProps) {
  const [answer, setAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>(
    language === 'hindi' ? 'hi-IN' : 'en-IN'
  );
  const [micError, setMicError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(timerSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sttSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  // Reset answer & timers whenever question changes
  useEffect(() => {
    setAnswer('');
    setInterimTranscript('');
    setMicError(null);
    setSecondsLeft(timerSeconds);
    setElapsedSeconds(0);
  }, [question.id, timerSeconds]);

  // Auto-read question aloud with Indian male voice when question appears
  useEffect(() => {
    if (!ttsSupported) return;

    const triggerSpeak = () => {
      if (!autoSpeak) return;
      const info = speakExaminerText(question.question, language, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      setVoiceNote(info.label);
    };

    // Wait briefly for voices to load in Chromium/Safari
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const t = window.setTimeout(triggerSpeak, 220);
      return () => {
        window.clearTimeout(t);
        stopSpeaking();
      };
    }

    const handleVoicesChanged = () => {
      triggerSpeak();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true });
    const fallbackTimer = window.setTimeout(triggerSpeak, 450);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      stopSpeaking();
    };
  }, [question.id, question.question, language, autoSpeak, ttsSupported]);

  // Clean up mic & speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Track elapsed time & optional countdown
  useEffect(() => {
    if (isEvaluating) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isEvaluating, question.id]);

  const handlePlayQuestion = () => {
    if (!ttsSupported) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const info = speakExaminerText(question.question, language, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    setVoiceNote(info.label);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  const toggleRecording = () => {
    setMicError(null);
    if (isRecording) {
      stopRecording();
      return;
    }

    // Stop examiner TTS before opening the mic so it doesn't transcribe the examiner
    stopSpeaking();
    setIsSpeaking(false);

    const recognizer = createSpeechRecognizer(speechLang, {
      onStart: () => setIsRecording(true),
      onEnd: () => {
        setIsRecording(false);
        setInterimTranscript('');
      },
      onFinalTranscript: (chunk) => {
        setAnswer((prev) => {
          const base = prev.trim();
          return base ? `${base} ${chunk}` : chunk;
        });
      },
      onInterimTranscript: (interim) => {
        setInterimTranscript(interim);
      },
      onError: (msg) => {
        setMicError(msg);
        setIsRecording(false);
      },
    });

    if (!recognizer) {
      setMicError('Speech recognition is not supported in this browser. Please type your answer below.');
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch {
      setMicError('Could not start the microphone. Please check browser mic permissions.');
      setIsRecording(false);
    }
  };

  const handleSwitchSpeechLang = (nextLang: 'en-IN' | 'hi-IN') => {
    setSpeechLang(nextLang);
    if (isRecording) {
      stopRecording();
    }
  };

  const handleSubmit = (skipped = false) => {
    stopSpeaking();
    stopRecording();
    const combined = `${answer} ${interimTranscript}`.trim();
    onSubmitAnswer(skipped ? '' : combined, skipped, elapsedSeconds);
  };

  const progressPct = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const fullDraft = `${answer}${interimTranscript ? (answer.trim() ? ' ' : '') + interimTranscript : ''}`.trim();
  const isTimeUp = secondsLeft === 0;
  const isLowTime = secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 10;

  return (
    <motion.section
      key={question.id}
      initial={{ opacity: 0, x: 22 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -22 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6"
    >
      {/* Question Progress Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#14B8A6]">
            {subjectTitle} · {question.type} · Level {question.difficulty} of {totalQuestions}
          </p>
          <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#F8FAFC] tabular-nums">
            Your Virtual Examiner — Question {questionIndex + 1} of {totalQuestions}
          </h1>
        </div>

        {/* Optional Timer Control */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {secondsLeft !== null ? (
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-sm font-semibold tabular-nums ${
                isTimeUp
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                  : isLowTime
                  ? 'border-red-400/40 bg-red-500/15 text-red-200'
                  : 'border-white/12 bg-white/[0.04] text-[#F8FAFC]'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>{isTimeUp ? "Time's up" : formatClock(secondsLeft)}</span>
              <button
                type="button"
                onClick={() => onToggleTimer(null)}
                className="ml-1 text-[11px] font-sans font-medium text-slate-400 hover:text-white cursor-pointer"
                title="Disable timer"
              >
                Off
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onToggleTimer(60)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Enable 60s Timer</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Progress Bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#8B5CF6] to-[#14B8A6] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-7">
        {/* Virtual Examiner Stage */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Examiner Portrait */}
          <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:w-28 shrink-0">
            <div
              className={`relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-2 transition-colors duration-200 ${
                isSpeaking ? 'border-[#14B8A6] shadow-lg shadow-[#14B8A6]/20' : 'border-white/15'
              } bg-[#162135]`}
            >
              {!avatarError ? (
                <img
                  src="/src/assets/images/examiner_avatar_1795754349204.jpg"
                  alt="Virtual Viva Examiner portrait"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#162135] text-slate-300">
                  <UserRound className="h-9 w-9" />
                </div>
              )}
            </div>

            <div className="sm:text-center">
              <p className="text-xs font-semibold text-[#F8FAFC]">Viva Examiner</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{question.topic}</p>
              {isSpeaking && (
                <div
                  className="mt-2 flex items-center sm:justify-center gap-1 h-4"
                  aria-label="Examiner is speaking"
                >
                  {[0, 0.14, 0.28, 0.18, 0.08].map((delay, i) => (
                    <span
                      key={i}
                      className="voice-bar w-1 h-full rounded-full bg-[#14B8A6]"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Display & Voice Controls */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 mb-2">
              <span>{question.type} Question</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>
                {language === 'hindi'
                  ? 'हिन्दी'
                  : language === 'hinglish'
                  ? 'Hinglish'
                  : 'English'}
              </span>
            </div>

            <blockquote className="font-display text-xl sm:text-2xl font-semibold leading-snug text-[#F8FAFC] text-balance">
              “{question.question}”
            </blockquote>

            {/* Examiner Audio Controls */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {ttsSupported ? (
                <>
                  <button
                    type="button"
                    onClick={handlePlayQuestion}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] transition-colors hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/15 whitespace-nowrap cursor-pointer min-h-[38px]"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="h-4 w-4 text-[#14B8A6]" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-[#14B8A6]" />
                        <span>Replay Question</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoSpeak((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer min-h-[38px] ${
                      autoSpeak
                        ? 'border-white/12 bg-white/[0.04] text-slate-200'
                        : 'border-white/10 bg-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Auto-Read: {autoSpeak ? 'On' : 'Off'}</span>
                  </button>

                  {voiceNote && (
                    <span className="text-[11px] text-slate-500 truncate max-w-[240px]">
                      {voiceNote}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-slate-400">
                  Voice playback is unavailable in this browser. Read the question above.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.08]" />

        {/* Student Answer Panel (Type or Speak) */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label htmlFor="student-answer-input" className="text-sm font-semibold text-[#F8FAFC]">
                Your Answer
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Type below or use your microphone — answer in English, Hindi, or Hinglish.
              </p>
            </div>

            {/* Speech-to-Text Controls */}
            {sttSupported && (
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex rounded-xl border border-white/12 bg-[#101827]/70 p-0.5"
                  role="group"
                  aria-label="Speech recognition language"
                >
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => handleSwitchSpeechLang('en-IN')}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      speechLang === 'en-IN'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    en-IN
                  </button>
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={() => handleSwitchSpeechLang('hi-IN')}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      speechLang === 'hi-IN'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    hi-IN
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={toggleRecording}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer min-h-[40px] ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600'
                      : 'border border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14B8A6] hover:bg-[#14B8A6]/25'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      <span>Stop Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>Speak Answer</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {!sttSupported && (
            <p className="text-xs text-slate-400">
              Voice-to-text requires Chrome, Edge, or Safari. You can type your answer below.
            </p>
          )}

          {isRecording && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-100">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="font-medium">
                  Listening ({speechLang === 'hi-IN' ? 'Hindi · hi-IN' : 'Indian English · en-IN'})...
                </span>
              </div>
              {interimTranscript && (
                <span className="truncate text-red-200/80 italic max-w-[55%]">
                  “{interimTranscript}”
                </span>
              )}
            </div>
          )}

          {micError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
              <span>{micError}</span>
            </div>
          )}

          <textarea
            id="student-answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isEvaluating}
            rows={5}
            placeholder="Explain your answer concisely as you would in front of a viva examiner..."
            className="w-full rounded-2xl border border-white/12 bg-[#101827]/85 px-4 py-3.5 text-sm sm:text-base leading-relaxed text-[#F8FAFC] placeholder:text-slate-500 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-60 resize-y"
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={isEvaluating}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/25 hover:text-slate-100 disabled:opacity-40 whitespace-nowrap cursor-pointer min-h-[46px]"
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip Question</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating || fullDraft.length === 0}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap cursor-pointer min-h-[46px]"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
