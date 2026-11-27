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

  const rawText = await response.text();
  let payload: Record<string, unknown> | null = null;

  if (rawText) {
    try {
      const parsed: unknown = JSON.parse(rawText);
      if (parsed && typeof parsed === 'object') {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string' && payload.error.trim()
        ? payload.error
        : `Request failed with status ${response.status}. Please try again.`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error(
      'Received an unexpected non-JSON response from the server. Please reload the page and try again.'
    );
  }

  return payload as T;
}

export async function generateVivaQuestions(
  notes: string,
  language: VivaLanguage
): Promise<{ subjectTitle: string; questions: VivaQuestion[] }> {
  const data = await postJson<{ subjectTitle?: unknown; questions?: unknown }>(
    '/api/viva/generate-questions',
    { notes, language }
  );

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error(
      'The examiner could not prepare questions from these notes. Please try again or add more detail.'
    );
  }

  const questions: VivaQuestion[] = data.questions
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((q, idx) => ({
      id: typeof q.id === 'number' ? q.id : idx + 1,
      type: typeof q.type === 'string' && q.type.trim() ? q.type.trim() : 'Concept',
      difficulty: typeof q.difficulty === 'number' ? q.difficulty : idx + 1,
      topic: typeof q.topic === 'string' && q.topic.trim() ? q.topic.trim() : 'Core Concept',
      question: typeof q.question === 'string' ? q.question.trim() : '',
      expectedPoints: Array.isArray(q.expectedPoints)
        ? q.expectedPoints.map(String).filter(Boolean)
        : [],
    }))
    .filter((q) => q.question.length > 0);

  if (questions.length === 0) {
    throw new Error('The examiner returned empty questions. Please try again.');
  }

  return {
    subjectTitle:
      typeof data.subjectTitle === 'string' && data.subjectTitle.trim()
        ? data.subjectTitle.trim()
        : 'Study Notes Viva',
    questions,
  };
}

export async function evaluateVivaAnswer(params: {
  notes: string;
  language: VivaLanguage;
  question: VivaQuestion;
  studentAnswer: string;
  skipped?: boolean;
}): Promise<AnswerEvaluation> {
  const data = await postJson<Record<string, unknown>>('/api/viva/evaluate-answer', {
    notes: params.notes,
    language: params.language,
    question: params.question.question,
    questionType: params.question.type,
    topic: params.question.topic,
    studentAnswer: params.studentAnswer,
    skipped: Boolean(params.skipped),
  });

  if (typeof data.score !== 'number') {
    throw new Error('Evaluation response was incomplete. Please submit your answer again.');
  }

  const clamp = (val: unknown) => Math.max(0, Math.min(10, Math.round(Number(val) || 0)));

  return {
    score: clamp(data.score),
    conceptScore: clamp(data.conceptScore),
    clarityScore: clamp(data.clarityScore),
    whatWasRight: Array.isArray(data.whatWasRight)
      ? data.whatWasRight.map(String).filter(Boolean)
      : [],
    whatWasMissed: Array.isArray(data.whatWasMissed)
      ? data.whatWasMissed.map(String).filter(Boolean)
      : [],
    modelExplanation: typeof data.modelExplanation === 'string' ? data.modelExplanation.trim() : '',
    followUpQuestion: typeof data.followUpQuestion === 'string' ? data.followUpQuestion.trim() : '',
    examinerRemark: typeof data.examinerRemark === 'string' ? data.examinerRemark.trim() : '',
  };
}

export async function evaluateFollowUpAnswer(params: {
  notes: string;
  language: VivaLanguage;
  originalQuestion: string;
  followUpQuestion: string;
  followUpAnswer: string;
}): Promise<FollowUpEvaluation> {
  const data = await postJson<Record<string, unknown>>('/api/viva/evaluate-followup', params);

  if (typeof data.feedback !== 'string' || !data.feedback.trim()) {
    throw new Error('Could not evaluate your follow-up answer. Please try again.');
  }

  return {
    isStrong: Boolean(data.isStrong),
    feedback: data.feedback.trim(),
    keyTakeaway: typeof data.keyTakeaway === 'string' ? data.keyTakeaway.trim() : '',
  };
}

export async function generateReportInsights(params: {
  notes: string;
  language: VivaLanguage;
  entries: EvaluatedEntry[];
}): Promise<ReportInsights> {
  const data = await postJson<Record<string, unknown>>('/api/viva/generate-report', {
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

  return {
    overallSummary: typeof data.overallSummary === 'string' ? data.overallSummary.trim() : '',
    strengths: Array.isArray(data.strengths)
      ? data.strengths.map(String).filter(Boolean)
      : [],
    topicsToRevise: Array.isArray(data.topicsToRevise)
      ? data.topicsToRevise
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((t) => ({
            topic: typeof t.topic === 'string' ? t.topic.trim() : '',
            reason: typeof t.reason === 'string' ? t.reason.trim() : '',
          }))
          .filter((t) => t.topic.length > 0)
      : [],
  };
}
