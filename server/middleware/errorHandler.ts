import type { NextFunction, Request, Response } from 'express';

export class AppHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(statusCode: number, code: string, message: string, retryable = false) {
    super(message);
    this.name = 'AppHttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = retryable;
  }
}

export function notFoundApiHandler(_req: Request, res: Response): void {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
      retryable: false,
    },
  });
}

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof AppHttpError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        retryable: err.retryable,
      },
    });
    return;
  }

  // Handle malformed JSON request bodies from express.json()
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REQUEST_JSON',
        message: 'Request body contained invalid JSON.',
        retryable: false,
      },
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large'
  ) {
    res.status(413).json({
      ok: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large. Please shorten your study notes.',
        retryable: false,
      },
    });
    return;
  }

  const message =
    err instanceof Error && err.message.includes('CORS')
      ? err.message
      : 'An unexpected server error occurred while processing your request.';

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      retryable: true,
    },
  });
}
