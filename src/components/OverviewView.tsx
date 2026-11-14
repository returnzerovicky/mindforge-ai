import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';
import type { StudyActivityItem, StudySet } from '../types/study';
import type { QuizTrendPoint, WorkspaceStats } from '../utils/studyLogic';
import { calculateDeckMastery, formatShortTimestamp } from '../utils/studyLogic';

interface OverviewViewProps {
  decks: StudySet[];
  activities: StudyActivityItem[];
  stats: WorkspaceStats;
  quizTrend: QuizTrendPoint[];
  onCreateStudySet: () => void;
  onLoadSampleDeck: () => void;
  onOpenFlashcards: (deckId: string) => void;
  onOpenQuiz: (deckId: string) => void;
  onOpenProgress: () => void;
  onOpenAllSets: () => void;
}

export function OverviewView({
  decks,
  activities,
  stats,
  quizTrend,
  onCreateStudySet,
  onLoadSampleDeck,
  onOpenFlashcards,
  onOpenQuiz,
  onOpenProgress,
  onOpenAllSets,
}: OverviewViewProps) {
  const recentDecks = decks.slice(0, 4);
  const recentActivities = activities.slice(0, 6);

  return (
    <section aria-labelledby="overview-heading" className="mx-auto max-w-6xl space-y-8">
      {/* Hero / Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-zinc-800/90 bg-[#14161B] p-6 sm:p-7">
        <div className="space-y-2 max-w-2xl">
          <h1
            id="overview-heading"
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 text-balance"
          >
            Active recall workspace
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Turn lecture notes or technical topics into structured flashcards and graded quizzes,
            review missed concepts, and track real mastery over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCreateStudySet}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Create Study Set</span>
          </button>
          {decks.length === 0 && (
            <button
              type="button"
              onClick={onLoadSampleDeck}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition-colors whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Load Sample Deck</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Learning Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-400">Total Study Sets</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.totalDecks}
          </p>
          <p className="text-xs text-zinc-500 tabular-nums">
            {stats.totalCards} {stats.totalCards === 1 ? 'card' : 'cards'} generated
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-400">Flashcards Reviewed</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.reviewedCards}
          </p>
          <p className="text-xs text-zinc-500 tabular-nums">
            {stats.masteredCards} marked known
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-400">Quiz Attempts</p>
          <p className="font-mono text-2xl font-semibold text-zinc-50 tabular-nums">
            {stats.totalQuizzesTaken}
          </p>
          <p className="text-xs text-zinc-500">Completed sessions</p>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-400">Average Performance</p>
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums">
            {stats.averageQuizAccuracy !== null ? `${stats.averageQuizAccuracy}%` : '—'}
          </p>
          <p className="text-xs text-zinc-500">
            {stats.averageQuizAccuracy !== null ? 'Across all graded quizzes' : 'No quiz attempts yet'}
          </p>
        </div>
      </div>

      {/* Empty onboarding state when user has 0 decks */}
      {decks.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/90 bg-[#14161B] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold text-zinc-100">
                Your study library is empty
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                Use Create Study Set above to transform notes into structured recall, or click Load
                Sample Deck to explore flashcards and quizzes immediately.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="space-y-1">
              <p className="font-mono text-xs text-amber-400">01</p>
              <p className="text-sm font-medium text-zinc-100">Paste Notes or Topic</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose difficulty and card counts; MindForge builds structured flashcards and
                quizzes.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs text-amber-400">02</p>
              <p className="text-sm font-medium text-zinc-100">Flip &amp; Rate Flashcards</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mark concepts as Known or Needs Revision with keyboard shortcuts.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs text-amber-400">03</p>
              <p className="text-sm font-medium text-zinc-100">Quiz &amp; Retest Missed Items</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review explanations, track accuracy, and retest incorrect questions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Visualization + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Learning Progress Chart */}
            <div className="lg:col-span-7 rounded-xl border border-zinc-800/90 bg-[#14161B] p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-100">
                    Learning Progress
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {quizTrend.length > 0
                      ? 'Recent quiz accuracy trend and overall card mastery'
                      : 'Card mastery across your study sets'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenProgress}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0"
                >
                  Full analytics
                </button>
              </div>

              {quizTrend.length > 0 ? (
                <div className="space-y-4">
                  <div
                    className="h-44 flex items-end gap-2.5 pt-4 px-1 border-b border-zinc-800"
                    role="img"
                    aria-label={`Bar chart showing last ${quizTrend.length} quiz accuracy scores`}
                  >
                    {quizTrend.map((point, index) => (
                      <div
                        key={point.attemptId}
                        className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
                      >
                        <span className="font-mono text-[11px] text-zinc-300 tabular-nums">
                          {point.scorePercent}%
                        </span>
                        <div className="w-full max-w-[40px] flex-1 flex items-end">
                          <div
                            className={`w-full rounded-t-md transition-all duration-200 ${
                              point.scorePercent >= 75
                                ? 'bg-gradient-to-t from-orange-600 to-amber-400'
                                : 'bg-amber-500/45'
                            }`}
                            style={{ height: `${Math.max(8, point.scorePercent)}%` }}
                            title={`${point.deckTitle}: ${point.scorePercent}%`}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 tabular-nums pb-1">
                          Q{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                    <span>Overall card mastery: {stats.overallMasteryPercent}%</span>
                    <span>
                      {stats.masteredCards} of {stats.totalCards} cards known
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                      <span>Flashcard mastery</span>
                      <span>
                        {stats.masteredCards} / {stats.totalCards} known ({stats.overallMasteryPercent}
                        %)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                        style={{ width: `${stats.overallMasteryPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <BarChart3 className="h-4 w-4 text-zinc-500 shrink-0" aria-hidden="true" />
                    <span>
                      Complete a practice quiz on any study set to chart quiz accuracy over time.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-5 rounded-xl border border-zinc-800/90 bg-[#14161B] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-zinc-100">
                  Recent Activity
                </h2>
                <Clock className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              </div>

              {recentActivities.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 leading-relaxed">
                  No study activity recorded yet. Open flashcards or take a quiz to log progress.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800/70">
                  {recentActivities.map((item) => (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-0.5">
                      <p className="text-xs font-medium text-zinc-200 truncate">{item.deckTitle}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <span className="truncate">{item.detail}</span>
                        <span className="font-mono text-[11px] text-zinc-500 shrink-0 tabular-nums">
                          {formatShortTimestamp(item.timestamp)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Study Sets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-zinc-100">
                Recent Study Sets
              </h2>
              {decks.length > 4 && (
                <button
                  type="button"
                  onClick={onOpenAllSets}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  View all ({decks.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentDecks.map((deck) => {
                const mastery = calculateDeckMastery(deck);
                return (
                  <div
                    key={deck.id}
                    className="rounded-xl border border-zinc-800/90 bg-[#14161B] p-5 flex flex-col justify-between gap-4 hover:border-zinc-700/90 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="capitalize text-amber-400 font-medium">
                          {deck.difficulty}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{deck.flashcards.length} cards</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{deck.quizQuestions.length} quiz</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{mastery.masteryPercent}% mastered</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-zinc-100">
                        {deck.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {deck.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/70">
                      <button
                        type="button"
                        onClick={() => onOpenFlashcards(deck.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <Layers className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                        <span>Flashcards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuiz(deck.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <CheckSquare className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                        <span>Practice Quiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
