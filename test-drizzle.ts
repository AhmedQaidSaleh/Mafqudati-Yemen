import { db, waitForDatabase } from './server/db';
import { users } from './server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from './server/config/env';

async function testDrizzle() {
  console.log("Checking Neon DB connection with Drizzle...");
  
  if (!env.DATABASE_URL) {
    console.log("DRIZZLE: FAIL (No DATABASE_URL)");
    process.exit(1);
  }

  try {
    // 1. Wait for Init / schema to apply
    await waitForDatabase();
    
    // 2. INSERT
    const testUid = "test_neon_" + Date.now();
    const [inserted] = await db.insert(users).values({
      firebase_uid: testUid,
      email: "test_neon@mafqudati.local",
      full_name: "Neon Test User",
    }).returning();
    console.log("INSERT: PASS", inserted.id);
    
    // 3. SELECT
    const selected = await db.select().from(users).where(eq(users.id, inserted.id));
    if (selected.length > 0 && selected[0].id === inserted.id) {
      console.log("SELECT: PASS");
    } else {
      console.log("SELECT: FAIL");
    }

    // 4. UPDATE
    const [updated] = await db.update(users).set({ full_name: "Updated Neon Test" }).where(eq(users.id, inserted.id)).returning();
    if (updated.full_name === "Updated Neon Test") {
       console.log("UPDATE: PASS");
    } else {
       console.log("UPDATE: FAIL");
    }

    // 5. DELETE
    await db.delete(users).where(eq(users.id, inserted.id));
    const finalSelect = await db.select().from(users).where(eq(users.id, inserted.id));
    if (finalSelect.length === 0) {
       console.log("DELETE: PASS");
    } else {
       console.log("DELETE: FAIL");
    }

  } catch (err) {
    console.error("DRIZZLE TEST ERROR:", err);
  } finally {
    process.exit(0);
  }
}
testDrizzle();
