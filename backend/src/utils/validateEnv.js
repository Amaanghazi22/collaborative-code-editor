const REQUIRED_VARS = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "FRONTEND_URL",
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[startup] Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCopy .env.example to .env and fill in the values.`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error("[startup] JWT_SECRET must be at least 32 characters. Generate one with:\n  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
    process.exit(1);
  }
}
