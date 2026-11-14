import { Router } from 'express';
import { generateStudyController, healthCheckHandler } from '../controllers/studyController.ts';
import { createGenerationRateLimiter } from '../middleware/security.ts';

export const studyRouter = Router();

const generationRateLimiter = createGenerationRateLimiter();

studyRouter.get('/health', healthCheckHandler);
studyRouter.post('/study/generate', generationRateLimiter, generateStudyController);
