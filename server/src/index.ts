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

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Dust API proxy for multipart file uploads
app.post('/api/dust-upload', upload.single('file'), async (req, res) => {
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Dust API proxy for JSON requests
app.post('/api/dust-proxy', async (req, res) => {
  try {
    const { url, body } = req.body;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

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
  app.use("/assets", express.static(path.join(__dirname, "assets")));
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
