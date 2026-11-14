import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, BookOpen, Loader2, RefreshCw, XCircle } from 'lucide-react';
import type { ApiErrorInfo, DifficultyLevel, GenerateStudyInput } from '../types/study';
import { SAMPLE_TOPICS } from '../utils/studyLogic';

interface ComposerViewProps {
  isGenerating: boolean;
  error: ApiErrorInfo | null;
  onGenerate: (input: GenerateStudyInput) => void;
  onCancel: () => void;
  onRetry: () => void;
  onDismissError: () => void;
  onLoadSampleDeck: () => void;
}

const MIN_CHARS = 3;
const MAX_CHARS = 12000;

const LOADING_STAGES = [
  'Preparing your study materials...',
  'Generating flashcards...',
  'Building your practice quiz...',
  'Validating study content...',
  'Saving your progress...',
] as const;

export function ComposerView({
  isGenerating,
  error,
  onGenerate,
  onCancel,
  onRetry,
  onDismissError,
  onLoadSampleDeck,
}: ComposerViewProps) {
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [flashcardCount, setFlashcardCount] = useState<number>(6);
  const [quizCount, setQuizCount] = useState<number>(5);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setLoadingStageIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingStageIndex((prev) => (prev + 1 < LOADING_STAGES.length ? prev + 1 : prev));
    }, 2800);
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const trimmedLength = content.trim().length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmedLength < MIN_CHARS) {
      setValidationMessage('Enter a topic or paste at least 3 characters of study notes.');
      return;
    }
    if (trimmedLength > MAX_CHARS) {
      setValidationMessage(`Study notes must be ${MAX_CHARS.toLocaleString()} characters or fewer.`);
      return;
    }

    setValidationMessage(null);
    onGenerate({
      content: content.trim(),
      difficulty,
      flashcardCount,
      quizCount,
    });
  };

  const applySampleTopic = (sample: (typeof SAMPLE_TOPICS)[number]) => {
    setContent(sample.content);
    setDifficulty(sample.difficulty);
    setValidationMessage(null);
    onDismissError();
  };

  return (
    <section aria-labelledby="composer-heading" className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1
          id="composer-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 text-balance"
        >
          Create a structured study set
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Enter any topic or paste your lecture notes below. MindForge AI builds structured
          flashcards and multiple-choice questions matched to your chosen difficulty.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-rose-200">
                Study generation could not be completed
              </p>
              <p className="text-sm text-rose-300/90 leading-relaxed">{error.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {error.retryable && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-500/30 transition-colors whitespace-nowrap"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDismissError}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 transition-colors whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-zinc-800/90 bg-[#14161B] p-5 sm:p-6 space-y-6"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="study-notes-input" className="text-sm font-medium text-zinc-200">
              Topic or Study Notes
            </label>
            <span className="font-mono text-xs text-zinc-400 tabular-nums">
              {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
            </span>
          </div>
          <textarea
            id="study-notes-input"
            name="content"
            rows={6}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (validationMessage) setValidationMessage(null);
            }}
            placeholder="Paste lecture notes, textbook paragraphs, or enter a focused topic (e.g., 'PostgreSQL B-tree vs GIN indexing and partial indexes')..."
            aria-describedby={validationMessage ? 'study-notes-error' : 'study-notes-guidance'}
            aria-invalid={Boolean(validationMessage)}
            className="w-full rounded-xl border border-zinc-800 bg-[#0C0D10] px-4 py-3 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {validationMessage ? (
              <p id="study-notes-error" role="alert" className="text-xs font-medium text-rose-400">
                {validationMessage}
              </p>
            ) : (
              <p id="study-notes-guidance" className="text-xs text-zinc-500">
                Tip: Include definitions, mechanisms, or key comparisons for sharper quiz distractors.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Sample prompts:</span>
          {SAMPLE_TOPICS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => applySampleTopic(sample)}
              className="rounded-md border border-zinc-800 bg-[#0C0D10] px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors whitespace-nowrap"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.45fr_1fr_1fr] gap-4 pt-3 border-t border-zinc-800/80">
          <div className="space-y-1.5">
            <span id="difficulty-label" className="block text-xs font-medium text-zinc-300">
              Difficulty Depth
            </span>
            <div
              role="group"
              aria-labelledby="difficulty-label"
              className="grid grid-cols-3 gap-1 rounded-lg bg-[#0C0D10] p-1 border border-zinc-800"
            >
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    aria-pressed={active}
                    className={`rounded-md py-1.5 px-2.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
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

          <div className="space-y-1.5">
            <label
              htmlFor="flashcard-count-select"
              className="block text-xs font-medium text-zinc-300"
            >
              Flashcard Quantity
            </label>
            <select
              id="flashcard-count-select"
              value={flashcardCount}
              onChange={(e) => setFlashcardCount(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-800 bg-[#0C0D10] px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 tabular-nums"
            >
              <option value={4}>4 flashcards</option>
              <option value={6}>6 flashcards</option>
              <option value={8}>8 flashcards</option>
              <option value={10}>10 flashcards</option>
              <option value={12}>12 flashcards</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quiz-count-select" className="block text-xs font-medium text-zinc-300">
              Quiz Questions
            </label>
            <select
              id="quiz-count-select"
              value={quizCount}
              onChange={(e) => setQuizCount(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-800 bg-[#0C0D10] px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 tabular-nums"
            >
              <option value={3}>3 questions</option>
              <option value={5}>5 questions</option>
              <option value={8}>8 questions</option>
              <option value={10}>10 questions</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onLoadSampleDeck}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load built-in Sample Deck instead</span>
          </button>

          <div className="flex items-center gap-3">
            {isGenerating && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors whitespace-nowrap"
              >
                <XCircle className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Generating Study Set...</span>
                </>
              ) : (
                <>
                  <span>Generate Study Set</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {isGenerating && (
        <div
          aria-live="polite"
          className="rounded-xl border border-zinc-800 bg-[#14161B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-zinc-200">
              {LOADING_STAGES[loadingStageIndex]}
            </p>
            <span className="font-mono text-xs text-amber-400 whitespace-nowrap shrink-0">
              MindForge
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            <div className="h-24 rounded-lg bg-zinc-800/70" />
            <div className="h-24 rounded-lg bg-zinc-800/70" />
          </div>
        </div>
      )}
    </section>
  );
}
