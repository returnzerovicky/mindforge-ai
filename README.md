# MindForge AI

MindForge AI is an AI-powered active-recall learning platform built with React, TypeScript, Vite, Tailwind CSS, Node.js, Express, Zod, and the official Google Gemini JavaScript SDK (`@google/genai`). Users paste study notes or enter any topic to generate schema-validated flashcards and multiple-choice quizzes, track flashcard mastery, retest missed quiz questions, and review learning analytics derived strictly from actual study sessions.

## Features

- **Overview Dashboard**: Real learning metrics (study sets created, flashcards reviewed, quiz attempts, average quiz performance), quiz score trend chart, recent study activity feed, quick-resume deck cards, and an onboarding empty state for new users.
- **Study Composer**: Free-form topic or study notes input (up to 12,000 characters) with live character counter, validation feedback, difficulty depth selector (`Beginner`, `Intermediate`, `Advanced`), configurable flashcard and quiz quantities, sample prompt helpers, cancellation (`AbortController`), and retryable error handling.
- **My Study Sets**: Searchable, filterable library of saved study sets showing key concepts, card mastery progress, and direct Flashcard / Quiz launchers.
- **Interactive Flashcards**: 3D-flipping flashcard stage with keyboard navigation (`Space` to flip, `ArrowLeft`/`ArrowRight` to navigate), hint toggle, shuffle, restart, revision filtering, and `Known` / `Needs Revision` status tracking.
- **Practice Quiz & Targeted Retesting**: One-question-at-a-time multiple-choice quiz with A/B/C/D options, immediate post-selection feedback and explanation, final score breakdown, and a **Retest Incorrect** mode focused exclusively on missed questions.
- **Learning Progress Analytics**: Tracks real study sets created, cards reviewed, quiz attempts, average accuracy, quiz score progression chart, missed quiz questions (weak topics), and chronological activity history.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express, `@google/genai` (`gemini-4-hydrogen`), Zod, Helmet, CORS, dotenv
- **Testing**: Node built-in test runner (`node:test`) with `tsx --test`, TypeScript type checking (`tsc --noEmit`), and Playwright CLI end-to-end browser verification

## Architecture & Gemini Integration

1. **Client (`src/`)**:
   - `src/services/studyApi.ts`: Dedicated `fetch` wrapper with 35s client timeout, `AbortController` cancellation, and defensive payload validation (`validateStudyPayload`).
   - `src/hooks/useStudyWorkspace.ts`: Manages study sets and activity logs in `localStorage`, enforces monotonic `requestSeqRef` stale-response guards so superseded requests never overwrite newer results, and tracks card ratings and quiz history.
   - `src/utils/studyLogic.ts`: Pure, unit-tested domain functions for defensive contract verification, quiz scoring, incorrect-question retest filtering, mastery percentages, weak-topic aggregation, and score trends.
   - `src/components/` & `src/pages/`: Modular UI views (`OverviewView`, `ComposerView`, `StudySetsView`, `FlashcardsView`, `QuizView`, `ProgressView`, `Sidebar`, `HeaderBar`).
2. **Backend (`server.ts`, `server/`)**:
   - `server/config/env.ts`: Loads server configuration from `.env` (`GEMINI_API_KEY`, `PORT`, `REQUEST_TIMEOUT_MS`, `RATE_LIMIT_MAX`, `CORS_ORIGIN`). The API key never leaves the backend.
   - `server/middleware/security.ts` & `errorHandler.ts`: Configures Helmet security headers, CORS policy, 100 KB JSON body limit, sliding-window IP rate limiting, and sanitized error responses.
   - `server/validators/studyValidators.ts`: Zod schemas validating both incoming requests and AI-generated JSON payloads (requiring non-empty arrays, 4 distinct options per question, valid `correctOptionIndex` in `0..3`, and explanations).
   - `server/services/geminiStudyService.ts`: Invokes `gemini-4-hydrogen` with `responseMimeType: "application/json"`, `responseSchema`, `ThinkingLevel.LOW`, timeout/abort propagation, one automatic retry on transient/schema failure, and explicit handling of rate limits (`429`), auth errors, timeouts (`504`), and malformed responses.

## Local Setup & Commands

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` inside `.env` (server-side only). Optional variables:
   - `PORT` (default `3000`)
   - `REQUEST_TIMEOUT_MS` (default `30000`)
   - `RATE_LIMIT_MAX` (default `30`)
   - `CORS_ORIGIN` (comma-separated allowed origins, optional)

3. **Run in development mode** (Express API + Vite middleware on port 3000):
   ```bash
   npm run dev
   ```

4. **Build and start production server** (`npm start`):
   ```bash
   npm run build
   npm start
   ```

5. **Run unit tests and type-checking**:
   ```bash
   npm test
   npm run lint
   ```

## AI Assistance Disclosure

AI assistance (Gemini / LLM coding assistant) was used to scaffold components, design the backend validation layer, author unit tests, and iterate on the UI/UX redesign. All generated code, Zod schemas, API integrations, and interactive workflows were reviewed, tested, and verified locally.

## Known Limitations

- **Browser-Local Persistence**: Study sets and activity logs are stored in browser `localStorage` rather than a multi-user database; clearing browser storage resets saved progress.
- **In-Memory Rate Limiting**: The generation rate limiter uses process memory (`Map`) and resets upon server restart.
- **Text Input Only**: Study generation accepts pasted text or topics up to 12,000 characters; PDF or image file uploads are not implemented.

## Actual Time Spent

- Initial architecture, backend Gemini service, Zod validators, and core MVP: ~2 hours 15 minutes
- UI/UX redesign (deep graphite & warm amber system, Overview dashboard, My Study Sets, Progress analytics & weak-topic tracking, and full QA): ~1 hour 30 minutes
- **Total**: ~3 hours 45 minutes
