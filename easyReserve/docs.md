 # EasyReserve - Technical Requirements

 ## Technology Stack
 - Frontend: Next.js (React)
 - Backend: Node.js, Express
 - Database: PostgreSQL
 - AI Integration: Ollama local LLM (`ollama` JS client)
 - Workflow Automation: n8n via webhooks (email/SMS confirmations)
 - Date Parsing: date-fns or chrono-node
 - Containerization: Docker Compose
 - Deployment: Render.com

 ## Architecture
 - Frontend chat widget embedded in static pages.
 - API layer with reservation and FAQ endpoints.
 - Multi-turn reservation state machine in backend.
 - Postgres tables: reservations, menu_items, faqs.
 - n8n workflows for external notifications.