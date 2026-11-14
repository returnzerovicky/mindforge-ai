import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { AppHttpError } from '../middleware/errorHandler.ts';
import { generateStudySetWithGemini } from '../services/geminiStudyService.ts';
import { generateStudyRequestSchema } from '../validators/studyValidators.ts';

export function healthCheckHandler(_req: Request, res: Response): void {
  res.json({
    ok: true,
    data: {
      service: 'mindforge-ai-api',
      geminiConfigured: Boolean(env.geminiApiKey && env.geminiApiKey !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString(),
    },
  });
}

export async function generateStudyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = generateStudyRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    next(
      new AppHttpError(
        400,
        'VALIDATION_ERROR',
        firstIssue?.message ?? 'Invalid study generation parameters.',
        false,
      ),
    );
    return;
  }

  const abortController = new AbortController();

  const onClientDisconnect = () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  };
  res.on('close', onClientDisconnect);

  try {
    const result = await generateStudySetWithGemini(parsed.data, abortController.signal);
    if (res.writableEnded || abortController.signal.aborted) {
      return;
    }

    res.status(200).json({
      ok: true,
      data: {
        ...result.studySet,
        difficulty: parsed.data.difficulty,
        sourceSnippet: parsed.data.content.slice(0, 180),
        model: result.model,
        generatedAt: result.generatedAt,
      },
    });
  } catch (err) {
    if (abortController.signal.aborted) {
      if (!res.writableEnded && !res.destroyed) {
        res.status(499).end();
      }
      return;
    }
    next(err);
  } finally {
    res.off('close', onClientDisconnect);
  }
}
