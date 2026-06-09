# EcoTrace — Carbon Footprint Awareness Platform

EcoTrace helps individuals understand, track, and reduce their personal carbon footprint through simple activity logging, real-time CO₂ calculations, personalized insights, and a verified carbon offset marketplace.

---

## Live Demo

Deploy via Replit to get a public `.replit.app` URL. All routes are available through the shared reverse proxy at `/` (frontend) and `/api` (backend).

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Monthly CO₂ summary, 30-day trend chart, category breakdown, activity streak |
| **Log Activity** | Log transport, food, energy, and shopping with real-time CO₂ preview |
| **History** | Browse, filter, edit, and delete past activity entries |
| **Insights** | Personalized tips ranked by your highest-emission categories |
| **Goals** | Create weekly/monthly CO₂ reduction targets with progress bars |
| **Offset Marketplace** | Browse 8 verified climate projects, purchase offsets, track net emissions |

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces, Node.js 24, TypeScript 5.9 |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter |
| Backend | Express 5, Pino structured logging |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (`zod/v4`), `drizzle-zod` |
| API contract | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| Build | esbuild (CJS bundle for server) |

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── routes/      # activities, dashboard, tips, goals, offsets
│   │       └── lib/
│   │           └── co2Calculator.ts   # emission factor lookup
│   └── carbon-footprint/    # React + Vite frontend
│       └── src/
│           ├── pages/       # dashboard, track, history, insights, goals, offsets
│           └── components/  # layout, shadcn/ui components
├── lib/
│   ├── api-spec/            # openapi.yaml — single source of truth for the API contract
│   ├── api-client-react/    # generated React Query hooks (do not edit by hand)
│   ├── api-zod/             # generated Zod schemas (do not edit by hand)
│   └── db/                  # Drizzle schema + client
│       └── src/schema/      # activities.ts, goals.ts, offsets.ts
└── scripts/                 # shared utility scripts
```

---

## CO₂ Calculation

Emission factors are sourced from IPCC, EPA, and Our World in Data estimates. They live in `artifacts/api-server/src/lib/co2Calculator.ts` and are applied server-side at insert time so the database always stores consistent kg CO₂e values.

| Category | Examples | Factor |
|---|---|---|
| Transportation | Car (gasoline) | 0.192 kg / km |
| Transportation | Flight (short-haul) | 0.255 kg / km |
| Food | Beef | 27.0 kg / kg |
| Food | Chicken | 6.9 kg / kg |
| Energy | Electricity (grid avg) | 0.233 kg / kWh |
| Shopping | Electronics | 0.067 kg / USD |

---

## API Endpoints

All routes are prefixed with `/api`.

### Activities
| Method | Path | Description |
|---|---|---|
| `GET` | `/activities` | List all activities (optional `?category=` filter) |
| `POST` | `/activities` | Log a new activity (CO₂ auto-calculated) |
| `GET` | `/activities/:id` | Get single activity |
| `PATCH` | `/activities/:id` | Update activity |
| `DELETE` | `/activities/:id` | Delete activity |

### Dashboard
| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard/summary` | Monthly totals, category breakdown, streak |
| `GET` | `/dashboard/trend` | Daily CO₂ totals for the past 30 days |

### Tips
| Method | Path | Description |
|---|---|---|
| `GET` | `/tips` | Personalized tips ranked by your top emission categories |

### Goals
| Method | Path | Description |
|---|---|---|
| `GET` | `/goals` | List goals with live current-period CO₂ |
| `POST` | `/goals` | Create a goal |
| `PATCH` | `/goals/:id` | Update a goal |
| `DELETE` | `/goals/:id` | Delete a goal |

### Offsets
| Method | Path | Description |
|---|---|---|
| `GET` | `/offsets/projects` | List all available offset projects |
| `GET` | `/offsets/purchases` | Summary + purchase history |
| `POST` | `/offsets/purchases` | Record an offset purchase |

---

## Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL (provided automatically on Replit)

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session signing |

### Commands

```bash
# Start the API server (port from $PORT env, default 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (port from $PORT env)
pnpm --filter @workspace/carbon-footprint run dev

# Regenerate API hooks and Zod schemas from openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes to the database (dev only)
pnpm --filter @workspace/db run push

# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build
```

### Making API Changes

The API contract is defined in `lib/api-spec/openapi.yaml`. The generated files in `lib/api-client-react` and `lib/api-zod` are derived from it — **never edit them by hand**.

1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Implement the new route in `artifacts/api-server/src/routes/`
4. Register the router in `artifacts/api-server/src/routes/index.ts`

### Adding a Database Table

1. Create `lib/db/src/schema/<table>.ts` following the Drizzle pattern
2. Export from `lib/db/src/schema/index.ts`
3. Run `pnpm --filter @workspace/db run push`

---

## Security Practices

- All request bodies are validated with generated Zod schemas before touching the database
- Structured logging with Pino redacts `Authorization` headers and cookies from logs
- Query-string parameters are stripped from request logs to prevent sensitive values leaking
- No raw SQL — all queries go through Drizzle ORM's parameterized query builder
- Environment secrets are managed via Replit Secrets and never committed to source

---

## Code Quality

- **TypeScript strict mode** across all packages via `tsconfig.base.json`
- **Contract-first API design** — OpenAPI spec is the single source of truth; client hooks and server validators are both generated from it
- **Separation of concerns** — each route file handles one resource; CO₂ calculation logic is isolated in its own module
- **Consistent error responses** — all routes return `{ error: string }` on 4xx with appropriate status codes
- **No `console.log`** in server code — all output is structured JSON via Pino with `req.log` in handlers

---

## Offset Projects

The marketplace includes 8 curated project types verified by Gold Standard, Verra VCS, and Plan Vivo:

1. Amazon Rainforest Conservation *(Reforestation)*
2. Kenyan Wind Farm *(Renewable Energy)*
3. Landfill Methane Capture — California *(Methane Capture)*
4. Seagrass Meadow Restoration — Croatia *(Ocean)*
5. Efficient Cookstoves — Uganda *(Community)*
6. Borneo Mangrove Protection *(Reforestation)*
7. Community Solar — Bangladesh *(Renewable Energy)*
8. Scottish Peatland Rewilding *(Reforestation)*

---

## License

MIT
