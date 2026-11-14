import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import type { QuizAttempt, QuizQuestion, StudySet } from '../types/study';
import { calculateQuizScore, getRetestQuestions } from '../utils/studyLogic';

interface QuizViewProps {
  decks: StudySet[];
  deck: StudySet | null;
  onSelectDeck: (deckId: string) => void;
  onRecordAttempt: (deckId: string, attempt: QuizAttempt) => void;
  onBackToFlashcards: () => void;
  onCreateNew: () => void;
  onLoadSample: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizView({
  decks,
  deck,
  onSelectDeck,
  onRecordAttempt,
  onBackToFlashcards,
  onCreateNew,
  onLoadSample,
}: QuizViewProps) {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [quizMode, setQuizMode] = useState<'full' | 'retest'>('full');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!deck) {
      setActiveQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setQuizMode('full');
      return;
    }
    setActiveQuestions(deck.quizQuestions);
    setQuizMode('full');
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  }, [deck?.id]);

  const currentQuestion = activeQuestions[currentIndex] ?? null;
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const hasAnsweredCurrent = selectedOption !== undefined;

  const scoreSummary = useMemo(
    () => calculateQuizScore(activeQuestions, selectedAnswers),
    [activeQuestions, selectedAnswers],
  );

  if (!deck) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-[#14161B] p-8 sm:p-10 text-center space-y-4">
        <h1 className="font-display text-xl font-semibold text-zinc-100">No quiz selected</h1>
        <p className="text-sm text-zinc-400">
          Generate a study set from your notes or load the sample deck to take a practice quiz.
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

  if (activeQuestions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-[#14161B] p-8 text-center space-y-4">
        <h1 className="font-display text-xl font-semibold text-zinc-100">
          No quiz questions in this deck
        </h1>
        <p className="text-sm text-zinc-400">
          Review the flashcards or create a new study set with quiz questions enabled.
        </p>
        <button
          type="button"
          onClick={onBackToFlashcards}
          className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors"
        >
          Go to Flashcards
        </button>
      </div>
    );
  }

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion || hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleAdvance = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    const summary = calculateQuizScore(activeQuestions, selectedAnswers);
    setIsSubmitted(true);
    onRecordAttempt(deck.id, {
      id: `attempt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: quizMode,
      totalQuestions: summary.total,
      correctCount: summary.correct,
      scorePercent: summary.percentage,
      incorrectQuestionIds: summary.incorrectIds,
    });
  };

  const handleRetakeFullQuiz = () => {
    setActiveQuestions(deck.quizQuestions);
    setQuizMode('full');
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handleRetestIncorrect = () => {
    const missed = getRetestQuestions(deck.quizQuestions, scoreSummary.incorrectIds);
    if (missed.length === 0) return;
    setActiveQuestions(missed);
    setQuizMode('retest');
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    const missedQuestions = getRetestQuestions(activeQuestions, scoreSummary.incorrectIds);

    return (
      <section aria-labelledby="quiz-results-heading" className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-[#14161B] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-400">
                {quizMode === 'retest' ? 'Incorrect Answer Retest Complete' : 'Quiz Complete'} ·{' '}
                {deck.title}
              </p>
              <h1
                id="quiz-results-heading"
                className="font-display text-2xl sm:text-3xl font-semibold text-zinc-50 tabular-nums"
              >
                {scoreSummary.correct} / {scoreSummary.total} Correct ({scoreSummary.percentage}%)
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {missedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleRetestIncorrect}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors whitespace-nowrap"
                >
                  <Target className="h-4 w-4" aria-hidden="true" />
                  <span>Retest {missedQuestions.length} Incorrect</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRetakeFullQuiz}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Retake Full Quiz</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-300">Question Breakdown</h2>
            <ul className="divide-y divide-zinc-800/80">
              {activeQuestions.map((question, idx) => {
                const chosen = selectedAnswers[question.id];
                const isCorrect = chosen === question.correctOptionIndex;
                return (
                  <li key={question.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-100 leading-snug">
                        <span className="font-mono text-zinc-400 mr-2 tabular-nums">
                          {idx + 1}.
                        </span>
                        {question.question}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap shrink-0 ${
                          isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1 pl-5">
                      {!isCorrect && chosen !== undefined && (
                        <p className="text-rose-300">Your answer: {question.options[chosen]}</p>
                      )}
                      <p className="text-emerald-300">
                        Correct answer: {question.options[question.correctOptionIndex]}
                      </p>
                      <p className="text-zinc-400 leading-relaxed">{question.explanation}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

  return (
    <section aria-labelledby="quiz-heading" className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
            <span className="font-medium text-amber-400">
              {quizMode === 'retest' ? 'Retesting Missed Questions' : 'Practice Quiz'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
          </div>
          <h1 id="quiz-heading" className="font-display text-xl font-semibold text-zinc-50 truncate">
            {deck.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {decks.length > 1 && (
            <div>
              <label htmlFor="quiz-deck-select" className="sr-only">
                Switch quiz study set
              </label>
              <select
                id="quiz-deck-select"
                value={deck.id}
                onChange={(e) => onSelectDeck(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-[#14161B] px-3 py-1.5 text-xs font-medium text-zinc-200 focus:border-amber-500 focus:outline-none max-w-[180px]"
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
            onClick={onBackToFlashcards}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#14161B] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Flashcards</span>
          </button>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {currentQuestion && (
        <div className="rounded-2xl border border-zinc-800 bg-[#14161B] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-lg sm:text-xl font-medium text-zinc-50 leading-snug">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3" role="radiogroup" aria-label="Answer choices">
            {currentQuestion.options.map((optionText, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctOptionIndex;

              let styleClasses =
                'border-zinc-800 bg-[#0C0D10] text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900';
              if (hasAnsweredCurrent) {
                if (isCorrectOption) {
                  styleClasses = 'border-emerald-500/60 bg-emerald-950/35 text-emerald-100';
                } else if (isChosen) {
                  styleClasses = 'border-rose-500/60 bg-rose-950/35 text-rose-100';
                } else {
                  styleClasses = 'border-zinc-800/60 bg-[#0C0D10]/60 text-zinc-400';
                }
              }

              return (
                <button
                  key={`${currentQuestion.id}-opt-${idx}`}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-sm sm:text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-amber-400 ${styleClasses} ${
                    hasAnsweredCurrent ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono text-xs font-semibold text-zinc-400 mt-1 shrink-0">
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="leading-snug">{optionText}</span>
                  </div>

                  {hasAnsweredCurrent && isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 shrink-0 whitespace-nowrap">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Correct</span>
                    </span>
                  )}

                  {hasAnsweredCurrent && isChosen && !isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 shrink-0 whitespace-nowrap">
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasAnsweredCurrent && (
            <div className="rounded-xl border border-zinc-800 bg-[#0C0D10] p-4 space-y-2">
              <p className="text-xs font-medium text-amber-400">
                {selectedOption === currentQuestion.correctOptionIndex
                  ? 'Correct explanation'
                  : 'Review explanation'}
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-zinc-400 tabular-nums">
              {Object.keys(selectedAnswers).length} of {activeQuestions.length} answered
            </span>

            <button
              type="button"
              disabled={!hasAnsweredCurrent}
              onClick={handleAdvance}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <span>
                {currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
