#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const routesFile = path.join(__dirname, '../routes.txt');
const testDir = path.join(__dirname, '../bruno/test_ci');

// Read routes from routes.txt
const routes = fs
  .readFileSync(routesFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim());

// Get all .bru files recursively from bruno/test_ci
function getAllBruFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.bru')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

const bruFiles = getAllBruFiles(testDir);

// Extract route from Bruno file's meta name field and URL
function extractRouteFromBruFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Match the name field more carefully to handle placeholders with braces
    const nameMatch = content.match(/name:\s*([^\n]+)/);
    const urlMatch = content.match(/url:\s*([^\n]+)/);
    
    if (nameMatch && urlMatch) {
      const metaRoute = nameMatch[1].trim();
      const url = urlMatch[1].trim();
      
      return normalizeRoute(metaRoute, url);
    }
  } catch (err) {
    console.log(err);
    // Silently skip files that can't be read
  }
  return null;
}

// Normalize route by replacing placeholders with actual values from URL
function normalizeRoute(metaRoute, url) {
  // Extract method and path from meta route
  const metaParts = metaRoute.split(' ');
  const method = metaParts[0];
  let metaPath = metaParts.slice(1).join(' ');
  
  // Extract path from URL (remove protocol, domain, and environment variables)
  // Example: {{URL}}/tmdb/550 -> /tmdb/550
  const urlPath = url.replace(/^[^\/]*\/\/[^\/]*/, '').replace(/{{[^}]+}}/g, '').split('?')[0]; // NOSONAR
  
  // Build normalized route by replacing placeholders in metaPath with actual values
  let urlParts = urlPath.split('/').filter(p => p); //NOSONAR
  let metaParts_arr = metaPath.split('/').filter(p => p); //NOSONAR
  
  // Check if number of segments match (URL shouldn't have extra segments)
  if (urlParts.length !== metaParts_arr.length) {
    // URL has different number of segments than route - invalid match
    return null;
  }
  
  // Keep the meta route structure with placeholders intact
  const normalizedPath = '/' + metaParts_arr.join('/');
  return `${method} ${normalizedPath}`;
}

// Build a map of routes found in Bruno files
const bruRoutes = new Map();
bruFiles.forEach(file => {
  const route = extractRouteFromBruFile(file);
  if (route) {
    bruRoutes.set(route, path.relative(testDir, file));
  }
});

// Check if a route has a corresponding test
function findTestForRoute(route) {
  // Try exact match
  if (bruRoutes.has(route)) {
    return bruRoutes.get(route);
  }
  
  return null;
}

// Results
const results = {
  found: [],
  missing: []
};

routes.forEach(route => {
  const test = findTestForRoute(route);
  if (test) {
    results.found.push({ route, test: path.relative(testDir, test) });
  } else {
    results.missing.push(route);
  }
});

// Output results
console.log('\n📋 Route Test Coverage Report\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log(`\n✅ Routes with tests (${results.found.length}):`);
results.found.forEach(({ route, test }) => {
  console.log(`   ${route}`);
  console.log(`      → ${test}`);
});

if (results.missing.length > 0) {
  console.log(`\n❌ Routes missing tests (${results.missing.length}):`);
  results.missing.forEach(route => {
    console.log(`   ${route}`);
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\nTotal routes: ${routes.length}`);
console.log(`Coverage: ${((results.found.length / routes.length) * 100).toFixed(1)}%\n`);

// Exit with error code if there are missing tests
process.exit(results.missing.length > 0 ? 1 : 0);
