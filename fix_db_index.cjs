const fs = require('fs');
let code = fs.readFileSync('server/db/index.ts', 'utf8');

const target = `    if (env.DATABASE_URL || (env.SQL_HOST && env.SQL_DB_NAME)) {`;
const replacement = `    const isProd = process.env.NODE_ENV === "production";
    
    if (isProd && !env.DATABASE_URL && !(env.SQL_HOST && env.SQL_DB_NAME)) {
      console.error("CRITICAL ERROR: Production DATABASE_URL is required.");
      process.exit(1); // FAIL FAST
    }

    if (env.DATABASE_URL || (env.SQL_HOST && env.SQL_DB_NAME)) {`;

code = code.replace(target, replacement);
fs.writeFileSync('server/db/index.ts', code);
