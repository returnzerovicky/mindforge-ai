import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import type { CardStatus, StudySet } from '../types/study';
import { calculateDeckMastery, shuffleCardIds } from '../utils/studyLogic';

interface FlashcardsViewProps {
  decks: StudySet[];
  deck: StudySet | null;
  onSelectDeck: (deckId: string) => void;
  onUpdateCardStatus: (deckId: string, cardId: string, status: CardStatus) => void;
  onResetMastery: (deckId: string) => void;
  onSwitchToQuiz: () => void;
  onCreateNew: () => void;
  onLoadSample: () => void;
}

export function FlashcardsView({
  decks,
  deck,
  onSelectDeck,
  onUpdateCardStatus,
  onResetMastery,
  onSwitchToQuiz,
  onCreateNew,
  onLoadSample,
}: FlashcardsViewProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'review'>('all');

  useEffect(() => {
    if (!deck) {
      setOrderedIds([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      return;
    }
    setOrderedIds(deck.flashcards.map((c) => c.id));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setFilterMode('all');
  }, [deck?.id]);

  const cardMap = useMemo(() => {
    const map = new Map<string, StudySet['flashcards'][number]>();
    if (!deck) return map;
    for (const card of deck.flashcards) {
      map.set(card.id, card);
    }
    return map;
  }, [deck]);

  const visibleCards = useMemo(() => {
    if (!deck) return [];
    const baseList = orderedIds
      .map((id) => cardMap.get(id))
      .filter((card): card is StudySet['flashcards'][number] => Boolean(card));
    if (filterMode === 'review') {
      return baseList.filter((card) => (deck.cardStatuses[card.id] ?? 'unseen') !== 'mastered');
    }
    return baseList;
  }, [deck, orderedIds, cardMap, filterMode]);

  const safeIndex = visibleCards.length > 0 ? Math.min(currentIndex, visibleCards.length - 1) : 0;
  const currentCard = visibleCards[safeIndex] ?? null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (!currentCard) return;

      if (event.code === 'Space') {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((prev) => (prev + 1 < visibleCards.length ? prev + 1 : 0));
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, visibleCards.length - 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, visibleCards.length]);

  if (!deck) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-[#14161B] p-8 sm:p-10 text-center space-y-4">
        <h1 className="font-display text-xl font-semibold text-zinc-100">
          No flashcard deck selected
        </h1>
        <p className="text-sm text-zinc-400">
          Generate a study set from your notes or load the sample deck to practice flashcards.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors"
          >
            Create Study Set
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded-lg border border-zinc-700 bg-zinc-800/70 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Load Sample Deck
          </button>
        </div>
      </div>
    );
  }

  const mastery = calculateDeckMastery(deck);

  const handleNext = () => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1 < visibleCards.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : visibleCards.length - 1));
  };

  const handleShuffle = () => {
    setOrderedIds((prev) => shuffleCardIds(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleMarkStatus = (status: CardStatus) => {
    if (!currentCard) return;
    onUpdateCardStatus(deck.id, currentCard.id, status);
    if (visibleCards.length > 1 && safeIndex < visibleCards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentStatus: CardStatus = currentCard ? deck.cardStatuses[currentCard.id] ?? 'unseen' : 'unseen';
  const deckProgressPercent =
    visibleCards.length > 0 ? Math.round(((safeIndex + 1) / visibleCards.length) * 100) : 0;

  return (
    <section aria-labelledby="flashcards-deck-title" className="mx-auto max-w-4xl space-y-6">
      {/* Deck header & switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="capitalize text-amber-400 font-medium">{deck.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{deck.flashcards.length} cards</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{mastery.masteryPercent}% known</span>
            {deck.isSample && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-zinc-300 font-medium">Sample Deck</span>
              </>
            )}
          </div>
          <h1
            id="flashcards-deck-title"
            className="font-display text-2xl font-semibold tracking-tight text-zinc-50 text-balance"
          >
            {deck.title}
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{deck.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {decks.length > 1 && (
            <div>
              <label htmlFor="flashcards-deck-select" className="sr-only">
                Switch study set
              </label>
              <select
                id="flashcards-deck-select"
                value={deck.id}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-[#14161B] px-3 py-2 text-xs font-medium text-zinc-200 focus:border-amber-500 focus:outline-none max-w-[200px]"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onSwitchToQuiz}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/12 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
          >
            <CheckSquare className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-[#14161B] p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            All Cards ({deck.flashcards.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode('review');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filterMode === 'review'
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Needs Revision ({deck.flashcards.length - mastery.masteredCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#14161B] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Shuffle</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onResetMastery(deck.id);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#14161B] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Position & Mastery Progress Indicator */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
          <span>
            {visibleCards.length > 0
              ? `Position ${safeIndex + 1} of ${visibleCards.length}`
              : 'No cards in filter'}
          </span>
          <span>
            Known: {mastery.masteredCount} / {mastery.totalCards} ({mastery.masteryPercent}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
            style={{ width: `${deckProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Flashcard Stage */}
      {visibleCards.length === 0 || !currentCard ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#14161B] p-10 text-center space-y-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-zinc-100">
              All cards in this deck are marked known
            </h2>
            <p className="text-sm text-zinc-400">
              Switch back to All Cards or verify retention with the practice quiz.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Show All Cards
            </button>
            <button
              type="button"
              onClick={onSwitchToQuiz}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors"
            >
              Start Practice Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="perspective-1200">
            <button
              type="button"
              onClick={() => setIsFlipped((prev) => !prev)}
              aria-pressed={isFlipped}
              aria-label={
                isFlipped
                  ? `Flashcard ${safeIndex + 1} answer shown. Click to flip back to prompt.`
                  : `Flashcard ${safeIndex + 1} prompt shown. Click to reveal answer.`
              }
              className="relative block w-full min-h-[300px] sm:min-h-[340px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 rounded-2xl cursor-pointer"
            >
              <div
                className={`flashcard-transition relative h-full min-h-[300px] sm:min-h-[340px] w-full transition-transform duration-300 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Face */}
                <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#14161B] p-6 sm:p-8 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                    <span className="font-medium text-amber-400">
                      {currentCard.conceptTag} · Front
                    </span>
                    <span className="font-mono tabular-nums">
                      Card {safeIndex + 1} / {visibleCards.length}
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="font-display text-lg sm:text-2xl font-medium text-zinc-50 leading-snug">
                      {currentCard.front}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                    <span>
                      Status:{' '}
                      <strong className="font-medium text-zinc-200">
                        {currentStatus === 'unseen'
                          ? 'Unreviewed'
                          : currentStatus === 'mastered'
                            ? 'Known'
                            : 'Needs revision'}
                      </strong>
                    </span>
                    <span className="text-zinc-500">Click card or press Space to flip</span>
                  </div>
                </div>

                {/* Back Face */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-2xl border border-amber-500/35 bg-[#181B22] p-6 sm:p-8 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                    <span className="font-medium text-orange-300">
                      {currentCard.conceptTag} · Answer
                    </span>
                    <span className="font-mono tabular-nums">
                      Card {safeIndex + 1} / {visibleCards.length}
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="text-base sm:text-lg text-zinc-100 leading-relaxed">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                    <span>Rate recall below</span>
                    <span className="text-zinc-500">Click card or press Space to flip back</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {currentCard.hint && !isFlipped && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                aria-expanded={showHint}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
              {showHint && <span className="text-xs text-zinc-300">{currentCard.hint}</span>}
            </div>
          )}

          {/* Navigation & Knowledge Rating */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous flashcard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#14161B] px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next flashcard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#14161B] px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkStatus('review')}
                className={`flex-1 sm:flex-none rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  currentStatus === 'review'
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                    : 'border-zinc-800 bg-[#14161B] text-zinc-200 hover:border-amber-500/50 hover:text-amber-200'
                }`}
              >
                Needs Revision
              </button>
              <button
                type="button"
                onClick={() => handleMarkStatus('mastered')}
                className={`flex-1 sm:flex-none rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  currentStatus === 'mastered'
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200'
                    : 'border-zinc-800 bg-[#14161B] text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-200'
                }`}
              >
                Mark Known
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
