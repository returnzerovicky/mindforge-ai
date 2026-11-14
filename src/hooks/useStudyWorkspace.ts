import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateStudySet, StudyApiError } from '../services/studyApi';
import type {
  ApiErrorInfo,
  CardStatus,
  GenerateStudyInput,
  QuizAttempt,
  StudyActivityItem,
  StudySet,
  StudyView,
} from '../types/study';
import {
  calculateDeckMastery,
  calculateWorkspaceStats,
  getRecentQuizTrend,
  getWeakTopicsFromDecks,
  isLatestRequest,
  STARTER_DECK,
} from '../utils/studyLogic';

const DECKS_STORAGE_KEY = 'mindforge_ai_decks_v1';
const ACTIVITY_STORAGE_KEY = 'mindforge_ai_activity_v1';

function loadInitialDecks(): StudySet[] {
  try {
    const raw = window.localStorage.getItem(DECKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudySet[]) : [];
  } catch {
    return [];
  }
}

function loadInitialActivities(): StudyActivityItem[] {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudyActivityItem[]) : [];
  } catch {
    return [];
  }
}

export function useStudyWorkspace() {
  const [decks, setDecks] = useState<StudySet[]>(loadInitialDecks);
  const [activities, setActivities] = useState<StudyActivityItem[]>(loadInitialActivities);
  const [activeDeckId, setActiveDeckId] = useState<string>(() => loadInitialDecks()[0]?.id ?? '');
  const [activeView, setActiveView] = useState<StudyView>('overview');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<ApiErrorInfo | null>(null);
  const [lastSubmittedInput, setLastSubmittedInput] = useState<GenerateStudyInput | null>(null);

  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [decks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [activities]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const appendActivity = useCallback((item: Omit<StudyActivityItem, 'id' | 'timestamp'>) => {
    const entry: StudyActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? decks[0] ?? null,
    [decks, activeDeckId],
  );

  const activeDeckMastery = useMemo(
    () => (activeDeck ? calculateDeckMastery(activeDeck) : null),
    [activeDeck],
  );

  const workspaceStats = useMemo(() => calculateWorkspaceStats(decks), [decks]);
  const weakTopics = useMemo(() => getWeakTopicsFromDecks(decks), [decks]);
  const quizTrend = useMemo(() => getRecentQuizTrend(decks, 8), [decks]);

  const cancelGeneration = useCallback(() => {
    requestSeqRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const dismissError = useCallback(() => {
    setGenerationError(null);
  }, []);

  const generateDeck = useCallback(
    async (input: GenerateStudyInput) => {
      const nextRequestId = requestSeqRef.current + 1;
      requestSeqRef.current = nextRequestId;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLastSubmittedInput(input);
      setGenerationError(null);
      setIsGenerating(true);

      try {
        const payload = await generateStudySet(input, controller.signal);

        if (!isLatestRequest(requestSeqRef.current, nextRequestId)) {
          return;
        }

        const initialStatuses: Record<string, CardStatus> = {};
        for (const card of payload.flashcards) {
          initialStatuses[card.id] = 'unseen';
        }

        const newDeck: StudySet = {
          id: `deck-${Date.now()}`,
          title: payload.title,
          summary: payload.summary,
          difficulty: payload.difficulty,
          keyConcepts: payload.keyConcepts,
          flashcards: payload.flashcards,
          quizQuestions: payload.quizQuestions,
          cardStatuses: initialStatuses,
          quizHistory: [],
          createdAt: payload.generatedAt,
          model: payload.model,
          isSample: false,
        };

        setDecks((prev) => [newDeck, ...prev]);
        setActiveDeckId(newDeck.id);
        setActiveView('flashcards');
        appendActivity({
          type: 'deck_created',
          deckId: newDeck.id,
          deckTitle: newDeck.title,
          detail: `Generated ${newDeck.flashcards.length} flashcards & ${newDeck.quizQuestions.length} quiz questions`,
        });
      } catch (err) {
        if (!isLatestRequest(requestSeqRef.current, nextRequestId)) {
          return;
        }

        if (err instanceof StudyApiError) {
          if (err.detail.code === 'REQUEST_CANCELLED') {
            return;
          }
          setGenerationError(err.detail);
        } else {
          setGenerationError({
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred while generating your study set.',
            retryable: true,
          });
        }
      } finally {
        if (isLatestRequest(requestSeqRef.current, nextRequestId)) {
          setIsGenerating(false);
          abortControllerRef.current = null;
        }
      }
    },
    [appendActivity],
  );

  const retryLastGeneration = useCallback(() => {
    if (lastSubmittedInput) {
      void generateDeck(lastSubmittedInput);
    }
  }, [generateDeck, lastSubmittedInput]);

  const selectDeck = useCallback((deckId: string, nextView?: StudyView) => {
    setActiveDeckId(deckId);
    if (nextView) {
      setActiveView(nextView);
    }
  }, []);

  const deleteDeck = useCallback(
    (deckId: string) => {
      setDecks((prev) => {
        const remaining = prev.filter((d) => d.id !== deckId);
        if (activeDeckId === deckId) {
          setActiveDeckId(remaining[0]?.id ?? '');
        }
        return remaining;
      });
    },
    [activeDeckId],
  );

  const loadSampleDeck = useCallback(() => {
    setDecks((prev) => {
      if (prev.some((d) => d.id === STARTER_DECK.id)) {
        return prev;
      }
      return [STARTER_DECK, ...prev];
    });
    setActiveDeckId(STARTER_DECK.id);
    setActiveView('flashcards');
    appendActivity({
      type: 'deck_created',
      deckId: STARTER_DECK.id,
      deckTitle: STARTER_DECK.title,
      detail: 'Loaded built-in sample deck (4 flashcards, 3 quiz questions)',
    });
  }, [appendActivity]);

  const updateCardStatus = useCallback(
    (deckId: string, cardId: string, status: CardStatus) => {
      let targetDeckTitle = '';
      setDecks((prev) =>
        prev.map((deck) => {
          if (deck.id !== deckId) return deck;
          targetDeckTitle = deck.title;
          return {
            ...deck,
            cardStatuses: {
              ...deck.cardStatuses,
              [cardId]: status,
            },
          };
        }),
      );
      if (targetDeckTitle) {
        appendActivity({
          type: 'card_reviewed',
          deckId,
          deckTitle: targetDeckTitle,
          detail: status === 'mastered' ? 'Marked flashcard as known' : 'Flagged flashcard for revision',
        });
      }
    },
    [appendActivity],
  );

  const resetDeckMastery = useCallback((deckId: string) => {
    setDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== deckId) return deck;
        const resetStatuses: Record<string, CardStatus> = {};
        for (const card of deck.flashcards) {
          resetStatuses[card.id] = 'unseen';
        }
        return {
          ...deck,
          cardStatuses: resetStatuses,
        };
      }),
    );
  }, []);

  const recordQuizAttempt = useCallback(
    (deckId: string, attempt: QuizAttempt) => {
      let targetDeckTitle = '';
      setDecks((prev) =>
        prev.map((deck) => {
          if (deck.id !== deckId) return deck;
          targetDeckTitle = deck.title;
          return {
            ...deck,
            quizHistory: [attempt, ...deck.quizHistory].slice(0, 20),
          };
        }),
      );
      if (targetDeckTitle) {
        appendActivity({
          type: 'quiz_completed',
          deckId,
          deckTitle: targetDeckTitle,
          detail: `${attempt.mode === 'retest' ? 'Retest' : 'Practice quiz'}: ${attempt.correctCount}/${attempt.totalQuestions} (${attempt.scorePercent}%)`,
        });
      }
    },
    [appendActivity],
  );

  return {
    decks,
    activities,
    activeDeck,
    activeDeckId,
    activeDeckMastery,
    activeView,
    setActiveView,
    workspaceStats,
    weakTopics,
    quizTrend,
    isGenerating,
    generationError,
    lastSubmittedInput,
    generateDeck,
    retryLastGeneration,
    cancelGeneration,
    dismissError,
    selectDeck,
    deleteDeck,
    loadSampleDeck,
    updateCardStatus,
    resetDeckMastery,
    recordQuizAttempt,
  };
}
