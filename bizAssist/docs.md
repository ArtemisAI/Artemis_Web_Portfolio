# BizAssist Dashboard - Technical Requirements

## Technology Stack
- Frontend: Next.js (React), Material-UI, Recharts or Chart.js
- Backend: Node.js, Express
- Database: PostgreSQL
- AI Integration: Ollama local LLM (`ollama` JS client)
- Workflow Automation: n8n via webhooks
- Containerization: Docker Compose
- Deployment: Render.com

## Architecture Overview
- Frontend: Chat UI and KPI cards in Next.js
- API Layer: Express/Next.js routes for chat and data endpoints
- Logic Layer: MCP service routing intents to DB queries, LLM calls, or n8n triggers
- Database: Tables: users, sales, tasks, conversations
- AI: Ollama server for AI responses and summarization
- Automation: Node backend posts to n8n webhooks for reminders and emails

## Development Workflow
1. Clone and install dependencies.
2. Copy `.env.example` to `.env` and set variables (DATABASE_URL, N8N_WEBHOOK_URL_REMINDER, JWT_SECRET, OLLAMA_SERVER_URL).
3. Run `docker-compose up` to start Postgres (and n8n locally).
4. Start frontend (`npm run dev`) and backend (`npm run dev`).
5. Commit on feature branches; open PRs.

## Deployment
- Link GitHub repo to Render.
- Configure ENV variables on Render.
- Provision managed Postgres.
- Deploy and verify.
