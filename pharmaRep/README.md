# PharmaRep Companion – Field Intelligence & CRM Assistant

Empower pharmaceutical sales representatives with instant drug data, territory analytics, and follow-up automation – all through a secure conversational UI.

---

## Elevator Pitch

Reps spend less time digging through spreadsheets and more time building relationships. Ask natural questions like “How did Symbicort perform at Mercy Hospital last quarter?” and get actionable insights plus automated next steps.

---

## Functional Highlights

• **Drug Info Lookup** – Mechanism, dosing, contraindications sourced from internal DB & PubMed abstracts (RAG).

• **Sales Dashboards** – KPIs by territory, product, and HCP segment.

• **Call Logging** – “/log  Dr. Evans – discussed trial data” stores visit + notes.

• **Reminder & Compliance Tasks** – n8n flows send email before sample expiration or post-visit follow-up.

• **Document Generator** – Create personalized leave-behinds via LLM (PDF export).

---

## System Overview

```
Mobile PWA / Desktop UI
      │
      ▼
Next.js Front-end
      │ /api/chat (SSE)
      ▼
Node + Express API ───► MCP Service (intent routing)
      │                   │
      │                   ├─► Ollama LLM (summaries, PDF gen)
      │                   ├─► Postgres (clients, sales)
      │                   └─► Vector DB (drug monographs)
      │
      └─► n8n (webhook) → Slack / Email / Calendar
```

All traffic secured via HTTPS, JWT auth with access/refresh tokens. Row-level security enforces tenant isolation per rep.

---

## Tech Stack

• **Frontend:** Next.js 14, React Hook Form, Victory charts
• **Backend:** Node 20, Express, tRPC, Prisma
• **Database:** PostgreSQL 15, pgvector extension
• **AI:** Ollama (Llama-3) through LangChainJS; RAG with chroma or pgvector
• **Automation:** n8n self-host; Twilio, SendGrid nodes
• **CI/CD:** GitHub Actions, Render deploy

---

## Key Database Tables

Table | Description
------|------------
`users` | rep auth & role
`hcp` | health-care professionals (targets)
`products` | drug metadata
`visits` | call logs: rep_id, hcp_id, notes, samples_left, next_step
`sales_data` | monthly sales by product & territory
`tasks` | reminders linked to visits

---

## API Cheatsheet

Verb | Endpoint | Description
-----|----------|------------
POST | `/api/chat` | Conversational endpoint (stream)
GET  | `/api/sales?period=Q1&product=123` | Territory KPIs
POST | `/api/visit` | Log HCP visit
PATCH| `/api/task/:id` | Update task status

Each request must include `Authorization: Bearer <JWT>`.

---

## n8n Workflows

1. **Sample Expiry Alert** – Time-delay node (30 days after visit) → Email rep & HCP.
2. **Weekly KPI Digest** – Cron → HTTP GET `/api/sales?...` → Slack message.
3. **Calendar Sync** – Webhook on `/api/visit` → Google Calendar node.

---

## Quickstart

```bash
cd pharmaRep
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, N8N_URL...
docker compose up -d db n8n ollama
npm i && npm run dev
```

Seed sample HCP & sales: `npm run db:seed`

---

## Deployment

Deploy via Render Web Service or Docker. Attach Postgres, set environment variables, and enable background workers for n8n.

---

## Roadmap

• Geo-based prospecting (Mapbox integration)
• Offline mode with IndexedDB cache
• Voice dictation for rapid visit notes

---

Crafted for high-performance pharma teams.
