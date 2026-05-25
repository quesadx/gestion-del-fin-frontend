import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios, { type Method } from 'axios';

const REMOTE_API = 'https://gestion-del-fin-api-production.up.railway.app/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const proxyRequest = async (
    req: express.Request,
    res: express.Response,
    prefix: string,
  ) => {
    const suffix = req.path.replace(new RegExp(`^${prefix}`), '');
    const querySuffix = req.url.includes('?') ? `?${req.url.split('?')[1]}` : '';
    const contentType = req.headers['content-type'];
    const isMultipart =
      typeof contentType === 'string' && contentType.includes('multipart/form-data');

    const response = await axios({
      method: req.method.toUpperCase() as Method,
      url: `${REMOTE_API}${suffix}${querySuffix}`,
      data: ['GET', 'HEAD'].includes(req.method.toUpperCase()) ? undefined : req.body,
      headers: {
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        ...(typeof contentType === 'string' ? { 'Content-Type': contentType } : {}),
        ...(isMultipart && typeof req.headers['content-length'] === 'string'
          ? { 'Content-Length': req.headers['content-length'] }
          : {}),
      },
      validateStatus: () => true,
      maxBodyLength: Infinity,
    });

    if (response.status === 204) {
      return res.status(204).send();
    }

    if (typeof response.data === 'string') {
      return res.status(response.status).send(response.data);
    }

    return res.status(response.status).json(response.data);
  };

  app.all('/api-remote/*', async (req, res) => {
    try {
      await proxyRequest(req, res, '/api-remote');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: 'Proxy error', detail });
    }
  });

  app.all('/api/*', async (req, res) => {
    try {
      await proxyRequest(req, res, '/api');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: 'Proxy error', detail });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Survivor Server running on http://localhost:${PORT}`);
  });
}

startServer();