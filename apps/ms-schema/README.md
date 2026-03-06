# ms-schema

Database schema initialization microservice for CinePotes.

This service initializes the database schema by running TypeORM synchronization on startup, then exits cleanly. All other services depend on this service completing before they can start.

## Running

```bash
pnpm dev          # Development mode
pnpm build        # Build for production
pnpm start:prod   # Run compiled application
```

## Environment Variables

- `DB_HOST` - PostgreSQL host (required)
- `DB_PORT` - PostgreSQL port (required, positive integer)
- `DB_USER` - Database user (required)
- `DB_PASSWORD` - Database password (required)
- `DB_NAME` - Database name (required)

At startup, `ms-schema` validates these variables and exits with an explicit error when one is missing or invalid. Any extra `DB_*` variable present in `.env` but not used by `ms-schema` is reported as not needed.
