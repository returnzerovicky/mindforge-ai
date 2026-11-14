import type {
  CardStatus,
  DifficultyLevel,
  Flashcard,
  QuizQuestion,
  StudySet,
  StudySetApiPayload,
} from '../types/study';

export interface QuizScoreSummary {
  total: number;
  correct: number;
  incorrectCount: number;
  percentage: number;
  incorrectIds: string[];
}

export interface DeckMasterySummary {
  totalCards: number;
  masteredCount: number;
  reviewCount: number;
  reviewedCount: number;
  unseenCount: number;
  masteryPercent: number;
}

export interface WorkspaceStats {
  totalDecks: number;
  totalCards: number;
  reviewedCards: number;
  masteredCards: number;
  reviewCards: number;
  overallMasteryPercent: number;
  totalQuizzesTaken: number;
  averageQuizAccuracy: number | null;
}

export interface WeakTopicItem {
  deckId: string;
  deckTitle: string;
  questionId: string;
  question: string;
  correctAnswer: string;
  missCount: number;
}

export interface QuizTrendPoint {
  attemptId: string;
  deckTitle: string;
  scorePercent: number;
  mode: 'full' | 'retest';
  timestamp: string;
}

const VALID_DIFFICULTIES: readonly DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

/**
 * Defensive client-side contract verification.
 * Ensures malformed, empty, or unexpected API payloads are rejected cleanly.
 */
