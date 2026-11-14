import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateStudyRequestSchema,
  parseAndValidateAiStudyResponse,
} from './studyValidators.ts';

const validAiPayload = {
  title: 'PostgreSQL Indexing Strategies',
  summary: 'Covers B-tree, GIN, and partial indexes for efficient query execution.',
  keyConcepts: ['B-tree Indexes', 'GIN Indexes', 'Partial Indexes'],
  flashcards: [
    {
      id: 'fc-1',
      front: 'When is a GIN index preferred over a B-tree index?',
      back: 'GIN indexes excel at indexing composite values like JSONB documents, arrays, and full-text search tokens.',
      conceptTag: 'GIN Indexes',
      hint: 'Think composite values.',
    },
  ],
  quizQuestions: [
    {
      id: 'qq-1',
      question: 'Which index type is PostgreSQL’s default when running CREATE INDEX?',
      options: ['GIN', 'GiST', 'B-tree', 'BRIN'],
      correctOptionIndex: 2,
      explanation: 'B-tree is the default index type for equality and range queries.',
    },
  ],
};

test('parseAndValidateAiStudyResponse accepts valid JSON payload', () => {
  const result = parseAndValidateAiStudyResponse(JSON.stringify(validAiPayload));
  assert.equal(result.title, 'PostgreSQL Indexing Strategies');
  assert.equal(result.flashcards.length, 1);
  assert.equal(result.quizQuestions.length, 1);
});

test('parseAndValidateAiStudyResponse strips markdown json fences', () => {
  const fenced = '```json\n' + JSON.stringify(validAiPayload) + '\n```';
  const result = parseAndValidateAiStudyResponse(fenced);
  assert.equal(result.quizQuestions[0].correctOptionIndex, 2);
});

test('parseAndValidateAiStudyResponse rejects empty or malformed JSON', () => {
  assert.throws(() => parseAndValidateAiStudyResponse('   '), /empty response/i);
  assert.throws(() => parseAndValidateAiStudyResponse('{bad json'), /not valid JSON/i);
});

test('parseAndValidateAiStudyResponse rejects empty flashcards or quizQuestions arrays', () => {
  const emptyCards = { ...validAiPayload, flashcards: [] };
  assert.throws(
    () => parseAndValidateAiStudyResponse(JSON.stringify(emptyCards)),
    /at least 1 flashcard/i,
  );

  const emptyQuiz = { ...validAiPayload, quizQuestions: [] };
  assert.throws(
    () => parseAndValidateAiStudyResponse(JSON.stringify(emptyQuiz)),
    /at least 1 quiz question/i,
  );
});

test('parseAndValidateAiStudyResponse rejects duplicate options and invalid correctOptionIndex', () => {
  const duplicateOptions = {
    ...validAiPayload,
    quizQuestions: [
      {
        ...validAiPayload.quizQuestions[0],
        options: ['B-tree', 'b-tree', 'GIN', 'BRIN'],
      },
    ],
  };
  assert.throws(
    () => parseAndValidateAiStudyResponse(JSON.stringify(duplicateOptions)),
    /distinct/i,
  );

  const badIndex = {
    ...validAiPayload,
    quizQuestions: [
      {
        ...validAiPayload.quizQuestions[0],
        correctOptionIndex: 4,
      },
    ],
  };
  assert.throws(
    () => parseAndValidateAiStudyResponse(JSON.stringify(badIndex)),
    /between 0 and 3/i,
  );
});

test('generateStudyRequestSchema validates user input bounds', () => {
  const shortInput = generateStudyRequestSchema.safeParse({ content: 'hi' });
  assert.equal(shortInput.success, false);

  const validInput = generateStudyRequestSchema.safeParse({
    content: 'Explain event loop microtasks vs macrotasks in JavaScript',
    difficulty: 'advanced',
    flashcardCount: 6,
    quizCount: 5,
  });
  assert.equal(validInput.success, true);
});
