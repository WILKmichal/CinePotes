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

> **IMPORTANT** : `JWT_SECRET` doit etre **identique** dans `apps/be-bg/.env` et `apps/ms-auth/.env`.
> Les deux services signent/verifient les memes tokens JWT — une difference = `Unauthorized` partout.

---

### Backend principal (`apps/be-bg/.env`)

```env
PORT=3002
APP_PORT=3002
TMDB_API_KEY=                         # Generer sur themoviedb.org
REDIS_URL=redis://localhost:6379

TMDB_MS_URL=http://localhost:3333

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=example
DB_NAME=mydatabase

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
USE_ETHEREAL=false

VERIFICATION_MAIL=FALSE

NATS_URL=nats://localhost:4222

JWT_SECRET=CHANGE_ME_NOW             # Doit etre identique a ms-auth
```

---

### Microservice Auth (`apps/ms-auth/.env`)

```env
APP_PORT=3002
NATS_URL=nats://localhost:4222
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=example
DB_NAME=mydatabase
JWT_SECRET=CHANGE_ME_NOW             # Doit etre identique a be-bg
RESET_PASSWORD_EXPIRES_MINUTES=30
FRONT_RESET_PASSWORD_URL=http://localhost:3000/reset-password
VERIFICATION_MAIL=FALSE
```

---

### Microservice Notification (`apps/ms-notif/.env`)

```env
NATS_URL=nats://localhost:4222
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### Microservice Library (`apps/ms-library/.env`)

```env
PORT=3333
TMDB_API_KEY=                         # Generer sur themoviedb.org
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TMDB_MS_URL=http://localhost:3333
NATS_URL=nats://localhost:4222
```

---

### Microservice List (`apps/ms-list/.env`)

```env
NATS_URL=nats://localhost:4222
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=example
DB_NAME=mydatabase
```

---

### Microservice Sessions (`apps/ms-sessions/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=example
DB_NAME=mydatabase
NATS_URL=nats://localhost:4222
```

---

### Worker Gmail (`apps/worker-gmail/.env`)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

---

### Frontend client (`apps/fe-client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
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
| Frontend client      | http://localhost:3001          |
| Frontend admin       | http://localhost:3000          |
| Backend (API)        | http://localhost:3002          |
| Swagger              | http://localhost:3002/api-docs |
| ms-library (NATS)    | Microservice (pas de HTTP)     |
| ms-list (NATS)       | Microservice (pas de HTTP)     |
| ms-notif (NATS)      | Microservice (pas de HTTP)     |
| ms-auth (NATS)       | Microservice (pas de HTTP)     |
| ms-sessions (NATS)   | Microservice (pas de HTTP)     |
| worker-gmail (Redis) | Worker (pas de HTTP)           |
| Adminer (BDD)        | http://localhost:8080          |
| Redis Commander      | http://localhost:8081          |
| NATS Monitoring      | http://localhost:8222          |
