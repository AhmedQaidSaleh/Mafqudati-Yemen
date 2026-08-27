const fs = require('fs');

function fix(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('GoogleMapView.tsx')) {
    content = content.replace(/<Marker \{\.\.\.markerAttrs\}[\s\S]*?\/>/g, 
      '<Marker\n                  key={report.id}\n                  position={coords}\n                  title={report.title}\n                  onClick={() => setSelectedReport(report)}\n                  icon={isLost ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"}\n                />');
  } else if (file.includes('ReportsMap.tsx')) {
    content = content.replace(/<Marker \{\.\.\.markerAttrs\}[\s\S]*?\/>/g, 
      '<Marker\n              key={report.id}\n              position={coords}\n              title={report.title}\n              onClick={() => setSelectedReport(report)}\n              icon={isSelected ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" : isLost ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"}\n            />');
  }
  
  fs.writeFileSync(file, content);
}

fix('src/components/map/GoogleMapView.tsx');
fix('src/components/map/ReportsMap.tsx');
console.log("Done");
