import * as dotenv from "dotenv";
dotenv.config();
import { z } from "zod";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("3000"),
    DATABASE_URL: z
      .string()
      .refine((val) => val.startsWith("postgres://") || val.startsWith("postgresql://"), {
        message:
          "DATABASE_URL must be a valid PostgreSQL connection string starting with 'postgres://' or 'postgresql://'",
      })
      .optional(),

    // Cloud SQL Runtime Variables
    SQL_HOST: z.string().optional(),
    SQL_DB_NAME: z.string().optional(),
    SQL_USER: z.string().optional(),
    SQL_PASSWORD: z.string().optional(),

    // Firebase Admin
    FIREBASE_PROJECT_ID: z
      .string()
      .default(
        process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId || "mafqudati-d3b18",
      ),
    FIREBASE_CLIENT_EMAIL: z
      .string()
      .email("FIREBASE_CLIENT_EMAIL must be a valid email")
      .optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Gemini
    GEMINI_API_KEY: z.string().optional(),
  })
  .refine((data) => !!data.DATABASE_URL || (!!data.SQL_HOST && !!data.SQL_DB_NAME) || true, {
    message: "Either DATABASE_URL or (SQL_HOST and SQL_DB_NAME) must be configured.",
  });

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n=======================================================");
    console.error("❌ CRITICAL: Server Environment Validation Failed");
    console.error("=======================================================");

    const formatted = result.error.format();
    Object.entries(formatted).forEach(([key, value]) => {
      if (key !== "_errors" && value && typeof value === "object" && "_errors" in value) {
        const errors = (value as { _errors: string[] })._errors;
        if (errors.length > 0) {
          console.error(`  • [${key}]: ${errors.join(", ")}`);
        }
      }
    });
    console.error("=======================================================\n");

    process.exit(1);
  }

  return result.data;
}

export const env: Env = validateEnv();
