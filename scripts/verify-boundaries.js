/**
 * Verify El Salvador department boundaries
 * Run with: node scripts/verify-boundaries.js
 */

const data = require('../public/regions.json');

console.log('========================================');
console.log('El Salvador Department Boundary Analysis');
console.log('========================================\n');

console.log(`Total Departments: ${data.features.length}\n`);

console.log('Coordinate Complexity (points per department):');
console.log('------------------------------------------------');

data.features.forEach(f => {
  const points = f.geometry.coordinates[0].length;
  const bar = '█'.repeat(Math.floor(points / 2));
  const name = f.properties.name.padEnd(20);
  const count = points.toString().padStart(2);
  console.log(`${name} : ${count} points ${bar}`);
});

console.log('\n');

// Calculate statistics
const pointCounts = data.features.map(f => f.geometry.coordinates[0].length);
const avgPoints = (pointCounts.reduce((a, b) => a + b, 0) / pointCounts.length).toFixed(1);
const minPoints = Math.min(...pointCounts);
const maxPoints = Math.max(...pointCounts);

console.log('Statistics:');
console.log('------------------------------------------------');
console.log(`Average points per department: ${avgPoints}`);
console.log(`Minimum points: ${minPoints}`);
console.log(`Maximum points: ${maxPoints}`);

console.log('\n');

// Validate bounding box
console.log('Bounding Box Validation:');
console.log('------------------------------------------------');
const allCoords = data.features.flatMap(f => f.geometry.coordinates[0]);
const lons = allCoords.map(c => c[0]);
const lats = allCoords.map(c => c[1]);
const minLon = Math.min(...lons).toFixed(3);
const maxLon = Math.max(...lons).toFixed(3);
const minLat = Math.min(...lats).toFixed(3);
const maxLat = Math.max(...lats).toFixed(3);

console.log(`Longitude range: ${minLon} to ${maxLon}`);
console.log(`Latitude range:  ${minLat} to ${maxLat}`);

// Expected bounds for El Salvador
const expectedLonMin = -90.13;
const expectedLonMax = -87.69;
const expectedLatMin = 13.15;
const expectedLatMax = 14.45;

const lonValid = minLon >= expectedLonMin && maxLon <= expectedLonMax;
const latValid = minLat >= expectedLatMin && maxLat <= expectedLatMax;

console.log(`\nWithin expected bounds: ${lonValid && latValid ? '✅ YES' : '❌ NO'}`);

console.log('\n');

// Check for rectangle detection
console.log('Rectangle Detection:');
console.log('------------------------------------------------');
let rectangleCount = 0;
data.features.forEach(f => {
  const points = f.geometry.coordinates[0].length;
  if (points === 5) {
    console.log(`⚠️  ${f.properties.name} has only 5 points (possible rectangle)`);
    rectangleCount++;
  }
});

if (rectangleCount === 0) {
  console.log('✅ No rectangles detected - all departments have realistic boundaries');
} else {
  console.log(`❌ Found ${rectangleCount} potential rectangles`);
}

console.log('\n========================================');
console.log('Verification complete!');
console.log('========================================');
