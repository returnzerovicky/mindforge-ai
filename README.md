# MindForge AI 🧠

### AI-Powered Active Recall & Intelligent Learning Platform

<p align="center">
  <strong>Transform study notes into smarter learning experiences.</strong>
  <br/>
  Generate AI-powered flashcards, practice quizzes, and track learning progress with Gemini AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-API-black?logo=express" />
  <img src="https://img.shields.io/badge/Google-Gemini%20AI-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Tests-11%20Passing-success" />
</p>

---

## 📌 Overview

**MindForge AI** is an AI-powered learning platform designed to make studying more effective through active recall, self-assessment, and performance tracking.

Instead of manually creating study materials, learners can enter a topic or paste lecture notes and generate structured flashcards and multiple-choice quizzes using Google's Gemini AI.

The platform combines AI-powered content generation with interactive learning tools and progress analytics to help users identify knowledge gaps, reinforce weak concepts, and monitor their learning journey.

### 🎯 Problem Statement

Traditional studying often relies heavily on passive reading and repetitive revision, making it difficult to measure actual understanding.

MindForge AI addresses this challenge by transforming learning materials into interactive study experiences that encourage active participation and self-assessment.

---

## ✨ Key Features

### 1. 🤖 AI-Powered Study Generation

* Generate structured flashcards from topics or lecture notes.
* Automatically create multiple-choice practice questions.
* Choose between Beginner, Intermediate, and Advanced difficulty.
* Configure the number of flashcards and quiz questions.
* Use Google Gemini AI for intelligent content generation.

### 2. 🃏 Interactive Flashcards

* Interactive 3D card-flipping experience.
* Front-and-back question and answer views.
* Built-in hints for difficult concepts.
* Mark cards as **Known** or **Needs Revision**.
* Shuffle and restart study sessions.
* Filter cards requiring additional revision.
* Keyboard navigation using Space and arrow keys.

### 3. 📝 Intelligent Practice Quizzes

* Interactive multiple-choice questions.
* Four answer options per question.
* Immediate answer feedback and explanations.
* Automatic score calculation.
* Detailed quiz result breakdown.
* Retest incorrect questions without repeating the entire quiz.

### 4. 📊 Learning Analytics Dashboard

* Track total study sets created.
* Monitor flashcards reviewed and mastered.
* Measure quiz attempts and average accuracy.
* Visualize quiz performance trends.
* Identify frequently missed questions.
* Track recent study activity.

### 5. 📚 Study Set Management

* Browse saved study sets.
* Search and filter study materials.
* View study difficulty and mastery progress.
* Launch flashcard and quiz sessions directly.
* Includes a built-in sample deck for exploring the application.

### 6. 🛡️ Backend Reliability & Security

* Server-side Gemini API integration.
* API key protected using environment variables.
* Request validation using Zod.
* AI-generated response validation.
* Helmet security headers.
* Configurable CORS protection.
* IP-based sliding-window rate limiting.
* Request cancellation and timeout handling.
* Structured and sanitized API error responses.

---

## 🛠️ Technology Stack

| Category         | Technologies                       |
| ---------------- | ---------------------------------- |
| Frontend         | React 19, TypeScript               |
| Build Tool       | Vite                               |
| Styling          | Tailwind CSS v4                    |
| Icons            | Lucide React                       |
| Backend          | Node.js, Express.js                |
| AI Integration   | Google Gemini API, `@google/genai` |
| Validation       | Zod                                |
| Security         | Helmet, CORS                       |
| Data Persistence | Browser LocalStorage               |
| Testing          | Node.js Test Runner, `tsx`         |
| Code Quality     | TypeScript Compiler                |

---

## 🏗️ System Architecture

MindForge AI follows a modular client-server architecture.

```text
              ┌─────────────────────────┐
              │       User              │
              │  Study Notes / Topics   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   React + TypeScript    │
              │      Frontend           │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    Express REST API     │
              │   Request Validation   │
              │    Rate Limiting       │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    Gemini AI Service   │
              │  Structured JSON Output│
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    Zod Validation      │
              │  Response Verification │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  Generated Study Data  │
              │ Flashcards + Quizzes    │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Learning Workspace   │
              │ Flashcards / Quiz /     │
              │ Progress Analytics     │
              └─────────────────────────┘
```

### AI Generation Workflow

1. User enters a topic or submits study notes.
2. Frontend sends a generation request to the Express API.
3. Backend validates the request using Zod.
4. Gemini AI generates structured study content.
5. Generated JSON is validated against the expected schema.
6. Validated flashcards and quiz questions are returned to the frontend.
7. Users interact with the generated materials and track their progress.

