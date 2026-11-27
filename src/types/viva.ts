export type VivaLanguage = 'english' | 'hindi' | 'hinglish';

export type VivaStep =
  | 'landing'
  | 'material'
  | 'language'
  | 'examiner'
  | 'feedback'
  | 'report';

export type QuestionType =
  | 'Definition'
  | 'Why / How'
  | 'Formula'
  | 'Application'
  | 'What-if';

export interface VivaQuestion {
  id: number;
  type: QuestionType | string;
  difficulty: number;
  topic: string;
  question: string;
  expectedPoints: string[];
}

export interface AnswerEvaluation {
  score: number;
  conceptScore: number;
  clarityScore: number;
  whatWasRight: string[];
  whatWasMissed: string[];
  modelExplanation: string;
  followUpQuestion: string;
  examinerRemark: string;
}

export interface FollowUpEvaluation {
  isStrong: boolean;
  feedback: string;
  keyTakeaway: string;
}

export interface EvaluatedEntry {
  question: VivaQuestion;
  studentAnswer: string;
  skipped: boolean;
  evaluation: AnswerEvaluation;
  followUpAnswer?: string;
  followUpEvaluation?: FollowUpEvaluation;
  timeSpentSeconds?: number;
}

export interface ReportTopicToRevise {
  topic: string;
  reason: string;
}

export interface ReportInsights {
  overallSummary: string;
  strengths: string[];
  topicsToRevise: ReportTopicToRevise[];
}

export interface UploadedFileMeta {
  name: string;
  sizeBytes: number;
  type: 'pdf' | 'txt';
  pageCount?: number;
  wordCount: number;
}

export interface DemoSubject {
  id: 'physics' | 'electrical' | 'chemistry' | 'dbms';
  label: string;
  subtitle: string;
  notes: string;
}
