import { config } from "dotenv";
config({ path: new URL(".env", import.meta.url).pathname });

const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "TRUSTED_ORIGINS",
  "INBOUND_WEBHOOK_TOKEN",
  "GROQ_API_KEY",
  "SENDGRID_API_KEY",
  "SENDGRID_FROM_EMAIL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
