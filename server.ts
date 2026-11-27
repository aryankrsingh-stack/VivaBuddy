import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check your key in the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

type VivaLanguage = 'english' | 'hindi' | 'hinglish';

function getLanguageInstruction(language: VivaLanguage): string {
  switch (language) {
    case 'hindi':
      return 'Respond strictly in natural, clear academic Hindi written in Devanagari script (हिन्दी). Keep technical terms accurate (you may retain standard scientific symbols/terms in Devanagari or standard form where natural for Indian college vivas).';
    case 'hinglish':
      return 'Respond strictly in conversational Indian college Hinglish written in Latin/Roman script (a natural classroom blend of Hindi and English, e.g., "Ohm\'s law kya kehta hai aur iski condition kya hai?"). Do not use Devanagari script.';
    case 'english':
    default:
      return 'Respond strictly in crisp, clear Indian academic English suitable for a college viva examiner.';
  }
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 0;
      const isTransient = status === 500 || status === 503 || status === 504 || status === 0;
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : 'Unexpected server error.';
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : 500;

  if (status === 403 || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'API key authentication failed. Please verify GEMINI_API_KEY in the Settings > Secrets panel.',
    };
  }
  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Rate limit reached. Please wait a few seconds and try again.',
    };
  }
  if (rawMessage.includes('GEMINI_API_KEY is not configured')) {
    return {
      status: 500,
      message: rawMessage,
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: rawMessage || 'Could not reach the examiner service. Please try again.',
  };
}

function sanitizeNotes(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').trim().slice(0, 30000);
}

function parseLanguage(raw: unknown): VivaLanguage {
  if (raw === 'hindi' || raw === 'hinglish' || raw === 'english') {
    return raw;
  }
  return 'english';
}

