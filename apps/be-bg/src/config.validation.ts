export function validateEnvironmentVariables(): void {
  const requiredVars = {
    APP_PORT: 'Application port (e.g., 3002)',
    NATS_URL: '⚠️  REQUIRED - NATS server URL (e.g., nats://localhost:4222 or nats://nats:4222 in Docker)',
    JWT_SECRET: '⚠️  REQUIRED - JWT secret for token verification (must match ms-auth)',
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
