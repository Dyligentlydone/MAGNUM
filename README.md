# MAGNUM — Auto Shop CRM

Next.js 15 + Supabase CRM tailored for an independent auto repair shop. Manages customers, vehicles, repair orders, appointments, parts & labor estimates, PDF quotes, and SMS notifications.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TailwindCSS 4, TanStack Query
- **Backend:** Next.js API routes (server-only), Supabase (Postgres + Storage + Auth cookie)
- **SMS:** Twilio (optional, disabled until creds are added)
- **PDF:** `@react-pdf/renderer`

## Local development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at https://supabase.com.
2. Open the project's **SQL Editor** and run the single consolidated schema script (the full "MAGNUM - Full Supabase Schema" block provided during handoff, or concatenate `supabase-crm-schema.sql`, `supabase-appointments-schema.sql`, `supabase-line-items-schema-CLEAN.sql`, `supabase-estimates-schema.sql`, and `supabase-sms-schema.sql` in that order).
3. Go to **Storage** → **New bucket** → name `repair-order-attachments`, **Public: off**.
4. In the SQL Editor, add a storage policy so the service role can read/write:
   ```sql
   CREATE POLICY "service_all_storage" ON storage.objects
     FOR ALL
     USING (bucket_id = 'repair-order-attachments')
     WITH CHECK (bucket_id = 'repair-order-attachments');
   ```

### 3. Populate `.env.local`
Copy `.env.local.example` → `.env.local` and fill in:

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL (**no trailing `/rest/v1/`**) | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` secret key | ✅ |
| `AUTH_SECRET` | Generate: `openssl rand -base64 48` | ✅ |
| `OWNER_APP_PIN` | 4-digit PIN (regex `^\d{4}$`) used at `/login` | ✅ |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` for dev, prod domain for prod | ✅ |
| `VOICEFLOW_AGENT_KEY` | Any shared secret; only needed if `/api/agent/*` is re-enabled | ❌ |
| Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`) | Twilio Console | only if SMS used |

### 4. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000. You'll be redirected to `/login` until you authenticate.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/               Login / session endpoints
│   │   ├── appointments/       Calendar data
│   │   ├── crm/
│   │   │   ├── customers/      Customer CRUD
│   │   │   ├── vehicles/       Vehicle CRUD
│   │   │   ├── repair-orders/  RO CRUD + attachments
│   │   │   ├── search/         Unified search (phone / VIN / text)
│   │   │   └── dashboard/      Active RO dashboard
│   │   ├── line-items/         Parts & labor line items
│   │   ├── estimates/          Standalone estimates + presets
│   │   └── settings/           Shop settings (labor rate, tax, company info)
│   ├── login/                  Password login page
│   └── ...                     UI pages (dashboard, estimate builder, etc.)
├── components/                 Shared UI (calendar, quote PDF, layout)
├── hooks/                      TanStack Query hooks
├── lib/
│   ├── supabase.ts             Public + admin Supabase clients
│   ├── supabase-crm.ts         CRM helper functions
│   └── api-client.ts           Fetch wrapper
├── types/                      Shared TS types
└── middleware.ts               Auth cookie verification (HMAC-SHA256)
```

## Common tasks

### Update shop info (displayed on quote PDFs)
```sql
UPDATE shop_settings SET value = jsonb_build_object(
  'name', 'MAGNUM Auto',
  'address', '123 Main St, Grand Rapids, MI',
  'phone', '(616) 555-0100',
  'email', 'service@magnum.com',
  'logo_url', ''
) WHERE key = 'company_info';
```

### Update labor rate / tax
```sql
UPDATE shop_settings SET value = '{"hourly_rate": 125, "default_hours": 1}'::jsonb
WHERE key = 'labor_rates';

UPDATE shop_settings SET value = '{"enabled": true, "rate": 6.0}'::jsonb
WHERE key = 'tax';
```

### Rotate the Supabase service-role key
1. Supabase Dashboard → Project Settings → API → Reset service role key.
2. Update `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in the production host (Railway/Vercel).
3. Redeploy.

### Rotate the login PIN
Change `OWNER_APP_PIN` in `.env.local` and in prod. Re-deploy. Existing session cookies remain valid until they expire (30 days) unless you also rotate `AUTH_SECRET`.

## Deployment

Any Next.js-compatible host works. **Required env vars in production:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `OWNER_APP_PIN`
- `NEXT_PUBLIC_APP_URL` set to the production domain

Run the same SQL in the production Supabase project. Create the same storage bucket + policy.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every request redirects to `/login` with no way through | `AUTH_SECRET` or `OWNER_APP_PIN` is missing |
| `/login` rejects a correct-looking PIN | `OWNER_APP_PIN` must be exactly 4 digits |
| API returns `401 Unauthorized` | `AUTH_SECRET` missing, or the auth cookie expired (30-day lifetime) |
| `Invalid path specified in request URL` from Supabase | `NEXT_PUBLIC_SUPABASE_URL` has a trailing `/rest/v1/` — remove it |
| Attachment upload 500s | `repair-order-attachments` storage bucket doesn't exist, or storage policy missing |
| Appointments don't appear on the calendar after creating a RO | The RO has no `estimated_completion` or `scheduled_drop_off` — calendar only syncs when at least one is set |
| SMS endpoints return 500 | Twilio env vars missing |

## Data model quick reference

- **customers** ← **vehicles** (1→many, FK `customer_id`) ← **repair_orders** (1→many, FK `vehicle_id`)
- **repair_orders** → **appointments** (1→2: one `scheduled_drop_off`, one `estimated_completion`)
- **repair_orders** → **repair_order_attachments** (1→many, `ON DELETE CASCADE`)
- **repair_orders** ← **line_items** (FK as TEXT `repair_order_id`)
- **estimates** standalone or linked to repair_orders; has own `estimate_items` table

## License

Proprietary — all rights reserved.
