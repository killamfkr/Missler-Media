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

## Quick Start

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
