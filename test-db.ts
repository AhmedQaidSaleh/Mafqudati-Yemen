import pg from 'pg';
import { env } from './server/config/env';

async function test() {
  if (!env.DATABASE_URL) {
    console.log("DATABASE CONNECTION: FAIL (No DATABASE_URL)");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT NOW()');
    if (res.rows.length > 0) {
      console.log("DATABASE CONNECTION: PASS");
    } else {
      console.log("DATABASE CONNECTION: FAIL");
    }
  } catch (error) {
    console.error(error);
    console.log("DATABASE CONNECTION: FAIL");
  } finally {
    await pool.end();
  }
}
test();
