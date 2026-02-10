# MS-Mail

Microservice d'envoi d'emails pour CinePotes.

## Lancement

```bash
pnpm install
pnpm run dev
```

Le serveur démarre sur le port **3003**.

## Swagger

```
http://localhost:3003/api-docs
```

## Configuration .env

Créez un fichier `.env` à la racine du projet (ms-mail):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=
```

## Tests

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests avec couverture
pnpm test:cov

# Lancer les tests en mode watch
pnpm test:watch

# Lancer uniquement les tests du service mail
pnpm test -- mail.service

# Lancer uniquement les tests du controller mail
pnpm test -- mail.controller
```