export function validateStudyPayload(raw: unknown): StudySetApiPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Received an invalid response object from the server.');
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<
    string,
    unknown
  >;

  if (typeof data.title !== 'string' || data.title.trim().length < 2) {
    throw new Error('Study set title is missing or invalid.');
  }

  if (typeof data.summary !== 'string' || data.summary.trim().length < 5) {
    throw new Error('Study set summary is missing or invalid.');
  }

  if (!Array.isArray(data.keyConcepts) || data.keyConcepts.length === 0) {
    throw new Error('Study set key concepts are empty.');
  }

  if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
    throw new Error('No flashcards were returned.');
  }

  const flashcards: Flashcard[] = data.flashcards.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Flashcard ${idx + 1} is malformed.`);
    }
    const card = item as Record<string, unknown>;
    if (
      typeof card.id !== 'string' ||
      typeof card.front !== 'string' ||
      !card.front.trim() ||
      typeof card.back !== 'string' ||
      !card.back.trim()
    ) {
      throw new Error(`Flashcard ${idx + 1} is missing front or back content.`);
    }
    return {
      id: card.id,
      front: card.front.trim(),
      back: card.back.trim(),
      conceptTag:
        typeof card.conceptTag === 'string' && card.conceptTag.trim()
          ? card.conceptTag.trim()
          : 'Core Concept',
      hint: typeof card.hint === 'string' ? card.hint.trim() : '',
    };
  });

  if (!Array.isArray(data.quizQuestions) || data.quizQuestions.length === 0) {
    throw new Error('No quiz questions were returned.');
  }

  const quizQuestions: QuizQuestion[] = data.quizQuestions.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Quiz question ${idx + 1} is malformed.`);
    }
    const q = item as Record<string, unknown>;
    if (typeof q.id !== 'string' || typeof q.question !== 'string' || !q.question.trim()) {
      throw new Error(`Quiz question ${idx + 1} has invalid question text.`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Quiz question ${idx + 1} must have exactly 4 options.`);
    }
    const options = q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : ''));
    if (options.some((opt) => !opt)) {
      throw new Error(`Quiz question ${idx + 1} contains an empty option.`);
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
      throw new Error(`Quiz question ${idx + 1} contains duplicate options.`);
    }
    const correctIdx = Number(q.correctOptionIndex);
    if (!Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx > 3) {
      throw new Error(`Quiz question ${idx + 1} has an invalid correctOptionIndex.`);
    }
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
      throw new Error(`Quiz question ${idx + 1} is missing an explanation.`);
    }
    return {
      id: q.id,
      question: q.question.trim(),
      options: options as [string, string, string, string],
      correctOptionIndex: correctIdx,
      explanation: q.explanation.trim(),
    };
  });

  const difficulty: DifficultyLevel = VALID_DIFFICULTIES.includes(
    data.difficulty as DifficultyLevel,
  )
    ? (data.difficulty as DifficultyLevel)
    : 'intermediate';

  return {
    title: data.title.trim(),
    summary: data.summary.trim(),
    difficulty,
    keyConcepts: data.keyConcepts
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim()),
    flashcards,
    quizQuestions,
    model: typeof data.model === 'string' ? data.model : 'mindforge-core',
    generatedAt:
      typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
  };
}

export function calculateQuizScore(
  questions: QuizQuestion[],
  selectedAnswers: Record<string, number>,
): QuizScoreSummary {
  const total = questions.length;
  if (total === 0) {
    return { total: 0, correct: 0, incorrectCount: 0, percentage: 0, incorrectIds: [] };
  }

  let correct = 0;
  const incorrectIds: string[] = [];

  for (const question of questions) {
    const selected = selectedAnswers[question.id];
    if (selected === question.correctOptionIndex) {
      correct += 1;
    } else {
      incorrectIds.push(question.id);
    }
  }

  return {
    total,
    correct,
    incorrectCount: incorrectIds.length,
    percentage: Math.round((correct / total) * 100),
    incorrectIds,
  };
}

export function getRetestQuestions(
  allQuestions: QuizQuestion[],
  incorrectIds: string[],
): QuizQuestion[] {
  const idSet = new Set(incorrectIds);
  return allQuestions.filter((q) => idSet.has(q.id));
}

export function calculateDeckMastery(deck: StudySet): DeckMasterySummary {
  const totalCards = deck.flashcards.length;
  if (totalCards === 0) {
    return {
      totalCards: 0,
      masteredCount: 0,
      reviewCount: 0,
      reviewedCount: 0,
      unseenCount: 0,
      masteryPercent: 0,
    };
  }

  let masteredCount = 0;
  let reviewCount = 0;
  let unseenCount = 0;

  for (const card of deck.flashcards) {
    const status: CardStatus = deck.cardStatuses[card.id] ?? 'unseen';
    if (status === 'mastered') masteredCount += 1;
    else if (status === 'review') reviewCount += 1;
    else unseenCount += 1;
  }

  return {
    totalCards,
    masteredCount,
    reviewCount,
    reviewedCount: masteredCount + reviewCount,
    unseenCount,
    masteryPercent: Math.round((masteredCount / totalCards) * 100),
  };
}

export function calculateWorkspaceStats(decks: StudySet[]): WorkspaceStats {
  let totalCards = 0;
  let reviewedCards = 0;
  let masteredCards = 0;
  let reviewCards = 0;
  let totalQuizzesTaken = 0;
  let accuracySum = 0;

  for (const deck of decks) {
    const mastery = calculateDeckMastery(deck);
    totalCards += mastery.totalCards;
    reviewedCards += mastery.reviewedCount;
    masteredCards += mastery.masteredCount;
    reviewCards += mastery.reviewCount;

    for (const attempt of deck.quizHistory) {
      totalQuizzesTaken += 1;
      accuracySum += attempt.scorePercent;
    }
  }

  return {
    totalDecks: decks.length,
    totalCards,
    reviewedCards,
    masteredCards,
    reviewCards,
    overallMasteryPercent: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
    totalQuizzesTaken,
    averageQuizAccuracy:
      totalQuizzesTaken > 0 ? Math.round(accuracySum / totalQuizzesTaken) : null,
  };
}

/**
 * Derives actual weak topics / missed questions from stored quiz attempt history.
 */
export function getWeakTopicsFromDecks(decks: StudySet[]): WeakTopicItem[] {
  const missCounter = new Map<string, WeakTopicItem>();

  for (const deck of decks) {
    const questionLookup = new Map<string, QuizQuestion>();
    for (const q of deck.quizQuestions) {
      questionLookup.set(q.id, q);
    }

    for (const attempt of deck.quizHistory) {
      for (const questionId of attempt.incorrectQuestionIds) {
        const q = questionLookup.get(questionId);
        if (!q) continue;
        const key = `${deck.id}:${questionId}`;
        const existing = missCounter.get(key);
        if (existing) {
          existing.missCount += 1;
        } else {
          missCounter.set(key, {
            deckId: deck.id,
            deckTitle: deck.title,
            questionId: q.id,
            question: q.question,
            correctAnswer: q.options[q.correctOptionIndex],
            missCount: 1,
          });
        }
      }
    }
  }

  return Array.from(missCounter.values()).sort((a, b) => b.missCount - a.missCount);
}

/**
 * Extracts up to N recent quiz attempts sorted chronologically (oldest -> newest) for chart rendering.
 */
export function getRecentQuizTrend(decks: StudySet[], limit = 10): QuizTrendPoint[] {
  const points: QuizTrendPoint[] = [];

  for (const deck of decks) {
    for (const attempt of deck.quizHistory) {
      points.push({
        attemptId: attempt.id,
        deckTitle: deck.title,
        scorePercent: attempt.scorePercent,
        mode: attempt.mode,
        timestamp: attempt.timestamp,
      });
    }
  }

  points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return points.slice(-limit);
}

export function formatShortTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isLatestRequest(activeRequestId: number, responseRequestId: number): boolean {
  return activeRequestId === responseRequestId;
}

export function shuffleCardIds(cardIds: string[]): string[] {
  const copy = [...cardIds];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export const SAMPLE_TOPICS: Array<{ label: string; difficulty: DifficultyLevel; content: string }> = [
  {
    label: 'Cellular Respiration',
    difficulty: 'intermediate',
    content:
      'Cellular respiration converts glucose and oxygen into ATP through three primary stages: glycolysis in the cytosol (producing 2 net ATP and 2 pyruvate), the citric acid cycle in the mitochondrial matrix (generating NADH and FADH2), and oxidative phosphorylation along the inner mitochondrial membrane where the electron transport chain drives ATP synthase via a proton gradient.',
  },
  {
    label: 'HTTP Caching & CDNs',
    difficulty: 'intermediate',
    content:
      'HTTP caching uses Cache-Control directives such as max-age, s-maxage, stale-while-revalidate, and no-store. Conditional requests rely on ETag and Last-Modified headers so servers can respond with 304 Not Modified. Content Delivery Networks cache immutable hashed assets at edge nodes while purging or revalidating dynamic responses.',
  },
  {
    label: 'Macroeconomic Monetary Policy',
    difficulty: 'beginner',
    content:
      'Central banks manage inflation and employment using interest rate targets, open market operations, and reserve requirements. Expansionary policy lowers borrowing costs to stimulate aggregate demand during recessions, whereas contractionary policy raises rates to cool inflation.',
  },
];

export const STARTER_DECK: StudySet = {
  id: 'starter-tcp-tls-essentials',
  title: 'Sample Deck: TCP & TLS Handshake Essentials',
  summary:
    'Built-in sample study set covering transport-layer connection setup and TLS 1.3 security negotiation so you can explore flashcards and quizzes anytime.',
  difficulty: 'intermediate',
  keyConcepts: [
    'Three-Way Handshake',
    'Sequence Numbers',
    'TLS 1.3 Key Exchange',
    'Forward Secrecy',
  ],
  flashcards: [
    {
      id: 'sample-fc-1',
      front: 'What are the three packet flags exchanged during a standard TCP connection setup?',
      back: 'SYN (client initiates with an initial sequence number), SYN-ACK (server acknowledges and sends its own sequence number), and ACK (client confirms receipt).',
      conceptTag: 'Three-Way Handshake',
      hint: 'Think of Synchronize and Acknowledge.',
    },
    {
      id: 'sample-fc-2',
      front: 'Why does TLS 1.3 achieve faster connection establishment than TLS 1.2?',
      back: 'TLS 1.3 removes legacy cipher suites and sends the key share in the initial ClientHello, completing the cryptographic handshake in 1 round trip (1-RTT) instead of 2.',
      conceptTag: 'TLS 1.3 Handshake',
      hint: 'Compare round-trip times (RTT).',
    },
    {
      id: 'sample-fc-3',
      front: 'What role does Forward Secrecy play in modern TLS cipher suites?',
      back: 'Ephemeral Diffie-Hellman key exchange (ECDHE) ensures that compromising a server’s long-term private key later cannot decrypt previously recorded traffic.',
      conceptTag: 'Forward Secrecy',
      hint: 'Ephemeral session keys.',
    },
    {
      id: 'sample-fc-4',
      front: 'What is the purpose of TCP sequence and acknowledgment numbers?',
      back: 'They track byte offsets across packets so the receiver can reorder out-of-sequence segments, detect packet loss, and avoid duplicate data.',
      conceptTag: 'Reliable Delivery',
      hint: 'Ordering and loss detection.',
    },
  ],
  quizQuestions: [
    {
      id: 'sample-qq-1',
      question: 'Which message sequence correctly establishes a new TCP connection?',
      options: [
        'ACK -> SYN -> FIN',
        'SYN -> SYN-ACK -> ACK',
        'SYN -> ACK -> RST',
        'HELLO -> SYN-ACK -> FIN',
      ],
      correctOptionIndex: 1,
      explanation:
        'TCP uses a three-way handshake: the client sends SYN, the server replies with SYN-ACK, and the client confirms with ACK.',
    },
    {
      id: 'sample-qq-2',
      question: 'How many network round trips does a standard fresh TLS 1.3 handshake require?',
      options: ['0 round trips', '1 round trip', '2 round trips', '4 round trips'],
      correctOptionIndex: 1,
      explanation:
        'A fresh TLS 1.3 handshake completes in 1-RTT because the client includes supported key-share parameters inside its initial ClientHello.',
    },
    {
      id: 'sample-qq-3',
      question:
        'Which security property ensures past captured sessions stay confidential even if the server’s long-term private key is later leaked?',
      options: [
        'HSTS Preloading',
        'Perfect Forward Secrecy',
        'OCSP Stapling',
        'Symmetric Padding',
      ],
      correctOptionIndex: 1,
      explanation:
        'Forward Secrecy uses ephemeral key exchange (such as ECDHE) per session so past session keys cannot be derived from the server certificate key.',
    },
  ],
  cardStatuses: {
    'sample-fc-1': 'unseen',
    'sample-fc-2': 'unseen',
    'sample-fc-3': 'unseen',
    'sample-fc-4': 'unseen',
  },
  quizHistory: [],
  createdAt: '2026-11-14T06:00:00.000Z',
  model: 'built-in-sample',
  isSample: true,
};
