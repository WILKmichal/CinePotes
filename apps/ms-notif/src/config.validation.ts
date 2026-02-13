export function validateEnvironmentVariables(): void {
  const requiredVars = {
    NATS_URL: "URL du broker NATS (e.g., nats://localhost:4222)",
    REDIS_HOST: "Host Redis pour BullMQ (e.g., localhost)",
    REDIS_PORT: "Port Redis pour BullMQ (e.g., 6379)",
  };

  const missing = Object.entries(requiredVars)
    .filter(([key]) => !process.env[key])
    .map(([key, description]) => `  • ${key}: ${description}`);

  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:\n");
    console.error(missing.join("\n"));
    process.exit(1);
  }
}
