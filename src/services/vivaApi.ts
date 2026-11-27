import {
  AnswerEvaluation,
  EvaluatedEntry,
  FollowUpEvaluation,
  ReportInsights,
  VivaLanguage,
  VivaQuestion,
} from '../types/viva';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error
        : `Request failed with status ${response.status}. Please try again.`;
    throw new Error(message);
  }

  return payload as T;
}

export async function generateVivaQuestions(
  notes: string,
  language: VivaLanguage
): Promise<{ subjectTitle: string; questions: VivaQuestion[] }> {
  return postJson('/api/viva/generate-questions', { notes, language });
}

export async function evaluateVivaAnswer(params: {
  notes: string;
  language: VivaLanguage;
  question: VivaQuestion;
  studentAnswer: string;
  skipped?: boolean;
}): Promise<AnswerEvaluation> {
  return postJson('/api/viva/evaluate-answer', {
    notes: params.notes,
    language: params.language,
    question: params.question.question,
    questionType: params.question.type,
    topic: params.question.topic,
    studentAnswer: params.studentAnswer,
    skipped: Boolean(params.skipped),
  });
}

export async function evaluateFollowUpAnswer(params: {
  notes: string;
  language: VivaLanguage;
  originalQuestion: string;
  followUpQuestion: string;
  followUpAnswer: string;
}): Promise<FollowUpEvaluation> {
  return postJson('/api/viva/evaluate-followup', params);
}

export async function generateReportInsights(params: {
  notes: string;
  language: VivaLanguage;
  entries: EvaluatedEntry[];
}): Promise<ReportInsights> {
  return postJson('/api/viva/generate-report', {
    notes: params.notes,
    language: params.language,
    evaluations: params.entries.map((entry) => ({
      type: entry.question.type,
      topic: entry.question.topic,
      question: entry.question.question,
      studentAnswer: entry.skipped ? '' : entry.studentAnswer,
      score: entry.evaluation.score,
      conceptScore: entry.evaluation.conceptScore,
      clarityScore: entry.evaluation.clarityScore,
      whatWasRight: entry.evaluation.whatWasRight,
      whatWasMissed: entry.evaluation.whatWasMissed,
    })),
  });
}
