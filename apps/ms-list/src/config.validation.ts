export function validateEnvironmentVariables(): void {
  const requiredVars = {
    NATS_URL: 'URL du broker NATS (e.g., nats://localhost:4222)',
    DB_HOST: 'Host PostgreSQL (e.g., localhost)',
    DB_PORT: 'Port PostgreSQL (e.g., 5432)',
    DB_USER: 'Utilisateur PostgreSQL',
    DB_PASSWORD: 'Credential PostgreSQL',
    DB_NAME: 'Nom de la base de donnees',
  };

  const missing = Object.entries(requiredVars)
    .filter(([key]) => !process.env[key])
    .map(([key, description]) => `  • ${key}: ${description}`);

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    console.error(missing.join('\n'));
    process.exit(1);
  }
}
