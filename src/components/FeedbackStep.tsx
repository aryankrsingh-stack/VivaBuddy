import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { EvaluatedEntry, FollowUpEvaluation, VivaLanguage } from '../types/viva';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakExaminerText,
  SpeechRecognitionInstance,
  stopSpeaking,
} from '../utils/speech';

interface FeedbackStepProps {
  entry: EvaluatedEntry;
  questionIndex: number;
  totalQuestions: number;
  language: VivaLanguage;
  isEvaluatingFollowUp: boolean;
  followUpError: string | null;
  onSubmitFollowUp: (followUpAnswer: string) => void;
  onNext: () => void;
}

function getScoreRating(score: number, skipped: boolean): {
  label: string;
  colorClass: string;
  barClass: string;
} {
  if (skipped) {
    return { label: 'Skipped', colorClass: 'text-slate-400', barClass: 'bg-slate-500' };
  }
  if (score >= 8) {
    return { label: 'Strong Answer', colorClass: 'text-[#14B8A6]', barClass: 'bg-[#14B8A6]' };
  }
  if (score >= 7) {
    return { label: 'Good Answer', colorClass: 'text-[#2563EB]', barClass: 'bg-[#2563EB]' };
  }
  if (score >= 4) {
    return { label: 'Needs Refinement', colorClass: 'text-amber-300', barClass: 'bg-amber-400' };
  }
  return { label: 'Needs Revision', colorClass: 'text-red-300', barClass: 'bg-red-400' };
}