function parseJsonSafe<T>(text: string | undefined, fallbackError: string): T {
  if (!text) {
    throw new Error(fallbackError);
  }
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(cleaned) as T;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Generate 5 progressive viva questions strictly from uploaded notes
  app.post('/api/viva/generate-questions', async (req: Request, res: Response) => {
    try {
      const notes = sanitizeNotes(req.body?.notes);
      const language = parseLanguage(req.body?.language);

      if (notes.length < 40) {
        return res.status(400).json({
          error: 'Please provide at least 40 characters of study notes so the examiner can prepare valid questions.',
        });
      }

      const ai = getGeminiClient();
      const langRule = getLanguageInstruction(language);

      const prompt = `
You are an experienced, fair Indian college viva examiner conducting a 5-question oral examination.

STRICT RULES:
1. Generate EXACTLY 5 questions grounded EXCLUSIVELY in the STUDY NOTES provided below. Do NOT introduce facts, equations, or concepts that are not present in the notes.
2. Each question MUST be short, crisp, and oral-friendly: MAXIMUM 20 WORDS per question. Count carefully and never exceed 20 words.
3. The 5 questions must follow this exact sequence of types and gently increasing difficulty (Level 1 easiest -> Level 5 most probing):
   - Question 1 (difficulty 1): type = "Definition" (ask for a core definition or fundamental concept from the notes)
   - Question 2 (difficulty 2): type = "Why / How" (ask why something happens or how a mechanism/process in the notes works)
   - Question 3 (difficulty 3): type = "Formula" (ask for a specific formula, law, equation, rule, or exact relationship explicitly present in the notes)
   - Question 4 (difficulty 4): type = "Application" (ask about a practical use, example, or application mentioned in the notes)
   - Question 5 (difficulty 5): type = "What-if" (ask a thought-provoking what-if or boundary scenario grounded directly in the rules/principles from the notes)
4. Language requirement for the "question" field: ${langRule}
5. Keep "topic" as a concise 2-4 word English topic label from the notes (for the student's English performance report).
6. Keep "expectedPoints" as 2-3 short key facts from the notes that a strong answer should cover.

STUDY NOTES:
"""
${notes}
"""
`;

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a precise college viva examiner. Always follow word limits, strict grounding in the supplied notes, and output valid JSON matching the schema.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subjectTitle: {
                  type: Type.STRING,
                  description: 'A short 2-5 word English title summarizing the study notes subject.',
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      type: {
                        type: Type.STRING,
                        description: 'One of: Definition, Why / How, Formula, Application, What-if',
                      },
                      difficulty: { type: Type.INTEGER },
                      topic: {
                        type: Type.STRING,
                        description: 'Short 2-4 word English topic label from the notes.',
                      },
                      question: {
                        type: Type.STRING,
                        description: 'Short viva question (maximum 20 words) in the requested language.',
                      },
                      expectedPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['id', 'type', 'difficulty', 'topic', 'question', 'expectedPoints'],
                  },
                },
              },
              required: ['subjectTitle', 'questions'],
            },
          },
        })
      );

      interface RawGenerated {
        subjectTitle: string;
        questions: Array<{
          id: number;
          type: string;
          difficulty: number;
          topic: string;
          question: string;
          expectedPoints: string[];
        }>;
      }

      const parsed = parseJsonSafe<RawGenerated>(
        response.text,
        'The examiner returned an empty response. Please try again.'
      );

      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Could not extract viva questions from these notes. Try adding more detailed study notes.');
      }

      const canonicalTypes = ['Definition', 'Why / How', 'Formula', 'Application', 'What-if'];
      const normalizedQuestions = parsed.questions.slice(0, 5).map((q, idx) => {
        const trimmedQ = String(q.question || '').trim();
        return {
          id: idx + 1,
          type: canonicalTypes[idx] || q.type || 'Definition',
          difficulty: idx + 1,
          topic: String(q.topic || 'Core Concept').trim(),
          question: trimmedQ,
          expectedPoints: Array.isArray(q.expectedPoints)
            ? q.expectedPoints.map((p) => String(p).trim()).filter(Boolean)
            : [],
        };
      });

      return res.json({
        subjectTitle: String(parsed.subjectTitle || 'Study Notes Viva').trim(),
        questions: normalizedQuestions,
      });
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Evaluate student's answer to a viva question
  app.post('/api/viva/evaluate-answer', async (req: Request, res: Response) => {
    try {
      const notes = sanitizeNotes(req.body?.notes);
      const language = parseLanguage(req.body?.language);
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      const questionType = typeof req.body?.questionType === 'string' ? req.body.questionType.trim() : 'Concept';
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : 'Topic';
      const studentAnswer = typeof req.body?.studentAnswer === 'string' ? req.body.studentAnswer.trim() : '';
      const skipped = Boolean(req.body?.skipped) || studentAnswer.length === 0;

      if (!notes || !question) {
        return res.status(400).json({ error: 'Missing notes or question for evaluation.' });
      }

      const ai = getGeminiClient();
      const langRule = getLanguageInstruction(language);

      const prompt = `
You are a fair, constructive Indian college viva examiner evaluating a student's oral/written answer.

CONTEXT:
- Question Type: ${questionType}
- Topic: ${topic}
- Examiner Question: "${question}"
- Student Answer (NOTE: the student is allowed to answer in English, Hindi, or Hinglish—grade conceptual accuracy fairly regardless of which language the student used!):
  ${skipped ? '[STUDENT SKIPPED / DID NOT ANSWER]' : `"${studentAnswer}"`}

STUDY NOTES (Ground truth):
"""
${notes}
"""

EVALUATION RULES:
1. Evaluate STRICTLY against the STUDY NOTES above. Be honest and accurate — do not inflate scores for vague, off-topic, or wrong answers, and reward genuinely accurate understanding even if phrased informally or in Hinglish/Hindi.
2. If the student skipped or gave no meaningful answer, score = 0, conceptScore = 0, clarityScore = 0, whatWasRight = [].
3. Provide integer scores from 0 to 10 for:
   - "score": overall viva answer score (0-10)
   - "conceptScore": accuracy and depth of conceptual understanding (0-10)
   - "clarityScore": clarity, structure, and communication effectiveness (0-10)
4. Language requirement for "whatWasRight", "whatWasMissed", "modelExplanation", "followUpQuestion", and "examinerRemark":
   ${langRule}
5. "whatWasRight": 0 to 3 concise, specific bullet strings highlighting correct parts of the student's answer.
6. "whatWasMissed": 0 to 3 concise, specific bullet strings highlighting key facts/steps from the notes that were omitted or inaccurate. If the answer was near-perfect, you may return 1 brief refinement tip or empty array.
7. "modelExplanation": A crisp 2-3 sentence ideal viva answer strictly grounded in the notes.
8. "followUpQuestion": A short (maximum 20 words) natural examiner follow-up question either probing what was missed or asking one deeper check from the same topic in the notes.
9. "examinerRemark": One short, realistic examiner reaction sentence (encouraging yet honest).
`;

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a fair college viva examiner. Grade accurately from 0 to 10 strictly based on the provided notes and output clean JSON.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                conceptScore: { type: Type.INTEGER },
                clarityScore: { type: Type.INTEGER },
                whatWasRight: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                whatWasMissed: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                modelExplanation: { type: Type.STRING },
                followUpQuestion: { type: Type.STRING },
                examinerRemark: { type: Type.STRING },
              },
              required: [
                'score',
                'conceptScore',
                'clarityScore',
                'whatWasRight',
                'whatWasMissed',
                'modelExplanation',
                'followUpQuestion',
                'examinerRemark',
              ],
            },
          },
        })
      );

      interface RawEval {
        score: number;
        conceptScore: number;
        clarityScore: number;
        whatWasRight: string[];
        whatWasMissed: string[];
        modelExplanation: string;
        followUpQuestion: string;
        examinerRemark: string;
      }

      const parsed = parseJsonSafe<RawEval>(
        response.text,
        'Could not parse examiner evaluation. Please try submitting again.'
      );

      const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));

      return res.json({
        score: skipped ? 0 : clamp(parsed.score),
        conceptScore: skipped ? 0 : clamp(parsed.conceptScore),
        clarityScore: skipped ? 0 : clamp(parsed.clarityScore),
        whatWasRight: skipped
          ? []
          : (Array.isArray(parsed.whatWasRight) ? parsed.whatWasRight : []).map(String).filter(Boolean),
        whatWasMissed: (Array.isArray(parsed.whatWasMissed) ? parsed.whatWasMissed : [])
          .map(String)
          .filter(Boolean),
        modelExplanation: String(parsed.modelExplanation || '').trim(),
        followUpQuestion: String(parsed.followUpQuestion || '').trim(),
        examinerRemark: String(parsed.examinerRemark || '').trim(),
      });
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Evaluate student's optional follow-up answer
  app.post('/api/viva/evaluate-followup', async (req: Request, res: Response) => {
    try {
      const notes = sanitizeNotes(req.body?.notes);
      const language = parseLanguage(req.body?.language);
      const originalQuestion =
        typeof req.body?.originalQuestion === 'string' ? req.body.originalQuestion.trim() : '';
      const followUpQuestion =
        typeof req.body?.followUpQuestion === 'string' ? req.body.followUpQuestion.trim() : '';
      const followUpAnswer =
        typeof req.body?.followUpAnswer === 'string' ? req.body.followUpAnswer.trim() : '';

      if (!notes || !followUpQuestion || !followUpAnswer) {
        return res.status(400).json({ error: 'Please provide an answer to the follow-up question.' });
      }

      const ai = getGeminiClient();
      const langRule = getLanguageInstruction(language);

      const prompt = `
You are a college viva examiner evaluating a student's brief answer to your follow-up question.

- Original Question: "${originalQuestion}"
- Follow-up Question: "${followUpQuestion}"
- Student's Follow-up Answer (may be in English, Hindi, or Hinglish): "${followUpAnswer}"

STUDY NOTES:
"""
${notes}
"""

RULES:
1. Grade fairly strictly against the study notes.
2. Language for "feedback" and "keyTakeaway": ${langRule}
3. "isStrong": true if the student correctly addressed the follow-up concept, false otherwise.
4. "feedback": 1-2 crisp sentences telling the student what was right or missing in their follow-up reply.
5. "keyTakeaway": 1 short sentence capturing the exact takeaway to remember.
`;

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: 'You are a supportive yet rigorous college viva examiner. Output clean JSON.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isStrong: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING },
                keyTakeaway: { type: Type.STRING },
              },
              required: ['isStrong', 'feedback', 'keyTakeaway'],
            },
          },
        })
      );

      const parsed = parseJsonSafe<{ isStrong: boolean; feedback: string; keyTakeaway: string }>(
        response.text,
        'Could not evaluate follow-up answer.'
      );

      return res.json({
        isStrong: Boolean(parsed.isStrong),
        feedback: String(parsed.feedback || '').trim(),
        keyTakeaway: String(parsed.keyTakeaway || '').trim(),
      });
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 4. Generate final report qualitative insights strictly from real evaluation results
  app.post('/api/viva/generate-report', async (req: Request, res: Response) => {
    try {
      const notes = sanitizeNotes(req.body?.notes);
      const evaluations = Array.isArray(req.body?.evaluations) ? req.body.evaluations : [];

      if (evaluations.length === 0) {
        return res.status(400).json({ error: 'No evaluated answers provided for the report.' });
      }

      const ai = getGeminiClient();

      const compactResults = evaluations.map((e: Record<string, unknown>, idx: number) => ({
        questionNumber: idx + 1,
        type: e.type,
        topic: e.topic,
        question: e.question,
        studentAnswer: e.studentAnswer || '[Skipped]',
        score: e.score,
        conceptScore: e.conceptScore,
        clarityScore: e.clarityScore,
        whatWasRight: e.whatWasRight,
        whatWasMissed: e.whatWasMissed,
      }));

      const prompt = `
You are generating a concise, honest academic viva performance summary in clear English based ONLY on the student's actual evaluated answers below.

STRICT RULES:
1. Write all output strictly in clear English (UI language).
2. Base every strength, revision topic, and summary observation strictly on the ACTUAL scores and evaluation details below. Never invent strengths if the student scored low, and never invent mistakes if they scored 9-10.
3. "overallSummary": 2 concise sentences summarizing their real viva performance and readiness.
4. "strengths": 1 to 4 concise strings highlighting genuine strengths demonstrated in the answers (if all answers were skipped or scored under 3, return 1 honest encouragement noting their willingness to practice and where to start).
5. "topicsToRevise": Array of specific topics from the questions where the student scored below 8 or missed details, each with "topic" (short title) and "reason" (1 crisp sentence on what to revise from the notes). If the student scored 9-10 on everything, return an empty array or 1 light polish suggestion.

ACTUAL VIVA EVALUATION RESULTS:
${JSON.stringify(compactResults, null, 2)}

REFERENCE NOTES (truncated excerpt):
"""
${notes.slice(0, 6000)}
"""
`;

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an honest academic evaluator synthesizing a viva report solely from real evaluation data. Output valid JSON in English.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallSummary: { type: Type.STRING },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                topicsToRevise: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      topic: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ['topic', 'reason'],
                  },
                },
              },
              required: ['overallSummary', 'strengths', 'topicsToRevise'],
            },
          },
        })
      );

      const parsed = parseJsonSafe<{
        overallSummary: string;
        strengths: string[];
        topicsToRevise: Array<{ topic: string; reason: string }>;
      }>(response.text, 'Could not synthesize report insights.');

      return res.json({
        overallSummary: String(parsed.overallSummary || '').trim(),
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.map(String).filter(Boolean)
          : [],
        topicsToRevise: Array.isArray(parsed.topicsToRevise)
          ? parsed.topicsToRevise
              .map((t) => ({
                topic: String(t?.topic || '').trim(),
                reason: String(t?.reason || '').trim(),
              }))
              .filter((t) => t.topic)
          : [],
      });
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VivaBuddy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
