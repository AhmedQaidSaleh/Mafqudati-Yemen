import { env } from "./config/env";
import { createApp } from "./app";
import { waitForDatabase } from "./db";
import path from "path";
import express from "express";

async function startServer() {
  // Wait for PGLite and database schema to initialize before accepting requests
  await waitForDatabase();

  const app = createApp();

  const port = 3000;

  if (process.env.NODE_ENV !== "production") {
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
        const host = req.get("host") || "localhost:3000";
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
    const distPath = path.join(process.cwd(), "dist/client");
    app.use(express.static(distPath));
    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      try {
        const module = await import(path.join(process.cwd(), "dist/server/server.js"));
        const handler = module.default || module;

        // Create full URL
        const protocol = req.protocol;
        const host = req.get("host") || "localhost:3000";
        const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

        // Ensure web Fetch Request format for TanStack Start SSR
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

        // Use fetch method as defined in src/server.ts
        const fetchResponse = await handler.fetch(fetchRequest, process.env, {});

        res.status(fetchResponse.status);
        fetchResponse.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });

        if (fetchResponse.body) {
          // Streaming response back to express
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

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend Foundation Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
