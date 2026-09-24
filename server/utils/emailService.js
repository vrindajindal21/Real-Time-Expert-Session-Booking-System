/**
 * Email Service — BullMQ Integration with Memory Fallback
 * Pushes email jobs to the Redis Queue if REDIS_URL exists, otherwise uses setImmediate memory fallback
 */
const nodemailer = require('nodemailer');

let emailQueue = null;
if (process.env.REDIS_URL) {
  const queueConfig = require('../config/queue');
  emailQueue = queueConfig.emailQueue;
}

// Create transporter (supports Gmail, Outlook, or any SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // App password for Gmail
    }
  });
};

/**
 * Core send function (pushes to queue OR falls back to memory)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (emailQueue) {
    // Push the job to BullMQ
    // Returns instantly in < 2ms without blocking the HTTP thread
    try {
      const job = await emailQueue.add('send-email', { to, subject, html });
      console.log(`📨 Queued email to ${to} (Job ID: ${job.id})`);
      return { queued: true, jobId: job.id };
    } catch (error) {
      console.error('❌ Failed to enqueue email:', error.message);
      throw error;
    }
  } else {
    // FALLBACK: In-memory async execution (No Redis required)
    return new Promise((resolve) => {
      resolve({ messageId: 'memory-background-queued' });

      setImmediate(async () => {
        try {
          if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_gmail')) {
            console.log('\n--- 📧 DEVELOPER EMAIL PREVIEW (MEMORY FALLBACK) ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('Template: HTML Template Rendered Successfully');
            console.log('--- 🛑 Setup Required: Add your EMAIL_USER and EMAIL_PASS to server/.env for actual delivery ---\n');
            return;
          }

          const transporter = createTransporter();
          const info = await transporter.sendMail({
            from: `"Expert Booking Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
          });
          console.log(`✉️  Email sent to ${to} — ${info.messageId}`);
        } catch (err) {
          console.error('❌ Email send failed:', err.message);
        }
      });
    });
  }
};

/**
 * Booking Confirmation Email (to Customer)
 */
