const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { redisConnection } = require('../config/queue');
const logger = require('../utils/logger');

// Create transporter inside the worker process
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Initialize the Worker
const emailWorker = new Worker('EmailQueue', async (job) => {
  const { to, subject, html } = job.data;
  
  logger.info(`[Worker] Processing email job ${job.id} to ${to}`);

  // If credentials are placeholders, simulate success
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_gmail')) {
    logger.info(`[Worker] 📧 DEVELOPER PREVIEW: Faked email to ${to} (Subject: ${subject})`);
    // Simulate a 1-second delay to mimic SMTP overhead
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { messageId: 'simulated-dev-id' };
  }

  const transporter = createTransporter();
  
  // Actually send the email (this blocks the worker, not the main API!)
  const info = await transporter.sendMail({
    from: `"Expert Booking Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

  logger.info(`[Worker] ✅ Email sent to ${to} — ${info.messageId}`);
  return info;
}, {
  connection: redisConnection,
  concurrency: 5 // Process up to 5 emails concurrently
});

emailWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job.id} has failed: ${err.message}`);
});

module.exports = emailWorker;
