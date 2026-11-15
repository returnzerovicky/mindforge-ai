
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { env } from './server/config/env.ts';
import {
  errorHandlerMiddleware,
  notFoundApiHandler,
} from './server/middleware/errorHandler.ts';
import {
  corsMiddleware,
  helmetMiddleware,
} from './server/middleware/security.ts';
import { studyRouter } from './server/routes/studyRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100kb' }));

  // API routes
  app.use('/api', studyRouter);
  app.use('/api', notFoundApiHandler);

  if (env.isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');

    console.log('Current working directory:', process.cwd());
    console.log('Production directory:', distDir);
    console.log('Index exists:', fs.existsSync(indexPath));

    const assetsDir = path.join(distDir, 'assets');

    console.log(
      'Generated assets:',
      fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir)
        : 'NOT FOUND'
    );

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Frontend build not found: ${indexPath}`);
    }

    // Serve CSS, JS and other static files
    app.use(express.static(distDir, {
      index: false,
      fallthrough: true,
    }));

    // Missing assets should return 404
    app.use('/assets', (_req, res) => {
      res.status(404).json({
        error: 'Frontend asset not found',
      });
    });

    // React SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  // Error handler
  app.use(errorHandlerMiddleware);

  return app;
}

// Start server
createApp()
  .then((app) => {
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`MindForge AI running on port ${env.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start MindForge AI:', err);
    process.exit(1);
  });