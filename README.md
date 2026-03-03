# CinePotes

Application collaborative pour organiser des soirees cinema entre amis.

---

## Prerequis

- [Docker](https://www.docker.com/) et Docker Compose
- [pnpm](https://pnpm.io/) (v10+)
- [Node.js](https://nodejs.org/) (v18+)

---

## Installation

```bash
pnpm install
```

---

## Variables d'environnement

Chaque application necessite un fichier `.env` a sa racine.

### Racine du projet (`/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=mydatabase

JWT_SECRET=
JWT_EXPIRES_IN=3600s
```

### Backend principal (`apps/be-bg/.env`)

```env
# Serveur
APP_PORT=3002

DB_NAME=mydatabase
JWT_SECRET=une_clef_complexe_a_changer
JWT_EXPIRES_IN=3600s
APP_PORT=3002
VERIFICATION_MAIL=TRUE
```

### Microservice Library (`apps/ms-library/.env`)

```env
PORT=3333
TMDB_API_KEY=
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TMDB_MS_URL=http://localhost:3333/
NATS_URL=nats://localhost:4222
```

> Generez votre propre cle TMDB sur [themoviedb.org](https://www.themoviedb.org/).

### Microservice Notification (`apps/ms-notif/.env`)

```env
NATS_URL=nats://localhost:4222
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Microservice List (`apps/ms-list/.env`)

```env
NATS_URL=nats://localhost:4222
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=mydatabase
```

### Worker Gmail (`apps/worker-gmail/.env`)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

### Frontend client (`apps/fe-client/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
```

---

### Ms-Library (`apps/ms-library/.env`)

```env
PORT=3333
TMDB_API_KEY=
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TMDB_MS_URL=http://localhost:3333
NATS_URL=nats://localhost:4222
```
### Ms-Auth(`apps/ms-auth/.env`)
```env
APP_PORT=3002
NATS_URL=nats://localhost:4222
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=mydatabase
JWT_SECRET=
RESET_PASSWORD_EXPIRES_MINUTES=30
FRONT_RESET_PASSWORD_URL=http://localhost:3000/reset-password
VERIFICATION_MAIL=TRUE
```

### Ms-session(`apps/ms-session/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=mydatabase
NATS_URL=nats://localhost:4222
```

---

## Lancement

### 1. Demarrer les services Docker

```bash
docker compose up
```

Cela lance PostgreSQL, Adminer (http://localhost:8080), Redis, Redis Commander (http://localhost:8081) et NATS.

### 2. Lancer les applications

```bash
pnpm run dev
```

| Application          | URL                            |
|----------------------|--------------------------------|
| Frontend             | http://localhost:3001          |
| Backend (API)        | http://localhost:3002          |
| Swagger              | http://localhost:3002/api-docs |
| ms-library (NATS)    | Microservice (pas de HTTP)     |
| ms-list (NATS)       | Microservice (pas de HTTP)     |
| ms-notif (NATS)      | Microservice (pas de HTTP)     |
| worker-gmail (Redis) | Worker (pas de HTTP)           |
| Adminer (BDD)        | http://localhost:8080          |
| Redis Commander      | http://localhost:8081          |
| NATS Monitoring      | http://localhost:8222          |
