 # MediConnect AI - Technical Requirements

 ## Technology Stack
 - Frontend: Next.js (React)
 - Backend: Node.js, Express or Next.js API routes
 - Database: PostgreSQL
 - AI Integration: Ollama local LLM (`ollama` JS client)
 - Workflow Automation: n8n via webhooks for appointment workflows
 - Containerization: Docker Compose
 - Deployment: Render.com

 ## Architecture Overview
 - Frontend: Chat UI component and optional patient info forms
 - API Layer: Express or Next.js routes for chat, appointments, and patient data
 - Logic Layer: MCP service routing between LLM, DB queries, and automation
 - Database: Tables: users, conversations, messages, appointments
 - AI: Ollama model with system prompts for safe medical advice
 - Automation: n8n workflows for scheduling and notification emails/SMS

 ## Development Workflow
 1. Clone repo and install dependencies.
 2. Copy `.env.example` to `.env`:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_APPOINTMENT`
    - `OLLAMA_SERVER_URL`
 3. Run `docker-compose up` to start Postgres and n8n.
 4. Start frontend and backend in dev mode.
 5. Commit on feature branches; open PRs.

 ## Deployment on Render.com
 - Create Web Service on Render (Docker or Node).
 - Configure environment variables:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_APPOINTMENT`
    - `OLLAMA_SERVER_URL`
 - Provision managed PostgreSQL service.
 - Deploy and verify chat and appointment functionality.