/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  DemoSubject,
  EvaluatedEntry,
  ReportInsights,
  UploadedFileMeta,
  VivaLanguage,
  VivaQuestion,
  VivaStep,
} from './types/viva';
import { countWords } from './utils/pdfExtractor';
import { stopSpeaking } from './utils/speech';
import {
  evaluateFollowUpAnswer,
  evaluateVivaAnswer,
  generateReportInsights,
  generateVivaQuestions,
} from './services/vivaApi';
import { TopBar } from './components/TopBar';
import { StepProgressBar } from './components/StepProgressBar';
import { LandingView } from './components/LandingView';
import { StudyMaterialStep } from './components/StudyMaterialStep';
import { LanguageStep } from './components/LanguageStep';
import { ExaminerStep } from './components/ExaminerStep';
import { FeedbackStep } from './components/FeedbackStep';
import { FinalReportStep } from './components/FinalReportStep';

export default function App() {
  const [step, setStep] = useState<VivaStep>('landing');

  // Study Material state
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  // Language & Session configuration
  const [language, setLanguage] = useState<VivaLanguage>('english');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(60);

  // Examiner session state
  const [subjectTitle, setSubjectTitle] = useState('Study Notes Viva');
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [entries, setEntries] = useState<EvaluatedEntry[]>([]);

  // Async loading & error states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const [isEvaluatingFollowUp, setIsEvaluatingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const [reportInsights, setReportInsights] = useState<ReportInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    stopSpeaking();
    setStep('landing');
    scrollToTop();
  };

  const handleNavigateSection = (sectionId: string) => {
    if (step !== 'landing') {
      setStep('landing');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartViva = () => {
    stopSpeaking();
    setStep('material');
    scrollToTop();
  };

  const handleStartWithDemo = (subject: DemoSubject) => {
    stopSpeaking();
    setNotes(subject.notes);
    setUploadedFile(null);
    setActiveDemoId(subject.id);
    setStep('material');
    scrollToTop();
  };

  const handleResetSession = () => {
    stopSpeaking();
    setNotes('');
    setUploadedFile(null);
    setActiveDemoId(null);
    setQuestions([]);
    setEntries([]);
    setCurrentQuestionIndex(0);
    setGenerationError(null);
    setEvaluationError(null);
    setFollowUpError(null);
    setReportInsights(null);
    setInsightsError(null);
    setStep('material');
    scrollToTop();
  };

  const handleSelectDemo = (subject: DemoSubject) => {
    setNotes(subject.notes);
    setUploadedFile(null);
    setActiveDemoId(subject.id);
  };

  const handleFileExtracted = (text: string, meta: UploadedFileMeta) => {
    setNotes(text);
    setUploadedFile(meta);
    setActiveDemoId(null);
  };

  const handleRemoveFile = () => {
    setNotes('');
    setUploadedFile(null);
    setActiveDemoId(null);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    if (activeDemoId) {
      setActiveDemoId(null);
    }
  };

  const handleGenerateQuestions = async () => {
    setGenerationError(null);
    setIsGeneratingQuestions(true);

    try {
      const result = await generateVivaQuestions(notes, language);
      setSubjectTitle(result.subjectTitle);
      setQuestions(result.questions);
      setEntries([]);
      setCurrentQuestionIndex(0);
      setEvaluationError(null);
      setFollowUpError(null);
      setReportInsights(null);
      setInsightsError(null);
      setStep('examiner');
      scrollToTop();
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Unable to generate questions. Please try again.'
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSubmitAnswer = async (
    studentAnswer: string,
    skipped: boolean,
    timeSpentSeconds: number
  ) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setEvaluationError(null);
    setIsEvaluatingAnswer(true);

    try {
      const evaluation = await evaluateVivaAnswer({
        notes,
        language,
        question: currentQ,
        studentAnswer,
        skipped,
      });

      const newEntry: EvaluatedEntry = {
        question: currentQ,
        studentAnswer,
        skipped,
        evaluation,
        timeSpentSeconds,
      };

      setEntries((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = newEntry;
        return next;
      });
      setFollowUpError(null);
      setStep('feedback');
      scrollToTop();
    } catch (err) {
      setEvaluationError(
        err instanceof Error ? err.message : 'Could not evaluate your answer. Please try again.'
      );
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  const handleSubmitFollowUp = async (followUpAnswer: string) => {
    const currentEntry = entries[currentQuestionIndex];
    if (!currentEntry) return;

    setFollowUpError(null);
    setIsEvaluatingFollowUp(true);

    try {
      const followUpEval = await evaluateFollowUpAnswer({
        notes,
        language,
        originalQuestion: currentEntry.question.question,
        followUpQuestion: currentEntry.evaluation.followUpQuestion,
        followUpAnswer,
      });

      setEntries((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = {
          ...currentEntry,
          followUpAnswer,
          followUpEvaluation: followUpEval,
        };
        return next;
      });
    } catch (err) {
      setFollowUpError(
        err instanceof Error ? err.message : 'Could not evaluate your follow-up reply.'
      );
    } finally {
      setIsEvaluatingFollowUp(false);
    }
  };

  const handleNextAfterFeedback = async () => {
    stopSpeaking();
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setEvaluationError(null);
      setFollowUpError(null);
      setStep('examiner');
      scrollToTop();
      return;
    }

    // Move to Final Report and synthesize insights from ONLY real evaluated entries
    setStep('report');
    scrollToTop();
    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      const insights = await generateReportInsights({
        notes,
        language,
        entries,
      });
      setReportInsights(insights);
    } catch (err) {
      setInsightsError(
        err instanceof Error ? err.message : 'Summary insights could not be loaded.'
      );
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handlePracticeSameNotes = () => {
    stopSpeaking();
    setQuestions([]);
    setEntries([]);
    setCurrentQuestionIndex(0);
    setReportInsights(null);
    setInsightsError(null);
    setGenerationError(null);
    setStep('language');
    scrollToTop();
  };

  const canNavigateToStep = (target: VivaStep): boolean => {
    if (isGeneratingQuestions || isEvaluatingAnswer || isEvaluatingFollowUp) return false;
    if (target === 'material') return step === 'language';
    if (target === 'language') return step === 'material' && notes.trim().length >= 40;
    return false;
  };

  const handleSelectStepFromBar = (target: VivaStep) => {
    if (!canNavigateToStep(target)) return;
    stopSpeaking();
    setStep(target);
    scrollToTop();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentEntry = entries[currentQuestionIndex];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#101827] text-[#F8FAFC] overflow-x-clip">
      {/* Subtle Animated Ambient Gradient Background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="ambient-orb-primary absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(37, 99, 235, 0.34) 0%, rgba(139, 92, 246, 0.16) 50%, transparent 72%)',
          }}
        />
        <div
          className="ambient-orb-secondary absolute top-1/3 -right-28 h-[500px] w-[500px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(20, 184, 166, 0.24) 0%, rgba(37, 99, 235, 0.14) 55%, transparent 72%)',
          }}
        />
        <div
          className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full blur-[140px] opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Persistent 3-Zone Top Bar */}
      <TopBar
        step={step}
        onGoHome={handleGoHome}
        onStartViva={handleStartViva}
        onNavigateSection={handleNavigateSection}
        onResetSession={handleResetSession}
      />

      {/* Slideshow Progress Stepper (visible across steps 2-7) */}
      {step !== 'landing' && (
        <StepProgressBar
          currentStep={step}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length || 5}
          canNavigateTo={canNavigateToStep}
          onSelectStep={handleSelectStepFromBar}
        />
      )}

      {/* Main Active Slide */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <LandingView
              key="landing"
              onStartViva={handleStartViva}
              onStartWithDemo={handleStartWithDemo}
            />
          )}

          {step === 'material' && (
            <StudyMaterialStep
              key="material"
              notes={notes}
              uploadedFile={uploadedFile}
              activeDemoId={activeDemoId}
              onChangeNotes={handleNotesChange}
              onFileExtracted={handleFileExtracted}
              onRemoveFile={handleRemoveFile}
              onSelectDemo={handleSelectDemo}
              onBack={handleGoHome}
              onContinue={() => {
                setGenerationError(null);
                setStep('language');
                scrollToTop();
              }}
            />
          )}

          {step === 'language' && (
            <LanguageStep
              key="language"
              selectedLanguage={language}
              timerSeconds={timerSeconds}
              wordCount={countWords(notes)}
              isGenerating={isGeneratingQuestions}
              error={generationError}
              onSelectLanguage={setLanguage}
              onSelectTimer={setTimerSeconds}
              onBack={() => {
                setStep('material');
                scrollToTop();
              }}
              onStartExaminer={handleGenerateQuestions}
            />
          )}

          {step === 'examiner' && currentQuestion && (
            <ExaminerStep
              key={`examiner-${currentQuestion.id}`}
              subjectTitle={subjectTitle}
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              language={language}
              timerSeconds={timerSeconds}
              isEvaluating={isEvaluatingAnswer}
              error={evaluationError}
              onToggleTimer={setTimerSeconds}
              onSubmitAnswer={handleSubmitAnswer}
            />
          )}

          {step === 'feedback' && currentEntry && (
            <FeedbackStep
              key={`feedback-${currentEntry.question.id}`}
              entry={currentEntry}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              language={language}
              isEvaluatingFollowUp={isEvaluatingFollowUp}
              followUpError={followUpError}
              onSubmitFollowUp={handleSubmitFollowUp}
              onNext={handleNextAfterFeedback}
            />
          )}

          {step === 'report' && (
            <FinalReportStep
              key="report"
              subjectTitle={subjectTitle}
              language={language}
              entries={entries}
              insights={reportInsights}
              isLoadingInsights={isLoadingInsights}
              insightsError={insightsError}
              onPracticeSameNotes={handlePracticeSameNotes}
              onNewNotes={handleResetSession}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p className="font-medium text-slate-400">
            VivaBuddy · Your Personal Viva Practice Partner
          </p>
          <p>Viva ka darr, ab hoga Choomantarrr!</p>
        </div>
      </footer>
    </div>
  );
}
