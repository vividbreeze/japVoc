# 日本語 Vokabeltrainer N5

Spaced-Repetition-Lernapp für den JLPT-N5-Wortschatz (838 Vokabeln) mit SM-2-Algorithmus.

## Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Datenbank | SQLite |
| Charts | Recharts |
| State | Zustand |

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm 10+

### 1. Backend starten

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed          # 838 N5-Vokabeln einlesen
npm run dev              # http://localhost:3000
```

### 2. Frontend starten (separates Terminal)

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Der Vite-Dev-Server proxied `/api`-Anfragen automatisch zum Backend auf Port 3000.

---

## Datenbank zurücksetzen

```bash
cd backend
npm run db:reset         # Löscht alles und seeded neu
```

---

## Tests ausführen

```bash
# Backend Unit- & Integrationstests
cd backend
npm test

# Frontend E2E (Playwright)
cd frontend
npx playwright install
npm test
```

---

## Docker (Produktion)

```bash
# Starten
docker compose up -d

# Logs
docker compose logs -f

# Stoppen
docker compose down
```

Die App ist danach unter **http://localhost:3000** erreichbar.  
Die SQLite-Datenbankdatei wird im Docker-Volume `vokabel_data` persistiert.

### Hostinger Deployment

1. Repo auf den Server klonen
2. `.env.example` → `.env` kopieren und anpassen
3. `docker compose up -d --build`

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/health` | Health-Check |
| GET | `/api/words` | Alle Vokabeln (mit `search`, `wortart`, `page`, `limit`) |
| GET | `/api/words/:id` | Einzelnes Vokabel |
| GET | `/api/collections` | Alle Sammlungen |
| POST | `/api/collections` | Neue Sammlung |
| PUT | `/api/collections/:id` | Sammlung umbenennen |
| DELETE | `/api/collections/:id` | Sammlung löschen |
| GET | `/api/collections/:id/words` | Wörter einer Sammlung |
| POST | `/api/collections/:id/words` | Wort hinzufügen |
| DELETE | `/api/collections/:id/words/:wordId` | Wort entfernen |
| GET | `/api/review/queue` | Heutige Lernqueue |
| POST | `/api/review` | Bewertung speichern |
| GET | `/api/stats` | Lernstatistiken |
| GET | `/api/settings` | Einstellungen laden |
| PUT | `/api/settings` | Einstellungen speichern |

---

## SM-2 Algorithmus

| Taste | Bewertung | SM-2 Qualität | Bedeutung |
|-------|-----------|---------------|-----------|
| 1 | Again | 0 | Nicht gewusst – Reset |
| 2 | Hard | 3 | Gewusst, aber schwer |
| 3 | Good | 4 | Gewusst mit leichtem Zögern |
| 4 | Easy | 5 | Perfekt gewusst |

Der Easiness Factor (EF) startet bei 2.5 und wird nach jeder Bewertung angepasst (Minimum: 1.3).

---

## Projektstruktur

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── seed/n5-vocabulary.json   ← 838 Vokabeln
│   ├── src/
│   │   ├── routes/      collections, words, review, stats, settings
│   │   ├── services/    sm2.ts
│   │   └── index.ts
│   └── tests/           sm2.test.ts, api.test.ts
│
├── frontend/
│   └── src/
│       ├── api/         client.ts
│       ├── components/  FlashCard, Navigation, ProgressRing
│       ├── pages/       Dashboard, Learn, Vocabulary, Collections, Statistics, Settings
│       ├── store/       useSettingsStore.ts
│       └── types/       index.ts
│
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
