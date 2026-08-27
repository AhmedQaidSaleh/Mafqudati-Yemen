const fs = require('fs');
let code = fs.readFileSync('server/app.ts', 'utf8');

const importTarget = `import helmet from "helmet";`;
const importReplacement = `import helmet from "helmet";\nimport rateLimit from "express-rate-limit";`;

const appUseTarget = `  // app.use(helmet()); // Disabled for AI Studio iframe embedding
  app.use(cors());
  app.use(express.json());`;

const appUseReplacement = `  // app.use(helmet()); // Disabled for AI Studio iframe embedding
  app.use(cors());
  app.use(express.json());

  // Global rate limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });
  app.use("/api", limiter);
  
  // Stricter rate limiter for AI
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 AI requests per hour
    message: { error: "Too many AI requests from this IP, please try again after an hour" }
  });
  app.use("/api/ai", aiLimiter);`;

code = code.replace(importTarget, importReplacement);
code = code.replace(appUseTarget, appUseReplacement);
fs.writeFileSync('server/app.ts', code);
