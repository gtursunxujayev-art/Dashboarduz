import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { trpcMiddleware } from './trpc/server';
import webhookRouter from './webhooks';
import { initSentry, log, LogLevel } from './services/observability';
import { initializeWorkers } from './services/queue/queues';
import { checkRedisHealth } from './services/queue/redis-client';
import { applyObservabilityMiddleware } from './middleware/observability';

dotenv.config();

// Initialize observability
initSentry();

// Initialize queue workers
try {
  initializeWorkers();
  log(LogLevel.INFO, 'Queue workers initialized');
} catch (error: any) {
  log(LogLevel.ERROR, 'Failed to initialize queue workers', { error: error.message });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Apply observability middleware first
applyObservabilityMiddleware(app);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    const redisHealth = await checkRedisHealth();
    const healthStatus = {
      status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        redis: redisHealth,
      },
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Queue metrics endpoint (protected in production)
app.get('/health/queues', async (req, res) => {
  try {
    const { queueService } = await import('./services/queue');
    const health = await queueService.healthCheck();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Webhook endpoints (public, signature-verified)
app.use('/webhooks', webhookRouter);

// tRPC endpoint
app.use('/api/trpc', trpcMiddleware);

// API info
app.get('/api', (req, res) => {
  res.json({ message: 'Dashboarduz API v1', trpc: '/api/trpc', webhooks: '/webhooks' });
});

app.listen(PORT, () => {
  log(LogLevel.INFO, 'API server started', { port: PORT });
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
});
