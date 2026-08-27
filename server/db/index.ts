import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import { initializeDatabaseSchema } from "./init";
import path from "path";
import fsSync from "fs";
import { env } from "../config/env";

export type AppDatabase = any; // Simplify typing to avoid mismatch between PgLite and NodePg

declare global {
  var _dbInstance: AppDatabase | undefined;
  var _dbInitPromise: Promise<void> | undefined;
}

export function getDatabase(): AppDatabase {
  if (!global._dbInstance) {
    const isProd = process.env.NODE_ENV === "production";
    
    // Check if Cloud SQL Unix socket path exists
    const cloudSqlDir = "/app/cloudsql/mafqudati-d3b18:europe-west3:ai-studio-57f3ad0a";
    const hasCloudSqlSocket = fsSync.existsSync(cloudSqlDir);

    const host = env.SQL_HOST || process.env.PGHOST || (hasCloudSqlSocket ? cloudSqlDir : undefined);
    const user = env.SQL_USER || process.env.PGUSER;
    const password = env.SQL_PASSWORD || process.env.PGPASSWORD;
    const database = env.SQL_DB_NAME || process.env.PGDATABASE;

    if (isProd && !env.DATABASE_URL && !host && !user) {
      console.error("CRITICAL ERROR: Production DATABASE_URL is required.");
      process.exit(1);
    }

    if (env.DATABASE_URL || host || user || database) {
      // Use PostgreSQL / Neon / Cloud SQL
      const pool = new pg.Pool({
        host,
        user,
        password,
        database,
        connectionString: env.DATABASE_URL,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: env.DATABASE_URL && (env.DATABASE_URL.includes("sslmode=require") || env.DATABASE_URL.includes("neon.tech") || env.DATABASE_URL.includes("render.com"))
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Simple mock for init function that expects query method
      const clientMock = {
        query: async (text: string, params?: any[]) => pool.query(text, params),
      };

      global._dbInitPromise = initializeDatabaseSchema(clientMock as any).catch((err) => {
        console.warn("Database initialization notice (PostgreSQL):", err.message || err);
      });

      global._dbInstance = drizzlePg(pool, { schema });
    } else {
      // Use Local PGlite (Development only)
      const dataDir = path.join(process.cwd(), ".data", "pglite");
      try {
        if (!fsSync.existsSync(dataDir)) {
          fsSync.mkdirSync(dataDir, { recursive: true });
        }
      } catch (e) { /* ignore */ }

      const client = new PGlite(dataDir);
      
      global._dbInitPromise = client.waitReady.then(() => initializeDatabaseSchema(client)).catch((err) => {
        console.warn("Database initialization notice (PGlite):", err.message || err);
      });
      
      global._dbInstance = drizzlePglite(client, { schema });
    }
  }
  return global._dbInstance;
}

export const db = getDatabase();

export async function waitForDatabase() {
  if (global._dbInitPromise) {
    await global._dbInitPromise;
  }
}