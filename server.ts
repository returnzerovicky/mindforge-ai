import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './server/config/env.ts';
import { errorHandlerMiddleware, notFoundApiHandler } from './server/middleware/errorHandler.ts';
import { corsMiddleware, helmetMiddleware } from './server/middleware/security.ts';
import { studyRouter } from './server/routes/studyRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', studyRouter);
  app.use('/api', notFoundApiHandler);

  if (env.isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use(errorHandlerMiddleware);

  return app;
}

createApp()
  .then((app) => {
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`MindForge AI server running on http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start MindForge AI server:', err);
    process.exit(1);
  });
