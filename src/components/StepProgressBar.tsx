import { Check } from 'lucide-react';
import { VivaStep } from '../types/viva';

interface StepProgressBarProps {
  currentStep: VivaStep;
  currentQuestionIndex: number;
  totalQuestions: number;
  canNavigateTo: (step: VivaStep) => boolean;
  onSelectStep: (step: VivaStep) => void;
}

const FLOW_STEPS: Array<{ id: VivaStep; label: string; shortLabel: string; number: number }> = [
  { id: 'material', label: 'Study Material', shortLabel: 'Notes', number: 1 },
  { id: 'language', label: 'Language', shortLabel: 'Language', number: 2 },
  { id: 'examiner', label: 'Virtual Examiner', shortLabel: 'Viva', number: 3 },
  { id: 'feedback', label: 'Answer Feedback', shortLabel: 'Feedback', number: 4 },
  { id: 'report', label: 'Final Report', shortLabel: 'Report', number: 5 },
];

const STEP_ORDER: Record<VivaStep, number> = {
  landing: 0,
  material: 1,
  language: 2,
  examiner: 3,
  feedback: 4,
  report: 5,
};

export function StepProgressBar({
  currentStep,
  currentQuestionIndex,
  totalQuestions,
  canNavigateTo,
  onSelectStep,
}: StepProgressBarProps) {
  const activeRank = STEP_ORDER[currentStep];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-2 sm:px-6">
      <nav aria-label="Viva progress" className="w-full">
        <ol className="flex items-center justify-between gap-2">
          {FLOW_STEPS.map((item, idx) => {
            const rank = STEP_ORDER[item.id];
            const isCompleted = activeRank > rank;
            const isCurrent = activeRank === rank;
            const isClickable = canNavigateTo(item.id);

            return (
              <li key={item.id} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onSelectStep(item.id)}
                  className={`group flex items-center gap-2.5 text-left transition-colors ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#14B8A6] text-[#101827]'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/25'
                        : 'border border-white/15 bg-white/[0.03] text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : item.number}
                  </span>
                  <div className="hidden sm:block">
                    <div
                      className={`text-xs font-medium whitespace-nowrap transition-colors ${
                        isCurrent
                          ? 'text-[#F8FAFC]'
                          : isCompleted
                          ? 'text-slate-300 group-hover:text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </div>
                    {isCurrent && (item.id === 'examiner' || item.id === 'feedback') && totalQuestions > 0 && (
                      <div className="text-[11px] text-[#14B8A6] tabular-nums whitespace-nowrap">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </div>
                    )}
                  </div>
                  <span
                    className={`sm:hidden text-[11px] font-medium whitespace-nowrap ${
                      isCurrent ? 'text-[#F8FAFC]' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.shortLabel}
                  </span>
                </button>

                {idx < FLOW_STEPS.length - 1 && (
                  <div
                    className="mx-2 sm:mx-3 h-[2px] flex-1 rounded-full bg-white/10 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        activeRank > rank
                          ? 'w-full bg-gradient-to-r from-[#14B8A6] to-[#2563EB]'
                          : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
