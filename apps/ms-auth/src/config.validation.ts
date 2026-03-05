export function validateEnvironmentVariables(): void {
  const requiredVars = {
    APP_PORT: 'Application port (e.g., 3002)',
    NATS_URL: '⚠️  REQUIRED - NATS server URL (e.g., nats://localhost:4222)',
    DB_HOST: 'Database host (e.g., localhost)',
    DB_PORT: 'Database port (e.g., 5432)',
    DB_USER: 'Database user (e.g., postgres)',
    DB_PASSWORD: 'Database password',
    DB_NAME: 'Database name (e.g., mydatabase)',
    JWT_SECRET: '⚠️  REQUIRED - JWT secret for token signing',
    RESET_PASSWORD_EXPIRES_MINUTES: '⚠️  REQUIRED - Password reset token expiration in minutes',
    FRONT_RESET_PASSWORD_URL: 'Frontend URL for password reset (e.g., http://localhost:3000/reset-password)',
    VERIFICATION_MAIL: 'Enable verification mail (TRUE or FALSE)',
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