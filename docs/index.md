---
layout: home

hero:
  name: eBoom Docs
  text: Engineering onboarding
  tagline: Module-by-module guides for the eBoom Personal Finance Management platform — why things exist, where the code lives, and how frontend and backend cooperate.
  actions:
    - theme: brand
      text: Start with Overview
      link: /00-overview
    - theme: alt
      text: Docs Index
      link: /README

features:
  - title: 00 — Overview
    details: Canvas mental model, module status, feature map, schema snapshot, and money-flow / ledger invariants.
    link: /00-overview
  - title: 01 — Architecture
    details: Services, request lifecycle, data flow, tech stack, and the key dependencies and why they were chosen.
    link: /01-architecture
  - title: 02 — Backend Core
    details: App bootstrap, routing, middleware, error keys, database layer, and service conventions.
    link: /02-backend-core
  - title: 03 — Frontend Core
    details: Next.js App Router, providers, Axios + TanStack Query, Redux, i18n, and notifications.
    link: /03-frontend-core
---

## Mental model in 60 seconds

```mermaid
flowchart LR
  subgraph FE["eboom-frontend (Next.js 15)"]
    Views["Views / Pages"]
    DataLayer["Axios + TanStack Query"]
    AuthCtx["AuthProvider (JWT in localStorage)"]
  end
  subgraph BE["eboom-backend (Express)"]
    Router["/api router"]
    MW["Middleware: auth -> requireCanvasAccess"]
    Handlers["Route handlers"]
    Services["Services (ledger, email, ...)"]
  end
  DB[("PostgreSQL via Drizzle ORM")]

  Views --> DataLayer
  AuthCtx --> DataLayer
  DataLayer -->|"Bearer JWT + JSON"| Router
  Router --> MW --> Handlers --> Services --> DB
  Services --> Handlers --> DataLayer --> Views
```

Three ideas unlock most of the codebase:

1. **Everything is scoped to a Canvas.** A canvas is the tenant boundary. Almost every data route lives under `/api/canvases/:canvasId/...` and is guarded by membership + permission checks.
2. **The API speaks in error keys, not English.** Failures return a stable `errorKey` (an i18n path) so the frontend can translate them. See [Backend Core](/02-backend-core#error-handling).
3. **The frontend never trusts local math.** Server data flows through TanStack Query; Redux only holds UI chrome (modals, search, selected canvas). See [Frontend Core](/03-frontend-core).
