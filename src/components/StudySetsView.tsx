import { useMemo, useState } from 'react';
import { CheckSquare, Layers, Search, Trash2 } from 'lucide-react';
import type { DifficultyLevel, StudySet } from '../types/study';
import { calculateDeckMastery, formatShortTimestamp } from '../utils/studyLogic';

interface StudySetsViewProps {
  decks: StudySet[];
  onOpenFlashcards: (deckId: string) => void;
  onOpenQuiz: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onCreateNew: () => void;
  onLoadSample: () => void;
}

export function StudySetsView({
  decks,
  onOpenFlashcards,
  onOpenQuiz,
  onDeleteDeck,
  onCreateNew,
  onLoadSample,
}: StudySetsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | DifficultyLevel>('all');

  const filteredDecks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      if (difficultyFilter !== 'all' && deck.difficulty !== difficultyFilter) {
        return false;
      }
      if (!query) return true;
      const inTitle = deck.title.toLowerCase().includes(query);
      const inSummary = deck.summary.toLowerCase().includes(query);
      const inConcepts = deck.keyConcepts.some((c) => c.toLowerCase().includes(query));
      return inTitle || inSummary || inConcepts;
    });
  }, [decks, searchQuery, difficultyFilter]);

  return (
    <section aria-labelledby="study-sets-heading" className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1
          id="study-sets-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50"
        >
          My Study Sets
        </h1>
        <p className="text-sm text-zinc-400">
          Browse, search, and launch flashcards or quizzes from your saved decks.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
            aria-hidden="true"
          />
          <label htmlFor="study-sets-search" className="sr-only">
            Search study sets
          </label>
          <input
            id="study-sets-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or concept..."
            className="w-full rounded-lg border border-zinc-800 bg-[#14161B] pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by difficulty"
          className="flex items-center gap-1 rounded-lg bg-[#14161B] p-1 border border-zinc-800 overflow-x-auto"
        >
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const active = difficultyFilter === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyFilter(level)}
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty States or Deck Grid */}
      {decks.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#14161B] p-10 text-center space-y-4">
          <h2 className="font-display text-lg font-semibold text-zinc-100">
            No study sets created yet
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Create a custom study set from your notes or load the sample deck to explore.
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
      ) : filteredDecks.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#14161B] p-8 text-center space-y-3">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            No matching study sets
          </h2>
          <p className="text-sm text-zinc-400">
            Try clearing your search filter or switching difficulty levels.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDifficultyFilter('all');
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecks.map((deck) => {
            const mastery = calculateDeckMastery(deck);
            const latestQuiz = deck.quizHistory[0] ?? null;

            return (
              <article
                key={deck.id}
                className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="capitalize text-amber-400 font-medium">
                        {deck.difficulty}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{deck.flashcards.length} cards</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{deck.quizQuestions.length} quiz</span>
                      {deck.isSample && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-zinc-300">Sample</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDeck(deck.id)}
                      aria-label={`Delete study set ${deck.title}`}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <h2 className="font-display text-lg font-semibold text-zinc-50 leading-snug">
                    {deck.title}
                  </h2>

                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                    {deck.summary}
                  </p>

                  <p className="text-xs text-zinc-500 truncate">
                    Concepts: {deck.keyConcepts.join(' · ')}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                    <span>Mastery: {mastery.masteryPercent}%</span>
                    <span>
                      {latestQuiz
                        ? `Last quiz: ${latestQuiz.scorePercent}%`
                        : formatShortTimestamp(deck.createdAt)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                      style={{ width: `${mastery.masteryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenFlashcards(deck.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                      <Layers className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                      <span>Study Flashcards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenQuiz(deck.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                      <span>Practice Quiz</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
