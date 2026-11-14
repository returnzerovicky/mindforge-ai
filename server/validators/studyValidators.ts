import { z } from 'zod';

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const generateStudyRequestSchema = z.object({
  content: z
    .string({ error: 'Study topic or notes must be a text string.' })
    .trim()
    .min(3, 'Please enter at least 3 characters describing a topic or study notes.')
    .max(12000, 'Study notes cannot exceed 12,000 characters.'),
  difficulty: z.enum(DIFFICULTY_LEVELS).default('intermediate'),
  flashcardCount: z
    .number({ error: 'Flashcard count must be a number.' })
    .int('Flashcard count must be a whole number.')
    .min(3, 'Request at least 3 flashcards.')
    .max(15, 'Request at most 15 flashcards.')
    .default(6),
  quizCount: z
    .number({ error: 'Quiz question count must be a number.' })
    .int('Quiz question count must be a whole number.')
    .min(2, 'Request at least 2 quiz questions.')
    .max(12, 'Request at most 12 quiz questions.')
    .default(5),
});

export type GenerateStudyRequest = z.infer<typeof generateStudyRequestSchema>;

const nonEmptyTrimmedString = (fieldName: string, minLen = 1, maxLen = 1000) =>
  z
    .string({ error: `${fieldName} must be a string.` })
    .trim()
    .min(minLen, `${fieldName} cannot be empty.`)
    .max(maxLen, `${fieldName} exceeds maximum length of ${maxLen} characters.`);

export const flashcardSchema = z.object({
  id: nonEmptyTrimmedString('Flashcard id', 1, 64),
  front: nonEmptyTrimmedString('Flashcard front', 3, 400),
  back: nonEmptyTrimmedString('Flashcard back', 3, 900),
  conceptTag: nonEmptyTrimmedString('Concept tag', 2, 60),
  hint: z
    .string()
    .trim()
    .max(240, 'Hint cannot exceed 240 characters.')
    .optional()
    .default(''),
});

export const quizQuestionSchema = z
  .object({
    id: nonEmptyTrimmedString('Question id', 1, 64),
    question: nonEmptyTrimmedString('Question text', 5, 500),
    options: z
      .array(nonEmptyTrimmedString('Question option', 1, 260))
      .length(4, 'Each quiz question must contain exactly 4 options.'),
    correctOptionIndex: z
      .number({ error: 'correctOptionIndex must be a number.' })
      .int('correctOptionIndex must be an integer.')
      .min(0, 'correctOptionIndex must be between 0 and 3.')
      .max(3, 'correctOptionIndex must be between 0 and 3.'),
    explanation: nonEmptyTrimmedString('Question explanation', 5, 700),
  })
  .superRefine((q, ctx) => {
    const normalized = q.options.map((opt) => opt.toLowerCase().trim());
    const uniqueCount = new Set(normalized).size;
    if (uniqueCount !== q.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Quiz question options must all be distinct.',
      });
    }
    if (q.options[q.correctOptionIndex] === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['correctOptionIndex'],
        message: 'correctOptionIndex must reference an existing option.',
      });
    }
  });

export const aiStudyPayloadSchema = z.object({
  title: nonEmptyTrimmedString('Study set title', 2, 120),
  summary: nonEmptyTrimmedString('Study set summary', 10, 600),
  keyConcepts: z
    .array(nonEmptyTrimmedString('Key concept', 2, 80))
    .min(1, 'At least 1 key concept is required.')
    .max(10, 'Too many key concepts returned.'),
  flashcards: z
    .array(flashcardSchema)
    .min(1, 'AI response must contain at least 1 flashcard.')
    .max(20, 'Flashcard list exceeds allowed limit.'),
  quizQuestions: z
    .array(quizQuestionSchema)
    .min(1, 'AI response must contain at least 1 quiz question.')
    .max(15, 'Quiz question list exceeds allowed limit.'),
});

export type ValidatedAiStudyPayload = z.infer<typeof aiStudyPayloadSchema>;

/**
 * Strips accidental markdown code fences if a model wraps JSON in ```json ... ```
 * and parses strictly with JSON.parse + Zod schema validation.
 */
export function parseAndValidateAiStudyResponse(rawText: string): ValidatedAiStudyPayload {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Model returned an empty response.');
  }

  let candidateJson = trimmed;
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch && fenceMatch[1]) {
    candidateJson = fenceMatch[1].trim();
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(candidateJson);
  } catch {
    throw new Error('Model output was not valid JSON.');
  }

  const validation = aiStudyPayloadSchema.safeParse(parsedUnknown);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const issuePath = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
    throw new Error(
      `Model output failed schema validation (${issuePath}${firstIssue?.message ?? 'Invalid structure'}).`,
    );
  }

  return validation.data;
}
