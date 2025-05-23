# EasyReserve Template

**Conversational Restaurant Booking Platform**

## Folder Structure
```
templates.artemis-ai.ca/easyreserve/
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
   │     └─ reservations.ts
   └─ components/
      └─ ReservationWidget.tsx
```

## TODOs
- Initialize Next.js and install dependencies.
- Implement `ReservationWidget` for booking flow.
- Create API route `/api/reservations` to manage bookings.
- Integrate with Ollama for conversational UI.
- Hook into n8n webhook for notifications and reminders.
- Set up database and ORM for reservation data.
- Write tests and CI/CD configuration.