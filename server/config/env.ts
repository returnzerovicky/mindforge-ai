import dotenv from 'dotenv';

dotenv.config();

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parsePositiveInt(process.env.PORT, 3000),
  geminiApiKey: (process.env.GEMINI_API_KEY ?? '').trim(),
  requestTimeoutMs: parsePositiveInt(process.env.REQUEST_TIMEOUT_MS, 60000),
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: parsePositiveInt(process.env.RATE_LIMIT_MAX, 30),
  corsOrigin: (process.env.CORS_ORIGIN ?? '').trim(),
  appUrl: (process.env.APP_URL ?? '').trim(),
} as const;
