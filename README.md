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
PORT=3001
REDIS_URL=redis://localhost:6379
TMDB_API_KEY=
```

Generez vous même la clé TMDB. 

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

