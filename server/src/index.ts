import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type Express } from "express";
import { widgetsDevServer } from "skybridge/server";
import type { ViteDevServer } from "vite";
import { request } from "undici";
import { mcp } from "./middleware.js";
import server from "./server.js";

const app = express() as Express & { vite: ViteDevServer };

// Debug middleware to log all requests
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configure body parsers first
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Dust API proxy for multipart file uploads
console.log('[STARTUP] Registering POST /_proxy/dust-upload');
app.post('/_proxy/dust-upload', upload.single('file'), async (req, res) => {
  console.log('[ROUTE HIT] POST /api/dust-upload');
  try {
    const { url } = req.body;
    if (!url || !req.file) return res.status(400).json({ error: 'Missing url or file' });

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { statusCode, body } = await request(url, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData
    });

    const responseText = await body.text();
    if (statusCode !== 200) return res.status(statusCode).json({ error: responseText });

    res.json(JSON.parse(responseText));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Dust API proxy for JSON and text requests
console.log('[STARTUP] Registering POST /_proxy/dust-proxy');
app.post('/_proxy/dust-proxy', async (req, res) => {
  console.log('[ROUTE HIT] POST /api/dust-proxy');
  try {
    const { url, body, method = 'POST', returnText = false } = req.body;

    const headers: Record<string, string> = {
      'accept': returnText ? 'text/plain' : 'application/json',
      'authorization': `Bearer ${process.env.API_KEY}`,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' && body) {
      headers['content-type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (returnText) {
      const text = await response.text();
      if (!response.ok) return res.status(response.status).send(text);
      res.send(text);
    } else {
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      res.json(data);
    }
  } catch (error) {
    console.error('Dust API error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Dust API streaming endpoint for SSE events
console.log('[STARTUP] Registering OPTIONS /_proxy/dust-stream');
app.options('/_proxy/dust-stream', cors());
console.log('[STARTUP] Registering POST /_proxy/dust-stream');
app.post('/_proxy/dust-stream', cors(), async (req, res) => {
  console.log('[ROUTE HIT] POST /api/dust-stream');
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'text/event-stream',
        'authorization': `Bearer ${process.env.API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe stream to client
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
      } finally {
        res.end();
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: String(error) });
    } else {
      res.end();
    }
  }
});

// Mount MCP middleware at root (it handles /mcp internally)
console.log('[STARTUP] Mounting MCP middleware');
app.use(mcp(server));

const env = process.env.NODE_ENV || "development";

if (env !== "production") {
  const { devtoolsStaticServer } = await import("@skybridge/devtools");
  app.use(await devtoolsStaticServer());
  app.use(await widgetsDevServer());
}

if (env === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use("/assets", cors());
  app.use("/assets", express.static(path.join(__dirname, "assets"), {
    setHeaders: (res, filePath) => {
      console.log('Serving file:', filePath);
      if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
  }));
}

app.listen(3000, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("Server shutdown complete");
  process.exit(0);
});
