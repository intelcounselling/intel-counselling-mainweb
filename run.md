# How to Run the Project (Monorepo Workspace)

This project has been reorganized into a monorepo containing a React + Vite frontend (`frontend/` workspace) and an Express backend API server (`backend/` workspace).

## Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

---

## 1. Setup Environment Variables
Create a file named `.env.local` in the **root** directory and define the following variables:

```env
# Gemini API Key (Required for the AI features in the frontend)
GEMINI_API_KEY=your_gemini_api_key_here

# Cashfree Credentials (Required for payment processing)
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here

# Brevo API Key (Required for email communications)
BREVO_API_KEY=your_brevo_api_key_here

# Encryption Key (Required for encrypting assessment answers in the database)
# Generate a strong random key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here

# Google Calendar Integration (Optional/Required for Google Meet integrations)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your-google-calendar-id
```

---

## 2. Install Dependencies
Run the following command in the **root** directory. Since npm workspaces are configured, this will automatically install all dependencies for the root, frontend, and backend packages:
```bash
npm install
```

---

## 3. Run the Applications

You can run both the frontend and backend servers together concurrently, or run them in separate terminal tabs.

### Option A: Run Frontend & Backend Concurrently (Recommended)
To start both the frontend Vite development server and the backend Express API server at the same time, run:
```bash
npm run dev
```

- **Frontend Server:** Runs on [http://localhost:3000/](http://localhost:3000/)
- **Backend API Server:** Runs on [http://localhost:3001/](http://localhost:3001/)

### Option B: Run Frontend & Backend Separately
If you want to run or debug them in separate terminal tabs:

**Start the Frontend only:**
```bash
npm run dev:frontend
```

**Start the Backend only:**
```bash
npm run dev:backend
```

---

## 4. Verification

- **Frontend:** Open [http://localhost:3000/](http://localhost:3000/) in your browser. You should see the application load correctly.
- **Backend:** The backend console should output:
  `Unified Backend API Server running on port 3001`
  `Connected to SQLite database at .../backend/database.sqlite`

---

## 5. Render Deployment (Backend)

The backend is deployed as a Render Web Service at `https://intel-counselling.onrender.com`
(the Vercel frontend proxies `/api/*` to it via `frontend/vercel.json`).

### Service settings (Root Directory = `backend`)

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` (runs `prisma generate`) |
| Start Command | `npm start` (runs `node server.js`) |
| Health Check Path | `/api/health` |

> **Note:** `backend/package-lock.json` is now committed, so the build command may
> be either `npm install && npm run build` or the stricter `npm ci && npm run build`
> (both run `prisma generate`). If you add/update backend dependencies, regenerate
> the lockfile (`npm install --package-lock-only` inside `backend/`) and commit it.
> `engines.node` is pinned to `>=20` in `backend/package.json` so Render uses an
> LTS version the dependency set (Prisma 5, sqlite3 native build) supports.

### Required environment variables (Render → Environment)

```env
DATABASE_URL=postgres://...          # Postgres for the Mindbridge portal (Prisma)
DIRECT_URL=postgres://...            # Usually same as DATABASE_URL
ENCRYPTION_KEY=<64-char-hex>         # Main-site assessment encryption (hard-fails endpoints if missing in prod)
AUTH_TOKEN_SECRET=<random>           # Main-site session signing
JWT_ACCESS_SECRET=<random>           # Mindbridge portal access tokens
JWT_REFRESH_SECRET=<random>          # Mindbridge portal refresh tokens
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}   # Optional — falls back to local JWT
CASHFREE_APP_ID / CASHFREE_SECRET_KEY / BREVO_API_KEY       # Payments + email
ALLOWED_ORIGINS=https://<vercel-frontend-domain>            # CORS in production
DEMO_MODE=true|false                        # Optional — every price becomes ₹0.1 when true (see below)
```

### Demo mode (₹1 prices)

Set `DEMO_MODE=true` on the backend (Render → Environment, or root `.env.local`
locally) and **restart/redeploy** — every service price becomes ₹1:

- `create-cashfree-session` charges ₹1 for every service (the amount is
  derived server-side in `backend/src/pricing.js`; the client never sends one).
- `GET /api/config` returns `{ demoMode: true, prices: { ...all 1 } }` and the
  frontend (`CareerPaymentGate`, `BookingModal`, `CareerGuidancePage`) displays
  ₹1 with a small "Demo" badge.
- Set `DEMO_MODE=false` (or remove it) and restart — normal prices return.
  No code changes are required to toggle it in either direction.

### Diagnosing a failed deploy

1. Render Dashboard → service → **Events** tab shows the failed build/deploy reason.
2. **Logs** tab shows runtime output.
3. A very common silent failure: the deploy "succeeds" but the service keeps
   running the previous build (Render restarts the old instance if the new
   one fails its health check). Verify what commit is live: the latest
   commit adds `GET /api/db-status` —
   if `https://intel-counselling.onrender.com/api/db-status` returns 404, the
   running instance is **stale** and the newest deploy did not go live.
4. Remember: free-tier instances spin down after 15 min idle; the first request
   after idle can take ~30–60 s (this is a cold start, not a failure).
5. **Build fails at `prisma db push` with `FATAL: (ENOTFOUND) tenant/user
   postgres.<ref> not found`** — this is a Supabase (Supavisor) pooler
   rejection meaning the project ref `<ref>` in `DATABASE_URL`/`DIRECT_URL`
   has no active project behind it. The host resolving and accepting TCP is
   normal; the pooler itself rejects the unknown tenant. Causes, in order of
   likelihood:
   - The Supabase project is **paused** (free tier auto-pauses after ~1 week
     of inactivity) → restore it in the Supabase dashboard and redeploy.
   - The project was **deleted** or the ref in the connection string is
     stale/typo'd → copy a fresh connection string from Supabase → Project
     Settings → Database → Connection pooling.
   - Wrong pooler region prefix in the hostname (`aws-0` vs `aws-1`, region)
     → use the exact hostname Supabase shows for this project.
   Also: `DIRECT_URL` (used for migrations/db push) should ideally be the
   **direct** connection (`db.<ref>.supabase.co:5432`), not the pooled one.

### Known limitation: SQLite on Render

`backend/src/db.js` uses a file-based SQLite database created on Render's
**ephemeral disk** — all assessment/user data is wiped on every redeploy and
restart. The `/api/db-status` endpoint was added to debug this. The proper fix
is a Render Persistent Disk, or migrating the main-site store to the same
Postgres instance the portal uses.
