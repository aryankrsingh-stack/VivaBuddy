import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  FilePlus2,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { EvaluatedEntry, ReportInsights, VivaLanguage } from '../types/viva';

interface FinalReportStepProps {
  subjectTitle: string;
  language: VivaLanguage;
  entries: EvaluatedEntry[];
  insights: ReportInsights | null;
  isLoadingInsights: boolean;
  insightsError: string | null;
  onPracticeSameNotes: () => void;
  onNewNotes: () => void;
}

export function FinalReportStep({
  subjectTitle,
  language,
  entries,
  insights,
  isLoadingInsights,
  insightsError,
  onPracticeSameNotes,
  onNewNotes,
}: FinalReportStepProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Strictly real calculations from actual evaluated entries (zero hardcoded or simulated data)
  const count = entries.length;
  const totalScore = entries.reduce((sum, e) => sum + e.evaluation.score, 0);
  const maxPossible = count * 10;
  const overallAvg = count > 0 ? totalScore / count : 0;
  const overallPercent = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  const passingCount = entries.filter((e) => e.evaluation.score >= 7).length;
  const accuracyPercent = count > 0 ? Math.round((passingCount / count) * 100) : 0;

  const conceptAvg =
    count > 0
      ? entries.reduce((sum, e) => sum + e.evaluation.conceptScore, 0) / count
      : 0;

  const clarityAvg =
    count > 0
      ? entries.reduce((sum, e) => sum + e.evaluation.clarityScore, 0) / count
      : 0;

  const incorrectOrWeakEntries = entries.filter((e) => e.evaluation.score < 7);

  // Deterministic real fallback for strengths/revision if summary call fails
  const fallbackStrengths = entries
    .filter((e) => e.evaluation.score >= 7)
    .map((e) => `Strong response on ${e.question.topic} (${e.evaluation.score}/10)`);

  const fallbackTopics = incorrectOrWeakEntries.map((e) => ({
    topic: e.question.topic,
    reason:
      e.evaluation.whatWasMissed[0] ||
      `Scored ${e.evaluation.score}/10 — review the expected explanation from your notes.`,
  }));

  const displayedStrengths =
    insights && insights.strengths.length > 0
      ? insights.strengths
      : fallbackStrengths.length > 0
      ? fallbackStrengths
      : ['Completed all 5 viva questions and identified clear focus areas for revision.'];

  const displayedTopicsToRevise =
    insights && insights.topicsToRevise.length > 0
      ? insights.topicsToRevise
      : fallbackTopics;

  // Circular progress ring geometry
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - overallPercent / 100);

  const readinessLabel =
    overallPercent >= 80
      ? 'Viva Ready'
      : overallPercent >= 65
      ? 'Solid Foundation'
      : overallPercent >= 40
      ? 'Needs Targeted Revision'
      : 'Review Notes Before Viva';

  const handleDownloadReport = () => {
    const lines: string[] = [
      `VIVABUDDY PERFORMANCE REPORT`,
      `============================`,
      `Subject: ${subjectTitle}`,
      `Examiner Language: ${language}`,
      `Date: ${new Date().toLocaleString()}`,
      ``,
      `OVERALL METRICS (REAL EVALUATION RESULTS)`,
      `Overall Score: ${overallAvg.toFixed(1)} / 10 (${overallPercent}%) — ${readinessLabel}`,
      `Accuracy (7+/10): ${accuracyPercent}% (${passingCount} of ${count} questions)`,
      `Concept Understanding: ${conceptAvg.toFixed(1)} / 10`,
      `Communication & Clarity: ${clarityAvg.toFixed(1)} / 10`,
      ``,
      `STRENGTHS`,
      ...displayedStrengths.map((s) => `- ${s}`),
      ``,
      `TOPICS TO REVISE`,
      ...(displayedTopicsToRevise.length > 0
        ? displayedTopicsToRevise.map((t) => `- ${t.topic}: ${t.reason}`)
        : ['- None — all answers scored strongly!']),
      ``,
      `QUESTION-BY-QUESTION BREAKDOWN`,
      ...entries.flatMap((entry, idx) => [
        ``,
        `Q${idx + 1} [${entry.question.type} · ${entry.question.topic}] — Score: ${entry.evaluation.score}/10 (Concept: ${entry.evaluation.conceptScore}/10, Clarity: ${entry.evaluation.clarityScore}/10)`,
        `Question: ${entry.question.question}`,
        `Your Answer: ${entry.skipped ? '[Skipped]' : entry.studentAnswer}`,
        `Expected Explanation: ${entry.evaluation.modelExplanation}`,
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VivaBuddy-Report-${subjectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 pb-20 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#14B8A6]">
            Final Viva Report · {subjectTitle} · {count} Questions Evaluated
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-4xl font-bold text-[#F8FAFC]">
            Your Viva Performance Summary
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.09] hover:text-white whitespace-nowrap cursor-pointer min-h-[42px]"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Primary Score & Metrics Hero Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Circular Overall Score Indicator */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="rgba(248, 250, 252, 0.08)"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeOffset }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="55%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-[#F8FAFC] tabular-nums">
                  {overallAvg.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  out of 10 ({overallPercent}%)
                </span>
              </div>
            </div>
            <p className="mt-3 font-display text-base font-semibold text-[#14B8A6]">
              {readinessLabel}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
              Total Marks: {totalScore} / {maxPossible}
            </p>
          </div>

          {/* 3 Real KPI Metrics + Summary */}
          <div className="lg:col-span-8 space-y-6 lg:border-l lg:border-white/[0.08] lg:pl-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-400">Accuracy (7+ / 10)</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#14B8A6] tabular-nums">
                  {accuracyPercent}%
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  {passingCount} of {count} strong answers
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-400">Concept Understanding</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#2563EB] tabular-nums">
                  {conceptAvg.toFixed(1)}
                  <span className="text-base font-medium text-slate-400"> / 10</span>
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{ width: `${Math.round(conceptAvg * 10)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-400">Communication</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#8B5CF6] tabular-nums">
                  {clarityAvg.toFixed(1)}
                  <span className="text-base font-medium text-slate-400"> / 10</span>
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#8B5CF6]"
                    style={{ width: `${Math.round(clarityAvg * 10)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-5">
              {isLoadingInsights ? (
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-[#14B8A6]" />
                  <span>Synthesizing personalized viva insights from your answers...</span>
                </div>
              ) : (
                <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                  {insights?.overallSummary ||
                    `You scored ${totalScore} out of ${maxPossible} across ${count} progressive questions, with ${passingCount} answers reaching 7 or higher.`}
                </p>
              )}
              {insightsError && (
                <p className="mt-2 text-xs text-amber-300">
                  Showing direct metrics from your evaluations ({insightsError}).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Topics to Revise */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[#14B8A6]" />
            <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">Your Strengths</h2>
          </div>

          <ul className="space-y-3 text-sm text-slate-200 leading-relaxed">
            {displayedStrengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#14B8A6] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#8B5CF6]" />
            <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">Topics to Revise</h2>
          </div>

          {displayedTopicsToRevise.length > 0 ? (
            <ul className="space-y-3.5 text-sm">
              {displayedTopicsToRevise.map((item, idx) => (
                <li
                  key={idx}
                  className="border-b border-white/[0.06] pb-3 last:border-b-0 last:pb-0"
                >
                  <p className="font-semibold text-[#F8FAFC]">{item.topic}</p>
                  <p className="mt-1 text-slate-400 leading-relaxed">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">
              Great job—you demonstrated solid mastery across every tested topic in your notes.
            </p>
          )}
        </div>
      </div>

      {/* Score Per Question Breakdown */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-[#F8FAFC]">
            Score Per Question
          </h2>
          <span className="text-xs text-slate-400">
            Click any question to expand your answer and the expected explanation
          </span>
        </div>

        <div className="divide-y divide-white/[0.08]">
          {entries.map((entry, idx) => {
            const isOpen = expandedId === entry.question.id;
            const score = entry.evaluation.score;
            const scoreColor =
              score >= 7
                ? 'text-[#14B8A6]'
                : score >= 4
                ? 'text-amber-300'
                : 'text-red-300';
            const barColor =
              score >= 7
                ? 'bg-[#14B8A6]'
                : score >= 4
                ? 'bg-amber-400'
                : 'bg-red-400';

            return (
              <div key={entry.question.id} className="py-4 first:pt-1 last:pb-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : entry.question.id)}
                  className="w-full text-left flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs text-slate-400">
                      <span>Q{idx + 1}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{entry.question.type}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{entry.question.topic}</span>
                    </div>
                    <p className="mt-1 text-sm sm:text-base font-medium text-[#F8FAFC] group-hover:text-white">
                      {entry.question.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 hidden sm:block">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </div>
                    <span className={`font-mono text-base font-bold tabular-nums w-12 text-right ${scoreColor}`}>
                      {score}/10
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 text-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 tabular-nums">
                      <span>Concept: {entry.evaluation.conceptScore}/10</span>
                      <span>·</span>
                      <span>Clarity: {entry.evaluation.clarityScore}/10</span>
                      {entry.skipped && (
                        <>
                          <span>·</span>
                          <span className="text-amber-300">Skipped</span>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">Your Answer</p>
                      <p className="mt-1 text-slate-200 leading-relaxed">
                        {entry.skipped ? 'You skipped this question.' : entry.studentAnswer}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#14B8A6]">Expected Answer (From Notes)</p>
                      <p className="mt-1 text-slate-300 leading-relaxed">
                        {entry.evaluation.modelExplanation}
                      </p>
                    </div>
                    {entry.followUpAnswer && entry.followUpEvaluation && (
                      <div>
                        <p className="text-xs font-medium text-[#8B5CF6]">Follow-up Reply</p>
                        <p className="mt-1 text-slate-300">{entry.followUpAnswer}</p>
                        <p className="mt-1 text-xs text-slate-400">{entry.followUpEvaluation.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Incorrect / Low-Scoring Answers with Explanations */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <h2 className="font-display text-xl font-semibold text-[#F8FAFC]">
            Answers to Review (Scored Below 7/10)
          </h2>
        </div>

        {incorrectOrWeakEntries.length > 0 ? (
          <div className="divide-y divide-white/[0.08]">
            {incorrectOrWeakEntries.map((entry) => (
              <div key={entry.question.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-base font-semibold text-[#F8FAFC]">
                    Q{entry.question.id}. {entry.question.question}
                  </p>
                  <span className="font-mono text-xs font-semibold text-amber-300 tabular-nums">
                    Scored {entry.evaluation.score}/10 · {entry.question.topic}
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  <span className="font-medium text-slate-300">Your answer:</span>{' '}
                  {entry.skipped ? 'Skipped' : entry.studentAnswer}
                </p>

                {entry.evaluation.whatWasMissed.length > 0 && (
                  <p className="text-sm text-amber-200/90">
                    <span className="font-medium text-amber-300">What was missed:</span>{' '}
                    {entry.evaluation.whatWasMissed.join(' ')}
                  </p>
                )}

                <p className="text-sm text-slate-200 leading-relaxed">
                  <span className="font-medium text-[#14B8A6]">Explanation from your notes:</span>{' '}
                  {entry.evaluation.modelExplanation}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-[#14B8A6]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              All {count} answers scored 7/10 or higher. No incorrect answers to remediate!
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <button
          type="button"
          onClick={onNewNotes}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.09] hover:text-white whitespace-nowrap cursor-pointer min-h-[48px]"
        >
          <FilePlus2 className="h-4 w-4" />
          <span>Upload Different Notes</span>
        </button>

        <button
          type="button"
          onClick={onPracticeSameNotes}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] whitespace-nowrap cursor-pointer min-h-[48px]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Practice Again With Same Notes</span>
        </button>
      </div>
    </motion.section>
  );
}
