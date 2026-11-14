import cors from 'cors';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';

export const helmetMiddleware = helmet({
contentSecurityPolicy: env.isProduction
? {
directives: {
defaultSrc: ["'self'"],
scriptSrc: ["'self'"],
styleSrc: [
"'self'",
"'unsafe-inline'",
'https://fonts.googleapis.com',
],
fontSrc: ["'self'", 'https://fonts.gstatic.com'],
imgSrc: ["'self'", 'data:'],
connectSrc: ["'self'"],
},
}
: false,
crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
origin: (origin, callback) => {
if (!origin) {
callback(null, true);
return;
}

if (!env.corsOrigin) {
  if (env.isProduction) {
    callback(new Error('CORS_ORIGIN must be configured in production.'));
    return;
  }

  callback(null, true);
  return;
}

if (env.corsOrigin === '*') {
  if (env.isProduction) {
    callback(new Error('Wildcard CORS is not allowed in production.'));
    return;
  }

  callback(null, true);
  return;
}

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

if (allowedOrigins.includes(origin)) {
  callback(null, true);
  return;
}

callback(new Error('Origin not allowed by CORS policy.'));

},
methods: ['GET', 'POST', 'OPTIONS'],
allowedHeaders: ['Content-Type'],
});

interface RateLimitEntry {
timestamps: number[];
}

const ipStore = new Map<string, RateLimitEntry>();

/**

* Sliding-window in-memory rate limiter for AI generation endpoints.
  */
  export function createGenerationRateLimiter(
  windowMs = env.rateLimitWindowMs,
  maxRequests = env.rateLimitMax,
  ) {
  return (req: Request, res: Response, next: NextFunction): void => {
  const now = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const entry = ipStore.get(clientIp) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter(
  (ts) => now - ts < windowMs,
  );

  if (entry.timestamps.length >= maxRequests) {
  const oldest = entry.timestamps[0] ?? now;
  const retryAfterSeconds = Math.max(
  1,
  Math.ceil((windowMs - (now - oldest)) / 1000),
  );

  res.setHeader('Retry-After', String(retryAfterSeconds));
  res.status(429).json({
  ok: false,
  error: {
  code: 'RATE_LIMITED',
  message: `Too many study generation requests. Please wait ${retryAfterSeconds} seconds and try again.`,
  retryable: true,
  },
  });
  return;
  }

  entry.timestamps.push(now);
  ipStore.set(clientIp, entry);

  if (ipStore.size > 2000) {
  for (const [key, value] of ipStore.entries()) {
  if (value.timestamps.every((ts) => now - ts >= windowMs)) {
  ipStore.delete(key);
  }
  }
  }

  next();
  };
  }
