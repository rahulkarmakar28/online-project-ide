#!/bin/bash
set -euo pipefail


cd ./worker

echo "Starting worker..."
npm run start &
echo "Worker started"

cd ../master

echo "Starting database..."
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:push
echo "Database started"

echo "Starting server..."
npm run start
echo "Server started"