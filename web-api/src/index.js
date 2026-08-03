import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import routes from './routes/index.js';
import { config } from './config.js';

const app = express();

const pool = new pg.Pool({
  connectionString: config.databaseUrl
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

// Test connection on startup and log result
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully via Prisma');
  })
  .catch((err) => {
    console.error('Failed to connect to the database on startup:', err.message);
  });

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const [dbResult, internalResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    fetch(`${config.internalBackendUrl}/internal/health`).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  ]);

  const database = dbResult.status === 'fulfilled' ? 'healthy' : 'unhealthy';
  const internalBackend = internalResult.status === 'fulfilled' ? 'healthy' : 'unhealthy';
  const allHealthy = database === 'healthy' && internalBackend === 'healthy';

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'error',
    service: 'web-api',
    database: database,
    internal_backend: internalBackend,
  });
});

app.use('/api', routes);

// 404 Not Found handler
app.use((req, res, next) => {
  res.status(404).end(`Can't ${req.url}`);
});

// Global JSON error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(`Express API running on port ${config.port}`);
});