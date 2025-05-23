# MarketMuse AI – Automated Marketing Content Studio

Create, refine, and schedule engaging content faster than ever. MarketMuse leverages LLM creativity, structured templates, and n8n automation to keep your marketing pipeline full and on-brand.

---

## Overview

Audience: Freelance marketers & SMBs that need consistent multi-channel content but lack bandwidth.

Key value: A single conversational interface that ideates, drafts, previews, and schedules posts across social media and email.

---

## Feature Matrix

| Module | User Benefit | Implementation |
|--------|--------------|-----------------|
| Chat Ideation | “Give me 5 headline ideas” | Ollama prompt → streaming answers |
| Template Library | Consistent tone | JSON templates stored in DB |
| Live Preview | See exactly how a tweet / post renders | React components + device mockups |
| Version History | Rollback or duplicate drafts | Postgres `contents` table with `parent_id` |
| Scheduler | Auto-publish at best time | n8n cron workflow + API to Twitter / LinkedIn |
| Team Collaboration | Share draft link | JWT + row-level perms |

---

## High-Level Architecture

```
Browser  ──► Next.js  ──► /api/chat          ──► Ollama LLM
           (React)          │
                            │
                            ├──► MCP (Intent router)
                            │       ├─► Template Service
                            │       └─► Postgres (contents, schedules)
                            │
                            └──► n8n → Twitter/Meta/Email
```

---

## Tech Stack

Front-end: Next.js 14 • shadcn/ui • Zustand
Back-end: Node 20 • Express • tRPC
Database: PostgreSQL 15 + pgvector
AI: Ollama (Llama-3-8B) via LangChainJS
Automation: n8n self-host • Official social media API nodes
CI/CD: GitHub Actions → Render

---

## Database Schema (simplified)

```sql
CREATE TABLE contents (
  id UUID PRIMARY KEY,
  owner_id UUID,
  title TEXT,
  body TEXT,
  channel TEXT,      -- twitter | instagram | email
  status TEXT,       -- draft | scheduled | published
  scheduled_at TIMESTAMP,
  parent_id UUID REFERENCES contents(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name TEXT,
  json JSONB,
  channel TEXT
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES contents(id),
  job_id TEXT,        -- n8n reference
  next_run TIMESTAMP
);
```

---

## API Contracts (excerpt)

| Verb | Path | DTO | Description |
|------|------|-----|-------------|
| POST | /api/chat | `{ prompt }` | Stream LLM response |
| POST | /api/content | `CreateContentDto` | Save new draft |
| PATCH| /api/content/:id | `UpdateContentDto` | Update draft or schedule |
| POST | /api/schedule | `ScheduleDto` | Register n8n cron job |

> Full OpenAPI spec generated from zod-schemas lives in `/marketMuse/openapi.yaml`.

---

## n8n Flow Outline

1. **Publish to Twitter**
   • Cron trigger (specific date) → HTTP GET `/api/content/:id/publish` → Twitter node → mark as `published`.

2. **Email Digest**
   • Weekly cron → query DB via HTTP → SendGrid node to list subscribers.

---

## Getting Started

```bash
cd marketMuse
cp .env.example .env          # DATABASE_URL, N8N_URL, OLLAMA_URL, API_KEYS...
docker compose up -d postgres n8n ollama
npm i && npm run dev
```

Run vitest: `npm t`

---

## Deployment

Deploy the `marketMuse` folder as a separate Render Web Service or Docker image, provision Postgres, and set env vars.

---

## Roadmap

• Canva-style rich media editor
• A/B test headlines & automatically pick winner
• Multi-lingual generation/localisation

---

© Artemis – unleash your creativity.
