const fs = require('fs');
let code = fs.readFileSync('server/server.ts', 'utf8');

const target = `const port = 3000;`;
const replacement = `const port = Number(process.env.PORT) || 3000;`;

code = code.replace(target, replacement);
fs.writeFileSync('server/server.ts', code);
