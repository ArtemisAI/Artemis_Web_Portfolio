# MediConnect Template

**Conversational Health Companion**

## Folder Structure
```
templates.artemis-ai.ca/mediconnect/
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
   │     └─ appointment.ts
   └─ components/
      └─ SymptomChecker.tsx
```

## TODOs
- Bootstrap Next.js project.
- Implement `SymptomChecker` for triage flow.
- Create API route `/api/appointment` for booking.
- Integrate with Ollama for symptom analysis.
- Connect to n8n for reminders and notifications.
- Model database for patients and appointments.
- Add tests and CI/CD.