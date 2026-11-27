import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  evaluateAnswerService,
  evaluateFollowUpService,
  formatApiError,
  generateQuestionsService,
  generateReportService,
} from './server/vivaService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/viva/generate-questions', async (req: Request, res: Response) => {
    try {
      const data = await generateQuestionsService(req.body ?? {});
      return res.json(data);
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/viva/evaluate-answer', async (req: Request, res: Response) => {
    try {
      const data = await evaluateAnswerService(req.body ?? {});
      return res.json(data);
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/viva/evaluate-followup', async (req: Request, res: Response) => {
    try {
      const data = await evaluateFollowUpService(req.body ?? {});
      return res.json(data);
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/viva/generate-report', async (req: Request, res: Response) => {
    try {
      const data = await generateReportService(req.body ?? {});
      return res.json(data);
    } catch (err) {
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Ensure unknown API routes always return JSON instead of falling through to SPA HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VivaBuddy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
