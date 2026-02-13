export function validateEnvironmentVariables(): void {
  const requiredVars = {
    REDIS_HOST: "Host Redis pour BullMQ (e.g., localhost)",
    REDIS_PORT: "Port Redis pour BullMQ (e.g., 6379)",
    SMTP_HOST: "Host SMTP (e.g., smtp.gmail.com)",
    SMTP_PORT: "Port SMTP (e.g., 587)",
    SMTP_USER: "Adresse email SMTP",
    SMTP_PASSWORD: "Mot de passe applicatif SMTP",
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
