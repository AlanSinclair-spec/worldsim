const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/regions.json', 'utf8'));

console.log('Total features:', data.features.length);
console.log('\nDepartments:');
data.features.forEach((f, i) => {
  console.log(`${i+1}. ${f.properties.NAM} (Code: ${f.properties.COD}) - ${f.geometry.type}`);
});