export function FeedbackStep({
  entry,
  questionIndex,
  totalQuestions,
  language,
  isEvaluatingFollowUp,
  followUpError,
  onSubmitFollowUp,
  onNext,
}: FeedbackStepProps) {
  const { question, evaluation, skipped, studentAnswer, followUpEvaluation } = entry;
  const rating = getScoreRating(evaluation.score, skipped);
  const isLastQuestion = questionIndex + 1 >= totalQuestions;

  const [followUpText, setFollowUpText] = useState(entry.followUpAnswer || '');
  const [isSpeakingFollowUp, setIsSpeakingFollowUp] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>(
    language === 'hindi' ? 'hi-IN' : 'en-IN'
  );
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const ttsSupported = isSpeechSynthesisSupported();
  const sttSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleSpeakFollowUp = () => {
    if (!ttsSupported || !evaluation.followUpQuestion) return;
    if (isSpeakingFollowUp) {
      stopSpeaking();
      setIsSpeakingFollowUp(false);
      return;
    }
    speakExaminerText(evaluation.followUpQuestion, language, {
      onStart: () => setIsSpeakingFollowUp(true),
      onEnd: () => setIsSpeakingFollowUp(false),
      onError: () => setIsSpeakingFollowUp(false),
    });
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    setMicError(null);
    if (isRecording) {
      stopRecording();
      return;
    }
    stopSpeaking();
    setIsSpeakingFollowUp(false);

    const recognizer = createSpeechRecognizer(speechLang, {
      onStart: () => setIsRecording(true),
      onEnd: () => setIsRecording(false),
      onFinalTranscript: (chunk) => {
        setFollowUpText((prev) => {
          const base = prev.trim();
          return base ? `${base} ${chunk}` : chunk;
        });
      },
      onInterimTranscript: () => {},
      onError: (msg) => {
        setMicError(msg);
        setIsRecording(false);
      },
    });

    if (!recognizer) {
      setMicError('Speech recognition is not supported in this browser.');
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch {
      setMicError('Could not start microphone.');
      setIsRecording(false);
    }
  };

  const handleFollowUpSubmit = () => {
    stopRecording();
    stopSpeaking();
    if (!followUpText.trim()) return;
    onSubmitFollowUp(followUpText.trim());
  };

  const handleProceed = () => {
    stopRecording();
    stopSpeaking();
    onNext();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#14B8A6]">
            Question {questionIndex + 1} of {totalQuestions} · {question.type} · {question.topic}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Examiner Feedback
          </h1>
        </div>
        <p className={`text-sm font-semibold ${rating.colorClass}`}>{rating.label}</p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-7">
        {/* Top Score Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5 flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/12 bg-[#101827]/85">
              <span className={`font-display text-3xl font-bold tabular-nums ${rating.colorClass}`}>
                {evaluation.score}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">out of 10</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Examiner Remark</p>
              <p className="mt-1 text-sm leading-relaxed text-[#F8FAFC]">
                {evaluation.examinerRemark || 'Review the breakdown below before moving ahead.'}
              </p>
            </div>
          </div>

          {/* Sub-scores: Concept Understanding & Clarity */}
          <div className="md:col-span-7 space-y-4 md:border-l md:border-white/[0.08] md:pl-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Concept Understanding</span>
                <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                  {evaluation.conceptScore} / 10
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                  style={{ width: `${evaluation.conceptScore * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Clarity &amp; Communication</span>
                <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                  {evaluation.clarityScore} / 10
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
                  style={{ width: `${evaluation.clarityScore * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question & Student Answer Recap */}
        <div className="border-t border-white/[0.08] pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-400">Question Asked</p>
            <p className="mt-1 text-sm font-medium text-[#F8FAFC] leading-relaxed">
              “{question.question}”
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Your Response</p>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              {skipped ? 'Skipped this question.' : studentAnswer}
            </p>
          </div>
        </div>

        {/* What Was Right vs What Was Missed */}
        <div className="border-t border-white/[0.08] pt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#14B8A6]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>What You Got Right</span>
            </div>
            {evaluation.whatWasRight.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-200 leading-relaxed">
                {evaluation.whatWasRight.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#14B8A6] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                {skipped
                  ? 'No answer submitted for this question.'
                  : 'Key points from the notes were not clearly covered yet.'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>What Was Missed</span>
            </div>
            {evaluation.whatWasMissed.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-200 leading-relaxed">
                {evaluation.whatWasMissed.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-300">
                Nothing major missed—your explanation aligned accurately with the notes.
              </p>
            )}
          </div>
        </div>

        {/* Reference Explanation from Notes */}
        {evaluation.modelExplanation && (
          <div className="border-t border-white/[0.08] pt-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Expected Viva Answer (From Your Notes)</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{evaluation.modelExplanation}</p>
          </div>
        )}

        {/* Follow-up Question Section */}
        {evaluation.followUpQuestion && (
          <div className="border-t border-white/[0.08] pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#8B5CF6]">
                <MessageSquare className="h-4 w-4" />
                <span>Optional Follow-Up Question</span>
              </div>

              {ttsSupported && (
                <button
                  type="button"
                  onClick={handleSpeakFollowUp}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {isSpeakingFollowUp ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 text-[#14B8A6]" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-[#14B8A6]" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="font-display text-base sm:text-lg font-semibold text-[#F8FAFC]">
              “{evaluation.followUpQuestion}”
            </p>

            {!followUpEvaluation ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-400">
                    Answer this quick cross-question for extra practice, or skip straight to the next question.
                  </span>

                  {sttSupported && (
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg border border-white/10 bg-[#101827]/70 p-0.5">
                        <button
                          type="button"
                          onClick={() => setSpeechLang('en-IN')}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer ${
                            speechLang === 'en-IN' ? 'bg-white/15 text-white' : 'text-slate-400'
                          }`}
                        >
                          en-IN
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpeechLang('hi-IN')}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer ${
                            speechLang === 'hi-IN' ? 'bg-white/15 text-white' : 'text-slate-400'
                          }`}
                        >
                          hi-IN
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isEvaluatingFollowUp}
                        onClick={toggleRecording}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          isRecording
                            ? 'bg-red-500 text-white'
                            : 'border border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14B8A6] hover:bg-[#14B8A6]/25'
                        }`}
                      >
                        {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                        <span>{isRecording ? 'Stop' : 'Speak'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {micError && (
                  <p className="text-xs text-amber-300">{micError}</p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    disabled={isEvaluatingFollowUp}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && followUpText.trim() && !isEvaluatingFollowUp) {
                        handleFollowUpSubmit();
                      }
                    }}
                    placeholder="Type or speak your follow-up reply..."
                    className="flex-1 rounded-xl border border-white/12 bg-[#101827]/85 px-4 py-3 text-sm text-[#F8FAFC] placeholder:text-slate-500 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30"
                  />
                  <button
                    type="button"
                    disabled={isEvaluatingFollowUp || !followUpText.trim()}
                    onClick={handleFollowUpSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B5CF6]/30 disabled:opacity-40 whitespace-nowrap cursor-pointer min-h-[46px]"
                  >
                    {isEvaluatingFollowUp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Answer Follow-up</span>
                      </>
                    )}
                  </button>
                </div>

                {followUpError && (
                  <div className="flex items-start gap-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{followUpError}</span>
                  </div>
                )}
              </div>
            ) : (
              <FollowUpResultBanner evaluation={followUpEvaluation} answer={entry.followUpAnswer || ''} />
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex items-center justify-end border-t border-white/[0.08] pt-6">
          <button
            type="button"
            disabled={isEvaluatingFollowUp}
            onClick={handleProceed}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] disabled:opacity-50 whitespace-nowrap cursor-pointer min-h-[48px]"
          >
            <span>{isLastQuestion ? 'View Final Viva Report' : `Move to Question ${questionIndex + 2}`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function FollowUpResultBanner({
  evaluation,
  answer,
}: {
  evaluation: FollowUpEvaluation;
  answer: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 space-y-2 ${
        evaluation.isStrong
          ? 'border-[#14B8A6]/35 bg-[#14B8A6]/10'
          : 'border-amber-400/30 bg-amber-500/10'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
        {evaluation.isStrong ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-[#14B8A6]" />
            <span className="text-[#14B8A6]">Follow-up Handled Well</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <span className="text-amber-300">Follow-up Review</span>
          </>
        )}
      </div>
      <p className="text-xs text-slate-400">Your reply: “{answer}”</p>
      <p className="text-sm text-[#F8FAFC] leading-relaxed">{evaluation.feedback}</p>
      {evaluation.keyTakeaway && (
        <p className="text-xs text-slate-300 pt-1">
          <span className="font-semibold text-slate-200">Key takeaway:</span> {evaluation.keyTakeaway}
        </p>
      )}
    </div>
  );
}
