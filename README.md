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
PORT=3002
APP_PORT=3002

# Base de donnees
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=mydatabase

# APIs externes
TMDB_API_KEY=
TMDB_MS_URL=http://localhost:3333
REDIS_URL=redis://localhost:6379

# Mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
USE_ETHEREAL=false
```

### Microservice TMDB (`apps/ms-tmdb/.env`)

```env
PORT=3333
TMDB_API_KEY=
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TMDB_MS_URL=http://localhost:3333/
```

> Generez votre propre cle TMDB sur [themoviedb.org](https://www.themoviedb.org/).

### Frontend client (`apps/fe-client/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_API_BG_URL=http://localhost:3002
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
```

### Microservice Mail (`apps/ms-mail/.env`)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
USE_ETHEREAL=false
```

---

## Lancement

### 1. Demarrer les services Docker

```bash
docker compose up
```

Cela lance PostgreSQL, Adminer (http://localhost:8080) et Redis.

### 2. Lancer les applications

```bash
pnpm run dev
```

| Application    | URL                            |
|----------------|--------------------------------|
| Frontend       | http://localhost:3001          |
| Backend (API)  | http://localhost:3002          |
| Swagger        | http://localhost:3002/api-docs |
| TMDB Service   | http://localhost:3333          |
| Adminer (BDD)  | http://localhost:8080          |
