import { env } from "./config/env";
import { createApp } from "./app";
import { waitForDatabase } from "./db";
import path from "path";
import fs from "fs";
import express from "express";

function logMemory(step: string) {
  const m = process.memoryUsage();
  console.log(
    `[MEMORY] ${step}: RSS=${(m.rss / 1024 / 1024).toFixed(2)}MB, HeapTotal=${(m.heapTotal / 1024 / 1024).toFixed(2)}MB, HeapUsed=${(m.heapUsed / 1024 / 1024).toFixed(2)}MB`
  );
}

logMemory("0. Startup Begin");

async function startServer() {
  logMemory("1. Creating Express App");
  const app = createApp();
  logMemory("2. Express App & Routes Created");

  const PORT = Number(process.env.PORT) || 3000;

  const distClientPath = path.join(process.cwd(), "dist/client");
  const distServerPath = path.join(process.cwd(), "dist/server/server.js");
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(distClientPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        const module = await vite.ssrLoadModule("/src/server.ts");
        const handler = module.default || module;

        const protocol = req.protocol;
        const host = req.get("host") || `localhost:${PORT}`;
        const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
            headers.append(key, Array.isArray(value) ? value.join(",") : (value as string));
          }
        }

        const fetchRequest = new Request(url.toString(), {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : req.body
              ? JSON.stringify(req.body)
              : undefined,
        });

        const fetchResponse = await handler.fetch(fetchRequest, process.env, {});
        res.status(fetchResponse.status);
        fetchResponse.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });

        if (fetchResponse.body) {
          const reader = fetchResponse.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } else {
          res.end();
        }
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        console.error("SSR Error:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  } else {
    app.use(express.static(distClientPath));

    // Lazy load SSR handler only upon first non-API web request to conserve startup memory
    let ssrHandler: any = null;

    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        if (!ssrHandler) {
          logMemory("SSR First Request Load (Before Import)");
          const module = await import(distServerPath);
          ssrHandler = module.default || module;
          logMemory("SSR First Request Load (After Import)");
        }

        const protocol = req.protocol;
        const host = req.get("host") || `localhost:${PORT}`;
        const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
            headers.append(key, Array.isArray(value) ? value.join(",") : (value as string));
          }
        }

        const fetchRequest = new Request(url.toString(), {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : req.body
              ? JSON.stringify(req.body)
              : undefined,
        });

        const fetchResponse = await ssrHandler.fetch(fetchRequest, process.env, {});
        res.status(fetchResponse.status);
        fetchResponse.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });

        if (fetchResponse.body) {
          const reader = fetchResponse.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } else {
          res.end();
        }
      } catch (err) {
        console.error("SSR Error:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  // Bind to PORT immediately so Render health check passes instantly
  app.listen(PORT, "0.0.0.0", () => {
    logMemory(`3. Server Listening on 0.0.0.0:${PORT}`);
    console.log(`Backend Foundation Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);

    // Complete database background sync after port is open
    waitForDatabase()
      .then(() => {
        logMemory("4. Database Background Init Finished");
      })
      .catch((err) => {
        console.error("Database background initialization notice:", err.message || err);
      });
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

