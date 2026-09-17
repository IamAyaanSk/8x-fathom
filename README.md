# 8x Fathom AI

> An autonomous AI meeting notetaker and intelligence platform inspired by [fathom.ai](https://fathom.ai). Rebuilt with a modern full-stack architecture featuring calendar sync, automated bot dispatch, dual-worker artifact ingestion, pgvector semantic search, and streaming RAG intelligence.

🎬 **[Watch the walkthrough here](https://drive.google.com/file/d/1OPYe6P-3xtpgyYdhIc26uHsqfqFXDr-S/view)**

> **Hey, reader!** 👋
>
> This project was built within a 24-hour timeframe, so while the core functionality is complete and the project is live and working, there is definitely room for improvement in terms of code organization, structure, and overall code quality.
>
> Most of the available time was intentionally spent building and validating the core features and functionality that matter most for the project.
>
> I plan to continue refining the codebase in a separate branch, focusing on cleanup, refactoring, and improving maintainability before merging those changes back into the main branch.
>
> For now, the current version is complete, functional, and live.

---

## Features

- **Google-Native Authentication**: Built on Better Auth with offline refresh tokens and incremental Google Calendar OAuth scope authorization.
- **Real-Time Calendar Sync**: Google Calendar push notifications via webhooks + incremental `syncToken` synchronization + one-click manual "Sync Now".
- **Zero-Click Bot Dispatch**: Automatic bot join for Google Meet prior to start time without manual triggering.
- **Live Call Companion (Ongoing Call)**:
  - Real-time bot connection status indicators (`joining` ➔ `in_waiting_room` ➔ `in_call_recording` ➔ `transcribing` ➔ `completed`).
  - Active call timer.
  - One-click timestamped meeting highlights.
  - Auto-saving debounced meeting scratchpad.
- **Rich Meeting Playback**:
  - Cloudflare R2-hosted video streaming via secure presigned URLs.
  - Interactive transcript with speaker labels, timestamps, and bi-directional video seek synchronization.
- **Automated AI Intelligence**:
  - Executive meeting summary with structured topics.
  - Action items extraction with direct timestamp links.
  - Meeting participant and attendance breakdown.
  - One-click summary regeneration.
- **"Ask Fathom" RAG Assistant**:
  - AI chat interface with streaming responses powered by the Vercel AI SDK.
  - Contextual retrieval using PostgreSQL `pgvector` cosine similarity over transcript chunks.
  - Direct timestamped citations to referenced moments in the call.
- **Public Meeting Sharing**: Generate unique, secure public share links (`/share/$shareSlug`) with read-only video playback, synchronized transcripts, and summaries.

---

## Architectural & Design Decisions

1. **BaaS for Bot & Media Orchestration (MeetingBaas)**:
   - Used MeetingBaas API v2 as the Bot-as-a-Service infrastructure to spin up recording bots. This accelerated development significantly and guaranteed an end-to-end media capture pipeline with maximum feature parity within the time limit.
2. **Web-Native In-Call Companion (In-Browser Scratchpad & Highlights)**:
   - Skipped building a separate desktop companion client for real-time highlights and note-taking. Instead, integrated the live recording state, real-time highlight capture, and debounced scratchpad directly into the browser web application (`/meetings/$id` ongoing tab). This saved engineering overhead while delivering a seamless, responsive, and cross-platform experience.

---

## Calendar Event Tracking

> **Note**: Only Google Calendar events associated with a **Google Meet conference** (containing a valid video conference URL) are tracked and synchronized, as these represent actual online meetings on your calendar where the notetaker bot can join and record.

Make sure your Google Calendar event has **Google Meet video conferencing** added:

![Google Meet Directions](./assets/meet-directions.png)

---

## Architecture

8x Fathom coordinates Google Calendar integration, automated bot orchestration via MeetingBaas, artifact streaming to Cloudflare R2, asynchronous background processing workers, and pgvector embeddings for retrieval-augmented generation (RAG).

```mermaid
flowchart TD
    subgraph External["External Services"]
        GoogleCal["📅 Google Calendar"]
        Baas["🤖 MeetingBaas (Bot BaaS)"]
        LiveMeet["🎥 Live Meeting (Meet)"]
    end

    subgraph CoreBackend["Backend & Database"]
        Backend["⚡ Express 5 API (apps/server)<br/>• Better Auth (OAuth & Calendar Scopes)<br/>• Webhook Ingestion (Svix)<br/>• REST API & Streaming Chat"]
        DB[("🐘 PostgreSQL (Neon + pgvector)<br/>• Meetings, Users, Sessions<br/>• Highlights, Scratchpads, Action Items<br/>• Transcript Chunks & Embeddings")]
    end

    subgraph Storage["Cloud Storage"]
        R2[("🪣 Cloudflare R2 Bucket<br/>• MP4 Video Playback<br/>• Full JSON Transcripts<br/>• Chat Artifacts")]
    end

    subgraph Workers["Async Worker Pipeline (apps/worker)"]
        Scheduler["⏰ Dispatch Scheduler<br/>(FOR UPDATE SKIP LOCKED)"]
        IngestionWorker["📦 Ingestion Worker<br/>(Download Signed URLs ➔ Sync to R2)"]
        SummaryWorker["🧠 AI Summary & Embeddings Worker<br/>(Vercel AI SDK + OpenAI / LM Studio)"]
    end

    subgraph FrontendApp["Frontend (apps/web)"]
        WebUI["💻 React 19 + TanStack Web App<br/>• Live Ongoing Call & Scratchpad<br/>• Synced Video + Interactive Transcript<br/>• Ask Fathom RAG Chatbot<br/>• Public Share Pages"]
    end

    %% Calendar Sync Flow
    GoogleCal -->|"1. Watch Webhook & Sync Events"| Backend
    Backend -->|"Persist Events"| DB

    %% Bot Dispatch
    Scheduler -->|"2. Check Upcoming (Start - Buffer)"| DB
    Scheduler -->|"3. Spin New Bot"| Baas
    Baas -->|"4. Bot Joins Meeting"| LiveMeet

    %% Live updates
    Baas -->|"5. Bot Status Webhook"| Backend
    Backend -->|"Update baasStatus"| DB
    DB <-->|"Poll / Stream Status"| FrontendApp

    %% Artifact Ingestion
    Baas -->|"6. bot.completed (Signed Artifact URLs)"| Backend
    Backend -->|"Set status: importing"| DB
    IngestionWorker -->|"7. Pull Signed URLs"| DB
    IngestionWorker -->|"8. Upload Video & Transcripts"| R2
    IngestionWorker -->|"Set status: pending"| DB

    %% AI Processing
    SummaryWorker -->|"9. Fetch Transcripts"| R2
    SummaryWorker -->|"10. Generate Summary, Action Items & Embeddings"| DB
    SummaryWorker -->|"Set status: ready"| DB

    %% User Interaction & RAG
    FrontendApp <-->|"11. Playback & RAG Queries"| Backend
    Backend -->|"Vector Similarity Search"| DB
    Backend -->|"Presigned Playback URLs"| R2
```

### Lifecycle Stages

| Phase                             | Description                                                                                                                                                                                             |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Calendar Watch**             | User connects Google Calendar via incremental OAuth scopes (`calendar.events.readonly`). Backend sets up Google `events.watch` webhooks and synchronizes meetings with valid conference URLs.           |
| **2. Autonomous Dispatch**        | The background worker cron scans for meetings approaching within the dispatch window (`startTime - buffer`), claims rows via PostgreSQL `FOR UPDATE SKIP LOCKED`, and calls the MeetingBaas Bot API v2. |
| **3. In-Call & Ongoing**          | The bot enters the call room. The user has access to a live Ongoing Call dashboard with elapsed recording timers, one-click timestamped highlights, and a debounced live scratchpad.                    |
| **4. Artifact Ingestion**         | On call completion (`bot.completed`), ephemeral signed URLs are received. The Ingestion Worker copies raw MP4 video, transcripts, and chat logs into our private Cloudflare R2 bucket.                  |
| **5. AI Pipeline & pgvector**     | The AI worker extracts executive summaries, timestamped action items, participant metadata, and calculates high-dimensional vector embeddings for all transcript chunks using pgvector.                 |
| **6. Interactive Playback & RAG** | Ready meetings feature synchronized video playback with auto-scrolling interactive transcripts, shareable links, and an **"Ask Fathom"** RAG chatbot powered by the Vercel AI SDK.                      |

---

## Tech Stack

### Core Frameworks & Tooling

| Domain                   | Technology                                                   | Description                                                    |
| :----------------------- | :----------------------------------------------------------- | :------------------------------------------------------------- |
| **Monorepo**             | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) | Workspaces with pnpm catalogs and cached build pipelines       |
| **Language**             | [TypeScript 6](https://www.typescriptlang.org/)              | ESM everywhere (`NodeNext` resolution, strict type validation) |
| **Linting & Formatting** | [oxlint](https://oxc.rs/) + [oxfmt](https://oxc.rs/)         | Rust-powered high-performance linting and formatting           |

### Frontend (`apps/web`)

| Technology          | Purpose                                                               |
| :------------------ | :-------------------------------------------------------------------- |
| **React 19**        | Modern UI with React Compiler (`babel-plugin-react-compiler`)         |
| **Vite 8**          | Next-generation frontend build tooling and local dev server           |
| **TanStack Router** | Fully type-safe, code-split, file-based client routing                |
| **TanStack Query**  | Asynchronous server state management, caching, and optimistic updates |
| **Tailwind CSS 4**  | Semantic theme tokens and utility styling                             |
| **shadcn/ui**       | Accessible UI primitives built on Radix UI and Lucide Icons           |

### Backend API (`apps/server`)

| Technology      | Purpose                                                                         |
| :-------------- | :------------------------------------------------------------------------------ |
| **Express 5**   | REST API endpoints, streaming responses, and middleware pipeline                |
| **Better Auth** | Authentication engine with Prisma adapter and Google OAuth provider             |
| **Google APIs** | Calendar v3 API client for watch channel registration and event synchronization |

### Background Workers & Processing (`apps/worker`)

| Technology             | Purpose                                                                            |
| :--------------------- | :--------------------------------------------------------------------------------- |
| **Node.js Worker**     | Distributed scheduler with database lock-based task distribution                   |
| **Cloudflare R2**      | S3-compatible persistent object storage for video, audio, and transcript artifacts |
| **@aws-sdk/client-s3** | AWS S3 client and presigned URL generation                                         |

### AI & Database (`packages/ai`, `packages/database`)

| Technology          | Purpose                                                                 |
| :------------------ | :---------------------------------------------------------------------- |
| **Prisma 7**        | ORM with `@prisma/adapter-pg` connection pooling                        |
| **Neon PostgreSQL** | Serverless Postgres database                                            |
| **pgvector**        | Native vector extension for embedding storage and similarity search     |
| **Vercel AI SDK**   | Streaming AI generation, embeddings calculation, and structured outputs |
| **LM Studio**       | LLM providers for summaries, action item extraction, and RAG chat       |

---

## Monorepo Structure

```
8x-fathom/
├── apps/
│   ├── web/                  # React 19 + Vite 8 frontend application
│   ├── server/               # Express 5 API, Better Auth, and webhook handlers
│   └── worker/               # Background task worker (dispatch, R2 ingestion, AI processing)
│
├── packages/
│   ├── ai/                   # Vercel AI SDK integrations, prompt templates, and embeddings
│   ├── api-client/           # Axios-based typed client with TanStack Query hooks
│   ├── api-contract/         # Zod schemas and TypeScript request/response contracts
│   ├── database/             # Prisma schema, migrations, and database client (@repo/db)
│   ├── env/                  # Environment variable schema validation (@repo/env)
│   ├── meeting-dispatch/     # MeetingBaas Bot API v2 client and scheduler lock utilities
│   ├── r2/                   # Cloudflare R2 bucket integration and S3 client helpers
│   ├── shared-validations/   # Shared Zod validation primitives
│   ├── typescript-config/    # Shared base tsconfig configurations
│   └── ui-web/               # shadcn/ui components, tokens, and global CSS styles
│
├── turbo.json                # Turborepo task pipeline definition
├── pnpm-workspace.yaml       # Workspace definitions & shared dependency catalog
├── .oxlintrc.json            # oxlint linter configuration
└── .oxfmtrc.json             # oxfmt formatter configuration
```

---

## Getting Started & Setup

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **PostgreSQL Database with pgvector**: e.g., [Neon](https://neon.tech)
- **Google Cloud Console Project**: OAuth 2.0 Client with Calendar Scopes enabled
- **MeetingBaas Account**: API Key and Webhook Secret
- **Cloudflare R2 Bucket**: Account ID, Access Keys, and Bucket Name
- **OpenAI API Key** (or compatible local endpoint like LM Studio)

---

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/IamAyaanSk/8x-fathom.git
cd 8x-fathom

# Install all workspace dependencies
pnpm install
```

---

### 2. Environment Configuration

Copy the example environment files for each app:

#### API Server (`apps/server/.env`)

```bash
cp apps/server/.env.example apps/server/.env
```

Fill in the required variables:

```env
PORT='3000'
NODE_ENV='development'

# Neon PostgreSQL connection strings
DATABASE_URL='postgresql://user:password@ep-pooler.neon.tech/neondb?sslmode=require'
DATABASE_URL_UNPOOLED='postgresql://user:password@ep-direct.neon.tech/neondb?sslmode=require'

# Better Auth & Security
BETTER_AUTH_SECRET='generate-a-secure-random-secret'
BETTER_AUTH_URL='http://localhost:5173'
BASE_URL='http://localhost:3000'
WEB_ORIGIN='http://localhost:5173'

# Google OAuth (Must have Calendar Scopes enabled)
GOOGLE_CLIENT_ID='your-google-client-id.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='your-google-client-secret'

# MeetingBaas
MEETINGBAAS_API_KEY='your-meetingbaas-api-key'
MEETINGBAAS_WEBHOOK_SECRET='whsec_your-webhook-secret'

# Cloudflare R2
R2_ACCOUNT_ID='your-r2-account-id'
R2_ACCESS_KEY_ID='your-r2-access-key-id'
R2_SECRET_ACCESS_KEY='your-r2-secret-access-key'
R2_BUCKET='your-r2-bucket-name'
R2_ENDPOINT='https://your-account-id.r2.cloudflarestorage.com'

# AI Provider
OPENAI_API_KEY='sk-your-openai-api-key'
```

#### Frontend (`apps/web/.env`)

```bash
cp apps/web/.env.example apps/web/.env
```

```env
VITE_API_URL='http://localhost:3000'
```

#### Background Worker (`apps/worker/.env`)

```bash
cp apps/worker/.env.example apps/worker/.env
```

```env
PORT='3001'
NODE_ENV='development'

# Use the pooled connection string for runtime queries
DATABASE_URL='postgresql://user:password@ep-pooler.neon.tech/neondb?sslmode=require'
BASE_URL='http://localhost:3000'

# MeetingBaas & Storage (matches server)
MEETINGBAAS_API_KEY='your-meetingbaas-api-key'
MEETINGBAAS_WEBHOOK_SECRET='whsec_your-webhook-secret'
R2_ACCOUNT_ID='your-r2-account-id'
R2_ACCESS_KEY_ID='your-r2-access-key-id'
R2_SECRET_ACCESS_KEY='your-r2-secret-access-key'
R2_BUCKET='your-r2-bucket-name'
R2_ENDPOINT='https://your-account-id.r2.cloudflarestorage.com'

# AI Provider (OpenAI or Local LM Studio)
OPENAI_API_KEY='sk-your-openai-api-key'
LM_STUDIO_BASE_URL='http://localhost:1234/v1'
```

---

### 3. Database Setup & Migrations

Ensure your PostgreSQL instance has `pgvector` enabled (handled automatically by migrations):

```bash
# Generate Prisma Client
pnpm --filter @repo/db db:generate

# Run migrations against your database
pnpm --filter @repo/db db:migrate
```

To view or edit database records visually:

```bash
pnpm --filter @repo/db db:studio
```

---

### 4. Running the Application

Start the web application, API server, and worker:

```bash
# Runs web (port 5173), worker (port 3001) and server (port 3000)
turbo run dev
```

---

### 5. Webhooks & Local Tunneling

For real-time calendar push notifications and MeetingBaas (you need to setup appropriate webhook URL on MeetingBaaS) live status callbacks in local development:

1. Start an HTTPS tunnel (e.g., using [ngrok](https://ngrok.com/)):
   ```bash
   ngrok http 5173
   ```
2. In your Google Cloud Console, add `https://<your-ngrok-subdomain>.ngrok-free.app/api/auth/callback/google` to the **Authorized redirect URIs**.
3. In your MeetingBaas dashboard, configure the webhook endpoint to:
   `https://<your-ngrok-subdomain>.ngrok-free.app/api/webhooks/meetingbaas`
4. Set `BETTER_AUTH_URL` and `WEB_ORIGIN` in `apps/server/.env` to your public ngrok URL.

---

## Author

Ayaan Shaikh
