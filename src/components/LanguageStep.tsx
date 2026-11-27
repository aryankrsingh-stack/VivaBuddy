import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  Check,
  Volume2,
} from 'lucide-react';
import { VivaLanguage } from '../types/viva';

interface LanguageStepProps {
  selectedLanguage: VivaLanguage;
  timerSeconds: number | null;
  wordCount: number;
  isGenerating: boolean;
  error: string | null;
  onSelectLanguage: (lang: VivaLanguage) => void;
  onSelectTimer: (seconds: number | null) => void;
  onBack: () => void;
  onStartExaminer: () => void;
}

const LANGUAGE_OPTIONS: Array<{
  id: VivaLanguage;
  name: string;
  voiceLabel: string;
  description: string;
  sampleQuestion: string;
}> = [
  {
    id: 'english',
    name: 'English',
    voiceLabel: 'Indian English · en-IN',
    description: 'Formal Indian university viva style in clear academic English.',
    sampleQuestion: '“What does Faraday’s second law state about induced EMF?”',
  },
  {
    id: 'hindi',
    name: 'हिन्दी',
    voiceLabel: 'Indian Hindi · hi-IN',
    description: 'Questions and feedback in natural academic Hindi (Devanagari script).',
    sampleQuestion: '“फैराडे के दूसरे नियम के अनुसार प्रेरित EMF किस पर निर्भर करता है?”',
  },
  {
    id: 'hinglish',
    name: 'Hinglish',
    voiceLabel: 'Indian English · en-IN',
    description: 'Everyday college classroom mix of Hindi and English in Roman script.',
    sampleQuestion: '“Lenz’s law mein negative sign kyun aata hai? Short mein batao.”',
  },
];

const TIMER_CHOICES: Array<{ label: string; value: number | null }> = [
  { label: 'No Timer', value: null },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
  { label: '90 sec', value: 90 },
];

export function LanguageStep({
  selectedLanguage,
  timerSeconds,
  wordCount,
  isGenerating,
  error,
  onSelectLanguage,
  onSelectTimer,
  onBack,
  onStartExaminer,
}: LanguageStepProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-[#14B8A6]">
          Step 2 of 5 · Viva Language · {wordCount.toLocaleString()} words loaded
        </p>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC] text-balance">
          Choose how your virtual examiner speaks
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400">
          Your examiner will ask questions and give feedback in your chosen language. You are always
          free to answer in English, Hindi, or Hinglish.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-7">
        {/* Language Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = selectedLanguage === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={isGenerating}
                onClick={() => onSelectLanguage(option.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                  isSelected
                    ? 'border-[#2563EB] bg-[#2563EB]/15 shadow-lg shadow-[#2563EB]/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl font-bold text-[#F8FAFC]">
                      {option.name}
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-white/20 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#14B8A6]">
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{option.voiceLabel}</span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {option.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-white/[0.08] pt-3.5">
                  <p className="text-[11px] font-medium text-slate-400">Sample examiner style</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {option.sampleQuestion}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Question Timer */}
        <div className="border-t border-white/[0.08] pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-[#8B5CF6]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F8FAFC]">Optional Per-Question Timer</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Simulate exam pacing or keep it untimed. You can toggle the timer anytime during the viva.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center rounded-xl border border-white/10 bg-[#101827]/70 p-1 shrink-0">
              {TIMER_CHOICES.map((choice) => {
                const active = timerSeconds === choice.value;
                return (
                  <button
                    key={choice.label}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onSelectTimer(choice.value)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-200"
          >
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-100">Could not prepare viva questions</p>
              <p className="mt-0.5 text-red-200/90">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Notice */}
        {isGenerating && (
          <div className="flex items-center gap-3.5 rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10 px-5 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#14B8A6] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">
                Preparing your 5 progressive viva questions...
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                Reading your study notes to craft Definition, Why/How, Formula, Application, and What-if questions.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40 whitespace-nowrap cursor-pointer min-h-[46px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Notes</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onStartExaminer}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap cursor-pointer min-h-[46px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing Examiner...</span>
              </>
            ) : (
              <>
                <span>Enter Viva Room</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
