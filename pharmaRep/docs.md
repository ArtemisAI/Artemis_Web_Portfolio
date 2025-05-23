 # PharmaRep Companion - Technical Requirements

 ## Technology Stack
 - Frontend: Next.js (React), Ant Design or Material-UI
 - Backend: Node.js, Express
 - Database: PostgreSQL
 - AI Integration: Ollama local LLM (`ollama` JS client)
 - Workflow Automation: n8n via webhooks for scheduling and notifications
 - Containerization: Docker Compose
 - Deployment: Render.com

 ## Architecture Overview
 - Frontend: Dashboard with chat widget, product and client sections
 - API Layer: Express routes for chat, product info, sales data, visits, and tasks
 - Logic Layer: MCP service for intent classification and tool integration
 - Database: Tables: users, products, clients, sales, visits, tasks
 - AI: Retrieval-Augmented Generation pattern for accurate responses
 - Automation: n8n workflows for calendar events, email summaries, and reminders

 ## Development Workflow
 1. Clone repo and install dependencies.
 2. Copy `.env.example` to `.env`:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_REMINDER`
    - `OLLAMA_SERVER_URL`
 3. Run `docker-compose up` to start Postgres and n8n.
 4. Launch frontend and backend in dev mode.
 5. Use feature branches and create pull requests.

 ## Deployment on Render.com
 - Create Web Service on Render (Docker or Node).
 - Set environment variables:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_REMINDER`
    - `OLLAMA_SERVER_URL`
 - Provision managed PostgreSQL.
 - Deploy and verify product queries, analytics, and automation.