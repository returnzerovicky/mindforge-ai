import { Menu, Plus } from 'lucide-react';
import type { StudySet, StudyView } from '../types/study';

interface HeaderBarProps {
  activeDeck: StudySet | null;
  activeView: StudyView;
  onOpenMobileMenu: () => void;
  onNewStudySet: () => void;
}

const VIEW_LABELS: Record<StudyView, string> = {
  overview: 'Overview',
  composer: 'Create Study Set',
  sets: 'My Study Sets',
  flashcards: 'Flashcards',
  quiz: 'Practice Quiz',
  progress: 'Learning Progress',
};

export function HeaderBar({
  activeDeck,
  activeView,
  onOpenMobileMenu,
  onNewStudySet,
}: HeaderBarProps) {
  const showActiveDeckBreadcrumb =
    activeDeck && (activeView === 'flashcards' || activeView === 'quiz');

  return (
    <header className="shrink-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-[#0C0D10] px-4 sm:px-6 lg:px-8 h-16">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-zinc-800 bg-[#14161B] text-zinc-300 hover:text-white hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-amber-400 shrink-0"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-zinc-400 font-medium whitespace-nowrap shrink-0">
            {VIEW_LABELS[activeView]}
          </span>
          {showActiveDeckBreadcrumb && (
            <>
              <span className="text-zinc-600" aria-hidden="true">
                /
              </span>
              <span className="text-zinc-100 font-medium truncate">{activeDeck.title}</span>
            </>
          )}
        </div>
      </div>

      {activeView !== 'composer' && activeView !== 'overview' && (
        <button
          type="button"
          onClick={onNewStudySet}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-500 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create Study Set</span>
        </button>
      )}
    </header>
  );
}
