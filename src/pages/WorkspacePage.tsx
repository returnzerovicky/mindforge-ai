import { useState } from 'react';
import { ComposerView } from '../components/ComposerView';
import { FlashcardsView } from '../components/FlashcardsView';
import { HeaderBar } from '../components/HeaderBar';
import { OverviewView } from '../components/OverviewView';
import { ProgressView } from '../components/ProgressView';
import { QuizView } from '../components/QuizView';
import { Sidebar } from '../components/Sidebar';
import { StudySetsView } from '../components/StudySetsView';
import { useStudyWorkspace } from '../hooks/useStudyWorkspace';

export function WorkspacePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    decks,
    activities,
    activeDeck,
    activeDeckId,
    activeView,
    setActiveView,
    workspaceStats,
    weakTopics,
    quizTrend,
    isGenerating,
    generationError,
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
  } = useStudyWorkspace();

  return (
    <div className="h-dvh min-h-screen flex overflow-hidden bg-[#0C0D10] text-zinc-100">
      <Sidebar
        decks={decks}
        activeDeckId={activeDeckId}
        activeView={activeView}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectView={setActiveView}
        onSelectDeck={(deckId) => {
          selectDeck(
            deckId,
            activeView === 'overview' || activeView === 'composer' || activeView === 'sets' || activeView === 'progress'
              ? 'flashcards'
              : undefined,
          );
        }}
        onDeleteDeck={deleteDeck}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <HeaderBar
          activeDeck={activeDeck}
          activeView={activeView}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewStudySet={() => setActiveView('composer')}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {activeView === 'overview' && (
            <OverviewView
              decks={decks}
              activities={activities}
              stats={workspaceStats}
              quizTrend={quizTrend}
              onCreateStudySet={() => setActiveView('composer')}
              onLoadSampleDeck={loadSampleDeck}
              onOpenFlashcards={(deckId) => selectDeck(deckId, 'flashcards')}
              onOpenQuiz={(deckId) => selectDeck(deckId, 'quiz')}
              onOpenProgress={() => setActiveView('progress')}
              onOpenAllSets={() => setActiveView('sets')}
            />
          )}

          {activeView === 'composer' && (
            <ComposerView
              isGenerating={isGenerating}
              error={generationError}
              onGenerate={generateDeck}
              onCancel={cancelGeneration}
              onRetry={retryLastGeneration}
              onDismissError={dismissError}
              onLoadSampleDeck={loadSampleDeck}
            />
          )}

          {activeView === 'sets' && (
            <StudySetsView
              decks={decks}
              onOpenFlashcards={(deckId) => selectDeck(deckId, 'flashcards')}
              onOpenQuiz={(deckId) => selectDeck(deckId, 'quiz')}
              onDeleteDeck={deleteDeck}
              onCreateNew={() => setActiveView('composer')}
              onLoadSample={loadSampleDeck}
            />
          )}

          {activeView === 'flashcards' && (
            <FlashcardsView
              decks={decks}
              deck={activeDeck}
              onSelectDeck={(deckId) => selectDeck(deckId)}
              onUpdateCardStatus={updateCardStatus}
              onResetMastery={resetDeckMastery}
              onSwitchToQuiz={() => setActiveView('quiz')}
              onCreateNew={() => setActiveView('composer')}
              onLoadSample={loadSampleDeck}
            />
          )}

          {activeView === 'quiz' && (
            <QuizView
              decks={decks}
              deck={activeDeck}
              onSelectDeck={(deckId) => selectDeck(deckId)}
              onRecordAttempt={recordQuizAttempt}
              onBackToFlashcards={() => setActiveView('flashcards')}
              onCreateNew={() => setActiveView('composer')}
              onLoadSample={loadSampleDeck}
            />
          )}

          {activeView === 'progress' && (
            <ProgressView
              decks={decks}
              activities={activities}
              stats={workspaceStats}
              weakTopics={weakTopics}
              quizTrend={quizTrend}
              onOpenFlashcards={(deckId) => selectDeck(deckId, 'flashcards')}
              onOpenQuiz={(deckId) => selectDeck(deckId, 'quiz')}
              onCreateNew={() => setActiveView('composer')}
              onLoadSample={loadSampleDeck}
            />
          )}
        </main>
      </div>
    </div>
  );
}
