import rateLimit from 'express-rate-limit';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

// Strict limiter for uploads (important!)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // only 20 uploads per 15 mins
  message: {
    success: false,
    error: 'Too many uploads. Please slow down.',
  },
});