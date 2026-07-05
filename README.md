# Missler Media Photography

A full-stack photography business website with client accounts, appointment booking, pricing, payments, and Google Photos integration.

## Features

- **Homepage spotlight** — Admin-configurable photo carousel with Book Appointment CTA
- **Client accounts** — Registration with name, email, phone, and address
- **Appointments** — Book sessions on admin-configured open days
- **Pricing** — Session packages visible after account creation
- **Payments** — Stripe, PayPal, and Venmo support
- **Photo galleries** — Google Photos integration; clients access purchased photos after sessions
- **Admin panel** — Manage spotlight photos, open days, pricing, accounts, payments, and photo access

## Docker (no `.env`, no git clone)

Pull the pre-built image from GitHub Container Registry. All configuration lives in `docker-compose.yml` — no `.env` file needed.

### 1. Download only the compose file

```bash
curl -fsSL -o docker-compose.yml \
  https://raw.githubusercontent.com/killamfkr/Missler-Media/cursor/missler-media-photography-827c/docker-compose.yml
```

### 2. Edit variables in `docker-compose.yml`

Open the file and update the values under `web.environment` (at minimum `AUTH_SECRET` and your public URL if not using localhost).

### 3. Start

```bash
docker compose pull
docker compose up -d
```

Open **http://localhost:3000**

**Default admin:** `admin@misslermedia.com` / `admin12345`

### Architecture

| Service | Role |
|---------|------|
| `sqlite` | Sidecar that owns the persistent `/data` volume for the SQLite database file |
| `web` | App image from `ghcr.io/killamfkr/missler-media:latest` — shares the same volume |

The SQLite sidecar does not run a database server (SQLite is file-based). It holds the volume so your data survives container restarts.

### Production URL

When using a real domain, update these in `docker-compose.yml`:

```yaml
NEXT_PUBLIC_APP_URL: "https://photos.yourdomain.com"
GOOGLE_REDIRECT_URI: "https://photos.yourdomain.com/api/google/callback"
```

Also add the same redirect URI in Google Cloud Console.

### Building the image yourself

If the registry image is not available yet, build locally:

```bash
docker build -t ghcr.io/killamfkr/missler-media:latest .
docker compose up -d
```

Or change `docker-compose.yml` to build from source:

```yaml
web:
  build: .
  # image: ghcr.io/killamfkr/missler-media:latest  # comment out image line
```

## Quick Start (local development)

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin Account

- **Email:** admin@misslermedia.com
- **Password:** admin12345

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |
| `AUTH_SECRET` | NextAuth secret key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `NEXT_PUBLIC_APP_URL` | App base URL |

## Google Photos Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Photos Library API**
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URI: `http://localhost:3000/api/google/callback`
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
6. Sign in as admin → Admin → Google Photos → Connect

## Payment Setup

Enable payment methods in **Admin → Payment Options**:

- **Stripe** — Add publishable key in admin; set `STRIPE_SECRET_KEY` in `.env`
- **PayPal** — Add client ID in admin; set `PAYPAL_CLIENT_SECRET` in `.env`
- **Venmo** — Set your Venmo username; clients pay manually and confirm

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth.js
- Stripe, PayPal, Google Photos API

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:setup` | Migrate database and seed |
| `npm run db:seed` | Re-run seed data |
