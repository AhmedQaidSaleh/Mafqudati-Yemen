
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import metaRoutes from "./routes/meta.routes";
import reportsRoutes from "./routes/reports.routes";
import savedReportsRoutes from "./routes/saved-reports.routes";
import messagesRoutes from "./routes/messages.routes";
import notificationsRoutes from "./routes/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import aiRoutes from "./routes/ai.routes";

import uploadsRoutes from "./routes/uploads.routes";

export function createApp(): Express {
  const app = express();

  // Middleware
  // app.use(helmet()); // Disabled for AI Studio iframe embedding
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: process.env.DATABASE_URL ? "configured" : "missing",
        firebase:
          process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY
            ? "configured"
            : "missing",
        cloudinary: process.env.CLOUDINARY_API_KEY ? "configured" : "missing",
        gemini: process.env.GEMINI_API_KEY ? "configured" : "missing",
      },
    });
  });

  // API Namespaces (Replacing Stubs)
  app.use("/api/auth", authRoutes);
  app.use("/api/meta", metaRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/saved-reports", savedReportsRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/uploads", uploadsRoutes);

  // 404 ONLY for API routes
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({ error: "API Route Not Found" });
  });

  // Error handling for API routes
  app.use("/api", errorHandler);

  return app;
}
