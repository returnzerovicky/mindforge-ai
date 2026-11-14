import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeckMastery,
  calculateQuizScore,
  calculateWorkspaceStats,
  getRecentQuizTrend,
  getRetestQuestions,
  getWeakTopicsFromDecks,
  isLatestRequest,
  STARTER_DECK,
  validateStudyPayload,
} from './studyLogic';

test('validateStudyPayload accepts valid enveloped API payload', () => {
  const payload = {
    ok: true,
    data: {
      title: 'Linear Algebra Basics',
      summary: 'Core concepts of vectors, matrices, and eigenvalues.',
      difficulty: 'beginner',
      keyConcepts: ['Vectors', 'Eigenvalues'],
      flashcards: [
        {
          id: 'fc-1',
          front: 'What is a unit vector?',
          back: 'A vector with a Euclidean norm (magnitude) equal to 1.',
          conceptTag: 'Vectors',
          hint: 'Length = 1',
        },
      ],
      quizQuestions: [
        {
          id: 'qq-1',
          question: 'What is the determinant of a 2x2 identity matrix?',
          options: ['0', '1', '2', '-1'],
          correctOptionIndex: 1,
          explanation: 'The identity matrix preserves area/volume, so its determinant is 1.',
        },
      ],
      model: 'mindforge-core',
      generatedAt: '2026-11-14T06:00:00.000Z',
    },
  };

  const validated = validateStudyPayload(payload);
  assert.equal(validated.title, 'Linear Algebra Basics');
  assert.equal(validated.flashcards.length, 1);
  assert.equal(validated.quizQuestions.length, 1);
});

test('validateStudyPayload rejects malformed or incomplete contracts', () => {
  assert.throws(() => validateStudyPayload(null), /invalid response object/i);
  assert.throws(
    () =>
      validateStudyPayload({
        data: {
          title: 'Valid Title',
          summary: 'Valid summary text here.',
          keyConcepts: ['One'],
          flashcards: [],
          quizQuestions: [],
        },
      }),
    /No flashcards/i,
  );
});

test('calculateQuizScore and getRetestQuestions accurately isolate missed questions', () => {
  const questions = STARTER_DECK.quizQuestions;
  const selectedAnswers: Record<string, number> = {
    [questions[0].id]: questions[0].correctOptionIndex,
    [questions[1].id]: (questions[1].correctOptionIndex + 1) % 4,
    [questions[2].id]: (questions[2].correctOptionIndex + 2) % 4,
  };

  const score = calculateQuizScore(questions, selectedAnswers);
  assert.equal(score.total, 3);
  assert.equal(score.correct, 1);
  assert.equal(score.incorrectCount, 2);
  assert.equal(score.percentage, 33);

  const retest = getRetestQuestions(questions, score.incorrectIds);
  assert.equal(retest.length, 2);
  assert.deepEqual(
    retest.map((q) => q.id),
    [questions[1].id, questions[2].id],
  );
});

test('calculateDeckMastery, calculateWorkspaceStats, weak topics, and quiz trend work from real history', () => {
  const modifiedDeck = {
    ...STARTER_DECK,
    cardStatuses: {
      'sample-fc-1': 'mastered' as const,
      'sample-fc-2': 'mastered' as const,
      'sample-fc-3': 'review' as const,
      'sample-fc-4': 'unseen' as const,
    },
    quizHistory: [
      {
        id: 'a-2',
        timestamp: '2026-11-14T06:20:00.000Z',
        mode: 'retest' as const,
        totalQuestions: 1,
        correctCount: 1,
        scorePercent: 100,
        incorrectQuestionIds: [],
      },
      {
        id: 'a-1',
        timestamp: '2026-11-14T06:10:00.000Z',
        mode: 'full' as const,
        totalQuestions: 3,
        correctCount: 2,
        scorePercent: 67,
        incorrectQuestionIds: ['sample-qq-2'],
      },
    ],
  };

  const mastery = calculateDeckMastery(modifiedDeck);
  assert.equal(mastery.masteredCount, 2);
  assert.equal(mastery.reviewCount, 1);
  assert.equal(mastery.reviewedCount, 3);
  assert.equal(mastery.unseenCount, 1);
  assert.equal(mastery.masteryPercent, 50);

  const stats = calculateWorkspaceStats([modifiedDeck]);
  assert.equal(stats.totalDecks, 1);
  assert.equal(stats.reviewedCards, 3);
  assert.equal(stats.overallMasteryPercent, 50);
  assert.equal(stats.totalQuizzesTaken, 2);
  assert.equal(stats.averageQuizAccuracy, 84);

  const weak = getWeakTopicsFromDecks([modifiedDeck]);
  assert.equal(weak.length, 1);
  assert.equal(weak[0].questionId, 'sample-qq-2');
  assert.equal(weak[0].missCount, 1);

  const trend = getRecentQuizTrend([modifiedDeck]);
  assert.equal(trend.length, 2);
  assert.equal(trend[0].attemptId, 'a-1');
  assert.equal(trend[1].attemptId, 'a-2');
});

test('isLatestRequest guards against stale out-of-order responses', () => {
  assert.equal(isLatestRequest(3, 3), true);
  assert.equal(isLatestRequest(3, 2), false);
});
