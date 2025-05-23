# BizAssist Template

**AI-Powered Small Business Dashboard**

## Folder Structure
```
templates.artemis-ai.ca/bizassist/
├─ .gitignore
├─ .env.example
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ README.md
└─ src/
   ├─ pages/
   │  ├─ index.tsx
   │  └─ api/
   │     ├─ chat.ts
   │     └─ kpi.ts
   └─ components/
      ├─ ChatWidget.tsx
      └─ Dashboard.tsx
```

## TODOs
- Initialize Next.js app and install dependencies.
- Implement `ChatWidget` component for chat interface.
- Build `Dashboard` component for KPI display.
- Create API route `/api/chat` to proxy requests to Ollama.
- Create API route `/api/kpi` to fetch business metrics.
- Integrate with n8n webhooks for task automation.
- Define database schema and connect via `DATABASE_URL`.
- Add tests and CI/CD pipeline.