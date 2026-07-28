import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.API_DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};
