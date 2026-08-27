const fs = require('fs');
const file = 'src/components/map/GoogleMapView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /\(\s*\(typeof process !== "undefined" && process\.env\?\.GOOGLE_MAPS_PLATFORM_KEY\)/,
  '(process.env.GOOGLE_MAPS_PLATFORM_KEY'
);
fs.writeFileSync(file, content);
console.log("Replaced");
