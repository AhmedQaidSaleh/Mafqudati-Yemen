import { PGlite } from "@electric-sql/pglite";
import { YEMEN_GOVERNORATES, YEMEN_DISTRICTS, DEFAULT_CATEGORIES } from "../data/yemen-geo";

interface DatabaseQueryable {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

export async function initializeDatabaseSchema(client: PGlite | DatabaseQueryable) {
  try {
    // 1. Create Enums if not exist
    await client.query(`CREATE TYPE "role" AS ENUM ('USER', 'ADMIN');`).catch(e => { /* ignore */ });

    await client.query(`CREATE TYPE "report_type" AS ENUM ('lost', 'found');`).catch(e => { /* ignore */ });

    await client.query(`CREATE TYPE "report_status" AS ENUM ('active', 'resolved', 'closed');`).catch(e => { /* ignore */ });

    // 2. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "firebase_uid" varchar(128) NOT NULL UNIQUE,
        "email" varchar(255) NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "phone" varchar(50),
        "role" "role" NOT NULL DEFAULT 'USER',
        "avatar_url" text,
        "fcm_token" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" text;
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notes" text;
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "contact_preference" varchar(50) DEFAULT 'in_app';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "slug" varchar(100) NOT NULL UNIQUE,
        "name_ar" varchar(255) NOT NULL,
        "name_en" varchar(255),
        "icon" varchar(100)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "governorates" (
        "id" serial PRIMARY KEY,
        "name_ar" varchar(255) NOT NULL,
        "name_en" varchar(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "districts" (
        "id" serial PRIMARY KEY,
        "governorate_id" integer NOT NULL REFERENCES "governorates"("id"),
        "name_ar" varchar(255) NOT NULL,
        "name_en" varchar(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "type" "report_type" NOT NULL,
        "status" "report_status" NOT NULL DEFAULT 'active',
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "category_id" integer NOT NULL REFERENCES "categories"("id"),
        "governorate_id" integer NOT NULL REFERENCES "governorates"("id"),
        "district_id" integer REFERENCES "districts"("id"),
        "location_text" text,
        "latitude" varchar(50),
        "longitude" varchar(50),
        "incident_date" timestamp,
        "brand" varchar(255),
        "color" varchar(100),
        "keywords" text[],
        "notes" text,
        "contact_preference" varchar(50) DEFAULT 'in_app',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "report_images" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "url" text NOT NULL,
        "public_id" varchar(255) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "saved_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "user_report_idx" ON "saved_reports" ("user_id", "report_id");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "sender_id" uuid NOT NULL REFERENCES "users"("id"),
        "receiver_id" uuid NOT NULL REFERENCES "users"("id"),
        "body" text NOT NULL,
        "read_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" varchar(100) NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "read_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    // 3. Seed Governorates
    for (const gov of YEMEN_GOVERNORATES) {
      await client.query(
        `INSERT INTO "governorates" (id, name_ar, name_en) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [gov.id, gov.name_ar, gov.name_en],
      );
    }

    // 4. Seed Districts
    for (const dist of YEMEN_DISTRICTS) {
      await client.query(
        `INSERT INTO "districts" (id, governorate_id, name_ar, name_en) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [dist.id, dist.governorate_id, dist.name_ar, dist.name_en],
      );
    }

    // 5. Seed Categories
    for (const cat of DEFAULT_CATEGORIES) {
      await client.query(
        `INSERT INTO "categories" (id, slug, name_ar, name_en, icon) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.slug, cat.name_ar, cat.name_en, cat.icon || "Package"],
      );
    }

    console.log("Database schema and Yemen geo seed data initialized successfully.");
  } catch (err) {
    console.error("Database schema init error:", err);
  }
}