const sendBookingConfirmation = async (booking, expertName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
        .body { padding: 40px; }
        .booking-card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .field { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .field:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .label { color: #64748b; font-size: 14px; font-weight: 600; }
        .value { color: #1e293b; font-size: 14px; font-weight: 700; text-align: right; }
        .badge { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Booking Confirmed!</h1>
          <p>Your session has been successfully scheduled</p>
        </div>
        <div class="body">
          <p style="color:#475569; font-size:16px;">Hello <strong>${booking.customerName}</strong>,</p>
          <p style="color:#475569; font-size:15px;">Your booking with <strong>${expertName}</strong> has been confirmed. Here are the details:</p>
          
          <div class="booking-card">
            <div class="field">
              <span class="label">📋 Booking ID</span>
              <span class="value">${booking.bookingId}</span>
            </div>
            <div class="field">
              <span class="label">👨‍💼 Expert</span>
              <span class="value">${expertName}</span>
            </div>
            <div class="field">
              <span class="label">🎯 Service</span>
              <span class="value">${booking.serviceTitle}</span>
            </div>
            <div class="field">
              <span class="label">📅 Date</span>
              <span class="value">${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="field">
              <span class="label">⏰ Time</span>
              <span class="value">${booking.startTime} — ${booking.endTime}</span>
            </div>
            <div class="field">
              <span class="label">💰 Amount</span>
              <span class="value">₹${booking.price}</span>
            </div>
            <div class="field">
              <span class="label">📊 Status</span>
              <span class="value"><span class="badge">Confirmed</span></span>
            </div>
          </div>

          <p style="color:#475569; font-size:14px;">Please be ready 5 minutes before your session. You can chat with your expert through the platform.</p>
        </div>
        <div class="footer">
          <p>Expert Booking Platform — Real-time session management</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: booking.customerEmail,
    subject: `✅ Booking Confirmed — ${booking.serviceTitle} with ${expertName}`,
    html
  });
};

/**
 * Booking Notification Email (to Expert)
 */
const sendExpertNotification = async (booking, expertEmail, expertName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .booking-card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .field { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .field:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .label { color: #64748b; font-size: 14px; font-weight: 600; }
        .value { color: #1e293b; font-size: 14px; font-weight: 700; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Booking Received!</h1>
        </div>
        <div class="body">
          <p style="color:#475569">Hello <strong>${expertName}</strong>, you have a new booking!</p>
          <div class="booking-card">
            <div class="field"><span class="label">👤 Customer</span><span class="value">${booking.customerName}</span></div>
            <div class="field"><span class="label">📧 Email</span><span class="value">${booking.customerEmail}</span></div>
            <div class="field"><span class="label">📞 Phone</span><span class="value">${booking.customerPhone}</span></div>
            <div class="field"><span class="label">🎯 Service</span><span class="value">${booking.serviceTitle}</span></div>
            <div class="field"><span class="label">📅 Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div class="field"><span class="label">⏰ Time</span><span class="value">${booking.startTime} — ${booking.endTime}</span></div>
            ${booking.notes ? `<div class="field"><span class="label">📝 Notes</span><span class="value">${booking.notes}</span></div>` : ''}
          </div>
          <p style="color:#475569; font-size:14px;">Log into your dashboard to confirm or manage this booking.</p>
        </div>
        <div class="footer"><p>Expert Booking Platform</p></div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: expertEmail,
    subject: `🔔 New Booking from ${booking.customerName} — ${booking.serviceTitle}`,
    html
  });
};

/**
 * Booking Cancellation Email
 */
const sendCancellationEmail = async (booking, expertName, cancelledBy) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .booking-card { background: #fef2f2; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #fecaca; }
        .field { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .label { color: #64748b; font-size: 14px; }
        .value { color: #1e293b; font-size: 14px; font-weight: 700; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>❌ Booking Cancelled</h1></div>
        <div class="body">
          <p style="color:#475569;">Hello <strong>${booking.customerName}</strong>,</p>
          <p style="color:#475569;">Your booking has been cancelled by <strong>${cancelledBy}</strong>.</p>
          <div class="booking-card">
            <div class="field"><span class="label">Booking ID</span><span class="value">${booking.bookingId}</span></div>
            <div class="field"><span class="label">Expert</span><span class="value">${expertName}</span></div>
            <div class="field"><span class="label">Service</span><span class="value">${booking.serviceTitle}</span></div>
            <div class="field"><span class="label">Date</span><span class="value">${new Date(booking.date).toLocaleDateString('en-IN')}</span></div>
            <div class="field"><span class="label">Time</span><span class="value">${booking.startTime} — ${booking.endTime}</span></div>
          </div>
          <p style="color:#475569; font-size:14px;">If you have questions, please contact support. You can rebook anytime.</p>
        </div>
        <div class="footer"><p>Expert Booking Platform</p></div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: booking.customerEmail,
    subject: `❌ Booking Cancelled — ${booking.serviceTitle}`,
    html
  });
};

/**
 * Password Reset Email
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; text-align: center; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 24px 0; }
        .warning { background: #fef3c7; border-radius: 10px; padding: 16px; color: #92400e; font-size: 13px; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 Password Reset</h1></div>
        <div class="body">
          <p style="color:#475569; font-size:16px;">Hello <strong>${name}</strong>,</p>
          <p style="color:#475569;">We received a request to reset your password. Click the button below to create a new one:</p>
          <a href="${resetUrl}" class="btn">Reset My Password</a>
          <div class="warning">
            ⚠️ This link expires in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email. Your account is safe.
          </div>
          <p style="color:#94a3b8; font-size:12px; margin-top:16px;">Or copy this link: ${resetUrl}</p>
        </div>
        <div class="footer"><p>Expert Booking Platform — Security</p></div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Password Reset Request — Expert Booking Platform',
    html
  });
};

/**
 * Welcome Email (on Registration)
 */
const sendWelcomeEmail = async (email, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #a855f7); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; text-align: center; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🚀 Welcome to the Marketplace!</h1></div>
        <div class="body">
          <p style="color:#475569; font-size:16px;">Hello <strong>${name}</strong>,</p>
          <p style="color:#475569;">Your professional account has been successfully created. You can now browse top-rated experts or manage your sessions through the dashboard.</p>
          <p style="color:#475569;">Explore the platform to find your first session!</p>
        </div>
        <div class="footer"><p>Expert Booking Platform — Multi-Industry Marketplace</p></div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🚀 Welcome to Expert Booking Platform!',
    html
  });
};

/**
 * Booking Status Update Email (Confirmed/Completed)
 */
const sendStatusUpdateEmail = async (booking, expertName, status) => {
  const statusColors = {
    'Confirmed': '#16a34a',
    'Completed': '#0284c7',
    'Cancelled': '#ef4444'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: ${statusColors[status] || '#6366f1'}; padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .body { padding: 40px; }
        .booking-card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .badge { background: ${statusColors[status]}22; color: ${statusColors[status]}; padding: 4px 12px; border-radius: 100px; font-weight: 700; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>📅 Booking ${status}!</h1></div>
        <div class="body">
          <p style="color:#475569;">Hello <strong>${booking.customerName}</strong>,</p>
          <p style="color:#475569;">Your booking with <strong>${expertName}</strong> has been updated to: <span class="badge">${status}</span></p>
          <div class="booking-card">
            <p><strong>Service:</strong> ${booking.serviceTitle}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.startTime}</p>
          </div>
          <p style="color:#475569; font-size:14px;">Log in to your dashboard to view full details.</p>
        </div>
        <div class="footer"><p>Expert Booking Platform — Transactional Update</p></div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: booking.customerEmail,
    subject: `📅 Booking ${status} — ${booking.serviceTitle}`,
    html
  });
};

/**
 * Company Welcome Email
 */
const sendCompanyWelcomeEmail = async (email, companyName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Expert Booking Platform</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feature { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Expert Booking Platform!</h1>
          <p>Your company "${companyName}" is ready to grow</p>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Congratulations on setting up your company on Expert Booking Platform. You're now ready to manage your entire service business in one place.</p>
          
          <div class="feature">
            <h3>What's Next?</h3>
            <ul>
              <li>Add your team members</li>
              <li>Create your services</li>
              <li>Set your availability</li>
              <li>Start accepting bookings</li>
            </ul>
          </div>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/company/dashboard" class="btn">Go to Dashboard</a>
          
          <p>Need help? Check out our documentation or contact support.</p>
        </div>
        <div class="footer">
          <p>Expert Booking Platform - Empowering Service Businesses</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Welcome to Expert Booking Platform - ${companyName}`,
    html
  });
};

/**
 * Payment Confirmation Email
 */
const sendPaymentConfirmationEmail = async (booking) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .booking-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .price { font-size: 24px; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Successful!</h1>
          <p>Your booking has been confirmed</p>
        </div>
        <div class="content">
          <p>Hi ${booking.customerName},</p>
          <p>Great news! Your payment has been successfully processed and your booking is now confirmed.</p>
          
          <div class="booking-card">
            <p><strong>Service:</strong> ${booking.serviceTitle}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Amount Paid:</strong> <span class="price">$${booking.totalAmount}</span></p>
          </div>
          
          <p>You'll receive a separate email with meeting details and instructions.</p>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/bookings" class="btn">View My Bookings</a>
        </div>
        <div class="footer">
          <p>Expert Booking Platform - Secure Payments</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: booking.customerEmail,
    subject: `Payment Confirmed - ${booking.serviceTitle}`,
    html
  });
};

/**
 * Notification Email
 */
const sendNotificationEmail = async (notification) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${notification.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .notification-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .priority-high { border-left-color: #ef4444; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${notification.title}</h1>
          <p>${notification.category.charAt(0).toUpperCase() + notification.category.slice(1)} Update</p>
        </div>
        <div class="content">
          <p>${notification.message}</p>
          
          <div class="notification-card priority-${notification.priority}">
            <p><strong>Type:</strong> ${notification.type.replace(/_/g, ' ')}</p>
            <p><strong>Priority:</strong> ${notification.priority}</p>
            <p><strong>Time:</strong> ${notification.createdAt.toLocaleString()}</p>
          </div>
          
          ${notification.actionUrl ? `<a href="${process.env.CLIENT_URL || 'http://localhost:3000'}${notification.actionUrl}" class="btn">${notification.actionText || 'View Details'}</a>` : ''}
          
          <p>You can manage your notification preferences in your dashboard settings.</p>
        </div>
        <div class="footer">
          <p>Expert Booking Platform - Notifications</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Get user email (this would need to be populated)
  const User = require('../models/User');
  const user = await User.findById(notification.userId);
  
  if (user) {
    await sendEmail({
      to: user.email,
      subject: `${notification.title} - Expert Booking Platform`,
      html
    });
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendExpertNotification,
  sendCancellationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendStatusUpdateEmail,
  sendCompanyWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendNotificationEmail
};
