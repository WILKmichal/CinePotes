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

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: example)
- `DB_NAME` - Database name (default: mydatabase)
