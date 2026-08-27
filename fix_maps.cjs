const fs = require('fs');

function processFile(file, isPicker = false) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix the syntax error from the previous script
  content = content.replace(/<Marker\${markerAttrs}/g, '<Marker {...markerAttrs} ');
  content = content.replace(/<Marker\$\{markerAttrs\}/g, '<Marker '); // fallback if it was literal
  
  fs.writeFileSync(file, content);
}

processFile('src/components/map/GoogleMapView.tsx', false);
processFile('src/components/map/ReportsMap.tsx', false);
processFile('src/components/map/GoogleLocationPicker.tsx', true);

console.log("Done");
