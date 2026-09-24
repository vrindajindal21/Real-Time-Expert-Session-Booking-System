const { Queue } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Connection options for BullMQ
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  enableReadyCheck: false
});

redisConnection.on('error', (err) => {
  logger.error('❌ Redis connection error (Queue):', err.message);
});

// Initialize the Email Queue
const emailQueue = new Queue('EmailQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, then 25s, then 125s
    },
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: false // Keep failed jobs so we can inspect/retry via Bull-Board
  }
});

logger.info('🚀 BullMQ EmailQueue initialized');

module.exports = {
  redisConnection,
  emailQueue
};
