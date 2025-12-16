import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: {
    error: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: {
    error: 'Too many verification email requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

