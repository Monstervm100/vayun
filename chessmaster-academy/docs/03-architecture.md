# ChessMaster Academy — System Architecture

## 1. High-level architecture

```
┌────────────────────────────── Browser ──────────────────────────────┐
│  Next.js (React 18, TypeScript, Tailwind)                           │
│  ├─ App Router pages (home, learn, tactics, play, analyze, coach…)  │
│  ├─ chess.js        — rules, legality, PGN/FEN                      │
│  ├─ react-chessboard — interactive board UI                         │
│  ├─ Stockfish WASM  — Web Worker: play levels, hints, analysis      │
│  ├─ Zustand store   — profile, progress, SRS, gamification          │
│  └─ Sync layer      — localStorage (guest) ⇄ REST API (signed in)   │
└───────────────┬─────────────────────────────────────────────────────┘
                │ HTTPS / JSON (OpenAPI)
┌───────────────▼─────────────────────────────────────────────────────┐
│  FastAPI (Python 3.12)                                              │
│  ├─ /auth      — email+password, Google OAuth, JWT access/refresh   │
│  ├─ /users     — profile, roadmap, settings, roles                  │
│  ├─ /progress  — lessons, puzzles, SRS items, gamification state    │
│  ├─ /games     — store games + analysis summaries                   │
│  ├─ /family    — parent↔child links, weekly reports                 │
│  ├─ /leaderboard, /content (admin CRUD)                             │
│  └─ SQLAlchemy 2.0 + Alembic                                        │
└──────┬──────────────────────────────┬───────────────────────────────┘
       │                              │
┌──────▼───────┐              ┌───────▼──────┐
│ PostgreSQL   │              │ Redis        │
│ (SQLite dev) │              │ cache/queues │
└──────────────┘              └──────────────┘
```

**Key decision — client-side engine.** Stockfish runs as WASM in a Web Worker in the
browser. Play, hints, and post-game analysis need zero server compute, work offline,
and scale for free. The server stores *results* (games, analysis summaries, progress),
not engine sessions.

**Key decision — guest-first sync.** All progress lives in a versioned client store
persisted to localStorage. On sign-in it merges to the server (last-write-wins per
key, additive for XP/history). The app is fully usable before creating an account —
critical for children and school labs.

## 2. Database ER diagram

```mermaid
erDiagram
    USER ||--o{ GAME : plays
    USER ||--o{ LESSON_PROGRESS : tracks
    USER ||--o{ PUZZLE_ATTEMPT : attempts
    USER ||--o{ SRS_ITEM : reviews
    USER ||--o{ ACHIEVEMENT_UNLOCK : earns
    USER ||--o| GAMIFICATION_STATE : has
    USER ||--o| ROADMAP : follows
    FAMILY_LINK }o--|| USER : parent
    FAMILY_LINK }o--|| USER : child
    LESSON ||--o{ LESSON_PROGRESS : "progressed by"
    PUZZLE ||--o{ PUZZLE_ATTEMPT : "attempted by"
    GAME ||--o| GAME_ANALYSIS : "analyzed as"
    ACHIEVEMENT ||--o{ ACHIEVEMENT_UNLOCK : "unlocked by"

    USER {
        uuid id PK
        string email UK
        string password_hash "null for OAuth"
        string google_sub UK "null for email"
        string display_name
        string role "student|parent|teacher|admin"
        int age
        string experience_level
        int current_rating
        int target_rating
        string favorite_opening
        int weekly_goal_minutes
        int daily_minutes
        string learning_style
        datetime created_at
    }
    GAME {
        uuid id PK
        uuid user_id FK
        string pgn
        string result
        string color
        int engine_level
        string time_control
        datetime played_at
    }
    GAME_ANALYSIS {
        uuid id PK
        uuid game_id FK
        float accuracy
        int best_moves
        int mistakes
        int blunders
        int missed_wins
        json move_classifications
        json phase_summaries
        string recommended_lesson_id
    }
    LESSON {
        string id PK
        int level
        int sort_order
        string title
        json steps "explain/animate/practice/quiz/challenge"
        bool published
    }
    LESSON_PROGRESS {
        uuid user_id FK
        string lesson_id FK
        string status "locked|available|in_progress|complete"
        int quiz_score
        datetime completed_at
    }
    PUZZLE {
        string id PK
        string fen
        json solution_san
        string theme
        int rating
        string source
    }
    PUZZLE_ATTEMPT {
        uuid id PK
        uuid user_id FK
        string puzzle_id FK
        bool solved
        int time_ms
        datetime attempted_at
    }
    SRS_ITEM {
        uuid id PK
        uuid user_id FK
        string kind "puzzle|game_mistake|concept"
        json payload "fen, correct line, explanation"
        float ease
        int interval_days
        datetime due_at
        int lapses
    }
    GAMIFICATION_STATE {
        uuid user_id PK
        int xp
        int level
        int coins
        int streak_days
        date last_active_date
        int streak_freezes
        json missions
    }
    ROADMAP {
        uuid user_id PK
        json milestones
        string current_focus
        datetime generated_at
    }
    ACHIEVEMENT {
        string id PK
        string title
        string description
        string icon
        json criteria
    }
    ACHIEVEMENT_UNLOCK {
        uuid user_id FK
        string achievement_id FK
        datetime unlocked_at
    }
    FAMILY_LINK {
        uuid parent_id FK
        uuid child_id FK
        string status "pending|active"
    }
```

