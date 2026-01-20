# Cinépote

## Lancer l’application en mode développement

### Prérequis

- Docker
- Docker Compose
- pnpm

### Installation des dépendances

À la racine du projet, installez les dépendances :
```
pnpm install
```
### Ajout variable env 

Dans l'application  be-bg, créer un fichier .env avec ces variables la :
```
PORT=3002
TMDB_MS_URL=http://localhost:3333/
```
Dans l'application ms-tmdb, créer un fichier .env avec ces variables la :
```
PORT=3333
TMDB_API_KEY=
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
TMDB_MS_URL=http://localhost:3333/
```
Generez vous même la clé TMDB. 

Dans l'application fe-client, créer un fichier .env avec la variable :
```
NEXT_PUBLIC_API_URL=http://localhost:3333/
### Ajout variable env 

Dans l'application ms-mail, créer un fichier .env avec ces variables la :
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact.cinepote@gmail.com
SMTP_PASSWORD=
USE_ETHEREAL=false
```


### Démarrage des services Docker

Toujours à la racine du projet, lancez les services nécessaires :

```
docker compose up
```

### Lancement des applications

Une fois les services Docker démarrés, lancez les applications du projet en mode développement :

```
pnpm run dev
```

