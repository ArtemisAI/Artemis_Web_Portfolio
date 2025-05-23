 # MarketMuse AI - Technical Requirements

 ## Technology Stack
 - Frontend: Next.js (React)
 - Backend: Node.js, Express
 - Database: PostgreSQL
 - AI Integration: Ollama local LLM (`ollama` JS client)
 - Workflow Automation: n8n via webhooks
 - Containerization: Docker Compose
 - Deployment: Render.com

 ## Architecture Overview
 - Frontend: Chat-driven UI with content preview panels
 - API Layer: Express/Next.js routes for chat and content endpoints
 - Logic Layer: Prompt handling for generation, refinement, and scheduling commands
 - Database: Tables: users, contents, scheduled_posts, templates
 - AI: Ollama for text generation and iterative refinement
 - Automation: n8n workflows to schedule posts and send emails

 ## Development Workflow
 1. Clone the repo and install dependencies.
 2. Copy `.env.example` to `.env`:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_SCHEDULE`
    - `OLLAMA_SERVER_URL`
 3. Run `docker-compose up` to start Postgres and n8n.
 4. Start the frontend (`npm run dev`) and backend (`npm run dev`).
 5. Use feature branches and submit pull requests.

 ## Deployment on Render.com
 - Link the GitHub repo to Render as a Web Service.
 - Configure environment variables on Render:
    - `DATABASE_URL`
    - `N8N_WEBHOOK_URL_SCHEDULE`
    - `OLLAMA_SERVER_URL`
 - Provision a managed PostgreSQL database.
 - Deploy and verify content generation and scheduling workflows.