# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mm-voice-widget-v3** — A Next.js 14 application that serves as a voice AI widget for MinskMir real estate consultations. It proxies ElevenLabs Conversational AI, manages leads/conversations via a PostgreSQL database (Supabase), and provides an admin dashboard for monitoring.

The widget is designed to be embedded as an iframe on client websites.

## Commands

```bash
npm run dev          # Start development server (Next.js)
npm run build        # Generate Prisma client + build Next.js
npm run lint         # ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm start            # Start production server
```

After schema changes: `npx prisma generate` (also runs automatically via postinstall).

## Architecture

### Framework & Routing

- **Next.js 14** with Pages Router (`pages/` directory, NOT app router)
- **TypeScript** throughout
- **Tailwind CSS** for styling, with `clsx` + `tailwind-merge` via `src/lib/utils.ts`
- **Prisma** ORM with PostgreSQL (Supabase) — schema at `prisma/schema.prisma`

### Key Directories

- `pages/` — Next.js pages and API routes
- `pages/api/` — All backend API endpoints (REST-style)
- `pages/api/elevenlabs/` — ElevenLabs proxy endpoints (conversation tokens, signed URLs)
- `pages/api/webhook/` — Webhook receivers for CRM/voice lead data
- `pages/api/knowledge-base/` — Knowledge base CRUD operations
- `pages/api/admin/` — Admin-specific endpoints (stats, leads, widget config)
- `src/components/` — React components (widget, navigation, audio player)
- `src/hooks/` — Custom hooks (notifications, unread leads)
- `src/types/` — TypeScript type definitions
- `prisma/` — Database schema and migrations

### Core Components

- **`AINotificationWidget`** — The main embeddable voice widget with collapse/expand, consent checkboxes, and call status management. Persists collapsed state to localStorage with a 10-minute re-expand timer.
- **`VoiceWidget`** — ElevenLabs voice integration component
- **`Navigation`** — Admin dashboard navigation

### Data Flow

1. Widget is embedded via iframe on external sites (`/widget` page has permissive frame headers)
2. Widget requests a conversation token via `/api/elevenlabs/conversation-token`
3. Voice conversations happen through ElevenLabs SDK
4. Leads are captured via webhooks (`/api/webhook/voice-lead`, `/api/webhook/crm-lead-enhanced`)
5. Admin views leads and conversation data through dashboard pages (`/admin/`, `/lead-monitor`)

### Database Models (Prisma)

Key models: `User`, `Client`, `Lead`, `Conversation`, `KnowledgeBaseDocument`, `WidgetConfig`. Uses enums for `UserRole`, `LeadStatus`, `ConversationStatus`.

Database uses two connection strings: `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) for Supabase.

### iframe Integration

`_app.tsx` detects iframe context and communicates height via `postMessage`. The `/widget` route has special CORS/CSP headers (`frame-ancestors *`) configured in `next.config.js`.

## API Patterns

- **Rate limiting**: In-memory per-IP rate limiter on ElevenLabs proxy endpoints (default: 100 requests/3600s). Uses `X-Forwarded-For` / `X-Real-IP` for IP detection.
- **ElevenLabs proxy**: API keys are server-side only. Frontend gets signed URLs or conversation tokens via `/api/elevenlabs/*` endpoints, never the raw key.
- **Widget config**: Widget accepts query params (`theme`, `phone`, `privacyUrl`, `consentUrl`, `source`) when embedded.

## TypeScript Path Aliases

Configured in `tsconfig.json`: `@/*`, `@/components/*`, `@/utils/*`, `@/types/*`, `@/hooks/*`.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` / `DIRECT_URL` — Supabase PostgreSQL connection strings
- `ELEVENLABS_API_KEY` / `ELEVENLABS_AGENT_ID` — ElevenLabs integration
- `ALLOWED_ORIGINS` — CORS origins for API routes
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — NextAuth configuration
- `WS_PROXY_URL` — WebSocket proxy for sanctioned country access

## Deployment

Configured for Vercel (`vercel.json`), region `iad1`. Health check at `GET /health`.

## Language Note

Business logic comments and UI text are in Russian (the product targets Russian-speaking real estate clients in Belarus/MinskMir). Code identifiers and technical comments are in English.
