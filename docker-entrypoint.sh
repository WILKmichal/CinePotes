#!/bin/bash
# Start the original entrypoint in the background
docker-entrypoint.sh postgres &

# Wait for Postgres to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 1
done

# Apply your init.sql every time
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql

# Keep the main process running
wait
