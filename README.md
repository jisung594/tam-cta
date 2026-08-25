# CTA Transit Alerts Dashboard

A compact dashboard for monitoring CTA service alerts, planned work, and active transit disruptions across Chicago train and bus routes.

## Project Overview

- Pulls live alert data from the CTA API
- Normalizes and classifies impacted lines and routes
- Stores alert history in PostgreSQL via Drizzle ORM
- Exposes API routes for dashboard rendering and scheduled ingestion
- Visualizes disruption counts by line and severity in the frontend

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Recharts
- PostgreSQL / Supabase
- Drizzle ORM + drizzle-kit
- GitHub Actions cron-style ingestion flow

## Architecture

### 1. Live data intake

- `app/api/cta/alerts/route.ts` fetches the live CTA alerts feed and reshapes it for the frontend
- `src/lib/cta-client.ts` handles the ingestion path used by the cron job and database sync pipeline
- Alert records are transformed into typed objects in `src/types/alerts.ts`

### 2. Data persistence

- `src/db/schema.ts` defines the core tables:
  - `alerts`
  - `alert_impacted_services`
- `src/db/services/ingest.ts` upserts active alerts and resolves stale entries that disappear from the feed

### 3. Dashboard UI

- `app/page.tsx` renders the main dashboard
- `src/components/CTAAlertsDashboard/CTAAlertsDashboard.tsx` contains the line filters, summary metrics, and alert cards
- `src/components/AlertsRadialChart/AlertsRadialChart.tsx` and helper utilities in `src/utils/chartHelpers.ts` power the visualizations

## Data flow

CTA API -> transform/normalize -> database sync -> dashboard / charts

The project is designed around a simple operational flow:

1. Fetch raw CTA alert payloads
2. Normalize route IDs, service names, severity, and timing
3. Store active records in Postgres
4. Resolve stale alerts when they disappear from the feed
5. Display filtered summaries and detailed alert cards in the client

## Database and migrations

Schema definitions live in `src/db/schema.ts` and migrations are tracked in the `drizzle/` folder.

```bash
# Generate new SQL migrations
npx drizzle-kit generate

# Apply pending migrations
npx drizzle-kit migrate
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file named `.env.local` in the project root.

3. Add required variables such as:

```env
DATABASE_URL="postgres://postgres:[PASSWORD]@[HOST]:5432/postgres"
CRON_SECRET="your-local-cron-secret"
```

4. Run the app:

```bash
npm run dev
```

5. Optional: run the ingestion cron endpoint locally with authorization disabled in development mode.

## Cron ingestion endpoint

The project includes a scheduled ingestion route at:

- `app/api/cron/ingest/route.ts`

This endpoint:

- calls the CTA feed
- transforms raw alerts
- syncs the database
- returns processed/resolved counts

Production deployments should protect this route with a bearer token using `CRON_SECRET`.

## Notes

- The app currently supports real-time CTA data through the live API route and database-backed ingestion flow.
- The dashboard can filter by line and search by route or alert text.
- Severity levels are normalized to `minor`, `major`, and `critical`.
- Alerts are linked to impacted services, including train lines and bus routes.
