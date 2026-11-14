import { CheckSquare, Layers, RotateCcw, Target } from 'lucide-react';
import type { StudyActivityItem, StudySet } from '../types/study';
import type { QuizTrendPoint, WeakTopicItem, WorkspaceStats } from '../utils/studyLogic';
import { calculateDeckMastery, formatShortTimestamp } from '../utils/studyLogic';

interface ProgressViewProps {
  decks: StudySet[];
  activities: StudyActivityItem[];
  stats: WorkspaceStats;
  weakTopics: WeakTopicItem[];
  quizTrend: QuizTrendPoint[];
  onOpenFlashcards: (deckId: string) => void;
  onOpenQuiz: (deckId: string) => void;
  onCreateNew: () => void;
  onLoadSample: () => void;
}

export function ProgressView({
  decks,
  activities,
  stats,
  weakTopics,
  quizTrend,
  onOpenFlashcards,
  onOpenQuiz,
  onCreateNew,
  onLoadSample,
}: ProgressViewProps) {
  return (
    <section aria-labelledby="progress-heading" className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1.5">
        <h1
          id="progress-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50"
        >
          Learning Progress
        </h1>
        <p className="text-sm text-zinc-400">
          Analytics derived strictly from your completed flashcard ratings and quiz sessions.
        </p>
      </div>

      {/* Real Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1">
          <p className="text-xs font-medium text-zinc-400">Study Sets Created</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.totalDecks}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1">
          <p className="text-xs font-medium text-zinc-400">Cards Reviewed</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.reviewedCards} / {stats.totalCards}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1">
          <p className="text-xs font-medium text-zinc-400">Quiz Attempts</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.totalQuizzesTaken}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1">
          <p className="text-xs font-medium text-zinc-400">Average Accuracy</p>
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums">
            {stats.averageQuizAccuracy !== null ? `${stats.averageQuizAccuracy}%` : '—'}
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#14161B] p-10 text-center space-y-4">
          <h2 className="font-display text-lg font-semibold text-zinc-100">
            No learning analytics yet
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Create a study set or load the sample deck to start tracking flashcard mastery and quiz
            performance.
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Load Sample Deck</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Quiz Accuracy Trend + Weak Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 rounded-xl border border-zinc-800/90 bg-[#14161B] p-6 space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-zinc-100">
                  Quiz Score History
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Accuracy across your recent full quizzes and retests
                </p>
              </div>

              {quizTrend.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 leading-relaxed">
                  No quiz attempts recorded yet. Take a practice quiz on any study set to see score
                  progression here.
                </p>
              ) : (
                <div
                  className="h-48 flex items-end gap-3 pt-4 border-b border-zinc-800"
                  role="img"
                  aria-label="Quiz accuracy chart"
                >
                  {quizTrend.map((point, index) => (
                    <div
                      key={point.attemptId}
                      className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
                    >
                      <span className="font-mono text-[11px] text-zinc-300 tabular-nums">
                        {point.scorePercent}%
                      </span>
                      <div className="w-full max-w-[44px] flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-md ${
                            point.scorePercent >= 75
                              ? 'bg-gradient-to-t from-orange-600 to-amber-400'
                              : 'bg-amber-500/45'
                          }`}
                          style={{ height: `${Math.max(8, point.scorePercent)}%` }}
                          title={`${point.deckTitle} (${point.mode}): ${point.scorePercent}%`}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 pb-1">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missed Questions / Weak Topics */}
            <div className="lg:col-span-6 rounded-xl border border-zinc-800/90 bg-[#14161B] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-100">
                    Missed Quiz Questions
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Questions missed in previous quiz attempts for targeted review
                  </p>
                </div>
                <Target className="h-4 w-4 text-amber-400" aria-hidden="true" />
              </div>

              {weakTopics.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 leading-relaxed">
                  No missed quiz questions recorded yet. Incorrect quiz responses will surface here
                  for targeted practice.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800/80 max-h-60 overflow-y-auto pr-1">
                  {weakTopics.slice(0, 6).map((item) => (
                    <li key={`${item.deckId}-${item.questionId}`} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <span className="truncate font-medium text-amber-400">{item.deckTitle}</span>
                        <span className="font-mono shrink-0 tabular-nums">
                          Missed {item.missCount}x
                        </span>
                      </div>
                      <p className="text-sm text-zinc-100 leading-snug">{item.question}</p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-emerald-300 truncate">
                          Answer: {item.correctAnswer}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenQuiz(item.deckId)}
                          className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap shrink-0"
                        >
                          Practice Deck
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Deck Mastery Breakdown */}
          <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-zinc-100">
                Study Set Mastery Breakdown
              </h2>
              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                {stats.totalQuizzesTaken} quiz{' '}
                {stats.totalQuizzesTaken === 1 ? 'attempt' : 'attempts'}
              </span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {decks.map((deck) => {
                const mastery = calculateDeckMastery(deck);
                const latestAttempt = deck.quizHistory[0] ?? null;

                return (
                  <div
                    key={deck.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/25 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="capitalize text-amber-400 font-medium">
                          {deck.difficulty}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {mastery.masteredCount}/{mastery.totalCards} known
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {mastery.reviewCount} needing revision
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {latestAttempt
                            ? `Last quiz: ${latestAttempt.scorePercent}%`
                            : 'No quiz taken'}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-medium text-zinc-100 truncate">
                        {deck.title}
                      </h3>
                      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                          style={{ width: `${mastery.masteryPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenFlashcards(deck.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                      >
                        <Layers className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                        <span>Review Cards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuiz(deck.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/12 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                      >
                        <CheckSquare className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                        <span>Take Quiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Study Activity Timeline */}
          {activities.length > 0 && (
            <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-6 space-y-4">
              <h2 className="font-display text-sm font-semibold text-zinc-100">
                Recent Study Activity
              </h2>
              <ul className="divide-y divide-zinc-800/80">
                {activities.slice(0, 8).map((act) => (
                  <li
                    key={act.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-200">{act.deckTitle}</span>
                      <span className="text-zinc-500 mx-2" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-zinc-400">{act.detail}</span>
                    </div>
                    <span className="font-mono text-zinc-500 shrink-0 tabular-nums">
                      {formatShortTimestamp(act.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
