import { VivaStep } from '../types/viva';

interface TopBarProps {
  step: VivaStep;
  onGoHome: () => void;
  onStartViva: () => void;
  onNavigateSection: (sectionId: string) => void;
  onResetSession: () => void;
}

export function TopBar({
  step,
  onGoHome,
  onStartViva,
  onNavigateSection,
  onResetSession,
}: TopBarProps) {
  const isLanding = step === 'landing';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#101827]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="font-display text-xl font-bold tracking-tight text-[#F8FAFC] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Viva<span className="text-[#14B8A6]">Buddy</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        {isLanding ? (
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <button
              type="button"
              onClick={() => onNavigateSection('features')}
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('how-it-works')}
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('subjects')}
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Subjects
            </button>
            <button
              type="button"
              onClick={onStartViva}
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Demo Notes
            </button>
          </nav>
        ) : (
          <nav
            aria-label="Session navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Home
            </button>
            <span className="text-slate-600" aria-hidden="true">
              /
            </span>
            <span className="text-slate-200 whitespace-nowrap shrink-0">
              {step === 'material' && 'Study Material'}
              {step === 'language' && 'Viva Language'}
              {step === 'examiner' && 'Virtual Examiner'}
              {step === 'feedback' && 'Answer Review'}
              {step === 'report' && 'Performance Report'}
            </span>
          </nav>
        )}

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          {isLanding ? (
            <button
              type="button"
              onClick={onStartViva}
              className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1D4ED8] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              Start Your Viva
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetSession}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:bg-white/[0.09] hover:text-white whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              New Session
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