---

## 📂 Project Structure

```text
mindforge-ai/
│
├── server/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   └── studyController.ts
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── security.ts
│   │
│   ├── routes/
│   │   └── studyRoutes.ts
│   │
│   ├── services/
│   │   └── geminiStudyService.ts
│   │
│   └── validators/
│       ├── studyValidators.ts
│       └── studyValidators.test.ts
│
├── src/
│   ├── components/
│   │   ├── ComposerView.tsx
│   │   ├── FlashcardsView.tsx
│   │   ├── HeaderBar.tsx
│   │   ├── OverviewView.tsx
│   │   ├── ProgressView.tsx
│   │   ├── QuizView.tsx
│   │   ├── Sidebar.tsx
│   │   └── StudySetsView.tsx
│   │
│   ├── hooks/
│   │   └── useStudyWorkspace.ts
│   │
│   ├── pages/
│   │   └── WorkspacePage.tsx
│   │
│   ├── services/
│   │   └── studyApi.ts
│   │
│   ├── types/
│   │   └── study.ts
│   │
│   ├── utils/
│   │   ├── studyLogic.ts
│   │   └── studyLogic.test.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── server.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

* Node.js (LTS recommended)
* npm
* Git
* Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/mindforge-ai.git
```

```bash
cd mindforge-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
GEMINI_API_KEY=your_actual_gemini_api_key

PORT=3000

REQUEST_TIMEOUT_MS=60000

RATE_LIMIT_MAX=30

CORS_ORIGIN=""
```

Get your Gemini API key from:

https://aistudio.google.com/apikey

**Security:** Never commit your actual `.env` file or expose your Gemini API key in frontend code.

### 4. Start the development server

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

### 5. Verify backend health

```bash
Invoke-RestMethod http://localhost:3000/api/health
```

Expected response:

```json
{
  "ok": true,
  "data": {
    "service": "mindforge-ai-api",
    "geminiConfigured": true
  }
}
```

---

## 🧪 Testing & Quality Assurance

The project includes automated tests for important application logic and backend validation.

### Run TypeScript checks

```bash
npm run lint
```

### Run automated tests

```bash
npm test
```

### Build for production

```bash
npm run build
```

### Verified Results

| Quality Check          | Result     |
| ---------------------- | ---------- |
| TypeScript compilation | Passed     |
| Automated test cases   | 11 passed  |
| Failed tests           | 0          |
| Production build       | Successful |
| API health endpoint    | HTTP 200   |
| Gemini configuration   | Verified   |

---

## 🔐 Security Considerations

Security and reliability are important parts of the backend implementation.

* Gemini credentials are stored server-side using environment variables.
* Zod validates incoming requests and generated AI responses.
* Helmet provides HTTP security headers.
* CORS controls allowed origins.
* Rate limiting protects the AI generation endpoint.
* Request cancellation helps avoid unnecessary generation work.
* API errors use structured response formats.
* Client and server request timeouts prevent indefinitely pending operations.

---

## 📈 Engineering Highlights

Some of the key engineering concepts demonstrated in this project:

* Full-stack development using React and Express.
* Third-party AI API integration using Google's Gemini SDK.
* Schema-driven validation of AI-generated JSON.
* REST API development and middleware architecture.
* Asynchronous request management and cancellation.
* Error handling and retry mechanisms.
* Client-side state management using custom React hooks.
* Unit testing of business logic.
* Responsive UI development.
* Git-based version control.

---

## ⚠️ Current Limitations

* Study sets and learning activity are persisted in browser LocalStorage rather than a centralized database.
* Rate limiting currently uses in-memory storage.
* Study material generation supports text input rather than PDF or image uploads.
* User authentication and multi-user account management are not currently implemented.

---

## 🚀 Future Improvements

Potential enhancements include:

* User authentication and personalized study profiles.
* Database integration using PostgreSQL or MongoDB.
* PDF and document upload support.
* Cloud-based study synchronization.
* Advanced spaced repetition scheduling.
* Personalized AI learning recommendations.
* Exporting flashcards and quizzes.
* More detailed learning analytics.

---

## 👨‍💻 Developer

**Developed as a full-stack AI-powered learning platform project.**

MindForge AI demonstrates the integration of modern frontend development, backend API engineering, AI-powered content generation, data validation, security middleware, and automated testing.

---

## 📄 License

This project is available for educational and portfolio purposes. Add a formal open-source license if you intend to distribute it under specific reuse permissions.

---

<p align="center">
  <strong>MindForge AI — Learn Smarter. Recall Better. Grow Further.</strong>
</p>
