import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import connectionRoutes from './routes/connection.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Public health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express-api' });
});

// Setup connection routes
app.use('/connections', connectionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(`Express API server running on port ${config.port}`);
});
