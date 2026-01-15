// BullMQ queue definitions

import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from './redis-client';
import { processWebhookEvent, processNotification, processExport } from '../workers/index';
import { log, LogLevel } from '../observability';

// Queue names
export enum QueueName {
  WEBHOOK_PROCESSING = 'webhook-processing',
  NOTIFICATIONS = 'notifications',
  EXPORTS = 'exports',
  SYNC = 'sync',
}

// Queue configurations
const queueConfigs = {
  [QueueName.WEBHOOK_PROCESSING]: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 1000, // Keep last 1000 failed jobs
    },
  },
  [QueueName.NOTIFICATIONS]: {
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  },
  [QueueName.EXPORTS]: {
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  },
  [QueueName.SYNC]: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30 seconds for sync operations
      },
      removeOnComplete: 20,
      removeOnFail: 100,
    },
  },
};

// Queue instances cache
const queues: Map<QueueName, Queue> = new Map();

// Get or create queue instance
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const config = queueConfigs[name] || {};
    const queue = new Queue(name, {
      connection: getRedisClient(),
      ...config,
    });

    queues.set(name, queue);
    console.log(`[Queue] Created queue: ${name}`);
  }

  return queues.get(name)!;
}

// Initialize all workers
export function initializeWorkers() {
  // Webhook processing worker
  new Worker(
    QueueName.WEBHOOK_PROCESSING,
    async (job: Job) => {
      const { eventId, tenantId } = job.data;
      log(LogLevel.INFO, 'Processing webhook event', { jobId: job.id, eventId, tenantId });
      
      try {
        await processWebhookEvent(eventId);
        log(LogLevel.INFO, 'Webhook event processed successfully', { jobId: job.id, eventId });
      } catch (error: any) {
        log(LogLevel.ERROR, 'Webhook processing failed', { 
          jobId: job.id, 
          eventId, 
          error: error.message,
          stack: error.stack 
        });
        throw error;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 5, // Process 5 webhooks concurrently
    }
  );

  // Notifications worker
  new Worker(
    QueueName.NOTIFICATIONS,
    async (job: Job) => {
      const { notificationId } = job.data;
      log(LogLevel.INFO, 'Processing notification', { jobId: job.id, notificationId });
      
      try {
        await processNotification(notificationId);
        log(LogLevel.INFO, 'Notification processed successfully', { jobId: job.id, notificationId });
      } catch (error: any) {
        log(LogLevel.ERROR, 'Notification processing failed', { 
          jobId: job.id, 
          notificationId, 
          error: error.message,
          stack: error.stack 
        });
        
        // Check if we should retry
        if (job.attemptsMade < (job.opts.attempts || 3)) {
          const delay = Math.min(1000 * Math.pow(2, job.attemptsMade), 30000);
          log(LogLevel.WARN, 'Retrying notification', { 
            jobId: job.id, 
            notificationId, 
            attempt: job.attemptsMade + 1,
            delay 
          });
        }
        
        throw error;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 10, // Send 10 notifications concurrently
    }
  );

  // Exports worker
  new Worker(
    QueueName.EXPORTS,
    async (job: Job) => {
      const { exportType, params } = job.data;
      log(LogLevel.INFO, 'Processing export', { jobId: job.id, exportType });
      
      try {
        await processExport(`${job.id}-${exportType}`);
        log(LogLevel.INFO, 'Export processed successfully', { jobId: job.id, exportType });
      } catch (error: any) {
        log(LogLevel.ERROR, 'Export processing failed', { 
          jobId: job.id, 
          exportType, 
          error: error.message,
          stack: error.stack 
        });
        throw error;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 2, // Only 2 concurrent exports to avoid resource exhaustion
    }
  );

  console.log('[Queue] All workers initialized');
}

// Add job to queue with proper typing
export async function addJob<T = any>(
  queueName: QueueName,
  data: T,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  }
): Promise<Job<T>> {
  const queue = getQueue(queueName);
  return queue.add(queueName, data, options);
}

// Get queue metrics
export async function getQueueMetrics(queueName: QueueName): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getQueue(queueName);
  
  const [
    waiting,
    active,
    completed,
    failed,
    delayed,
  ] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

// Clean old jobs
export async function cleanOldJobs(queueName: QueueName, maxAgeHours: number = 24): Promise<number> {
  const queue = getQueue(queueName);
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  const cutoff = Date.now() - maxAge;

  // This is a simplified cleanup - in production, you might want more sophisticated cleanup
  const jobs = await queue.getJobs(['completed', 'failed']);
  const oldJobs = jobs.filter(job => job.timestamp < cutoff);
  
  for (const job of oldJobs) {
    await job.remove();
  }

  return oldJobs.length;
}

// Close all queues (for graceful shutdown)
export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues) {
    await queue.close();
    console.log(`[Queue] Closed queue: ${name}`);
  }
  queues.clear();
}

// Retry failed jobs
export async function retryFailedJobs(queueName: QueueName, count: number = 100): Promise<number> {
  const queue = getQueue(queueName);
  const failedJobs = await queue.getFailed(0, count - 1);
  
  let retried = 0;
  for (const job of failedJobs) {
    await job.retry();
    retried++;
  }

  return retried;
}
