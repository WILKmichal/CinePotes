export function validateEnvironmentVariables(): void {
  const requiredVars = {
    DB_HOST: 'postgres database host (e.g., localhost)',
    DB_PORT: 'postgres database port (e.g., 5432)',
    DB_USER: 'postgres database user (e.g., postgres)',
    DB_PASSWORD: 'postgres database password (e.g., example)',
    DB_NAME: 'postgres database name (e.g., mydatabase)',
    APP_PORT: 'Application port (e.g., 3002)',
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
