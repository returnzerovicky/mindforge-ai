import {
  BarChart3,
  BookMarked,
  CheckSquare,
  Flame,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { StudySet, StudyView } from '../types/study';
import { calculateDeckMastery } from '../utils/studyLogic';

interface SidebarProps {
  decks: StudySet[];
  activeDeckId: string;
  activeView: StudyView;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectView: (view: StudyView) => void;
  onSelectDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

const NAV_ITEMS: Array<{ id: StudyView; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'composer', label: 'Create Study Set', icon: Plus },
  { id: 'sets', label: 'My Study Sets', icon: FolderKanban },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Practice Quiz', icon: CheckSquare },
  { id: 'progress', label: 'Learning Progress', icon: BarChart3 },
];

export function Sidebar({
  decks,
  activeDeckId,
  activeView,
  isOpenMobile,
  onCloseMobile,
  onSelectView,
  onSelectDeck,
  onDeleteDeck,
}: SidebarProps) {
  const recentDecks = decks.slice(0, 5);

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[#111317] border-r border-zinc-800/80 text-zinc-200">
      {/* Brand identity */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-800/80">
        <button
          type="button"
          onClick={() => {
            onSelectView('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-amber-400 rounded-lg"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 shadow-sm">
            <Flame className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-zinc-50 whitespace-nowrap">
            MindForge AI
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Primary navigation */}
      <nav aria-label="Primary navigation" className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400 ${
                isActive
                  ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Recent Study Sets */}
      <div className="px-5 pt-4 pb-2 border-t border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-xs font-medium text-zinc-400">Recent Study Sets</h2>
        <span className="font-mono text-xs text-zinc-500 tabular-nums">{decks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {recentDecks.length === 0 ? (
          <div className="px-3 py-4 text-xs text-zinc-500 leading-relaxed flex items-start gap-2">
            <BookMarked className="h-4 w-4 shrink-0 text-zinc-600 mt-0.5" aria-hidden="true" />
            <span>Your generated study sets will appear here for quick access.</span>
          </div>
        ) : (
          recentDecks.map((deck) => {
            const isSelected = deck.id === activeDeckId;
            const mastery = calculateDeckMastery(deck);
            return (
              <div
                key={deck.id}
                className={`group flex items-start gap-1.5 rounded-lg transition-colors duration-150 ${
                  isSelected
                    ? 'bg-zinc-800/85 border border-zinc-700/80'
                    : 'border border-transparent hover:bg-zinc-800/45'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectDeck(deck.id);
                    onCloseMobile();
                  }}
                  className="flex-1 min-w-0 text-left px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-amber-400 rounded-lg"
                >
                  <p className="text-sm font-medium text-zinc-100 truncate">{deck.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400 truncate tabular-nums">
                    {deck.flashcards.length} cards · {deck.quizQuestions.length} quiz ·{' '}
                    {mastery.masteryPercent}%
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDeck(deck.id)}
                  aria-label={`Delete study set ${deck.title}`}
                  className="mt-2 mr-1.5 p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-700/60 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-amber-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-full">{sidebarBody}</aside>

      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Study navigation"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full w-72 max-w-[85vw]">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
