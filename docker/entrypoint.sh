#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database (safe to re-run)..."
npx tsx prisma/seed.ts

echo "Starting Missler Media Photography..."
exec npm start
