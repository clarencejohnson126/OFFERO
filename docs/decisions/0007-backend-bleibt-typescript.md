# 0007 — Backend bleibt TypeScript (Python optional als Adapter)

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** Reevaluierung des Stacks — Python (FastAPI) vs. TypeScript. Der Nutzer sah „viel mehr
  Möglichkeiten" in Python (reicheres AI/ML-Ökosystem, FastAPI-DX, reife Worker-Frameworks).
- **Entscheidung:** Der **Kern-API-Layer und die Domänenlogik bleiben TypeScript** (dünne Next.js
  Route Handlers unter `/api/v1` + framework-neutrales `packages/core`). **Kein Voll-Python-Backend.**
  Python wird **bei Bedarf als Microservice hinter einem Port/Adapter** (`AIProvider`/`ImageProvider`/
  `Queue`) eingehängt — für genuin Python-starke Aufgaben (lokale ML, Embeddings, schweres
  Dokument-/CV-Parsing, Spezial-Scraping).
- **Begründung:**
  1. **Mobile-Migrierbarkeit ist harte Pflicht** (Constitution Art. IV.2). Geteilter TS-`core` +
     `api-client` für Web **und** React Native ist der Kern dieses Versprechens — ein Python-Backend
     bräche das Type-/Logik-Sharing (nur noch REST-Vertrag, doppelte Typen).
  2. **Offeros KI ist API-Orchestrierung**, kein lokales ML — Claude/Gemini sind gehostete APIs;
     Pythons größter Vorteil zieht hier weniger.
  3. **Vercel-Deploy** für Next.js nahtlos; ein Python-Backend bräuchte separates Hosting + Netzwerk-Hop.
  4. Das **bestehende M1-Gerüst** ist TS; das sprachunabhängige DB-Schema bliebe ohnehin.
- **Konsequenzen:**
  - (+) Ein Sprach-Stack über Web, API, Core und später Mobile; Mobile-Sharing bleibt erhalten.
  - (+) Erweiterbar: Python kann gezielt als Adapter ergänzt werden, ohne den Kern zu brechen.
  - (−) Für künftige lokale-ML-/Heavy-Parsing-Aufgaben bewusst ein Python-Adapter-Service statt
    In-Process-Python (zusätzliche Infra, wenn es so weit ist).
- **Alternativen verworfen:**
  - *Voll-Python (FastAPI)* → bricht Mobile-Sharing, zweisprachig, Vercel-Deploy splittet, M1 würde ersetzt.
- **Verhältnis zu anderen ADRs:** Bestätigt und schärft [ADR 0001](./0001-fundament.md) um die explizite
  Python-Abwägung.
