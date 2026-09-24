const Joi = require('joi');

// Common validation patterns
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');
const email = Joi.string().email().required();
const password = Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
  'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
});
const phone = Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional();

// User validation schemas
exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email,
  password,
  role: Joi.string().valid('user', 'expert', 'company_owner').default('user'),
  phone,
  category: Joi.string().when('role', {
    is: 'expert',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  companyName: Joi.string().when('role', {
    is: 'company_owner',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

exports.loginSchema = Joi.object({
  email,
  password: Joi.string().required()
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  phone,
  avatar: Joi.string().uri().optional()
});

// Company validation schemas
exports.createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  industry: Joi.string().valid(
    'Technology', 'Healthcare', 'Consulting', 'Education', 'Finance',
    'Legal', 'Creative', 'Wellness', 'Professional Services', 'Other'
  ).required(),
  description: Joi.string().min(50).max(2000).required(),
  website: Joi.string().uri().optional(),
  timezone: Joi.string().required(),
  workingHours: Joi.object({
    monday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false)
    }),
    tuesday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false)
    }),
    wednesday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false)
    }),
    thursday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false)
    }),
    friday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false)
    }),
    saturday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(true)
    }),
    sunday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(true)
    })
  }).required(),
  cancellationPolicy: Joi.string().max(1000).optional(),
  refundPolicy: Joi.string().max(1000).optional()
});

// Service validation schemas
exports.createServiceSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(2000).required(),
  category: Joi.string().valid(
    'Consulting', 'Healthcare', 'Education', 'Legal', 'Financial',
    'Technology', 'Creative', 'Wellness', 'Professional Services', 'Other'
  ).required(),
  duration: Joi.number().min(15).max(480).required(),
  price: Joi.number().min(0).required(),
  meetingType: Joi.string().valid('video', 'chat', 'in-person').default('video'),
  maxParticipants: Joi.number().min(1).max(50).default(1),
  location: Joi.string().when('meetingType', {
    is: 'in-person',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  requirements: Joi.array().items(Joi.string()).optional(),
  whatToBring: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  bookingSettings: Joi.object({
    advanceBookingDays: Joi.number().min(1).max(365).default(30),
    cancellationDeadline: Joi.number().min(0).default(24),
    rescheduleLimit: Joi.number().min(0).default(3),
    autoConfirm: Joi.boolean().default(true),
    requirePayment: Joi.boolean().default(false),
    depositAmount: Joi.number().min(0).default(0)
  }).optional()
});

// Booking validation schemas
exports.createBookingSchema = Joi.object({
  serviceId: objectId.required(),
  assignedStaffId: objectId.optional(),
  date: Joi.date().min('now').required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  customerName: Joi.string().min(2).max(50).required(),
  customerEmail: email,
  customerPhone: phone.required(),
  notes: Joi.string().max(500).optional(),
  requirements: Joi.array().items(Joi.string()).optional()
});

exports.rescheduleBookingSchema = Joi.object({
  newDate: Joi.date().min('now').required(),
  newStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  newEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  reason: Joi.string().max(500).optional()
});

// Review validation schemas
exports.createReviewSchema = Joi.object({
  bookingId: objectId.required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().min(10).max(500).required()
});

// Testimonial validation schemas
exports.createTestimonialSchema = Joi.object({
  companyId: objectId.required(),
  bookingId: objectId.required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(5).max(100).required(),
  content: Joi.string().min(20).max(1000).required()
});

// Payment validation schemas
exports.createPaymentIntentSchema = Joi.object({
  bookingId: objectId.required(),
  amount: Joi.number().min(0.5).required(),
  currency: Joi.string().valid('usd', 'eur', 'gbp').default('usd')
});

// Notification validation schemas
exports.updateNotificationPreferencesSchema = Joi.object({
  inApp: Joi.object({
    booking: Joi.boolean(),
    payment: Joi.boolean(),
    message: Joi.boolean(),
    staff: Joi.boolean(),
    service: Joi.boolean(),
    subscription: Joi.boolean(),
    system: Joi.boolean()
  }).optional(),
  email: Joi.object({
    booking: Joi.boolean(),
    payment: Joi.boolean(),
    message: Joi.boolean(),
    staff: Joi.boolean(),
    service: Joi.boolean(),
    subscription: Joi.boolean(),
    system: Joi.boolean()
  }).optional(),
  push: Joi.object({
    booking: Joi.boolean(),
    payment: Joi.boolean(),
    message: Joi.boolean(),
    staff: Joi.boolean(),
    service: Joi.boolean(),
    subscription: Joi.boolean(),
    system: Joi.boolean()
  }).optional()
});

// Query parameter validation schemas
exports.paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20)
});

exports.dateRangeSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional()
});

// Validation middleware factory
exports.validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req[property] = value;
    next();
  };
};
