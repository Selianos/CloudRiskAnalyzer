import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'POSTGRES_DB', 'JWT_SECRET', 'EXPRESS_GOTRUE_URL'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required database environment variable: ${envVar}`);
  }
}

const dbUser = encodeURIComponent(process.env.POSTGRES_USER);
const dbPassword = encodeURIComponent(process.env.POSTGRES_PASSWORD);
const dbHost = process.env.POSTGRES_HOST;
const dbPort = process.env.POSTGRES_PORT;
const dbName = process.env.POSTGRES_DB;
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;
const authUrl = process.env.EXPRESS_GOTRUE_URL;
const internalBackendUrl = process.env.INTERNAL_BACKEND_URL || "http://internal-backend:8000";

export const config = {
  port: port,
  databaseUrl: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`,
  jwtSecret: jwtSecret,
  authUrl: authUrl,
  internalBackendUrl: internalBackendUrl,
};
