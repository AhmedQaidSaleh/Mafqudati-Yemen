const fs = require('fs');
let code = fs.readFileSync('server/routes/uploads.routes.ts', 'utf8');

const target = `const upload = multer({ storage: multer.memoryStorage() });`;
const replacement = `const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});`;

code = code.replace(target, replacement);
fs.writeFileSync('server/routes/uploads.routes.ts', code);
