import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
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
    if (env.DATABASE_URL || (env.SQL_HOST && env.SQL_DB_NAME)) {
      // Use Cloud SQL (PostgreSQL)
      const pool = new pg.Pool({
        host: env.SQL_HOST,
        user: env.SQL_USER,
        password: env.SQL_PASSWORD,
        database: env.SQL_DB_NAME,
        connectionString: env.DATABASE_URL,
      });

      // Simple mock for init function that expects query method
      const clientMock = {
        query: async (text: string, params?: any[]) => pool.query(text, params),
      };

      global._dbInitPromise = initializeDatabaseSchema(clientMock as any).catch((err) => {
        console.error("Failed to initialize Cloud SQL database:", err);
      });

      global._dbInstance = drizzlePg(pool, { schema });
    } else {
      // Use Local PGlite
      const dataDir = path.join(process.cwd(), ".data", "pglite");
      try {
        if (!fsSync.existsSync(dataDir)) {
          fsSync.mkdirSync(dataDir, { recursive: true });
        }
      } catch {}

      const client = new PGlite(dataDir);
      
      global._dbInitPromise = client.waitReady.then(() => initializeDatabaseSchema(client)).catch((err) => {
        console.error("Failed to initialize PGlite database:", err);
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