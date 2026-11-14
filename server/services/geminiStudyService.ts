import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { env } from '../config/env.ts';
import { AppHttpError } from '../middleware/errorHandler.ts';
import {
  parseAndValidateAiStudyResponse,
  type GenerateStudyRequest,
  type ValidatedAiStudyPayload,
} from '../validators/studyValidators.ts';

const GEMINI_MODEL = 'gemini-4-hydrogen';

const studyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Concise, clear title summarizing the study topic.',
    },
    summary: {
      type: Type.STRING,
      description: 'Two-sentence overview of the core learning goals.',
    },
    keyConcepts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 6 distinct core concepts covered in the study set.',
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          front: { type: Type.STRING, description: 'Clear question or prompt on front of card.' },
          back: { type: Type.STRING, description: 'Concise, accurate explanation on back.' },
          conceptTag: { type: Type.STRING, description: 'Short concept label (1-3 words).' },
          hint: { type: Type.STRING, description: 'Optional brief memory cue.' },
        },
        required: ['id', 'front', 'back', 'conceptTag', 'hint'],
      },
    },
    quizQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 distinct multiple-choice answer options.',
          },
          correctOptionIndex: {
            type: Type.INTEGER,
            description: 'Zero-based index (0, 1, 2, or 3) of the correct option.',
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief explanation of why the correct option is right.',
          },
        },
        required: ['id', 'question', 'options', 'correctOptionIndex', 'explanation'],
      },
    },
  },
  required: ['title', 'summary', 'keyConcepts', 'flashcards', 'quizQuestions'],
};

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!env.geminiApiKey || env.geminiApiKey === 'MY_GEMINI_API_KEY') {
    throw new AppHttpError(
      503,
      'GEMINI_NOT_CONFIGURED',
      'Study generation is not configured on the server. Please contact your administrator.',
      false,
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: env.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

function buildSystemInstruction(input: GenerateStudyRequest): string {
  return [
    'You are an expert academic curriculum designer.',
    'Transform the provided topic or study notes into structured study flashcards and multiple-choice quiz questions.',
    `Target difficulty level: ${input.difficulty}.`,
    `Generate exactly ${input.flashcardCount} flashcards and exactly ${input.quizCount} multiple-choice quiz questions.`,
    'Every quiz question must have exactly 4 distinct plausible options and a valid zero-based correctOptionIndex (0 to 3).',
    'Flashcard fronts must ask focused conceptual or recall questions; backs must give clear, factual answers.',
    'Do not include markdown formatting inside JSON values unless strictly necessary for code/math clarity.',
    'Return strictly valid JSON matching the provided schema.',
  ].join(' ');
}

function buildUserPrompt(input: GenerateStudyRequest): string {
  return [
    'Study material / topic:',
    '"""',
    input.content,
    '"""',
    '',
    `Produce ${input.flashcardCount} flashcards and ${input.quizCount} multiple-choice questions at the ${input.difficulty} level.`,
  ].join('\n');
}

function withTimeoutAndAbort<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(new AppHttpError(499, 'REQUEST_CANCELLED', 'Request was cancelled.', false));
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new AppHttpError(
          504,
          'AI_TIMEOUT',
          'The AI generation request timed out. Please try again or shorten your notes.',
          true,
        ),
      );
    }, timeoutMs);

    const onAbort = () => {
      cleanup();
      reject(new AppHttpError(499, 'REQUEST_CANCELLED', 'Request was cancelled.', false));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (err) => {
        cleanup();
        reject(err);
      },
    );
  });
}

function mapProviderError(err: unknown): AppHttpError {
  if (err instanceof AppHttpError) {
    return err;
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : undefined;

  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return new AppHttpError(
      429,
      'AI_RATE_LIMITED',
      'Study generation rate limit reached. Please wait a moment and retry.',
      true,
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED')
  ) {
    return new AppHttpError(
      502,
      'AI_AUTH_ERROR',
      'Study generation credentials were rejected by the upstream service.',
      false,
    );
  }

  if (status === 404 || rawMessage.includes('NOT_FOUND')) {
    return new AppHttpError(
      502,
      'AI_MODEL_UNAVAILABLE',
      'The study generation service is temporarily unavailable. Please try again.',
      false,
    );
  }

  if (
    rawMessage.includes('not valid JSON') ||
    rawMessage.includes('schema validation') ||
    rawMessage.includes('empty response')
  ) {
    return new AppHttpError(
      502,
      'INVALID_AI_OUTPUT',
      `${rawMessage} Please retry generating this study set.`,
      true,
    );
  }

  return new AppHttpError(
    502,
    'AI_UPSTREAM_ERROR',
    'Could not reach the AI generation service. Please try again.',
    true,
  );
}

export interface GeneratedStudyResult {
  studySet: ValidatedAiStudyPayload;
  model: string;
  generatedAt: string;
}

export async function generateStudySetWithGemini(
  input: GenerateStudyRequest,
  signal?: AbortSignal,
): Promise<GeneratedStudyResult> {
  const client = getGeminiClient();
  const maxAttempts = 2;
  let lastError: AppHttpError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new AppHttpError(499, 'REQUEST_CANCELLED', 'Request was cancelled.', false);
    }

    try {
      const response = await withTimeoutAndAbort(
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents: buildUserPrompt(input),
          config: {
            systemInstruction: buildSystemInstruction(input),
            responseMimeType: 'application/json',
            responseSchema: studyResponseSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            abortSignal: signal,
          },
        }),
        env.requestTimeoutMs,
        signal,
      );

      const rawText = response.text ?? '';
      const validated = parseAndValidateAiStudyResponse(rawText);

      // Normalize IDs so React keys and progress maps are always unique
      const timestamp = Date.now();
      const normalized: ValidatedAiStudyPayload = {
        ...validated,
        flashcards: validated.flashcards.map((card, idx) => ({
          ...card,
          id: `fc-${timestamp}-${idx + 1}`,
        })),
        quizQuestions: validated.quizQuestions.map((q, idx) => ({
          ...q,
          id: `qq-${timestamp}-${idx + 1}`,
        })),
      };

      return {
        studySet: normalized,
        model: GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      const mapped = mapProviderError(err);
      lastError = mapped;
      console.error(
        `[MindForge AI] Gemini attempt ${attempt} failed (${mapped.code}):`,
        err instanceof Error ? err.message : String(err),
      );

      // Only retry transient/output-validation errors once
      const shouldRetry =
        attempt < maxAttempts &&
        (mapped.code === 'INVALID_AI_OUTPUT' || mapped.code === 'AI_UPSTREAM_ERROR') &&
        !signal?.aborted;

      if (!shouldRetry) {
        throw mapped;
      }

      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError ?? new AppHttpError(502, 'AI_UPSTREAM_ERROR', 'Study generation failed.', true);
}
