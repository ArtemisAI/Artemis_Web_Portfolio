# MediConnect AI – Conversational Health Companion

A HIPAA-ready chatbot that triages symptoms, books appointments, and keeps patients engaged – all within your clinic’s website or mobile app.

---

## Fast Facts

• **Target users:** Outpatient clinics (family medicine, pediatrics, urgent care).
• **Primary goals:** Reduce phone calls, streamline triage, and capture accurate patient data before the visit.
• **Compliance:** Data encryption at rest, audit logs, access controls suitable for HIPAA (no PHI leaves the environment).

---

## Core Features

1. Symptom checker & triage with escalation rules.
2. Real-time appointment booking integrated with clinic EHR calendar (mocked iCal for demo).
3. Automated reminders (intake forms, fasting instructions) via n8n.
4. Conversation transcripts stored per patient for clinician review.
5. Admin dashboard: queue of pending triage + appointment stats.

---

## Architecture Snapshot

```
Patient Browser
   │  /chat (SSE)
   ▼
Next.js Frontend (PWA)
   │  REST / WS
   ▼
Node API (Express)  ──► Ollama LLM (triage prompts)
   │                     ▲
   │                     │
   │  gRPC               │
   ▼                     │
MCP Service (Rules & Scoring) ──► Postgres (patients, appts)
   │
   └─→ n8n (webhook) → Twilio / SendGrid / Slack
```

### Why MCP?

The Micro-Core-Processor isolates deterministic logic (e.g., “fever > 38°C + rash → urgent”) from probabilistic LLM output, ensuring predictable triage outcomes.

---

## Technology Choices

Layer | Tech | Reason
------|------|-------
Frontend | Next.js (React) + Tailwind | Fast, SSR & SEO
Backend  | Node 20 + Express | Familiar, ecosystem rich
AI       | Ollama + LangChainJS | Local inference, GPT-style API
Database | Postgres 15 + Prisma | ACID + pgvector for semantic recall
Automation | n8n | Visual workflow builder, self-host
Auth | NextAuth.js (JWT) | Social logins & credentials

---

## Database Outline

```prisma
model Patient {
  id          String   @id @default(uuid())
  email       String   @unique
  phone       String?
  name        String
  createdAt   DateTime @default(now())
  conversations Conversation[]
  appointments Appointment[]
}

model Appointment {
  id          String   @id @default(uuid())
  patientId   String
  status      String   // pending | confirmed | cancelled
  startsAt    DateTime
  endsAt      DateTime
  reason      String?
  Patient     Patient  @relation(fields: [patientId], references: [id])
}

model Message {
  id        String   @id @default(uuid())
  convId    String
  role      String   // system | user | assistant
  content   String
  vector    Float[]  @vector
  createdAt DateTime @default(now())
}

model Conversation {
  id        String   @id @default(uuid())
  patientId String
  messages  Message[]
  Patient   Patient @relation(fields: [patientId], references: [id])
}
```

---

## API Highlights

| Method | Path | Body / Query | Purpose |
|--------|------|--------------|---------|
| POST | /api/chat | `{ prompt }` | Stream assistant reply |
| POST | /api/appointment | `CreateAppointmentDto` | Book slot |
| GET  | /api/appointment?date=YYYY-MM-DD | Admin list |
| POST | /api/webhook/n8n/notify | n8n callback |

JWT required for patient endpoints; admin routes gated by role.

---

## Local Setup

1. `docker compose up -d db n8n ollama`
2. `cp .env.example .env` and set `DATABASE_URL`, `JWT_SECRET`, etc.
3. `npm i && npm run dev`

Run prisma migrations and seed sample patients: `npm run db:seed`.

---

## Deployment Tips

• **Render** web service with build command `npm ci && npm run build`.
• Provision managed Postgres & set env variables.
• Place Ollama & n8n on a private network or use Docker sidecars.

---

## Future Work

• FHIR API integration to sync with real EHRs.
• Voice/chat handoff to human agent.
• Multilingual triage prompts.

— Stay healthy with MediConnect.
