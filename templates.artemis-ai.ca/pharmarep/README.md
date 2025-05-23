# PharmaRep Template

**Field Intelligence & CRM Assistant**

## Folder Structure
```
templates.artemis-ai.ca/pharmarep/
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
   │     └─ sales.ts
   └─ components/
      └─ SalesDashboard.tsx
```

## TODOs
- Scaffold Next.js application.
- Implement `SalesDashboard` with charts and KPIs.
- Create API route `/api/sales` for sales data.
- Integrate Ollama for data summaries.
- Hook into n8n for follow-up tasks.
- Define database models for products and sales.
- Add automated tests and CI/CD.