## 3. API design (REST, `/api/v1`)

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /auth/register` | Email signup → tokens | — |
| `POST /auth/login` | Email login → tokens | — |
| `POST /auth/google` | Exchange Google ID token → tokens | — |
| `POST /auth/refresh` | Rotate refresh token | refresh |
| `GET /users/me` · `PATCH /users/me` | Profile + onboarding fields | access |
| `GET/PUT /users/me/roadmap` | Personalized roadmap | access |
| `GET/PUT /progress/sync` | Bulk client-state sync (versioned blob + server merge) | access |
| `GET /progress/lessons` · `PUT /progress/lessons/{id}` | Lesson progress | access |
| `POST /progress/puzzle-attempts` | Record attempt (updates puzzle rating) | access |
| `GET /srs/due` · `POST /srs/review` | Spaced-repetition queue | access |
| `POST /games` · `GET /games` · `GET /games/{id}` | Store/list games + analysis | access |
| `GET /gamification` · `POST /gamification/events` | XP/coins/streak events | access |
| `GET /leaderboard?scope=weekly_xp` | Leaderboards | access |
| `POST /family/invite` · `POST /family/accept` | Parent↔child link | access |
| `GET /family/children/{id}/report?week=` | Parent weekly report (JSON, printable client-side) | parent |
| `GET/POST/PUT/DELETE /content/{lessons,puzzles,openings,achievements}` | Admin CMS | admin |
| `GET /healthz` | Liveness | — |

Errors: RFC 7807 problem+json. All endpoints documented via auto-generated Swagger at `/docs`.

## 4. Frontend folder structure

```
frontend/
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ page.tsx             # Home (hero, daily progress, continue learning…)
│  │  ├─ onboarding/
│  │  ├─ dashboard/
│  │  ├─ learn/               # path overview + /learn/[lessonId]
│  │  ├─ tactics/
│  │  ├─ checkmates/
│  │  ├─ openings/            # + /openings/[openingId]
│  │  ├─ endgames/
│  │  ├─ play/
│  │  ├─ analysis/[gameId]/
│  │  ├─ coach/               # AI coach chat + session generator
│  │  ├─ review/              # SRS due queue
│  │  ├─ progress/            # analytics
│  │  ├─ parents/
│  │  └─ admin/
│  ├─ components/
│  │  ├─ board/               # ChessBoard wrapper, arrows, highlights
│  │  ├─ lesson/              # LessonPlayer, Quiz, GuidedPractice
│  │  └─ ui/                  # Cards, ProgressRing, StatTile, Badge…
│  ├─ engine/                 # stockfish worker client, evaluation, classification
│  ├─ lib/                    # coach logic, srs, gamification, analysis, sync
│  ├─ data/                   # lessons, puzzles (verified), openings, endgames, achievements
│  └─ store/                  # Zustand persisted store
└─ public/engine/             # stockfish wasm assets
```

## 5. Backend folder structure

```
backend/
├─ app/
│  ├─ main.py                 # FastAPI app, CORS, routers, /docs
│  ├─ core/                   # config, security (JWT, hashing), deps
│  ├─ models/                 # SQLAlchemy models (§2)
│  ├─ schemas/                # Pydantic v2 schemas
│  ├─ api/                    # routers: auth, users, progress, games, srs,
│  │                          #  gamification, leaderboard, family, content
│  └─ services/               # merge/sync, reports, ratings
├─ tests/
├─ alembic/
└─ Dockerfile
```

## 6. Security & privacy

- Argon2 password hashing; JWT HS256 dev / RS256 prod; refresh rotation with reuse detection.
- RBAC middleware: student/parent/teacher/admin.
- Children: no free-text public fields, display names moderated, no DMs; parent consent
  captured at family-link time.
- Rate limiting via Redis (login, sync).

## 7. Deployment

- `docker-compose.yml`: `web` (Next standalone), `api` (uvicorn), `db` (postgres:16), `redis`.
- CI: lint → typecheck → unit tests → integration tests → build images.
- Prod: web on Vercel or containerized behind nginx; API on any container host; managed Postgres.
```
