# MarketMuse Template

**Automated Marketing Content Studio**

## Folder Structure
```
templates.artemis-ai.ca/marketmuse/
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
   │     └─ content.ts
   └─ components/
      └─ ContentEditor.tsx
```

## TODOs
- Initialize Next.js and dependencies.
- Implement `ContentEditor` for drafting and preview.
- Create API route `/api/content` for content management.
- Integrate with Ollama for text generation.
- Hook into n8n webhook for scheduling posts.
- Configure database models for contents and schedules.
- Add unit tests and CI/CD.